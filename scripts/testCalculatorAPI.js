/**
 * Test HTTP del motor puro vía /api/cbam/calculator/calculate
 *
 * Valida que el endpoint nuevo (que invoca calculateProducts refactorizado)
 * produce los mismos costes que el test E2E baseline (testCBAME2E.js).
 *
 * Complementa el E2E directo contra Supabase: cubre el camino real que usa
 * el frontend (HTTP → endpoint → motor puro → payload filtrado free-tier).
 *
 * Uso:
 *   1. Arranca `npm run dev` en otra terminal (localhost:3000).
 *   2. node scripts/testCalculatorAPI.js
 */

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

const CASES = [
  {
    id: 3,
    name: 'Acero China 390 tn defaults',
    body: {
      year: 2026,
      products: [{
        productDescription: 'Acero laminado',
        cnCode: '72101220',
        countryCode: 'CN',
        annualTonnes: 390,
        hasRealEmissions: false,
        productionRoute: '(C)',
      }],
    },
    expectedCostMin: 59200,
    expectedCostMax: 61600,
  },
  {
    id: 4,
    name: 'De minimis 30 tn acero China',
    body: {
      year: 2026,
      products: [{
        productDescription: 'Acero laminado de minimis',
        cnCode: '72101220',
        countryCode: 'CN',
        annualTonnes: 30,
        hasRealEmissions: false,
        productionRoute: '(C)',
      }],
    },
    expectedCostMin: 4000,
    expectedCostMax: 5300,
  },
  {
    id: 6,
    name: 'Urea Rusia 200 tn defaults',
    body: {
      year: 2026,
      products: [{
        productDescription: 'Urea',
        cnCode: '31021019',
        countryCode: 'RU',
        annualTonnes: 200,
        hasRealEmissions: false,
      }],
    },
    expectedCostMin: 5000,
    expectedCostMax: 16000,
  },
  {
    id: 7,
    name: 'Hidrógeno China 50 tn defaults',
    body: {
      year: 2026,
      products: [{
        productDescription: 'Hidrógeno',
        cnCode: '28041000',
        countryCode: 'CN',
        annualTonnes: 50,
        hasRealEmissions: false,
      }],
    },
    // El test E2E reportó coste 90991 € con tonnes=50. Validamos el rango amplio.
    expectedCostMin: 85000,
    expectedCostMax: 95000,
  },
]

const BLOCKED_CASE = {
  id: 'E',
  name: 'Electricidad CN 2716 — debe devolver 400',
  body: {
    year: 2026,
    products: [{
      productDescription: 'Electricidad',
      cnCode: '27160000',
      countryCode: 'MA',
      annualTonnes: 1000,
      hasRealEmissions: false,
    }],
  },
  expectStatus: 400,
  expectCode: 'SECTOR_NOT_SUPPORTED',
}

// ── Free-tier schema guard: estos campos NUNCA deben venir en el payload ──
const PREMIUM_FIELDS_THAT_MUST_NOT_APPEAR = [
  'emissionFactorApplied',
  'emissionFactorRaw',
  'emissionFactorSource',
  'benchmarkApplied',
  'benchmarkColumn',
  'benchmarkRoute',
  'markupApplied',
  'productionRoute',          // la ruta APLICADA por el motor; el input sí lo tiene
  'costWithReal',
  'costWithDefault',
  'savingsPotential',
]

async function runCase(tc) {
  console.log(`\nCaso ${tc.id}: ${tc.name}`)
  try {
    const res = await fetch(`${BASE}/api/cbam/calculator/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tc.body),
    })
    const json = await res.json()

    if (tc.expectStatus) {
      if (res.status !== tc.expectStatus) {
        console.log(`  → FAIL ✗ status ${res.status} (esperado ${tc.expectStatus})`)
        return false
      }
      if (tc.expectCode && json.code !== tc.expectCode) {
        console.log(`  → FAIL ✗ code ${json.code} (esperado ${tc.expectCode})`)
        return false
      }
      console.log(`  → PASS ✓ (bloqueado correctamente: ${tc.expectCode})`)
      return true
    }

    if (!res.ok) {
      console.log(`  → FAIL ✗ HTTP ${res.status}: ${json.error || ''}`)
      return false
    }

    const totalCost = json.data?.totals?.totalCost
    const line = json.data?.lines?.[0]

    console.log(`  Coste obtenido: ${totalCost?.toFixed(2)} €`)
    console.log(`  Coste esperado: ${tc.expectedCostMin} – ${tc.expectedCostMax} €`)

    if (totalCost < tc.expectedCostMin || totalCost > tc.expectedCostMax) {
      console.log(`  → FAIL ✗ fuera de rango`)
      return false
    }

    // Verificar que NINGÚN campo premium aparece en la respuesta
    const serialized = JSON.stringify(json.data)
    const leaked = PREMIUM_FIELDS_THAT_MUST_NOT_APPEAR.filter(f =>
      new RegExp(`"${f}"`).test(serialized)
    )
    if (leaked.length > 0) {
      console.log(`  → FAIL ✗ campos premium filtrados en payload free-tier: ${leaked.join(', ')}`)
      return false
    }

    console.log(`  → PASS ✓ (free-tier payload sin campos premium)`)
    return true
  } catch (err) {
    console.log(`  → FAIL ✗ excepción: ${err.message}`)
    return false
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════════════════')
  console.log('TEST HTTP — /api/cbam/calculator/calculate')
  console.log(`Base URL: ${BASE}`)
  console.log('═══════════════════════════════════════════════════════════════════════════════')

  let passed = 0
  let failed = 0

  for (const tc of CASES) {
    const ok = await runCase(tc)
    if (ok) passed++
    else failed++
  }
  const blockedOk = await runCase(BLOCKED_CASE)
  if (blockedOk) passed++
  else failed++

  console.log('\n═══════════════════════════════════════════════════════════════════════════════')
  console.log(`RESUMEN: ${passed} PASS / ${failed} FAIL (de ${CASES.length + 1})`)
  console.log('═══════════════════════════════════════════════════════════════════════════════')
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
