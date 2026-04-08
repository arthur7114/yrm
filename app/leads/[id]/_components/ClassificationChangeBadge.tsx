'use client'

import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'

import type { ClassificationEvent } from '../actions'

const classificationConfig: Record<
    string,
    { label: string; icon: string; color: string; bg: string; border: string }
> = {
    frio: { label: 'Frio', icon: 'F', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    morno: { label: 'Morno', icon: 'M', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    quente: { label: 'Quente', icon: 'Q', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
}

const rankOrder: Record<string, number> = { frio: 0, morno: 1, quente: 2 }

function getConfig(classification: string) {
    return (
        classificationConfig[classification?.toLowerCase()] || {
            label: classification,
            icon: '?',
            color: 'text-gray-700',
            bg: 'bg-gray-50',
            border: 'border-gray-200',
        }
    )
}

function formatTimestamp(dateValue: string) {
    return new Date(dateValue).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function ClassificationChangeBadge({
    latestEvent,
}: {
    latestEvent: ClassificationEvent | null
}) {
    if (!latestEvent) return null

    const previousConfig = getConfig(latestEvent.previous_classification)
    const nextConfig = getConfig(latestEvent.new_classification)

    const previousRank = rankOrder[latestEvent.previous_classification?.toLowerCase()] ?? -1
    const nextRank = rankOrder[latestEvent.new_classification?.toLowerCase()] ?? -1
    const isUpgrade = nextRank > previousRank

    const borderColor = isUpgrade ? 'border-green-200' : 'border-orange-200'
    const backgroundColor = isUpgrade ? 'bg-green-50/50' : 'bg-orange-50/50'
    const TrendIcon = isUpgrade ? TrendingUp : TrendingDown
    const trendColor = isUpgrade ? 'text-green-600' : 'text-orange-600'

    return (
        <div className={`rounded-lg border ${borderColor} ${backgroundColor} p-4`}>
            <div className="mb-2 flex items-center gap-2">
                <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Classificação alterada
                </span>
                <span className="ml-auto text-[11px] text-gray-400">
                    {formatTimestamp(latestEvent.created_at)}
                </span>
            </div>

            <div className="mb-2 flex items-center gap-2">
                <span
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border ${previousConfig.bg} ${previousConfig.color} ${previousConfig.border}`}
                >
                    {previousConfig.icon} {previousConfig.label}
                </span>
                <ArrowRight className="h-3 w-3 shrink-0 text-gray-400" />
                <span
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border ${nextConfig.bg} ${nextConfig.color} ${nextConfig.border}`}
                >
                    {nextConfig.icon} {nextConfig.label}
                </span>
            </div>

            {latestEvent.reason ? (
                <p className="line-clamp-2 text-xs leading-relaxed text-gray-600">{latestEvent.reason}</p>
            ) : null}
        </div>
    )
}
