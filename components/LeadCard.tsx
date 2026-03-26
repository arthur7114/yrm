import Link from 'next/link'

interface LeadCardProps {
    lead: {
        id: number
        lead_name?: string | null
        phone_number?: string | null
        current_classification?: string | null
        current_status?: string | null
        created_at: string
        last_message_at?: string | null
        last_message_preview?: string | null
    }
}

export default function LeadCard({ lead }: LeadCardProps) {
    const displayName = lead.lead_name || lead.phone_number || 'Lead sem identificação'
    const activityDate = lead.last_message_at || lead.created_at
    const displayDate = new Date(activityDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })

    const statusColors: Record<string, string> = {
        'aguardando_classificacao': 'bg-gray-100 text-gray-800',
        'classificado': 'bg-blue-100 text-blue-800',
        'aguardando_contato_humano': 'bg-green-100 text-green-800',
        'agendado': 'bg-emerald-100 text-emerald-800',
    }

    const classificationColors: Record<string, string> = {
        'frio': 'bg-blue-50 text-blue-700 ring-blue-600/20',
        'morno': 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
        'quente': 'bg-red-50 text-red-700 ring-red-600/20',
    }

    return (
        <Link href={`/leads/${lead.id}`} className="block">
            <div className="overflow-hidden rounded-lg bg-white shadow transition-shadow duration-200 hover:shadow-md">
                <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                        <h3 className="truncate text-lg leading-6 font-medium text-gray-900">
                            {displayName}
                        </h3>
                        <div className="flex flex-col items-end space-y-1">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${classificationColors[lead.current_classification || ''] || 'bg-gray-50 text-gray-600 ring-gray-500/10'}`}>
                                {lead.current_classification?.toUpperCase() || 'N/A'}
                            </span>
                        </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                                Status:
                                <span className={`ml-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${statusColors[lead.current_status || ''] || 'bg-gray-100 text-gray-800'}`}>
                                    {lead.current_status?.replace('_', ' ') || 'sem status'}
                                </span>
                            </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p>Última interação em {displayDate}</p>
                        </div>
                    </div>
                    {lead.last_message_preview ? (
                        <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                            {lead.last_message_preview}
                        </p>
                    ) : null}
                </div>
            </div>
        </Link>
    )
}
