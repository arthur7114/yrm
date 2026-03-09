'use client'

import { LeadMessage } from '../actions'
import { BotIcon, UserCircleIcon, UserIcon, ThumbsUpIcon, ThumbsDownIcon, SparklesIcon } from 'lucide-react'
import { saveResponseFeedback } from '../ai-actions'
import { useState } from 'react'

export default function MessageTimeline({ messages }: { messages: LeadMessage[] }) {
    // Local state to track optimistic feedback updates so we don't need to refresh the whole page
    const [optimisticFeedback, setOptimisticFeedback] = useState<Record<number, 'positive' | 'negative' | null>>({})

    const handleFeedback = async (msgId: number, type: 'positive' | 'negative') => {
        setOptimisticFeedback(prev => ({ ...prev, [msgId]: type }))
        await saveResponseFeedback(msgId, type)
    }

    if (!messages || messages.length === 0) {
        return (
            <div className="flex-1 bg-white shadow-sm border border-gray-200 rounded-t-lg p-12 text-center flex flex-col items-center justify-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma mensagem registrada</h3>
                <p className="text-sm text-gray-500">
                    Este lead ainda não possui histórico de interações.
                </p>
            </div>
        )
    }

    return (
        <div className="flex-1 bg-white shadow-sm border border-gray-200 border-b-0 rounded-t-lg overflow-hidden flex flex-col min-h-0">
            <div className="px-6 py-4 border-b border-gray-100 bg-white z-10">
                <h2 className="text-lg font-semibold text-gray-900">Histórico de Mensagens</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                {messages.map((msg, idx) => {
                    const isSystem = msg.sender_type === 'system'
                    const showTime = new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    const showDate = new Date(msg.created_at).toLocaleDateString('pt-BR')

                    // Add date separator if it's the first message or if the date changed
                    const prevMsg = idx > 0 ? messages[idx - 1] : null
                    const prevDate = prevMsg ? new Date(prevMsg.created_at).toLocaleDateString('pt-BR') : null
                    const needsDateSeparator = prevDate !== showDate

                    return (
                        <div key={msg.id} className="flex flex-col">
                            {needsDateSeparator && (
                                <div className="flex items-center justify-center my-4">
                                    <span className="px-3 py-1 bg-gray-200 text-gray-500 rounded-full text-xs font-medium">
                                        {showDate}
                                    </span>
                                </div>
                            )}

                            <div className={`flex w-full ${isSystem ? 'justify-end' : 'justify-start'} mb-2`}>
                                <div className={`flex max-w-[80%] ${isSystem ? 'flex-row-reverse' : 'flex-row'}`}>

                                    {/* Avatar */}
                                    <div className={`flex-shrink-0 flex items-end ${isSystem ? 'ml-3' : 'mr-3'}`}>
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isSystem ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'}`}>
                                            {isSystem ? <BotIcon size={18} /> : <UserIcon size={18} />}
                                        </div>
                                    </div>

                                    {/* Bubble */}
                                    <div className="flex flex-col">
                                        {isSystem && (
                                            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 w-fit px-2 py-0.5 rounded-full border border-indigo-100">
                                                <SparklesIcon className="w-3 h-3" /> Resposta automática gerada por IA
                                            </div>
                                        )}
                                        <div className={`px-4 py-3 rounded-2xl ${isSystem ? 'bg-indigo-600 text-white rounded-br-sm shadow-md' : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-sm'}`}>
                                            <p className="text-[15px] whitespace-pre-wrap break-words leading-relaxed">
                                                {msg.message_content}
                                            </p>
                                        </div>
                                        <div className={`text-[11px] text-gray-400 mt-1 flex ${isSystem ? 'justify-end' : 'justify-start'}`}>
                                            {showTime} • {isSystem ? 'Sistema' : 'Lead'}
                                        </div>

                                        {/* AI Feedback Form */}
                                        {isSystem && (
                                            <div className="mt-2 flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleFeedback(msg.id, 'positive')}
                                                    className={`p-1.5 rounded border transition-colors ${(optimisticFeedback[msg.id] || msg.user_feedback) === 'positive'
                                                            ? 'bg-green-50 text-green-600 border-green-200'
                                                            : 'bg-white text-gray-400 hover:text-green-500 hover:bg-gray-50 border-gray-200'
                                                        }`}
                                                >
                                                    <ThumbsUpIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleFeedback(msg.id, 'negative')}
                                                    className={`p-1.5 rounded border transition-colors ${(optimisticFeedback[msg.id] || msg.user_feedback) === 'negative'
                                                            ? 'bg-red-50 text-red-600 border-red-200'
                                                            : 'bg-white text-gray-400 hover:text-red-500 hover:bg-gray-50 border-gray-200'
                                                        }`}
                                                >
                                                    <ThumbsDownIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </div>
                    )
                })}

                {/* Phantom spacer so the last message isn't hard against the bottom padding */}
                <div className="h-2 w-full"></div>
            </div>
        </div>
    )
}
