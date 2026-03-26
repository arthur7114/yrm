'use server'

import { supabase } from '@/lib/supabase'

export type FormState = {
    message: string
    success: boolean
    errors?: {
        name?: string[]
        phone?: string[]
        message?: string[]
    }
}

export async function submitLeadSimulation(prevState: FormState, formData: FormData): Promise<FormState> {
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const message = formData.get('message') as string

    // Simple validation
    const errors: { name?: string[]; phone?: string[]; message?: string[] } = {}
    if (!name && !phone) {
        errors.name = ['Nome ou Telefone deve ser preenchido']
        errors.phone = ['Nome ou Telefone deve ser preenchido']
    }
    if (!message || message.trim() === '') {
        errors.message = ['A mensagem não pode estar vazia']
    }

    if (Object.keys(errors).length > 0) {
        return {
            message: 'Por favor, corrija os erros no formulário.',
            success: false,
            errors
        }
    }

    try {
        let leadId: number | null = null

        // Check if lead exists
        let query = supabase.from('leads').select('id')

        if (phone && name) {
            query = query.or(`phone_number.eq.${phone},lead_name.eq.${name}`)
        } else if (phone) {
            query = query.eq('phone_number', phone)
        } else if (name) {
            query = query.eq('lead_name', name)
        }

        const { data: existingLeads, error: searchError } = await query.limit(1)

        if (searchError) {
            console.error('Error searching lead:', searchError)
            throw new Error('Erro ao verificar lead existente')
        }

        if (existingLeads && existingLeads.length > 0) {
            leadId = existingLeads[0].id
        } else {
            // Create new lead
            const { data: newLead, error: createError } = await supabase
                .from('leads')
                .insert({
                    lead_name: name || undefined,
                    phone_number: phone || undefined,
                    current_classification: 'frio',
                    current_status: 'aguardando_classificacao'
                })
                .select('id')
                .single()

            if (createError) {
                console.error('Error creating lead:', createError)
                throw new Error('Erro ao criar novo lead')
            }
            leadId = newLead.id
        }

        if (!leadId) {
            throw new Error('Falha ao identificar ou criar lead ID')
        }

        // Insert message
        const { error: messageError } = await supabase
            .from('messages')
            .insert({
                lead_id: leadId,
                sender_type: 'lead',
                message_direction: 'inbound',
                content_type: 'text',
                metadata: {
                    source: 'simulation'
                },
                message_content: message
            })

        if (messageError) {
            console.error('Error creating message:', messageError)
            throw new Error('Erro ao salvar mensagem')
        }

        const { error: leadUpdateError } = await supabase
            .from('leads')
            .update({
                last_message_at: new Date().toISOString(),
                last_message_preview: message.slice(0, 140)
            })
            .eq('id', leadId)

        if (leadUpdateError) {
            console.error('Error updating lead activity:', leadUpdateError)
        }

        return {
            message: 'Mensagem enviada com sucesso.',
            success: true
        }
    } catch (error) {
        console.error('Unexpected error:', error)
        return {
            message: 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.',
            success: false
        }
    }
}
