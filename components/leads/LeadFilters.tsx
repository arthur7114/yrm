import Link from 'next/link'

type LeadFiltersProps = {
    query?: string
    status?: string
    temperature?: string
    range?: string
}

const rangeOptions = [
    { value: 'all', label: 'Todo o histórico' },
    { value: '7', label: '7 dias' },
    { value: '30', label: '30 dias' },
    { value: '90', label: '90 dias' },
]

const statusOptions = [
    { value: '', label: 'Todos os status' },
    { value: 'novo', label: 'Novo' },
    { value: 'em_qualificacao', label: 'Em qualificação' },
    { value: 'aguardando_humano', label: 'Aguardando humano' },
    { value: 'em_atendimento_humano', label: 'Em atendimento humano' },
    { value: 'encerrado', label: 'Encerrado' },
]

const temperatureOptions = [
    { value: '', label: 'Todas as temperaturas' },
    { value: 'quente', label: 'Quente' },
    { value: 'morno', label: 'Morno' },
    { value: 'frio', label: 'Frio' },
]

export default function LeadFilters({
    query = '',
    status = '',
    temperature = '',
    range = '30',
}: LeadFiltersProps) {
    return (
        <form method="GET" className="grid gap-3 lg:grid-cols-[1.8fr_repeat(3,minmax(0,1fr))]">
            <label className="space-y-2">
                <span className="yrm-kicker">Busca</span>
                <input
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="Nome ou telefone"
                    className="w-full rounded-2xl border border-[var(--yrm-border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--yrm-ink)] placeholder:text-[var(--yrm-muted-soft)]"
                />
            </label>

            <label className="space-y-2">
                <span className="yrm-kicker">Período</span>
                <select
                    name="range"
                    defaultValue={range}
                    className="w-full rounded-2xl border border-[var(--yrm-border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--yrm-ink)]"
                >
                    {rangeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </label>

            <label className="space-y-2">
                <span className="yrm-kicker">Status</span>
                <select
                    name="status"
                    defaultValue={status}
                    className="w-full rounded-2xl border border-[var(--yrm-border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--yrm-ink)]"
                >
                    {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </label>

            <label className="space-y-2">
                <span className="yrm-kicker">Temperatura</span>
                <select
                    name="temperature"
                    defaultValue={temperature}
                    className="w-full rounded-2xl border border-[var(--yrm-border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--yrm-ink)]"
                >
                    {temperatureOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </label>

            <div className="flex items-end gap-3 lg:col-span-4">
                <button
                    type="submit"
                    className="rounded-2xl border border-[rgba(255,122,61,0.28)] bg-[var(--yrm-accent)] px-4 py-3 text-sm font-semibold text-[#090d14] hover:bg-[var(--yrm-accent-strong)]"
                >
                    Aplicar filtros
                </button>
                <Link
                    href="/leads"
                    className="rounded-2xl border border-[var(--yrm-border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm font-medium text-[var(--yrm-muted)] hover:border-[var(--yrm-border-strong)] hover:bg-[var(--yrm-surface-strong)] hover:text-[var(--yrm-ink)]"
                >
                    Limpar
                </Link>
            </div>
        </form>
    )
}
