/**
 * CBAM Advisory Emails - Phase 3 / Fase F
 *
 * Notificaciones transaccionales con Resend para el flujo de asesoría CBAM.
 * Eventos cubiertos:
 *   - intake_complete  → al cliente (recibida) + al admin (nueva)
 *   - report_ready     → no email automático (esperamos a facturar)
 *   - pending_payment  → al cliente (factura emitida)
 *   - delivered        → al cliente con CTA al panel
 *
 * Todas las funciones son no bloqueantes: si Resend falla solo logean error
 * y devuelven { success: false }. NUNCA hacen throw para no bloquear el flujo
 * de negocio (cambio de estado, pago, etc).
 */

import { Resend } from 'resend'

const FROM = 'LexAduana CBAM <cbam@lexaduana.es>'
const REPLY_TO = 'cbam@lexaduana.es'
const ADMIN_NOTIFY = 'ccarrillodelolmo@gmail.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lexaduana.es'

let _client = null
function getResend() {
  if (_client) return _client
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[CBAM Emails] RESEND_API_KEY no configurado — emails deshabilitados')
    return null
  }
  _client = new Resend(key)
  return _client
}

async function safeSend({ to, subject, html, replyTo = REPLY_TO, tag }) {
  const resend = getResend()
  if (!resend) return { success: false, skipped: true }
  try {
    const result = await resend.emails.send({
      from: FROM,
      to,
      reply_to: replyTo,
      subject,
      html,
      tags: tag ? [{ name: 'category', value: tag }] : undefined,
    })
    if (result.error) {
      console.error('[CBAM Emails] Error envío:', result.error)
      return { success: false, error: result.error.message }
    }
    return { success: true, id: result.data?.id }
  } catch (err) {
    console.error('[CBAM Emails] Excepción envío:', err.message)
    return { success: false, error: err.message }
  }
}

// ============================================================
// LAYOUT BASE HTML
// ============================================================

function wrap(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fa;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <tr><td style="background:#0A3D5C;padding:24px 32px;">
          <div style="color:#ffffff;font-size:18px;font-weight:bold;">LexAduana</div>
          <div style="color:#a8c5d6;font-size:12px;margin-top:2px;">Asesoría CBAM</div>
        </td></tr>
        <tr><td style="padding:32px;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;font-size:11px;color:#6b7280;text-align:center;">
          LexAduana · Suite profesional de comercio exterior<br>
          Este es un mensaje automático. Si necesitas ayuda, responde a este email.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
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

function ctaButton(href, label) {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td style="background:#0A3D5C;border-radius:8px;">
    <a href="${href}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">${label}</a>
  </td></tr></table>`
}

// ============================================================
// TEMPLATES
// ============================================================

function tplIntakeComplete(advisory) {
  const body = `
    <h2 style="margin:0 0 16px;color:#0A3D5C;font-size:20px;">Hemos recibido tu solicitud</h2>
    <p>Hola ${escapeHtml(advisory.contactName)},</p>
    <p>Hemos recibido tu solicitud de asesoría CBAM para <strong>${escapeHtml(advisory.companyName)}</strong>. Nuestro equipo la revisará y se pondrá en contacto contigo en las próximas horas hábiles.</p>
    <p style="color:#6b7280;font-size:13px;">Mientras tanto puedes consultar el estado de tu solicitud en tu panel:</p>
    ${ctaButton(`${APP_URL}/cbam/asesoria/mis-solicitudes`, 'Ver mis solicitudes')}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
    <p style="font-size:12px;color:#6b7280;margin:0;">
      <strong>Hello ${escapeHtml(advisory.contactName)},</strong> we have received your CBAM advisory request for <strong>${escapeHtml(advisory.companyName)}</strong>. Our team will review it and contact you shortly.
    </p>
  `
  return { subject: `Solicitud CBAM recibida — ${advisory.companyName}`, html: wrap('Solicitud recibida', body) }
}

function tplAdminNotify(advisory) {
  const body = `
    <h2 style="margin:0 0 16px;color:#0A3D5C;font-size:18px;">Nueva solicitud de asesoría CBAM</h2>
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;font-size:14px;">
      <tr><td style="padding:6px 0;color:#6b7280;width:140px;">Empresa</td><td><strong>${escapeHtml(advisory.companyName)}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">CIF</td><td>${escapeHtml(advisory.companyCif) || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Contacto</td><td>${escapeHtml(advisory.contactName)} · ${escapeHtml(advisory.contactEmail)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Teléfono</td><td>${escapeHtml(advisory.contactPhone) || '—'}</td></tr>
    </table>
    ${ctaButton(`${APP_URL}/admin/cbam/asesoria/${advisory.id}`, 'Abrir en admin')}
  `
  return { subject: `[Admin] Nueva solicitud CBAM — ${advisory.companyName}`, html: wrap('Nueva solicitud', body) }
}

function tplPendingPayment(advisory) {
  const body = `
    <h2 style="margin:0 0 16px;color:#0A3D5C;font-size:20px;">Tu informe CBAM está listo</h2>
    <p>Hola ${escapeHtml(advisory.contactName)},</p>
    <p>Hemos finalizado el análisis de tu solicitud para <strong>${escapeHtml(advisory.companyName)}</strong> y emitido la factura correspondiente${advisory.invoiceRef ? ` (referencia <strong>${escapeHtml(advisory.invoiceRef)}</strong>)` : ''}.</p>
    <p>Una vez confirmemos el pago, recibirás el informe completo en formato PDF en tu panel.</p>
    ${ctaButton(`${APP_URL}/cbam/asesoria/mis-solicitudes`, 'Ver el estado')}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
    <p style="font-size:12px;color:#6b7280;margin:0;">
      <strong>Hello ${escapeHtml(advisory.contactName)},</strong> your CBAM analysis is ready. We have issued the invoice${advisory.invoiceRef ? ` (ref. ${escapeHtml(advisory.invoiceRef)})` : ''}. Once payment is confirmed, the full PDF report will be available in your panel.
    </p>
  `
  return { subject: `Informe CBAM listo — factura emitida — ${advisory.companyName}`, html: wrap('Informe listo', body) }
}

function tplDelivered(advisory, report) {
  const refLine = report?.report_ref ? `<p style="font-size:13px;color:#6b7280;">Referencia: <span style="font-family:monospace;">${escapeHtml(report.report_ref)}</span></p>` : ''
  const body = `
    <h2 style="margin:0 0 16px;color:#0A3D5C;font-size:20px;">✓ Tu informe CBAM ya está disponible</h2>
    <p>Hola ${escapeHtml(advisory.contactName)},</p>
    <p>Pago confirmado. El informe CBAM completo para <strong>${escapeHtml(advisory.companyName)}</strong> ya está disponible para descarga desde tu panel.</p>
    ${refLine}
    ${ctaButton(`${APP_URL}/cbam/asesoria/mis-solicitudes`, 'Descargar informe')}
    <p style="font-size:13px;color:#6b7280;">El informe incluye:</p>
    <ul style="font-size:13px;color:#4b5563;line-height:1.6;">
      <li>Resumen ejecutivo del análisis CBAM</li>
      <li>Detalle de importaciones y emisiones por línea</li>
      <li>Escenario dual: emisiones reales vs valores por defecto</li>
      <li>Estimación de certificados CBAM y coste anual</li>
      <li>Recomendaciones personalizadas</li>
    </ul>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
    <p style="font-size:12px;color:#6b7280;margin:0;">
      <strong>Hello ${escapeHtml(advisory.contactName)},</strong> payment confirmed. Your full CBAM report for <strong>${escapeHtml(advisory.companyName)}</strong> is now available for download in your panel.
    </p>
  `
  return { subject: `Tu informe CBAM está listo para descarga — ${advisory.companyName}`, html: wrap('Informe entregado', body) }
}

// ============================================================
// API PÚBLICA
// ============================================================

export async function sendIntakeReceivedEmail(advisory) {
  if (!advisory?.contactEmail) return { success: false, error: 'sin email' }
  const { subject, html } = tplIntakeComplete(advisory)
  return safeSend({ to: advisory.contactEmail, subject, html, tag: 'intake_complete' })
}

export async function sendAdminNewRequestEmail(advisory) {
  const { subject, html } = tplAdminNotify(advisory)
  return safeSend({ to: ADMIN_NOTIFY, subject, html, tag: 'admin_notify' })
}

export async function sendPendingPaymentEmail(advisory) {
  if (!advisory?.contactEmail) return { success: false, error: 'sin email' }
  const { subject, html } = tplPendingPayment(advisory)
  return safeSend({ to: advisory.contactEmail, subject, html, tag: 'pending_payment' })
}

export async function sendDeliveredEmail(advisory, report = null) {
  if (!advisory?.contactEmail) return { success: false, error: 'sin email' }
  const { subject, html } = tplDelivered(advisory, report)
  return safeSend({ to: advisory.contactEmail, subject, html, tag: 'delivered' })
}
