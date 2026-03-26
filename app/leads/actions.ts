'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

export type CreateLeadState = {
    success?: boolean
    message?: string
    errors?: {
        name?: string[]
        phone?: string[]
        lgpd?: string[]
    }
}

export async function createLead(prevState: CreateLeadState, formData: FormData): Promise<CreateLeadState> {
    const supabase = await createClient()

    // 1. Authenticate User
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return {
            success: false,
            message: 'Usuário não autenticado.',
        }
    }

    // 2. Parse and Validate Input
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const lgpdConsent = formData.get('lgpd') === 'on'

    const errors: CreateLeadState['errors'] = {}

    if (!lgpdConsent) {
        errors.lgpd = ['O consentimento LGPD é obrigatório.']
    }

    if ((!name || name.trim() === '') && (!phone || phone.trim() === '')) {
        const msg = 'Preencha pelo menos o Nome ou o Telefone.'
        errors.name = [msg]
        errors.phone = [msg]
    }

    if (Object.keys(errors).length > 0) {
        return {
            success: false,
            message: 'Verifique os erros no formulário.',
            errors,
        }
    }

    // 3. Check for Duplicates
    // Rule: Same user_id AND (Same phone OR Same name)
    let query = supabase.from('leads').select('id').eq('user_id', user.id)

    const orConditions = []
    if (phone) orConditions.push(`phone_number.eq.${phone}`)
    if (name) orConditions.push(`lead_name.eq.${name}`)

    if (orConditions.length > 0) {
        query = query.or(orConditions.join(','))
        const { data: existingLeads } = await query

        if (existingLeads && existingLeads.length > 0) {
            return {
                success: false,
                message: 'Já existe um lead cadastrado com estes dados (Nome ou Telefone).',
            }
        }
    }

    // 4. Insert Lead
    const { error } = await supabase.from('leads').insert({
        user_id: user.id,
        lead_name: name || null,
        phone_number: phone || null,
        current_status: 'aguardando_classificacao',
        current_classification: null,
    })

    if (error) {
        return {
            success: false,
            message: 'Erro ao salvar lead no banco de dados. Tente novamente.',
        }
    }

    // 5. Revalidate and Return Success
    revalidatePath('/')
    return {
        success: true,
        message: 'Lead cadastrado com sucesso!',
    }
}
