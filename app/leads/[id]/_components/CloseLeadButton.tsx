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
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--yrm-border)] bg-[var(--yrm-surface-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--yrm-ink)] transition-colors hover:border-[var(--yrm-border-strong)] disabled:opacity-50"
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
                <p className="rounded-xl border border-[rgba(178,74,63,0.28)] bg-[var(--yrm-danger-soft)] px-3 py-2 text-sm text-[var(--yrm-danger)]">
                    {errorMsg}
                </p>
            ) : null}
        </div>
    )
}
