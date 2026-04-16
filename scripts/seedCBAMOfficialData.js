/**
 * Seed CBAM Official Data V2 → Supabase
 *
 * Carga los JSON generados por convertCBAMOfficialExcel.js:
 *   - cbam_benchmarks_official (570 CN × 1804 valores, Reg. 2025/2620)
 *   - cbam_default_values_official (120 países × 11805 filas, Reg. 2025/2621)
 *
 * Requisitos:
 *   - Ejecutar cbam-official-data-v2-schema.sql ANTES
 *   - Variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso: node scripts/seedCBAMOfficialData.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const SOURCE_VERSION_BM = 'CBAM_Benchmarks_20260206'
const SOURCE_DATE_BM = '2026-02-06'
const SOURCE_VERSION_DV = 'DVs_as_adopted_v20260204'
const SOURCE_DATE_DV = '2026-02-04'

function loadJSON(filename) {
  const path = join(ROOT, 'lib', 'data', filename)
  return JSON.parse(readFileSync(path, 'utf-8'))
}

async function upsertBatch(table, rows, batchSize = 200) {
  let inserted = 0
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const { error } = await supabase.from(table).insert(batch)
    if (error) {
      console.error(`  Error en lote ${i}-${i + batch.length}:`, error.message)
    } else {
      inserted += batch.length
    }
  }
  return inserted
}

async function seedBenchmarks() {
  console.log('\n📊 Cargando cbam_benchmarks_official (v2)...')
  const data = loadJSON('cbam_benchmarks_official_v2.json')

  // Flatten: each benchmark value becomes a row
  const rows = []
  for (const item of data) {
    for (const bv of item.benchmarkValues) {
      rows.push({
        cn_code: item.cnCode,
        sector: item.sector,
        description: item.description,
        column_a_value: bv.columnA,
        column_a_route_indicator: bv.columnARoute,
        column_b_value: bv.columnB,
        column_b_route_indicator: bv.columnBRoute,
        regulation_ref: '(EU) 2025/2620',
        effective_from: '2026-01-01',
        source_version: SOURCE_VERSION_BM,
        source_date: SOURCE_DATE_BM,
      })
    }
  }

  console.log(`  Filas a insertar: ${rows.length}`)
  const inserted = await upsertBatch('cbam_benchmarks_official', rows)
  console.log(`  ✅ ${inserted}/${rows.length} benchmarks insertados`)

  // Verify
  const { count } = await supabase
    .from('cbam_benchmarks_official')
    .select('*', { count: 'exact', head: true })
  console.log(`  Verificación: ${count} filas en tabla`)
}

async function seedDefaultValues() {
  console.log('\n🌍 Cargando cbam_default_values_official...')
  const data = loadJSON('cbam_default_values_official.json')

  const rows = data.map(item => ({
    country_code: item.countryCode,
    country_name: item.countryName,
    cn_code: item.cnCode,
    description: item.description,
    sector: item.sector,
    direct_emissions: item.directEmissions,
    indirect_emissions: item.indirectEmissions,
    total_emissions: item.totalEmissions,
    with_markup_2026: item.withMarkup2026,
    with_markup_2027: item.withMarkup2027,
    with_markup_2028: item.withMarkup2028,
    production_route: item.productionRoute || null,
    regulation_ref: '(EU) 2025/2621',
    source_version: SOURCE_VERSION_DV,
    source_date: SOURCE_DATE_DV,
  }))

  console.log(`  Filas a insertar: ${rows.length}`)
  const inserted = await upsertBatch('cbam_default_values_official', rows, 500)
  console.log(`  ✅ ${inserted}/${rows.length} default values insertados`)

  // Verify
  const { count } = await supabase
    .from('cbam_default_values_official')
    .select('*', { count: 'exact', head: true })
  console.log(`  Verificación: ${count} filas en tabla`)
}

async function main() {
  console.log('🚀 Cargando datos oficiales CBAM v2...')
  console.log(`   Supabase: ${SUPABASE_URL}`)

  await seedBenchmarks()
  await seedDefaultValues()

  console.log('\n✨ Carga completada.')
  console.log('   Siguiente paso: verificar con spot-checks en Supabase Dashboard.')
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
