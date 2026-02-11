'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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
    // 1. Initialize Supabase Client (Manual Mode)
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

    // 2. Authenticate User (Manual Cookie Parsing)
    const cookieStore = await cookies()
    let user = null;

    try {
        const allCookies = cookieStore.getAll()
        const authCookie = allCookies.find(c => c.name.endsWith('-auth-token')) // Matches sb-<ref>-auth-token

        if (authCookie) {
            // Attempt to parse standard SSR cookie format: ["access_token", "refresh_token"]
            // If parsing fails, it might be a raw string or different format.
            let accessToken = null;
            try {
                const tokens = JSON.parse(authCookie.value);
                if (Array.isArray(tokens) && tokens.length > 0) {
                    accessToken = tokens[0];
                } else if (typeof tokens === 'object' && tokens.access_token) {
                    accessToken = tokens.access_token; // Old or different format support
                }
            } catch (e) {
                // Fallback: maybe it's just the token string? Unlikely for SSR but possible.
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

    // Fallback for debugging/development if cookie parsing strictly fails but we are in a trusted dev mode?
    // No, we must be secure. If no user, we return error.

    if (!user) {
        return {
            success: false,
            message: 'Usuário não autenticado ou sessão expirada.',
        }
    }

    // 3. Validation
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

    // 4. Check for Duplicates
    let query = supabase.from('leads').select('id').eq('user_id', user.id)

    const orConditions = []
    if (phone) orConditions.push(`phone_number.eq.${phone}`)
    if (name) orConditions.push(`lead_name.eq.${name}`)

    if (orConditions.length > 0) {
        // Note: 'or' syntax in supabase-js might need the filter string format or method chaining
        query = query.or(orConditions.join(','))
        const { data: existingLeads } = await query

        if (existingLeads && existingLeads.length > 0) {
            return {
                success: false,
                message: 'Já existe um lead cadastrado com estes dados (Nome ou Telefone).',
            }
        }
    }

    // 5. Insert Lead
    const { error } = await supabase.from('leads').insert({
        user_id: user.id,
        lead_name: name || null,
        phone_number: phone || null,
        current_status: 'aguardando_classificacao',
        current_classification: null,
    })

    if (error) {
        console.error("Insert error:", error);
        return {
            success: false,
            message: 'Erro ao salvar lead no banco de dados. Tente novamente.',
        }
    }

    revalidatePath('/')
    return {
        success: true,
        message: 'Lead cadastrado com sucesso!',
    }
}
