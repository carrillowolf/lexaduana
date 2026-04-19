/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Pieza 2 — Día 5: Integration test del checklist pre-entrega.
 *
 * Por la misma razón que en Pieza 1 (admin gating por email hardcoded +
 * cookie de Supabase), se testea la lógica de toggle manual y el cómputo
 * auto/manual vía las funciones del lib + persistencia directa en DB.
 *
 * Cubre:
 *   1. Advisory: toggle manual persiste en JSONB y el cómputo lo refleja.
 *   2. Monitoring: toggle manual + pasos auto derivados del status.
 *   3. Rechazo: intentar togglear un paso automático lanza error (lib nivel).
 */

const { test, expect } = require('@playwright/test')
const { adminClient } = require('./helpers/supabase')
const { provisionUser, cleanupUser } = require('./helpers/auth')

test.describe('Pieza 2 — Admin checklist stepper (integration)', () => {
  let user, requestId, subscriptionId

  test.beforeAll(async () => {
    user = await provisionUser({ prefix: 'e2e-checklist' })
    const admin = adminClient()

    const req = await admin
      .from('cbam_advisory_requests')
      .insert({
        user_id: user.id,
        status: 'report_ready',
        company_name: 'E2E Checklist Co',
        contact_name: 'Checklist Tester',
        contact_email: user.email,
        advisory_package: 'basic',
      })
      .select('id')
      .single()
    if (req.error) throw new Error(`Seed advisory: ${req.error.message}`)
    requestId = req.data.id

    const sub = await admin
      .from('cbam_monitoring_subscriptions')
      .insert({
        user_id: user.id,
        status: 'submitted',
        company_name: 'E2E Checklist Mon Co',
        contact_name: 'Checklist Monitor',
        contact_email: user.email,
        dua_authorization_accepted_at: new Date().toISOString(),
        dua_authorization_text_version: 'v1-2026-04',
      })
      .select('id')
      .single()
    if (sub.error) throw new Error(`Seed subscription: ${sub.error.message}`)
    subscriptionId = sub.data.id
  })

  test.afterAll(async () => {
    const admin = adminClient()
    if (requestId) {
      try { await admin.from('cbam_advisory_requests').delete().eq('id', requestId) } catch (_) {}
    }
    if (subscriptionId) {
      try { await admin.from('cbam_monitoring_subscriptions').delete().eq('id', subscriptionId) } catch (_) {}
    }
    if (user?.id) await cleanupUser(user.id)
  })

  test('Advisory: toggle manual persiste + cómputo refleja auto+manual', async () => {
    const { applyManualStepToggle, computeChecklistState } = await import('../../lib/cbamChecklist.js')
    const admin = adminClient()

    // Estado inicial: report_ready → solo calculo_ejecutado auto marcado
    const initial = computeChecklistState('advisory', { status: 'report_ready', checklist: {} })
    expect(initial.find(s => s.key === 'calculo_ejecutado').completed).toBe(true)
    expect(initial.find(s => s.key === 'datos_revisados').completed).toBe(false)

    // Aplicar toggle manual y persistir
    const nextChecklist = applyManualStepToggle({
      kind: 'advisory',
      currentChecklist: {},
      stepKey: 'datos_revisados',
      completed: true,
      byEmail: 'carlos@lexaduana.es',
    })
    await admin.from('cbam_advisory_requests').update({ admin_checklist: nextChecklist }).eq('id', requestId)

    // Releer y comprobar persistencia
    const { data: row } = await admin
      .from('cbam_advisory_requests')
      .select('admin_checklist, status')
      .eq('id', requestId)
      .single()
    expect(row.admin_checklist.datos_revisados.completed).toBe(true)
    expect(row.admin_checklist.datos_revisados.by).toBe('carlos@lexaduana.es')

    // Cómputo final
    const final = computeChecklistState('advisory', { status: row.status, checklist: row.admin_checklist })
    expect(final.find(s => s.key === 'datos_revisados').completed).toBe(true)
    expect(final.find(s => s.key === 'datos_revisados').at).toBeTruthy()
    // Cálculo sigue auto-marcado
    expect(final.find(s => s.key === 'calculo_ejecutado').completed).toBe(true)
    // Pasos posteriores aún sin marcar
    expect(final.find(s => s.key === 'pago_confirmado').completed).toBe(false)
  })

  test('Advisory: transición report_ready → delivered marca todos los pasos automáticos', async () => {
    const { computeChecklistState } = await import('../../lib/cbamChecklist.js')
    const admin = adminClient()

    // Mover el status a delivered
    await admin
      .from('cbam_advisory_requests')
      .update({ status: 'delivered' })
      .eq('id', requestId)

    const { data: row } = await admin
      .from('cbam_advisory_requests')
      .select('admin_checklist, status')
      .eq('id', requestId)
      .single()

    const steps = computeChecklistState('advisory', { status: row.status, checklist: row.admin_checklist })
    const autoSteps = steps.filter(s => s.kind === 'auto')
    for (const step of autoSteps) {
      expect(step.completed).toBe(true)
    }
  })

  test('Monitoring: status=active marca suscripcion_activada auto', async () => {
    const { computeChecklistState } = await import('../../lib/cbamChecklist.js')
    const admin = adminClient()

    await admin
      .from('cbam_monitoring_subscriptions')
      .update({ status: 'active' })
      .eq('id', subscriptionId)

    const { data: row } = await admin
      .from('cbam_monitoring_subscriptions')
      .select('admin_checklist, status')
      .eq('id', subscriptionId)
      .single()

    const steps = computeChecklistState('monitoring', { status: row.status, checklist: row.admin_checklist })
    expect(steps.find(s => s.key === 'suscripcion_activada').completed).toBe(true)
    // Pasos manuales siguen pendientes
    expect(steps.find(s => s.key === 'empresa_revisada').completed).toBe(false)
  })

  test('lib rechaza toggle de paso automático', async () => {
    const { applyManualStepToggle } = await import('../../lib/cbamChecklist.js')
    expect(() => applyManualStepToggle({
      kind: 'advisory',
      currentChecklist: {},
      stepKey: 'calculo_ejecutado',
      completed: true,
    })).toThrow()
  })
})
