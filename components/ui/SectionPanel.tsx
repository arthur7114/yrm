import type { ReactNode } from 'react'

type SectionPanelProps = {
    title: string
    description?: string
    aside?: ReactNode
    children: ReactNode
    className?: string
}

export default function SectionPanel({
    title,
    description,
    aside,
    children,
    className = '',
}: SectionPanelProps) {
    return (
        <section className={`yrm-panel overflow-hidden rounded-2xl ${className}`.trim()}>
            <header className="flex flex-col gap-4 border-b border-[var(--yrm-border)] px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
                <div className="space-y-1">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--yrm-ink)]">
                        {title}
                    </h2>
                    {description ? (
                        <p className="max-w-2xl text-sm leading-6 text-[var(--yrm-muted)]">{description}</p>
                    ) : null}
                </div>
                {aside ? <div className="text-sm text-[var(--yrm-muted)]">{aside}</div> : null}
            </header>
            <div className="px-5 py-5 sm:px-6">{children}</div>
        </section>
    )
}
