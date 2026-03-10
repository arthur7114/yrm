import { UserCheck, MessageSquare, Brain, Bot, Clock } from 'lucide-react'
import type { HandoffContext, LeadQualification } from '../actions'

const classificationConfig: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
    'frio': { label: 'Frio', icon: '❄️', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    'morno': { label: 'Morno', icon: '✨', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    'quente': { label: 'Quente', icon: '🔥', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
}

type HandoffContextBlockProps = {
    handoff: HandoffContext
    qualification: LeadQualification | null
    lastLeadMessage: string | null
    systemResponse: string | null
}

export default function HandoffContextBlock({ handoff, qualification, lastLeadMessage, systemResponse }: HandoffContextBlockProps) {
    const classification = qualification?.classification?.toLowerCase() || ''
    const config = classificationConfig[classification] || { label: classification || 'N/A', icon: '❓', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' }

    const handoffDate = new Date(handoff.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })

    return (
        <div className="bg-white rounded-lg shadow-sm border border-green-200 overflow-hidden">

            {/* Header */}
            <div className="px-6 py-4 bg-green-50 border-b border-green-100 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Encaminhado ao Humano</span>
                <span className="ml-auto flex items-center gap-1 text-[11px] text-green-600">
                    <Clock className="h-3 w-3" />
                    {handoffDate}
                </span>
            </div>

            {/* Context Body */}
            <div className="p-6 space-y-5">

                {/* Classification */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Classificação
                    </h4>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium border ${config.bg} ${config.color} ${config.border}`}>
                        {config.icon} {config.label.toUpperCase()}
                    </span>
                </div>

                {/* AI Reasoning */}
                {qualification?.confidence_reason && (
                    <div>
                        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            <Brain className="h-3.5 w-3.5" />
                            Intenção Interpretada
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-md border border-gray-100">
                            {qualification.confidence_reason}
                        </p>
                    </div>
                )}

                {/* System Response */}
                {systemResponse && (
                    <div>
                        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            <Bot className="h-3.5 w-3.5" />
                            Resposta Automática Enviada
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed bg-indigo-50 p-3 rounded-md border border-indigo-100">
                            {systemResponse}
                        </p>
                    </div>
                )}

                {/* Last Lead Message */}
                {lastLeadMessage && (
                    <div>
                        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            <MessageSquare className="h-3.5 w-3.5" />
                            Última Mensagem do Lead
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-md border border-gray-100">
                            {lastLeadMessage}
                        </p>
                    </div>
                )}

                {/* No Automation Notice */}
                <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 text-center italic">
                        Automação encerrada — atendimento sob responsabilidade humana.
                    </p>
                </div>
            </div>
        </div>
    )
}
