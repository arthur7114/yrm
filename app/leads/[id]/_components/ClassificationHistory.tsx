'use client'

import { ClassificationEvent } from '../actions'
import { ArrowRight, Clock, History } from 'lucide-react'

const classificationConfig: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
    'frio': { label: 'Frio', icon: '❄️', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    'morno': { label: 'Morno', icon: '✨', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    'quente': { label: 'Quente', icon: '🔥', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
}

function getConfig(cls: string) {
    return classificationConfig[cls?.toLowerCase()] || { label: cls, icon: '❓', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' }
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function ClassificationHistory({ events }: { events: ClassificationEvent[] }) {
    if (!events || events.length === 0) {
        return null
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">

            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <History className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">
                    Histórico de Classificação
                </h3>
                <span className="ml-auto text-xs text-gray-400 font-medium">
                    {events.length} {events.length === 1 ? 'mudança' : 'mudanças'}
                </span>
            </div>

            <div className="divide-y divide-gray-100 max-h-[320px] overflow-y-auto">
                {events.map((event) => {
                    const prevConfig = getConfig(event.previous_classification)
                    const newConfig = getConfig(event.new_classification)

                    return (
                        <div key={event.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                            {/* Classification transition */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${prevConfig.bg} ${prevConfig.color} ${prevConfig.border}`}>
                                    {prevConfig.icon} {prevConfig.label}
                                </span>
                                <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${newConfig.bg} ${newConfig.color} ${newConfig.border}`}>
                                    {newConfig.icon} {newConfig.label}
                                </span>
                            </div>

                            {/* Reason */}
                            {event.reason && (
                                <p className="text-xs text-gray-600 leading-relaxed mb-1.5 line-clamp-3">
                                    {event.reason}
                                </p>
                            )}

                            {/* Timestamp */}
                            <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                <Clock className="h-3 w-3" />
                                {formatDate(event.created_at)}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
