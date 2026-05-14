'use server'

import { revalidatePath } from 'next/cache'
import { type SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-server'

import { activateHumanHandoff, revertToAiHandoff } from '@/lib/lead-handoff'

import {
    type LeadOperationalStatus,
    normalizeLeadStatus,
} from '@/lib/lead-domain'

export interface LeadDetails {
    id: number
    lead_name?: string
    phone_number?: string
    external_session_id?: string | null
    current_classification: string | null
    current_status: string
    is_human_handoff: boolean
    last_message_at?: string | null
    created_at: string
}

export interface LeadMessage {
    id: number
    lead_id: number
    message_content: string
    sender_type: 'lead' | 'system' | 'automacao' | 'humano' | 'human'
    is_automation?: boolean
    user_feedback?: 'positive' | 'negative' | null
    created_at: string
}

export interface LeadOperationalEvent {
    event_id: string
    event_type: string
    source: string
    occurred_at: string
    payload: Record<string, unknown>
    metadata: Record<string, unknown>
}

export type FetchState<T = unknown> = {
    success: boolean
    message?: string
    data?: T
}

type AppSupabaseClient = SupabaseClient

type LeadAccessResult = {
    lead: {
        id: number
        lead_name: string | null
        phone_number: string | null
        external_session_id: string | null
        current_status: string
        current_classification: string | null
    } | null
    error: string | null
}

type DeleteDependencyResult = {
    success: boolean
    message?: string
}

async function ensureLeadAccess(
    supabase: AppSupabaseClient,
    userId: string,
    leadId: number
): Promise<LeadAccessResult> {
    const { data, error } = await supabase
        .from('leads')
        .select('id, lead_name, phone_number, external_session_id, current_status, current_classification')
        .eq('id', leadId)
        .eq('user_id', userId)
        .single()

    if (error || !data) {
        return { lead: null, error: 'Lead não encontrado ou acesso restrito.' }
    }

    return { lead: data, error: null }
}

async function deleteLeadDependency(
    supabase: AppSupabaseClient,
    table: string,
    leadId: number,
    optional = false
): Promise<DeleteDependencyResult> {
    const { error } = await supabase.from(table).delete().eq('lead_id', leadId)

    if (!error) {
        return { success: true }
    }

    if (optional && (error.code === '42P01' || error.message.toLowerCase().includes('does not exist'))) {
        return { success: true }
    }

    console.error(`Delete dependency error on ${table}:`, error)
    return { success: false, message: `Erro ao limpar registros relacionados em ${table}.` }
}

async function insertIntegrationEvent(
    supabase: AppSupabaseClient,
    leadId: number,
    eventType: string,
    payload: Record<string, unknown>,
    metadata: Record<string, unknown> = {}
) {
    const eventId = crypto.randomUUID()
    const occurredAt = new Date().toISOString()

    const { error } = await supabase.from('integration_events').insert({
        event_id: eventId,
        lead_id: leadId,
        event_type: eventType,
        event_version: 1,
        source: 'app',
        occurred_at: occurredAt,
        payload,
        metadata,
    } as never)

    if (error) {
        throw error
    }

    return { eventId, occurredAt }
}

async function insertStatusChangeEvent(
    supabase: AppSupabaseClient,
    params: {
        leadId: number
        fromStatus: LeadOperationalStatus | null
        toStatus: LeadOperationalStatus
        reasonCode: string
        reasonText: string
        metadata?: Record<string, unknown>
    }
) {
    const integration = await insertIntegrationEvent(
        supabase,
        params.leadId,
        'lead.status_changed',
        {
            from_status: params.fromStatus,
            to_status: params.toStatus,
            reason_code: params.reasonCode,
            reason_text: params.reasonText,
        },
        params.metadata
    )

    const { error } = await supabase.from('lead_status_events').insert({
        lead_id: params.leadId,
        source_event_id: integration.eventId,
        source: 'app',
        from_status: params.fromStatus,
        to_status: params.toStatus,
        reason_code: params.reasonCode,
        reason_text: params.reasonText,
        occurred_at: integration.occurredAt,
    } as never)

    if (error) {
        throw error
    }

    return integration
}

export async function getLeadDetails(leadId: number): Promise<FetchState<LeadDetails>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Não autenticado' }

    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('user_id', user.id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            return { success: false, message: 'Lead não encontrado ou acesso restrito.' }
        }

        console.error('Fetch lead error:', error)
        return { success: false, message: 'Erro ao carregar os dados do lead.' }
    }

    return { success: true, data: data as LeadDetails }
}

export async function getLeadMessages(leadId: number): Promise<FetchState<LeadMessage[]>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Não autenticado' }

    const access = await ensureLeadAccess(supabase, user.id, leadId)
    if (!access.lead) {
        return { success: false, message: access.error || 'Lead não encontrado ou acesso restrito.', data: [] }
    }

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Fetch messages error:', error)
        return { success: false, message: 'Erro ao carregar o histórico de mensagens.', data: [] }
    }

    return { success: true, data: data as LeadMessage[] }
}

export async function sendSimulatedMessage(leadId: number, content: string): Promise<FetchState> {
    if (!content.trim()) {
        return { success: false, message: 'A mensagem não pode estar vazia.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Não autenticado' }

    const access = await ensureLeadAccess(supabase, user.id, leadId)
    if (!access.lead) {
        return { success: false, message: access.error || 'Lead não encontrado ou acesso restrito.' }
    }

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL

    if (webhookUrl) {
        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'app-simulation',
                    lead_id: leadId,
                    external_session_id: access.lead.external_session_id,
                    phone_number: access.lead.phone_number,
                    lead_name: access.lead.lead_name,
                    message_content: content.trim(),
                    content_type: 'text',
                }),
            })
        } catch (err) {
            console.error('n8n simulation trigger failed:', err)
            return { success: false, message: 'Falha ao acionar o fluxo de simulação no n8n.' }
        }

        revalidatePath(`/leads/${leadId}`)
        return { success: true }
    }

    const now = new Date().toISOString()

    const { error: messageError } = await supabase.from('messages').insert({
        lead_id: leadId,
        message_content: content.trim(),
        sender_type: 'lead',
        message_direction: 'inbound',
        content_type: 'text',
        metadata: { source: 'app-simulation' },
        created_at: now,
    })

    if (messageError) {
        console.error('Simulation message insert error:', messageError)
        return { success: false, message: 'Falha ao registrar a mensagem simulada.' }
    }

    await supabase
        .from('leads')
        .update({
            last_message_at: now,
            last_message_preview: content.trim().slice(0, 140),
            updated_at: now,
        })
        .eq('id', leadId)

    revalidatePath(`/leads/${leadId}`)
    return { success: true }
}

export type LeadQualification = {
    id: number
    classification: string
    confidence_reason: string
    user_feedback?: 'positive' | 'negative' | null
}

export async function getLeadQualification(leadId: number): Promise<FetchState<LeadQualification | null>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Não autenticado' }

    const { data, error } = await supabase
        .from('lead_qualifications')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('Fetch qualification error:', error)
        return { success: false, message: 'Erro ao carregar qualificação do lead.' }
    }

    return { success: true, data: data as LeadQualification | null }
}

export type ClassificationEvent = {
    id: number
    lead_id: number
    previous_classification: string
    new_classification: string
    reason: string | null
    created_at: string
}

export async function getClassificationEvents(leadId: number): Promise<FetchState<ClassificationEvent[]>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Não autenticado', data: [] }

    const access = await ensureLeadAccess(supabase, user.id, leadId)
    if (!access.lead) {
        return { success: false, message: access.error || 'Lead não encontrado ou acesso restrito.', data: [] }
    }

    const { data, error } = await supabase
        .from('lead_classification_events')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Fetch classification events error:', error)
        return { success: false, message: 'Erro ao carregar histórico de classificação.', data: [] }
    }

    return { success: true, data: data as ClassificationEvent[] }
}

export async function getOperationalEvents(leadId: number): Promise<FetchState<LeadOperationalEvent[]>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Não autenticado', data: [] }

    const access = await ensureLeadAccess(supabase, user.id, leadId)
    if (!access.lead) {
        return { success: false, message: access.error || 'Lead não encontrado ou acesso restrito.', data: [] }
    }

    const { data, error } = await supabase
        .from('integration_events')
        .select('event_id, event_type, source, occurred_at, payload, metadata')
        .eq('lead_id', leadId)
        .order('occurred_at', { ascending: true })

    if (error) {
        console.error('Fetch operational events error:', error)
        return { success: false, message: 'Erro ao carregar eventos operacionais.', data: [] }
    }

    return { success: true, data: data as LeadOperationalEvent[] }
}

export type HandoffContext = {
    id: number
    lead_id: number
    summary_context: string
    priority?: string
    requested_by?: string
    created_at: string
}

export async function handoffLeadToHuman(leadId: number): Promise<FetchState> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Não autenticado' }

    try {
        const access = await ensureLeadAccess(supabase, user.id, leadId)
        if (!access.lead) {
            return { success: false, message: access.error || 'Lead não encontrado.' }
        }

        const currentStatus = normalizeLeadStatus(access.lead.current_status)
        if (currentStatus === 'aguardando_humano' || currentStatus === 'em_atendimento_humano') {
            return { success: false, message: 'Este lead já está no fluxo humano.' }
        }

        const [qualRes, messagesRes] = await Promise.all([
            supabase
                .from('lead_qualifications')
                .select('classification, confidence_reason')
                .eq('lead_id', leadId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single(),
            supabase
                .from('messages')
                .select('message_content, sender_type, created_at')
                .eq('lead_id', leadId)
                .order('created_at', { ascending: true })
        ])

        const qualification = qualRes.data
        const messages = messagesRes.data || []
        const lastLeadMessage = [...messages].reverse().find(m => m.sender_type === 'lead')
        const systemResponse = messages.find(m => m.sender_type === 'automacao' || m.sender_type === 'system')

        const summaryParts: string[] = []
        if (access.lead.current_classification) {
            summaryParts.push(`Temperatura: ${access.lead.current_classification.toUpperCase()}`)
        }
        if (qualification?.confidence_reason) {
            summaryParts.push(`Motivo da classificação: ${qualification.confidence_reason}`)
        }
        if (systemResponse?.message_content) {
            summaryParts.push(`Última resposta automática: ${systemResponse.message_content}`)
        }
        if (lastLeadMessage?.message_content) {
            summaryParts.push(`Última mensagem do lead: ${lastLeadMessage.message_content}`)
        }

        const summaryContext = summaryParts.join('\n---\n') || 'Handoff manual solicitado no app.'

        const handoffEvent = await insertIntegrationEvent(
            supabase,
            leadId,
            'lead.handoff_requested',
            {
                handoff_summary: summaryContext,
                priority: 'normal',
                requested_by: 'manual',
            },
            {
                fallback: true,
                initiated_by_user_id: user.id,
            }
        )

        const { error: handoffError } = await supabase.from('lead_handoffs').insert({
            lead_id: leadId,
            summary_context: summaryContext,
            priority: 'normal',
            requested_by: 'manual',
            source_event_id: handoffEvent.eventId,
            created_at: handoffEvent.occurredAt,
        })

        if (handoffError) {
            console.error('Failed to insert handoff record:', handoffError)
            return { success: false, message: 'Erro ao registrar o handoff manual.' }
        }

        await insertStatusChangeEvent(supabase, {
            leadId,
            fromStatus: currentStatus,
            toStatus: 'aguardando_humano',
            reasonCode: 'manual_fallback_handoff',
            reasonText: 'Handoff manual solicitado via app.',
            metadata: {
                initiated_by_user_id: user.id,
                fallback: true,
            },
        })

        const { error: updateError } = await supabase
            .from('leads')
            .update({
                current_status: 'aguardando_humano',
                last_status_changed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', leadId)

        if (updateError) {
            console.error('Failed to update lead status for handoff:', updateError)
            return { success: false, message: 'Erro ao atualizar status do lead.' }
        }

        revalidatePath(`/leads/${leadId}`)
        return { success: true }
    } catch (err) {
        console.error('handoffLeadToHuman Exception:', err)
        return { success: false, message: 'Erro interno durante o encaminhamento.' }
    }
}

export async function claimLeadForHuman(leadId: number): Promise<FetchState> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Não autenticado' }

    const access = await ensureLeadAccess(supabase, user.id, leadId)
    if (!access.lead) {
        return { success: false, message: access.error || 'Lead não encontrado.' }
    }

    const currentStatus = normalizeLeadStatus(access.lead.current_status)
    if (currentStatus !== 'aguardando_humano') {
        return { success: false, message: 'Este lead não está aguardando atendimento humano.' }
    }

    try {
        await insertStatusChangeEvent(supabase, {
            leadId,
            fromStatus: currentStatus,
            toStatus: 'em_atendimento_humano',
            reasonCode: 'human_claimed',
            reasonText: 'Lead assumido por um atendente humano.',
            metadata: {
                initiated_by_user_id: user.id,
            },
        })

        const { error } = await supabase
            .from('leads')
            .update({
                current_status: 'em_atendimento_humano',
                last_status_changed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', leadId)

        if (error) {
            console.error('claimLeadForHuman update error:', error)
            return { success: false, message: 'Erro ao assumir o atendimento.' }
        }

        revalidatePath(`/leads/${leadId}`)
        return { success: true }
    } catch (err) {
        console.error('claimLeadForHuman exception:', err)
        return { success: false, message: 'Erro interno ao assumir o atendimento.' }
    }
}

export async function closeLeadConversation(leadId: number): Promise<FetchState> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Não autenticado' }

    const access = await ensureLeadAccess(supabase, user.id, leadId)
    if (!access.lead) {
        return { success: false, message: access.error || 'Lead não encontrado.' }
    }

    const currentStatus = normalizeLeadStatus(access.lead.current_status)
    if (currentStatus !== 'em_atendimento_humano') {
        return { success: false, message: 'Só é possível encerrar leads em atendimento humano.' }
    }

    try {
        await insertStatusChangeEvent(supabase, {
            leadId,
            fromStatus: currentStatus,
            toStatus: 'encerrado',
            reasonCode: 'human_closed',
            reasonText: 'Atendimento encerrado manualmente no app.',
            metadata: {
                initiated_by_user_id: user.id,
            },
        })

        const { error } = await supabase
            .from('leads')
            .update({
                current_status: 'encerrado',
                last_status_changed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', leadId)

        if (error) {
            console.error('closeLeadConversation update error:', error)
            return { success: false, message: 'Erro ao encerrar o lead.' }
        }

        revalidatePath(`/leads/${leadId}`)
        return { success: true }
    } catch (err) {
        console.error('closeLeadConversation exception:', err)
        return { success: false, message: 'Erro interno ao encerrar o lead.' }
    }
}

export async function getHandoffContext(leadId: number): Promise<FetchState<HandoffContext | null>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Não autenticado' }

    const access = await ensureLeadAccess(supabase, user.id, leadId)
    if (!access.lead) {
        return { success: false, message: access.error || 'Lead não encontrado ou acesso restrito.' }
    }

    const { data, error } = await supabase
        .from('lead_handoffs')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('Fetch handoff context error:', error)
        return { success: false, message: 'Erro ao carregar contexto do handoff.' }
    }

    return { success: true, data: data as HandoffContext | null }
}

export async function updateLead(leadId: number, fields: { lead_name: string; phone_number: string }): Promise<FetchState> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Não autenticado' }

    const name = fields.lead_name?.trim()
    const phone = fields.phone_number?.trim()

    if (!name || !phone) {
        return { success: false, message: 'Nome e telefone são obrigatórios.' }
    }

    const access = await ensureLeadAccess(supabase, user.id, leadId)
    if (!access.lead) {
        return { success: false, message: access.error || 'Lead não encontrado ou acesso restrito.' }
    }

    const { error: updateError } = await supabase
        .from('leads')
        .update({
            lead_name: name,
            phone_number: phone,
            updated_at: new Date().toISOString()
        })
        .eq('id', leadId)

    if (updateError) {
        console.error('Update lead error:', updateError)
        return { success: false, message: 'Erro ao atualizar dados do lead.' }
    }

    revalidatePath(`/leads/${leadId}`)
    return { success: true }
}

export async function deleteLead(leadId: number): Promise<FetchState> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Não autenticado' }

    const access = await ensureLeadAccess(supabase, user.id, leadId)
    if (!access.lead) {
        return { success: false, message: access.error || 'Lead não encontrado ou acesso restrito.' }
    }

    const dependencyDeletes = await Promise.all([
        deleteLeadDependency(supabase, 'lead_qualifications', leadId),
        deleteLeadDependency(supabase, 'lead_classification_events', leadId),
        deleteLeadDependency(supabase, 'lead_classification_history', leadId, true),
    ])

    const dependencyFailure = dependencyDeletes.find((result) => !result.success)
    if (dependencyFailure) {
        return {
            success: false,
            message: dependencyFailure.message || 'Erro ao limpar dependências do lead antes da exclusão.',
        }
    }

    const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)

    if (deleteError) {
        console.error('Delete lead error:', deleteError)
        return { success: false, message: 'Erro ao excluir o lead. Nenhum dado foi removido.' }
    }

    revalidatePath('/')
    revalidatePath('/leads')
    revalidatePath(`/leads/${leadId}`)
    return { success: true }
}

/**
 * Switches a lead to human attendance mode (is_human_handoff = true).
 * Called from the HandoffToggle component.
 */
export async function activateHandoffToggle(leadId: number): Promise<FetchState> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Não autenticado' }

    const access = await ensureLeadAccess(supabase, user.id, leadId)
    if (!access.lead) {
        return { success: false, message: access.error || 'Lead não encontrado.' }
    }

    const result = await activateHumanHandoff({
        leadId,
        requestedBy: 'operator',
        summaryContext: 'Handoff ativado manualmente no app.',
    })

    if (!result.ok) {
        return { success: false, message: result.error }
    }

    return { success: true }
}

/**
 * Reverts a lead back to AI attendance mode (is_human_handoff = false).
 * Called from the HandoffToggle component.
 */
export async function revertHandoffToggle(leadId: number): Promise<FetchState> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Não autenticado' }

    const access = await ensureLeadAccess(supabase, user.id, leadId)
    if (!access.lead) {
        return { success: false, message: access.error || 'Lead não encontrado.' }
    }

    const result = await revertToAiHandoff({
        leadId,
        revertedBy: 'operator',
    })

    if (!result.ok) {
        return { success: false, message: result.error }
    }

    return { success: true }
}

