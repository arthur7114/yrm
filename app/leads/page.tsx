import { redirect } from 'next/navigation'

import AppShell from '@/components/app-shell/AppShell'
import LeadFilters from '@/components/leads/LeadFilters'
import LeadRow from '@/components/leads/LeadRow'
import EmptyState from '@/components/ui/EmptyState'
import SectionPanel from '@/components/ui/SectionPanel'
import { normalizeLeadStatus } from '@/lib/lead-domain'
import { createClient } from '@/lib/supabase-server'

type SearchParams = Record<string, string | string[] | undefined>

type LeadRecord = {
    id: number
    lead_name: string | null
    phone_number: string | null
    current_classification: string | null
    current_status: string | null
    created_at: string
    last_message_at: string | null
    last_message_preview: string | null
}

type IntegrationSourceRow = {
    lead_id: number
    source: string
}

function getValue(value: string | string[] | undefined) {
    return typeof value === 'string' ? value : ''
}

function matchesRange(lead: LeadRecord, range: string) {
    if (!range || range === 'all') return true
    const start = new Date()
    start.setDate(start.getDate() - Number(range) + 1)
    start.setHours(0, 0, 0, 0)
    return new Date(lead.created_at) >= start
}

export const dynamic = 'force-dynamic'

export default async function LeadsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>
}) {
    const params = await searchParams
    const query = getValue(params.q).trim().toLowerCase()
    const status = getValue(params.status)
    const temperature = getValue(params.temperature)
    const range = getValue(params.range) || '30'
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
            'id, lead_name, phone_number, current_classification, current_status, created_at, last_message_at, last_message_preview'
        )
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

    if (error) {
        return (
            <AppShell
                eyebrow="Carteira operacional"
                title="Falha ao carregar leads"
                description="Não foi possível carregar a carteira operacional a partir dos snapshots atuais."
            >
                <div className="rounded-2xl border border-[rgba(178,74,63,0.28)] bg-[var(--yrm-danger-soft)] p-6 text-sm text-[var(--yrm-danger)]">
                    {error.message}
                </div>
            </AppShell>
        )
    }

    const allLeads = (leads || []) as LeadRecord[]
    const leadIds = allLeads.map((lead) => lead.id)
    const latestSourcesMap = new Map<number, string>()

    if (leadIds.length) {
        const { data: latestSources } = await supabase
            .from('integration_events')
            .select('lead_id, source')
            .in('lead_id', leadIds)
            .order('occurred_at', { ascending: false })
            .limit(Math.min(leadIds.length * 2, 500))

        for (const row of (latestSources || []) as IntegrationSourceRow[]) {
            if (!latestSourcesMap.has(row.lead_id)) {
                latestSourcesMap.set(row.lead_id, row.source)
            }
        }
    }

    const filteredLeads = allLeads.filter((lead) => {
        const normalizedStatus = normalizeLeadStatus(lead.current_status)
        const matchesQuery =
            !query ||
            lead.lead_name?.toLowerCase().includes(query) ||
            lead.phone_number?.toLowerCase().includes(query)
        const matchesStatus = !status || normalizedStatus === status
        const matchesTemperature = !temperature || lead.current_classification === temperature

        return matchesQuery && matchesStatus && matchesTemperature && matchesRange(lead, range)
    })

    const queryString = new URLSearchParams()
    if (query) queryString.set('q', query)
    if (status) queryString.set('status', status)
    if (temperature) queryString.set('temperature', temperature)
    if (range) queryString.set('range', range)
    const backHref = queryString.toString() ? `/leads?${queryString.toString()}` : '/leads'

    return (
        <AppShell
            eyebrow="Carteira operacional"
            title="Leads"
            description="Gerencie a carteira por período, status e temperatura. O detalhe continua focado em leitura, contexto e histórico."
        >
            <div className="space-y-6">
                <SectionPanel
                    title="Filtros"
                    description="Ajuste o recorte da carteira sem sair do fluxo operacional."
                    aside={<span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--yrm-muted-soft)]">{filteredLeads.length} lead(s)</span>}
                >
                    <LeadFilters query={query} status={status} temperature={temperature} range={range} />
                </SectionPanel>

                <SectionPanel
                    title="Carteira filtrada"
                    description="Ordenação padrão por última atividade. Clique para abrir a conversa e o contexto operacional."
                >
                    {filteredLeads.length ? (
                        <div className="space-y-3">
                            {filteredLeads.map((lead) => (
                                <LeadRow
                                    key={lead.id}
                                    lead={{ ...lead, lastSource: latestSourcesMap.get(lead.id) || null }}
                                    href={`/leads/${lead.id}?from=${encodeURIComponent(backHref)}`}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="Nenhum lead encontrado nesse recorte."
                            description="Tente ampliar o período ou remover parte dos filtros para recuperar a carteira operacional."
                        />
                    )}
                </SectionPanel>
            </div>
        </AppShell>
    )
}
