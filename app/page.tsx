import { logout } from './login/actions'
import { createClient } from '@/lib/supabase-server'
import LeadDashboard from '@/components/LeadDashboard'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  // 1. Get User
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // 2. Fetch Leads
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, lead_name, phone_number, current_classification, current_status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-4 text-red-600">Erro ao carregar leads: {error.message}</div>
    )
  }

  // 3. Calculate Metrics
  let totalMessages = 0
  if (leads && leads.length > 0) {
    const leadIds = leads.map(l => l.id)
    const { count, error: msgError } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('lead_id', leadIds)

    if (!msgError && count) {
      totalMessages = count
    }
  }

  // 4. Build temporal data (leads per day, last 14 days)
  const dailyData: { date: string; total: number; quente: number; morno: number; frio: number }[] = []
  const now = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0] // YYYY-MM-DD
    const dayLeads = leads?.filter(l => l.created_at.startsWith(dateStr)) || []
    dailyData.push({
      date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      total: dayLeads.length,
      quente: dayLeads.filter(l => l.current_classification === 'quente').length,
      morno: dayLeads.filter(l => l.current_classification === 'morno').length,
      frio: dayLeads.filter(l => l.current_classification === 'frio').length,
    })
  }

  const metrics = {
    totalLeads: leads?.length || 0,
    hotLeads: leads?.filter(l => l.current_classification === 'quente').length || 0,
    warmLeads: leads?.filter(l => l.current_classification === 'morno').length || 0,
    coldLeads: leads?.filter(l => l.current_classification === 'frio').length || 0,
    unclassifiedLeads: leads?.filter(l => !l.current_classification || l.current_status === 'aguardando_classificacao').length || 0,
    totalMessages,
    dailyData
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <LeadDashboard
        initialLeads={leads || []}
        logoutAction={logout}
        metrics={metrics}
      />
    </div>
  )
}
