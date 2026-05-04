/**
 * POST /api/rrm/parse-h1
 *
 * Recibe el XML del H1 (text/xml o application/xml o JSON con { xml }) y
 * devuelve el JSON estructurado con los campos relevantes para el wizard.
 *
 * NOTA: el XML original NO se almacena (GDPR). Se procesa en memoria y
 * sólo se devuelve el JSON al cliente.
 */

import { NextResponse } from 'next/server'
import { parseH1Xml } from '@/lib/rrmParser'
import { checkRateLimit, generalLimiter, rateLimitHeaders } from '@/lib/rate-limit'
import { safeLogger } from '@/lib/safe-logger'

const MAX_XML_SIZE = 2 * 1024 * 1024 // 2 MB

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

    const contentType = request.headers.get('content-type') || ''
    let xml = ''

    if (contentType.includes('json')) {
      const body = await request.json().catch(() => null)
      xml = body?.xml || ''
    } else {
      xml = await request.text()
    }

    if (!xml || xml.length < 50) {
      return NextResponse.json({ error: 'XML vacío o demasiado corto' }, { status: 400 })
    }
    if (xml.length > MAX_XML_SIZE) {
      return NextResponse.json({ error: 'Archivo demasiado grande (>2MB)' }, { status: 413 })
    }
    if (!xml.trim().startsWith('<')) {
      return NextResponse.json({ error: 'El contenido no parece XML' }, { status: 400 })
    }

    const data = await parseH1Xml(xml)
    return NextResponse.json({ success: true, data })
  } catch (err) {
    safeLogger.error('[parse-h1] error:', err)
    return NextResponse.json(
      { error: 'No se pudo parsear el XML', details: err?.message || String(err) },
      { status: 400 }
    )
  }
}
