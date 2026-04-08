'use client'

import { useState, useTransition } from 'react'
import { CheckCheck, Loader2 } from 'lucide-react'

import { closeLeadConversation } from '../actions'

export default function CloseLeadButton({ leadId }: { leadId: number }) {
    const [isPending, startTransition] = useTransition()
    const [errorMsg, setErrorMsg] = useState('')

    const handleClose = () => {
        setErrorMsg('')
        startTransition(async () => {
            const result = await closeLeadConversation(leadId)
            if (!result.success) {
                setErrorMsg(result.message || 'Erro ao encerrar atendimento.')
            }
        })
    }

    return (
        <div className="space-y-2">
            <button
                onClick={handleClose}
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
            >
                {isPending ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Encerrando...
                    </>
                ) : (
                    <>
                        <CheckCheck className="h-4 w-4" />
                        Encerrar Atendimento
                    </>
                )}
            </button>
            {errorMsg ? (
                <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {errorMsg}
                </p>
            ) : null}
        </div>
    )
}
