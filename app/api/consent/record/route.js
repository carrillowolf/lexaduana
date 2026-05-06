import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { VALID_CONSENT_TYPES, POLICY_VERSIONS } from '@/lib/consentPolicy'
import { extractClientIp, anonymizeIp } from '@/lib/ipUtils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { consentType, policyVersion, accepted } = body

  if (!consentType || !VALID_CONSENT_TYPES.includes(consentType)) {
    return NextResponse.json({ error: 'Invalid consent type' }, { status: 400 })
  }
  if (typeof accepted !== 'boolean') {
    return NextResponse.json({ error: 'accepted must be boolean' }, { status: 400 })
  }
  // Server-side enforcement: la versión la fija el server, no el cliente.
  const expectedVersion = POLICY_VERSIONS[consentType]
  if (!expectedVersion) {
    return NextResponse.json({ error: 'Consent type has no policy version' }, { status: 400 })
  }
  if (policyVersion !== expectedVersion) {
    return NextResponse.json({
      error: 'Policy version mismatch',
      expected: expectedVersion,
      received: policyVersion,
    }, { status: 409 })
  }

  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawIp = extractClientIp(request)
  const ipAnonymized = anonymizeIp(rawIp)
  const userAgent = request.headers.get('user-agent') || null

  // Idempotencia: si ya hay consentimiento activo de esta versión, OK sin
  // duplicar (la constraint unique_active_consent lo impediría igualmente,
  // pero así evitamos que aflore como 409 desde Postgres).
  const { data: existing } = await supabase
    .from('user_consents')
    .select('id')
    .eq('user_id', user.id)
    .eq('consent_type', consentType)
    .eq('policy_version', expectedVersion)
    .is('revoked_at', null)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true, alreadyRegistered: true })
  }

  const { error: insertError } = await supabase
    .from('user_consents')
    .insert({
      user_id: user.id,
      consent_type: consentType,
      policy_version: expectedVersion,
      accepted,
      ip_address: ipAnonymized,
      user_agent: userAgent,
    })

  if (insertError) {
    console.error('[consent/record] Insert error:', insertError.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
