const temperatureStyles: Record<string, string> = {
    quente: 'border-[rgba(178,74,63,0.28)] bg-[var(--yrm-danger-soft)] text-[var(--yrm-danger)]',
    morno: 'border-[rgba(201,133,29,0.3)] bg-[var(--yrm-warm-soft)] text-[var(--yrm-warm)]',
    frio: 'border-[rgba(78,122,148,0.28)] bg-[var(--yrm-cold-soft)] text-[var(--yrm-cold)]',
}

export default function TemperatureBadge({
    temperature,
}: {
    temperature: string | null | undefined
}) {
    const normalized = temperature?.trim().toLowerCase() || ''
    const label = normalized ? normalized.toUpperCase() : 'SEM SINAL'
    const badgeClass = temperatureStyles[normalized] || 'border-[var(--yrm-border)] bg-[var(--yrm-surface-strong)] text-[var(--yrm-muted)]'

    return (
        <span
            className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${badgeClass}`}
        >
            {label}
        </span>
    )
}
