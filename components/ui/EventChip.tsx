const sourceLabels: Record<string, string> = {
    n8n: 'Evento n8n',
    app: 'Evento app',
}

export default function EventChip({ source }: { source: string | null | undefined }) {
    const normalized = source?.trim().toLowerCase()
    if (!normalized) return null

    return (
        <span className="inline-flex items-center rounded-md border border-[var(--yrm-border)] bg-[var(--yrm-surface-strong)] px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--yrm-muted)]">
            {sourceLabels[normalized] || normalized}
        </span>
    )
}
