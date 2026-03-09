'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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
    sender_type: 'lead' | 'system' | 'human'
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
