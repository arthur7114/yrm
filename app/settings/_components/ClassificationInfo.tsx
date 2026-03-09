import { Flame, SparklesIcon, SnowflakeIcon } from 'lucide-react'

export default function ClassificationInfo() {
    return (
        <section className="bg-white shadow rounded-lg p-6 mb-8 border border-gray-200">
            <div className="mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-900">2. Critérios de Classificação</h2>
                <p className="mt-1 text-sm text-gray-500">
                    O sistema utiliza estas referências conceituais para classificar automaticamente a temperatura do lead durante o atendimento.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Frio */}
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <SnowflakeIcon className="h-16 w-16 text-blue-600" />
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                        <div className="bg-blue-100 p-2 rounded-md">
                            <SnowflakeIcon className="h-5 w-5 text-blue-700" />
                        </div>
                        <h3 className="text-lg font-semibold text-blue-900">Lead Frio</h3>
                    </div>
                    <p className="text-sm text-blue-800 leading-relaxed relative z-10">
                        Ainda está na fase de descoberta. Demonstrou interesse inicial, mas não fechou o escopo do que precisa ou não está no momento de compra.
                    </p>
                </div>

                {/* Morno */}
                <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-4 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <SparklesIcon className="h-16 w-16 text-yellow-600" />
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                        <div className="bg-yellow-100 p-2 rounded-md">
                            <SparklesIcon className="h-5 w-5 text-yellow-700" />
                        </div>
                        <h3 className="text-lg font-semibold text-yellow-900">Lead Morno</h3>
                    </div>
                    <p className="text-sm text-yellow-800 leading-relaxed relative z-10">
                        Sabe o que quer e tem fit com a solução. Está considerando opções, tirando dúvidas de escopo ou orçamento. Precisa de um pequeno empurrão.
                    </p>
                </div>

                {/* Quente */}
                <div className="rounded-lg border border-red-100 bg-red-50 p-4 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Flame className="h-16 w-16 text-red-600" />
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                        <div className="bg-red-100 p-2 rounded-md">
                            <Flame className="h-5 w-5 text-red-700" />
                        </div>
                        <h3 className="text-lg font-semibold text-red-900">Lead Quente</h3>
                    </div>
                    <p className="text-sm text-red-800 leading-relaxed relative z-10">
                        Decisão tomada ou orçamento aprovado. Tem urgência e só precisa de detalhes logísticos para iniciar o projeto ou assinar o contrato.
                    </p>
                </div>
            </div>
        </section>
    )
}
