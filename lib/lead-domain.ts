export const LEAD_EVENT_TYPES = [
  'lead.created',
  'message.created',
  'lead.classified',
  'lead.status_changed',
  'lead.handoff_requested',
] as const

export const LEAD_OPERATIONAL_STATUSES = [
  'novo',
  'em_qualificacao',
  'aguardando_humano',
  'em_atendimento_humano',
  'encerrado',
] as const

export const LEAD_TEMPERATURES = ['frio', 'morno', 'quente'] as const
export const LEAD_TIERS = ['A', 'B', 'C'] as const
export const MESSAGE_DIRECTIONS = ['inbound', 'outbound'] as const
export const MESSAGE_SENDER_TYPES = ['lead', 'automacao', 'humano', 'system'] as const

export type LeadEventType = (typeof LEAD_EVENT_TYPES)[number]
export type LeadOperationalStatus = (typeof LEAD_OPERATIONAL_STATUSES)[number]
export type LeadTemperature = (typeof LEAD_TEMPERATURES)[number]
export type LeadTier = (typeof LEAD_TIERS)[number]
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number]
export type MessageSenderType = (typeof MESSAGE_SENDER_TYPES)[number]

const legacyStatusMap: Record<string, LeadOperationalStatus> = {
  aguardando_classificacao: 'novo',
  em_processamento: 'em_qualificacao',
  classificado: 'em_qualificacao',
  aguardando_contato_humano: 'aguardando_humano',
  encaminhado_humano: 'aguardando_humano',
  agendado: 'encerrado',
}

export function normalizeLeadStatus(value: unknown): LeadOperationalStatus | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return null
  }

  if (LEAD_OPERATIONAL_STATUSES.includes(normalized as LeadOperationalStatus)) {
    return normalized as LeadOperationalStatus
  }

  return legacyStatusMap[normalized] ?? null
}

export function normalizeLeadTemperature(value: unknown): LeadTemperature | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return LEAD_TEMPERATURES.includes(normalized as LeadTemperature)
    ? (normalized as LeadTemperature)
    : null
}

export function normalizeLeadTier(value: unknown): LeadTier | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toUpperCase()
  return LEAD_TIERS.includes(normalized as LeadTier) ? (normalized as LeadTier) : null
}

export const HANDOFF_MODES = ['ia', 'humano'] as const
export type HandoffMode = (typeof HANDOFF_MODES)[number]

export function isHumanOwnedStatus(status: LeadOperationalStatus | null | undefined) {
  return status === 'em_atendimento_humano' || status === 'encerrado'
}

/** Returns true when the lead is under human attendance (AI must not reply). */
export function isHumanHandoff(isHumanHandoffFlag: boolean | null | undefined): boolean {
  return isHumanHandoffFlag === true
}

/** Returns true when the lead is still being handled by AI. */
export function isAiHandoff(isHumanHandoffFlag: boolean | null | undefined): boolean {
  return !isHumanHandoffFlag
}

/** Map the boolean toggle to a readable display value. */
export function handoffModeLabel(isHumanHandoffFlag: boolean | null | undefined): string {
  return isHumanHandoffFlag ? 'Humano' : 'IA'
}

export function isWaitingHumanStatus(status: LeadOperationalStatus | null | undefined) {
  return status === 'aguardando_humano'
}

export const leadStatusLabels: Record<LeadOperationalStatus, string> = {
  novo: 'Novo',
  em_qualificacao: 'Em qualificação',
  aguardando_humano: 'Aguardando humano',
  em_atendimento_humano: 'Em atendimento humano',
  encerrado: 'Encerrado',
}
