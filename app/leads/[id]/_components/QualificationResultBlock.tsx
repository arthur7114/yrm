import { Flame, Snowflake, SparklesIcon } from 'lucide-react'

type QualificationResult = {
    id: number
    classification: string
    confidence_reason: string
}

function getClassificationStyling(cls: string) {
    const lower = cls.toLowerCase()
    if (lower === 'frio') {
        return {
            badgeClass: 'border-[rgba(78,122,148,0.28)] bg-[var(--yrm-cold-soft)] text-[var(--yrm-cold)]',
            icon: <Snowflake className="h-3.5 w-3.5" />,
            label: 'Lead frio',
        }
    }
    if (lower === 'morno') {
        return {
            badgeClass: 'border-[rgba(201,133,29,0.3)] bg-[var(--yrm-warm-soft)] text-[var(--yrm-warm)]',
            icon: <SparklesIcon className="h-3.5 w-3.5" />,
            label: 'Lead morno',
        }
    }
    if (lower === 'quente') {
        return {
            badgeClass: 'border-[rgba(178,74,63,0.28)] bg-[var(--yrm-danger-soft)] text-[var(--yrm-danger)]',
            icon: <Flame className="h-3.5 w-3.5" />,
            label: 'Lead quente',
        }
    }
    return {
        badgeClass: 'border-[var(--yrm-border)] bg-[var(--yrm-surface-strong)] text-[var(--yrm-muted)]',
        icon: null,
        label: cls,
    }
}

export default function QualificationResultBlock({ result }: { result: QualificationResult }) {
    const { badgeClass, icon, label } = getClassificationStyling(result.classification)

    return (
        <div className="yrm-panel overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-[rgba(183,166,148,0.5)] bg-[var(--yrm-surface-strong)] px-6 py-4">
                <div>
                    <p className="yrm-kicker">Qualificação</p>
                    <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[var(--yrm-ink)]">
                        Leitura comercial atual
                    </h3>
                </div>
                <div className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${badgeClass}`}>
                    {icon} {label}
                </div>
            </div>

            <div className="space-y-3 p-6">
                <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--yrm-muted-soft)]">
                    Justificativa consolidada
                </p>
                <p className="rounded-2xl border border-[var(--yrm-border)] bg-[rgba(252,250,247,0.86)] p-4 text-sm leading-6 text-[var(--yrm-ink)]">
                    {result.confidence_reason}
                </p>
            </div>
        </div>
    )
}
