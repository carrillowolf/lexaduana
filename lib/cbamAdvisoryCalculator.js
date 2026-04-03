/**
 * CBAM Advisory Calculator - Phase 2
 *
 * Motor de cálculo para el servicio de asesoría premium.
 * Reutiliza funciones de Phase 1 para clasificación, benchmarks y precios.
 *
 * Este módulo importa del servicio advisory (CRUD) y de cbamData/cbamService (datos de referencia).
 * La dependencia es unidireccional: calculator → service, nunca al revés.
 */

import { checkCBAM } from '@/lib/cbamData'
import {
  getCurrentETSPrice,
  getBenchmarkDB,
  getDefaultValueMarkupDB,
  getEmissionFactors,
} from '@/lib/cbamService'
import {
  getAdvisoryRequest,
  getAdvisoryProducts,
  updateAdvisoryProduct,
  updateAdvisoryRequest,
} from '@/lib/cbamAdvisoryService'

// ============================================================
// HELPERS
// ============================================================

/**
 * Busca el factor de emisión por defecto para un sector y código CN.
 *
 * getEmissionFactors() devuelve: { sectorId: { products: [{ id, name, factor, codes }] } }
 * Buscamos primero por coincidencia de código CN, luego el primer producto del sector.
 */
async function getDefaultEmissionFactor(sectorId, cnCode) {
  const factors = await getEmissionFactors()
  const sectorFactors = factors[sectorId]

  if (!sectorFactors?.products?.length) {
    console.warn(`[Advisory Calc] No hay factores de emisión para sector ${sectorId}`)
    return null
  }

  // Intentar match por código CN
  if (cnCode) {
    const normalizedCode = cnCode.replace(/\D/g, '')
    const match = sectorFactors.products.find(p =>
      p.codes?.some(c => normalizedCode.startsWith(c.replace(/\D/g, '')))
    )
    if (match) return match.factor
  }

  // Fallback: primer producto del sector (factor genérico)
  return sectorFactors.products[0].factor
}

// ============================================================
// MOTOR DE CÁLCULO PRINCIPAL
// ============================================================

/**
 * Ejecuta el cálculo completo para una solicitud de asesoría.
 *
 * Para cada producto:
 * 1. Detecta sector a partir del CN code
 * 2. Obtiene benchmark del sector
 * 3. Aplica factor de emisión (real o default con markup)
 * 4. Calcula emisiones sujetas a CBAM y coste
 * 5. Calcula escenario dual (real vs defaults)
 * 6. Actualiza producto con resultados
 * 7. Agrega totales y actualiza la solicitud
 *
 * @param {string} requestId - UUID de la solicitud
 * @returns {Object} Solicitud actualizada con totales
 */
export async function calculateAdvisoryRequest(requestId) {
  const request = await getAdvisoryRequest(requestId)

  if (!request) {
    throw new Error('Solicitud no encontrada')
  }
  if (request.status === 'draft') {
    throw new Error('La solicitud debe estar enviada antes de calcular')
  }

  const products = await getAdvisoryProducts(requestId)
  if (!products.length) {
    throw new Error('No hay productos para calcular')
  }

  // Obtener precio CO₂ actual — getCurrentETSPrice() devuelve { price, date, source }
  const etsData = await getCurrentETSPrice()
  const co2Price = etsData?.price || 68.50

  const year = request.calculationYear || 2026

  // Obtener markup para defaults — getDefaultValueMarkupDB() devuelve { markup, label, description }
  // markup ya es decimal: 0.10 = 10%
  const markupData = await getDefaultValueMarkupDB(year)
  const markupPct = markupData?.markup || 0

  let totalCost = 0
  let totalTonnes = 0
  let totalEmissions = 0

  for (const product of products) {
    const cnCode = product.cnCode || product.cnCodeDetected

    // 1. Detectar sector
    const cbamCheck = checkCBAM(cnCode)
    if (!cbamCheck || !cbamCheck.affected) {
      // Producto no afectado por CBAM — marcarlo y continuar
      await updateAdvisoryProduct(product.id, {
        sectorId: null,
        emissionSource: 'default',
        emissionFactorApplied: 0,
        benchmarkApplied: 0,
        emissionsSubjectToCbam: 0,
        totalEmissions: 0,
        totalCost: 0,
        markupApplied: 0,
        costWithReal: null,
        costWithDefault: null,
        savingsPotential: null,
      })
      continue
    }

    // 2. Obtener benchmark — getBenchmarkDB devuelve un número
    const benchmark = await getBenchmarkDB(cbamCheck.sectorId, year) || 0

    // 3. Determinar factor de emisión
    let emissionFactor
    let emissionSource

    if (product.hasRealEmissions && product.emissionFactorReal) {
      emissionFactor = product.emissionFactorReal
      emissionSource = 'real'
    } else {
      // Usar default del sector + markup
      const defaultFactor = await getDefaultEmissionFactor(cbamCheck.sectorId, cnCode)
      if (defaultFactor) {
        emissionFactor = defaultFactor * (1 + markupPct)
      } else {
        // Sin factor disponible — usar un valor seguro alto
        emissionFactor = benchmark * 2
      }
      emissionSource = 'default'
    }

    // 4. Calcular emisiones y coste de esta línea
    const emissionsSubject = Math.max(0, emissionFactor - benchmark)
    const lineEmissions = product.annualTonnes * emissionsSubject
    const lineCost = lineEmissions * co2Price

    // 5. Escenario dual: SIEMPRE calcular coste con defaults para comparar
    const defaultFactorRaw = await getDefaultEmissionFactor(cbamCheck.sectorId, cnCode)
    const defaultFactorWithMarkup = defaultFactorRaw
      ? defaultFactorRaw * (1 + markupPct)
      : emissionFactor

    const emissionsSubjectDefault = Math.max(0, defaultFactorWithMarkup - benchmark)
    const costWithDefault = product.annualTonnes * emissionsSubjectDefault * co2Price

    const costWithReal = (product.hasRealEmissions && product.emissionFactorReal)
      ? lineCost
      : null

    const savingsPotential = costWithReal !== null
      ? Math.max(0, costWithDefault - costWithReal)
      : null

    // 6. Actualizar producto con resultados
    await updateAdvisoryProduct(product.id, {
      sectorId: cbamCheck.sectorId,
      cnCodeDetected: cbamCheck.code,
      emissionFactorApplied: emissionFactor,
      emissionSource,
      benchmarkApplied: benchmark,
      emissionsSubjectToCbam: emissionsSubject,
      totalEmissions: lineEmissions,
      totalCost: lineCost,
      markupApplied: emissionSource === 'default' ? (markupPct * 100) : 0,
      costWithReal,
      costWithDefault,
      savingsPotential,
    })

    totalCost += lineCost
    totalTonnes += product.annualTonnes
    totalEmissions += lineEmissions
  }

  // 7. Actualizar solicitud con totales agregados
  const updatedRequest = await updateAdvisoryRequest(requestId, {
    totalEstimatedCost: Math.round(totalCost * 100) / 100,
    totalTonnes: Math.round(totalTonnes * 100) / 100,
    totalEmissions: Math.round(totalEmissions * 10000) / 10000,
    exceedsDeMinisMis: totalTonnes >= 50,
    co2PriceUsed: co2Price,
    status: 'report_ready',
  })

  return updatedRequest
}
