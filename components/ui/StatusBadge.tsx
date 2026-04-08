import { leadStatusLabels, normalizeLeadStatus } from '@/lib/lead-domain'

const statusStyles: Record<string, string> = {
    novo: 'border-[var(--yrm-border)] bg-[rgba(255,255,255,0.03)] text-[var(--yrm-ink)]',
    em_qualificacao: 'border-[rgba(78,122,148,0.28)] bg-[var(--yrm-cold-soft)] text-[var(--yrm-cold)]',
    aguardando_humano: 'border-[rgba(201,133,29,0.3)] bg-[var(--yrm-warm-soft)] text-[var(--yrm-warm)]',
    em_atendimento_humano: 'border-[rgba(47,106,85,0.3)] bg-[var(--yrm-human-soft)] text-[var(--yrm-human)]',
    encerrado: 'border-[rgba(154,169,188,0.18)] bg-[rgba(154,169,188,0.08)] text-[var(--yrm-muted)]',
}

export default function StatusBadge({ status }: { status: string | null | undefined }) {
    const normalizedStatus = normalizeLeadStatus(status)
    const label = normalizedStatus ? leadStatusLabels[normalizedStatus] : 'Sem status'
    const badgeClass = normalizedStatus
        ? statusStyles[normalizedStatus]
        : 'border-[var(--yrm-border)] bg-[rgba(255,255,255,0.03)] text-[var(--yrm-muted)]'

    return (
        <span
            className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${badgeClass}`}
        >
            {label}
        </span>
    )
}
