/**
 * CBAM Advisory Calculator - v3
 *
 * Motor de cálculo para el servicio de asesoría premium.
 * Usa datos oficiales del Reg. 2025/2620 (benchmarks por CN con Column A/B)
 * y Reg. 2025/2621 (default values por país×CN×ruta con markup pre-calculado).
 *
 * Fórmula (Art. 9 Reg. 2023/956 + Reg. 2025/2620):
 *
 *   Emisiones incorporadas = Toneladas × FE
 *   AGIE (free allocation)  = Toneladas × F_CBAM × FCI × BM
 *   Certificados a entregar = max(0, Emisiones incorporadas − AGIE)
 *   Coste                   = Certificados × Precio certificado CBAM
 *
 * Donde:
 *   FE     = Factor de emisión (real verificado, o default oficial con markup)
 *   BM     = Benchmark EU del CN code (Column A para reales, Column B para defaults)
 *   F_CBAM = Factor de obligación gradual (Art. 36 Reg. 2023/956)
 *   FCI    = Factor de corrección intersectorial (Reg. 2025/2620)
 */

import { checkCBAM } from '@/lib/cbamData'
import {
  getOfficialBenchmark,
  getOfficialDefaultValue,
} from '@/lib/cbamService'
import {
  getAdvisoryRequest,
  getAdvisoryProducts,
  updateAdvisoryProduct,
  updateAdvisoryRequest,
} from '@/lib/cbamAdvisoryService'
import { getRegulatoryParamsForYear } from '@/lib/cbamRegulatoryParams'

// ============================================================
// MOTOR DE CÁLCULO PRINCIPAL
// ============================================================

/**
 * Ejecuta el cálculo completo para una solicitud de asesoría.
 *
 * Para cada producto:
 * 1. Detecta sector a partir del CN code
 * 2. Obtiene benchmark oficial por CN (Column A o B según escenario)
 * 3. Obtiene factor de emisión (real del proveedor o default oficial por país×CN)
 * 4. Calcula emisiones incorporadas, AGIE, certificados y coste
 * 5. Calcula escenario dual (real vs defaults)
 * 6. Actualiza producto con resultados
 * 7. Agrega totales y actualiza la solicitud
 *
 * @param {string} requestId - UUID de la solicitud
 * @param {object} client - Supabase client
 * @returns {Object} Solicitud actualizada con totales
 */
export async function calculateAdvisoryRequest(requestId, client) {
  const request = await getAdvisoryRequest(requestId, client)

  if (!request) {
    throw new Error('Solicitud no encontrada')
  }
  if (request.status === 'draft') {
    throw new Error('La solicitud debe estar enviada antes de calcular')
  }

  const products = await getAdvisoryProducts(requestId, client)
  if (!products.length) {
    throw new Error('No hay productos para calcular')
  }

  const year = request.calculationYear || 2026

  // Parámetros regulatorios (centralizados en cbamRegulatoryParams.js)
  const regParams = getRegulatoryParamsForYear(year)
  const cbamFactor = regParams.cbamFactor
  const fci = regParams.fci
  const cbamPrice = regParams.certificatePrice

  let totalCost = 0
  let totalTonnes = 0
  let totalEmissions = 0

  for (const product of products) {
    const cnCode = product.cnCode || product.cnCodeDetected
    const countryCode = product.countryCode
    const productionRoute = product.productionRoute || null

    // 1. Detectar sector
    const cbamCheck = checkCBAM(cnCode)
    if (!cbamCheck || !cbamCheck.affected) {
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
        productionRoute: null,
      }, client)
      continue
    }

    // 2. Determinar factor de emisión y benchmark según escenario
    let emissionFactor
    let emissionFactorRaw
    let emissionSource
    let emissionFactorSource
    let benchmarkColumn
    let markupApplied = 0

    if (product.hasRealEmissions && product.emissionFactorReal) {
      // ── ESCENARIO REAL ──
      // FE = dato verificado del proveedor
      // BM = Column A (benchmark para emisiones reales)
      emissionFactor = product.emissionFactorReal
      emissionFactorRaw = emissionFactor
      emissionSource = 'real'
      emissionFactorSource = 'supplier'
      benchmarkColumn = 'A'
    } else {
      // ── ESCENARIO DEFAULT ──
      // FE = valor por defecto oficial del país×CN con markup pre-calculado (Reg. 2025/2621)
      // BM = Column B (benchmark para valores por defecto)
      emissionSource = 'default'
      benchmarkColumn = 'B'

      const officialDV = await getOfficialDefaultValue(cnCode, countryCode, year, productionRoute)
      if (officialDV) {
        emissionFactor = officialDV.withMarkup
        emissionFactorRaw = officialDV.totalEmissions
        markupApplied = emissionFactorRaw > 0
          ? Math.round((emissionFactor / emissionFactorRaw - 1) * 10000) / 100
          : 0
        emissionFactorSource = `Reg. 2025/2621 (${officialDV.countryCode})`
      } else {
        // No official DV found — this should not happen with complete data
        console.warn(`[Advisory Calc] No official DV for CN ${cnCode}, country ${countryCode}`)
        emissionFactor = 0
        emissionFactorRaw = 0
        emissionFactorSource = 'not_found'
      }
    }

    // 3. Obtener benchmark oficial por CN code
    const benchmarkResult = await getOfficialBenchmark(cnCode, benchmarkColumn, productionRoute)
    const benchmark = benchmarkResult?.value || 0
    const benchmarkRoute = benchmarkResult?.route || null

    // 4. Calcular emisiones y certificados
    const emissionsSubject = Math.max(0, emissionFactor - benchmark)
    const lineEmissions = product.annualTonnes * emissionsSubject

    const certificatesPerTonne = Math.max(0, emissionFactor - cbamFactor * fci * benchmark)
    const lineCertificates = product.annualTonnes * certificatesPerTonne
    const lineCost = lineCertificates * cbamPrice

    // 5. Escenario dual: SIEMPRE calcular coste con defaults para comparar
    const defaultDV = await getOfficialDefaultValue(cnCode, countryCode, year, productionRoute)
    const defaultBM = await getOfficialBenchmark(cnCode, 'B', productionRoute)

    const defaultFE = defaultDV?.withMarkup || emissionFactor
    const defaultBenchmark = defaultBM?.value || benchmark

    const certPerTonneDefault = Math.max(0, defaultFE - cbamFactor * fci * defaultBenchmark)
    const costWithDefault = product.annualTonnes * certPerTonneDefault * cbamPrice

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
      markupApplied,
      costWithReal,
      costWithDefault,
      savingsPotential,
      productionRoute: benchmarkRoute || productionRoute,
    }, client)

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
    co2PriceUsed: cbamPrice,
    status: 'report_ready',
  }, client)

  return updatedRequest
}
