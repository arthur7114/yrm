import { revalidatePath } from 'next/cache'

import { supabaseAdmin } from '@/lib/supabase-admin'

type EventName = 'lead.created' | 'lead.classified' | 'message.created'
type MessageDirection = 'inbound' | 'outbound'
type ContentType = 'text' | 'audio' | 'image' | 'video' | 'attachment'
type LeadClassification = 'frio' | 'morno' | 'quente' | null
type LeadTier = 'A' | 'B' | 'C' | null
type LeadStatus =
  | 'aguardando_classificacao'
  | 'classificado'
  | 'aguardando_contato_humano'
  | 'agendado'

type EventMetadata = Record<string, unknown>

export type N8nLeadEventPayload = {
  event: EventName
  external_session_id: string
  phone_number?: string | null
  lead_name?: string | null
  message_direction?: MessageDirection | null
  message_content?: string | null
  message_id?: string | null
  content_type?: ContentType | null
  classification?: LeadClassification
  lead_tier?: LeadTier
  score?: number | null
  status?: LeadStatus | null
  qualification_summary?: string | null
  occurred_at?: string | null
  metadata?: EventMetadata | null
}

type LeadRecord = {
  id: number
  user_id: string
  phone_number: string | null
  external_session_id: string | null
  lead_name: string | null
}

type ProcessResult = {
  leadId: number
  createdLead: boolean
  createdMessage: boolean
  createdNotification: boolean
}

const validEvents = new Set<EventName>(['lead.created', 'lead.classified', 'message.created'])
const validMessageDirections = new Set<MessageDirection>(['inbound', 'outbound'])
const validContentTypes = new Set<ContentType>(['text', 'audio', 'image', 'video', 'attachment'])
const validStatuses = new Set<LeadStatus>([
  'aguardando_classificacao',
  'classificado',
  'aguardando_contato_humano',
  'agendado',
])
const validClassifications = new Set<Exclude<LeadClassification, null>>(['frio', 'morno', 'quente'])
const validTiers = new Set<Exclude<LeadTier, null>>(['A', 'B', 'C'])

function normalizeString(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseOccurredAt(value: string | null | undefined) {
  if (!value) {
    return new Date().toISOString()
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function truncatePreview(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  return trimmed.length <= 140 ? trimmed : `${trimmed.slice(0, 137)}...`
}

function buildValidationError(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  })
}

export function validateLeadEventPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return { error: 'Payload must be a JSON object.', data: null }
  }

  const data = payload as Record<string, unknown>
  const event = normalizeString(data.event)
  const externalSessionId = normalizeString(data.external_session_id)
  const phoneNumber = normalizeString(data.phone_number)
  const leadName = normalizeString(data.lead_name)
  const messageDirection = normalizeString(data.message_direction) as MessageDirection | null
  const messageContent = normalizeString(data.message_content)
  const messageId = normalizeString(data.message_id)
  const contentType = normalizeString(data.content_type) as ContentType | null
  const classification = normalizeString(data.classification) as LeadClassification
  const leadTier = normalizeString(data.lead_tier) as LeadTier
  const qualificationSummary = normalizeString(data.qualification_summary)
  const status = normalizeString(data.status) as LeadStatus | null
  const occurredAt = normalizeString(data.occurred_at)
  const metadata =
    data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)
      ? (data.metadata as EventMetadata)
      : {}

  let score: number | null = null
  if (data.score !== undefined && data.score !== null && data.score !== '') {
    const numericScore = Number(data.score)
    if (!Number.isFinite(numericScore)) {
      return { error: 'score must be a valid number.', data: null }
    }
    score = numericScore
  }

  if (!event || !validEvents.has(event as EventName)) {
    return { error: 'event must be one of: lead.created, lead.classified, message.created.', data: null }
  }

  if (!externalSessionId && !phoneNumber) {
    return { error: 'external_session_id or phone_number is required.', data: null }
  }

  if (messageDirection && !validMessageDirections.has(messageDirection)) {
    return { error: 'message_direction must be inbound or outbound.', data: null }
  }

  if (contentType && !validContentTypes.has(contentType)) {
    return { error: 'content_type is invalid.', data: null }
  }

  if (status && !validStatuses.has(status)) {
    return { error: 'status is invalid.', data: null }
  }

  if (classification && !validClassifications.has(classification)) {
    return { error: 'classification must be frio, morno, or quente.', data: null }
  }

  if (leadTier && !validTiers.has(leadTier)) {
    return { error: 'lead_tier must be A, B, or C.', data: null }
  }

  if (event === 'message.created' && !messageContent) {
    return { error: 'message_content is required for message.created.', data: null }
  }

  if (event === 'message.created' && !messageDirection) {
    return { error: 'message_direction is required for message.created.', data: null }
  }

  return {
    error: null,
    data: {
      event: event as EventName,
      external_session_id: externalSessionId || phoneNumber || '',
      phone_number: phoneNumber,
      lead_name: leadName,
      message_direction: messageDirection,
      message_content: messageContent,
      message_id: messageId,
      content_type: contentType || 'text',
      classification: classification || null,
      lead_tier: leadTier || null,
      score,
      status,
      qualification_summary: qualificationSummary,
      occurred_at: occurredAt,
      metadata,
    } satisfies N8nLeadEventPayload,
  }
}

async function findLead(ownerUserId: string, payload: N8nLeadEventPayload) {
  if (payload.phone_number) {
    const { data } = await supabaseAdmin
      .from('leads')
      .select('id, user_id, phone_number, external_session_id, lead_name')
      .eq('user_id', ownerUserId)
      .eq('phone_number', payload.phone_number)
      .maybeSingle()

    if (data) {
      return data as LeadRecord
    }
  }

  const { data } = await supabaseAdmin
    .from('leads')
    .select('id, user_id, phone_number, external_session_id, lead_name')
    .eq('user_id', ownerUserId)
    .eq('external_session_id', payload.external_session_id)
    .maybeSingle()

  return (data as LeadRecord | null) ?? null
}

async function createLead(ownerUserId: string, payload: N8nLeadEventPayload) {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert({
      user_id: ownerUserId,
      lead_name: payload.lead_name,
      phone_number: payload.phone_number,
      external_session_id: payload.external_session_id,
      current_status: payload.status || 'aguardando_classificacao',
      current_classification: payload.classification,
      score_total: payload.score,
      lead_tier: payload.lead_tier,
      qualification_summary: payload.qualification_summary,
      last_message_at:
        payload.event === 'message.created' ? parseOccurredAt(payload.occurred_at) : null,
      last_message_preview:
        payload.event === 'message.created' ? truncatePreview(payload.message_content) : null,
    })
    .select('id, user_id, phone_number, external_session_id, lead_name')
    .single()

  if (error) {
    throw error
  }

  return data as LeadRecord
}

async function updateLead(leadId: number, payload: Partial<N8nLeadEventPayload>) {
  const leadUpdate: Record<string, unknown> = {}

  if (payload.lead_name !== undefined && payload.lead_name !== null) {
    leadUpdate.lead_name = payload.lead_name
  }

  if (payload.phone_number !== undefined && payload.phone_number !== null) {
    leadUpdate.phone_number = payload.phone_number
  }

  if (payload.external_session_id) {
    leadUpdate.external_session_id = payload.external_session_id
  }

  if (payload.classification !== undefined) {
    leadUpdate.current_classification = payload.classification
  }

  if (payload.status) {
    leadUpdate.current_status = payload.status
  }

  if (payload.score !== undefined) {
    leadUpdate.score_total = payload.score
  }

  if (payload.lead_tier !== undefined) {
    leadUpdate.lead_tier = payload.lead_tier
  }

  if (payload.qualification_summary !== undefined) {
    leadUpdate.qualification_summary = payload.qualification_summary
  }

  if (payload.event === 'message.created') {
    leadUpdate.last_message_at = parseOccurredAt(payload.occurred_at)
    leadUpdate.last_message_preview = truncatePreview(payload.message_content)
  }

  if (Object.keys(leadUpdate).length === 0) {
    return
  }

  const { error } = await supabaseAdmin.from('leads').update(leadUpdate).eq('id', leadId)

  if (error) {
    throw error
  }
}

async function findOrCreateLead(ownerUserId: string, payload: N8nLeadEventPayload) {
  const existingLead = await findLead(ownerUserId, payload)

  if (existingLead) {
    await updateLead(existingLead.id, payload)
    return { lead: existingLead, created: false }
  }

  const lead = await createLead(ownerUserId, payload)
  return { lead, created: true }
}

async function createNotification(ownerUserId: string, leadId: number, payload: N8nLeadEventPayload) {
  const displayName = payload.lead_name || payload.phone_number || payload.external_session_id

  const { error } = await supabaseAdmin.from('notifications').insert({
    user_id: ownerUserId,
    lead_id: leadId,
    type: 'lead_created',
    title: 'Novo lead recebido',
    body: `Lead ${displayName} entrou pelo atendimento do WhatsApp.`,
    metadata: {
      source: 'n8n',
      event: payload.event,
      external_session_id: payload.external_session_id,
      phone_number: payload.phone_number,
    },
  })

  if (error) {
    throw error
  }
}

async function createMessage(leadId: number, payload: N8nLeadEventPayload) {
  if (!payload.message_content || !payload.message_direction) {
    return false
  }

  if (payload.message_id) {
    const { data: existingMessage } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('external_message_id', payload.message_id)
      .limit(1)
      .maybeSingle()

    if (existingMessage) {
      return false
    }
  }

  const { error } = await supabaseAdmin.from('messages').insert({
    lead_id: leadId,
    sender_type: payload.message_direction === 'inbound' ? 'lead' : 'agent',
    message_content: payload.message_content,
    message_direction: payload.message_direction,
    content_type: payload.content_type || 'text',
    external_message_id: payload.message_id,
    metadata: {
      ...payload.metadata,
      source: 'n8n',
    },
    created_at: parseOccurredAt(payload.occurred_at),
  })

  if (error) {
    throw error
  }

  return true
}

export async function processLeadEvent(payload: N8nLeadEventPayload): Promise<ProcessResult> {
  const ownerUserId = normalizeString(process.env.N8N_LEAD_OWNER_USER_ID)

  if (!ownerUserId) {
    throw new Error('N8N_LEAD_OWNER_USER_ID is not configured')
  }

  const { lead, created } = await findOrCreateLead(ownerUserId, payload)

  let createdNotification = false
  let createdMessage = false

  if (payload.event === 'lead.created' && created) {
    await createNotification(ownerUserId, lead.id, payload)
    createdNotification = true
  }

  if (payload.event === 'lead.classified') {
    await updateLead(lead.id, payload)
  }

  if (payload.event === 'message.created') {
    createdMessage = await createMessage(lead.id, payload)
    await updateLead(lead.id, payload)
  }

  revalidatePath('/')
  revalidatePath(`/leads/${lead.id}`)

  return {
    leadId: lead.id,
    createdLead: created,
    createdMessage,
    createdNotification,
  }
}

export function badRequest(message: string) {
  return buildValidationError(message)
}
