import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getAdvisoryRequest, uploadAdvisoryDocument } from '@/lib/cbamAdvisoryService'
import { safeLogger } from '@/lib/safe-logger'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * POST /api/cbam/advisory/[id]/documents
 * Sube un documento a Supabase Storage
 */
export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar ownership
    const advisory = await getAdvisoryRequest(id, supabase)
    if (!advisory || advisory.userId !== user.id) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (!['draft', 'intake_complete'].includes(advisory.status)) {
      return NextResponse.json(
        { error: 'No se pueden subir documentos a esta solicitud' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const fileType = formData.get('fileType') || 'other'
    const notes = formData.get('notes') || null

    if (!file) {
      return NextResponse.json({ error: 'No se ha proporcionado ningún archivo' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'El archivo supera el límite de 10MB' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Formatos aceptados: PDF, JPEG, PNG, Excel, CSV' },
        { status: 400 }
      )
    }

    const doc = await uploadAdvisoryDocument(id, user.id, file, fileType, notes, supabase)
    return NextResponse.json({ success: true, data: doc }, { status: 201 })
  } catch (error) {
    safeLogger.error('Error en documents POST:', error)
    return NextResponse.json({ error: error.message || 'Error al subir documento' }, { status: 500 })
  }
}
