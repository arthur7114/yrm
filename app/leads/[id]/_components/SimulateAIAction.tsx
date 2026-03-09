'use client'

import { useState, useTransition } from 'react'
import { qualifyLeadViaAI } from '../ai-actions'
import { BotIcon, Loader2Icon } from 'lucide-react'

export default function SimulateAIAction({ leadId }: { leadId: number }) {
    const [isPending, startTransition] = useTransition()
    const [errorMsg, setErrorMsg] = useState('')

    const handleQualify = () => {
        setErrorMsg('')
        startTransition(async () => {
            const res = await qualifyLeadViaAI(leadId)
            if (!res.success) {
                setErrorMsg(res.message || 'Erro inesperado.')
            }
        })
    }

    return (
        <div className="mt-6 border-t border-gray-100 pt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Ação de Sistema (Simulação)</h4>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Nesta etapa o n8n estaria acionando a inteligência para processar o lead em background. Use o botão abaixo para simular esse processamento localmente.
            </p>

            {errorMsg && (
                <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                    {errorMsg}
                </div>
            )}

            <button
                onClick={handleQualify}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
                {isPending ? (
                    <>
                        <Loader2Icon className="h-5 w-5 animate-spin" />
                        A IA está a pensar...
                    </>
                ) : (
                    <>
                        <BotIcon className="h-5 w-5" />
                        Executar Qualificação (Simular n8n)
                    </>
                )}
            </button>
        </div>
    )
}
