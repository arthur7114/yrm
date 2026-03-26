import { NextRequest, NextResponse } from 'next/server'

import { badRequest, processLeadEvent, validateLeadEventPayload } from '@/lib/lead-events'

export async function POST(request: NextRequest) {
  // Temporary bypass: this endpoint is public while the n8n integration is being stabilized.

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return badRequest('Request body must be valid JSON.')
  }

  const validation = validateLeadEventPayload(body)

  if (validation.error) {
    return badRequest(validation.error)
  }

  if (!validation.data) {
    return badRequest('Payload validation failed.')
  }

  try {
    const result = await processLeadEvent(validation.data)

    return NextResponse.json({
      ok: true,
      ...result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    )
  }
}
