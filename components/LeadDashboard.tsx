'use client'

import { useState } from 'react'
import EmptyState from './EmptyState'
import LeadCard from './LeadCard'
import LeadModal from './LeadModal'
import MetricsDashboard from './MetricsDashboard'
import NotificationsPanel from './NotificationsPanel'

type LeadItem = {
    id: number
    lead_name?: string | null
    phone_number?: string | null
    current_classification?: string | null
    current_status?: string | null
    created_at: string
    last_message_at?: string | null
    last_message_preview?: string | null
}

type NotificationItem = {
    id: number
    title: string
    body: string | null
    created_at: string
}

type DailyData = {
    date: string
    total: number
    quente: number
    morno: number
    frio: number
}

type Metrics = {
    totalLeads: number
    hotLeads: number
    warmLeads: number
    coldLeads: number
    unclassifiedLeads: number
    totalMessages: number
    dailyData: DailyData[]
}

interface LeadDashboardProps {
    initialLeads: LeadItem[]
    notifications: NotificationItem[]
    logoutAction: () => Promise<void>
    metrics?: Metrics | null
}

export default function LeadDashboard({ initialLeads, notifications, metrics }: LeadDashboardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="pb-10">
                {metrics ? <MetricsDashboard metrics={metrics} /> : null}

                <header className="mb-6 mt-8">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold leading-tight text-gray-900 dark:text-white">Meus Leads</h1>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Criar Novo Lead
                        </button>
                    </div>
                </header>

                <main className="space-y-6">
                    <NotificationsPanel notifications={notifications} />

                    {initialLeads.length > 0 ? (
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
                </main>
            </div>

            <LeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    )
}
