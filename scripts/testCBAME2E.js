/**
 * Test E2E Motor CBAM — Validación Checkpoint 6
 *
 * Ejecuta los 7 casos del Checkpoint 6 contra los datos oficiales en Supabase
 * usando la misma lógica que el calculator refactorizado (v3).
 *
 * No crea registros en BD — solo lectura via getters + fórmula en memoria.
 *
 * Uso: node scripts/testCBAME2E.js
 * Requiere: .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env') })
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================
// PARÁMETROS REGULATORIOS 2026
// ============================================================
// Réplica standalone (no importa de lib/ para evitar mezclar el resolver de
// supabase del script con el del runtime de Next). MANTENER SINCRONIZADO
// con CBAM_CERTIFICATE_PRICE_FALLBACK en lib/cbamRegulatoryParams.js.
const REG = {
  cbamFactor: 0.975,
  fci: 1.0,
  cbamPrice: 75.36, // €/tCO₂e — Q1 2026 oficial (publicado 2026-04-08)
}

// ============================================================
// GETTERS (réplica de lib/cbamService.js para standalone)
// ============================================================

async function getOfficialBenchmark(cnCode, column = 'B', productionRoute = null) {
  if (!cnCode) return null
  const normalized = cnCode.replace(/\D/g, '').padEnd(8, '0')

  let data = null

  // Exact match
  const { data: exact, error } = await supabase
    .from('cbam_benchmarks_official')
    .select('*')
    .eq('cn_code', normalized)

  if (!error && exact?.length) {
    data = exact
  } else {
    for (const len of [6, 4]) {
      const prefix = normalized.substring(0, len)
      const { data: prefixData } = await supabase
        .from('cbam_benchmarks_official')
        .select('*')
        .like('cn_code', `${prefix}%`)
        .limit(10)

      if (prefixData?.length) {
        data = prefixData
        break
      }
    }
  }

  if (!data?.length) return null

  const colField = column === 'A' ? 'column_a_value' : 'column_b_value'
  const routeField = column === 'A' ? 'column_a_route_indicator' : 'column_b_route_indicator'

  if (productionRoute) {
    const routeNorm = productionRoute.trim().toUpperCase()
    const match = data.find(r => (r[routeField] || '').trim().toUpperCase() === routeNorm)
    if (match) {
      return { value: parseFloat(match[colField]) || 0, route: match[routeField], cnCode: match.cn_code, sector: match.sector }
    }
  }

  const primary = data[0]
  return { value: parseFloat(primary[colField]) || 0, route: primary[routeField], cnCode: primary.cn_code, sector: primary.sector }
}

async function getOfficialDefaultValue(cnCode, countryCode, year = 2026, productionRoute = null) {
  if (!cnCode || !countryCode) return null
  const cnNorm = cnCode.replace(/\D/g, '').padEnd(8, '0')
  const ccNorm = countryCode.toUpperCase()

  const markupField = year <= 2026 ? 'with_markup_2026'
    : year === 2027 ? 'with_markup_2027'
    : 'with_markup_2028'

  async function findByCountry(cc) {
    const { data: exact } = await supabase
      .from('cbam_default_values_official')
      .select('*')
      .eq('country_code', cc)
      .eq('cn_code', cnNorm)

    if (exact?.length) return exact

    for (const len of [6, 4]) {
      const prefix = cnNorm.substring(0, len) + '0'.repeat(8 - len)
      const { data } = await supabase
        .from('cbam_default_values_official')
        .select('*')
        .eq('country_code', cc)
        .eq('cn_code', prefix)

      if (data?.length) return data
    }
    return null
  }

  let data = await findByCountry(ccNorm)
  if (!data && ccNorm !== 'XX') {
    data = await findByCountry('XX')
  }

  if (!data?.length) {
    console.warn(`  [WARN] No official DV for CN ${cnNorm}, country ${ccNorm} (also tried XX)`)
    return null
  }

  let row = data[0]
  if (productionRoute && data.length > 1) {
    const routeNorm = productionRoute.trim().toUpperCase()
    const match = data.find(r => (r.production_route || '').trim().toUpperCase() === routeNorm)
    if (match) row = match
  }

  const withMarkup = parseFloat(row[markupField])
  if (isNaN(withMarkup) || withMarkup === 0) return null

  return {
    totalEmissions: parseFloat(row.total_emissions) || 0,
    directEmissions: parseFloat(row.direct_emissions) || 0,
    indirectEmissions: parseFloat(row.indirect_emissions) || null,
    withMarkup,
    productionRoute: row.production_route || null,
    cnCode: row.cn_code,
    countryCode: row.country_code,
    sector: row.sector,
    description: row.description,
  }
}

// ============================================================
// CALCULATOR MATH (réplica de cbamAdvisoryCalculator.js)
// ============================================================

function calculateLine(tonnes, emissionFactor, benchmark) {
  const incorporatedEmissions = tonnes * emissionFactor
  const effectiveBenchmark = REG.cbamFactor * REG.fci * benchmark
  const agie = tonnes * effectiveBenchmark
  const certificatesPerTonne = Math.max(0, emissionFactor - effectiveBenchmark)
  const certificates = tonnes * certificatesPerTonne
  const cost = certificates * REG.cbamPrice
  return { incorporatedEmissions, effectiveBenchmark, agie, certificates, cost }
}

// ============================================================
// TEST CASES
// ============================================================

const results = []

async function runCase({ id, name, cnCode, country, tonnes, emissionSource, productionRoute, year, expectedCostMin, expectedCostMax, expectedMarkupPct, expectedBM, checkDeMinimis, checkNotZero }) {
  const label = `Caso ${id}: ${name}`
  console.log(`\n${label}`)
  console.log(`  CN: ${cnCode} | País: ${country}${productionRoute ? ` | Ruta: ${productionRoute}` : ''}`)

  try {
    // Get data from Supabase
    const column = emissionSource === 'real' ? 'A' : 'B'
    const bmResult = await getOfficialBenchmark(cnCode, column, productionRoute)
    const dvResult = await getOfficialDefaultValue(cnCode, country, year || 2026, productionRoute)

    if (!bmResult) {
      console.log(`  [DIAG] getOfficialBenchmark returned null`)
    }
    if (!dvResult) {
      console.log(`  [DIAG] getOfficialDefaultValue returned null`)
    }

    const benchmark = bmResult?.value || 0
    const emissionFactor = dvResult?.withMarkup || 0
    const emissionFactorRaw = dvResult?.totalEmissions || 0

    const markupPct = emissionFactorRaw > 0
      ? Math.round((emissionFactor / emissionFactorRaw - 1) * 10000) / 100
      : 0

    const calc = calculateLine(tonnes, emissionFactor, benchmark)

    console.log(`  FE aplicado: ${emissionFactor.toFixed(4)} tCO₂e/t | FE raw: ${emissionFactorRaw.toFixed(4)} | Markup: ${markupPct.toFixed(1)}%`)
    console.log(`  BM usado: ${benchmark.toFixed(3)} | Col: ${column} | Ruta BM: ${bmResult?.route || '—'}`)
    console.log(`  BM efectivo: ${calc.effectiveBenchmark.toFixed(4)}`)
    console.log(`  Emisiones: ${calc.incorporatedEmissions.toFixed(2)} | AGIE: ${calc.agie.toFixed(2)} | Certs: ${calc.certificates.toFixed(2)}`)
    console.log(`  Coste obtenido: ${calc.cost.toFixed(2)} €`)

    // Evaluate
    let passed = true
    let reason = ''

    if (expectedCostMin != null && expectedCostMax != null) {
      console.log(`  Coste esperado: ${expectedCostMin.toLocaleString('es-ES')} – ${expectedCostMax.toLocaleString('es-ES')} €`)
      if (calc.cost < expectedCostMin || calc.cost > expectedCostMax) {
        passed = false
        reason = `Coste ${calc.cost.toFixed(2)} fuera de rango [${expectedCostMin}, ${expectedCostMax}]`
      }
    }

    if (checkNotZero && calc.cost === 0) {
      passed = false
      reason = 'Coste = 0 € (fallo total)'
    }

    if (expectedMarkupPct != null) {
      const markupDiff = Math.abs(markupPct - expectedMarkupPct)
      console.log(`  Markup esperado: ${expectedMarkupPct}% | Obtenido: ${markupPct.toFixed(1)}%`)
      if (markupDiff > 1.5) {
        passed = false
        reason = `Markup ${markupPct.toFixed(1)}% difiere del esperado ${expectedMarkupPct}%`
      }
    }

    if (expectedBM != null) {
      console.log(`  BM esperado: ${expectedBM} | Obtenido: ${benchmark.toFixed(3)}`)
      if (Math.abs(benchmark - expectedBM) > 0.01) {
        passed = false
        reason = `BM ${benchmark.toFixed(3)} difiere del esperado ${expectedBM}`
      }
    }

    if (checkDeMinimis !== undefined) {
      const deMinis = tonnes < 50
      console.log(`  De minimis flag: ${deMinis} (esperado: ${checkDeMinimis})`)
      if (deMinis !== checkDeMinimis) {
        passed = false
        reason = `De minimis flag incorrecto`
      }
    }

    if (expectedCostMin != null && expectedCostMax != null && passed) {
      const mid = (expectedCostMin + expectedCostMax) / 2
      const deviation = ((calc.cost - mid) / mid * 100).toFixed(2)
      console.log(`  Desviación del centro: ${deviation}%`)
    }

    console.log(`  → ${passed ? 'PASS ✓' : `FAIL ✗ — ${reason}`}`)
    results.push({ id, name, passed, reason, cost: calc.cost })

  } catch (err) {
    console.log(`  → FAIL ✗ — Excepción: ${err.message}`)
    console.log(`  Stack: ${err.stack}`)
    results.push({ id, name, passed: false, reason: `Exception: ${err.message}`, cost: null })
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════════════════')
  console.log('TEST E2E MOTOR CBAM — Checkpoint 6')
  console.log(`Supabase: ${supabaseUrl}`)
  console.log(`F_CBAM: ${REG.cbamFactor} | FCI: ${REG.fci} | Precio: ${REG.cbamPrice} €/tCO₂e`)
  console.log('═══════════════════════════════════════════════════════════════════════════════')

  // Caso 1 & 2 — Noatum (SKIP: no hay datos de producto en el repo)
  console.log('\nCaso 1: Noatum defaults → SKIP (sin datos de producto en repo)')
  console.log('Caso 2: Noatum reales → SKIP (sin datos de producto en repo)')
  results.push({ id: 1, name: 'Noatum defaults', passed: null, reason: 'SKIP', cost: null })
  results.push({ id: 2, name: 'Noatum reales', passed: null, reason: 'SKIP', cost: null })

  // Caso 3 — Acero China (CRÍTICO)
  await runCase({
    id: 3,
    name: 'Acero China 390 tn defaults',
    cnCode: '72101220',
    country: 'CN',
    tonnes: 390,
    emissionSource: 'default',
    productionRoute: '(C)',
    year: 2026,
    expectedCostMin: 59200,
    expectedCostMax: 61600,
    expectedBM: 1.491,
  })

  // Caso 4 — De minimis
  await runCase({
    id: 4,
    name: 'De minimis 30 tn acero China',
    cnCode: '72101220',
    country: 'CN',
    tonnes: 30,
    emissionSource: 'default',
    productionRoute: '(C)',
    year: 2026,
    expectedCostMin: 4000,
    expectedCostMax: 5300,
    checkDeMinimis: true,
  })

  // Caso 5 — Electricidad Marruecos (CRÍTICO)
  await runCase({
    id: 5,
    name: 'Electricidad Marruecos 1000 MWh defaults',
    cnCode: '27160000',
    country: 'MA',
    tonnes: 1000,
    emissionSource: 'default',
    year: 2026,
    expectedCostMin: 40000,
    expectedCostMax: 75000,
    checkNotZero: true,
  })

  // Caso 6 — Fertilizantes Rusia (validación markup 1%)
  await runCase({
    id: 6,
    name: 'Urea Rusia 200 tn defaults (markup 1%)',
    cnCode: '31021019',
    country: 'RU',
    tonnes: 200,
    emissionSource: 'default',
    year: 2026,
    expectedCostMin: 5000,
    expectedCostMax: 16000,
    expectedMarkupPct: 1,
    expectedBM: 0.902,
  })

  // Caso 7 — Hidrógeno China
  await runCase({
    id: 7,
    name: 'Hidrógeno China 50 tn defaults',
    cnCode: '28041000',
    country: 'CN',
    tonnes: 50,
    emissionSource: 'default',
    year: 2026,
    expectedBM: 5.089,
    expectedMarkupPct: 10,
    checkNotZero: true,
  })

  // ============================================================
  // RESUMEN
  // ============================================================
  console.log('\n═══════════════════════════════════════════════════════════════════════════════')
  const passed = results.filter(r => r.passed === true).length
  const failed = results.filter(r => r.passed === false).length
  const skipped = results.filter(r => r.passed === null).length
  console.log(`RESUMEN: ${passed} PASS / ${failed} FAIL / ${skipped} SKIP`)
  console.log('═══════════════════════════════════════════════════════════════════════════════')

  if (failed > 0) {
    console.log('\nFAILs:')
    results.filter(r => r.passed === false).forEach(r => {
      console.log(`  Caso ${r.id} (${r.name}): ${r.reason}`)
    })
  }

  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
