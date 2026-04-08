import { NextRequest, NextResponse } from 'next/server'

import { badRequest, processLeadEvent, validateLeadEventPayload } from '@/lib/lead-events'

function unauthorized(message: string) {
  return NextResponse.json(
    {
      error: message,
    },
    { status: 401 }
  )
}

function internalServerError(message: string) {
  return NextResponse.json(
    {
      error: message,
    },
    { status: 500 }
  )
}

export async function POST(request: NextRequest) {
  const expectedToken = process.env.N8N_INTEGRATION_BEARER_TOKEN

  if (!expectedToken) {
    return internalServerError('N8N_INTEGRATION_BEARER_TOKEN is not configured.')
  }

  const authorizationHeader = request.headers.get('authorization')

  if (!authorizationHeader?.startsWith('Bearer ')) {
    return unauthorized('Missing or invalid Authorization header.')
  }

  const providedToken = authorizationHeader.slice('Bearer '.length).trim()

  if (!providedToken || providedToken !== expectedToken) {
    return unauthorized('Invalid integration token.')
  }

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

    return internalServerError(message)
  }
}
