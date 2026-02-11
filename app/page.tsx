import { logout } from './login/actions'
import { createClient } from '@/lib/supabase-server'
import LeadDashboard from '@/components/LeadDashboard'

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

  return (
    <LeadDashboard
      initialLeads={leads || []}
      logoutAction={logout}
    />
  )
}
