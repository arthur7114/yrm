import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Activity, AlertTriangle, ArrowRight, Bot, ChartNoAxesColumn, Hand, Users } from 'lucide-react'

import AppShell from '@/components/app-shell/AppShell'
import MetricCard from '@/components/ui/MetricCard'
import SectionPanel from '@/components/ui/SectionPanel'
import EmptyState from '@/components/ui/EmptyState'
import StatusBadge from '@/components/ui/StatusBadge'
import TemperatureBadge from '@/components/ui/TemperatureBadge'
import { createClient } from '@/lib/supabase-server'
import { isHumanOwnedStatus, isWaitingHumanStatus, normalizeLeadStatus } from '@/lib/lead-domain'

type LeadRecord = {
    id: number
    lead_name: string | null
    phone_number: string | null
    current_classification: string | null
    current_status: string | null
    created_at: string
    last_message_at: string | null
    last_message_preview: string | null
    last_classification_at: string | null
}

type RangeValue = '7' | '30' | '90'

const rangeOptions: { value: RangeValue; label: string }[] = [
    { value: '7', label: '7 dias' },
    { value: '30', label: '30 dias' },
    { value: '90', label: '90 dias' },
]

function percentage(part: number, total: number) {
    if (!total) return '0%'
    return `${Math.round((part / total) * 100)}%`
}

function parseRange(value: string | undefined): RangeValue {
    return rangeOptions.some((option) => option.value === value) ? (value as RangeValue) : '30'
}

function formatDate(date: Date) {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export const dynamic = 'force-dynamic'

export default async function HomePage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const params = await searchParams
    const range = parseRange(typeof params.range === 'string' ? params.range : undefined)
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: leads, error } = await supabase
        .from('leads')
        .select(
            'id, lead_name, phone_number, current_classification, current_status, created_at, last_message_at, last_message_preview, last_classification_at'
        )
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

    if (error) {
        return (
            <AppShell
                eyebrow="Dashboard executivo"
                title="Falha ao carregar a operação"
                description="Não foi possível compor o painel executivo com os dados atuais."
            >
                <div className="rounded-2xl border border-[rgba(178,74,63,0.28)] bg-[var(--yrm-danger-soft)] p-6 text-sm text-[var(--yrm-danger)]">
                    {error.message}
                </div>
            </AppShell>
        )
    }

    const allLeads = (leads || []) as LeadRecord[]
    const periodStart = new Date()
    periodStart.setDate(periodStart.getDate() - Number(range) + 1)
    periodStart.setHours(0, 0, 0, 0)

    const cohort = allLeads.filter((lead) => new Date(lead.created_at) >= periodStart)
    const referenceTimestamp = cohort.reduce((latest, lead) => {
        const candidate = new Date(lead.last_message_at || lead.created_at).getTime()
        return Math.max(latest, candidate)
    }, periodStart.getTime())
    const qualified = cohort.filter((lead) => Boolean(lead.current_classification))
    const waitingHuman = cohort.filter((lead) => isWaitingHumanStatus(normalizeLeadStatus(lead.current_status)))
    const humanOwned = cohort.filter((lead) => normalizeLeadStatus(lead.current_status) === 'em_atendimento_humano')
    const closed = cohort.filter((lead) => normalizeLeadStatus(lead.current_status) === 'encerrado')
    const humanFlow = cohort.filter((lead) => {
        const status = normalizeLeadStatus(lead.current_status)
        return isWaitingHumanStatus(status) || isHumanOwnedStatus(status)
    })
    const hot = cohort.filter((lead) => lead.current_classification === 'quente')
    const warm = cohort.filter((lead) => lead.current_classification === 'morno')
    const cold = cohort.filter((lead) => lead.current_classification === 'frio')

    const series = Array.from({ length: Number(range) }, (_, index) => {
        const currentDate = new Date(periodStart)
        currentDate.setDate(periodStart.getDate() + index)
        const isoDate = currentDate.toISOString().split('T')[0]
        const received = cohort.filter((lead) => lead.created_at.startsWith(isoDate)).length
        const qualifiedOnDay = cohort.filter((lead) => lead.last_classification_at?.startsWith(isoDate)).length

        return {
            isoDate,
            label: formatDate(currentDate),
            received,
            qualified: qualifiedOnDay,
        }
    })

    const maxSeriesValue = Math.max(...series.flatMap((item) => [item.received, item.qualified]), 1)
    const staleUnclassified = cohort.filter((lead) => {
        const age = referenceTimestamp - new Date(lead.created_at).getTime()
        return !lead.current_classification && age > 1000 * 60 * 60 * 24
    })
    const hotAwaitingHuman = cohort.filter(
        (lead) => lead.current_classification === 'quente' && isWaitingHumanStatus(normalizeLeadStatus(lead.current_status))
    )
    const quietHumanQueue = cohort.filter((lead) => {
        const status = normalizeLeadStatus(lead.current_status)
        const lastActivity = new Date(lead.last_message_at || lead.created_at).getTime()
        return (isWaitingHumanStatus(status) || status === 'em_atendimento_humano') && referenceTimestamp - lastActivity > 1000 * 60 * 60 * 12
    })

    const alerts = [
        hotAwaitingHuman.length
            ? {
                  id: 'hot-awaiting',
                  title: `${hotAwaitingHuman.length} lead(s) quente(s) aguardando humano`,
                  body: 'Priorize atendimento para não perder janelas de conversão já qualificadas.',
                  tone: 'danger' as const,
              }
            : null,
        staleUnclassified.length
            ? {
                  id: 'stale-unclassified',
                  title: `${staleUnclassified.length} lead(s) sem classificação há mais de 24h`,
                  body: 'Revise o fluxo de qualificação para reduzir atraso entre entrada e leitura comercial.',
                  tone: 'warm' as const,
              }
            : null,
        quietHumanQueue.length
            ? {
                  id: 'quiet-human-queue',
                  title: `${quietHumanQueue.length} lead(s) em fila humana sem atividade recente`,
                  body: 'Verifique retomadas e gargalos na transição da automação para atendimento humano.',
                  tone: 'cold' as const,
              }
            : null,
    ].filter(Boolean) as { id: string; title: string; body: string; tone: 'danger' | 'warm' | 'cold' }[]

    const recentPriorityLeads = [...cohort]
        .sort((left, right) => {
            const leftWeight =
                (left.current_classification === 'quente' ? 100 : left.current_classification === 'morno' ? 40 : 0) +
                (isWaitingHumanStatus(normalizeLeadStatus(left.current_status)) ? 25 : 0)
            const rightWeight =
                (right.current_classification === 'quente' ? 100 : right.current_classification === 'morno' ? 40 : 0) +
                (isWaitingHumanStatus(normalizeLeadStatus(right.current_status)) ? 25 : 0)

            if (leftWeight !== rightWeight) return rightWeight - leftWeight

            return new Date(right.last_message_at || right.created_at).getTime() - new Date(left.last_message_at || left.created_at).getTime()
        })
        .slice(0, 5)

    return (
        <AppShell
            eyebrow="Dashboard executivo"
            title="Performance da operação"
            description="Acompanhe entrada, qualificação e passagem para humano a partir dos eventos que movem a carteira."
            actions={
                <div className="flex flex-wrap items-center gap-2">
                    {rangeOptions.map((option) => {
                        const isActive = option.value === range

                        return (
                            <Link
                                key={option.value}
                                href={`/?range=${option.value}`}
                                className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                                    isActive
                                        ? 'border-[var(--yrm-accent)] bg-[var(--yrm-accent)] text-white'
                                        : 'border-[var(--yrm-border)] bg-[var(--yrm-surface)] text-[var(--yrm-muted)] hover:border-[var(--yrm-border-strong)] hover:text-[var(--yrm-ink)]'
                                }`}
                            >
                                {option.label}
                            </Link>
                        )
                    })}
                </div>
            }
        >
            {allLeads.length === 0 ? (
                <EmptyState
                    title="A operação ainda não recebeu leads."
                    description="Assim que os eventos começarem a chegar, o dashboard passa a exibir funil, taxas e sinais de atenção."
                    action={
                        <Link
                            href="/settings"
                            className="rounded-xl border border-[var(--yrm-accent)] bg-[var(--yrm-accent)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--yrm-accent-strong)]"
                        >
                            Revisar configuração operacional
                        </Link>
                    }
                />
            ) : cohort.length === 0 ? (
                <EmptyState
                    title="Nenhum lead entrou na janela selecionada."
                    description="Amplie o período para voltar a enxergar funil, taxas e sinais da operação recente."
                />
            ) : (
                <div className="space-y-6">
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <MetricCard label="Leads recebidos" value={String(cohort.length)} note={`Janela ativa: ${range} dias`} icon={<Users size={18} />} tone="accent" />
                        <MetricCard label="Qualificados" value={String(qualified.length)} note={`Taxa: ${percentage(qualified.length, cohort.length)}`} icon={<Bot size={18} />} tone="warm" />
                        <MetricCard label="Aguardando humano" value={String(waitingHuman.length)} note="Fila para operação" icon={<Hand size={18} />} tone="danger" />
                        <MetricCard label="Em atendimento" value={String(humanOwned.length)} note="Carteira humana ativa" icon={<Activity size={18} />} tone="human" />
                        <MetricCard label="Encerrados" value={String(closed.length)} note={`Handoff: ${percentage(humanFlow.length, cohort.length)}`} icon={<ChartNoAxesColumn size={18} />} tone="default" />
                    </section>

                    <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                        <SectionPanel
                            title="Funil e taxas"
                            description="Leitura consolidada da qualidade e do avanço do pipeline dentro da janela selecionada."
                        >
                            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                                <div className="space-y-4">
                                    {[
                                        { label: 'Recebidos', value: cohort.length, tone: 'accent' },
                                        { label: 'Qualificados', value: qualified.length, tone: 'warm' },
                                        { label: 'Fluxo humano', value: humanFlow.length, tone: 'human' },
                                        { label: 'Encerrados', value: closed.length, tone: 'default' },
                                    ].map((item) => (
                                        <div key={item.label} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-[var(--yrm-ink)]">{item.label}</span>
                                                <span className="font-mono text-sm text-[var(--yrm-muted)]">{item.value}</span>
                                            </div>
                                            <div className="h-3 rounded-full bg-[var(--yrm-surface-strong)]">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        item.tone === 'accent'
                                                            ? 'bg-[var(--yrm-accent)]'
                                                            : item.tone === 'warm'
                                                              ? 'bg-[var(--yrm-warm)]'
                                                              : item.tone === 'human'
                                                                ? 'bg-[var(--yrm-human)]'
                                                                : 'bg-[var(--yrm-muted)]'
                                                    }`}
                                                    style={{ width: `${cohort.length ? (item.value / cohort.length) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-[var(--yrm-border)] bg-[var(--yrm-surface)] p-4">
                                        <p className="yrm-kicker">Taxa de qualificação</p>
                                        <p className="mt-2 font-mono text-4xl font-semibold tracking-[-0.05em] text-[var(--yrm-ink)]">
                                            {percentage(qualified.length, cohort.length)}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-[var(--yrm-border)] bg-[var(--yrm-surface)] p-4">
                                        <p className="yrm-kicker">Taxa de handoff</p>
                                        <p className="mt-2 font-mono text-4xl font-semibold tracking-[-0.05em] text-[var(--yrm-ink)]">
                                            {percentage(humanFlow.length, cohort.length)}
                                        </p>
                                    </div>
                                    <div className="space-y-3 rounded-2xl border border-[var(--yrm-border)] bg-[var(--yrm-surface)] p-4">
                                        <p className="yrm-kicker">Distribuição térmica</p>
                                        {[
                                            { label: 'Quente', value: hot.length, color: 'bg-[var(--yrm-danger)]' },
                                            { label: 'Morno', value: warm.length, color: 'bg-[var(--yrm-warm)]' },
                                            { label: 'Frio', value: cold.length, color: 'bg-[var(--yrm-cold)]' },
                                        ].map((item) => (
                                            <div key={item.label} className="space-y-1.5">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-[var(--yrm-ink)]">{item.label}</span>
                                                    <span className="font-mono text-[var(--yrm-muted)]">{percentage(item.value, qualified.length || cohort.length)}</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-[var(--yrm-surface-strong)]">
                                                    <div
                                                        className={`h-full rounded-full ${item.color}`}
                                                        style={{ width: `${qualified.length ? (item.value / qualified.length) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </SectionPanel>

                        <SectionPanel
                            title="Alertas operacionais"
                            description="Exceções que merecem leitura imediata antes de entrar na carteira."
                            aside={<Link href="/leads" className="inline-flex items-center gap-2 text-[var(--yrm-accent-strong)] hover:text-[var(--yrm-accent)]">Abrir leads <ArrowRight size={14} /></Link>}
                        >
                            {alerts.length ? (
                                <div className="space-y-3">
                                    {alerts.map((alert) => (
                                        <article
                                            key={alert.id}
                                            className={`rounded-2xl border p-4 ${
                                                alert.tone === 'danger'
                                                    ? 'border-[rgba(178,74,63,0.28)] bg-[var(--yrm-danger-soft)]'
                                                    : alert.tone === 'warm'
                                                      ? 'border-[rgba(201,133,29,0.3)] bg-[var(--yrm-warm-soft)]'
                                                      : 'border-[rgba(78,122,148,0.28)] bg-[var(--yrm-cold-soft)]'
                                            }`}
                                        >
                                            <div className="mb-2 flex items-center gap-2">
                                                <AlertTriangle size={16} className="text-[var(--yrm-ink)]" />
                                                <h3 className="text-sm font-semibold text-[var(--yrm-ink)]">{alert.title}</h3>
                                            </div>
                                            <p className="text-sm leading-6 text-[var(--yrm-muted)]">{alert.body}</p>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm leading-6 text-[var(--yrm-muted)]">
                                    Nenhum alerta crítico nesta janela. A operação está sem exceções de destaque.
                                </p>
                            )}
                        </SectionPanel>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                        <SectionPanel
                            title="Volume por período"
                            description="Comparação entre chegada de leads e classificação consolidada por dia."
                        >
                            <div className="grid grid-cols-2 gap-3">
                                {series.map((item) => (
                                    <div key={item.isoDate} className="rounded-2xl border border-[var(--yrm-border)] bg-[var(--yrm-surface)] p-3">
                                        <div className="mb-3 flex items-center justify-between">
                                            <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--yrm-muted-soft)]">
                                                {item.label}
                                            </span>
                                            <span className="font-mono text-xs text-[var(--yrm-muted)]">
                                                {item.received}/{item.qualified}
                                            </span>
                                        </div>
                                        <div className="flex h-24 items-end gap-2">
                                            <div className="flex flex-1 flex-col items-center gap-2">
                                                <div className="w-full rounded-t-md bg-[var(--yrm-accent)]" style={{ height: `${(item.received / maxSeriesValue) * 100}%` }} />
                                                <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--yrm-muted-soft)]">Entrada</span>
                                            </div>
                                            <div className="flex flex-1 flex-col items-center gap-2">
                                                <div className="w-full rounded-t-md bg-[var(--yrm-warm)]" style={{ height: `${(item.qualified / maxSeriesValue) * 100}%` }} />
                                                <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--yrm-muted-soft)]">Qualif.</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SectionPanel>

                        <SectionPanel
                            title="Leads em destaque"
                            description="Recorte dos leads com maior prioridade dentro da janela atual."
                        >
                            <div className="space-y-3">
                                {recentPriorityLeads.map((lead) => (
                                    <Link
                                        key={lead.id}
                                        href={`/leads/${lead.id}?from=${encodeURIComponent('/leads')}`}
                                        className="block rounded-2xl border border-[var(--yrm-border)] bg-[var(--yrm-surface)] p-4 hover:border-[var(--yrm-border-strong)]"
                                    >
                                        <div className="mb-3 flex flex-wrap items-center gap-2">
                                            <h3 className="text-sm font-semibold text-[var(--yrm-ink)]">
                                                {lead.lead_name || lead.phone_number || 'Lead sem identificação'}
                                            </h3>
                                            <TemperatureBadge temperature={lead.current_classification} />
                                            <StatusBadge status={lead.current_status} />
                                        </div>
                                        <p className="line-clamp-2 text-sm leading-6 text-[var(--yrm-muted)]">
                                            {lead.last_message_preview || 'Sem preview de mensagem registrado.'}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </SectionPanel>
                    </div>
                </div>
            )}
        </AppShell>
    )
}
