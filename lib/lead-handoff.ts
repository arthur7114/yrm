import { revalidatePath } from 'next/cache'

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { setRedisHandoff } from '@/lib/redis'

const supabase = () => getSupabaseAdmin()

type HandoffSource = 'agent' | 'operator'

type ActivateHandoffOptions = {
  leadId: number
  requestedBy: HandoffSource
  summaryContext?: string | null
}

type RevertHandoffOptions = {
  leadId: number
  revertedBy: HandoffSource
}

export type HandoffResult =
  | { ok: true; leadId: number }
  | { ok: false; error: string }

/**
 * Activates human handoff for a lead.
 * - Sets is_human_handoff = true on the lead.
 * - Advances current_status to 'em_atendimento_humano' when coming from
 *   'aguardando_humano', leaving other statuses untouched.
 * - Opens a lead_handoffs record (idempotent: skips if one already exists
 *   and the lead is not closed).
 */
export async function activateHumanHandoff({
  leadId,
  requestedBy,
  summaryContext,
}: ActivateHandoffOptions): Promise<HandoffResult> {
  const { data: lead, error: fetchError } = await supabase()
    .from('leads')
    .select('id, current_status, is_human_handoff, external_session_id')
    .eq('id', leadId)
    .maybeSingle()

  if (fetchError) return { ok: false, error: fetchError.message }
  if (!lead) return { ok: false, error: `Lead ${leadId} not found.` }

  const nextStatus =
    lead.current_status === 'aguardando_humano' ? 'em_atendimento_humano' : lead.current_status

  const updatePayload: Record<string, unknown> = {
    is_human_handoff: true,
    current_status: nextStatus,
  }

  const { error: updateError } = await supabase()
    .from('leads')
    .update(updatePayload)
    .eq('id', leadId)

  if (updateError) return { ok: false, error: updateError.message }

  // Sync to Redis for fast access by n8n/agents
  if (lead.external_session_id) {
    await setRedisHandoff(lead.external_session_id, 'human')
  }

  // Record handoff entry (skip if one already exists for a non-closed lead).
  const { data: existingHandoff } = await supabase()
    .from('lead_handoffs')
    .select('id')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!existingHandoff || lead.current_status === 'encerrado') {
    const context = summaryContext || 'Handoff acionado diretamente.'

    await supabase().from('lead_handoffs').insert({
      lead_id: leadId,
      summary_context: context,
      priority: 'normal',
      requested_by: requestedBy,
      accepted_at: new Date().toISOString(),
      accepted_by: requestedBy,
    })
  }

  // Insert status event for audit trail.
  if (lead.current_status !== nextStatus) {
    await supabase().from('lead_status_events').insert({
      lead_id: leadId,
      source: requestedBy,
      from_status: lead.current_status,
      to_status: nextStatus,
      reason_code: 'handoff_accepted',
      reason_text: summaryContext || 'Handoff ativado.',
      occurred_at: new Date().toISOString(),
    })
  }

  revalidatePath('/')
  revalidatePath(`/leads/${leadId}`)

  return { ok: true, leadId }
}

/**
 * Reverts a lead back to AI attendance.
 * - Sets is_human_handoff = false.
 * - Sets current_status back to 'em_qualificacao'.
 * - Records the revert in lead_status_events.
 */
export async function revertToAiHandoff({
  leadId,
  revertedBy,
}: RevertHandoffOptions): Promise<HandoffResult> {
  const { data: lead, error: fetchError } = await supabase()
    .from('leads')
    .select('id, current_status, is_human_handoff, external_session_id')
    .eq('id', leadId)
    .maybeSingle()

  if (fetchError) return { ok: false, error: fetchError.message }
  if (!lead) return { ok: false, error: `Lead ${leadId} not found.` }

  if (!lead.is_human_handoff) {
    return { ok: true, leadId } // already in AI mode — no-op
  }

  const nextStatus = 'em_qualificacao'

  const { error: updateError } = await supabase()
    .from('leads')
    .update({ is_human_handoff: false, current_status: nextStatus })
    .eq('id', leadId)

  if (updateError) return { ok: false, error: updateError.message }

  // Sync to Redis for fast access by n8n/agents
  if (lead.external_session_id) {
    await setRedisHandoff(lead.external_session_id, 'ai')
  }

  // Mark the latest open handoff as reverted.
  const { data: latestHandoff } = await supabase()
    .from('lead_handoffs')
    .select('id')
    .eq('lead_id', leadId)
    .is('reverted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestHandoff) {
    await supabase()
      .from('lead_handoffs')
      .update({
        reverted_at: new Date().toISOString(),
        reverted_by: revertedBy,
      })
      .eq('id', latestHandoff.id)
  }

  await supabase().from('lead_status_events').insert({
    lead_id: leadId,
    source: revertedBy,
    from_status: lead.current_status,
    to_status: nextStatus,
    reason_code: 'handoff_reverted_to_ai',
    reason_text: 'Atendimento devolvido para a IA.',
    occurred_at: new Date().toISOString(),
  })

  revalidatePath('/')
  revalidatePath(`/leads/${leadId}`)

  return { ok: true, leadId }
}
