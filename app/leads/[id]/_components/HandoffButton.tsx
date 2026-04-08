'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, Loader2, UserCheck } from 'lucide-react'

import { handoffLeadToHuman } from '../actions'

export default function HandoffButton({ leadId }: { leadId: number }) {
    const [isPending, startTransition] = useTransition()
    const [errorMsg, setErrorMsg] = useState('')
    const [showConfirm, setShowConfirm] = useState(false)

    const handleHandoff = () => {
        setErrorMsg('')
        startTransition(async () => {
            const result = await handoffLeadToHuman(leadId)
            if (!result.success) {
                setErrorMsg(result.message || 'Erro inesperado.')
                setShowConfirm(false)
            }
        })
    }

    if (showConfirm) {
        return (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
                <div className="mb-4 flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                        <h4 className="text-sm font-semibold text-amber-900">Confirmar handoff manual</h4>
                        <p className="mt-1 text-xs leading-relaxed text-amber-700">
                            Esta é uma ação manual de fallback. O lead será movido para
                            {' '}<code>aguardando_humano</code> e o fluxo automático deixará de responder.
                        </p>
                    </div>
                </div>

                {errorMsg ? (
                    <div className="mb-3 rounded-md border border-red-100 bg-red-50 p-2 text-sm text-red-600">
                        {errorMsg}
                    </div>
                ) : null}

                <div className="flex gap-2">
                    <button
                        onClick={handleHandoff}
                        disabled={isPending}
                        className="flex flex-1 items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <UserCheck className="h-4 w-4" />
                                Confirmar handoff
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setShowConfirm(false)
                            setErrorMsg('')
                        }}
                        disabled={isPending}
                        className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
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
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 transition-colors hover:border-green-300 hover:bg-green-100"
        >
            <UserCheck className="h-4 w-4" />
            Solicitar Handoff Manual
        </button>
    )
}
