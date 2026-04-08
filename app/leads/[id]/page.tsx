import Link from 'next/link'
import { redirect } from 'next/navigation'

import { normalizeLeadStatus } from '@/lib/lead-domain'

import ClaimLeadButton from './_components/ClaimLeadButton'
import ClassificationChangeBadge from './_components/ClassificationChangeBadge'
import ClassificationHistory from './_components/ClassificationHistory'
import CloseLeadButton from './_components/CloseLeadButton'
import DeleteLeadDialog from './_components/DeleteLeadDialog'
import EditLeadDialog from './_components/EditLeadDialog'
import HandoffButton from './_components/HandoffButton'
import HandoffContextBlock from './_components/HandoffContextBlock'
import LeadSummaryCard from './_components/LeadSummaryCard'
import MessageInput from './_components/MessageInput'
import MessageTimeline from './_components/MessageTimeline'
import OperationalEventsCard from './_components/OperationalEventsCard'
import QualificationResultBlock from './_components/QualificationResultBlock'
import SimulateAIAction from './_components/SimulateAIAction'
import SimulateResponseAction from './_components/SimulateResponseAction'
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
    title: 'Detalhes do Lead - Lead System',
    description: 'Histórico de mensagens e estado atual do lead.',
}

const showInternalAITools = process.env.ENABLE_INTERNAL_AI_TOOLS === 'true'

export default async function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params
    const leadId = parseInt(resolvedParams.id, 10)

    if (Number.isNaN(leadId)) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
                <h1 className="text-2xl font-bold text-gray-900">ID inválido</h1>
                <p className="mt-2 text-gray-500">O identificador do lead não é válido.</p>
                <Link
                    href="/"
                    className="mt-6 font-medium text-indigo-600 hover:text-indigo-800"
                >
                    &larr; Voltar para a Home
                </Link>
            </div>
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
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
                <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h1 className="mb-2 text-xl font-bold text-gray-900">Lead não encontrado</h1>
                    <p className="mb-6 text-sm text-gray-500">
                        {leadRes.message || 'Este lead não existe ou você não tem permissão para visualizá-lo.'}
                    </p>
                    <Link
                        href="/"
                        className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        Voltar para o Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    const lead = leadRes.data
    const messages = messagesRes.data || []
    const qualification = qualificationRes.data || null
    const classificationEvents = classificationEventsRes.data || []
    const operationalEvents = operationalEventsRes.data || []
    const latestClassificationEvent = classificationEvents[0] || null
    const handoffContext = handoffRes.data || null

    const normalizedStatus = normalizeLeadStatus(lead.current_status)
    const isAwaitingHuman = normalizedStatus === 'aguardando_humano'
    const isHumanOwned = normalizedStatus === 'em_atendimento_humano'
    const isClosed = normalizedStatus === 'encerrado'
    const isHumanFlow = isAwaitingHuman || isHumanOwned || isClosed

    const lastLeadMessage = isHumanFlow
        ? [...messages].reverse().find((message) => message.sender_type === 'lead')?.message_content || null
        : null
    const systemResponse = isHumanFlow
        ? messages.find(
            (message) => message.sender_type === 'system' || message.sender_type === 'automacao'
        )?.message_content || null
        : null

    return (
        <div className="flex min-h-screen flex-col bg-gray-50">
            <nav className="sticky top-0 z-20 bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/"
                                className="text-sm font-medium text-gray-500 transition-colors hover:text-indigo-600"
                            >
                                &larr; Voltar
                            </Link>
                            <span className="text-gray-300">|</span>
                            <span className="max-w-[200px] truncate text-lg font-semibold text-gray-900 sm:max-w-md">
                                {lead.lead_name || lead.phone_number || 'Novo Lead'}
                            </span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-12">
                    <div className="flex h-full flex-col gap-6 lg:col-span-4">
                        {handoffContext ? (
                            <HandoffContextBlock
                                handoff={handoffContext}
                                qualification={qualification}
                                lastLeadMessage={lastLeadMessage}
                                systemResponse={systemResponse}
                            />
                        ) : null}

                        {!isHumanFlow ? (
                            <ClassificationChangeBadge latestEvent={latestClassificationEvent} />
                        ) : null}

                        {qualification ? <QualificationResultBlock result={qualification} /> : null}

                        <LeadSummaryCard lead={lead} />

                        <div className="flex flex-col gap-3">
                            <EditLeadDialog
                                leadId={lead.id}
                                currentName={lead.lead_name || ''}
                                currentPhone={lead.phone_number || ''}
                            />
                            <DeleteLeadDialog leadId={lead.id} />
                        </div>

                        {isAwaitingHuman ? <ClaimLeadButton leadId={lead.id} /> : null}
                        {isHumanOwned ? <CloseLeadButton leadId={lead.id} /> : null}

                        {showInternalAITools && !isHumanFlow ? <HandoffButton leadId={lead.id} /> : null}

                        {showInternalAITools && !isHumanFlow && normalizedStatus === 'em_qualificacao' ? (
                            <SimulateAIAction leadId={lead.id} />
                        ) : null}

                        {showInternalAITools &&
                        !isHumanFlow &&
                        normalizedStatus === 'em_qualificacao' &&
                        messages.filter((message) => message.sender_type === 'system').length === 0 ? (
                            <SimulateResponseAction leadId={lead.id} />
                        ) : null}

                        <ClassificationHistory events={classificationEvents} />
                        <OperationalEventsCard events={operationalEvents} />
                    </div>

                    <div className="flex h-[calc(100vh-8rem)] flex-col lg:col-span-8">
                        <MessageTimeline messages={messages} />
                        {showInternalAITools ? <MessageInput leadId={leadId} /> : null}
                    </div>
                </div>
            </main>
        </div>
    )
}
