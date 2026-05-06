import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente con service_role para escribir sin RLS.
// La tabla csp_violations no tiene policies SELECT públicas.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// Normaliza ambos formatos de CSP report a filas para csp_violations.
// - Reporting API moderno: array de eventos { type, body: { blockedURL, ... } }
// - report-uri legacy: { "csp-report": { "blocked-uri", ... } }
// Un único POST en formato moderno puede contener varios eventos: devolvemos
// una fila por evento, no una sola con el array entero.
function extractFields(payload) {
  if (Array.isArray(payload)) {
    return payload
      .filter((event) => event && event.type === 'csp-violation' && event.body)
      .map((event) => ({
        document_uri: event.body.documentURL ?? null,
        referrer: event.body.referrer ?? null,
        violated_directive: event.body.effectiveDirective ?? null,
        effective_directive: event.body.effectiveDirective ?? null,
        blocked_uri: event.body.blockedURL ?? null,
        source_file: event.body.sourceFile ?? null,
        line_number: event.body.lineNumber ?? null,
        column_number: event.body.columnNumber ?? null,
        status_code: event.body.statusCode ?? null,
        raw_report: payload,
      }))
  }

  if (payload && payload['csp-report']) {
    const r = payload['csp-report']
    return [
      {
        document_uri: r['document-uri'] ?? null,
        referrer: r['referrer'] ?? null,
        violated_directive: r['violated-directive'] ?? null,
        effective_directive: r['effective-directive'] ?? r['violated-directive'] ?? null,
        blocked_uri: r['blocked-uri'] ?? null,
        source_file: r['source-file'] ?? null,
        line_number: r['line-number'] ?? null,
        column_number: r['column-number'] ?? null,
        status_code: r['status-code'] ?? null,
        raw_report: payload,
      },
    ]
  }

  return [
    {
      document_uri: null,
      referrer: null,
      violated_directive: null,
      effective_directive: null,
      blocked_uri: null,
      source_file: null,
      line_number: null,
      column_number: null,
      status_code: null,
      raw_report: payload,
    },
  ]
}

export async function POST(request) {
  // Aceptamos application/csp-report (legacy), application/reports+json
  // (Reporting API) y application/json (fallback). request.json() no valida
  // Content-Type, solo parsea el body.
  try {
    const body = await request.json().catch(() => null)

    if (body === null || body === undefined) {
      return new NextResponse(null, { status: 204 })
    }

    const rows = extractFields(body)

    if (rows.length > 0) {
      const { error } = await supabaseAdmin.from('csp_violations').insert(rows)
      if (error) {
        // Log local pero responder 204 igualmente (no bloquear el navegador).
        // No usamos safe-logger aquí: el endpoint es safe-by-construction
        // (solo metadata CSP, sin PII) y así lo documenta lib/safe-logger.js.
        console.error('[CSP report insert error]', error.message)
      }
    }

    // 204 No Content es la respuesta estándar para CSP reports.
    return new NextResponse(null, { status: 204 })
  } catch {
    // Nunca bloquear el navegador con errores en este endpoint.
    return new NextResponse(null, { status: 204 })
  }
}

// CSP Reports llegan como POST únicamente.
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
