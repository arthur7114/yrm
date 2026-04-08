'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

// Types
export interface BusinessContext {
    business_name: string
    business_type: string
    service_objective: string
    communication_tone: string
}

export interface QualificationQuestion {
    id: string
    user_id: string
    question_text: string
    order_index: number
    is_active: boolean
    created_at: string
}

export type ActionState<T = unknown> = {
    success?: boolean
    message?: string
    data?: T
    errors?: Record<string, string[]>
}

// Internal Helper for Auth Client
async function getAuthClient() {
    const supabase = await createClient()

    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser()

    return { supabase, user: authError ? null : user }
}


// --- Business Context Actions ---

export async function getBusinessContext(): Promise<ActionState<BusinessContext | null>> {
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Não autenticado' }

    const { data, error } = await supabase
        .from('business_context')
        .select('*')
        .eq('user_id', user.id)
        .single() // Returns null if not found (or throws PGRST116 which we catch)

    if (error && error.code !== 'PGRST116') {
        console.error("Fetch business context error:", error)
        return { success: false, message: 'Erro ao carregar configurações de contexto.' }
    }

    return { success: true, data: data as BusinessContext | null }
}


export async function saveBusinessContext(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    void prevState
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Sessão expirada. Faça login novamente.' }

    const business_name = formData.get('business_name') as string
    const business_type = formData.get('business_type') as string
    const service_objective = formData.get('service_objective') as string
    const communication_tone = formData.get('communication_tone') as string

    // Basic Validation
    const errors: Record<string, string[]> = {}
    if (!business_name?.trim()) errors.business_name = ['O nome do negócio é obrigatório']
    if (!business_type?.trim()) errors.business_type = ['O tipo de negócio é obrigatório']
    if (!service_objective?.trim()) errors.service_objective = ['O objetivo de atendimento é obrigatório']
    if (!communication_tone?.trim()) errors.communication_tone = ['O tom de comunicação é obrigatório']

    if (Object.keys(errors).length > 0) {
        return { success: false, message: 'Preencha todos os campos obrigatórios.', errors }
    }

    // Upsert (Insert or Update if user_id exists due to Primary Key)
    const { error } = await supabase.from('business_context').upsert({
        user_id: user.id, // Primary Key in this table
        business_name,
        business_type,
        service_objective,
        communication_tone,
        updated_at: new Date().toISOString()
    })

    if (error) {
        console.error("Upsert business context error:", error)
        return { success: false, message: 'Erro ao salvar o contexto de negócio. Tente novamente.' }
    }

    revalidatePath('/settings')
    return { success: true, message: 'Contexto de negócio salvo com sucesso!' }
}


// --- Qualification Questions Actions ---

export async function getQualificationQuestions(): Promise<ActionState<QualificationQuestion[]>> {
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Não autenticado', data: [] }

    const { data, error } = await supabase
        .from('qualification_questions')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true })

    if (error) {
        console.error("Fetch questions error:", error)
        return { success: false, message: 'Erro ao carregar as perguntas.', data: [] }
    }

    return { success: true, data: data as QualificationQuestion[] }
}

export async function createQualificationQuestion(
    prevState: ActionState | null,
    formData: FormData
): Promise<ActionState> {
    void prevState
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Sessão expirada. Faça login novamente.' }

    const question_text = formData.get('question_text') as string

    if (!question_text?.trim()) {
        return { success: false, message: 'O texto da pergunta não pode estar vazio.' }
    }

    // Get current max order to append at the end
    const { data: maxOrderData } = await supabase
        .from('qualification_questions')
        .select('order_index')
        .eq('user_id', user.id)
        .order('order_index', { ascending: false })
        .limit(1)

    const nextOrder = maxOrderData && maxOrderData.length > 0 ? (maxOrderData[0].order_index + 1) : 0

    const { error } = await supabase.from('qualification_questions').insert({
        user_id: user.id,
        question_text,
        order_index: nextOrder,
        is_active: true
    })

    if (error) {
        console.error("Create question error:", error)
        return { success: false, message: 'Erro ao adicionar a pergunta.' }
    }

    revalidatePath('/settings')
    return { success: true, message: 'Pergunta adicionada com sucesso!' }
}

export async function updateQualificationQuestion(id: string, updates: { question_text?: string; is_active?: boolean }): Promise<ActionState> {
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Não autenticado.' }

    if (updates.question_text !== undefined && !updates.question_text.trim()) {
        return { success: false, message: 'O texto não pode ser vazio.' }
    }

    const { error } = await supabase
        .from('qualification_questions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id) // Security check

    if (error) {
        console.error("Update question error:", error)
        return { success: false, message: 'Erro ao atualizar a pergunta.' }
    }

    revalidatePath('/settings')
    return { success: true, message: 'Pergunta atualizada.' }
}

export async function updateQuestionOrdering(orderedIds: string[]): Promise<ActionState> {
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Não autenticado.' }

    // Update each question's order in parallel
    // Ideally this could be an RPC or bulk update, but for small arrays it's fine.
    const updates = orderedIds.map((id, index) =>
        supabase
            .from('qualification_questions')
            .update({ order_index: index })
            .eq('id', id)
            .eq('user_id', user.id)
    )

    const results = await Promise.all(updates)
    const hasError = results.some(r => r.error != null)

    if (hasError) {
        console.error("Reorder questions error:", results.map(r => r.error).filter(Boolean))
        return { success: false, message: 'Erro ao reordenar uma ou mais perguntas.' }
    }

    revalidatePath('/settings')
    return { success: true, message: 'Ordem atualizada com sucesso!' }
}


export async function deleteQualificationQuestion(id: string): Promise<ActionState> {
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Não autenticado.' }

    const { error } = await supabase
        .from('qualification_questions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // Security check

    if (error) {
        console.error("Delete question error:", error)
        return { success: false, message: 'Erro ao excluir a pergunta.' }
    }

    revalidatePath('/settings')
    return { success: true, message: 'Pergunta excluída.' }
}
