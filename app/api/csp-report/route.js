import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente con service_role para escribir sin RLS.
// La tabla csp_violations no tiene policies SELECT públicas.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

export async function POST(request) {
  try {
    // Los reports CSP llegan con Content-Type: application/csp-report
    // Estructura legacy: { "csp-report": { ... } }
    // Estructura Reporting API: { type: "csp-violation", body: { ... } }
    const body = await request.json().catch(() => null)

    if (!body) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    // Soportar tanto el formato legacy (csp-report) como el nuevo (Reporting API)
    const report = body['csp-report'] || body.body || body

    if (!report || typeof report !== 'object') {
      return NextResponse.json({ error: 'No report data' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('csp_violations')
      .insert({
        document_uri: report['document-uri'] || report.documentURL || null,
        referrer: report.referrer || null,
        violated_directive: report['violated-directive'] || report.effectiveDirective || null,
        effective_directive: report['effective-directive'] || null,
        blocked_uri: report['blocked-uri'] || report.blockedURL || null,
        source_file: report['source-file'] || report.sourceFile || null,
        line_number: report['line-number'] || report.lineNumber || null,
        column_number: report['column-number'] || report.columnNumber || null,
        status_code: report['status-code'] || null,
        raw_report: report,
      })

    if (error) {
      // Log local pero responder 204 igualmente (no bloquear el navegador)
      console.error('[CSP report insert error]', error.message)
    }

    // 204 No Content es la respuesta estándar para CSP reports
    return new NextResponse(null, { status: 204 })
  } catch {
    // Nunca bloquear el navegador con errores en este endpoint
    return new NextResponse(null, { status: 204 })
  }
}

// CSP Reports llegan como POST únicamente
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
