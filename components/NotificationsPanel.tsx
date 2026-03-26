type NotificationItem = {
  id: number
  title: string
  body: string | null
  created_at: string
}

interface NotificationsPanelProps {
  notifications: NotificationItem[]
}

export default function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Novos leads</h2>
          <p className="mt-1 text-sm text-gray-500">
            Alertas gerados quando um lead entra pelo atendimento.
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
          {notifications.length}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <article key={notification.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-semibold text-gray-900">{notification.title}</h3>
                <span className="text-xs text-gray-500">
                  {new Date(notification.created_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {notification.body ? (
                <p className="mt-2 text-sm text-gray-600">{notification.body}</p>
              ) : null}
            </article>
          ))
        ) : (
          <p className="text-sm text-gray-500">Nenhuma notificação recente.</p>
        )}
      </div>
    </section>
  )
}
