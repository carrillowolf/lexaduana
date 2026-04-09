/**
 * API: Clasificación en lote de líneas de una factura
 * Ruta: POST /api/extract-invoice/classify
 *
 * Recibe un array de líneas de producto y, para cada una, llama
 * internamente al clasificador IA existente (/api/classify-product).
 *
 * NO duplica lógica: reutiliza /api/classify-product vía fetch interno.
 * Procesamiento concurrente limitado a 3 a la vez para no saturar.
 *
 * Cada línea individual consume 1 unidad del límite diario del clasificador.
 * El usuario debe ser consciente de que clasificar 5 líneas = 5 clasificaciones.
 */

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies, headers as nextHeaders } from 'next/headers'

import { SECURE_RESPONSE_HEADERS, isSameOrigin } from '@/lib/fileSecurity'

const MAX_CONCURRENT = 3
const MAX_LINES_PER_REQUEST = 30

function errorResponse(error, status) {
  return NextResponse.json(
    { success: false, error },
    { status, headers: SECURE_RESPONSE_HEADERS }
  )
}

/**
 * Pool de promesas con concurrencia limitada.
 */
async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length)
  let cursor = 0

  async function next() {
    while (cursor < items.length) {
      const idx = cursor++
      try {
        results[idx] = await worker(items[idx], idx)
      } catch (err) {
        results[idx] = { error: err?.message || 'unknown' }
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, next)
  await Promise.all(workers)
  return results
}

export async function POST(request) {
  try {
    if (!isSameOrigin(request)) {
      return errorResponse('Origen no autorizado.', 403)
    }

    // Auth
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Debes iniciar sesión.', 401)
    }

    // Body
    let body
    try {
      body = await request.json()
    } catch {
      return errorResponse('JSON inválido.', 400)
    }

    const lines = Array.isArray(body?.lines) ? body.lines : null
    if (!lines || lines.length === 0) {
      return errorResponse('Faltan las líneas a clasificar.', 400)
    }
    if (lines.length > MAX_LINES_PER_REQUEST) {
      return errorResponse(
        `Demasiadas líneas en una sola petición (máximo ${MAX_LINES_PER_REQUEST}).`,
        400
      )
    }

    // Reenviar cookie + origin para que el endpoint hijo autentique al mismo usuario
    const incomingHeaders = await nextHeaders()
    const cookieHeader = incomingHeaders.get('cookie') || ''
    const origin = incomingHeaders.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''
    const protocol = incomingHeaders.get('x-forwarded-proto') || 'https'
    const host = incomingHeaders.get('host')
    const baseUrl = origin || `${protocol}://${host}`

    // Worker: clasificar una línea
    const classifyOne = async (line) => {
      const description = (line.description_es || line.description || '').trim()
      if (description.length < 10) {
        return {
          line_number: line.line_number,
          error: 'Descripción demasiado corta para clasificar.',
        }
      }

      try {
        const res = await fetch(`${baseUrl}/api/classify-product`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: cookieHeader,
            origin,
          },
          body: JSON.stringify({
            description,
            countryCode: line.country || null,
            cifValue: typeof line.total_price === 'number' ? line.total_price : null,
          }),
        })

        const data = await res.json()
        if (!res.ok || !data.success) {
          return {
            line_number: line.line_number,
            error: data.error || 'Error al clasificar.',
          }
        }

        const c = data.classification || {}
        return {
          line_number: line.line_number,
          suggested_code: c.primaryCode,
          confidence: c.confidence,
          reasoning: c.reasoning,
          alternatives: c.alternativeCodes || [],
          duty_rate: c.primaryCodeDutyRate,
          warnings: c.warnings || [],
        }
      } catch (err) {
        return {
          line_number: line.line_number,
          error: 'Fallo de red al clasificar.',
        }
      }
    }

    const classifications = await runWithConcurrency(lines, MAX_CONCURRENT, classifyOne)

    return NextResponse.json(
      { success: true, classifications },
      { headers: SECURE_RESPONSE_HEADERS }
    )
  } catch (error) {
    console.error('[extract-invoice/classify] Unhandled:', error?.message)
    return errorResponse('Error inesperado.', 500)
  }
}

export const runtime = 'nodejs'
export const maxDuration = 120
