'use client'

import { useState, useRef, useTransition } from 'react'
import { sendSimulatedMessage } from '../actions'
import { SendIcon, Loader2Icon } from 'lucide-react'

export default function MessageInput({ leadId }: { leadId: number }) {
    const [content, setContent] = useState('')
    const [errorMsg, setErrorMsg] = useState('')
    const [isPending, startTransition] = useTransition()
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!content.trim()) return

        setErrorMsg('')
        startTransition(async () => {
            const res = await sendSimulatedMessage(leadId, content)
            if (res.success) {
                setContent('')
                // Reset textarea height
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto'
                }
            } else {
                setErrorMsg(res.message || 'Erro inesperado ao enviar mensagem.')
            }
        })
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value)

        // Auto-resize
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white border-t border-gray-200 p-4 shrink-0 rounded-b-lg shadow-sm">
            {errorMsg && (
                <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                    {errorMsg}
                </div>
            )}

            <div className="flex bg-gray-50 rounded-lg border border-gray-300 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 overflow-hidden transition-all">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    disabled={isPending}
                    placeholder="Simular mensagem do lead..."
                    className="flex-1 max-h-[120px] min-h-[44px] bg-transparent resize-none outline-none py-3 px-4 text-sm text-gray-900 placeholder-gray-400 disabled:opacity-50"
                    rows={1}
                />
                <button
                    type="submit"
                    disabled={isPending || !content.trim()}
                    className="flex items-center justify-center px-4 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                >
                    {isPending ? (
                        <Loader2Icon className="h-5 w-5 animate-spin" />
                    ) : (
                        <SendIcon className="h-5 w-5" />
                    )}
                </button>
            </div>

            <div className="mt-2 flex justify-between items-center text-[11px] text-gray-400">
                <span>Pressione <strong>Enter</strong> para enviar</span>
                {isPending && <span className="text-indigo-600 font-medium">Processando e acionando n8n...</span>}
            </div>
        </form>
    )
}
