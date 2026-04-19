import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireAdmin } from '@/lib/cbamAdminAuth'
import {
  getAdvisoryRequestAsAdmin,
  updateAdvisoryRequestAsAdmin,
} from '@/lib/cbamAdvisoryAdminService'
import {
  buildPaymentRequestPayload,
  renderPaymentRequestHtml,
  defaultLanguageForAdvisory,
  generatePaymentRequestReference,
} from '@/lib/cbamAdvisoryPaymentRequest'

const FROM = 'LexAduana CBAM <cbam@lexaduana.es>'
const REPLY_TO = 'cbam@lexaduana.es'

/**
 * GET  — Devuelve el preview pre-llenado (no manda nada).
 *        Util para abrir el modal con el cuerpo por defecto.
 * POST — Envía la solicitud de pago. Body: { language, subject, body, amount,
 *        reference, bank: { iban, bic, holder } }. Transiciona el estado a
 *        pending_payment y persiste los metadatos.
 */

export async function GET(request, { params }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const advisory = await getAdvisoryRequestAsAdmin(id)
    if (!advisory) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    const preview = buildPaymentRequestPayload({ advisory })

    return NextResponse.json({
      success: true,
      data: {
        preview,
        defaults: {
          language: defaultLanguageForAdvisory(advisory),
          reference: generatePaymentRequestReference(advisory),
          bank: {
            iban: process.env.LEXADUANA_BANK_IBAN || '',
            bic: process.env.LEXADUANA_BANK_BIC || '',
            holder: process.env.LEXADUANA_BANK_HOLDER || '',
          },
          bankMissing:
            !process.env.LEXADUANA_BANK_IBAN ||
            !process.env.LEXADUANA_BANK_BIC ||
            !process.env.LEXADUANA_BANK_HOLDER,
          advisoryPackage: advisory.advisoryPackage,
        },
        advisory: {
          id: advisory.id,
          status: advisory.status,
          contactEmail: advisory.contactEmail,
          contactName: advisory.contactName,
          companyName: advisory.companyName,
          paymentRequestSentAt: advisory.paymentRequestSentAt || null,
        },
      },
    })
  } catch (error) {
    console.error('Error en payment-request GET:', error)
    return NextResponse.json({ error: error.message || 'Error al cargar preview' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const body = await request.json()

    const language = body.language === 'en' ? 'en' : 'es'
    const subject = (body.subject || '').trim()
    const emailBody = (body.body || '').trim()
    const amount = Number(body.amount)
    const reference = (body.reference || '').trim()

    if (!subject) {
      return NextResponse.json({ error: 'Asunto requerido' }, { status: 400 })
    }
    if (!emailBody) {
      return NextResponse.json({ error: 'Cuerpo del email requerido' }, { status: 400 })
    }
    if (!reference) {
      return NextResponse.json({ error: 'Referencia de transferencia requerida' }, { status: 400 })
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Importe inválido' }, { status: 400 })
    }

    const advisory = await getAdvisoryRequestAsAdmin(id)
    if (!advisory) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }
    if (!advisory.contactEmail) {
      return NextResponse.json(
        { error: 'La solicitud no tiene email de contacto' },
        { status: 400 }
      )
    }

    // Render HTML a partir del body editado por el admin
    const html = renderPaymentRequestHtml({ subject, body: emailBody })

    // Envío via Resend (sin throw: si falla reportamos el error pero no
    // persistimos el cambio de estado)
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY no configurado' },
        { status: 500 }
      )
    }

    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from: FROM,
      to: advisory.contactEmail,
      reply_to: REPLY_TO,
      subject,
      html,
      tags: [{ name: 'category', value: 'payment_request' }],
    })
    if (result.error) {
      console.error('[Payment Request] Resend error:', result.error)
      return NextResponse.json(
        { error: result.error.message || 'Error al enviar el email' },
        { status: 502 }
      )
    }

    // Persistir metadatos + transición de estado
    const patch = {
      paymentRequestSentAt: new Date().toISOString(),
      paymentRequestLanguage: language,
      paymentRequestAmount: amount,
      paymentRequestReference: reference,
    }
    // Solo transicionamos si estamos en report_ready (no pisamos estados posteriores)
    if (advisory.status === 'report_ready') {
      patch.status = 'pending_payment'
    }

    const updated = await updateAdvisoryRequestAsAdmin(id, patch)

    return NextResponse.json({
      success: true,
      data: {
        advisory: updated,
        emailId: result.data?.id || null,
      },
    })
  } catch (error) {
    console.error('Error en payment-request POST:', error)
    return NextResponse.json(
      { error: error.message || 'Error al enviar solicitud de pago' },
      { status: 500 }
    )
  }
}
