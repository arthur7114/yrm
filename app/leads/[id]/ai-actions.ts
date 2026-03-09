'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// Internal Helper for Auth Client (Copied from actions.ts for isolated AI context)
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

export type AIQualificationResponse = {
    success: boolean
    message?: string
}

export async function qualifyLeadViaAI(leadId: number): Promise<AIQualificationResponse> {
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Não autenticado' }

    try {
        // 1. Validate Lead and Status
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('id, current_status, current_classification')
            .eq('id', leadId)
            .eq('user_id', user.id)
            .single()

        if (leadError || !lead) {
            return { success: false, message: 'Lead não encontrado.' }
        }

        if (lead.current_status !== 'em_processamento') {
            return { success: false, message: 'Lead não está em processamento para qualificação.' }
        }

        // 2. Fetch Business Context
        const { data: bContext } = await supabase
            .from('business_context')
            .select('*')
            .eq('user_id', user.id)
            .single()

        // 3. Fetch Qualification Questions
        const { data: questions } = await supabase
            .from('qualification_questions')
            .select('question_text')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('order_index', { ascending: true })

        // 4. Fetch Message History
        const { data: messages } = await supabase
            .from('messages')
            .select('message_content, sender_type, created_at')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: true })

        if (!messages || messages.length === 0) {
            return { success: false, message: 'Histórico de mensagens vazio, impossível classificar.' }
        }

        // 5. Build the AI Prompt
        const historyText = messages.map(m => `[${m.sender_type.toUpperCase()}]: ${m.message_content}`).join('\n')
        const questionsText = questions ? questions.map(q => `- ${q.question_text}`).join('\n') : 'Não há perguntas específicas cadastradas.'

        const systemPrompt = `Você é um Assistente de Qualificação Inteligente focado em classificar Leads baseado em dados.
Sua única responsabilidade é analisar o histórico da conversa de um lead, cruzá-lo com o contexto do negócio, decidir se o lead é frio, morno ou quente, e gerar uma resposta inicial a ser enviada pro lead.

CONTEXTO DO NEGÓCIO:
- Nome: ${bContext?.business_name || 'Não definido'}
- Tipo: ${bContext?.business_type || 'Não definido'}
- Objetivo do Atendimento (O que queremos extrair?): ${bContext?.service_objective || 'Qualificar prospect'}
- Tom de Comunicação: ${bContext?.communication_tone || 'Profissional e educado'}

PERGUNTAS DE QUALIFICAÇÃO QUE DEVEM SER RESPONDIDAS EVENTUALMENTE:
${questionsText}

CRITÉRIOS DE CLASSIFICAÇÃO OBRIGATÓRIOS:
'frio': Ainda está na fase de descoberta. Demonstrou interesse inicial, mas não fechou o escopo do que precisa ou não está no momento de compra. Falta responder muitas perguntas de qualificação.
'morno': Sabe o que quer e tem fit com a solução. Está considerando opções, tirando dúvidas de escopo ou orçamento. Precisa de um pequeno empurrão.
'quente': Decisão tomada ou orçamento aprovado. Tem urgência e só precisa de detalhes logísticos para iniciar o projeto ou assinar contrato.

REGRAS RÍGIDAS DE SAÍDA:
Você DEVE obrigatoriamente retornar APENAS um objeto JSON válido, sem markdown (\`\`\`json), contendo ESPECIFICAMENTE as 3 chaves a seguir:
{
  "classification": "frio" ou "morno" ou "quente",
  "confidence_reason": "Um parágrafo curto, direto e sem jargões explicando exatamente o por quê tomou essa decisão.",
  "initial_response": "Uma resposta natural, amigável respeitando o Tom de Comunicação e sem jargões. AVISO IMPORTANTE: Não faça nenhuma pergunta adicional nesta resposta."
}`

        const userPrompt = `Abaixo está o histórico da conversa com o lead. Leia, analise as intenções nas entrelinhas e classifique.\n\n### HISTÓRICO DA CONVERSA ###\n${historyText}`

        // 6. Call OpenAI
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey || !apiKey.startsWith('sk-') || apiKey === 'sk-coloque_aqui_sua_chave_da_openai') {
            console.error("OpenAI API Key is missing or invalid.")
            return { success: false, message: 'Chave da OpenAI ausente ou inválida. Configure o arquivo .env.local.' }
        }

        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // Using 4o-mini for speed and low cost, capable of JSON tasks.
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.2, // Low temperature for deterministic classification
                response_format: { type: 'json_object' }
            })
        })

        if (!openAiRes.ok) {
            const errorText = await openAiRes.text()
            console.error("OpenAI Error:", errorText)
            return { success: false, message: 'Falha técnica ao contatar a inteligência artificial (OpenAI).' }
        }

        const openAiData = await openAiRes.json()
        const rawContent = openAiData.choices[0].message.content

        let resultObj
        try {
            resultObj = JSON.parse(rawContent)
            if (!['frio', 'morno', 'quente'].includes(resultObj.classification?.toLowerCase())) {
                throw new Error("Invalid classification string returned by AI.")
            }
            if (!resultObj.confidence_reason || !resultObj.initial_response) {
                throw new Error("Missing required keys returned by AI.")
            }
        } catch (parseError) {
            console.error("Failed to parse AI response.", rawContent, parseError)
            return { success: false, message: 'A IA retornou um formato inesperado. Tente novamente.' }
        }

        const classificationStr = resultObj.classification.toLowerCase()
        const reasonStr = resultObj.confidence_reason
        const responseStr = resultObj.initial_response

        // 7. Persist Results (Transaction-like steps)

        // 7.a Update Lead Status & Classification
        const { error: updateLeadError } = await supabase
            .from('leads')
            .update({
                current_status: 'classificado',
                current_classification: classificationStr,
                updated_at: new Date().toISOString()
            })
            .eq('id', leadId)

        if (updateLeadError) throw updateLeadError

        // 7.b Insert Qualification Row
        const { error: insertQualError } = await supabase
            .from('lead_qualifications')
            .insert({
                lead_id: leadId,
                classification: classificationStr,
                confidence_reason: reasonStr
            })

        if (insertQualError) throw insertQualError

        // 7.c Insert Initial Response as System Message
        const { error: insertMsgError } = await supabase
            .from('messages')
            .insert({
                lead_id: leadId,
                message_content: responseStr,
                sender_type: 'system'
            })

        if (insertMsgError) throw insertMsgError

        // Success!
        revalidatePath(`/leads/${leadId}`)
        return { success: true }

    } catch (err: any) {
        console.error("qualifyLeadViaAI Exception:", err)
        return { success: false, message: 'Ocorreu um erro interno durante a qualificação. Tente novamente mais tarde.' }
    }
}

export async function saveQualificationFeedback(qualificationId: number, feedback: 'positive' | 'negative'): Promise<AIQualificationResponse> {
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Não autenticado' }

    const { error } = await supabase
        .from('lead_qualifications')
        .update({ user_feedback: feedback })
        .eq('id', qualificationId)

    // In a strict environment, we'd also check user ownership of the lead referenced by qualificationId.
    // Assuming RLS handles the heavy lifting here since we're using the standard supabase client.

    if (error) {
        console.error("Feedback error:", error)
        return { success: false, message: 'Falha ao salvar feedback.' }
    }

    // Usually we don't strictly need to revalidate the whole path if it's optimistic, but we will to keep it simple.
    // However, we don't know the leadId. Since Server Actions execute safely, the client will get the true/false response anyway.
    return { success: true }
}
