import { getLeadDetails, getLeadMessages, getLeadQualification } from './actions'
import LeadSummaryCard from './_components/LeadSummaryCard'
import MessageTimeline from './_components/MessageTimeline'
import MessageInput from './_components/MessageInput'
import SimulateAIAction from './_components/SimulateAIAction'
import SimulateResponseAction from './_components/SimulateResponseAction'
import QualificationResultBlock from './_components/QualificationResultBlock'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Detalhes do Lead - Lead System',
    description: 'Histórico de mensagens e estado atual do lead.',
}

export default async function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {

    // Await params as required by Next.js 15+ 
    const resolvedParams = await params
    const leadId = parseInt(resolvedParams.id, 10)

    if (isNaN(leadId)) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold text-gray-900">ID Inválido</h1>
                <p className="text-gray-500 mt-2">O identificador do lead não é válido.</p>
                <Link href="/" className="mt-6 text-indigo-600 hover:text-indigo-800 font-medium">&larr; Voltar para a Home</Link>
            </div>
        )
    }

    // Fetch data concurrently
    const [leadRes, messagesRes, qualRes] = await Promise.all([
        getLeadDetails(leadId),
        getLeadMessages(leadId),
        getLeadQualification(leadId)
    ])

    // Handle Unauthenticated
    if (leadRes.message === 'Não autenticado') {
        redirect('/login')
    }

    // Handle Not Found / Unauthorized
    if (!leadRes.success || !leadRes.data) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center max-w-md w-full">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Lead Não Encontrado</h1>
                    <p className="text-gray-500 text-sm mb-6">
                        {leadRes.message || 'Este lead não existe ou você não tem permissão para visualizá-lo.'}
                    </p>
                    <Link href="/" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 w-full">
                        Voltar para o Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    const lead = leadRes.data
    const messages = messagesRes.data || []
    const qualification = qualRes?.data || null

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            {/* Simple Top Nav */}
            <nav className="bg-white shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-4">
                            <Link href="/" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
                                &larr; Voltar
                            </Link>
                            <span className="text-gray-300">|</span>
                            <span className="font-semibold text-lg text-gray-900 truncate max-w-[200px] sm:max-w-md">
                                {lead.lead_name || lead.phone_number || 'Novo Lead'}
                            </span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content: 2 Columns */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Lead Summary (Static Context) */}
                    <div className="lg:col-span-4 h-full flex flex-col gap-6">
                        {lead.current_status === 'classificado' && qualification && (
                            <QualificationResultBlock result={qualification} />
                        )}

                        <LeadSummaryCard lead={lead} />

                        {lead.current_status === 'em_processamento' && (
                            <SimulateAIAction leadId={lead.id} />
                        )}

                        {lead.current_status === 'classificado' && messages.filter(m => m.sender_type === 'system').length === 0 && (
                            <SimulateResponseAction leadId={lead.id} />
                        )}
                    </div>

                    {/* Right Column: Message Timeline */}
                    <div className="lg:col-span-8 flex flex-col h-[calc(100vh-8rem)]">
                        <MessageTimeline messages={messages} />
                        <MessageInput leadId={leadId} />
                    </div>

                </div>
            </main>
        </div>
    )
}
