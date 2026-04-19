/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require('@playwright/test')
const { provisionUser, cleanupUser } = require('./helpers/auth')
const { adminClient, anonClient, SUPABASE_URL, ANON_KEY } = require('./helpers/supabase')

test.describe('Security — cbam_monitoring_subscriptions.status is locked for authenticated users', () => {
  let user, subscriptionId

  test.beforeAll(async () => {
    user = await provisionUser({ prefix: 'e2e-rls' })
    const admin = adminClient()
    const { data, error } = await admin
      .from('cbam_monitoring_subscriptions')
      .insert({
        user_id: user.id,
        status: 'submitted',
        company_name: 'E2E RLS Co',
        contact_name: 'RLS Tester',
        contact_email: user.email,
        dua_authorization_accepted_at: new Date().toISOString(),
        dua_authorization_text_version: 'v1-2026-04',
      })
      .select('id')
      .single()
    if (error) throw new Error(`Seed subscription failed: ${error.message}`)
    subscriptionId = data.id
  })

  test.afterAll(async () => {
    const admin = adminClient()
    if (subscriptionId) {
      try {
        await admin.from('cbam_monitoring_subscriptions').delete().eq('id', subscriptionId)
      } catch (_) {
        /* ignore cleanup errors */
      }
    }
    if (user?.id) await cleanupUser(user.id)
  })

  test('authenticated user cannot PATCH status via REST — column-level UPDATE revoked', async () => {
    const client = anonClient()
    const { data: session, error: signInErr } = await client.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    })
    if (signInErr) throw signInErr
    expect(session?.session?.access_token).toBeTruthy()

    // Intenta PATCH directo al campo status.
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cbam_monitoring_subscriptions?id=eq.${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${session.session.access_token}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ status: 'active' }),
    })

    // Aceptamos cualquier código de error 4xx — la verificación fuerte es por estado actual.
    const admin = adminClient()
    const { data } = await admin
      .from('cbam_monitoring_subscriptions')
      .select('status')
      .eq('id', subscriptionId)
      .single()

    expect(data?.status).toBe('submitted')
    // Defensa adicional: si por algún motivo la API respondió 200, el trigger/privilege debe haber impedido el cambio.
    if (res.ok) {
      console.warn('⚠ PATCH status devolvió 200 pero la columna permanece sin cambios — lock funciona.')
    } else {
      expect([400, 401, 403, 404, 500]).toContain(res.status)
    }
  })

  test('authenticated user can still update client-safe fields (client_notes)', async () => {
    const client = anonClient()
    const { data: session } = await client.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cbam_monitoring_subscriptions?id=eq.${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${session.session.access_token}`,
      },
      body: JSON.stringify({ client_notes: 'Updated from RLS test' }),
    })
    expect(res.ok).toBeTruthy()

    const admin = adminClient()
    const { data } = await admin
      .from('cbam_monitoring_subscriptions')
      .select('client_notes')
      .eq('id', subscriptionId)
      .single()
    expect(data?.client_notes).toBe('Updated from RLS test')
  })
})
