import Link from 'next/link'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase-server'

type LeadMessage = {
  id: number
  sender_type: string
  message_content: string
  content_type?: string | null
  message_direction?: string | null
  created_at: string
  metadata?: Record<string, unknown> | null
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  const [{ data: lead, error: leadError }, { data: messages, error: messageError }] =
    await Promise.all([
      supabase.from('leads').select('*').eq('id', id).eq('user_id', user.id).maybeSingle(),
      supabase
        .from('messages')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: true }),
    ])

  if (leadError || !lead) {
    notFound()
  }

  if (messageError) {
    throw new Error(messageError.message)
  }

  const displayName = lead.lead_name || lead.phone_number || 'Lead sem identificação'
  const lastActivity = lead.last_message_at || lead.created_at

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Voltar para a lista
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">{displayName}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Última atividade em{' '}
              {new Date(lastActivity).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
              {(lead.current_classification || 'sem classificação').toString()}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              {(lead.current_status || 'sem status').toString().replaceAll('_', ' ')}
            </span>
          </div>
        </div>

        <section className="grid gap-4 rounded-xl bg-white p-6 shadow-sm sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Contato
            </h2>
            <dl className="mt-3 space-y-2 text-sm text-gray-700">
              <div>
                <dt className="font-medium text-gray-900">Telefone</dt>
                <dd>{lead.phone_number || 'Não informado'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Sessão externa</dt>
                <dd>{lead.external_session_id || 'Não informada'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Tier</dt>
                <dd>{lead.lead_tier || 'Não classificado'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Score</dt>
                <dd>{lead.score_total ?? 'Não calculado'}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Resumo de qualificação
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {lead.qualification_summary || 'A IA ainda não gerou um resumo de qualificação.'}
            </p>
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Histórico da conversa</h2>
            <span className="text-sm text-gray-500">{messages?.length || 0} mensagens</span>
          </div>

          <div className="space-y-4">
            {(messages as LeadMessage[] | null)?.length ? (
              (messages as LeadMessage[]).map((message) => {
                const inbound = message.message_direction === 'inbound' || message.sender_type === 'lead'

                return (
                  <article
                    key={message.id}
                    className={`max-w-3xl rounded-2xl px-4 py-3 shadow-sm ${
                      inbound
                        ? 'bg-slate-100 text-slate-900'
                        : 'ml-auto bg-indigo-600 text-white'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-4 text-xs uppercase tracking-wide opacity-80">
                      <span>{inbound ? 'Lead' : 'Agente'}</span>
                      <span>
                        {new Date(message.created_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6">{message.message_content}</p>
                    <p className="mt-2 text-xs opacity-75">
                      Tipo: {message.content_type || 'text'}
                    </p>
                  </article>
                )
              })
            ) : (
              <p className="text-sm text-gray-500">Nenhuma mensagem registrada para este lead.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
