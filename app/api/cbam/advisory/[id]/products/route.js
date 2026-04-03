import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import {
  getAdvisoryRequest,
  getAdvisoryProducts,
  addAdvisoryProduct,
  bulkUpdateAdvisoryProducts,
} from '@/lib/cbamAdvisoryService'

/** Verifica ownership de la solicitud */
async function verifyOwnership(requestId, userId) {
  const request = await getAdvisoryRequest(requestId)
  if (!request || request.userId !== userId) return null
  return request
}

/**
 * GET /api/cbam/advisory/[id]/products
 * Lista productos de una solicitud
 */
export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const advisory = await verifyOwnership(id, user.id)
    if (!advisory) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    const products = await getAdvisoryProducts(id)
    return NextResponse.json({ success: true, data: products })
  } catch (error) {
    console.error('Error en products GET:', error)
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}

/**
 * POST /api/cbam/advisory/[id]/products
 * Añade una línea de producto
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
    const advisory = await verifyOwnership(id, user.id)
    if (!advisory) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (!['draft', 'intake_complete'].includes(advisory.status)) {
      return NextResponse.json(
        { error: 'No se pueden añadir productos a esta solicitud' },
        { status: 400 }
      )
    }

    const body = await request.json()

    if (!body.productDescription || !body.countryCode || !body.annualTonnes) {
      return NextResponse.json(
        { error: 'Campos requeridos: productDescription, countryCode, annualTonnes' },
        { status: 400 }
      )
    }

    const product = await addAdvisoryProduct(id, {
      productDescription: body.productDescription,
      cnCode: body.cnCode || null,
      countryCode: body.countryCode,
      countryName: body.countryName || null,
      annualTonnes: parseFloat(body.annualTonnes),
      supplierName: body.supplierName || null,
      supplierContactEmail: body.supplierContactEmail || null,
      supplierInstallationName: body.supplierInstallationName || null,
      hasRealEmissions: body.hasRealEmissions || false,
      emissionFactorReal: body.emissionFactorReal ? parseFloat(body.emissionFactorReal) : null,
      productionRoute: body.productionRoute || null,
    })

    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error) {
    console.error('Error en products POST:', error)
    return NextResponse.json({ error: error.message || 'Error al añadir producto' }, { status: 500 })
  }
}

/**
 * PUT /api/cbam/advisory/[id]/products
 * Actualización bulk de productos (guarda todo el paso 2 de golpe)
 */
export async function PUT(request, { params }) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const advisory = await verifyOwnership(id, user.id)
    if (!advisory) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (!['draft', 'intake_complete'].includes(advisory.status)) {
      return NextResponse.json(
        { error: 'No se pueden editar productos de esta solicitud' },
        { status: 400 }
      )
    }

    const body = await request.json()
    if (!Array.isArray(body.products)) {
      return NextResponse.json({ error: 'Se espera { products: [...] }' }, { status: 400 })
    }

    const results = await bulkUpdateAdvisoryProducts(id, body.products)
    return NextResponse.json({ success: true, data: results })
  } catch (error) {
    console.error('Error en products PUT:', error)
    return NextResponse.json({ error: error.message || 'Error al actualizar productos' }, { status: 500 })
  }
}
