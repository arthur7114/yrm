import { Clock3, GitBranchPlus, MessageSquare, Tags, UserRoundPlus } from 'lucide-react'

import { leadStatusLabels, normalizeLeadStatus } from '@/lib/lead-domain'

import type { LeadOperationalEvent } from '../actions'

function formatTimestamp(value: string) {
    return new Date(value).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function getEventCopy(event: LeadOperationalEvent) {
    const payload = event.payload || {}

    switch (event.event_type) {
        case 'lead.created':
            return {
                title: 'Lead criado',
                description: 'Lead registrado no app a partir do fluxo canônico.',
                Icon: UserRoundPlus,
            }
        case 'message.created':
            return {
                title: payload.direction === 'outbound' ? 'Mensagem outbound' : 'Mensagem inbound',
                description:
                    typeof payload.message_content === 'string'
                        ? payload.message_content
                        : 'Mensagem registrada na timeline.',
                Icon: MessageSquare,
            }
        case 'lead.classified':
            return {
                title: 'Lead classificado',
                description: `Temperatura ${String(payload.temperatura || 'indefinida')}. ${String(payload.qualification_summary || '')}`.trim(),
                Icon: Tags,
            }
        case 'lead.status_changed': {
            const fromStatus = normalizeLeadStatus(
                typeof payload.from_status === 'string' ? payload.from_status : null
            )
            const toStatus = normalizeLeadStatus(
                typeof payload.to_status === 'string' ? payload.to_status : null
            )
            const fromLabel = fromStatus ? leadStatusLabels[fromStatus] : 'sem status'
            const toLabel = toStatus ? leadStatusLabels[toStatus] : 'sem status'

            return {
                title: 'Status alterado',
                description: `${fromLabel} -> ${toLabel}`,
                Icon: GitBranchPlus,
            }
        }
        case 'lead.handoff_requested':
            return {
                title: 'Handoff solicitado',
                description:
                    typeof payload.handoff_summary === 'string'
                        ? payload.handoff_summary
                        : 'Transferência para atendimento humano solicitada.',
                Icon: GitBranchPlus,
            }
        default:
            return {
                title: event.event_type,
                description: 'Evento operacional registrado.',
                Icon: Clock3,
            }
    }
}

export default function OperationalEventsCard({ events }: { events: LeadOperationalEvent[] }) {
    if (!events.length) {
        return null
    }

    return (
        <div className="yrm-panel overflow-hidden rounded-2xl">
            <div className="flex items-center gap-2 border-b border-[rgba(183,166,148,0.5)] bg-[var(--yrm-surface-strong)] px-6 py-4">
                <Clock3 className="h-4 w-4 text-[var(--yrm-muted)]" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--yrm-ink)]">
                    Eventos operacionais
                </h3>
                <span className="ml-auto font-mono text-xs uppercase tracking-[0.16em] text-[var(--yrm-muted-soft)]">
                    {events.length} eventos
                </span>
            </div>
            <div className="max-h-[360px] divide-y divide-[rgba(183,166,148,0.4)] overflow-y-auto">
                {events.map((event) => {
                    const copy = getEventCopy(event)

                    return (
                        <div key={event.event_id} className="space-y-2 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <copy.Icon className="h-4 w-4 text-[var(--yrm-muted)]" />
                                <p className="text-sm font-medium text-[var(--yrm-ink)]">{copy.title}</p>
                                <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--yrm-muted-soft)]">
                                    {formatTimestamp(event.occurred_at)}
                                </span>
                            </div>
                            <p className="text-sm leading-6 text-[var(--yrm-muted)]">{copy.description}</p>
                            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--yrm-muted-soft)]">
                                <span>{event.source}</span>
                                <span>•</span>
                                <span>{event.event_type}</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
