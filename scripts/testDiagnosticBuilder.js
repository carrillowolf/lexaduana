/**
 * Unit tests — cbamDiagnosticBuilder (Día 6 · Pieza A).
 *
 * Ejecución:  node scripts/testDiagnosticBuilder.js
 *
 * No requiere Supabase, no hace fetch — es 100% lógica pura en memoria.
 * Cubre:
 *   - Semáforo por tonelaje (verde / amarillo / rojo).
 *   - Rangos de certificados por sector (acero, aluminio, mixto).
 *   - Filtro de cifra en € (showCost=false vs true).
 *   - Recomendador de paquete (Básico / Completo / Monitorización).
 *   - Sector predominante con mezcla < 60%.
 */

import {
  buildDiagnostic,
  recommendPackage,
  resolveTrafficLight,
} from '../lib/cbamDiagnosticBuilder.js'
import {
  resolvePredominantSector,
  resolveCertificateRange,
  MIXED_SECTOR_KEY,
} from '../lib/cbamDiagnosticRanges.js'

let passed = 0
let failed = 0
const failures = []

function expect(label, condition, detail) {
  if (condition) {
    passed++
    console.log(`  ✓ ${label}`)
  } else {
    failed++
    failures.push({ label, detail })
    console.log(`  ✗ ${label}`)
    if (detail) console.log(`    ${detail}`)
  }
}

function section(name, fn) {
  console.log(`\n─── ${name} ───`)
  fn()
}

// ──────────────────────────────────────────────────────────────────────
// 1. Semáforo por tonelaje
// ──────────────────────────────────────────────────────────────────────
section('Semáforo por tonelaje total', () => {
  expect('< 50 t → green', resolveTrafficLight(30) === 'green')
  expect('= 50 t → yellow', resolveTrafficLight(50) === 'yellow')
  expect('= 200 t → yellow', resolveTrafficLight(200) === 'yellow')
  expect('> 200 t → red', resolveTrafficLight(201) === 'red')
  expect('= 0 t → green', resolveTrafficLight(0) === 'green')
  expect('NaN safe → green', resolveTrafficLight('not-a-number') === 'green')
})

// ──────────────────────────────────────────────────────────────────────
// 2. Rangos de certificados por sector
// ──────────────────────────────────────────────────────────────────────
section('Rangos de certificados por sector', () => {
  const steel1 = resolveCertificateRange(10, 'ironSteel')
  expect('acero 10 → <25', steel1.label === '<25' && steel1.tier === 0)
  const steel2 = resolveCertificateRange(80, 'ironSteel')
  expect('acero 80 → 25-100', steel2.label === '25-100' && steel2.tier === 1)
  const steel3 = resolveCertificateRange(400, 'ironSteel')
  expect('acero 400 → 100-500', steel3.label === '100-500' && steel3.tier === 2)
  const steel4 = resolveCertificateRange(600, 'ironSteel')
  expect('acero 600 → >500', steel4.label === '>500' && steel4.tier === 3)

  const alu = resolveCertificateRange(700, 'aluminium')
  expect('aluminio 700 → 200-1.000', alu.label === '200-1.000')

  const cem = resolveCertificateRange(25, 'cement')
  expect('cemento 25 → 10-50', cem.label === '10-50')

  const hyd = resolveCertificateRange(900, 'hydrogen')
  expect('hidrógeno 900 → >800', hyd.label === '>800')

  const fer = resolveCertificateRange(100, 'fertilizers')
  expect('fertilizantes 100 → 30-150', fer.label === '30-150')
})

// ──────────────────────────────────────────────────────────────────────
// 3. Sector predominante
// ──────────────────────────────────────────────────────────────────────
section('Sector predominante (umbral 60%)', () => {
  const alum80 = resolvePredominantSector([
    { sectorId: 'aluminium', annualTonnes: 80 },
    { sectorId: 'ironSteel', annualTonnes: 20 },
  ])
  expect('aluminio 80% → aluminium', alum80.sectorId === 'aluminium' && !alum80.isMixed)

  const mixed40_35_25 = resolvePredominantSector([
    { sectorId: 'ironSteel', annualTonnes: 40 },
    { sectorId: 'aluminium', annualTonnes: 35 },
    { sectorId: 'cement', annualTonnes: 25 },
  ])
  expect('40/35/25 → mixto (sin predominante)', mixed40_35_25.isMixed === true)
  expect('mixto usa ironSteel como neutro', mixed40_35_25.sectorId === MIXED_SECTOR_KEY)

  const exact60 = resolvePredominantSector([
    { sectorId: 'ironSteel', annualTonnes: 60 },
    { sectorId: 'aluminium', annualTonnes: 40 },
  ])
  expect('60/40 → predomina ironSteel (umbral inclusivo)', exact60.sectorId === 'ironSteel' && !exact60.isMixed)
})

// ──────────────────────────────────────────────────────────────────────
// 4. buildDiagnostic: caso verde (30 t) sin cost
// ──────────────────────────────────────────────────────────────────────
section('buildDiagnostic · verde (30 t acero) sin cost', () => {
  const result = buildDiagnostic({
    lines: [{
      sectorId: 'ironSteel',
      annualTonnes: 30,
      certificates: 15,
      hasOfficialData: true,
      emissionSource: 'default',
      countryCode: 'CN',
    }],
    totals: { totalTonnes: 30, totalEstimatedCost: 2240 },
    regParams: { year: 2026 },
  })

  expect('trafficLight green', result.trafficLight === 'green')
  expect('sin totalCost en payload', result.totalCost === undefined)
  expect('sin totalCertificates en payload', result.totalCertificates === undefined)
  expect('certificatesRange ironSteel', result.certificatesRange.sectorUsed === 'ironSteel')
  expect('certificatesRange label <25', result.certificatesRange.label === '<25')
  expect('economicExposure low', result.economicExposure === 'low')
  expect('potentialSaving significant', result.potentialSaving === 'significant')
  expect('recommendedPackage basico', result.recommendedPackage === 'basico')
  expect('ctaUrl contiene tipo=basico', result.ctaUrl.includes('tipo=basico'))
  expect('ctaUrl contiene from=diagnostic', result.ctaUrl.includes('from=diagnostic'))
})

// ──────────────────────────────────────────────────────────────────────
// 5. buildDiagnostic: caso amarillo (150 t acero)
// ──────────────────────────────────────────────────────────────────────
section('buildDiagnostic · amarillo (150 t acero)', () => {
  const result = buildDiagnostic({
    lines: [{
      sectorId: 'ironSteel',
      annualTonnes: 150,
      certificates: 80,
      hasOfficialData: true,
      emissionSource: 'default',
      countryCode: 'CN',
    }],
    totals: { totalTonnes: 150 },
    regParams: { year: 2026 },
  })

  expect('trafficLight yellow', result.trafficLight === 'yellow')
  expect('rango acero 25-100 para 80 certs', result.certificatesRange.label === '25-100')
  expect('recommendedPackage basico', result.recommendedPackage === 'basico')
})

// ──────────────────────────────────────────────────────────────────────
// 6. buildDiagnostic: caso rojo (500 t aluminio)
// ──────────────────────────────────────────────────────────────────────
section('buildDiagnostic · rojo (500 t aluminio)', () => {
  const result = buildDiagnostic({
    lines: [{
      sectorId: 'aluminium',
      annualTonnes: 500,
      certificates: 3000,
      hasOfficialData: true,
      emissionSource: 'default',
      countryCode: 'TR',
    }],
    totals: { totalTonnes: 500 },
    regParams: { year: 2026 },
  })

  // 500 t está en el tope del tier yellow (≤200 era yellow, >200 es red).
  expect('trafficLight red (>200 t)', result.trafficLight === 'red')
  // 3000 certs en aluminio → >1.000 (tier 3)
  expect('rango aluminio >1.000', result.certificatesRange.label === '>1.000')
  expect('economicExposure very_high', result.economicExposure === 'very_high')
  // Para monitorización necesitamos > 500. Aquí 500 ≤ 500, así que es "completo"
  // por aluminio >1 países o por scope. Pero con 1 sola línea y 1 país y 1
  // producto, aún cabe en básico. El recomendador no usa el semáforo, usa
  // los contadores.
  expect('recommendedPackage basico (1 producto, 1 país)', result.recommendedPackage === 'basico')
})

// ──────────────────────────────────────────────────────────────────────
// 7. buildDiagnostic con showCost=true expone cifras
// ──────────────────────────────────────────────────────────────────────
section('buildDiagnostic · showCost=true expone cifras', () => {
  const engineResult = {
    lines: [{
      sectorId: 'ironSteel',
      annualTonnes: 100,
      certificates: 50,
      hasOfficialData: true,
      emissionSource: 'default',
      countryCode: 'CN',
    }],
    totals: { totalTonnes: 100, totalEstimatedCost: 3738 },
    regParams: { year: 2026 },
  }

  const withCost = buildDiagnostic(engineResult, { showCost: true })
  expect('totalCost presente', typeof withCost.totalCost === 'number')
  expect('totalCost = 3738', withCost.totalCost === 3738)
  expect('totalCertificates presente', typeof withCost.totalCertificates === 'number')
  expect('totalCertificates = 50', withCost.totalCertificates === 50)

  const withoutCost = buildDiagnostic(engineResult, { showCost: false })
  expect('totalCost ausente', withoutCost.totalCost === undefined)
  expect('totalCertificates ausente', withoutCost.totalCertificates === undefined)
})

// ──────────────────────────────────────────────────────────────────────
// 8. recommendPackage
// ──────────────────────────────────────────────────────────────────────
section('recommendPackage · distintos alcances', () => {
  expect(
    '1 instalación, 1 producto, 1 país → basico',
    recommendPackage({ totalTonnage: 100, installations: 1, productsCount: 1, countriesCount: 1 }) === 'basico',
  )
  expect(
    '3 instalaciones, 5 productos, 1 país → basico (en el límite)',
    recommendPackage({ totalTonnage: 100, installations: 3, productsCount: 5, countriesCount: 1 }) === 'basico',
  )
  expect(
    '4 instalaciones → completo',
    recommendPackage({ totalTonnage: 100, installations: 4, productsCount: 1, countriesCount: 1 }) === 'completo',
  )
  expect(
    '2 países → completo',
    recommendPackage({ totalTonnage: 100, installations: 1, productsCount: 1, countriesCount: 2 }) === 'completo',
  )
  expect(
    '6 productos → completo',
    recommendPackage({ totalTonnage: 100, installations: 1, productsCount: 6, countriesCount: 1 }) === 'completo',
  )
  expect(
    '501 t → monitorizacion',
    recommendPackage({ totalTonnage: 501, installations: 1, productsCount: 1, countriesCount: 1 }) === 'monitorizacion',
  )
  expect(
    'hasRecurringImports → monitorizacion',
    recommendPackage({ totalTonnage: 100, installations: 1, productsCount: 1, countriesCount: 1, hasRecurringImports: true }) === 'monitorizacion',
  )
  expect(
    '500 t exactos → basico (el umbral es >, no >=)',
    recommendPackage({ totalTonnage: 500, installations: 1, productsCount: 1, countriesCount: 1 }) === 'basico',
  )
})

// ──────────────────────────────────────────────────────────────────────
// 9. buildDiagnostic: mix 40/35/25 usa rangos neutros (acero)
// ──────────────────────────────────────────────────────────────────────
section('buildDiagnostic · mixto 40/35/25 usa rangos acero', () => {
  const result = buildDiagnostic({
    lines: [
      { sectorId: 'ironSteel', annualTonnes: 40, certificates: 20, hasOfficialData: true, emissionSource: 'default', countryCode: 'CN' },
      { sectorId: 'aluminium', annualTonnes: 35, certificates: 200, hasOfficialData: true, emissionSource: 'default', countryCode: 'TR' },
      { sectorId: 'cement', annualTonnes: 25, certificates: 5, hasOfficialData: true, emissionSource: 'default', countryCode: 'MA' },
    ],
    totals: { totalTonnes: 100 },
    regParams: { year: 2026 },
  })

  expect('sectorUsed = ironSteel (neutro)', result.certificatesRange.sectorUsed === 'ironSteel')
  expect('isMixedSector = true', result.certificatesRange.isMixedSector === true)
  // countries únicos = 3 → completo
  expect('3 países → recomienda completo', result.recommendedPackage === 'completo')
})

// ──────────────────────────────────────────────────────────────────────
// 10. buildDiagnostic: potentialSaving según fuente
// ──────────────────────────────────────────────────────────────────────
section('buildDiagnostic · potentialSaving cualitativo', () => {
  const allReal = buildDiagnostic({
    lines: [
      { sectorId: 'ironSteel', annualTonnes: 50, certificates: 20, hasOfficialData: true, emissionSource: 'real', countryCode: 'CN' },
    ],
    totals: { totalTonnes: 50 },
    regParams: { year: 2026 },
  })
  expect('todo real → negligible', allReal.potentialSaving === 'negligible')

  const mixed = buildDiagnostic({
    lines: [
      { sectorId: 'ironSteel', annualTonnes: 50, certificates: 20, hasOfficialData: true, emissionSource: 'real', countryCode: 'CN' },
      { sectorId: 'ironSteel', annualTonnes: 50, certificates: 20, hasOfficialData: true, emissionSource: 'default', countryCode: 'CN' },
    ],
    totals: { totalTonnes: 100 },
    regParams: { year: 2026 },
  })
  expect('mix real+default → moderate', mixed.potentialSaving === 'moderate')
})

// ──────────────────────────────────────────────────────────────────────
// Resumen
// ──────────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════════════')
console.log(`RESUMEN: ${passed} PASS / ${failed} FAIL`)
console.log('═══════════════════════════════════════════════════════════════')
if (failed > 0) {
  for (const f of failures) {
    console.log(` - ${f.label}${f.detail ? ': ' + f.detail : ''}`)
  }
  process.exit(1)
}
process.exit(0)
