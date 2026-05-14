'use client'

import { useState, useTransition } from 'react'
import { Loader2, UserRoundCheck } from 'lucide-react'

import { claimLeadForHuman } from '../actions'

export default function ClaimLeadButton({ leadId }: { leadId: number }) {
    const [isPending, startTransition] = useTransition()
    const [errorMsg, setErrorMsg] = useState('')

    const handleClaim = () => {
        setErrorMsg('')
        startTransition(async () => {
            const result = await claimLeadForHuman(leadId)
            if (!result.success) {
                setErrorMsg(result.message || 'Erro ao assumir atendimento.')
            }
        })
    }

    return (
        <div className="space-y-2">
            <button
                onClick={handleClaim}
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--yrm-human)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
                {isPending ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Assumindo...
                    </>
                ) : (
                    <>
                        <UserRoundCheck className="h-4 w-4" />
                        Assumir Atendimento
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
