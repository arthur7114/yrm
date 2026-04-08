import { createClient } from '@/lib/supabase-server'
import LeadDashboard from '@/components/LeadDashboard'
import { logout } from './login/actions'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const [{ data: leads, error }, notificationsResult] = await Promise.all([
        supabase
            .from('leads')
            .select('*')
            .eq('user_id', user.id)
            .order('last_message_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false }),
        supabase
            .from('notifications')
            .select('id, title, body, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5),
    ])

    if (error) {
        return (
            <div className="p-4 text-red-600">Erro ao carregar leads: {error.message}</div>
        )
    }

    let totalMessages = 0
    if (leads && leads.length > 0) {
        const leadIds = leads.map((lead) => lead.id)
        const { count, error: msgError } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .in('lead_id', leadIds)

        if (!msgError && count) {
            totalMessages = count
        }
    }

    const dailyData: { date: string; total: number; quente: number; morno: number; frio: number }[] = []
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        const dayLeads = leads?.filter((lead) => lead.created_at.startsWith(dateStr)) || []
        dailyData.push({
            date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            total: dayLeads.length,
            quente: dayLeads.filter((lead) => lead.current_classification === 'quente').length,
            morno: dayLeads.filter((lead) => lead.current_classification === 'morno').length,
            frio: dayLeads.filter((lead) => lead.current_classification === 'frio').length,
        })
    }

    const notifications = notificationsResult.error ? [] : notificationsResult.data || []

    const metrics = {
        totalLeads: leads?.length || 0,
        hotLeads: leads?.filter((lead) => lead.current_classification === 'quente').length || 0,
        warmLeads: leads?.filter((lead) => lead.current_classification === 'morno').length || 0,
        coldLeads: leads?.filter((lead) => lead.current_classification === 'frio').length || 0,
        unclassifiedLeads: leads?.filter((lead) => !lead.current_classification).length || 0,
        totalMessages,
        dailyData,
    }

    return (
        <LeadDashboard
            initialLeads={leads || []}
            notifications={notifications}
            logoutAction={logout}
            metrics={metrics}
        />
    )
}
