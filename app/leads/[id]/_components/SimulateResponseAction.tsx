'use client'

import { useState, useTransition } from 'react'
import { generateInitialResponseViaAI } from '../ai-actions'
import { MessageSquarePlusIcon, Loader2Icon } from 'lucide-react'

export default function SimulateResponseAction({ leadId }: { leadId: number }) {
    const [isPending, startTransition] = useTransition()
    const [errorMsg, setErrorMsg] = useState('')

    const handleGenerate = () => {
        setErrorMsg('')
        startTransition(async () => {
            const res = await generateInitialResponseViaAI(leadId)
            if (!res.success) {
                setErrorMsg(res.message || 'Erro inesperado.')
            }
        })
    }

    return (
        <div className="mt-6 border-t border-gray-100 pt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Ação de Sistema (Simulação)</h4>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Nesta etapa o n8n estaria acionando a inteligência para gerar a resposta inicial ao lead classificado.
            </p>

            {errorMsg && (
                <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                    {errorMsg}
                </div>
            )}

            <button
                onClick={handleGenerate}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
            >
                {isPending ? (
                    <>
                        <Loader2Icon className="h-5 w-5 animate-spin" />
                        Gerando resposta...
                    </>
                ) : (
                    <>
                        <MessageSquarePlusIcon className="h-5 w-5" />
                        Gerar Resposta Inicial (Simular n8n)
                    </>
                )}
            </button>
        </div>
    )
}
