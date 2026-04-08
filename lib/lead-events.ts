import { revalidatePath } from 'next/cache'

import {
  type LeadOperationalStatus,
  LEAD_TIERS,
  LEAD_TEMPERATURES,
  MESSAGE_DIRECTIONS,
  MESSAGE_SENDER_TYPES,
  type LeadTemperature,
  type LeadTier,
  type MessageDirection,
  type MessageSenderType,
  normalizeLeadStatus,
} from '@/lib/lead-domain'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type ContentType = 'text' | 'audio' | 'image' | 'video' | 'attachment'
type LeadEventSource = 'n8n' | 'app'
type EventMetadata = Record<string, unknown>
type HandoffPriority = 'normal' | 'alta'

const SUPPORTED_INTEGRATION_EVENT_TYPES = ['message.created', 'lead.classified'] as const
const validContentTypes = new Set<ContentType>(['text', 'audio', 'image', 'video', 'attachment'])

type SupportedIntegrationEventType = (typeof SUPPORTED_INTEGRATION_EVENT_TYPES)[number]

type MessageCreatedPayload = {
  direction: MessageDirection
  sender_type: MessageSenderType
  external_message_id: string
  content_type: ContentType
  message_content: string
}

type LeadClassifiedPayload = {
  temperatura: LeadTemperature
  score: number
  tier: LeadTier
  qualification_summary: string
  target_status: LeadOperationalStatus
  handoff_summary?: string | null
  handoff_priority?: HandoffPriority | null
}

type CanonicalPayloadByEvent = {
  'message.created': MessageCreatedPayload
  'lead.classified': LeadClassifiedPayload
}

type CanonicalLeadRef = {
  external_session_id: string
  phone_number?: string | null
  lead_name?: string | null
}

export type CanonicalLeadEventEnvelope<
  TEventType extends SupportedIntegrationEventType = SupportedIntegrationEventType,
> = {
  event_id: string
  event_type: TEventType
  event_version: 1
  source: LeadEventSource
  occurred_at: string
  lead: CanonicalLeadRef
  payload: CanonicalPayloadByEvent[TEventType]
  metadata: EventMetadata
}

type LeadRecord = {
  id: number
  user_id: string
  phone_number: string | null
  external_session_id: string | null
  lead_name: string | null
  current_status: LeadOperationalStatus | null
  current_classification: LeadTemperature | null
  last_classification_at: string | null
  last_status_changed_at: string | null
}

type DuplicateIntegrationEventRecord = {
  lead_id: number
}

type DuplicateMessageRecord = {
  lead_id: number
}

type ProcessResult = {
  leadId: number
  eventType: SupportedIntegrationEventType
  createdLead: boolean
  createdMessage: boolean
  createdNotification: boolean
  duplicateEvent: boolean
}

function supabaseAdmin() {
  return getSupabaseAdmin()
}

function normalizeString(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeSource(value: unknown): LeadEventSource | null {
  const normalized = normalizeString(value)?.toLowerCase()
  return normalized === 'app' || normalized === 'n8n' ? normalized : null
}

function normalizeContentType(value: unknown): ContentType | null {
  const normalized = normalizeString(value)?.toLowerCase()
  return normalized && validContentTypes.has(normalized as ContentType)
    ? (normalized as ContentType)
    : null
}

function normalizeMessageDirection(value: unknown): MessageDirection | null {
  const normalized = normalizeString(value)?.toLowerCase()
  return normalized && MESSAGE_DIRECTIONS.includes(normalized as MessageDirection)
    ? (normalized as MessageDirection)
    : null
}

function normalizeMessageSenderType(value: unknown): MessageSenderType | null {
  const normalized = normalizeString(value)?.toLowerCase()
  return normalized && MESSAGE_SENDER_TYPES.includes(normalized as MessageSenderType)
    ? (normalized as MessageSenderType)
    : null
}

function normalizeLeadTemperature(value: unknown): LeadTemperature | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return LEAD_TEMPERATURES.includes(normalized as LeadTemperature)
    ? (normalized as LeadTemperature)
    : null
}

function normalizeLeadTier(value: unknown): LeadTier | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toUpperCase()
  return LEAD_TIERS.includes(normalized as LeadTier) ? (normalized as LeadTier) : null
}

function normalizeHandoffPriority(value: unknown): HandoffPriority | null {
  const normalized = normalizeString(value)?.toLowerCase()
  return normalized === 'alta' ? 'alta' : normalized === 'normal' ? 'normal' : null
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeMetadata(value: unknown) {
  return isRecord(value) ? value : {}
}

function isMessageCreatedEvent(
  event: CanonicalLeadEventEnvelope
): event is CanonicalLeadEventEnvelope<'message.created'> {
  return event.event_type === 'message.created'
}

function isLeadClassifiedEvent(
  event: CanonicalLeadEventEnvelope
): event is CanonicalLeadEventEnvelope<'lead.classified'> {
  return event.event_type === 'lead.classified'
}

function validateCommonEnvelopeParts(data: Record<string, unknown>) {
  const eventId = normalizeString(data.event_id)
  const eventType = normalizeString(data.event_type) as SupportedIntegrationEventType | null
  const eventVersion = data.event_version
  const lead = isRecord(data.lead) ? data.lead : null
  const payload = isRecord(data.payload) ? data.payload : null
  const leadRef = lead
    ? {
        external_session_id: normalizeString(lead.external_session_id) || '',
        phone_number: normalizeString(lead.phone_number),
        lead_name: normalizeString(lead.lead_name),
      }
    : null

  if (!eventId) {
    return { error: 'event_id is required.', data: null }
  }

  if (!eventType || !SUPPORTED_INTEGRATION_EVENT_TYPES.includes(eventType)) {
    return {
      error: `event_type must be one of: ${SUPPORTED_INTEGRATION_EVENT_TYPES.join(', ')}.`,
      data: null,
    }
  }

  if (eventVersion !== 1) {
    return { error: 'event_version must be 1.', data: null }
  }

  if (!leadRef?.external_session_id) {
    return { error: 'lead.external_session_id is required.', data: null }
  }

  if (!payload) {
    return { error: 'payload is required.', data: null }
  }

  return {
    error: null,
    data: {
      event_id: eventId,
      event_type: eventType,
      event_version: 1 as const,
      source: normalizeSource(data.source) || 'n8n',
      occurred_at: parseOccurredAt(normalizeString(data.occurred_at)),
      lead: leadRef,
      payload,
      metadata: normalizeMetadata(data.metadata),
    },
  }
}

export function validateLeadEventPayload(payload: unknown) {
  if (!isRecord(payload)) {
    return { error: 'Payload must be a JSON object.', data: null }
  }

  const common = validateCommonEnvelopeParts(payload)
  if (common.error || !common.data) {
    return common
  }

  if (common.data.event_type === 'message.created') {
    const direction = normalizeMessageDirection(common.data.payload.direction)
    const senderType = normalizeMessageSenderType(common.data.payload.sender_type)
    const externalMessageId = normalizeString(common.data.payload.external_message_id)
    const contentType = normalizeContentType(common.data.payload.content_type) || 'text'
    const messageContent = normalizeString(common.data.payload.message_content)

    if (!direction || !senderType || !externalMessageId || !messageContent) {
      return {
        error:
          'payload.direction, payload.sender_type, payload.external_message_id and payload.message_content are required for message.created.',
        data: null,
      }
    }

    return {
      error: null,
      data: {
        event_id: common.data.event_id,
        event_type: 'message.created',
        event_version: common.data.event_version,
        source: common.data.source,
        occurred_at: common.data.occurred_at,
        lead: common.data.lead,
        payload: {
          direction,
          sender_type: senderType,
          external_message_id: externalMessageId,
          content_type: contentType,
          message_content: messageContent,
        },
        metadata: common.data.metadata,
      } satisfies CanonicalLeadEventEnvelope<'message.created'>,
    }
  }

  const temperatura = normalizeLeadTemperature(common.data.payload.temperatura)
  const tier = normalizeLeadTier(common.data.payload.tier)
  const qualificationSummary = normalizeString(common.data.payload.qualification_summary)
  const targetStatus = normalizeLeadStatus(common.data.payload.target_status)
  const parsedScore = Number(common.data.payload.score)
  const handoffSummary = normalizeString(common.data.payload.handoff_summary)
  const handoffPriority = normalizeHandoffPriority(common.data.payload.handoff_priority)

  if (!temperatura || !tier || !qualificationSummary || !Number.isFinite(parsedScore) || !targetStatus) {
    return {
      error:
        'payload.temperatura, payload.score, payload.tier, payload.qualification_summary and payload.target_status are required for lead.classified.',
      data: null,
    }
  }

  return {
    error: null,
    data: {
      event_id: common.data.event_id,
      event_type: 'lead.classified',
      event_version: common.data.event_version,
      source: common.data.source,
      occurred_at: common.data.occurred_at,
      lead: common.data.lead,
      payload: {
        temperatura,
        score: parsedScore,
        tier,
        qualification_summary: qualificationSummary,
        target_status: targetStatus,
        handoff_summary: handoffSummary,
        handoff_priority: handoffPriority,
      },
      metadata: common.data.metadata,
    } satisfies CanonicalLeadEventEnvelope<'lead.classified'>,
  }
}

async function findRecordedIntegrationEvent(eventId: string) {
  const { data, error } = await supabaseAdmin
    ()
    .from('integration_events')
    .select('lead_id')
    .eq('event_id', eventId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as DuplicateIntegrationEventRecord | null) ?? null
}

async function findMessageByExternalMessageId(externalMessageId: string) {
  const { data, error } = await supabaseAdmin
    ()
    .from('messages')
    .select('lead_id')
    .eq('external_message_id', externalMessageId)
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as DuplicateMessageRecord | null) ?? null
}

async function findLead(ownerUserId: string, externalSessionId: string) {
  const { data, error } = await supabaseAdmin
    ()
    .from('leads')
    .select(
      'id, user_id, phone_number, external_session_id, lead_name, current_status, current_classification, last_classification_at, last_status_changed_at'
    )
    .eq('user_id', ownerUserId)
    .eq('external_session_id', externalSessionId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as LeadRecord | null) ?? null
}

async function updateLeadIdentity(leadId: number, leadRef: CanonicalLeadRef) {
  const leadUpdate: Record<string, unknown> = {}

  if (leadRef.lead_name) {
    leadUpdate.lead_name = leadRef.lead_name
  }

  if (leadRef.phone_number) {
    leadUpdate.phone_number = leadRef.phone_number
  }

  if (Object.keys(leadUpdate).length === 0) {
    return
  }

  const { error } = await supabaseAdmin().from('leads').update(leadUpdate).eq('id', leadId)

  if (error) {
    throw error
  }
}

async function createLead(ownerUserId: string, leadRef: CanonicalLeadRef) {
  const { data, error } = await supabaseAdmin
    ()
    .from('leads')
    .insert({
      user_id: ownerUserId,
      lead_name: leadRef.lead_name || null,
      phone_number: leadRef.phone_number || null,
      external_session_id: leadRef.external_session_id,
      current_status: 'novo',
      current_classification: 'frio',
    })
    .select(
      'id, user_id, phone_number, external_session_id, lead_name, current_status, current_classification, last_classification_at, last_status_changed_at'
    )
    .single()

  if (!error) {
    return { lead: data as LeadRecord, created: true }
  }

  if (error.code === '23505') {
    const existingLead = await findLead(ownerUserId, leadRef.external_session_id)

    if (existingLead) {
      await updateLeadIdentity(existingLead.id, leadRef)
      return { lead: existingLead, created: false }
    }
  }

  throw error
}

async function ensureLeadForInbound(ownerUserId: string, leadRef: CanonicalLeadRef) {
  const existingLead = await findLead(ownerUserId, leadRef.external_session_id)

  if (existingLead) {
    await updateLeadIdentity(existingLead.id, leadRef)
    return { lead: existingLead, created: false }
  }

  return createLead(ownerUserId, leadRef)
}

async function requireExistingLead(ownerUserId: string, leadRef: CanonicalLeadRef) {
  const lead = await findLead(ownerUserId, leadRef.external_session_id)

  if (!lead) {
    throw new Error(`Lead not found for external_session_id "${leadRef.external_session_id}".`)
  }

  await updateLeadIdentity(lead.id, leadRef)
  return lead
}

async function recordIntegrationEvent(leadId: number, event: CanonicalLeadEventEnvelope) {
  const { error } = await supabaseAdmin().from('integration_events').insert({
    event_id: event.event_id,
    lead_id: leadId,
    event_type: event.event_type,
    event_version: event.event_version,
    source: event.source,
    occurred_at: parseOccurredAt(event.occurred_at),
    payload: event.payload,
    metadata: event.metadata,
  })

  if (!error) {
    return { duplicate: false }
  }

  if (error.code === '23505') {
    return { duplicate: true }
  }

  throw error
}

async function createNotification(
  ownerUserId: string,
  leadId: number,
  type: 'lead_created' | 'handoff_requested',
  title: string,
  body: string,
  metadata: EventMetadata
) {
  const { error } = await supabaseAdmin().from('notifications').insert({
    user_id: ownerUserId,
    lead_id: leadId,
    type,
    title,
    body,
    metadata,
  })

  if (error) {
    throw error
  }
}

async function createMessage(
  leadId: number,
  payload: MessageCreatedPayload,
  metadata: EventMetadata,
  occurredAt: string
) {
  const { error } = await supabaseAdmin().from('messages').insert({
    lead_id: leadId,
    sender_type: payload.sender_type,
    message_content: payload.message_content,
    message_direction: payload.direction,
    content_type: payload.content_type,
    external_message_id: payload.external_message_id,
    metadata,
    created_at: parseOccurredAt(occurredAt),
  })

  if (!error) {
    return true
  }

  if (error.code === '23505') {
    return false
  }

  throw error
}

async function updateLeadMessageSnapshot(
  leadId: number,
  payload: MessageCreatedPayload,
  occurredAt: string
) {
  const { error } = await supabaseAdmin
    ()
    .from('leads')
    .update({
      last_message_at: parseOccurredAt(occurredAt),
      last_message_preview: truncatePreview(payload.message_content),
    })
    .eq('id', leadId)

  if (error) {
    throw error
  }
}

async function insertLeadStatusEvent(
  leadId: number,
  event: CanonicalLeadEventEnvelope<'lead.classified'>,
  fromStatus: LeadOperationalStatus | null,
  toStatus: LeadOperationalStatus
) {
  const reasonCode =
    toStatus === 'aguardando_humano'
      ? 'classified_handoff_requested'
      : 'classified_target_status_applied'

  const { error } = await supabaseAdmin().from('lead_status_events').insert({
    lead_id: leadId,
    source_event_id: event.event_id,
    source: event.source,
    from_status: fromStatus,
    to_status: toStatus,
    reason_code: reasonCode,
    reason_text: event.payload.qualification_summary,
    occurred_at: parseOccurredAt(event.occurred_at),
  })

  if (error && error.code !== '23505') {
    throw error
  }
}

async function openPendingHandoff(
  ownerUserId: string,
  lead: LeadRecord,
  event: CanonicalLeadEventEnvelope<'lead.classified'>
) {
  const { data: latestHandoff, error: handoffLookupError } = await supabaseAdmin
    ()
    .from('lead_handoffs')
    .select('id')
    .eq('lead_id', lead.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (handoffLookupError) {
    throw handoffLookupError
  }

  if (latestHandoff && lead.current_status !== 'encerrado') {
    return false
  }

  const handoffSummary = event.payload.handoff_summary || event.payload.qualification_summary
  const handoffPriority = event.payload.handoff_priority || 'normal'

  const { error } = await supabaseAdmin().from('lead_handoffs').insert({
    lead_id: lead.id,
    summary_context: handoffSummary,
    priority: handoffPriority,
    requested_by: 'ai',
    source_event_id: event.event_id,
    created_at: parseOccurredAt(event.occurred_at),
  })

  if (error) {
    if (error.code === '23505') {
      return false
    }

    throw error
  }

  await createNotification(
    ownerUserId,
    lead.id,
    'handoff_requested',
    'Lead aguardando atendimento humano',
    handoffSummary,
    {
      ...event.metadata,
      source: event.source,
      event_type: event.event_type,
      target_status: event.payload.target_status,
      priority: handoffPriority,
    }
  )

  return true
}

async function applyClassificationEvent(
  ownerUserId: string,
  lead: LeadRecord,
  event: CanonicalLeadEventEnvelope<'lead.classified'>
) {
  const occurredAt = parseOccurredAt(event.occurred_at)
  const nextStatus = event.payload.target_status
  const shouldRecordStatusChange = lead.current_status !== nextStatus

  const { error } = await supabaseAdmin
    ()
    .from('leads')
    .update({
      current_classification: event.payload.temperatura,
      score_total: event.payload.score,
      lead_tier: event.payload.tier,
      qualification_summary: event.payload.qualification_summary,
      last_classification_at: occurredAt,
      current_status: nextStatus,
      last_status_changed_at: shouldRecordStatusChange ? occurredAt : lead.last_status_changed_at,
    })
    .eq('id', lead.id)

  if (error) {
    throw error
  }

  if (lead.current_classification && lead.current_classification !== event.payload.temperatura) {
    const { error: classificationHistoryError } = await supabaseAdmin()
      .from('lead_classification_events')
      .insert({
        lead_id: lead.id,
        previous_classification: lead.current_classification,
        new_classification: event.payload.temperatura,
        reason: event.payload.qualification_summary,
      })

    if (classificationHistoryError) {
      throw classificationHistoryError
    }
  }

  if (shouldRecordStatusChange) {
    await insertLeadStatusEvent(lead.id, event, lead.current_status, nextStatus)
  }

  if (nextStatus !== 'aguardando_humano') {
    return false
  }

  return openPendingHandoff(ownerUserId, lead, event)
}

function buildDuplicateResult(
  leadId: number,
  eventType: SupportedIntegrationEventType
): ProcessResult {
  return {
    leadId,
    eventType,
    createdLead: false,
    createdMessage: false,
    createdNotification: false,
    duplicateEvent: true,
  }
}

async function processMessageCreatedEvent(
  ownerUserId: string,
  event: CanonicalLeadEventEnvelope<'message.created'>
) {
  const duplicateByMessage = await findMessageByExternalMessageId(event.payload.external_message_id)

  if (duplicateByMessage) {
    return buildDuplicateResult(duplicateByMessage.lead_id, event.event_type)
  }

  const { lead, created } =
    event.payload.direction === 'inbound'
      ? await ensureLeadForInbound(ownerUserId, event.lead)
      : { lead: await requireExistingLead(ownerUserId, event.lead), created: false }

  const createdMessage = await createMessage(
    lead.id,
    event.payload,
    {
      ...event.metadata,
      source: event.source,
    },
    event.occurred_at
  )

  if (!createdMessage) {
    return buildDuplicateResult(lead.id, event.event_type)
  }

  await updateLeadMessageSnapshot(lead.id, event.payload, event.occurred_at)

  const recordedEvent = await recordIntegrationEvent(lead.id, event)

  if (recordedEvent.duplicate) {
    return buildDuplicateResult(lead.id, event.event_type)
  }

  let createdNotification = false

  if (created && event.payload.direction === 'inbound') {
    const displayName =
      event.lead.lead_name || event.lead.phone_number || event.lead.external_session_id

    await createNotification(
      ownerUserId,
      lead.id,
      'lead_created',
      'Novo lead recebido',
      `Lead ${displayName} entrou pelo atendimento do WhatsApp.`,
      {
        ...event.metadata,
        source: event.source,
        event_type: event.event_type,
        external_session_id: event.lead.external_session_id,
      }
    )

    createdNotification = true
  }

  return {
    leadId: lead.id,
    eventType: event.event_type,
    createdLead: created,
    createdMessage: true,
    createdNotification,
    duplicateEvent: false,
  } satisfies ProcessResult
}

export async function processLeadEvent(event: CanonicalLeadEventEnvelope): Promise<ProcessResult> {
  const ownerUserId = normalizeString(process.env.N8N_LEAD_OWNER_USER_ID)

  if (!ownerUserId) {
    throw new Error('N8N_LEAD_OWNER_USER_ID is not configured')
  }

  const duplicateByEvent = await findRecordedIntegrationEvent(event.event_id)

  if (duplicateByEvent) {
    return buildDuplicateResult(duplicateByEvent.lead_id, event.event_type)
  }

  if (isMessageCreatedEvent(event)) {
    const result = await processMessageCreatedEvent(ownerUserId, event)

    if (!result.duplicateEvent) {
      revalidatePath('/')
      revalidatePath(`/leads/${result.leadId}`)
    }

    return result
  }

  if (!isLeadClassifiedEvent(event)) {
    throw new Error(`Unsupported event type "${event.event_type}".`)
  }

  const lead = await requireExistingLead(ownerUserId, event.lead)
  const recordedEvent = await recordIntegrationEvent(lead.id, event)

  if (recordedEvent.duplicate) {
    return buildDuplicateResult(lead.id, event.event_type)
  }

  const createdNotification = await applyClassificationEvent(ownerUserId, lead, event)

  revalidatePath('/')
  revalidatePath(`/leads/${lead.id}`)

  return {
    leadId: lead.id,
    eventType: event.event_type,
    createdLead: false,
    createdMessage: false,
    createdNotification,
    duplicateEvent: false,
  }
}

export function badRequest(message: string) {
  return buildValidationError(message)
}
