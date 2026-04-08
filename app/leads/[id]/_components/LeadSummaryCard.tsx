import StatusBadge from '@/components/ui/StatusBadge'
import TemperatureBadge from '@/components/ui/TemperatureBadge'

import { LeadDetails } from '../actions'

export default function LeadSummaryCard({ lead }: { lead: LeadDetails }) {
    const displayName = lead.lead_name || lead.phone_number || 'Lead sem identificação'
    const displayDate = new Date(lead.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })

    return (
        <div className="yrm-panel sticky top-24 overflow-hidden rounded-2xl">
            <div className="border-b border-[rgba(183,166,148,0.5)] bg-[var(--yrm-surface-strong)] px-6 py-5">
                <p className="yrm-kicker">Resumo do lead</p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--yrm-ink)]">
                    {displayName}
                </h2>
                {lead.lead_name && lead.phone_number ? (
                    <p className="mt-1 text-sm font-medium text-[var(--yrm-muted)]">{lead.phone_number}</p>
                ) : null}
            </div>

            <div className="space-y-5 px-6 py-6">
                <div className="space-y-2">
                    <p className="yrm-kicker">Temperatura atual</p>
                    <TemperatureBadge temperature={lead.current_classification} />
                </div>

                <div className="space-y-2">
                    <p className="yrm-kicker">Status operacional</p>
                    <StatusBadge status={lead.current_status} />
                </div>

                {lead.external_session_id ? (
                    <div className="space-y-1">
                        <p className="yrm-kicker">Sessão externa</p>
                        <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--yrm-muted)]">
                            {lead.external_session_id}
                        </p>
                    </div>
                ) : null}

                <div className="border-t border-[rgba(183,166,148,0.5)] pt-5">
                    <p className="yrm-kicker">Criado em</p>
                    <p className="mt-1 font-mono text-sm uppercase tracking-[0.14em] text-[var(--yrm-muted)]">
                        {displayDate}
                    </p>
                </div>
            </div>
        </div>
    )
}
