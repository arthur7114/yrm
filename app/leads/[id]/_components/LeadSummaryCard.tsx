import { leadStatusLabels, normalizeLeadStatus } from '@/lib/lead-domain'

import { LeadDetails } from '../actions'

export default function LeadSummaryCard({ lead }: { lead: LeadDetails }) {
    const displayName = lead.lead_name || lead.phone_number || 'Lead sem identificação'

    const displayDate = new Date(lead.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })

    const statusColors: Record<string, string> = {
        novo: 'bg-gray-100 text-gray-800',
        em_qualificacao: 'bg-blue-100 text-blue-800',
        aguardando_humano: 'bg-amber-100 text-amber-800',
        em_atendimento_humano: 'bg-green-100 text-green-800',
        encerrado: 'bg-emerald-100 text-emerald-800',
    }

    const classificationStyles: Record<string, { bg: string, text: string, ring: string, icon: string }> = {
        frio: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-600/20', icon: 'F' },
        morno: { bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-600/20', icon: 'M' },
        quente: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-600/20', icon: 'Q' },
    }

    const classification = lead.current_classification?.toLowerCase() || 'não definida'
    const classStyle =
        classificationStyles[classification] || {
            bg: 'bg-gray-50',
            text: 'text-gray-600',
            ring: 'ring-gray-500/10',
            icon: '?',
        }
    const normalizedStatus = normalizeLeadStatus(lead.current_status)

    return (
        <div className="sticky top-24 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50 px-6 py-5">
                <h2 className="truncate text-xl font-semibold text-gray-900">
                    {displayName}
                </h2>
                {lead.lead_name && lead.phone_number ? (
                    <p className="mt-1 text-sm font-medium text-gray-500">{lead.phone_number}</p>
                ) : null}
            </div>

            <div className="space-y-6 px-6 py-6">
                <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Temperatura Atual
                    </h3>
                    <div className="flex items-center">
                        <span
                            className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset ${classStyle.bg} ${classStyle.text} ${classStyle.ring}`}
                        >
                            <span className="mr-1.5">{classStyle.icon}</span>
                            {classification.toUpperCase()}
                        </span>
                    </div>
                </div>

                <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Status do Atendimento
                    </h3>
                    <span
                        className={`inline-flex items-center rounded px-3 py-1 text-sm font-medium ${statusColors[normalizedStatus || ''] || 'bg-gray-100 text-gray-800'}`}
                    >
                        {normalizedStatus ? leadStatusLabels[normalizedStatus].toUpperCase() : 'SEM STATUS'}
                    </span>
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <p className="text-xs text-gray-400">
                        Lead cadastrado em: <br />
                        <span className="font-medium text-gray-600">{displayDate}</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
