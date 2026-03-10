'use client'

import { useState, useTransition } from 'react'
import { UserCheck, Loader2, AlertTriangle } from 'lucide-react'
import { handoffLeadToHuman } from '../actions'

export default function HandoffButton({ leadId }: { leadId: number }) {
    const [isPending, startTransition] = useTransition()
    const [errorMsg, setErrorMsg] = useState('')
    const [showConfirm, setShowConfirm] = useState(false)

    const handleHandoff = () => {
        setErrorMsg('')
        startTransition(async () => {
            const res = await handoffLeadToHuman(leadId)
            if (!res.success) {
                setErrorMsg(res.message || 'Erro inesperado.')
                setShowConfirm(false)
            }
            // On success, the page revalidates and re-renders automatically
        })
    }

    if (showConfirm) {
        return (
            <div className="bg-amber-50 rounded-lg border border-amber-200 p-5">
                <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-amber-900">Confirmar encaminhamento</h4>
                        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                            Após confirmar, o sistema não responderá mais automaticamente a este lead. A automação será desativada permanentemente.
                        </p>
                    </div>
                </div>

                {errorMsg && (
                    <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                        {errorMsg}
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={handleHandoff}
                        disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <UserCheck className="h-4 w-4" />
                                Sim, encaminhar
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => { setShowConfirm(false); setErrorMsg('') }}
                        disabled={isPending}
                        className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        )
    }

    return (
        <button
            onClick={() => setShowConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 hover:border-green-300 transition-colors"
        >
            <UserCheck className="h-4 w-4" />
            Encaminhar para Atendimento Humano
        </button>
    )
}
