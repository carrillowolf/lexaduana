// Render rápido del PDF CBAM con un snapshot sintético, para verificar
// que la fuente Roboto se registra y todos los glifos relevantes se
// renderizan sin errores. NO usa Supabase ni datos reales — solo el
// path de presentación.

import { renderReportPdf } from '../lib/cbamReportGenerator.jsx'
import { writeFileSync } from 'node:fs'

const snapshot = {
  meta: {
    reportRef: 'CBAM-TEST-001',
    reportYear: 2026,
    generatedAt: new Date().toISOString(),
    co2Price: 75.36,
    regulatoryParams: {
      cbamFactor: 0.975,
      cbamFactorPct: 2.5,
      cbamFactorSource: 'Art. 36(2)(b) Reg. (UE) 2023/956',
      fci: 1.0,
      fciSource: 'Provisional',
      fciNote: 'Valor provisional pendiente de publicación.',
      certificatePrice: 75.36,
      certificatePriceDate: '2026-Q1',
      certificatePriceApplicationQuarter: '2026-Q1',
      certificatePricePublicationDate: '2026-04-08',
      certificatePriceLookupSource: 'database',
      certificatePriceRegulatoryRef: 'Reg. Ejecución (UE) 2025/2548',
      sources: {},
    },
  },
  client: {
    companyName: 'Acme Importaciones S.L.',
    cif: 'B12345678',
    eori: 'ESB12345678',
    contactName: 'María García',
    contactEmail: 'maria@acme.es',
  },
  products: [
    {
      index: 1,
      cnCode: '72081000',
      productDescription: 'Productos planos de hierro o acero laminados en caliente',
      countryName: 'Turquía',
      countryCode: 'TR',
      annualTonnes: 1234.56,
      supplierName: 'Steel Co.',
      emissionSource: 'real',
      emissionFactorApplied: 1.523,
      benchmarkApplied: 1.288,
      benchmarkColumnUsed: 'A',
      emissionsSubjectToCbam: 0.235,
      totalEmissions: 290.21,
      productionRouteApplied: 'BF-BOF',
      effectiveBenchmark: 1.2554,
      incorporatedEmissions: 1879.94,
      freeAllocationImplicit: 1549.73,
      certificatesPhysical: 330.21,
      certificatesAfterAdjustment: 330.21,
      certificatesToSurrender: 331,
      totalCost: 24946.16,
    },
  ],
  totals: {
    totalTonnes: 1234.56,
    totalEmissions: 290.21,
    totalEmissionsReal: 290.21,
    totalEmissionsDefault: 350.0,
    totalCertificates: 7.26,
    totalCertificatesPhysical: 330.21,
    totalCertificatesToSurrender: 331,
    hasCertificatesToSurrender: true,
    totalIncorporatedEmissions: 1879.94,
    totalFreeAllocation: 1549.73,
    totalCostReal: 24946.16,
    totalCostDefault: 26380.0,
    totalSavings: 1433.84,
    savingsPct: 5.4,
    linesCount: 1,
    linesWithRealData: 1,
    exceedsDeMinimis: true,
  },
  recommendations: [
    {
      id: 'r1',
      priority: 'high',
      titleEs: 'Solicitar datos reales al proveedor',
      bodyEs: 'Reducir la incertidumbre del cálculo solicitando datos verificados.',
    },
  ],
}

const start = Date.now()
const buf = await renderReportPdf(snapshot)
const ms = Date.now() - start
writeFileSync('/tmp/cbam-test.pdf', buf)
console.log(`OK — ${buf.length} bytes en ${ms} ms`)
