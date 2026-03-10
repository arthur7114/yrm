'use client'

import { ClassificationEvent } from '../actions'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'

const classificationConfig: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
    'frio': { label: 'Frio', icon: '❄️', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    'morno': { label: 'Morno', icon: '✨', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    'quente': { label: 'Quente', icon: '🔥', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
}

const rankOrder: Record<string, number> = { 'frio': 0, 'morno': 1, 'quente': 2 }

function getConfig(cls: string) {
    return classificationConfig[cls?.toLowerCase()] || { label: cls, icon: '❓', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' }
}

export default function ClassificationChangeBadge({ latestEvent }: { latestEvent: ClassificationEvent | null }) {
    if (!latestEvent) return null

    // Only show if the event happened within the last 24 hours
    const eventTime = new Date(latestEvent.created_at).getTime()
    const now = Date.now()
    const twentyFourHours = 24 * 60 * 60 * 1000

    if (now - eventTime > twentyFourHours) return null

    const prevConfig = getConfig(latestEvent.previous_classification)
    const newConfig = getConfig(latestEvent.new_classification)

    const prevRank = rankOrder[latestEvent.previous_classification?.toLowerCase()] ?? -1
    const newRank = rankOrder[latestEvent.new_classification?.toLowerCase()] ?? -1
    const isUpgrade = newRank > prevRank

    const borderColor = isUpgrade ? 'border-green-200' : 'border-orange-200'
    const bgColor = isUpgrade ? 'bg-green-50/50' : 'bg-orange-50/50'
    const TrendIcon = isUpgrade ? TrendingUp : TrendingDown
    const trendColor = isUpgrade ? 'text-green-600' : 'text-orange-600'

    const timeAgo = getRelativeTime(eventTime)

    return (
        <div className={`rounded-lg border ${borderColor} ${bgColor} p-4 animate-in fade-in slide-in-from-top-2 duration-500`}>
            <div className="flex items-center gap-2 mb-2">
                <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Classificação Alterada
                </span>
                <span className="ml-auto text-[11px] text-gray-400">{timeAgo}</span>
            </div>

            <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${prevConfig.bg} ${prevConfig.color} ${prevConfig.border}`}>
                    {prevConfig.icon} {prevConfig.label}
                </span>
                <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${newConfig.bg} ${newConfig.color} ${newConfig.border}`}>
                    {newConfig.icon} {newConfig.label}
                </span>
            </div>

            {latestEvent.reason && (
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                    {latestEvent.reason}
                </p>
            )}
        </div>
    )
}

function getRelativeTime(timestamp: number): string {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'agora'
    if (minutes < 60) return `há ${minutes}min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `há ${hours}h`
    return `há ${Math.floor(hours / 24)}d`
}
