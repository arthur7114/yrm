import type { ReactNode } from 'react'

type EmptyStateProps = {
    title: string
    description: string
    action?: ReactNode
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
    return (
        <div className="yrm-grid flex min-h-52 flex-col items-start justify-between rounded-2xl border border-dashed border-[var(--yrm-border-strong)] bg-[rgba(252,250,247,0.84)] p-6">
            <div className="max-w-xl space-y-3">
                <p className="yrm-kicker">Estado inicial</p>
                <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--yrm-ink)]">{title}</h3>
                <p className="text-sm leading-6 text-[var(--yrm-muted)]">{description}</p>
            </div>
            {action ? <div className="pt-6">{action}</div> : null}
        </div>
    )
}
