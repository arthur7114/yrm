import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { activateHumanHandoff } from '@/lib/lead-handoff'

function unauthorized(message: string) {
  return NextResponse.json({ error: message }, { status: 401 })
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

function notFound(message: string) {
  return NextResponse.json({ error: message }, { status: 404 })
}

function internalServerError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 })
}

/**
 * POST /api/integrations/n8n/handoff
 *
 * Called by the AI agent to transfer a lead to human attendance.
 * Requires the same Bearer token used by /lead-events.
 *
 * Body:
 * {
 *   "external_session_id": "abc123",          // required
 *   "summary_context": "Lead pediu humano"    // optional
 * }
 *
 * Response 200:
 * { "ok": true, "leadId": 42, "handoffActivated": true }
 */
export async function POST(request: NextRequest) {
  const expectedToken = process.env.N8N_INTEGRATION_BEARER_TOKEN

  if (!expectedToken) {
    return internalServerError('N8N_INTEGRATION_BEARER_TOKEN is not configured.')
  }

  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return unauthorized('Missing or invalid Authorization header.')
  }

  const providedToken = authHeader.slice('Bearer '.length).trim()

  if (!providedToken || providedToken !== expectedToken) {
    return unauthorized('Invalid integration token.')
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return badRequest('Request body must be valid JSON.')
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return badRequest('Request body must be a JSON object.')
  }

  const { external_session_id, summary_context } = body as Record<string, unknown>

  if (typeof external_session_id !== 'string' || !external_session_id.trim()) {
    return badRequest('external_session_id is required and must be a non-empty string.')
  }

  const ownerUserId = process.env.N8N_LEAD_OWNER_USER_ID

  if (!ownerUserId) {
    return internalServerError('N8N_LEAD_OWNER_USER_ID is not configured.')
  }

  // Resolve the lead from external_session_id.
  const { data: lead, error: lookupError } = await getSupabaseAdmin()
    .from('leads')
    .select('id, is_human_handoff')
    .eq('user_id', ownerUserId)
    .eq('external_session_id', external_session_id.trim())
    .maybeSingle()

  if (lookupError) {
    return internalServerError(lookupError.message)
  }

  if (!lead) {
    return notFound(`No lead found for external_session_id "${external_session_id}".`)
  }

  if (lead.is_human_handoff) {
    // Already in human mode — ensure Redis is still in sync (idempotent success).
    const { setRedisHandoff } = await import('@/lib/redis')
    await setRedisHandoff(external_session_id.trim(), 'human')
    return NextResponse.json({ ok: true, leadId: lead.id, handoffActivated: false })
  }

  const context = typeof summary_context === 'string' ? summary_context.trim() || null : null

  try {
    const result = await activateHumanHandoff({
      leadId: lead.id,
      requestedBy: 'agent',
      summaryContext: context,
    })

    if (!result.ok) {
      return internalServerError(result.error)
    }

    return NextResponse.json({ ok: true, leadId: lead.id, handoffActivated: true })
  } catch (error) {
    console.error('Handoff error:', error)
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    return internalServerError(message || 'Unexpected error')
  }
}
