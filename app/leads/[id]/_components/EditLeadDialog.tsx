'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2, Pencil, X } from 'lucide-react'

import { updateLead } from '../actions'

export default function EditLeadDialog({ leadId, currentName, currentPhone }: {
    leadId: number
    currentName: string
    currentPhone: string
}) {
    const [isPending, startTransition] = useTransition()
    const [isOpen, setIsOpen] = useState(false)
    const [name, setName] = useState(currentName)
    const [phone, setPhone] = useState(currentPhone)
    const [errorMsg, setErrorMsg] = useState('')
    const [successMsg, setSuccessMsg] = useState('')

    const handleOpen = () => {
        setName(currentName)
        setPhone(currentPhone)
        setErrorMsg('')
        setSuccessMsg('')
        setIsOpen(true)
    }

    const handleSubmit = () => {
        setErrorMsg('')
        setSuccessMsg('')

        if (!name.trim() || !phone.trim()) {
            setErrorMsg('Nome e telefone são obrigatórios.')
            return
        }

        startTransition(async () => {
            const res = await updateLead(leadId, {
                lead_name: name.trim(),
                phone_number: phone.trim()
            })
            if (res.success) {
                setSuccessMsg('Dados atualizados com sucesso.')
                setTimeout(() => {
                    setIsOpen(false)
                    setSuccessMsg('')
                }, 1200)
            } else {
                setErrorMsg(res.message || 'Erro ao salvar.')
            }
        })
    }

    if (!isOpen) {
        return (
            <button
                onClick={handleOpen}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--yrm-border)] bg-[var(--yrm-surface-strong)] px-4 py-2 text-sm font-medium text-[var(--yrm-muted)] transition-colors hover:border-[var(--yrm-border-strong)] hover:text-[var(--yrm-ink)]"
            >
                <Pencil className="h-4 w-4" />
                Editar dados do lead
            </button>
        )
    }

    return (
        <div className="overflow-hidden rounded-xl border border-[var(--yrm-border)] bg-[var(--yrm-surface)]">
            <div className="flex items-center justify-between border-b border-[var(--yrm-border)] px-5 py-4">
                <h3 className="text-sm font-semibold text-[var(--yrm-ink)]">Editar lead</h3>
                <button onClick={() => setIsOpen(false)} className="text-[var(--yrm-muted-soft)] hover:text-[var(--yrm-ink)]">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="space-y-4 p-5">
                <div>
                    <label className="yrm-kicker mb-1 block">Nome</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border border-[var(--yrm-border)] bg-[var(--yrm-surface-strong)] px-3 py-2 text-sm text-[var(--yrm-ink)] placeholder:text-[var(--yrm-muted-soft)] focus:border-[var(--yrm-accent)] focus:outline-none"
                        placeholder="Nome do lead"
                    />
                </div>
                <div>
                    <label className="yrm-kicker mb-1 block">Telefone</label>
                    <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-lg border border-[var(--yrm-border)] bg-[var(--yrm-surface-strong)] px-3 py-2 text-sm text-[var(--yrm-ink)] placeholder:text-[var(--yrm-muted-soft)] focus:border-[var(--yrm-accent)] focus:outline-none"
                        placeholder="Telefone"
                    />
                </div>

                {errorMsg && (
                    <p className="rounded-xl border border-[rgba(178,74,63,0.28)] bg-[var(--yrm-danger-soft)] px-3 py-2 text-sm text-[var(--yrm-danger)]">
                        {errorMsg}
                    </p>
                )}
                {successMsg && (
                    <p className="flex items-center gap-2 rounded-xl border border-[rgba(76,212,162,0.22)] bg-[var(--yrm-human-soft)] px-3 py-2 text-sm text-[var(--yrm-human)]">
                        <Check className="h-4 w-4" /> {successMsg}
                    </p>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--yrm-primary)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                    {isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                    ) : (
                        'Salvar alterações'
                    )}
                </button>
            </div>
        </div>
    )
}
