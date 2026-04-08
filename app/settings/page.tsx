import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FlaskConical, Settings2 } from 'lucide-react'

import AppShell from '@/components/app-shell/AppShell'
import SectionPanel from '@/components/ui/SectionPanel'

import { getBusinessContext, getQualificationQuestions } from './actions'
import ClassificationInfo from './_components/ClassificationInfo'
import ContextForm from './_components/ContextForm'
import QuestionsManager from './_components/QuestionsManager'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Configuração Operacional - YRM',
    description: 'Contexto do negócio, critérios de qualificação e ferramentas internas.',
}

export default async function SettingsPage() {
    const [contextRes, questionsRes] = await Promise.all([
        getBusinessContext(),
        getQualificationQuestions(),
    ])

    if (contextRes.message === 'Não autenticado' || contextRes.message === 'Sessão expirada. Faça login novamente.') {
        redirect('/login')
    }

    const businessContext = contextRes.data || null
    const questions = questionsRes.data || []

    return (
        <AppShell
            eyebrow="Configuração operacional"
            title="Configuração"
            description="Defina como o sistema interpreta o negócio, qualifica a demanda e expõe ferramentas internas sem competir com o fluxo principal."
        >
            <div className="space-y-6">
                <SectionPanel
                    title="Negócio"
                    description="Base estratégica que orienta tom, objetivo comercial e entendimento de contexto."
                    aside={<Settings2 className="h-4 w-4 text-[var(--yrm-muted)]" />}
                >
                    <ContextForm initialData={businessContext} />
                </SectionPanel>

                <SectionPanel
                    title="Qualificação"
                    description="Critérios conceituais e perguntas que moldam a leitura comercial do lead."
                >
                    <div className="space-y-6">
                        <ClassificationInfo />
                        <QuestionsManager initialQuestions={questions} />
                    </div>
                </SectionPanel>

                <SectionPanel
                    title="Ferramentas internas"
                    description="Superfícies auxiliares para teste e validação do fluxo, fora da navegação principal."
                    aside={<FlaskConical className="h-4 w-4 text-[var(--yrm-muted)]" />}
                >
                    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--yrm-border)] bg-[rgba(252,250,247,0.84)] p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1">
                            <p className="yrm-kicker">Laboratório</p>
                            <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--yrm-ink)]">
                                Simulação de entrada de lead
                            </h3>
                            <p className="max-w-2xl text-sm leading-6 text-[var(--yrm-muted)]">
                                Use esta superfície para testar ingestão e comportamento do fluxo sem alterar a navegação principal da operação.
                            </p>
                        </div>
                        <Link
                            href="/simular-lead"
                            className="inline-flex items-center justify-center rounded-xl border border-[var(--yrm-accent)] bg-[var(--yrm-accent)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--yrm-accent-strong)]"
                        >
                            Abrir simulação
                        </Link>
                    </div>
                </SectionPanel>
            </div>
        </AppShell>
    )
}
