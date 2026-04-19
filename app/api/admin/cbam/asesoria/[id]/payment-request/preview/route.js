import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/cbamAdminAuth'
import { getAdvisoryRequestAsAdmin } from '@/lib/cbamAdvisoryAdminService'
import { buildPaymentRequestPayload } from '@/lib/cbamAdvisoryPaymentRequest'

/**
 * POST — Re-renderiza el preview del email sin enviarlo.
 * Se usa en el modal cuando el admin cambia idioma, importe, referencia o
 * datos bancarios y quiere ver el cuerpo actualizado.
 *
 * Body: { language, amount, reference, bank: { iban, bic, holder } }
 */
export async function POST(request, { params }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const body = await request.json()

    const advisory = await getAdvisoryRequestAsAdmin(id)
    if (!advisory) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    const preview = buildPaymentRequestPayload({
      advisory,
      language: body.language,
      amount: body.amount,
      reference: body.reference,
      bank: body.bank,
    })

    return NextResponse.json({ success: true, data: { preview } })
  } catch (error) {
    console.error('Error en payment-request/preview POST:', error)
    return NextResponse.json(
      { error: error.message || 'Error generando preview' },
      { status: 500 }
    )
  }
}
