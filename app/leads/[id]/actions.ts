'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { reclassifyLeadViaAI, autoRespondToBasicQuestion } from './ai-actions'

// Types
export interface LeadDetails {
    id: number
    lead_name?: string
    phone_number?: string
    current_classification: string
    current_status: string
    created_at: string
}

export interface LeadMessage {
    id: number
    lead_id: number
    message_content: string
    sender_type: 'lead' | 'system' | 'automacao' | 'human'
    is_automation?: boolean
    user_feedback?: 'positive' | 'negative' | null
    created_at: string
}

export type FetchState<T = any> = {
    success: boolean
    message?: string
    data?: T
}

// Internal Helper for Auth Client
async function getAuthClient() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            }
        }
    )

    const cookieStore = await cookies()
    let user = null;

    try {
        const allCookies = cookieStore.getAll()
        const authCookie = allCookies.find(c => c.name.endsWith('-auth-token'))

        if (authCookie) {
            let accessToken = null;
            try {
                const tokens = JSON.parse(authCookie.value);
                if (Array.isArray(tokens) && tokens.length > 0) {
                    accessToken = tokens[0];
                } else if (typeof tokens === 'object' && tokens.access_token) {
                    accessToken = tokens.access_token;
                }
            } catch (e) {
                accessToken = authCookie.value;
            }

            if (accessToken) {
                const { data } = await supabase.auth.getUser(accessToken)
                user = data.user
            }
        }
    } catch (err) {
        console.error("Auth parsing error:", err);
    }

    return { supabase, user }
}

export async function getLeadDetails(leadId: number): Promise<FetchState<LeadDetails>> {
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Não autenticado' }

    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('user_id', user.id) // Ensure lead belongs to user
        .single() // Expecting exactly one

    if (error) {
        if (error.code === 'PGRST116') {
            return { success: false, message: 'Lead não encontrado ou acesso restrito.' }
        }
        console.error("Fetch lead error:", error)
        return { success: false, message: 'Erro ao carregar os dados do lead.' }
    }

    return { success: true, data: data as LeadDetails }
}

export async function getLeadMessages(leadId: number): Promise<FetchState<LeadMessage[]>> {
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Não autenticado' }

    // Double check if the user owns the lead before fetching messages
    // (RLS on messages should ideally handle this, but the user requested explicit filtering / security)
    const { data: leadAccess, error: accessError } = await supabase
        .from('leads')
        .select('id')
        .eq('id', leadId)
        .eq('user_id', user.id)
        .single()

    if (accessError || !leadAccess) {
        return { success: false, message: 'Lead não encontrado ou acesso restrito.', data: [] }
    }

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true }) // Oldest to newest chronological order

    if (error) {
        console.error("Fetch messages error:", error)
        return { success: false, message: 'Erro ao carregar o histórico de mensagens.', data: [] }
    }

    return { success: true, data: data as LeadMessage[] }
}

import { revalidatePath } from 'next/cache'

export async function sendSimulatedMessage(leadId: number, content: string): Promise<FetchState> {
    if (!content.trim()) return { success: false, message: 'Message content cannot be empty' }

    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Não autenticado' }

    // 1. Verify ownership and get current status
    const { data: lead, error: accessError } = await supabase
        .from('leads')
        .select('id, current_status')
        .eq('id', leadId)
        .eq('user_id', user.id)
        .single()

    if (accessError || !lead) {
        return { success: false, message: 'Lead não encontrado ou acesso restrito.' }
    }

    const isHandedOff = lead.current_status === 'encaminhado_humano'

    // 2. Insert message
    const { data: newMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
            lead_id: leadId,
            message_content: content.trim(),
            sender_type: 'lead'
        })
        .select('id')
        .single()

    if (insertError || !newMessage) {
        console.error("Insert message error:", insertError)
        return { success: false, message: 'Falha ao registrar a mensagem.' }
    }

    if (isHandedOff) {
        // POST-HANDOFF: Don't change status, don't reclassify, don't trigger n8n
        // Only try to auto-respond to basic questions
        autoRespondToBasicQuestion(leadId, content.trim()).catch(err => {
            console.error("Auto-response error (silent):", err)
        })

        revalidatePath(`/leads/${leadId}`)
        return { success: true }
    }

    // PRE-HANDOFF FLOW: normal processing
    // 3. Update lead status to 'em_processamento'
    const { error: updateError } = await supabase
        .from('leads')
        .update({
            current_status: 'em_processamento',
            updated_at: new Date().toISOString()
        })
        .eq('id', leadId)

    if (updateError) {
        console.error("Update lead status error:", updateError)
        return { success: false, message: 'Mensagem enviada, mas houve erro ao atualizar o status do lead.' }
    }

    // 4. Trigger reclassification (fire and forget, non-blocking)
    reclassifyLeadViaAI(leadId).catch(err => {
        console.error("Reclassification error (silent):", err)
    })

    // 5. Trigger n8n async
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/simulated-lead-message'

    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            lead_id: leadId,
            message_id: newMessage.id,
            user_id: user.id
        })
    }).catch((err) => {
        console.error("n8n Trigger HTTP Error (Captured silently):", err)
    })

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
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Não autenticado' }

    const { data, error } = await supabase
        .from('lead_qualifications')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single() // We catch PGRST116 if no qual yet

    if (error && error.code !== 'PGRST116') {
        console.error("Fetch qualification error:", error)
        return { success: false, message: 'Erro ao carregar qualificação do lead.' }
    }

    return { success: true, data: data as LeadQualification | null }
}

// ============================================================
// CLASSIFICATION EVENTS (HISTORY)
// ============================================================

export type ClassificationEvent = {
    id: number
    lead_id: number
    previous_classification: string
    new_classification: string
    reason: string | null
    created_at: string
}

export async function getClassificationEvents(leadId: number): Promise<FetchState<ClassificationEvent[]>> {
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Não autenticado', data: [] }

    // Verify ownership
    const { data: leadAccess, error: accessError } = await supabase
        .from('leads')
        .select('id')
        .eq('id', leadId)
        .eq('user_id', user.id)
        .single()

    if (accessError || !leadAccess) {
        return { success: false, message: 'Lead não encontrado ou acesso restrito.', data: [] }
    }

    const { data, error } = await supabase
        .from('lead_classification_events')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Fetch classification events error:", error)
        return { success: false, message: 'Erro ao carregar histórico de classificação.', data: [] }
    }

    return { success: true, data: data as ClassificationEvent[] }
}

// ============================================================
// HANDOFF — ENCAMINHAMENTO PARA ATENDIMENTO HUMANO
// ============================================================

export type HandoffContext = {
    id: number
    lead_id: number
    summary_context: string
    created_at: string
}

export async function handoffLeadToHuman(leadId: number): Promise<FetchState> {
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Não autenticado' }

    try {
        // 1. Validate lead ownership and current status
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('id, current_status, current_classification')
            .eq('id', leadId)
            .eq('user_id', user.id)
            .single()

        if (leadError || !lead) {
            return { success: false, message: 'Lead não encontrado.' }
        }

        if (lead.current_status === 'encaminhado_humano') {
            return { success: false, message: 'Este lead já foi encaminhado ao humano.' }
        }

        if (!['frio', 'morno', 'quente'].includes(lead.current_classification?.toLowerCase())) {
            return { success: false, message: 'Lead precisa ter uma classificação válida antes do encaminhamento.' }
        }

        // 2. Build consolidated summary context
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
        summaryParts.push(`Classificação: ${lead.current_classification?.toUpperCase()}`)
        if (qualification?.confidence_reason) {
            summaryParts.push(`Intenção interpretada: ${qualification.confidence_reason}`)
        }
        if (systemResponse) {
            summaryParts.push(`Resposta automática: ${systemResponse.message_content}`)
        }
        if (lastLeadMessage) {
            summaryParts.push(`Última mensagem do lead: ${lastLeadMessage.message_content}`)
        }

        const summaryContext = summaryParts.join('\n---\n')

        // 3. Update lead status
        const { error: updateError } = await supabase
            .from('leads')
            .update({
                current_status: 'encaminhado_humano',
                updated_at: new Date().toISOString()
            })
            .eq('id', leadId)

        if (updateError) {
            console.error("Failed to update lead status for handoff:", updateError)
            return { success: false, message: 'Erro ao atualizar status do lead.' }
        }

        // 4. Register handoff event
        const { error: handoffError } = await supabase
            .from('lead_handoffs')
            .insert({
                lead_id: leadId,
                summary_context: summaryContext
            })

        if (handoffError) {
            console.error("Failed to insert handoff record:", handoffError)
            // Non-blocking: lead status already updated
        }

        revalidatePath(`/leads/${leadId}`)
        return { success: true }

    } catch (err: any) {
        console.error("handoffLeadToHuman Exception:", err)
        return { success: false, message: 'Erro interno durante o encaminhamento.' }
    }
}

export async function getHandoffContext(leadId: number): Promise<FetchState<HandoffContext | null>> {
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Não autenticado' }

    // Verify ownership
    const { data: leadAccess } = await supabase
        .from('leads')
        .select('id')
        .eq('id', leadId)
        .eq('user_id', user.id)
        .single()

    if (!leadAccess) {
        return { success: false, message: 'Lead não encontrado ou acesso restrito.' }
    }

    const { data, error } = await supabase
        .from('lead_handoffs')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error("Fetch handoff context error:", error)
        return { success: false, message: 'Erro ao carregar contexto do handoff.' }
    }

    return { success: true, data: data as HandoffContext | null }
}

// ============================================================
// EDIÇÃO E EXCLUSÃO DE LEADS (LGPD)
// ============================================================

export async function updateLead(leadId: number, fields: { lead_name: string; phone_number: string }): Promise<FetchState> {
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Não autenticado' }

    const name = fields.lead_name?.trim()
    const phone = fields.phone_number?.trim()

    if (!name || !phone) {
        return { success: false, message: 'Nome e telefone são obrigatórios.' }
    }

    // Verify ownership
    const { data: lead, error: accessError } = await supabase
        .from('leads')
        .select('id')
        .eq('id', leadId)
        .eq('user_id', user.id)
        .single()

    if (accessError || !lead) {
        return { success: false, message: 'Lead não encontrado ou acesso restrito.' }
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
        console.error("Update lead error:", updateError)
        return { success: false, message: 'Erro ao atualizar dados do lead.' }
    }

    revalidatePath(`/leads/${leadId}`)
    return { success: true }
}

export async function deleteLead(leadId: number): Promise<FetchState> {
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Não autenticado' }

    // Verify ownership
    const { data: lead, error: accessError } = await supabase
        .from('leads')
        .select('id')
        .eq('id', leadId)
        .eq('user_id', user.id)
        .single()

    if (accessError || !lead) {
        return { success: false, message: 'Lead não encontrado ou acesso restrito.' }
    }

    // Hard delete — ON DELETE CASCADE removes all child records
    const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)

    if (deleteError) {
        console.error("Delete lead error:", deleteError)
        return { success: false, message: 'Erro ao excluir o lead. Nenhum dado foi removido.' }
    }

    revalidatePath('/')
    return { success: true }
}
