import { getBusinessContext, getQualificationQuestions } from './actions'
import ContextForm from './_components/ContextForm'
import ClassificationInfo from './_components/ClassificationInfo'
import QuestionsManager from './_components/QuestionsManager'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Configurações de Contexto - Lead System',
    description: 'Defina o contexto estratégico do negócio para a IA.',
}

export default async function SettingsPage() {
    // Fetch data concurrently
    const [contextRes, questionsRes] = await Promise.all([
        getBusinessContext(),
        getQualificationQuestions()
    ])

    // If unauthenticated, the actions return success: false and message. We should redirect to login.
    // In a real app with nextjs-auth, middleware handles this. Here we just double check.
    if (contextRes.message === 'Não autenticado' || contextRes.message === 'Sessão expirada. Faça login novamente.') {
        redirect('/login')
    }

    const businessContext = contextRes.data || null
    const questions = questionsRes.data || []

    return (
        <div className="min-h-screen flex flex-col">

            {/* Main Content */}
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Estratégia do Negócio</h1>
                    <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-3xl">
                        Estas configurações definem como a Inteligência Artificial entende a sua empresa, como ela qualifica os leads que chegam e qual será o tom da conversa. Preencha com cuidado, pois isso impacta diretamente nas taxas de conversão.
                    </p>
                </header>

                {/* Block 1: Business Context Form */}
                <ContextForm initialData={businessContext} />

                {/* Block 2: Informational Classification Block */}
                <ClassificationInfo />

                {/* Block 3: Qualification Questions Manager */}
                <QuestionsManager initialQuestions={questions} />

            </main>
        </div>
    )
}
