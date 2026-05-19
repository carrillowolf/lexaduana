/**
 * CBAM Report Snapshot Builder - v3
 *
 * Construye el objeto JSONB que se guarda como `calculation_snapshot` en
 * cbam_advisory_reports. Este snapshot contiene TODA la información necesaria
 * para regenerar el PDF en cualquier momento sin depender del estado vigente
 * de cbam_advisory_products.
 *
 * v3 añade (vs v2):
 *   - Por línea: markupApplied, emissionFactorRaw, benchmarkColumnUsed,
 *                productionRouteApplied, emissionFactorSource
 *   - En meta: fciNote, dataSourceVersion, benchmarksSourceVersion
 *
 * Estructura:
 * {
 *   meta: { reportRef, reportYear, generatedAt, generatedBy, language, co2Price,
 *           version, regulatoryParams, fciNote, dataSourceVersion, benchmarksSourceVersion },
 *   client: { companyName, cif, eori, contactName, contactEmail, ... },
 *   request: { id, status, calculationYear, ... },
 *   products: [...],
 *   totals: { totalTonnes, totalEmissionsReal, totalEmissionsDefault, totalCostReal, ... },
 *   recommendations: [...]
 * }
 */

import { generateRecommendations } from '@/lib/cbamReportRecommendations'
import { getRegulatoryParamsForYear } from '@/lib/cbamRegulatoryParams'

// Versiones de los datos oficiales cargados (Reg. 2025/2620 y 2025/2621).
// Se incluyen en el snapshot para trazabilidad: permite saber exactamente
// qué release del Excel de la CE se usó para generar el informe.
const DATA_SOURCE_VERSIONS = {
  benchmarks: 'CBAM_Benchmarks_20260206',     // Reg. (UE) 2025/2620
  defaultValues: 'DVs_as_adopted_v20260204',   // Reg. (UE) 2025/2621
}

/**
 * Construye el snapshot completo a partir de la solicitud (con products inline)
 * y los metadatos del informe.
 *
 * @param {Object} args
 * @param {Object} args.advisory - Solicitud completa con products[] y documents[]
 * @param {string} args.reportRef - Referencia (ej. LA-CBAM-2027-0045)
 * @param {string} args.generatedBy - Email del admin
 * @returns {Object} snapshot listo para guardar como JSONB
 */
export function buildReportSnapshot({ advisory, reportRef, generatedBy }) {
  if (!advisory) throw new Error('advisory requerido')

  const products = advisory.products || []
  const reportYear = advisory.calculationYear || new Date().getFullYear()
  const co2Price = advisory.co2PriceUsed || 0

  // Parámetros regulatorios aplicables al año del informe (con fuentes).
  // Esto permite que el PDF cite F_CBAM, FCI y precio con su base legal.
  const regParams = getRegulatoryParamsForYear(reportYear)

  // Totales agregados
  let totalTonnes = 0
  let totalEmissionsReal = 0
  let totalEmissionsDefault = 0
  let totalCostReal = 0
  let totalCostDefault = 0
  let totalCertificates = 0
  let totalIncorporatedEmissions = 0
  let totalFreeAllocation = 0

  const productSnapshots = products.map((p, idx) => {
    const tonnes = parseFloat(p.annualTonnes) || 0
    const efApplied = parseFloat(p.emissionFactorApplied) || 0
    const benchmark = parseFloat(p.benchmarkApplied) || 0
    const emissionsSubject = parseFloat(p.emissionsSubjectToCbam) || 0
    const lineEmissions = parseFloat(p.totalEmissions) || 0
    const lineCost = parseFloat(p.totalCost) || 0
    const costWithReal = p.costWithReal != null ? parseFloat(p.costWithReal) : null
    const costWithDefault = p.costWithDefault != null ? parseFloat(p.costWithDefault) : null
    const savings = p.savingsPotential != null ? parseFloat(p.savingsPotential) : null

    // v3: nuevos campos de trazabilidad del calculator
    const markupApplied = parseFloat(p.markupApplied) || 0
    const productionRouteApplied = p.productionRoute || null

    // Columna de benchmark usada: Column A para reales, Column B para defaults
    const benchmarkColumnUsed = p.emissionSource === 'real' ? 'A' : 'B'

    // Factor de emisión bruto (antes de markup):
    //   Si hay markup > 0, raw = applied / (1 + markup/100)
    //   Si no hay markup (reales o markup=0), raw = applied
    const emissionFactorRaw = markupApplied > 0
      ? round6(efApplied / (1 + markupApplied / 100))
      : efApplied

    // Fuente del factor de emisión
    const emissionFactorSource = p.emissionSource === 'real'
      ? 'supplier'
      : `Reg. 2025/2621 (${p.countryCode || '?'})`

    // Emisiones INCORPORADAS (Tn × FE), benchmark efectivo (F_CBAM × FCI × BM)
    // y AGIE (Tn × benchmark efectivo) son derivaciones triviales sobre campos
    // ya persistidos por el calculator. El snapshot las muestra; la fuente de
    // verdad sigue siendo el calculator.
    const lineIncorporatedEmissions = tonnes * efApplied
    const effectiveBenchmark = regParams.cbamFactor * regParams.fci * benchmark

    // freeAllocationImplicit (AGIE) y certificatesPhysical se LEEN del producto
    // persistido. Fallback al recálculo solo cuando el producto procede de un
    // calculator pre-Bloque 1 (filas legacy con columnas NULL).
    const persistedAGIE = p.freeAllocationImplicit != null ? parseFloat(p.freeAllocationImplicit) : null
    const persistedCerts = p.certificatesPhysical != null ? parseFloat(p.certificatesPhysical) : null

    const lineAGIE = persistedAGIE != null
      ? persistedAGIE
      : tonnes * effectiveBenchmark

    const lineCertificates = persistedCerts != null
      ? persistedCerts
      : Math.max(0, lineIncorporatedEmissions - lineAGIE)

    totalTonnes += tonnes
    totalCostReal += costWithReal != null ? costWithReal : lineCost
    totalCostDefault += costWithDefault != null ? costWithDefault : lineCost
    totalCertificates += lineCertificates
    totalIncorporatedEmissions += lineIncorporatedEmissions
    totalFreeAllocation += lineAGIE

    if (p.emissionSource === 'real') {
      totalEmissionsReal += lineEmissions
    } else {
      totalEmissionsDefault += lineEmissions
    }

    return {
      index: idx + 1,
      productDescription: p.productDescription,
      cnCode: p.cnCode || p.cnCodeDetected || null,
      sectorId: p.sectorId,
      countryCode: p.countryCode,
      countryName: p.countryName,
      annualTonnes: tonnes,
      supplierName: p.supplierName,
      supplierInstallationName: p.supplierInstallationName,
      emissionSource: p.emissionSource,
      emissionFactorApplied: efApplied,
      emissionFactorRaw: round6(emissionFactorRaw),         // v3: FE sin markup
      emissionFactorSource,                                   // v3: origen del FE
      markupApplied: round2(markupApplied),                   // v3: % markup aplicado
      benchmarkApplied: benchmark,
      benchmarkColumnUsed,                                    // v3: 'A' o 'B'
      productionRouteApplied,                                 // v3: ruta (C/D/E/K/L)
      emissionsSubjectToCbam: emissionsSubject,
      totalEmissions: lineEmissions,
      incorporatedEmissions: round2(lineIncorporatedEmissions),
      effectiveBenchmark: round4(effectiveBenchmark),
      freeAllocationImplicit: round2(lineAGIE),
      certificatesPhysical: round2(lineCertificates),
      // Alias retrocompatible: el PDF v3 actual lee `certificatesAfterAdjustment`.
      // Se eliminará en Bloque 3 cuando el PDF migre a las nuevas columnas.
      certificatesAfterAdjustment: round2(lineCertificates),
      totalCost: lineCost,
      costWithReal,
      costWithDefault,
      savingsPotential: savings,
      hasRealEmissions: p.emissionSource === 'real',
    }
  })

  const totalSavings = Math.max(0, totalCostDefault - totalCostReal)
  const savingsPct = totalCostDefault > 0 ? (totalSavings / totalCostDefault) * 100 : 0

  const totals = {
    totalTonnes: round2(totalTonnes),
    totalEmissions: round2(totalEmissionsReal + totalEmissionsDefault),
    totalEmissionsReal: round2(totalEmissionsReal),
    totalEmissionsDefault: round2(totalEmissionsDefault),
    totalCertificates: round2(totalCertificates),
    totalIncorporatedEmissions: round2(totalIncorporatedEmissions),
    totalFreeAllocation: round2(totalFreeAllocation),
    totalCostReal: round2(totalCostReal),
    totalCostDefault: round2(totalCostDefault),
    totalSavings: round2(totalSavings),
    savingsPct: round2(savingsPct),
    linesCount: productSnapshots.length,
    linesWithRealData: productSnapshots.filter(p => p.hasRealEmissions).length,
    exceedsDeMinimis: totalTonnes >= 50,
  }

  const snapshot = {
    meta: {
      reportRef,
      reportYear,
      generatedAt: new Date().toISOString(),
      generatedBy: generatedBy || null,
      language: 'es_en',
      co2Price, // mantenido por compatibilidad; coincide con regulatoryParams.certificatePrice
      version: 3, // v3: trazabilidad completa (Column A/B, rutas, markup, fuentes de datos)
      regulatoryParams: {
        cbamFactor: regParams.cbamFactor,
        cbamFactorPct: regParams.cbamFactorPct,
        cbamFactorSource: regParams.cbamFactorSource,
        fci: regParams.fci,
        fciSource: regParams.fciSource,
        fciNote: 'Valor provisional (1,0) — pendiente de publicación oficial por la CE para 2026.',
        // El precio aplicado es el que el calculator persistió en la
        // solicitud (advisory.co2PriceUsed). Por compatibilidad con informes
        // anteriores al refactor del Bloque 2, si no hay precio persistido
        // caemos al respaldo regulatorio. Origen y fecha se persisten
        // también desde el calculator para que el informe sea auditable.
        //
        // Dos campos distintos por motivos semánticos:
        //   certificatePriceLookupSource = de dónde se LEYÓ en runtime
        //     ('database' | 'fallback'). Pensado para depuración / soporte.
        //   certificatePriceRegulatoryRef = referencia jurídica del valor
        //     ('Reg. Ejecución (UE) 2025/2548'). Va al PDF en la tabla de
        //     metodología / fuentes.
        certificatePrice: advisory.co2PriceUsed || regParams.certificatePrice,
        certificatePriceDate: advisory.co2PriceDate || regParams.certificatePriceDate,
        certificatePriceLookupSource: advisory.co2PriceLookupSource || 'fallback',
        certificatePriceRegulatoryRef: regParams.certificatePriceRegulatoryRef,
        certificatePriceNote: regParams.certificatePriceNote,
        sources: regParams.sources,
      },
      dataSourceVersion: DATA_SOURCE_VERSIONS.defaultValues,     // trazabilidad Excel DV
      benchmarksSourceVersion: DATA_SOURCE_VERSIONS.benchmarks,  // trazabilidad Excel BM
    },
    client: {
      companyName: advisory.companyName,
      cif: advisory.companyCif,
      eori: advisory.companyEori,
      contactName: advisory.contactName,
      contactEmail: advisory.contactEmail,
      contactPhone: advisory.contactPhone,
    },
    request: {
      id: advisory.id,
      status: advisory.status,
      calculationYear: reportYear,
      submittedAt: advisory.submittedAt,
    },
    products: productSnapshots,
    totals,
    recommendations: [],  // se rellena tras crear el resto
  }

  // Generar recomendaciones basadas en el snapshot construido
  snapshot.recommendations = generateRecommendations(snapshot)

  return snapshot
}

function round2(n) {
  return Math.round((n || 0) * 100) / 100
}

function round4(n) {
  return Math.round((n || 0) * 10000) / 10000
}

function round6(n) {
  return Math.round((n || 0) * 1000000) / 1000000
}
