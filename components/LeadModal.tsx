'use client'

import { useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { createLead, CreateLeadState } from '@/app/leads/actions'
import { useActionState } from 'react'

const initialState: CreateLeadState = {
    message: '',
    success: false,
}

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-wait"
        >
            {pending ? 'Salvando...' : 'Salvar Lead'}
        </button>
    )
}

interface LeadModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function LeadModal({ isOpen, onClose }: LeadModalProps) {
    const [state, formAction] = useActionState(createLead, initialState)
    const formRef = useRef<HTMLFormElement>(null)

    // Close modal on success
    useEffect(() => {
        if (state.success) {
            // Small delay to show success state if needed, or close immediately
            const timer = setTimeout(() => {
                onClose()
                // Reset form state for next time (though unmounting handles visual reset, state persists if we re-open same instance?)
                // In this simple modal pattern, we depend on parent mostly. 
                // We can manually reset the form ref.
                formRef.current?.reset()
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [state.success, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-10 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Background backdrop */}
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

                <div className="relative inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">

                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex items-start justify-between">
                            <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                                Cadastrar Lead
                            </h3>
                            <button
                                type="button"
                                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                onClick={onClose}
                            >
                                <span className="sr-only">Fechar</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form action={formAction} ref={formRef} className="mt-4 space-y-4">

                            {/* LGPD Consent */}
                            <div className="rounded-md bg-blue-50 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-800">Consentimento LGPD (Obrigatório)</h3>
                                        <div className="mt-2 text-sm text-blue-700">
                                            <p>Informe ao lead que estes dados serão utilizados exclusivamente para fins de atendimento e qualificação, conforme a Lei Geral de Proteção de Dados.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-start">
                                    <div className="flex h-5 items-center">
                                        <input
                                            id="lgpd"
                                            name="lgpd"
                                            type="checkbox"
                                            required
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="lgpd" className="font-medium text-gray-700">Li e concordo com o uso dos dados conforme informado.</label>
                                        {state.errors?.lgpd && <p className="text-red-600 text-xs mt-1">{state.errors.lgpd[0]}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Lead Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Lead</label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    placeholder="Ex: João da Silva"
                                />
                                {state.errors?.name && <p className="text-red-600 text-xs mt-1">{state.errors.name[0]}</p>}
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
                                <input
                                    type="text"
                                    name="phone"
                                    id="phone"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    placeholder="Ex: 11999999999"
                                />
                                {state.errors?.phone && <p className="text-red-600 text-xs mt-1">{state.errors.phone[0]}</p>}
                            </div>

                            {/* Global Error/Success Message */}
                            {!state.success && state.message && (
                                <div className="rounded-md bg-red-50 p-3">
                                    <p className="text-sm text-red-700">{state.message}</p>
                                </div>
                            )}
                            {state.success && state.message && (
                                <div className="rounded-md bg-green-50 p-3">
                                    <p className="text-sm text-green-700">{state.message}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                                <SubmitButton />
                                <button
                                    type="button"
                                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0"
                                    onClick={onClose}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
