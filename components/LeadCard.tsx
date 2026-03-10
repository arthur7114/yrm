import Link from 'next/link'

interface LeadCardProps {
    lead: {
        id: number
        lead_name?: string | null
        phone_number?: string | null
        current_classification: string
        current_status: string
        created_at: string
    }
}

export default function LeadCard({ lead }: LeadCardProps) {
    const displayName = lead.lead_name || lead.phone_number || 'Lead sem identificação'
    const displayDate = new Date(lead.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })

    const statusColors: Record<string, string> = {
        'aguardando_classificacao': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        'classificado': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'encaminhado_humano': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    }

    const classificationColors: Record<string, string> = {
        'frio': 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-500/30',
        'morno': 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-900/40 dark:text-yellow-300 dark:ring-yellow-500/30',
        'quente': 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-500/30',
    }

    return (
        <Link href={`/leads/${lead.id}`} className="block">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200 border border-transparent dark:border-gray-700">
                <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white truncate">
                            {displayName}
                        </h3>
                        <div className="flex flex-col items-end space-y-1">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${classificationColors[lead.current_classification] || 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {lead.current_classification?.toUpperCase() || 'N/A'}
                            </span>
                        </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                Status:
                                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[lead.current_status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                    {lead.current_status?.replace('_', ' ')}
                                </span>
                            </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                            <p>
                                Criado em {displayDate}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
