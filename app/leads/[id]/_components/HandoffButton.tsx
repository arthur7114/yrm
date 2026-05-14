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
            <div className="rounded-xl border border-[rgba(201,133,29,0.3)] bg-[var(--yrm-warm-soft)] p-5">
                <div className="mb-4 flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--yrm-warm)]" />
                    <div>
                        <h4 className="text-sm font-semibold text-[var(--yrm-ink)]">Confirmar handoff manual</h4>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--yrm-muted)]">
                            O lead será movido para{' '}
                            <code className="font-mono">aguardando_humano</code> e o fluxo automático deixará de responder.
                        </p>
                    </div>
                </div>

                {errorMsg ? (
                    <div className="mb-3 rounded-xl border border-[rgba(178,74,63,0.28)] bg-[var(--yrm-danger-soft)] p-2 text-sm text-[var(--yrm-danger)]">
                        {errorMsg}
                    </div>
                ) : null}

                <div className="flex gap-2">
                    <button
                        onClick={handleHandoff}
                        disabled={isPending}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--yrm-human)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
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
                        className="rounded-xl border border-[var(--yrm-border)] bg-[var(--yrm-surface-strong)] px-4 py-2 text-sm font-medium text-[var(--yrm-muted)] transition-colors hover:text-[var(--yrm-ink)] disabled:opacity-50"
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
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--yrm-border)] bg-[var(--yrm-surface-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--yrm-muted)] transition-colors hover:border-[var(--yrm-border-strong)] hover:text-[var(--yrm-ink)]"
        >
            <UserCheck className="h-4 w-4" />
            Solicitar Handoff Manual
        </button>
    )
}
