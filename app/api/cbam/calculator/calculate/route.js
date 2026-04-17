import { NextResponse } from 'next/server'
import { calculateProducts } from '@/lib/cbamAdvisoryCalculator'
import { toFreeTierPayload } from '@/lib/cbamCalculatorPayload'
import { isCnSupportedByAdvisory } from '@/lib/cbamData'

/**
 * POST /api/cbam/calculator/calculate
 *
 * Calcula CBAM para un conjunto de productos (máx. 5) sin persistir nada.
 * Funciona sin login — es el Nivel 2 freemium.
 *
 * Body: {
 *   year: 2026 | 2027 | 2028,
 *   products: [
 *     {
 *       productDescription?: string,
 *       cnCode: string,
 *       countryCode: string,
 *       annualTonnes: number,
 *       hasRealEmissions: boolean,
 *       emissionFactorReal?: number,
 *       productionRoute?: string,
 *     }, ...
 *   ]
 * }
 *
 * Response (free-tier):
 *   { success, data: { lines: [...], totals: {...}, regParams: {...} } }
 *   Los campos premium (FE aplicado, Column A/B, markup, ruta aplicada,
 *   benchmark) están filtrados por cbamCalculatorPayload.js y NO se exponen.
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const year = Number(body.year) || 2026
    const products = Array.isArray(body.products) ? body.products : []

    // Validaciones básicas
    if (products.length === 0) {
      return NextResponse.json({ error: 'Se requiere al menos un producto' }, { status: 400 })
    }
    if (products.length > 5) {
      return NextResponse.json({ error: 'Máximo 5 productos por cálculo' }, { status: 400 })
    }
    if (![2026, 2027, 2028].includes(year)) {
      return NextResponse.json({ error: 'Año no soportado (2026, 2027 o 2028)' }, { status: 400 })
    }

    for (const p of products) {
      if (!p.cnCode || !p.countryCode || !p.annualTonnes) {
        return NextResponse.json({
          error: 'Cada producto requiere cnCode, countryCode y annualTonnes',
        }, { status: 400 })
      }
      if (Number(p.annualTonnes) <= 0) {
        return NextResponse.json({ error: 'Toneladas deben ser > 0' }, { status: 400 })
      }
      // Bloqueo de electricidad (mismo helper que Advisory)
      const check = isCnSupportedByAdvisory(p.cnCode)
      if (!check.supported) {
        return NextResponse.json({
          error: `El sector ${check.sectorId || 'especificado'} no está disponible en la calculadora. Contacta con LexAduana para consultoría especializada.`,
          code: 'SECTOR_NOT_SUPPORTED',
          sectorId: check.sectorId,
        }, { status: 400 })
      }
      if (p.hasRealEmissions && (!p.emissionFactorReal || Number(p.emissionFactorReal) <= 0)) {
        return NextResponse.json({
          error: 'Si usas emisiones reales, el factor de emisión debe ser > 0',
        }, { status: 400 })
      }
    }

    // Motor puro — NO toca BD
    const engineResult = await calculateProducts({ products, year })

    // Filtrado a payload free-tier (sin FE, Column A/B, markup, ruta aplicada)
    const payload = toFreeTierPayload(engineResult, products)

    return NextResponse.json({ success: true, data: payload })
  } catch (err) {
    console.error('[POST /api/cbam/calculator/calculate]', err)
    return NextResponse.json(
      { error: 'Error calculando CBAM', detail: err.message },
      { status: 500 }
    )
  }
}
