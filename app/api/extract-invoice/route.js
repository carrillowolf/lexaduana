/**
 * API: Extracción de datos desde factura comercial (OCR + IA)
 * Ruta: POST /api/extract-invoice
 *
 * SEGURIDAD:
 *  - Solo usuarios autenticados (Supabase Auth + cookie)
 *  - Doble rate limit: 5/h por IP + 2/día por usuario
 *  - Validación de MIME real por magic bytes (no solo Content-Type)
 *  - Límite 10 MB y máximo de páginas para PDF
 *  - Origin/Referer check (anti-CSRF)
 *  - Headers no-store, no-sniff
 *  - El archivo NUNCA se persiste (memoria → Claude API → descarte)
 *  - Logs sin contenido del archivo
 */

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

import {
  checkRateLimit,
  invoiceOCRLimiter,
  checkDailyInvoiceOCRLimit,
  rateLimitHeaders,
} from '@/lib/rate-limit'
import {
  validateUploadedInvoice,
  SECURE_RESPONSE_HEADERS,
  isSameOrigin,
  MAX_FILE_SIZE_BYTES,
} from '@/lib/fileSecurity'
import {
  validateExtractedInvoice,
  summarizeValidation,
} from '@/lib/invoiceValidator'
import { isAdminEmail } from '@/lib/cbamAdminAuth'
import { safeLogger } from '@/lib/safe-logger'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Modelo coherente con /api/classify-product (Sonnet 4.5)
const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929'

// Free tier por defecto. Cuando haya tiers se leerá de profiles.subscription_tier
const DEFAULT_DAILY_LIMIT = 2

const INVOICE_EXTRACTION_PROMPT = `Eres un experto en comercio internacional y aduanas. Analiza esta factura comercial (commercial invoice) y extrae los datos en formato JSON estructurado.

EXTRAE LOS SIGUIENTES CAMPOS:

1. DATOS GENERALES DE LA FACTURA:
- supplier_name: Nombre del proveedor/vendedor
- supplier_country: País del proveedor (código ISO 2 letras, ej: CN, US, TR)
- supplier_address: Dirección completa del proveedor
- invoice_number: Número de factura
- invoice_date: Fecha de factura (formato YYYY-MM-DD)
- currency: Divisa (código ISO 3 letras, ej: USD, EUR, GBP, CNY)
- incoterm: Incoterm (FOB, CIF, EXW, etc.) — puede estar junto al precio
- payment_terms: Condiciones de pago si aparecen
- total_amount: Importe total de la factura (number)

2. DATOS DEL COMPRADOR:
- buyer_name: Nombre del comprador/importador
- buyer_country: País del comprador (código ISO 2 letras)

3. LÍNEAS DE PRODUCTO (array). Para cada producto:
- line_number: Número de línea (1, 2, 3...)
- description: Descripción tal como aparece (idioma original)
- description_es: Tu mejor traducción al español
- quantity: Cantidad (number)
- unit: Unidad (PCS, KG, M, L, SET, etc.)
- unit_price: Precio unitario (number)
- total_price: Precio total de la línea (number)
- hs_code_on_invoice: Código HS/TARIC si aparece, si no null
- country_of_origin: País de origen específico de la línea (ISO 2). Si no aparece, usar el del proveedor
- net_weight_kg: Peso neto en kg si aparece, si no null
- gross_weight_kg: Peso bruto en kg si aparece, si no null

4. TRANSPORTE (si aparece):
- transport_mode: sea/air/road/rail
- port_of_loading
- port_of_discharge
- vessel_name
- container_number

5. NOTAS:
- notes: Array de observaciones
- confidence: high/medium/low
- warnings: Array de problemas detectados

REGLAS:
- Si un campo no está presente, usa null (no inventes)
- Importes como números, no strings (1500.50, no "1,500.50")
- Interpreta separadores decimales según contexto del país/divisa
- Procesa todas las páginas
- Si es factura proforma, indícalo en warnings
- Presta atención al Incoterm: "FOB Shanghai", "CIF Barcelona", etc.

RESPONDE SOLO CON JSON VÁLIDO, sin markdown ni texto adicional.

{
  "invoice": {
    "supplier_name": null,
    "supplier_country": null,
    "supplier_address": null,
    "invoice_number": null,
    "invoice_date": null,
    "currency": null,
    "incoterm": null,
    "payment_terms": null,
    "total_amount": null
  },
  "buyer": {
    "buyer_name": null,
    "buyer_country": null
  },
  "lines": [
    {
      "line_number": 1,
      "description": null,
      "description_es": null,
      "quantity": null,
      "unit": null,
      "unit_price": null,
      "total_price": null,
      "hs_code_on_invoice": null,
      "country_of_origin": null,
      "net_weight_kg": null,
      "gross_weight_kg": null
    }
  ],
  "transport": {
    "transport_mode": null,
    "port_of_loading": null,
    "port_of_discharge": null,
    "vessel_name": null,
    "container_number": null
  },
  "notes": [],
  "confidence": "medium",
  "warnings": []
}`

function errorResponse(error, status, extra = {}) {
  return NextResponse.json(
    { success: false, error, ...extra },
    { status, headers: SECURE_RESPONSE_HEADERS }
  )
}

export async function POST(request) {
  try {
    // 1. Anti-CSRF: verificar Origin
    if (!isSameOrigin(request)) {
      return errorResponse('Origen no autorizado.', 403)
    }

    // 2. Auth (necesario para saber si es admin antes de aplicar rate limit)
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Debes iniciar sesión para usar el extractor de facturas.', 401)
    }

    const isAdmin = isAdminEmail(user.email)

    // 3. Rate limit por IP (los admin lo saltan)
    let rl = { success: true, configured: false, limit: 0, remaining: 0, reset: 0 }
    if (!isAdmin) {
      rl = await checkRateLimit(request, invoiceOCRLimiter)
      if (!rl.success) {
        const minutes = Math.ceil((rl.reset - Date.now()) / 1000 / 60)
        return NextResponse.json(
          {
            success: false,
            error: 'Has hecho demasiadas extracciones por hora. Inténtalo de nuevo más tarde.',
            retryAfterMinutes: minutes,
          },
          { status: 429, headers: { ...SECURE_RESPONSE_HEADERS, ...rateLimitHeaders(rl) } }
        )
      }
    }

    // 4. Límite diario por usuario (free tier: 2/día). Admin sin límite.
    let daily
    if (isAdmin) {
      daily = { allowed: true, used: 0, limit: -1, remaining: -1, resetsIn: 0 }
    } else {
      daily = await checkDailyInvoiceOCRLimit(user.id, DEFAULT_DAILY_LIMIT)
      if (!daily.allowed) {
        const hours = Math.ceil(daily.resetsIn / 3600)
        return NextResponse.json(
          {
            success: false,
            error: `Has alcanzado tu límite diario de ${daily.limit} extracciones. Se reinicia en ${hours} h.`,
            usage: { used: daily.used, limit: daily.limit, remaining: 0, resetsInHours: hours },
          },
          { status: 429, headers: SECURE_RESPONSE_HEADERS }
        )
      }
    }

    // 5. Parsear FormData
    let formData
    try {
      formData = await request.formData()
    } catch {
      return errorResponse('No se ha podido leer el archivo enviado.', 400)
    }

    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return errorResponse('Falta el archivo de la factura.', 400)
    }

    // Pre-check rápido de tamaño (sin cargar a memoria si es enorme)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return errorResponse('El archivo supera el tamaño máximo de 10 MB.', 413)
    }

    // 6. Leer en memoria + validar magic bytes
    let buffer
    try {
      buffer = Buffer.from(await file.arrayBuffer())
    } catch {
      return errorResponse('No se ha podido leer el contenido del archivo.', 400)
    }

    const validation = validateUploadedInvoice(file, buffer)
    if (!validation.ok) {
      return errorResponse(validation.error, validation.status)
    }
    const realMime = validation.mime

    // 7. Llamada a Claude (PDF como document, imagen como image)
    const sourceBlock = realMime === 'application/pdf'
      ? {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: buffer.toString('base64'),
          },
        }
      : {
          type: 'image',
          source: {
            type: 'base64',
            media_type: realMime,
            data: buffer.toString('base64'),
          },
        }

    let message
    try {
      message = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: [
            sourceBlock,
            { type: 'text', text: INVOICE_EXTRACTION_PROMPT },
          ],
        }],
      })
    } catch (err) {
      // Log SOLO el mensaje, no el contenido del archivo
      safeLogger.error('[extract-invoice] Claude API error:', err?.message || 'unknown')
      return errorResponse('No se ha podido procesar la factura. Inténtalo de nuevo.', 502)
    } finally {
      // Liberar buffer cuanto antes
      buffer = null
    }

    // 8. Parsear respuesta JSON
    const responseText = message?.content?.[0]?.text || ''
    let parsedData
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      parsedData = JSON.parse(jsonMatch[0])
    } catch (err) {
      safeLogger.error('[extract-invoice] JSON parse error:', err?.message)
      return errorResponse('La IA devolvió una respuesta inesperada. Inténtalo de nuevo.', 502)
    }

    // 9. Validaciones cruzadas
    const issues = validateExtractedInvoice(parsedData)
    const validationSummary = summarizeValidation(issues)

    // 10. Guardar en historial (solo metadatos + JSON estructurado, NUNCA el archivo)
    let extractionId = null
    try {
      const { data: insertRes } = await supabase
        .from('invoice_extractions')
        .insert({
          user_id: user.id,
          file_name: file.name?.substring(0, 200) || null,
          file_mime: realMime,
          invoice_number: parsedData.invoice?.invoice_number || null,
          supplier_name: parsedData.invoice?.supplier_name || null,
          supplier_country: parsedData.invoice?.supplier_country || null,
          currency: parsedData.invoice?.currency || null,
          incoterm: parsedData.invoice?.incoterm || null,
          total_amount: typeof parsedData.invoice?.total_amount === 'number'
            ? parsedData.invoice.total_amount
            : null,
          lines_count: Array.isArray(parsedData.lines) ? parsedData.lines.length : 0,
          extracted_data: parsedData,
          validation_issues: issues,
          tokens_used: (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0),
        })
        .select('id')
        .single()
      extractionId = insertRes?.id || null
    } catch (err) {
      // Si no existe la tabla aún, no romper el flujo
      safeLogger.error('[extract-invoice] DB insert failed:', err?.message)
    }

    // 11. Respuesta
    return NextResponse.json(
      {
        success: true,
        extractionId,
        data: parsedData,
        validation: validationSummary,
        usage: {
          daily: {
            used: daily.used,
            limit: daily.limit,
            remaining: daily.remaining,
            unlimited: isAdmin,
          },
        },
        tokens_used: (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0),
      },
      { headers: { ...SECURE_RESPONSE_HEADERS, ...rateLimitHeaders(rl) } }
    )
  } catch (error) {
    // Nunca exponer detalles internos
    safeLogger.error('[extract-invoice] Unhandled:', error?.message || 'unknown')
    return errorResponse('Error inesperado. Inténtalo de nuevo.', 500)
  }
}

export const runtime = 'nodejs'
export const maxDuration = 60
