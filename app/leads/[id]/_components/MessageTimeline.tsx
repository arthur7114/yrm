'use client'

import { useState } from 'react'
import {
    BotIcon,
    Cog,
    HeadphonesIcon,
    SparklesIcon,
    ThumbsDownIcon,
    ThumbsUpIcon,
    UserIcon,
} from 'lucide-react'

import { saveResponseFeedback } from '../ai-actions'
import type { LeadMessage } from '../actions'

export default function MessageTimeline({ messages }: { messages: LeadMessage[] }) {
    const [optimisticFeedback, setOptimisticFeedback] = useState<Record<number, 'positive' | 'negative' | null>>({})

    const handleFeedback = async (msgId: number, type: 'positive' | 'negative') => {
        setOptimisticFeedback((previous) => ({ ...previous, [msgId]: type }))
        await saveResponseFeedback(msgId, type)
    }

    if (!messages?.length) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center rounded-t-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
                <div className="mb-4 rounded-full bg-gray-100 p-4">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                </div>
                <h3 className="mb-1 text-lg font-medium text-gray-900">Nenhuma mensagem registrada</h3>
                <p className="text-sm text-gray-500">Este lead ainda não possui histórico de interações.</p>
            </div>
        )
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-lg border border-b-0 border-gray-200 bg-white shadow-sm">
            <div className="z-10 border-b border-gray-100 bg-white px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Histórico de Mensagens</h2>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto bg-gray-50 p-6">
                {messages.map((message, index) => {
                    const isSystem = message.sender_type === 'system'
                    const isAutomation = message.sender_type === 'automacao' || message.is_automation === true
                    const isHuman = message.sender_type === 'humano' || message.sender_type === 'human'
                    const isBot = isSystem || isAutomation
                    const isRightAligned = isBot || isHuman
                    const showTime = new Date(message.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })
                    const showDate = new Date(message.created_at).toLocaleDateString('pt-BR')
                    const previousMessage = index > 0 ? messages[index - 1] : null
                    const previousDate = previousMessage
                        ? new Date(previousMessage.created_at).toLocaleDateString('pt-BR')
                        : null
                    const needsDateSeparator = previousDate !== showDate

                    return (
                        <div key={message.id} className="flex flex-col">
                            {needsDateSeparator ? (
                                <div className="my-4 flex items-center justify-center">
                                    <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-500">
                                        {showDate}
                                    </span>
                                </div>
                            ) : null}

                            <div className={`mb-2 flex w-full ${isRightAligned ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex max-w-[80%] ${isRightAligned ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`flex flex-shrink-0 items-end ${isRightAligned ? 'ml-3' : 'mr-3'}`}>
                                        <div
                                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                                isAutomation
                                                    ? 'bg-gray-100 text-gray-500'
                                                    : isSystem
                                                      ? 'bg-indigo-100 text-indigo-600'
                                                      : isHuman
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-gray-200 text-gray-600'
                                            }`}
                                        >
                                            {isAutomation ? (
                                                <Cog size={18} />
                                            ) : isSystem ? (
                                                <BotIcon size={18} />
                                            ) : isHuman ? (
                                                <HeadphonesIcon size={18} />
                                            ) : (
                                                <UserIcon size={18} />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        {isAutomation ? (
                                            <div className="mb-1 flex w-fit items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                                                <Cog className="h-3 w-3" /> automação
                                            </div>
                                        ) : null}

                                        {isSystem && !isAutomation ? (
                                            <div className="mb-1 flex w-fit items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                                                <SparklesIcon className="h-3 w-3" /> Resposta automática gerada por IA
                                            </div>
                                        ) : null}

                                        {isHuman ? (
                                            <div className="mb-1 flex w-fit items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                                <HeadphonesIcon className="h-3 w-3" /> Atendimento humano
                                            </div>
                                        ) : null}

                                        <div
                                            className={`rounded-2xl px-4 py-3 ${
                                                isAutomation
                                                    ? 'rounded-br-sm bg-gray-200 text-gray-800 shadow-sm'
                                                    : isSystem
                                                      ? 'rounded-br-sm bg-indigo-600 text-white shadow-md'
                                                      : isHuman
                                                        ? 'rounded-br-sm bg-emerald-600 text-white shadow-md'
                                                        : 'rounded-bl-sm border border-gray-200 bg-white text-gray-800 shadow-sm'
                                            }`}
                                        >
                                            <p className="break-words whitespace-pre-wrap text-[15px] leading-relaxed">
                                                {message.message_content}
                                            </p>
                                        </div>

                                        <div
                                            className={`mt-1 flex text-[11px] text-gray-400 ${isRightAligned ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {showTime} •{' '}
                                            {isAutomation ? 'Automação' : isSystem ? 'Sistema' : isHuman ? 'Humano' : 'Lead'}
                                        </div>

                                        {isBot ? (
                                            <div className="mt-2 flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleFeedback(message.id, 'positive')}
                                                    className={`rounded border p-1.5 transition-colors ${
                                                        (optimisticFeedback[message.id] || message.user_feedback) === 'positive'
                                                            ? 'border-green-200 bg-green-50 text-green-600'
                                                            : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-green-500'
                                                    }`}
                                                >
                                                    <ThumbsUpIcon className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleFeedback(message.id, 'negative')}
                                                    className={`rounded border p-1.5 transition-colors ${
                                                        (optimisticFeedback[message.id] || message.user_feedback) === 'negative'
                                                            ? 'border-red-200 bg-red-50 text-red-600'
                                                            : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-red-500'
                                                    }`}
                                                >
                                                    <ThumbsDownIcon className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}

                <div className="h-2 w-full" />
            </div>
        </div>
    )
}
