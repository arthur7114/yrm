'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { saveBusinessContext, BusinessContext } from '../actions'

const initialState = {
    message: '',
    success: false,
    errors: {},
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl border border-[var(--yrm-accent)] bg-[var(--yrm-accent)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--yrm-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
            {pending ? 'Salvando...' : 'Salvar contexto'}
        </button>
    )
}

interface ContextFormProps {
    initialData: BusinessContext | null
}

export default function ContextForm({ initialData }: ContextFormProps) {
    const [state, formAction] = useActionState(saveBusinessContext, initialState)

    return (
        <div className="space-y-5">
            {state?.success ? (
                <div className="rounded-2xl border border-[rgba(47,106,85,0.24)] bg-[var(--yrm-human-soft)] p-4 text-sm text-[var(--yrm-human)]">
                    {state.message}
                </div>
            ) : null}
            {state?.success === false && state?.message ? (
                <div className="rounded-2xl border border-[rgba(178,74,63,0.28)] bg-[var(--yrm-danger-soft)] p-4 text-sm text-[var(--yrm-danger)]">
                    {state.message}
                </div>
            ) : null}

            <form action={formAction} className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                        <label htmlFor="business_name" className="yrm-kicker">
                            Nome do negócio
                        </label>
                        <input
                            type="text"
                            name="business_name"
                            id="business_name"
                            defaultValue={initialData?.business_name || ''}
                            className="w-full rounded-xl border border-[var(--yrm-border)] bg-[var(--yrm-surface)] px-4 py-3 text-sm text-[var(--yrm-ink)]"
                            placeholder="Ex: Clínica Sorriso Fácil"
                        />
                        {state?.errors?.business_name ? (
                            <p className="text-sm text-[var(--yrm-danger)]">{state.errors.business_name[0]}</p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="business_type" className="yrm-kicker">
                            Tipo de negócio
                        </label>
                        <input
                            type="text"
                            name="business_type"
                            id="business_type"
                            defaultValue={initialData?.business_type || ''}
                            className="w-full rounded-xl border border-[var(--yrm-border)] bg-[var(--yrm-surface)] px-4 py-3 text-sm text-[var(--yrm-ink)]"
                            placeholder="Ex: Odontologia estética"
                        />
                        {state?.errors?.business_type ? (
                            <p className="text-sm text-[var(--yrm-danger)]">{state.errors.business_type[0]}</p>
                        ) : null}
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="service_objective" className="yrm-kicker">
                        Objetivo do atendimento
                    </label>
                    <textarea
                        id="service_objective"
                        name="service_objective"
                        rows={4}
                        defaultValue={initialData?.service_objective || ''}
                        className="w-full rounded-2xl border border-[var(--yrm-border)] bg-[var(--yrm-surface)] px-4 py-3 text-sm leading-6 text-[var(--yrm-ink)]"
                        placeholder="Ex: Qualificar o lead, entender a necessidade e conduzir para um agendamento."
                    />
                    {state?.errors?.service_objective ? (
                        <p className="text-sm text-[var(--yrm-danger)]">{state.errors.service_objective[0]}</p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <label htmlFor="communication_tone" className="yrm-kicker">
                        Tom de comunicação
                    </label>
                    <select
                        id="communication_tone"
                        name="communication_tone"
                        defaultValue={initialData?.communication_tone || 'consultativo'}
                        className="w-full rounded-xl border border-[var(--yrm-border)] bg-[var(--yrm-surface)] px-4 py-3 text-sm text-[var(--yrm-ink)]"
                    >
                        <option value="formal">Formal</option>
                        <option value="informal">Informal</option>
                        <option value="consultativo">Consultivo</option>
                        <option value="vendas_agressivo">Direto/Vendas</option>
                        <option value="educativo">Educativo</option>
                    </select>
                    {state?.errors?.communication_tone ? (
                        <p className="text-sm text-[var(--yrm-danger)]">{state.errors.communication_tone[0]}</p>
                    ) : null}
                </div>

                <div className="flex justify-end">
                    <SubmitButton />
                </div>
            </form>
        </div>
    )
}
