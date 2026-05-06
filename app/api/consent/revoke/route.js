import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { VALID_CONSENT_TYPES } from '@/lib/consentPolicy'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { consentType } = body

  if (!consentType || !VALID_CONSENT_TYPES.includes(consentType)) {
    return NextResponse.json({ error: 'Invalid consent type' }, { status: 400 })
  }

  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Marcar TODOS los activos de este tipo como revocados (por unique_active_consent
  // debería ser solo 1, pero usamos UPDATE por seguridad).
  const { error: updateError } = await supabase
    .from('user_consents')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('consent_type', consentType)
    .is('revoked_at', null)

  if (updateError) {
    console.error('[consent/revoke] Update error:', updateError.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
