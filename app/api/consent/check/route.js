import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { VALID_CONSENT_TYPES, POLICY_VERSIONS } from '@/lib/consentPolicy'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  if (!type || !VALID_CONSENT_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid consent type' }, { status: 400 })
  }

  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentVersion = POLICY_VERSIONS[type] || null
  const { data, error } = await supabase
    .from('user_consents')
    .select('id, policy_version, accepted, accepted_at')
    .eq('user_id', user.id)
    .eq('consent_type', type)
    .eq('accepted', true)
    .is('revoked_at', null)
    .order('accepted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[consent/check] DB error:', error.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  // Hay consentimiento activo Y de la versión actual. Si bumpeamos la
  // versión, el último registrado deja de valer y el componente vuelve a
  // pedir aceptación.
  const hasActiveConsent = !!(data && data.policy_version === currentVersion)

  return NextResponse.json({
    hasActiveConsent,
    currentVersion,
    lastAcceptedVersion: data?.policy_version || null,
    lastAcceptedAt: data?.accepted_at || null,
  })
}
