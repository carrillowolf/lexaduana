/**
 * Seed CBAM Assessment Data → Supabase
 *
 * Carga los 3 JSON oficiales en las tablas:
 * - cbam_cn_codes_full (573 registros)
 * - cbam_benchmarks_official (661 filas — múltiples por CN code)
 * - cbam_countries (246 registros)
 *
 * Requisitos:
 *   - Ejecutar cbam-assessment-schema.sql ANTES
 *   - Variables de entorno: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso: node scripts/seedCBAMAssessmentData.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function loadJSON(filename) {
  const path = join(__dirname, '..', 'lib', 'data', filename)
  return JSON.parse(readFileSync(path, 'utf-8'))
}

async function seedCNCodesFull() {
  console.log('\n📋 Cargando cbam_cn_codes_full...')
  const data = loadJSON('cbam_cn_codes_full.json')

  const rows = data.map(item => ({
    cn_code: item.cnCode,
    main_category: item.mainCategory,
    aggregated_category: item.aggregatedCategory,
    description: item.description,
    cbam_applies: item.cbamApplies,
    indirect_emissions: item.indirectEmissions,
    quantity_unit: item.quantity,
    installation_data: item.installationData,
    special_provisions: item.specialProvisions,
    production_routes: item.productionRoutes,
    production_routes_detail: item.productionRoutesDetail,
    precursors: item.precursors,
    extra_data_required: item.extraDataRequired,
    indirect_emissions_data: item.indirectEmissionsData,
    data_quality: item.dataQuality,
    carbon_price_abroad: item.carbonPriceAbroad,
  }))

  // Insertar en lotes de 100
  let inserted = 0
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100)
    const { error } = await supabase
      .from('cbam_cn_codes_full')
      .upsert(batch, { onConflict: 'cn_code' })

    if (error) {
      console.error(`  Error en lote ${i}-${i + batch.length}:`, error.message)
    } else {
      inserted += batch.length
    }
  }
  console.log(`  ✅ ${inserted}/${rows.length} CN codes insertados`)
}

async function seedBenchmarks() {
  console.log('\n📊 Cargando cbam_benchmarks_official...')
  const data = loadJSON('cbam_benchmarks.json')

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
      })
    }
  }

  let inserted = 0
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100)
    const { error } = await supabase
      .from('cbam_benchmarks_official')
      .insert(batch)

    if (error) {
      console.error(`  Error en lote ${i}-${i + batch.length}:`, error.message)
    } else {
      inserted += batch.length
    }
  }
  console.log(`  ✅ ${inserted}/${rows.length} benchmarks insertados`)
}

async function seedCountries() {
  console.log('\n🌍 Cargando cbam_countries...')
  const data = loadJSON('cbam_countries.json')

  const rows = data.map(item => ({
    country_code: item.code,
    country_name: item.name,
    cbam_applies: item.cbamApplies,
    is_eu_member: item.isEUMember,
  }))

  let inserted = 0
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100)
    const { error } = await supabase
      .from('cbam_countries')
      .upsert(batch, { onConflict: 'country_code' })

    if (error) {
      console.error(`  Error en lote ${i}-${i + batch.length}:`, error.message)
    } else {
      inserted += batch.length
    }
  }
  console.log(`  ✅ ${inserted}/${rows.length} países insertados`)
}

async function main() {
  console.log('🚀 CBAM Assessment Data Seed')
  console.log('============================')

  await seedCNCodesFull()
  await seedBenchmarks()
  await seedCountries()

  console.log('\n✅ Seed completado')
}

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
