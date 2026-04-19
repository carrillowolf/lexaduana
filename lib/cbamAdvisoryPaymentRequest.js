/**
 * CBAM Advisory — Solicitud de Pago (pre-factura) bilingüe ES/EN
 *
 * Genera el payload del email profesional que el admin revisa y edita antes
 * de enviar al cliente. NO es una factura legal con número de serie: Carlos
 * aún no está dado de alta como autónomo. El email incluye un aviso claro
 * ("Este documento es una solicitud de pago, no una factura") para cubrir
 * legalmente el flujo hasta el alta autónomo.
 *
 * La arquitectura queda preparada para evolucionar a factura real sin
 * reescribir: cuando llegue ese momento se añadirá `invoice_number` con
 * secuencia anual y una segunda plantilla diferenciada.
 *
 * API pública:
 *   - buildPaymentRequestPayload({ advisory, language, bank, amount, reference })
 *     → { subject, body, html, reference }
 *   - PAYMENT_REQUEST_PRICES: importes por paquete.
 *   - generatePaymentRequestReference(advisory): referencia única para la
 *     transferencia bancaria (estable para un mismo request).
 */

export const PAYMENT_REQUEST_PRICES = {
  basic: 500,
  complete: 2500,
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lexaduana.es'

const I18N = {
  es: {
    subjectTpl: (company, ref) => `Advisory CBAM — ${company} — Ref. ${ref}`,
    greeting: (name) => `Hola ${name},`,
    introReady:
      'Tu informe CBAM está listo. A continuación encontrarás los datos para realizar el pago por transferencia bancaria. Una vez recibida la transferencia, se liberará el informe en tu panel de "Mis solicitudes" y recibirás una copia por email.',
    paymentBlockTitle: 'Datos para la transferencia',
    labelConcept: 'Concepto',
    labelAmount: 'Importe',
    labelIban: 'IBAN',
    labelBic: 'BIC',
    labelHolder: 'Titular',
    labelReference: 'Referencia a incluir',
    referenceHint:
      'Incluye esta referencia en el concepto de la transferencia para que podamos identificar el pago correctamente.',
    legalNotice:
      'Este documento es una solicitud de pago, no una factura. Al recibir la transferencia se emitirá factura oficial.',
    panelCta: 'Ver mis solicitudes',
    closing: 'Cualquier duda, responde a este email y te atendemos sin compromiso.',
    signatureName: 'Carlos Carrillo',
    signatureOrg: 'LexAduana — Suite de comercio exterior',
    ivaSuffix: ' (IVA incluido cuando aplique)',
  },
  en: {
    subjectTpl: (company, ref) => `CBAM Advisory — ${company} — Ref. ${ref}`,
    greeting: (name) => `Hello ${name},`,
    introReady:
      'Your CBAM report is ready. Below are the details to complete payment via bank transfer. Once the transfer is received, the report will be released in your "My requests" panel and a copy will be emailed to you.',
    paymentBlockTitle: 'Bank transfer details',
    labelConcept: 'Concept',
    labelAmount: 'Amount',
    labelIban: 'IBAN',
    labelBic: 'BIC',
    labelHolder: 'Account holder',
    labelReference: 'Reference to include',
    referenceHint:
      'Please include this reference in the transfer description so we can identify the payment.',
    legalNotice:
      'This document is a payment request, not an invoice. A formal invoice will be issued upon receipt of the transfer.',
    panelCta: 'Open my requests',
    closing: 'If you have any questions, just reply to this email.',
    signatureName: 'Carlos Carrillo',
    signatureOrg: 'LexAduana — Foreign trade suite',
    ivaSuffix: ' (VAT included when applicable)',
  },
}

function escapeHtml(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatAmount(amount, language) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return String(amount ?? '')
  const locale = language === 'en' ? 'en-GB' : 'es-ES'
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
  return formatted
}

/**
 * Referencia única estable por request para incluir en la transferencia.
 * Formato: LA-{YY}-{primeros 8 del id}  →  LA-26-A1B2C3D4
 */
export function generatePaymentRequestReference(advisory) {
  if (!advisory?.id) throw new Error('advisory.id requerido para generar referencia')
  const yearShort = String(new Date().getFullYear()).slice(-2)
  const shortId = String(advisory.id).replace(/-/g, '').slice(0, 8).toUpperCase()
  return `LA-${yearShort}-${shortId}`
}

/**
 * Deriva idioma por defecto de una solicitud.
 * Por ahora: si el contact_email es .com → 'en', resto → 'es'.
 * El admin puede sobrescribir en el modal.
 */
export function defaultLanguageForAdvisory(advisory) {
  const email = (advisory?.contactEmail || '').toLowerCase()
  if (email.endsWith('.com') && !email.endsWith('.es.com')) return 'en'
  return 'es'
}

/**
 * Cuerpo del email en texto plano (editable por admin en el modal).
 * Estructura fija que el admin puede ajustar a mano.
 */
function buildBody({ advisory, language, bank, amount, reference }) {
  const t = I18N[language] || I18N.es
  const contactName = advisory.contactName || ''
  const companyName = advisory.companyName || ''
  const concept = `Advisory CBAM — ${companyName} — Ref. ${reference}`
  const amountStr = formatAmount(amount, language) + t.ivaSuffix

  const lines = [
    t.greeting(contactName),
    '',
    t.introReady,
    '',
    `— ${t.paymentBlockTitle} —`,
    `${t.labelConcept}: ${concept}`,
    `${t.labelAmount}: ${amountStr}`,
    `${t.labelIban}: ${bank.iban || '—'}`,
    `${t.labelBic}: ${bank.bic || '—'}`,
    `${t.labelHolder}: ${bank.holder || '—'}`,
    `${t.labelReference}: ${reference}`,
    '',
    t.referenceHint,
    '',
    `⚠ ${t.legalNotice}`,
    '',
    t.closing,
    '',
    `${t.signatureName}`,
    `${t.signatureOrg}`,
    `${APP_URL}`,
  ]
  return lines.join('\n')
}

/**
 * Render HTML minimal a partir del body en texto plano (admin edita texto,
 * nosotros renderizamos con saltos de línea → <br>).
 */
function bodyToHtml(body, title) {
  const safe = escapeHtml(body).replace(/\n/g, '<br>')
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fa;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <tr><td style="background:#0A3D5C;padding:24px 32px;">
          <div style="color:#ffffff;font-size:18px;font-weight:bold;">LexAduana</div>
          <div style="color:#a8c5d6;font-size:12px;margin-top:2px;">Asesoría CBAM</div>
        </td></tr>
        <tr><td style="padding:32px;font-size:14px;line-height:1.6;">
          ${safe}
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;font-size:11px;color:#6b7280;text-align:center;">
          LexAduana · Suite profesional de comercio exterior
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/**
 * Construye el payload completo del email de solicitud de pago.
 *
 * @param {Object}  opts
 * @param {Object}  opts.advisory   Objeto advisory (camelCase) con companyName, contactName, contactEmail, id, advisoryPackage
 * @param {string}  [opts.language] 'es' | 'en' (default: deriva de contactEmail)
 * @param {Object}  [opts.bank]     { iban, bic, holder } — default: vars de entorno
 * @param {number}  [opts.amount]   Importe en EUR — default: precio del paquete
 * @param {string}  [opts.reference] Referencia de transferencia — default: generada
 * @returns {{subject: string, body: string, html: string, reference: string, language: string, amount: number}}
 */
export function buildPaymentRequestPayload({
  advisory,
  language,
  bank,
  amount,
  reference,
} = {}) {
  if (!advisory) throw new Error('advisory requerido')

  const lang = language || defaultLanguageForAdvisory(advisory)
  const t = I18N[lang] || I18N.es

  const ref = reference || generatePaymentRequestReference(advisory)
  const defaultAmount =
    PAYMENT_REQUEST_PRICES[advisory.advisoryPackage] ?? PAYMENT_REQUEST_PRICES.basic
  const amt = amount != null && amount !== '' ? Number(amount) : defaultAmount

  const bankData = {
    iban: bank?.iban ?? process.env.LEXADUANA_BANK_IBAN ?? '',
    bic: bank?.bic ?? process.env.LEXADUANA_BANK_BIC ?? '',
    holder: bank?.holder ?? process.env.LEXADUANA_BANK_HOLDER ?? 'LexAduana',
  }

  const subject = t.subjectTpl(advisory.companyName || '', ref)
  const body = buildBody({
    advisory,
    language: lang,
    bank: bankData,
    amount: amt,
    reference: ref,
  })
  const html = bodyToHtml(body, subject)

  return {
    subject,
    body,
    html,
    reference: ref,
    language: lang,
    amount: amt,
  }
}

/**
 * Re-renderiza el HTML cuando el admin edita el body en el modal.
 * El backend recibe el body plano ya editado y genera el HTML para Resend.
 */
export function renderPaymentRequestHtml({ subject, body }) {
  return bodyToHtml(body, subject)
}
