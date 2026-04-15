import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, AudioLines, Fingerprint, MessageSquareText } from 'lucide-react'

import AppShell from '@/components/app-shell/AppShell'
import SectionPanel from '@/components/ui/SectionPanel'
import StatusBadge from '@/components/ui/StatusBadge'
import TemperatureBadge from '@/components/ui/TemperatureBadge'
import { normalizeLeadStatus } from '@/lib/lead-domain'

import ClassificationHistory from './_components/ClassificationHistory'
import DeleteLeadDialog from './_components/DeleteLeadDialog'
import HandoffContextBlock from './_components/HandoffContextBlock'
import HandoffToggle from './_components/HandoffToggle'
import LeadSummaryCard from './_components/LeadSummaryCard'
import MessageTimeline from './_components/MessageTimeline'
import OperationalEventsCard from './_components/OperationalEventsCard'
import QualificationResultBlock from './_components/QualificationResultBlock'
import {
    getClassificationEvents,
    getHandoffContext,
    getLeadDetails,
    getLeadMessages,
    getLeadQualification,
    getOperationalEvents,
} from './actions'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Detalhe do Lead - YRM',
    description: 'Leitura completa de mensagens, qualificação e eventos do lead.',
}

export default async function LeadDetailsPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ from?: string }>
}) {
    const resolvedParams = await params
    const resolvedSearchParams = await searchParams
    const leadId = parseInt(resolvedParams.id, 10)
    const decodedBackHref = resolvedSearchParams.from ? decodeURIComponent(resolvedSearchParams.from) : '/leads'
    const backHref = decodedBackHref.startsWith('/') ? decodedBackHref : '/leads'
    const backLabel = backHref === '/' || backHref.startsWith('/?') ? 'Voltar ao dashboard' : 'Voltar para leads'

    if (Number.isNaN(leadId)) {
        return (
            <AppShell
                eyebrow="Leitura do lead"
                title="ID inválido"
                description="O identificador solicitado não corresponde a um lead válido."
                actions={
                    <Link
                        href="/leads"
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--yrm-border)] bg-[var(--yrm-surface)] px-4 py-3 text-sm font-medium text-[var(--yrm-muted)] hover:border-[var(--yrm-border-strong)] hover:text-[var(--yrm-ink)]"
                    >
                        <ArrowLeft size={16} />
                        {backLabel}
                    </Link>
                }
            >
                <div className="rounded-2xl border border-[rgba(178,74,63,0.28)] bg-[var(--yrm-danger-soft)] p-6 text-sm text-[var(--yrm-danger)]">
                    O identificador informado não é numérico.
                </div>
            </AppShell>
        )
    }

    const [
        leadRes,
        messagesRes,
        qualificationRes,
        classificationEventsRes,
        handoffRes,
        operationalEventsRes,
    ] = await Promise.all([
        getLeadDetails(leadId),
        getLeadMessages(leadId),
        getLeadQualification(leadId),
        getClassificationEvents(leadId),
        getHandoffContext(leadId),
        getOperationalEvents(leadId),
    ])

    if (leadRes.message === 'Não autenticado') {
        redirect('/login')
    }

    if (!leadRes.success || !leadRes.data) {
        return (
            <AppShell
                eyebrow="Leitura do lead"
                title="Lead não encontrado"
                description={leadRes.message || 'Este lead não existe ou você não tem permissão para visualizá-lo.'}
                actions={
                    <Link
                        href="/leads"
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--yrm-border)] bg-[var(--yrm-surface)] px-4 py-3 text-sm font-medium text-[var(--yrm-muted)] hover:border-[var(--yrm-border-strong)] hover:text-[var(--yrm-ink)]"
                    >
                        <ArrowLeft size={16} />
                        {backLabel}
                    </Link>
                }
            >
                <div className="rounded-2xl border border-[rgba(178,74,63,0.28)] bg-[var(--yrm-danger-soft)] p-6 text-sm text-[var(--yrm-danger)]">
                    {leadRes.message || 'Falha ao localizar o lead solicitado.'}
                </div>
            </AppShell>
        )
    }

    const lead = leadRes.data
    const messages = messagesRes.data || []
    const qualification = qualificationRes.data || null
    const classificationEvents = classificationEventsRes.data || []
    const operationalEvents = operationalEventsRes.data || []
    const handoffContext = handoffRes.data || null

    const normalizedStatus = normalizeLeadStatus(lead.current_status)
    const isHumanFlow =
        normalizedStatus === 'aguardando_humano' ||
        normalizedStatus === 'em_atendimento_humano' ||
        normalizedStatus === 'encerrado'

    const lastLeadMessage = isHumanFlow
        ? [...messages].reverse().find((message) => message.sender_type === 'lead')?.message_content || null
        : null
    const systemResponse = isHumanFlow
        ? messages.find(
              (message) => message.sender_type === 'system' || message.sender_type === 'automacao'
          )?.message_content || null
        : null

    const displayName = lead.lead_name || lead.phone_number || 'Lead sem identificação'

    return (
        <AppShell
            eyebrow="Leitura do lead"
            title={displayName}
            description="Histórico consolidado da conversa, da qualificação e dos eventos operacionais. Esta tela está em modo somente leitura."
            actions={
                <Link
                    href={backHref}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--yrm-border)] bg-[var(--yrm-surface)] px-4 py-3 text-sm font-medium text-[var(--yrm-muted)] hover:border-[var(--yrm-border-strong)] hover:text-[var(--yrm-ink)]"
                >
                    <ArrowLeft size={16} />
                    {backLabel}
                </Link>
            }
        >
            <div className="space-y-6">
                <SectionPanel
                    title="Snapshot operacional"
                    description="Resumo rápido da posição atual do lead dentro do funil e da conversa."
                >
                    <div className="grid gap-6 lg:grid-cols-4">
                        <div className="flex flex-col gap-1">
                            <p className="yrm-kicker text-[10px]">Status</p>
                            <div className="mt-1">
                                <StatusBadge status={lead.current_status} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="yrm-kicker text-[10px]">Temperatura</p>
                            <div className="mt-1">
                                <TemperatureBadge temperature={lead.current_classification} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="yrm-kicker text-[10px]">Mensagens</p>
                            <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-[var(--yrm-ink)]">
                                {messages.length}
                            </p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="yrm-kicker text-[10px]">Eventos</p>
                            <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-[var(--yrm-ink)]">
                                {operationalEvents.length}
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 grid gap-6 border-t border-[var(--yrm-border)] pt-6 sm:grid-cols-3">
                        <div className="flex items-center gap-3">
                            <Fingerprint className="h-4 w-4 text-[var(--yrm-muted-soft)]" />
                            <div className="min-w-0 flex-1">
                                <p className="yrm-kicker text-[10px]">Sessão</p>
                                <p className="truncate font-mono text-[10px] uppercase tracking-wider text-[var(--yrm-muted)]">
                                    {lead.external_session_id || 'Não informada'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <MessageSquareText className="h-4 w-4 text-[var(--yrm-muted-soft)]" />
                            <div className="min-w-0 flex-1">
                                <p className="yrm-kicker text-[10px]">Último preview</p>
                                <p className="truncate text-xs text-[var(--yrm-muted)]">
                                    {messages[messages.length - 1]?.message_content || 'Sem mensagens'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <AudioLines className="h-4 w-4 text-[var(--yrm-muted-soft)]" />
                            <div className="min-w-0 flex-1">
                                <p className="yrm-kicker text-[10px]">Modo da tela</p>
                                <p className="text-xs text-[var(--yrm-muted)]">Somente leitura</p>
                            </div>
                        </div>
                    </div>
                </SectionPanel>

                <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
                    <div className="space-y-6">
                        <HandoffToggle leadId={leadId} isHumanHandoff={lead.is_human_handoff} />
                        <LeadSummaryCard lead={lead} />
                        <SectionPanel
                            title="Ação destrutiva"
                            description="Exclua este lead apenas quando tiver certeza. A remoção é permanente."
                        >
                            <DeleteLeadDialog leadId={leadId} backHref={backHref} />
                        </SectionPanel>
                        {qualification ? <QualificationResultBlock result={qualification} /> : null}
                        {handoffContext ? (
                            <HandoffContextBlock
                                handoff={handoffContext}
                                qualification={qualification}
                                lastLeadMessage={lastLeadMessage}
                                systemResponse={systemResponse}
                            />
                        ) : null}
                        <ClassificationHistory events={classificationEvents} />
                        <OperationalEventsCard events={operationalEvents} />
                    </div>

                    <MessageTimeline messages={messages} />
                </div>
            </div>
        </AppShell>
    )
}
