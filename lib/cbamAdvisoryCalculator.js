/**
 * CBAM Advisory Calculator - v4 (refactor — motor puro extraído)
 *
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
 *
 * Arquitectura:
 * - calculateProducts({ products, year })     → motor puro, no toca BD, in-memory.
 *   Usado por la Calculadora pública (/cbam/calculadora) y por el wrapper de Advisory.
 * - calculateAdvisoryRequest(requestId, client) → wrapper: lee BD, invoca motor puro,
 *   escribe resultados de vuelta. Usado solo por Advisory.
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
// MOTOR PURO — SIN DEPENDENCIA DE BD
// ============================================================

/**
 * Calcula el CBAM para un set de productos en memoria.
 *
 * No escribe nada en BD. Los únicos side effects son lecturas via los getters
 * `getOfficialBenchmark` y `getOfficialDefaultValue` (que sí leen Supabase para
 * datos de referencia, pero no crean ni actualizan filas de solicitudes).
 *
 * @param {Object} params
 * @param {Array}  params.products - Array de productos con los campos:
 *   - cnCode (string)
 *   - countryCode (string, ISO2)
 *   - annualTonnes (number)
 *   - hasRealEmissions (boolean)
 *   - emissionFactorReal (number, optional si hasRealEmissions)
 *   - productionRoute (string, optional)
 *   - id (any, optional — se propaga al resultado para que el wrapper haga match)
 * @param {number} params.year - Año de cálculo (2026, 2027, 2028)
 * @returns {Object} { lines: [...], totals: {...}, regParams: {...} }
 */
export async function calculateProducts({ products, year = 2026 }) {
  if (!Array.isArray(products)) {
    throw new Error('calculateProducts: products must be an array')
  }

  const regParams = getRegulatoryParamsForYear(year)
  const cbamFactor = regParams.cbamFactor
  const fci = regParams.fci
  const cbamPrice = regParams.certificatePrice

  const lines = []
  let totalCost = 0
  let totalTonnes = 0
  let totalEmissions = 0

  for (const product of products) {
    const cnCode = product.cnCode || product.cnCodeDetected
    const countryCode = product.countryCode
    const productionRoute = product.productionRoute || null
    const annualTonnes = Number(product.annualTonnes) || 0

    // 1. Detectar sector
    const cbamCheck = checkCBAM(cnCode)
    if (!cbamCheck || !cbamCheck.affected) {
      lines.push({
        id: product.id,
        cnCode,
        cnCodeDetected: null,
        sectorId: null,
        emissionSource: 'default',
        emissionFactorApplied: 0,
        emissionFactorSource: 'not_cbam',
        benchmarkApplied: 0,
        benchmarkColumn: null,
        benchmarkRoute: null,
        emissionsSubjectToCbam: 0,
        totalEmissions: 0,
        totalCost: 0,
        certificates: 0,
        markupApplied: 0,
        costWithReal: null,
        costWithDefault: null,
        savingsPotential: null,
        productionRoute: null,
        annualTonnes,
        countryCode,
        hasOfficialData: false,
      })
      continue
    }

    // 2. Determinar FE y BM según escenario
    let emissionFactor
    let emissionFactorRaw
    let emissionSource
    let emissionFactorSource
    let benchmarkColumn
    let markupApplied = 0
    let hasOfficialData = true

    if (product.hasRealEmissions && product.emissionFactorReal) {
      emissionFactor = Number(product.emissionFactorReal)
      emissionFactorRaw = emissionFactor
      emissionSource = 'real'
      emissionFactorSource = 'supplier'
      benchmarkColumn = 'A'
    } else {
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
        console.warn(`[cbamCalculator] No official DV for CN ${cnCode}, country ${countryCode}`)
        emissionFactor = 0
        emissionFactorRaw = 0
        emissionFactorSource = 'not_found'
        hasOfficialData = false
      }
    }

    // 3. Benchmark oficial por CN code
    const benchmarkResult = await getOfficialBenchmark(cnCode, benchmarkColumn, productionRoute)
    const benchmark = benchmarkResult?.value || 0
    const benchmarkRoute = benchmarkResult?.route || null

    // 4. Emisiones y certificados
    const emissionsSubject = Math.max(0, emissionFactor - benchmark)
    const lineEmissions = annualTonnes * emissionsSubject

    const certificatesPerTonne = Math.max(0, emissionFactor - cbamFactor * fci * benchmark)
    const lineCertificates = annualTonnes * certificatesPerTonne
    const lineCost = lineCertificates * cbamPrice

    // AGIE (free allocation) para desglose
    const agie = annualTonnes * (cbamFactor * fci * benchmark)

    // 5. Escenario dual: SIEMPRE calcular coste con defaults para comparar
    const defaultDV = await getOfficialDefaultValue(cnCode, countryCode, year, productionRoute)
    const defaultBM = await getOfficialBenchmark(cnCode, 'B', productionRoute)

    const defaultFE = defaultDV?.withMarkup || emissionFactor
    const defaultBenchmark = defaultBM?.value || benchmark

    const certPerTonneDefault = Math.max(0, defaultFE - cbamFactor * fci * defaultBenchmark)
    const costWithDefault = annualTonnes * certPerTonneDefault * cbamPrice

    const costWithReal = (product.hasRealEmissions && product.emissionFactorReal)
      ? lineCost
      : null

    const savingsPotential = costWithReal !== null
      ? Math.max(0, costWithDefault - costWithReal)
      : null

    lines.push({
      id: product.id,
      cnCode,
      cnCodeDetected: cbamCheck.code,
      sectorId: cbamCheck.sectorId,
      emissionFactorApplied: emissionFactor,
      emissionFactorRaw,
      emissionFactorSource,
      emissionSource,
      benchmarkApplied: benchmark,
      benchmarkColumn,
      benchmarkRoute,
      emissionsSubjectToCbam: emissionsSubject,
      totalEmissions: lineEmissions,
      certificates: lineCertificates,
      totalCost: lineCost,
      agie,
      markupApplied,
      costWithReal,
      costWithDefault,
      savingsPotential,
      productionRoute: benchmarkRoute || productionRoute,
      annualTonnes,
      countryCode,
      hasOfficialData,
    })

    // Totales agregados: solo incluyen líneas con datos oficiales.
    // Las que carezcan de DV oficial no deben contaminar el total estimado.
    if (hasOfficialData) {
      totalCost += lineCost
      totalTonnes += annualTonnes
      totalEmissions += lineEmissions
    }
  }

  return {
    lines,
    totals: {
      totalEstimatedCost: Math.round(totalCost * 100) / 100,
      totalTonnes: Math.round(totalTonnes * 100) / 100,
      totalEmissions: Math.round(totalEmissions * 10000) / 10000,
      exceedsDeMinisMis: totalTonnes >= 50,
      co2PriceUsed: cbamPrice,
    },
    regParams: {
      year,
      cbamFactor,
      fci,
      certificatePrice: cbamPrice,
    },
  }
}

// ============================================================
// WRAPPER DE ADVISORY — LEE BD, INVOCA MOTOR PURO, ESCRIBE BD
// ============================================================

/**
 * Ejecuta el cálculo completo para una solicitud de asesoría.
 *
 * Este wrapper:
 * 1. Lee la solicitud y sus productos de Supabase.
 * 2. Invoca el motor puro `calculateProducts` con los datos leídos.
 * 3. Escribe los resultados línea a línea via `updateAdvisoryProduct`.
 * 4. Actualiza los totales en la solicitud via `updateAdvisoryRequest`.
 *
 * La matemática está 100% en el motor puro — este wrapper solo orquesta.
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

  // Motor puro
  const { lines, totals } = await calculateProducts({ products, year })

  // Persistencia línea a línea
  for (const line of lines) {
    await updateAdvisoryProduct(line.id, {
      sectorId: line.sectorId,
      cnCodeDetected: line.cnCodeDetected,
      emissionFactorApplied: line.emissionFactorApplied,
      emissionSource: line.emissionSource,
      benchmarkApplied: line.benchmarkApplied,
      emissionsSubjectToCbam: line.emissionsSubjectToCbam,
      totalEmissions: line.totalEmissions,
      totalCost: line.totalCost,
      markupApplied: line.markupApplied,
      costWithReal: line.costWithReal,
      costWithDefault: line.costWithDefault,
      savingsPotential: line.savingsPotential,
      productionRoute: line.productionRoute,
    }, client)
  }

  // Totales en la solicitud
  const updatedRequest = await updateAdvisoryRequest(requestId, {
    ...totals,
    status: 'report_ready',
  }, client)

  return updatedRequest
}
