'use client'

import { useActionState } from 'react'
import { saveBusinessContext, BusinessContext } from '../actions'
import { useFormStatus } from 'react-dom'

const initialState = {
    message: '',
    success: false,
    errors: {}
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? 'Salvando...' : 'Salvar Configurações de Contexto'}
        </button>
    )
}

interface ContextFormProps {
    initialData: BusinessContext | null
}

export default function ContextForm({ initialData }: ContextFormProps) {
    const [state, formAction] = useActionState(saveBusinessContext, initialState)

    return (
        <section className="bg-white shadow rounded-lg p-6 mb-8 border border-gray-200">
            <div className="mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-900">1. Contexto do Negócio</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Defina as informações base que a Inteligência Artificial usará para entender a sua empresa e como ela deve se comunicar com os leads.
                </p>
            </div>

            {state?.success && (
                <div className="mb-4 rounded-md bg-green-50 p-4">
                    <p className="text-sm font-medium text-green-800">{state.message}</p>
                </div>
            )}
            {state?.success === false && state?.message && (
                <div className="mb-4 rounded-md bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-800">{state.message}</p>
                </div>
            )}

            <form action={formAction} className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">

                    {/* Business Name */}
                    <div className="sm:col-span-1">
                        <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">
                            Nome do Negócio
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="business_name"
                                id="business_name"
                                defaultValue={initialData?.business_name || ''}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Ex: Clínica Sorriso Fácil"
                            />
                        </div>
                        {state?.errors?.business_name && (
                            <p className="mt-2 text-sm text-red-600">{state.errors.business_name[0]}</p>
                        )}
                    </div>

                    {/* Business Type */}
                    <div className="sm:col-span-1">
                        <label htmlFor="business_type" className="block text-sm font-medium text-gray-700">
                            Tipo de Negócio <span className="text-gray-400 font-normal">(texto curto)</span>
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="business_type"
                                id="business_type"
                                defaultValue={initialData?.business_type || ''}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Ex: Odontologia Estética"
                            />
                        </div>
                        {state?.errors?.business_type && (
                            <p className="mt-2 text-sm text-red-600">{state.errors.business_type[0]}</p>
                        )}
                    </div>
                </div>

                {/* Service Objective */}
                <div>
                    <label htmlFor="service_objective" className="block text-sm font-medium text-gray-700">
                        Objetivo do Atendimento
                    </label>
                    <div className="mt-1">
                        <textarea
                            id="service_objective"
                            name="service_objective"
                            rows={3}
                            defaultValue={initialData?.service_objective || ''}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Ex: Qualificar o lead, entender a necessidade e conduzir para um agendamento de avaliação presencial."
                        />
                    </div>
                    {state?.errors?.service_objective && (
                        <p className="mt-2 text-sm text-red-600">{state.errors.service_objective[0]}</p>
                    )}
                </div>

                {/* Communication Tone */}
                <div>
                    <label htmlFor="communication_tone" className="block text-sm font-medium text-gray-700">
                        Tom de Comunicação
                    </label>
                    <p className="mt-1 text-xs text-gray-500 mb-2">Selecione o estilo de abordagem que a automação deve usar com seus clientes.</p>
                    <div className="mt-1">
                        <select
                            id="communication_tone"
                            name="communication_tone"
                            defaultValue={initialData?.communication_tone || 'consultativo'}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="formal">Formal (Respeitoso, Sério, Direto ao Ponto)</option>
                            <option value="informal">Informal (Descontraído, Próximo, Uso de Emojis)</option>
                            <option value="consultativo">Consultivo (Acolhedor, Focado em Entender o Problema, Didático)</option>
                            <option value="vendas_agressivo">Direto/Vendas (Focado em Conversão, Urgência, Objetivo)</option>
                            <option value="educativo">Educativo (Professor, Paciente, Explica cada Passo)</option>
                        </select>
                    </div>
                    {state?.errors?.communication_tone && (
                        <p className="mt-2 text-sm text-red-600">{state.errors.communication_tone[0]}</p>
                    )}
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-end">
                    <SubmitButton />
                </div>
            </form>
        </section>
    )
}
