'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'

import { deleteLead } from '../actions'

function getSafeBackHref(backHref?: string) {
    if (!backHref || !backHref.startsWith('/')) {
        return '/leads'
    }

    return backHref
}

export default function DeleteLeadDialog({
    leadId,
    backHref,
}: {
    leadId: number
    backHref?: string
}) {
    const [isPending, startTransition] = useTransition()
    const [showConfirm, setShowConfirm] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const router = useRouter()
    const redirectHref = getSafeBackHref(backHref)

    const handleDelete = () => {
        setErrorMsg('')
        startTransition(async () => {
            const res = await deleteLead(leadId)

            if (res.success) {
                router.replace(redirectHref)
                router.refresh()
                return
            }

            setErrorMsg(res.message || 'Erro ao excluir.')
        })
    }

    if (!showConfirm) {
        return (
            <button
                onClick={() => setShowConfirm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-[1.4rem] border border-[rgba(255,116,102,0.28)] bg-[var(--yrm-danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--yrm-danger)] hover:border-[rgba(255,116,102,0.42)] hover:bg-[rgba(255,116,102,0.16)]"
            >
                <Trash2 className="h-4 w-4" />
                Excluir lead
            </button>
        )
    }

    return (
        <div className="overflow-hidden rounded-[1.6rem] border border-[rgba(255,116,102,0.28)] bg-[var(--yrm-surface)] shadow-[var(--yrm-shadow)]">
            <div className="flex items-start gap-3 border-b border-[rgba(255,116,102,0.16)] bg-[var(--yrm-danger-soft)] px-5 py-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--yrm-danger)]" />
                <div>
                    <h3 className="text-sm font-semibold text-[var(--yrm-ink)]">Exclusão definitiva</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--yrm-muted)]">
                        Esta ação remove permanentemente o lead e o contexto relacionado, incluindo mensagens,
                        qualificações, eventos operacionais e registros de atendimento. Essa operação não pode
                        ser desfeita.
                    </p>
                </div>
            </div>

            <div className="space-y-3 p-5">
                {errorMsg ? (
                    <div className="rounded-xl border border-[rgba(255,116,102,0.24)] bg-[var(--yrm-danger-soft)] p-3 text-sm text-[var(--yrm-danger)]">
                        {errorMsg}
                    </div>
                ) : null}

                <div className="flex gap-2">
                    <button
                        onClick={handleDelete}
                        disabled={isPending}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--yrm-danger)] px-4 py-3 text-sm font-semibold text-[#090d14] hover:bg-[#ff8a7e] disabled:opacity-50"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Excluindo...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4" /> Excluir definitivamente
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setShowConfirm(false)
                            setErrorMsg('')
                        }}
                        disabled={isPending}
                        className="rounded-xl border border-[var(--yrm-border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm font-medium text-[var(--yrm-muted)] hover:border-[var(--yrm-border-strong)] hover:bg-[var(--yrm-surface-strong)] hover:text-[var(--yrm-ink)] disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    )
}
