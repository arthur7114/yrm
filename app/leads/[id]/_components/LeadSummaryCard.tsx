import { LeadDetails } from '../actions'

export default function LeadSummaryCard({ lead }: { lead: LeadDetails }) {
    const displayName = lead.lead_name || lead.phone_number || 'Lead Sem Identificação'

    const displayDate = new Date(lead.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })

    const statusColors: Record<string, string> = {
        'aguardando_classificacao': 'bg-gray-100 text-gray-800',
        'classificado': 'bg-blue-100 text-blue-800',
        'encaminhado_humano': 'bg-green-100 text-green-800',
    }

    const classificationStyles: Record<string, { bg: string, text: string, ring: string, icon: string }> = {
        'frio': { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-600/20', icon: '❄️' },
        'morno': { bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-600/20', icon: '✨' },
        'quente': { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-600/20', icon: '🔥' },
    }

    // Fallback if null
    const classification = lead.current_classification?.toLowerCase() || 'não definida'
    const classStyle = classificationStyles[classification] || { bg: 'bg-gray-50', text: 'text-gray-600', ring: 'ring-gray-500/10', icon: '❓' }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden sticky top-24">

            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-900 truncate">
                    {displayName}
                </h2>
                {lead.lead_name && lead.phone_number && (
                    <p className="mt-1 text-sm text-gray-500 font-medium">
                        {lead.phone_number}
                    </p>
                )}
            </div>

            <div className="px-6 py-6 space-y-6">

                {/* Classification Block */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Temperatura Atual
                    </h3>
                    <div className="flex items-center">
                        <span className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset ${classStyle.bg} ${classStyle.text} ${classStyle.ring}`}>
                            <span className="mr-1.5">{classStyle.icon}</span>
                            {classification.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Status Block */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Status do Atendimento
                    </h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${statusColors[lead.current_status] || 'bg-gray-100 text-gray-800'}`}>
                        {lead.current_status?.replace('_', ' ').toUpperCase()}
                    </span>
                </div>

                <div className="pt-6 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        Lead cadastrado em: <br />
                        <span className="font-medium text-gray-600">{displayDate}</span>
                    </p>
                </div>

            </div>
        </div>
    )
}
