import type { ReactNode } from 'react'

type MetricCardProps = {
    label: string
    value: string
    note?: string
    icon?: ReactNode
    tone?: 'default' | 'accent' | 'warm' | 'danger' | 'cold' | 'human'
}

const toneClasses: Record<NonNullable<MetricCardProps['tone']>, string> = {
    default: 'border-[var(--yrm-border)] bg-[var(--yrm-surface)] text-[var(--yrm-ink)]',
    accent: 'border-[rgba(255,122,61,0.22)] bg-[rgba(255,122,61,0.08)] text-[var(--yrm-accent-strong)]',
    warm: 'border-[rgba(201,133,29,0.3)] bg-[var(--yrm-warm-soft)] text-[var(--yrm-warm)]',
    danger: 'border-[rgba(178,74,63,0.28)] bg-[var(--yrm-danger-soft)] text-[var(--yrm-danger)]',
    cold: 'border-[rgba(78,122,148,0.28)] bg-[var(--yrm-cold-soft)] text-[var(--yrm-cold)]',
    human: 'border-[rgba(47,106,85,0.28)] bg-[var(--yrm-human-soft)] text-[var(--yrm-human)]',
}

export default function MetricCard({
    label,
    value,
    note,
    icon,
    tone = 'default',
}: MetricCardProps) {
    return (
        <article className={`rounded-[1.6rem] border p-5 ${toneClasses[tone]}`}>
            <div className="mb-6 flex items-start justify-between gap-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">{label}</p>
                {icon ? (
                    <div className="rounded-xl border border-current/12 bg-black/10 p-2 opacity-90">
                        {icon}
                    </div>
                ) : null}
            </div>
            <div className="space-y-1">
                <p className="font-mono text-3xl font-semibold tracking-[-0.06em]">{value}</p>
                {note ? <p className="text-sm leading-6 text-[var(--yrm-muted)]">{note}</p> : null}
            </div>
        </article>
    )
}
