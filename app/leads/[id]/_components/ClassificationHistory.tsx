import { ArrowRight, Clock, History } from 'lucide-react'

import { ClassificationEvent } from '../actions'

const classificationConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    frio: { label: 'Frio', color: 'text-[var(--yrm-cold)]', bg: 'bg-[var(--yrm-cold-soft)]', border: 'border-[rgba(78,122,148,0.28)]' },
    morno: { label: 'Morno', color: 'text-[var(--yrm-warm)]', bg: 'bg-[var(--yrm-warm-soft)]', border: 'border-[rgba(201,133,29,0.3)]' },
    quente: { label: 'Quente', color: 'text-[var(--yrm-danger)]', bg: 'bg-[var(--yrm-danger-soft)]', border: 'border-[rgba(178,74,63,0.28)]' },
}

function getConfig(cls: string) {
    return classificationConfig[cls?.toLowerCase()] || {
        label: cls,
        color: 'text-[var(--yrm-muted)]',
        bg: 'bg-[var(--yrm-surface-strong)]',
        border: 'border-[var(--yrm-border)]',
    }
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function ClassificationHistory({ events }: { events: ClassificationEvent[] }) {
    if (!events || events.length === 0) {
        return null
    }

    return (
        <div className="yrm-panel overflow-hidden rounded-2xl">
            <div className="flex items-center gap-2 border-b border-[rgba(183,166,148,0.5)] bg-[var(--yrm-surface-strong)] px-6 py-4">
                <History className="h-4 w-4 text-[var(--yrm-muted)]" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--yrm-ink)]">
                    Histórico de classificação
                </h3>
                <span className="ml-auto font-mono text-xs uppercase tracking-[0.16em] text-[var(--yrm-muted-soft)]">
                    {events.length} mudanças
                </span>
            </div>

            <div className="max-h-[320px] divide-y divide-[rgba(183,166,148,0.4)] overflow-y-auto">
                {events.map((event) => {
                    const prevConfig = getConfig(event.previous_classification)
                    const nextConfig = getConfig(event.new_classification)

                    return (
                        <div key={event.id} className="space-y-2 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${prevConfig.bg} ${prevConfig.color} ${prevConfig.border}`}>
                                    {prevConfig.label}
                                </span>
                                <ArrowRight className="h-3 w-3 text-[var(--yrm-muted-soft)]" />
                                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${nextConfig.bg} ${nextConfig.color} ${nextConfig.border}`}>
                                    {nextConfig.label}
                                </span>
                            </div>

                            {event.reason ? (
                                <p className="text-sm leading-6 text-[var(--yrm-muted)]">{event.reason}</p>
                            ) : null}

                            <div className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--yrm-muted-soft)]">
                                <Clock className="h-3 w-3" />
                                {formatDate(event.created_at)}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
