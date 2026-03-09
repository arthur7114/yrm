'use client'

import { useState } from 'react'
import { ThumbsUpIcon, ThumbsDownIcon, SparklesIcon, SnowflakeIcon, FlameIcon } from 'lucide-react'
import { saveQualificationFeedback } from '../ai-actions'

type QualificationResult = {
    id: number
    classification: string
    confidence_reason: string
    user_feedback?: 'positive' | 'negative' | null
}

export default function QualificationResultBlock({ result }: { result: QualificationResult }) {
    const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(result.user_feedback || null)
    const [isPending, setIsPending] = useState(false)

    const handleFeedback = async (type: 'positive' | 'negative') => {
        if (feedback === type || isPending) return

        setIsPending(true)
        const oldFeedback = feedback
        setFeedback(type) // optimistic update

        const res = await saveQualificationFeedback(result.id, type)
        if (!res.success) {
            setFeedback(oldFeedback) // rollback config
            alert(res.message)
        }

        setIsPending(false)
    }

    const { badgeClass, icon, label } = getClassificationStyling(result.classification)

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-indigo-900 font-semibold truncate">
                    <SparklesIcon className="h-5 w-5 text-indigo-600" />
                    <span>Resultado da Qualificação IA</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${badgeClass}`}>
                    {icon} {label}
                </div>
            </div>

            <div className="p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Por que classificou assim?</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-6 bg-gray-50 p-4 border border-gray-100 rounded-md">
                    {result.confidence_reason}
                </p>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-500">Ajude a melhorar o assistente:</span>
                    <div className="flex space-x-2">
                        <button
                            type="button"
                            onClick={() => handleFeedback('positive')}
                            disabled={isPending}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors
                                ${feedback === 'positive'
                                    ? 'bg-green-50 border-green-200 text-green-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <ThumbsUpIcon className="h-4 w-4" /> Adequado
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFeedback('negative')}
                            disabled={isPending}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors
                                ${feedback === 'negative'
                                    ? 'bg-red-50 border-red-200 text-red-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <ThumbsDownIcon className="h-4 w-4" /> Inadequado
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function getClassificationStyling(cls: string) {
    const lower = cls.toLowerCase()
    if (lower === 'frio') {
        return {
            badgeClass: 'bg-blue-100 text-blue-800 border border-blue-200',
            icon: <SnowflakeIcon className="h-3.5 w-3.5" />,
            label: 'Lead Frio'
        }
    }
    if (lower === 'morno') {
        return {
            badgeClass: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
            icon: <SparklesIcon className="h-3.5 w-3.5" />,
            label: 'Lead Morno'
        }
    }
    if (lower === 'quente') {
        return {
            badgeClass: 'bg-red-100 text-red-800 border border-red-200',
            // Actually lucide-react name is Flame now, as fixed in previous steps. FlameIcon doesn't exist, Flame does.
            // Oh wait, I checked Flame, Snowflake and Sparkles. 
            // In my run_command I checked: Flame: true. Sparkles: true. Snowflake: true.
            // Let me use Flame.
            icon: <FlameIconWrapper className="h-3.5 w-3.5" />,
            label: 'Lead Quente'
        }
    }
    return {
        badgeClass: 'bg-gray-100 text-gray-800 border border-gray-200',
        icon: null,
        label: cls
    }
}

// Inline wrapper to safely import Flame
function FlameIconWrapper(props: any) {
    // Lucide react exports Flame, not FlameIcon
    const { Flame } = require('lucide-react');
    return <Flame {...props} />
}
