'use client'

import { useState } from 'react'
import LeadCard from './LeadCard'
import EmptyState from './EmptyState'
import LeadModal from './LeadModal'
import MetricsDashboard from './MetricsDashboard'

interface LeadDashboardProps {
    initialLeads: any[]
    logoutAction: () => Promise<void> // Kept for backwards compatibility if needed elsewhere, though unused here now
    metrics: any
}

export default function LeadDashboard({ initialLeads, logoutAction, metrics }: LeadDashboardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <div className="w-full">
            {/* The global Navbar is handling the top navigation now */}

            <div className="pb-10">
                {/* Metrics Section */}
                {metrics && <MetricsDashboard metrics={metrics} />}

                <header className="mt-8 mb-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold leading-tight text-gray-900 dark:text-white">Meus Leads</h1>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            Criar Novo Lead
                        </button>
                    </div>
                </header>
                <main>
                    <div>
                        {initialLeads && initialLeads.length > 0 ? (
                            <div className="space-y-4">
                                {initialLeads.map((lead) => (
                                    <LeadCard key={lead.id} lead={lead} />
                                ))}
                            </div>
                        ) : (
                            <div onClick={() => setIsModalOpen(true)}>
                                <EmptyState />
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <LeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    )
}
