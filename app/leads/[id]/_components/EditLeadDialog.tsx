'use client'

import { useState, useTransition } from 'react'
import { Pencil, Loader2, X, Check } from 'lucide-react'
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
                <Pencil className="h-4 w-4" />
                Editar Dados do Lead
            </button>
        )
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Editar Lead</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="p-5 space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nome</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Nome do lead"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Telefone</label>
                    <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Telefone"
                    />
                </div>

                {errorMsg && (
                    <div className="p-2 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                        {errorMsg}
                    </div>
                )}
                {successMsg && (
                    <div className="p-2 bg-green-50 text-green-600 text-sm rounded-md border border-green-100 flex items-center gap-2">
                        <Check className="h-4 w-4" /> {successMsg}
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    {isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                    ) : (
                        'Salvar Alterações'
                    )}
                </button>
            </div>
        </div>
    )
}
