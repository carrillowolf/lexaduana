import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/cbamAdminAuth'
import {
  addAdvisoryProductAsAdmin,
  updateAdvisoryProductAsAdmin,
  deleteAdvisoryProductAsAdmin,
} from '@/lib/cbamAdvisoryAdminService'
import { safeLogger } from '@/lib/safe-logger'

/**
 * POST /api/admin/cbam/asesoria/[id]/products
 * Añade una línea de producto a la solicitud (admin).
 */
export async function POST(request, { params }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const body = await request.json()

    if (!body.productDescription || !body.countryCode || body.annualTonnes == null) {
      return NextResponse.json(
        { error: 'Campos requeridos: productDescription, countryCode, annualTonnes' },
        { status: 400 }
      )
    }

    const product = await addAdvisoryProductAsAdmin(id, body)
    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error) {
    safeLogger.error('Error en admin products POST:', error)
    return NextResponse.json(
      { error: error.message || 'Error al añadir producto' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/cbam/asesoria/[id]/products
 * Actualiza UN producto (admin). Body debe incluir productId.
 */
export async function PATCH(request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const { productId, ...data } = body

    if (!productId) {
      return NextResponse.json({ error: 'productId requerido' }, { status: 400 })
    }

    const updated = await updateAdvisoryProductAsAdmin(productId, data)
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    safeLogger.error('Error en admin products PATCH:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar producto' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/cbam/asesoria/[id]/products?productId=...
 * Elimina un producto (admin).
 */
export async function DELETE(request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'productId requerido' }, { status: 400 })
    }

    await deleteAdvisoryProductAsAdmin(productId)
    return NextResponse.json({ success: true, message: 'Producto eliminado' })
  } catch (error) {
    safeLogger.error('Error en admin products DELETE:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar producto' },
      { status: 500 }
    )
  }
}
