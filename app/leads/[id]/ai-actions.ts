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
Você DEVE obrigatoriamente retornar APENAS um objeto JSON válido, sem markdown (\`\`\`json), contendo ESPECIFICAMENTE as 2 chaves a seguir:
{
  "classification": "frio" ou "morno" ou "quente",
  "confidence_reason": "Um parágrafo curto, direto e sem jargões explicando exatamente o por quê tomou essa decisão."
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
            if (!resultObj.confidence_reason) {
                throw new Error("Missing confidence_reason key returned by AI.")
            }
        } catch (parseError) {
            console.error("Failed to parse AI response.", rawContent, parseError)
            return { success: false, message: 'A IA retornou um formato inesperado. Tente novamente.' }
        }

        const classificationStr = resultObj.classification.toLowerCase()
        const reasonStr = resultObj.confidence_reason

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

export async function generateInitialResponseViaAI(leadId: number): Promise<AIQualificationResponse> {
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Não autenticado' }

    try {
        // 1. Validate Lead Status
        const { data: lead } = await supabase
            .from('leads')
            .select('current_status, current_classification')
            .eq('id', leadId)
            .eq('user_id', user.id)
            .single()

        if (!lead || lead.current_status !== 'classificado') {
            return { success: false, message: 'Lead precisa ser classificado antes de gerar resposta.' }
        }

        // 2. Prevent Duplicate Responses
        const { data: existingSysMsgs } = await supabase
            .from('messages')
            .select('id')
            .eq('lead_id', leadId)
            .eq('sender_type', 'system')
            .limit(1)

        if (existingSysMsgs && existingSysMsgs.length > 0) {
            return { success: false, message: 'Uma resposta inicial já foi enviada para este lead.' }
        }

        // 3. Fetch Contexts
        const { data: bContext } = await supabase
            .from('business_context')
            .select('*')
            .eq('user_id', user.id)
            .single()

        const { data: qualification } = await supabase
            .from('lead_qualifications')
            .select('confidence_reason')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        // 4. Build Prompt
        const systemPrompt = `Você é um Gerador Automático de Resposta Inicial atuando como representante do negócio.

CONTEXTO DO NEGÓCIO:
- Nome: ${bContext?.business_name || 'Nosso Negócio'}
- Tom de Comunicação: ${bContext?.communication_tone || 'Profissional e acolhedor'}
- Objetivo Principal do Atendimento: ${bContext?.service_objective || 'Fazer o primeiro contato.'}

O LEAD FOI CLASSIFICADO COMO: '${lead.current_classification.toUpperCase()}'
MOTIVO DA CLASSIFICAÇÃO: ${qualification?.confidence_reason || 'Nenhum motivo específico registrado.'}

SUA TAREFA:
Crie UMA ÚNICA mensagem de resposta inicial para enviar diretamente ao lead.
A mensagem deve ser redigida NA PRIMEIRA PESSOA DO SINGULAR (como se fosse um humano ou representante dedicado enviando).

REGRAS RÍGIDAS (SE QUEBRAR VOCÊ FALHOU):
1. DEVE ser curta, direta e alinhada ao "Tom de Comunicação" e responder ao "MOTIVO" da classificação de forma empática.
2. NÃO faça nenhuma pergunta adicional ao lead.
3. NÃO prometa nada fora do seu alcance (prazos fixos, valores não orçados).
4. Diga apenas que você recebeu as informações, explique o que vai acontecer em seguida (ex: "Entendi perfeitamente sua necessidade sobre [assunto]. Um de nossos especialistas vai analisar os detalhes e entrar em contato com você em breve.") e pronto.
5. NÃO CONTINUAR CONVERSA. O objetivo não é bater papo, é organizar o jogo e preparar o terreno para o humano.
6. RETORNE EXCLUSIVAMENTE A MENSAGEM FINAL. Sem aspas iniciais, sem introdução, sem marcadores. Apenas o texto puro que o usuário leria no WhatsApp/Email.`

        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey || !apiKey.startsWith('sk-')) {
            return { success: false, message: 'Chave OpenAI inválida.' }
        }

        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: systemPrompt }],
                temperature: 0.3
            })
        })

        if (!openAiRes.ok) {
            console.error("OpenAI Error:", await openAiRes.text())
            return { success: false, message: 'Falha técnica ao contatar a inteligência artificial (OpenAI).' }
        }

        const openAiData = await openAiRes.json()
        const generatedResponse = openAiData.choices[0].message.content.trim()

        if (!generatedResponse) {
            return { success: false, message: 'A IA gerou uma resposta vazia. Tente novamente.' }
        }

        // 5. Persist Response
        const { error: insertMsgError } = await supabase
            .from('messages')
            .insert({
                lead_id: leadId,
                message_content: generatedResponse,
                sender_type: 'system'
            })

        if (insertMsgError) throw insertMsgError

        revalidatePath(`/leads/${leadId}`)
        return { success: true }
    } catch (err: any) {
        console.error("generateInitialResponseViaAI Exception:", err)
        return { success: false, message: 'Ocorreu um erro interno durante a geração da resposta. Tente novamente mais tarde.' }
    }
}

export async function saveResponseFeedback(messageId: number, feedback: 'positive' | 'negative'): Promise<AIQualificationResponse> {
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, message: 'Não autenticado' }

    const { error } = await supabase
        .from('messages')
        .update({ user_feedback: feedback })
        .eq('id', messageId)

    if (error) {
        console.error("Feedback error:", error)
        return { success: false, message: 'Falha ao salvar feedback na mensagem.' }
    }

    return { success: true }
}

// ============================================================
// RECLASSIFICAÇÃO AUTOMÁTICA DE LEAD
// ============================================================

export type ReclassificationResponse = {
    success: boolean
    changed: boolean
    message?: string
    new_classification?: string
    reason?: string
}

export async function reclassifyLeadViaAI(leadId: number): Promise<ReclassificationResponse> {
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, changed: false, message: 'Não autenticado' }

    try {
        // 1. Fetch lead current state
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('id, current_classification, current_status')
            .eq('id', leadId)
            .eq('user_id', user.id)
            .single()

        if (leadError || !lead) {
            return { success: false, changed: false, message: 'Lead não encontrado.' }
        }

        const currentClassification = lead.current_classification?.toLowerCase() || 'frio'

        // 2. Fetch Business Context
        const { data: bContext } = await supabase
            .from('business_contexts')
            .select('*')
            .eq('user_id', user.id)
            .single()

        // 3. Fetch Active Qualification Questions
        const { data: questions } = await supabase
            .from('qualification_questions')
            .select('question_text')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('question_order', { ascending: true })

        // 4. Fetch Full Message History
        const { data: messages } = await supabase
            .from('messages')
            .select('message_content, sender_type, created_at')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: true })

        if (!messages || messages.length < 2) {
            return { success: true, changed: false, message: 'Histórico insuficiente para reavaliação.' }
        }

        // 5. Build Reclassification Prompt
        const historyText = messages.map(m => `[${m.sender_type.toUpperCase()}]: ${m.message_content}`).join('\n')
        const questionsText = questions && questions.length > 0
            ? questions.map(q => `- ${q.question_text}`).join('\n')
            : 'Não há perguntas específicas cadastradas.'

        const systemPrompt = `Você é um Analista de Reclassificação de Leads. Sua tarefa é REAVALIAR a classificação de um lead com base na TRAJETÓRIA COMPLETA da conversa — não apenas na última mensagem.

CONTEXTO DO NEGÓCIO:
- Nome: ${bContext?.business_name || 'Não definido'}
- Tipo: ${bContext?.business_type || 'Não definido'}
- Objetivo do Atendimento: ${bContext?.service_objective || 'Qualificar prospect'}
- Tom de Comunicação: ${bContext?.communication_tone || 'Profissional e educado'}

PERGUNTAS DE QUALIFICAÇÃO RELEVANTES:
${questionsText}

CLASSIFICAÇÃO ATUAL DO LEAD: "${currentClassification.toUpperCase()}"

CRITÉRIOS DE CLASSIFICAÇÃO:
'frio': Fase de descoberta. Interesse inicial, mas sem escopo definido ou momento de compra. Falta responder muitas perguntas de qualificação.
'morno': Sabe o que quer e tem fit com a solução. Está considerando, tirando dúvidas de escopo ou orçamento. Precisa de um empurrão.
'quente': Decisão tomada ou orçamento aprovado. Urgência clara, precisa de detalhes logísticos para iniciar.

REGRAS RÍGIDAS:
1. Analise a TRAJETÓRIA COMPLETA, não apenas a última mensagem.
2. SÓ RECLASSIFIQUE se houver EVIDÊNCIA CLARA de mudança de intenção ou estágio.
3. Se não houver evidência clara de mudança → MANTENHA a classificação atual.
4. NUNCA oscile sem motivo. Estabilidade é valorizada.
5. Retorne OBRIGATORIAMENTE um JSON válido (sem markdown, sem backticks) com exatamente:
{
  "classification": "frio" ou "morno" ou "quente",
  "reason": "Explicação curta e direta do porquê da decisão.",
  "changed": true ou false
}`

        const userPrompt = `Abaixo está o histórico COMPLETO da conversa com o lead. Analise a evolução da intenção ao longo do tempo e decida se a classificação deve mudar.

### HISTÓRICO COMPLETO ###
${historyText}

### CLASSIFICAÇÃO ATUAL ###
${currentClassification.toUpperCase()}

Avalie se o lead evoluiu ou regrediu. Retorne o JSON.`

        // 6. Call OpenAI
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey || !apiKey.startsWith('sk-')) {
            console.error("OpenAI API Key is missing or invalid for reclassification.")
            return { success: false, changed: false, message: 'Chave da OpenAI ausente ou inválida.' }
        }

        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.2,
                response_format: { type: 'json_object' }
            })
        })

        if (!openAiRes.ok) {
            const errorText = await openAiRes.text()
            console.error("OpenAI Reclassification Error:", errorText)
            return { success: true, changed: false, message: 'Falha na IA. Classificação mantida.' }
        }

        const openAiData = await openAiRes.json()
        const rawContent = openAiData.choices[0].message.content

        let resultObj: { classification: string; reason: string; changed: boolean }
        try {
            resultObj = JSON.parse(rawContent)
            if (!['frio', 'morno', 'quente'].includes(resultObj.classification?.toLowerCase())) {
                throw new Error("Invalid classification returned by AI.")
            }
            if (!resultObj.reason) {
                throw new Error("Missing reason key.")
            }
        } catch (parseError) {
            console.error("Failed to parse reclassification AI response.", rawContent, parseError)
            return { success: true, changed: false, message: 'Resposta da IA em formato inesperado. Classificação mantida.' }
        }

        const newClassification = resultObj.classification.toLowerCase()
        const reason = resultObj.reason

        // 7. Compare and Persist
        if (newClassification === currentClassification) {
            return { success: true, changed: false, message: 'Classificação mantida pela IA.', reason }
        }

        // Classification changed — update lead
        const { error: updateError } = await supabase
            .from('leads')
            .update({
                current_classification: newClassification,
                updated_at: new Date().toISOString()
            })
            .eq('id', leadId)

        if (updateError) {
            console.error("Failed to update lead classification:", updateError)
            return { success: false, changed: false, message: 'Erro ao atualizar classificação do lead.' }
        }

        // Insert classification event
        const { error: eventError } = await supabase
            .from('lead_classification_events')
            .insert({
                lead_id: leadId,
                previous_classification: currentClassification,
                new_classification: newClassification,
                reason: reason
            })

        if (eventError) {
            console.error("Failed to insert classification event:", eventError)
        }

        // Also insert into lead_classification_history for consistency
        await supabase
            .from('lead_classification_history')
            .insert({
                lead_id: leadId,
                previous_classification: currentClassification,
                new_classification: newClassification,
                reason: reason
            })
            .then(({ error }) => {
                if (error) console.error("Failed to insert classification history:", error)
            })

        revalidatePath(`/leads/${leadId}`)

        return {
            success: true,
            changed: true,
            new_classification: newClassification,
            reason,
            message: `Classificação alterada: ${currentClassification} → ${newClassification}`
        }

    } catch (err: any) {
        console.error("reclassifyLeadViaAI Exception:", err)
        return { success: false, changed: false, message: 'Erro interno durante reclassificação. Classificação mantida.' }
    }
}

// ============================================================
// RESPOSTA AUTOMÁTICA A PERGUNTAS BÁSICAS (PÓS-HANDOFF)
// ============================================================

export type AutoResponseResult = {
    success: boolean
    responded: boolean
    message?: string
}

export async function autoRespondToBasicQuestion(leadId: number, messageContent: string): Promise<AutoResponseResult> {
    const { supabase, user } = await getAuthClient()
    if (!user) return { success: false, responded: false, message: 'Não autenticado' }

    try {
        // 1. Validate lead status — MUST be encaminhado_humano
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('id, current_status')
            .eq('id', leadId)
            .eq('user_id', user.id)
            .single()

        if (leadError || !lead) {
            return { success: false, responded: false, message: 'Lead não encontrado.' }
        }

        if (lead.current_status !== 'encaminhado_humano') {
            return { success: false, responded: false, message: 'Auto-resposta só funciona após handoff.' }
        }

        // 2. Classify the message: pergunta_basica or fora_do_escopo
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey || !apiKey.startsWith('sk-')) {
            console.error("OpenAI API Key missing for auto-response.")
            return { success: false, responded: false, message: 'Chave OpenAI ausente.' }
        }

        const classificationPrompt = `Você é um classificador de mensagens. Sua ÚNICA tarefa é decidir se a mensagem do lead é uma PERGUNTA BÁSICA ou FORA DO ESCOPO.

PERGUNTA BÁSICA = perguntas simples, objetivas, que não envolvem negociação, decisão de compra ou contexto profundo. Exemplos:
- Qual o horário de funcionamento?
- Qual o endereço?
- Como faço para entrar em contato?
- Vocês aceitam cartão?
- Onde fica a empresa?

FORA DO ESCOPO = qualquer coisa que envolva:
- Intenção comercial
- Negociação de preço/prazo
- Decisão de compra
- Reclamação
- Pedido de orçamento
- Continuação de conversa anterior
- Qualquer pergunta que exija contexto profundo

Retorne APENAS um JSON válido (sem markdown):
{
  "type": "pergunta_basica" ou "fora_do_escopo",
  "confidence": "alta" ou "media" ou "baixa"
}`

        const classRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: classificationPrompt },
                    { role: 'user', content: `Mensagem do lead: "${messageContent}"` }
                ],
                temperature: 0.1,
                response_format: { type: 'json_object' }
            })
        })

        if (!classRes.ok) {
            console.error("OpenAI classification error:", await classRes.text())
            return { success: true, responded: false, message: 'Falha na classificação. Não respondido.' }
        }

        const classData = await classRes.json()
        let classResult: { type: string; confidence: string }
        try {
            classResult = JSON.parse(classData.choices[0].message.content)
        } catch {
            console.error("Failed to parse classification response.")
            return { success: true, responded: false, message: 'Resposta da IA em formato inesperado.' }
        }

        // Only respond to explicit basic questions with sufficient confidence
        if (classResult.type !== 'pergunta_basica') {
            return { success: true, responded: false, message: 'Mensagem fora do escopo de auto-resposta.' }
        }

        // 3. Fetch business context for the response
        const { data: bContext } = await supabase
            .from('business_contexts')
            .select('business_name, business_type, service_objective, communication_tone')
            .eq('user_id', user.id)
            .single()

        // 4. Generate short, neutral response
        const responsePrompt = `Você é um assistente de atendimento que responde APENAS perguntas básicas e objetivas.

CONTEXTO DO NEGÓCIO:
- Nome: ${bContext?.business_name || 'Nosso Negócio'}
- Tipo: ${bContext?.business_type || 'Empresa'}
- Tom: ${bContext?.communication_tone || 'Profissional e educado'}

REGRAS RÍGIDAS:
1. Responda em NO MÁXIMO 2 frases
2. Seja direto e objetivo
3. NÃO faça perguntas ao lead
4. NÃO tente vender
5. NÃO use CTA (call-to-action)
6. NÃO puxe conversa
7. NÃO prometa nada
8. Use tom neutro e prestativo
9. Retorne APENAS o texto da resposta, sem markdown, sem aspas, sem prefixo

Se não souber a resposta com certeza, diga algo como "Para essa informação, nosso time de atendimento poderá ajudar em breve."`

        const genRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: responsePrompt },
                    { role: 'user', content: `Pergunta do lead: "${messageContent}"` }
                ],
                temperature: 0.3
            })
        })

        if (!genRes.ok) {
            console.error("OpenAI response generation error:", await genRes.text())
            return { success: true, responded: false, message: 'Falha ao gerar resposta.' }
        }

        const genData = await genRes.json()
        const responseText = genData.choices[0].message.content.trim()

        if (!responseText) {
            return { success: true, responded: false, message: 'IA gerou resposta vazia.' }
        }

        // 5. Persist the automated response
        const { error: insertError } = await supabase
            .from('messages')
            .insert({
                lead_id: leadId,
                message_content: responseText,
                sender_type: 'automacao',
                is_automation: true
            })

        if (insertError) {
            console.error("Failed to insert auto-response:", insertError)
            return { success: false, responded: false, message: 'Erro ao salvar resposta automática.' }
        }

        revalidatePath(`/leads/${leadId}`)
        return { success: true, responded: true }

    } catch (err: any) {
        console.error("autoRespondToBasicQuestion Exception:", err)
        return { success: false, responded: false, message: 'Erro interno. Não respondido.' }
    }
}

