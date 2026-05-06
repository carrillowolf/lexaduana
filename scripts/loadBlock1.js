/**
 * BLOQUE 1 — Carga de tablas nuevas + datos maestros
 * LexAduana v5.1 — Marzo 2026
 *
 * REQUISITO: Ejecutar bloque1-schema.sql en Supabase SQL Editor ANTES de este script
 *
 * Carga:
 *   1. geographical_areas_composition  (2.621 filas)
 *   2. geographical_areas              (~311 filas EN)
 *   3. descriptions_new                (25.691 filas)
 *   4. measure_types_new               (78 tipos)
 *   5. declarable_codes                (25.697 filas)
 *
 * Uso:
 *   node scripts/loadBlock1.js [--dry-run] [--only=geo|desc|types|declarable] [--excel-path=/ruta]
 */

import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ── Config ──────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '..', '.env.local')
dotenv.config({ path: envPath })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Args
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const ONLY = args.find(a => a.startsWith('--only='))?.split('=')[1] || null
const EXCEL_PATH = args.find(a => a.startsWith('--excel-path='))?.split('=')[1]
  || path.resolve(__dirname, '..', 'data', 'nuevo-mes')

const BATCH_SIZE = 500 // Supabase recomienda 500 para inserts masivos

// ── Utilidades ──────────────────────────────────────────────

function readExcel(filename) {
  const filepath = path.join(EXCEL_PATH, filename)
  if (!fs.existsSync(filepath)) {
    console.error(`❌ No se encuentra: ${filepath}`)
    process.exit(1)
  }
  const buffer = fs.readFileSync(filepath)
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet)
}

function parseDate(val) {
  if (!val) return null
  // Si ya es Date (Timestamp de xlsx)
  if (val instanceof Date) return val.toISOString().split('T')[0]
  // Si es string DD-MM-YYYY
  const str = String(val).trim()
  const match = str.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  // Si es string YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10)
  return null
}

function clean(val) {
  if (val === undefined || val === null) return null
  if (typeof val === 'number' && isNaN(val)) return null
  return String(val).trim() || null
}

async function batchInsert(table, rows, label) {
  if (DRY_RUN) {
    console.log(`  🧪 DRY RUN: ${rows.length} filas para ${table}`)
    console.log(`     Sample:`, JSON.stringify(rows[0], null, 2))
    return rows.length
  }

  let inserted = 0
  const total = rows.length

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from(table).insert(batch)

    if (error) {
      console.error(`  ❌ Error en lote ${Math.floor(i / BATCH_SIZE) + 1} de ${table}:`, error.message)
      // Intentar fila por fila para identificar el problema
      if (batch.length <= 10) {
        for (const row of batch) {
          const { error: rowErr } = await supabase.from(table).insert(row)
          if (rowErr) console.error(`     Fila problemática:`, row, rowErr.message)
          else inserted++
        }
      }
    } else {
      inserted += batch.length
    }

    // Progress cada 10 lotes
    if ((i / BATCH_SIZE) % 10 === 0 || i + BATCH_SIZE >= total) {
      const pct = Math.round((Math.min(i + BATCH_SIZE, total) / total) * 100)
      process.stdout.write(`\r  📊 ${label}: ${inserted}/${total} (${pct}%)`)
    }
  }

  console.log(`\n  ✅ ${label}: ${inserted} filas insertadas`)
  return inserted
}

async function truncateTable(table) {
  if (DRY_RUN) {
    console.log(`  🧪 DRY RUN: truncaría ${table}`)
    return
  }
  const { error } = await supabase.from(table).delete().neq('id', -1) // Delete all
  if (error) {
    console.error(`  ⚠️ Error limpiando ${table}:`, error.message)
    // Intentar con RPC si delete falla
    const { error: rpcErr } = await supabase.rpc('truncate_table', { table_name: table })
    if (rpcErr) console.error(`  ⚠️ RPC truncate también falló:`, rpcErr.message)
  }
}

// ── 1. Geographical Areas Composition ───────────────────────

async function loadGeoComposition() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('1️⃣  GEOGRAPHICAL AREAS COMPOSITION')
  console.log('═══════════════════════════════════════════════')

  const raw = readExcel('Geographical areas composition.xlsx')
  console.log(`  📂 Leídas ${raw.length} filas del Excel`)

  const rows = raw.map(r => ({
    country_group: clean(r['Country group']),
    group_abbrev: clean(r['Abbrev.']),
    group_description: clean(r['Country group descr.']),
    member_country: clean(r['Member country']),
    member_abbrev: clean(r['Abbrev._1']),
    member_description: clean(r['Description']),
    membership_start_date: parseDate(r['Mbship start date']),
    membership_end_date: parseDate(r['Mbship end date']),
    group_start_date: parseDate(r['Start date']),
    group_end_date: parseDate(r['End date'])
  })).filter(r => r.country_group && r.member_country)

  console.log(`  🔧 Procesadas ${rows.length} filas válidas`)
  console.log(`     Grupos únicos: ${new Set(rows.map(r => r.country_group)).size}`)
  console.log(`     Países miembros únicos: ${new Set(rows.map(r => r.member_country)).size}`)

  await truncateTable('geographical_areas_composition')
  return await batchInsert('geographical_areas_composition', rows, 'Geo Composition')
}

// ── 2. Geographical Areas (descripciones) ───────────────────

async function loadGeoAreas() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('2️⃣  GEOGRAPHICAL AREAS (descriptions)')
  console.log('═══════════════════════════════════════════════')

  const raw = readExcel('Geographical areas description.xlsx')
  console.log(`  📂 Leídas ${raw.length} filas del Excel`)

  // Filtrar solo EN
  const enRows = raw.filter(r => r['Language'] === 'EN')
  console.log(`  🔧 Filtradas ${enRows.length} filas EN`)

  const rows = enRows.map(r => {
    const code = clean(r['Or./Dest.'])
    return {
      area_code: code,
      abbrev: clean(r['Abbrev.']),
      description: clean(r['Description']) || code,
      start_date: parseDate(r['Start date']),
      description_start_date: parseDate(r['Descr. start date']),
      end_date: parseDate(r['End date']),
      // Es país ISO si el código tiene 2 letras
      is_country: code && /^[A-Z]{2}$/.test(code)
    }
  }).filter(r => r.area_code)

  console.log(`  📊 ${rows.filter(r => r.is_country).length} países, ${rows.filter(r => !r.is_country).length} grupos`)

  await truncateTable('geographical_areas')
  return await batchInsert('geographical_areas', rows, 'Geo Areas')
}

// ── 3. Descriptions (nomenclatura completa) ─────────────────

async function loadDescriptions() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('3️⃣  DESCRIPTIONS (Nomenclature EN)')
  console.log('═══════════════════════════════════════════════')

  const raw = readExcel('Nomenclature EN.xlsx')
  console.log(`  📂 Leídas ${raw.length} filas del Excel`)

  const rows = raw.map(r => {
    const fullCode = clean(r['Goods code'])    // "0101210000 80"
    const code10 = fullCode ? fullCode.substring(0, 10).replace(/\s/g, '') : null

    return {
      goods_code: code10,
      goods_code_full: fullCode,
      description: clean(r['Description']),
      hier_pos: r['Hier. Pos.'] != null ? parseInt(r['Hier. Pos.']) : null,
      indent: clean(r['Indent']),
      start_date: parseDate(r['Start date']),
      end_date: parseDate(r['End date']),
      description_start_date: parseDate(r['Descr. start date'])
    }
  }).filter(r => r.goods_code && r.description)

  console.log(`  🔧 Procesadas ${rows.length} filas válidas`)

  // Stats por nivel jerárquico
  const byHier = {}
  rows.forEach(r => {
    byHier[r.hier_pos] = (byHier[r.hier_pos] || 0) + 1
  })
  console.log(`  📊 Distribución por jerarquía:`)
  Object.entries(byHier).sort(([a], [b]) => a - b).forEach(([hier, count]) => {
    const label = { 2: 'Capítulos', 4: 'Partidas', 6: 'Subpartidas', 8: 'Sub-sub', 10: 'Líneas' }[hier] || hier
    console.log(`     Hier ${hier} (${label}): ${count}`)
  })

  await truncateTable('descriptions_new')
  return await batchInsert('descriptions_new', rows, 'Descriptions')
}

// ── 4. Measure Types (78 tipos completos) ───────────────────

async function loadMeasureTypes() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('4️⃣  MEASURE TYPES (78 tipos)')
  console.log('═══════════════════════════════════════════════')

  const raw = readExcel('Duties Import 01-99.xlsx')
  console.log(`  📂 Leídas ${raw.length} filas del Excel de Import`)

  // Extraer tipos únicos con conteo
  const typeMap = new Map()
  raw.forEach(r => {
    const code = parseInt(r['Meas. type code'])
    const name = clean(r['Measure type'])
    if (!isNaN(code) && name) {
      if (!typeMap.has(code)) {
        typeMap.set(code, { name, count: 0 })
      }
      typeMap.get(code).count++
    }
  })

  console.log(`  🔧 Encontrados ${typeMap.size} tipos de medida únicos`)

  // Categorización automática por código
  function categorize(code) {
    if ([103, 105, 106].includes(code)) return 'duty'
    if ([142, 143, 145, 146, 147].includes(code)) return 'preference'
    if ([122, 123].includes(code)) return 'quota'
    if ([112, 115, 117, 119].includes(code)) return 'suspension'
    if ([141].includes(code)) return 'preferential_suspension'
    if ([551, 552, 553, 554, 555, 561, 564, 565, 566, 570].includes(code)) return 'antidumping'
    if ([695, 696].includes(code)) return 'safeguard'
    if ([109, 110].includes(code)) return 'supplementary'
    if ([277, 705].includes(code)) return 'prohibition'
    if ([775].includes(code)) return 'cbam'
    if ([490, 488, 489, 651, 652, 653, 654].includes(code)) return 'price_control'
    if ([464, 481, 482, 483, 484, 495, 496].includes(code)) return 'declaration'
    if (code >= 410 && code <= 478) return 'control'
    if (code >= 700 && code <= 770) return 'control'
    return 'other'
  }

  function affectsDuty(code) {
    return [103, 105, 106, 112, 115, 117, 119, 122, 123, 141, 142, 143, 145, 146, 147,
            551, 552, 553, 554, 555, 695, 696, 651, 652, 653, 654].includes(code)
  }

  function getIcon(category) {
    const icons = {
      duty: '💰', preference: '🤝', quota: '📊', suspension: '⏸️',
      preferential_suspension: '⏸️', antidumping: '🛡️', safeguard: '⚠️',
      supplementary: '📐', prohibition: '🚫', cbam: '🌍', price_control: '💲',
      declaration: '📋', control: '🔍', other: 'ℹ️'
    }
    return icons[category] || 'ℹ️'
  }

  function getPriority(category) {
    const priorities = {
      duty: 1, preference: 2, quota: 3, suspension: 4,
      preferential_suspension: 5, antidumping: 6, safeguard: 7,
      cbam: 8, prohibition: 9, control: 10, price_control: 11,
      supplementary: 12, declaration: 13, other: 99
    }
    return priorities[category] || 99
  }

  const rows = Array.from(typeMap.entries()).map(([code, { name, count }]) => {
    const cat = categorize(code)
    return {
      type_code: code,
      type_name: name,
      type_name_es: null, // Se completará manualmente después
      category: cat,
      affects_duty: affectsDuty(code),
      icon: getIcon(cat),
      priority: getPriority(cat),
      measure_count: count,
      is_import: true
    }
  })

  // Ordenar por code
  rows.sort((a, b) => a.type_code - b.type_code)

  console.log(`  📊 Categorías:`)
  const byCat = {}
  rows.forEach(r => { byCat[r.category] = (byCat[r.category] || 0) + 1 })
  Object.entries(byCat).sort(([, a], [, b]) => b - a).forEach(([cat, count]) => {
    console.log(`     ${cat}: ${count} tipos`)
  })

  await truncateTable('measure_types_new')
  return await batchInsert('measure_types_new', rows, 'Measure Types')
}

// ── 5. Declarable Codes ─────────────────────────────────────

async function loadDeclarableCodes() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('5️⃣  DECLARABLE CODES')
  console.log('═══════════════════════════════════════════════')

  const raw = readExcel('Declarable codes.xlsx')
  console.log(`  📂 Leídas ${raw.length} filas del Excel`)

  const rows = raw.map(r => {
    const fullCode = clean(r['Goods code'])
    const code10 = fullCode ? fullCode.substring(0, 10).replace(/\s/g, '') : null

    return {
      goods_code: code10,
      goods_code_full: fullCode,
      is_leaf: parseInt(r['IS_LEAF']) === 1,
      start_date: parseDate(r['Start date']),
      declaration_start_date: parseDate(r['Decl. start date']),
      end_date: parseDate(r['End date'])
    }
  }).filter(r => r.goods_code)

  const leafCount = rows.filter(r => r.is_leaf).length
  console.log(`  🔧 Procesadas ${rows.length} filas (${leafCount} declarables / ${rows.length - leafCount} no-hoja)`)

  await truncateTable('declarable_codes')
  return await batchInsert('declarable_codes', rows, 'Declarable Codes')
}

// ── MAIN ────────────────────────────────────────────────────

async function main() {
  console.log('╔═══════════════════════════════════════════════╗')
  console.log('║  BLOQUE 1 — Tablas nuevas + datos maestros    ║')
  console.log('║  LexAduana v5.1 — Marzo 2026                  ║')
  console.log('╚═══════════════════════════════════════════════╝')
  console.log('')
  console.log(`📂 Excel path: ${EXCEL_PATH}`)
  console.log(`🔑 Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}`)
  console.log(`🔑 Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌'}`)
  if (DRY_RUN) console.log('🧪 MODO DRY RUN — no se escribirá en Supabase')
  if (ONLY) console.log(`🎯 Solo ejecutando: ${ONLY}`)
  console.log('')

  // Verificar que existen los Excel
  const requiredFiles = [
    'Geographical areas composition.xlsx',
    'Geographical areas description.xlsx',
    'Nomenclature EN.xlsx',
    'Duties Import 01-99.xlsx',
    'Declarable codes.xlsx'
  ]

  for (const f of requiredFiles) {
    const fp = path.join(EXCEL_PATH, f)
    if (!fs.existsSync(fp)) {
      console.error(`❌ Falta archivo: ${fp}`)
      process.exit(1)
    }
  }
  console.log('✅ Todos los archivos Excel encontrados\n')

  const results = {}
  const start = Date.now()

  try {
    if (!ONLY || ONLY === 'geo') {
      results.geoComposition = await loadGeoComposition()
      results.geoAreas = await loadGeoAreas()
    }

    if (!ONLY || ONLY === 'desc') {
      results.descriptions = await loadDescriptions()
    }

    if (!ONLY || ONLY === 'types') {
      results.measureTypes = await loadMeasureTypes()
    }

    if (!ONLY || ONLY === 'declarable') {
      results.declarableCodes = await loadDeclarableCodes()
    }

  } catch (error) {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)

  console.log('\n╔═══════════════════════════════════════════════╗')
  console.log('║  RESUMEN BLOQUE 1                              ║')
  console.log('╠═══════════════════════════════════════════════╣')
  Object.entries(results).forEach(([key, count]) => {
    console.log(`║  ${key.padEnd(20)} ${String(count).padStart(8)} filas  ║`)
  })
  console.log(`╠═══════════════════════════════════════════════╣`)
  console.log(`║  ⏱️  Tiempo: ${elapsed}s${' '.repeat(30 - elapsed.length)}║`)
  console.log('╚═══════════════════════════════════════════════╝')

  console.log('\n📋 PRÓXIMOS PASOS:')
  console.log('   1. Verificar conteos en Supabase (query en bloque1-schema.sql)')
  console.log('   2. Si OK, renombrar tablas:')
  console.log('      ALTER TABLE descriptions RENAME TO descriptions_old;')
  console.log('      ALTER TABLE descriptions_new RENAME TO descriptions;')
  console.log('      ALTER TABLE measure_types RENAME TO measure_types_old;')
  console.log('      ALTER TABLE measure_types_new RENAME TO measure_types;')
  console.log('   3. Ejecutar Bloque 2 (recarga de datos core)')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
