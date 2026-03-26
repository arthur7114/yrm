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

  const notifications = notificationsResult.error ? [] : notificationsResult.data || []

  return (
    <LeadDashboard
      initialLeads={leads || []}
      notifications={notifications}
      logoutAction={logout}
    />
  )
}
