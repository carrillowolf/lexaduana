import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/cbamAdminAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { safeLogger } from '@/lib/safe-logger'

/**
 * GET /api/admin/cbam/asesoria/[id]/documents/[docId]
 * Devuelve un signed URL del documento del cliente para que el admin lo descargue.
 */
export async function GET(request, { params }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id, docId } = await params

    const { data: doc, error } = await supabaseAdmin
      .from('cbam_advisory_documents')
      .select('*')
      .eq('id', docId)
      .eq('request_id', id)
      .single()

    if (error || !doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from('cbam-advisory-docs')
      .createSignedUrl(doc.file_path, 3600)

    if (signErr) {
      safeLogger.error('Error generando signed URL doc:', signErr.message)
      return NextResponse.json({ error: 'Error generando enlace' }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: signed.signedUrl, fileName: doc.file_name })
  } catch (error) {
    safeLogger.error('Error en admin docs GET:', error)
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 })
  }
}
