'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { submitLeadSimulation, type FormState } from './actions'
import { useEffect, useRef } from 'react'

const initialState: FormState = {
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
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${pending ? 'opacity-50 cursor-not-allowed' : ''
                }`}
        >
            {pending ? 'Enviando...' : 'Enviar mensagem'}
        </button>
    )
}

export default function SimularLeadPage() {
    const [state, formAction] = useActionState(submitLeadSimulation, initialState)
    const formRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        if (state.success && formRef.current) {
            formRef.current.reset()
        }
    }, [state.success])

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Simulação de Lead
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Simule a primeira mensagem de um lead para testar o fluxo de atendimento.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {state.message && (
                        <div
                            className={`mb-4 p-4 rounded-md ${state.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}
                        >
                            <p className="text-sm">{state.message}</p>
                        </div>
                    )}

                    <form action={formAction} ref={formRef} className="space-y-6">
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Nome do Lead
                            </label>
                            <div className="mt-1">
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            {state.errors?.name && (
                                <p className="mt-2 text-sm text-red-600">
                                    {state.errors.name[0]}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="phone"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Telefone do Lead
                            </label>
                            <div className="mt-1">
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    autoComplete="tel"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            {state.errors?.phone && (
                                <p className="mt-2 text-sm text-red-600">
                                    {state.errors.phone[0]}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="message"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Mensagem
                            </label>
                            <div className="mt-1">
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={4}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    defaultValue={''}
                                />
                            </div>
                            {state.errors?.message && (
                                <p className="mt-2 text-sm text-red-600">
                                    {state.errors.message[0]}
                                </p>
                            )}
                        </div>

                        <div>
                            <SubmitButton />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
