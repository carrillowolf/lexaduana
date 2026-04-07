/**
 * CBAM Report Snapshot Builder - Phase 3
 *
 * Construye el objeto JSONB que se guarda como `calculation_snapshot` en
 * cbam_advisory_reports. Este snapshot contiene TODA la información necesaria
 * para regenerar el PDF en cualquier momento sin depender del estado vigente
 * de cbam_advisory_products.
 *
 * Estructura:
 * {
 *   meta: { reportRef, reportYear, generatedAt, generatedBy, language, co2Price },
 *   client: { companyName, cif, eori, contactName, contactEmail, ... },
 *   request: { id, status, calculationYear, ... },
 *   products: [...],
 *   totals: { totalTonnes, totalEmissionsReal, totalEmissionsDefault, totalCostReal, ... },
 *   recommendations: [...]
 * }
 */

import { generateRecommendations } from '@/lib/cbamReportRecommendations'

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

  // Totales agregados
  let totalTonnes = 0
  let totalEmissionsReal = 0
  let totalEmissionsDefault = 0
  let totalCostReal = 0
  let totalCostDefault = 0
  let totalCertificates = 0

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

    totalTonnes += tonnes
    totalCostReal += costWithReal != null ? costWithReal : lineCost
    totalCostDefault += costWithDefault != null ? costWithDefault : lineCost

    if (p.emissionSource === 'real') {
      totalEmissionsReal += lineEmissions
    } else {
      totalEmissionsDefault += lineEmissions
    }

    // Certificados ≈ emisiones sujetas a CBAM (factor año aplicado por motor)
    totalCertificates += lineEmissions

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
      benchmarkApplied: benchmark,
      emissionsSubjectToCbam: emissionsSubject,
      totalEmissions: lineEmissions,
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
      co2Price,
      version: 1,
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
