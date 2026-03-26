'use client'

import { useState } from 'react'
import LeadCard from './LeadCard'
import EmptyState from './EmptyState'
import LeadModal from './LeadModal'
import NotificationsPanel from './NotificationsPanel'

interface LeadDashboardProps {
    initialLeads: {
        id: number
        lead_name?: string | null
        phone_number?: string | null
        current_classification?: string | null
        current_status?: string | null
        created_at: string
        last_message_at?: string | null
        last_message_preview?: string | null
    }[]
    notifications: {
        id: number
        title: string
        body: string | null
        created_at: string
    }[]
    logoutAction: () => Promise<void> // Pass server action as prop or import
}

export default function LeadDashboard({ initialLeads, notifications, logoutAction }: LeadDashboardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    // We rely on revalidatePath in the server action to update the list, 
    // but since this is a client component receiving 'initialLeads', 
    // we might need to rely on the parent RSC refreshing.
    // In Next.js App Router, revalidatePath refreshes the RSC payload, 
    // so 'initialLeads' prop *will* update when the parent re-renders.

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="font-bold text-xl text-indigo-600">Lead System</span>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={() => logoutAction()}
                                className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="py-10">
                <header>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <h1 className="text-3xl font-bold leading-tight text-gray-900">Meus Leads</h1>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Criar Novo Lead
                        </button>
                    </div>
                </header>
                <main>
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="px-4 py-8 sm:px-0">
                            <div className="mb-6">
                                <NotificationsPanel notifications={notifications} />
                            </div>

                            {initialLeads && initialLeads.length > 0 ? (
                                <div className="space-y-4">
                                    {initialLeads.map((lead) => (
                                        <LeadCard key={lead.id} lead={lead} />
                                    ))}
                                </div>
                            ) : (
                                // Passing openModal to EmptyState if we want the button there to work too
                                <div onClick={() => setIsModalOpen(true)}>
                                    <EmptyState />
                                </div>
                            )}

                        </div>
                    </div>
                </main>
            </div>

            <LeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    )
}
