'use client'

import { useState, useTransition } from 'react'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { deleteLead } from '../actions'
import { useRouter } from 'next/navigation'

export default function DeleteLeadDialog({ leadId }: { leadId: number }) {
    const [isPending, startTransition] = useTransition()
    const [showConfirm, setShowConfirm] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const router = useRouter()

    const handleDelete = () => {
        setErrorMsg('')
        startTransition(async () => {
            const res = await deleteLead(leadId)
            if (res.success) {
                router.push('/')
            } else {
                setErrorMsg(res.message || 'Erro ao excluir.')
            }
        })
    }

    if (!showConfirm) {
        return (
            <button
                onClick={() => setShowConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 hover:border-red-300 transition-colors"
            >
                <Trash2 className="h-4 w-4" />
                Excluir Lead
            </button>
        )
    }

    return (
        <div className="bg-white rounded-lg border border-red-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-red-50 border-b border-red-100 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-sm font-semibold text-red-900">Exclusão Definitiva</h3>
                    <p className="text-xs text-red-700 mt-1 leading-relaxed">
                        Esta ação remove permanentemente todos os dados deste lead, incluindo
                        histórico de mensagens, classificações e registros de atendimento.
                        Essa operação não pode ser desfeita.
                    </p>
                </div>
            </div>

            <div className="p-5 space-y-3">
                {errorMsg && (
                    <div className="p-2 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                        {errorMsg}
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={handleDelete}
                        disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                        {isPending ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Excluindo...</>
                        ) : (
                            <><Trash2 className="h-4 w-4" /> Excluir definitivamente</>
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
        </div>
    )
}
