#!/usr/bin/env node
/**
 * Unit test: verifica la generación del payload del email de solicitud de pago
 * (Día 5 · Pieza 1).
 *
 * Ejecución:  node scripts/testAdvisoryPaymentRequest.js
 */

'use strict'

import {
  buildPaymentRequestPayload,
  generatePaymentRequestReference,
  defaultLanguageForAdvisory,
  renderPaymentRequestHtml,
  PAYMENT_REQUEST_PRICES,
} from '../lib/cbamAdvisoryPaymentRequest.js'

let failed = 0
function assert(cond, label) {
  if (!cond) {
    console.error(`✗ FAIL — ${label}`)
    failed++
  } else {
    console.log(`✓ PASS — ${label}`)
  }
}

const baseAdvisory = {
  id: 'a1b2c3d4-5678-9012-3456-789012345678',
  companyName: 'Aceros Ejemplo SL',
  contactName: 'María García',
  contactEmail: 'maria@acerosejemplo.es',
  advisoryPackage: 'basic',
}

// ── 1. Referencia estable por request ─────────────────────────────────
const ref1 = generatePaymentRequestReference(baseAdvisory)
const ref2 = generatePaymentRequestReference(baseAdvisory)
assert(ref1 === ref2, 'referencia es estable para el mismo request.id')
assert(/^LA-\d{2}-[A-F0-9]{8}$/.test(ref1), `referencia con formato LA-YY-XXXXXXXX (got: ${ref1})`)

// ── 2. Idioma por defecto según email ─────────────────────────────────
assert(defaultLanguageForAdvisory({ contactEmail: 'foo@bar.es' }) === 'es', 'email .es → idioma es')
assert(defaultLanguageForAdvisory({ contactEmail: 'foo@bar.com' }) === 'en', 'email .com → idioma en')
assert(defaultLanguageForAdvisory({ contactEmail: '' }) === 'es', 'sin email → fallback es')

// ── 3. Payload ES con paquete básico y banco desde opts ───────────────
const bank = { iban: 'ES91 2100 0418 4502 0005 1332', bic: 'CAIXESBBXXX', holder: 'Carlos Carrillo del Olmo' }
const payloadEs = buildPaymentRequestPayload({
  advisory: baseAdvisory,
  language: 'es',
  bank,
})
assert(payloadEs.language === 'es', 'ES: language=es')
assert(payloadEs.amount === 500, 'ES: amount default 500 para paquete basic')
assert(payloadEs.subject.startsWith('Advisory CBAM — Aceros Ejemplo SL — Ref. LA-'), 'ES: subject formateado')
assert(payloadEs.body.includes('Hola María García'), 'ES: saludo personalizado')
assert(payloadEs.body.includes('ES91 2100 0418 4502 0005 1332'), 'ES: IBAN visible en body')
assert(payloadEs.body.includes('CAIXESBBXXX'), 'ES: BIC visible')
assert(payloadEs.body.includes('Carlos Carrillo del Olmo'), 'ES: titular visible')
assert(payloadEs.body.includes(payloadEs.reference), 'ES: referencia incluida en body')
assert(payloadEs.body.includes('solicitud de pago, no una factura'), 'ES: aviso legal presente')
assert(payloadEs.html.includes('<!DOCTYPE html>'), 'ES: html completo')
assert(payloadEs.html.includes('LexAduana'), 'ES: html con branding')

// ── 4. Payload EN con paquete complete y override de amount ───────────
const advisoryEn = {
  ...baseAdvisory,
  companyName: 'Sample Steel Ltd',
  contactName: 'John Smith',
  contactEmail: 'john@samplesteel.com',
  advisoryPackage: 'complete',
}
const payloadEn = buildPaymentRequestPayload({
  advisory: advisoryEn,
  language: 'en',
  bank,
  amount: 2800, // admin override
})
assert(payloadEn.language === 'en', 'EN: language=en')
assert(payloadEn.amount === 2800, 'EN: amount respeta override del admin (2800)')
assert(payloadEn.subject.startsWith('CBAM Advisory — Sample Steel Ltd — Ref. LA-'), 'EN: subject en inglés')
assert(payloadEn.body.includes('Hello John Smith'), 'EN: greeting')
assert(payloadEn.body.includes('payment request, not an invoice'), 'EN: aviso legal en inglés')
assert(payloadEn.body.includes('€2,800') || payloadEn.body.includes('€2800'), 'EN: importe con formato en-GB')
assert(payloadEn.body.includes('Bank transfer details'), 'EN: bloque datos bancarios en inglés')

// ── 5. Paquete complete usa precio 2500 por defecto ───────────────────
const payloadCompleteDefault = buildPaymentRequestPayload({
  advisory: advisoryEn,
  language: 'es',
  bank,
})
assert(payloadCompleteDefault.amount === 2500, 'paquete complete: precio default 2500')
assert(PAYMENT_REQUEST_PRICES.basic === 500 && PAYMENT_REQUEST_PRICES.complete === 2500, 'PAYMENT_REQUEST_PRICES constantes')

// ── 6. Re-render de HTML tras edición de admin ────────────────────────
const editedBody = payloadEs.body.replace('Hola María García', 'Hola María (editado por Carlos)')
const rehtml = renderPaymentRequestHtml({ subject: payloadEs.subject, body: editedBody })
assert(rehtml.includes('editado por Carlos'), 'renderPaymentRequestHtml refleja edición del body')
assert(!rehtml.includes('<script'), 'html no contiene etiquetas <script> (escape funciona)')

// ── 7. Escape de HTML en campos del advisory ──────────────────────────
const advisoryDangerous = {
  ...baseAdvisory,
  companyName: 'Acme <script>alert(1)</script>',
  contactName: 'O\'Brien & Co',
}
const payloadEscape = buildPaymentRequestPayload({ advisory: advisoryDangerous, language: 'es', bank })
assert(!payloadEscape.html.includes('<script>alert'), 'HTML escapa <script> del companyName')
assert(payloadEscape.html.includes('&lt;script&gt;') || payloadEscape.html.includes('&amp;lt;'), 'HTML contiene entidades escapadas')

// ── 8. Referencia del reference override se usa tal cual ──────────────
const payloadCustomRef = buildPaymentRequestPayload({
  advisory: baseAdvisory,
  language: 'es',
  bank,
  reference: 'CUSTOM-001',
})
assert(payloadCustomRef.reference === 'CUSTOM-001', 'reference override respetado')
assert(payloadCustomRef.subject.includes('CUSTOM-001'), 'subject usa la referencia custom')

// ── Resumen ──────────────────────────────────────────────────────────
console.log('')
if (failed > 0) {
  console.error(`\n❌ ${failed} test(s) fallaron`)
  process.exit(1)
} else {
  console.log('\n✅ Todos los tests de Solicitud de Pago pasaron')
}
