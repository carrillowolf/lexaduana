/**
 * POST /api/rrm/generate-docx
 *
 * Recibe el JSON con todos los datos del wizard, genera el DOCX
 * y lo devuelve como adjunto para descarga directa.
 *
 * Si el usuario está autenticado y `saveDraft === true`, guarda
 * un registro en `rrm_requests` (sin datos bancarios).
 */

import { NextResponse } from 'next/server'
import { generateRrmDocx } from '@/lib/rrmDocxGenerator'
import { checkRateLimit, generalLimiter, rateLimitHeaders } from '@/lib/rate-limit'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    if (generalLimiter) {
      const rateLimit = await checkRateLimit(request, generalLimiter)
      if (!rateLimit.success) {
        return NextResponse.json(
          { error: 'Demasiadas peticiones. Espera un momento.' },
          { status: 429, headers: rateLimitHeaders(rateLimit) }
        )
      }
    }

    const data = await request.json().catch(() => null)
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
    }

    // Validación mínima
    if (!data.requestType || !['REM', 'REP'].includes(data.requestType)) {
      return NextResponse.json({ error: 'requestType debe ser REM o REP' }, { status: 400 })
    }
    if (!data.caseType || !data.legalBasis) {
      return NextResponse.json({ error: 'Faltan caseType o legalBasis' }, { status: 400 })
    }

    // Persistencia opcional (sin datos bancarios)
    if (data.saveDraft) {
      try {
        const supabase = createServerComponentClient({ cookies })
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('rrm_requests').insert({
            user_id: user.id,
            request_type: data.requestType,
            case_type: data.caseType,
            legal_basis: data.legalBasis,
            mrn: data.mrn || null,
            customs_office: data.customsOffice || null,
            importer_eori: data.importer?.eori || null,
            importer_name: data.importer?.name || null,
            representative_eori: data.representative?.eori || null,
            representative_name: data.representative?.name || null,
            customs_value: data.customsValue ?? null,
            commodity_code: data.commodityCode || null,
            goods_description: data.goodsDescription || null,
            country_of_origin: data.countryOfOrigin || null,
            preference_declared: data.preferenceDeclared || null,
            corrected_data: data.corrected || {},
            duties_declared: data.dutiesDeclared || {},
            duties_corrected: data.dutiesCorrected || {},
            amount_to_recover: data.amountToRecover ?? null,
            motivos_text: data.motivosText || null,
            status: 'generated',
            generated_at: new Date().toISOString(),
          })
        }
      } catch (persistErr) {
        // No bloqueamos la generación si falla el guardado
        console.error('[generate-docx] persist error:', persistErr)
      }
    }

    const buffer = await generateRrmDocx(data)
    const filename = `solicitud-rrm-${(data.mrn || 'sin-mrn').replace(/[^a-zA-Z0-9]/g, '')}.docx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[generate-docx] error:', err)
    return NextResponse.json(
      { error: 'No se pudo generar el documento', details: err?.message || String(err) },
      { status: 500 }
    )
  }
}
