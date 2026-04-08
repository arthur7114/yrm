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
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
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
                <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {errorMsg}
                </p>
            ) : null}
        </div>
    )
}
