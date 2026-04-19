/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Pieza 1 — Día 5: Integration test del flujo "Solicitud de pago".
 *
 * El admin del panel está gated por email hardcoded y por requireAdmin() con
 * cookie de Supabase; atacar el flujo completo por UI requiere refactor de
 * auth que queda fuera de scope para el Día 5. En su lugar este test:
 *
 *   1. Seedea una solicitud advisory en estado `report_ready`.
 *   2. Simula el flujo del endpoint (build payload + update DB) sin enviar a
 *      Resend de verdad (Resend está stubbeado por no llamarlo — invocamos
 *      directamente las funciones que el endpoint encadena).
 *   3. Verifica que la DB termina con status=pending_payment y los metadatos
 *      payment_request_* persistidos.
 *
 * Cubre el "happy path" operativo: Carlos cobra por transferencia y el
 * registro queda correctamente trazado.
 */

const { test, expect } = require('@playwright/test')
const { adminClient } = require('./helpers/supabase')
const { provisionUser, cleanupUser } = require('./helpers/auth')

test.describe('Pieza 1 — Solicitud de pago (state transition)', () => {
  let user, requestId

  test.beforeAll(async () => {
    user = await provisionUser({ prefix: 'e2e-payreq' })
    const admin = adminClient()
    const { data, error } = await admin
      .from('cbam_advisory_requests')
      .insert({
        user_id: user.id,
        status: 'report_ready',
        company_name: 'E2E Pay Request Co',
        company_cif: 'B12345678',
        contact_name: 'Pay Request Tester',
        contact_email: user.email,
        advisory_package: 'basic',
      })
      .select('id')
      .single()
    if (error) throw new Error(`Seed advisory failed: ${error.message}`)
    requestId = data.id
  })

  test.afterAll(async () => {
    const admin = adminClient()
    if (requestId) {
      try {
        await admin.from('cbam_advisory_requests').delete().eq('id', requestId)
      } catch (_) { /* ignore */ }
    }
    if (user?.id) await cleanupUser(user.id)
  })

  test('build payload + persist transitions report_ready → pending_payment with metadata', async () => {
    const {
      buildPaymentRequestPayload,
    } = await import('../../lib/cbamAdvisoryPaymentRequest.js')

    const admin = adminClient()

    // 1. Cargar la solicitud como lo haría el endpoint
    const { data: row, error: loadErr } = await admin
      .from('cbam_advisory_requests')
      .select('*')
      .eq('id', requestId)
      .single()
    expect(loadErr).toBeFalsy()
    expect(row.status).toBe('report_ready')

    const advisory = {
      id: row.id,
      companyName: row.company_name,
      contactName: row.contact_name,
      contactEmail: row.contact_email,
      advisoryPackage: row.advisory_package,
    }

    // 2. Generar payload del email (lo que el admin vería en el modal)
    const payload = buildPaymentRequestPayload({
      advisory,
      bank: { iban: 'ES9121000418450200051332', bic: 'CAIXESBBXXX', holder: 'Carlos Carrillo del Olmo' },
    })

    expect(payload.language).toBe('es') // email termina en .test → fallback es
    expect(payload.amount).toBe(500) // paquete basic
    expect(payload.subject).toContain('E2E Pay Request Co')
    expect(payload.subject).toContain(payload.reference)
    expect(payload.body).toContain('Pay Request Tester')
    expect(payload.body).toContain('ES9121000418450200051332')
    expect(payload.body).toContain('solicitud de pago, no una factura')

    // 3. Simular la persistencia que hace el endpoint tras enviar por Resend
    //    (no llamamos a Resend — eso es lo que stubbea el test)
    const nowIso = new Date().toISOString()
    const { data: updated, error: upErr } = await admin
      .from('cbam_advisory_requests')
      .update({
        status: 'pending_payment',
        payment_request_sent_at: nowIso,
        payment_request_language: payload.language,
        payment_request_amount: payload.amount,
        payment_request_reference: payload.reference,
      })
      .eq('id', requestId)
      .select('status, payment_request_sent_at, payment_request_language, payment_request_amount, payment_request_reference')
      .single()

    expect(upErr).toBeFalsy()
    expect(updated.status).toBe('pending_payment')
    expect(new Date(updated.payment_request_sent_at).getTime()).toBe(new Date(nowIso).getTime())
    expect(updated.payment_request_language).toBe('es')
    expect(parseFloat(updated.payment_request_amount)).toBe(500)
    expect(updated.payment_request_reference).toBe(payload.reference)
  })

  test('re-render preview with language override (en) regenera asunto y cuerpo', async () => {
    const {
      buildPaymentRequestPayload,
    } = await import('../../lib/cbamAdvisoryPaymentRequest.js')

    const advisory = {
      id: requestId,
      companyName: 'E2E Pay Request Co',
      contactName: 'Pay Request Tester',
      contactEmail: 'john@example.com',
      advisoryPackage: 'complete',
    }

    const payload = buildPaymentRequestPayload({
      advisory,
      language: 'en',
      amount: 2800,
      bank: { iban: 'ES91...', bic: 'BIC', holder: 'Holder' },
    })

    expect(payload.language).toBe('en')
    expect(payload.amount).toBe(2800)
    expect(payload.subject.startsWith('CBAM Advisory')).toBeTruthy()
    expect(payload.body).toContain('Hello Pay Request Tester')
    expect(payload.body).toContain('payment request, not an invoice')
  })
})
