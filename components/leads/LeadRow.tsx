import Link from 'next/link'

import EventChip from '@/components/ui/EventChip'
import StatusBadge from '@/components/ui/StatusBadge'
import TemperatureBadge from '@/components/ui/TemperatureBadge'

type LeadRowProps = {
    lead: {
        id: number
        lead_name?: string | null
        phone_number?: string | null
        current_classification?: string | null
        current_status?: string | null
        created_at: string
        last_message_at?: string | null
        last_message_preview?: string | null
        lastSource?: string | null
    }
    href: string
}

function formatActivity(dateValue: string) {
    return new Date(dateValue).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function LeadRow({ lead, href }: LeadRowProps) {
    const displayName = lead.lead_name || lead.phone_number || 'Lead sem identificação'
    const activityDate = lead.last_message_at || lead.created_at

    return (
        <Link
            href={href}
            className="block rounded-2xl border border-[var(--yrm-border)] bg-[rgba(252,250,247,0.94)] p-4 hover:border-[var(--yrm-border-strong)] hover:shadow-[var(--yrm-shadow)]"
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--yrm-ink)]">
                            {displayName}
                        </h3>
                        <TemperatureBadge temperature={lead.current_classification} />
                        <StatusBadge status={lead.current_status} />
                        <EventChip source={lead.lastSource} />
                    </div>

                    <div className="grid gap-2 text-sm text-[var(--yrm-muted)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                        <div className="space-y-1">
                            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--yrm-muted-soft)]">
                                Última mensagem
                            </p>
                            <p className="line-clamp-2 leading-6 text-[var(--yrm-ink)]">
                                {lead.last_message_preview || 'Sem preview operacional até o momento.'}
                            </p>
                        </div>
                        <div className="space-y-1 text-left sm:text-right">
                            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--yrm-muted-soft)]">
                                Última atividade
                            </p>
                            <p className="font-mono text-sm text-[var(--yrm-ink)]">{formatActivity(activityDate)}</p>
                        </div>
                    </div>
                </div>

                <div className="min-w-[11rem] rounded-xl border border-[rgba(183,166,148,0.45)] bg-[var(--yrm-surface)] px-4 py-3">
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--yrm-muted-soft)]">
                        Contato
                    </p>
                    <p className="mt-1 break-all text-sm font-medium text-[var(--yrm-ink)]">
                        {lead.phone_number || 'Sem telefone'}
                    </p>
                </div>
            </div>
        </Link>
    )
}
