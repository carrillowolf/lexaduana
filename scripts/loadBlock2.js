/**
 * BLOQUE 2 — Recarga de datos core (Marzo 2026)
 * LexAduana v5.1
 *
 * REQUISITO: Ejecutar bloque2-schema.sql en Supabase SQL Editor ANTES de este script
 *
 * Recarga:
 *   1. taric_measures        (136.009 filas — solo Import)
 *   2. measure_conditions    (29.229 filas)
 *   3. measure_exclusions    (~28.975 filas — solo Import, sin export)
 *   4. measure_footnotes     (121.938 filas — nunca se había cargado)
 *
 * Uso:
 *   node scripts/loadBlock2.js [--dry-run] [--only=measures|conditions|exclusions|footnotes] [--excel-path=/ruta]
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

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const ONLY = args.find(a => a.startsWith('--only='))?.split('=')[1] || null
const EXCEL_PATH = args.find(a => a.startsWith('--excel-path='))?.split('=')[1]
  || path.resolve(__dirname, '..', 'data', 'nuevo-mes')

const BATCH_SIZE = 500

// ── Utilidades ──────────────────────────────────────────────

function readExcel(filename) {
  const filepath = path.join(EXCEL_PATH, filename)
  if (!fs.existsSync(filepath)) {
    console.error(`❌ No se encuentra: ${filepath}`)
    process.exit(1)
  }
  const buffer = fs.readFileSync(filepath)
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet)
}

function parseDate(val) {
  if (!val) return null
  // Con cellDates: true, XLSX devuelve objetos Date nativos
  if (val instanceof Date) {
    const y = val.getFullYear()
    const m = String(val.getMonth() + 1).padStart(2, '0')
    const d = String(val.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  // Número serial de Excel (fallback sin cellDates)
  if (typeof val === 'number' && val > 10000 && val < 100000) {
    const date = new Date((val - 25569) * 86400 * 1000)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const str = String(val).trim()
  const match = str.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10)
  return null
}

function clean(val) {
  if (val === undefined || val === null) return null
  if (typeof val === 'number' && isNaN(val)) return null
  return String(val).trim() || null
}

function padGoodsCode(val) {
  if (!val) return null
  return String(val).replace(/\s/g, '').padStart(10, '0').substring(0, 10)
}

/**
 * Parsea el duty_expression para extraer duty_percentage y duty_specific.
 * Patrones del Excel:
 *   "10.200 %"                → percentage=10.2, specific=null
 *   "93.100 EUR DTN"          → percentage=null, specific="93.100 EUR DTN"
 *   "10.200 % + 93.100 EUR"   → percentage=10.2, specific="93.100 EUR..."
 *   "Cond: ..."               → percentage=null, specific=null (conditional)
 *   "NAR"                     → percentage=null, specific=null (supplementary unit)
 */
function parseDuty(expression) {
  if (!expression) return { percentage: null, specific: null, isConditional: false }

  const expr = expression.trim()

  // Conditional
  if (expr.startsWith('Cond:')) {
    return { percentage: null, specific: null, isConditional: true }
  }

  // Pure percentage: "10.200 %"
  const pctMatch = expr.match(/^([\d.]+)\s*%\s*$/)
  if (pctMatch) {
    return { percentage: parseFloat(pctMatch[1]), specific: null, isConditional: false }
  }

  // Percentage + specific: "10.200 % + 93.100 EUR DTN"
  const compoundMatch = expr.match(/^([\d.]+)\s*%\s*\+\s*(.+)$/)
  if (compoundMatch) {
    return {
      percentage: parseFloat(compoundMatch[1]),
      specific: compoundMatch[2].trim(),
      isConditional: false
    }
  }

  // Specific only: "93.100 EUR DTN"
  const eurMatch = expr.match(/^[\d.]+\s*EUR/)
  if (eurMatch) {
    return { percentage: null, specific: expr, isConditional: false }
  }

  // MIN/MAX compounds
  if (/MIN|MAX/.test(expr)) {
    const pctInCompound = expr.match(/([\d.]+)\s*%/)
    return {
      percentage: pctInCompound ? parseFloat(pctInCompound[1]) : null,
      specific: expr,
      isConditional: false
    }
  }

  // Supplementary unit (NAR, etc.)
  return { percentage: null, specific: null, isConditional: false }
}

async function batchInsert(table, rows, label) {
  if (DRY_RUN) {
    console.log(`  🧪 DRY RUN: ${rows.length} filas para ${table}`)
    if (rows.length > 0) console.log(`     Sample:`, JSON.stringify(rows[0], null, 2))
    return rows.length
  }

  let inserted = 0
  const total = rows.length

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from(table).insert(batch)

    if (error) {
      console.error(`\n  ❌ Error en lote ${Math.floor(i / BATCH_SIZE) + 1} de ${table}:`, error.message)
      // Retry con sublotes más pequeños
      const subSize = 50
      for (let j = 0; j < batch.length; j += subSize) {
        const sub = batch.slice(j, j + subSize)
        const { error: subErr } = await supabase.from(table).insert(sub)
        if (subErr) {
          console.error(`     Sub-lote ${j / subSize + 1} falló:`, subErr.message)
        } else {
          inserted += sub.length
        }
      }
    } else {
      inserted += batch.length
    }

    // Progress
    if ((i / BATCH_SIZE) % 20 === 0 || i + BATCH_SIZE >= total) {
      const pct = Math.round((Math.min(i + BATCH_SIZE, total) / total) * 100)
      process.stdout.write(`\r  📊 ${label}: ${inserted}/${total} (${pct}%)`)
    }
  }

  console.log(`\n  ✅ ${label}: ${inserted} filas insertadas`)
  return inserted
}

async function deleteAll(table) {
  if (DRY_RUN) {
    console.log(`  🧪 DRY RUN: borraría todo de ${table}`)
    return
  }

  console.log(`  🗑️  Borrando datos actuales de ${table}...`)

  // Para tablas grandes, borrar en batches por id
  let deleted = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .limit(5000)

    if (error) {
      console.error(`  ❌ Error leyendo ids de ${table}:`, error.message)
      break
    }

    if (!data || data.length === 0) {
      hasMore = false
      break
    }

    const ids = data.map(r => r.id)
    const { error: delErr } = await supabase
      .from(table)
      .delete()
      .in('id', ids)

    if (delErr) {
      console.error(`  ❌ Error borrando de ${table}:`, delErr.message)
      break
    }

    deleted += ids.length
    process.stdout.write(`\r  🗑️  Borradas ${deleted} filas de ${table}...`)
  }

  console.log(`\n  ✅ ${table} limpia (${deleted} filas eliminadas)`)
}

// ── 1. TARIC MEASURES ───────────────────────────────────────

async function loadMeasures() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('1️⃣  TARIC MEASURES (Import)')
  console.log('═══════════════════════════════════════════════')

  const raw = readExcel('Duties Import 01-99.xlsx')
  console.log(`  📂 Leídas ${raw.length} filas del Excel`)

  const rows = raw.map(r => {
    const duty = parseDuty(clean(r['Duty']))
    return {
      goods_code: padGoodsCode(r['Goods code']),
      add_code: clean(r['Add code']),
      order_no: clean(r['Order No.']),
      start_date: parseDate(r['Start date']),
      end_date: parseDate(r['End date']),
      red_ind: clean(r['RED_IND']),
      origin_code: clean(r['Origin code']),
      origin_name: clean(r['Origin']),
      measure_type_code: parseInt(r['Meas. type code']) || null,
      measure_type_name: clean(r['Measure type']),
      legal_base: clean(r['Legal base']),
      duty_expression: clean(r['Duty']),
      duty_percentage: duty.percentage,
      duty_specific: duty.specific,
      is_conditional: duty.isConditional
    }
  }).filter(r => r.goods_code && r.measure_type_code)

  console.log(`  🔧 Procesadas ${rows.length} filas válidas`)

  // Stats
  const conditional = rows.filter(r => r.is_conditional).length
  const withPct = rows.filter(r => r.duty_percentage != null).length
  const withSpecific = rows.filter(r => r.duty_specific != null).length
  console.log(`  📊 Desglose duty: ${withPct} con %, ${withSpecific} con específico, ${conditional} condicionales`)

  await deleteAll('taric_measures')
  return await batchInsert('taric_measures', rows, 'Taric Measures')
}

// ── 2. MEASURE CONDITIONS ───────────────────────────────────

async function loadConditions() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('2️⃣  MEASURE CONDITIONS')
  console.log('═══════════════════════════════════════════════')

  const raw = readExcel('Measure conditions.xlsx')
  console.log(`  📂 Leídas ${raw.length} filas del Excel`)

  const rows = raw.map(r => {
    return {
      goods_code: padGoodsCode(r['Goods code']),
      add_code: clean(r['Add code']),
      order_no: clean(r['Order No.']),
      start_date: parseDate(r['Start date']),
      end_date: parseDate(r['End date']),
      origin_code: clean(r['Origin code']),
      measure_type_code: parseInt(r['Meas. type code']) || null,
      condition_code: clean(r['Meas. cond']),
      condition_sequence: r['Sequence'] != null ? parseInt(r['Sequence']) : null,
      certificate_code: clean(r['Certificate']),
      condition_amount: r['Cond. amount'] != null && !isNaN(r['Cond. amount'])
        ? parseFloat(r['Cond. amount']) : null,
      monetary_unit: clean(r['Mon. unit']),
      measurement_unit: clean(r['Meas. unit']),
      measurement_unit_qual: clean(r['Meas. unit qual']),
      action_code: r['Meas. action'] != null ? parseInt(r['Meas. action']) : null
    }
  }).filter(r => r.goods_code && r.measure_type_code)

  console.log(`  🔧 Procesadas ${rows.length} filas válidas`)

  const withCert = rows.filter(r => r.certificate_code).length
  const withAmount = rows.filter(r => r.condition_amount != null).length
  console.log(`  📊 ${withCert} con certificado, ${withAmount} con amount`)

  await deleteAll('measure_conditions')
  return await batchInsert('measure_conditions', rows, 'Measure Conditions')
}

// ── 3. MEASURE EXCLUSIONS ───────────────────────────────────

async function loadExclusions() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('3️⃣  MEASURE EXCLUSIONS (solo Import)')
  console.log('═══════════════════════════════════════════════')

  const raw = readExcel('Measure exclusions.xlsx')
  console.log(`  📂 Leídas ${raw.length} filas del Excel`)

  // Filtrar solo Import (excluir measure types de export)
  const exportTypes = [706, 708, 751, 780, 781]

  const rows = raw
    .filter(r => {
      const mtc = parseInt(r['Meas. type code'])
      return !exportTypes.includes(mtc)
    })
    .map(r => {
      return {
        goods_code: padGoodsCode(r['Goods code']),
        add_code: clean(r['Add code']),
        order_no: clean(r['Order No.']),
        start_date: parseDate(r['Start date']),
        end_date: parseDate(r['End date']),
        origin_code: clean(r['Origin code']),
        origin_name: clean(r['Origin']),
        measure_type_code: parseInt(r['Meas. type code']) || null,
        measure_type_name: clean(r['Measure type']),
        // NOTA: En este Excel los campos están invertidos
        // 'Excluded country code' tiene el nombre, 'Excluded country' tiene el código ISO
        excluded_country_code: clean(r['Excluded country']),
        excluded_country_name: clean(r['Excluded country code'])
      }
    })
    .filter(r => r.goods_code && r.excluded_country_code && r.measure_type_code)

  const exportFiltered = raw.length - rows.length
  console.log(`  🔧 Procesadas ${rows.length} filas Import (${exportFiltered} de export filtradas)`)

  // Stats por measure type
  const byType = {}
  rows.forEach(r => { byType[r.measure_type_code] = (byType[r.measure_type_code] || 0) + 1 })
  const topTypes = Object.entries(byType).sort(([, a], [, b]) => b - a).slice(0, 5)
  console.log(`  📊 Top measure types: ${topTypes.map(([k, v]) => `${k}(${v})`).join(', ')}`)

  await deleteAll('measure_exclusions')
  return await batchInsert('measure_exclusions', rows, 'Measure Exclusions')
}

// ── 4. MEASURE FOOTNOTES ────────────────────────────────────

async function loadFootnotes() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('4️⃣  MEASURE FOOTNOTES')
  console.log('═══════════════════════════════════════════════')

  const raw = readExcel('Measure footnotes.xlsx')
  console.log(`  📂 Leídas ${raw.length} filas del Excel`)

  const rows = raw.map(r => {
    return {
      goods_code: padGoodsCode(r['Goods code']),
      add_code: clean(r['Add code']),
      order_no: clean(r['Order No.']),
      origin_code: clean(r['Origin code']),
      start_date: parseDate(r['Start date']),
      end_date: parseDate(r['End date']),
      measure_type_code: parseInt(r['Meas. type code']) || null,
      origin_name: clean(r['Origin']),
      measure_type_name: clean(r['Measure type']),
      footnote_code: clean(r['Footnote'])
    }
  }).filter(r => r.goods_code && r.footnote_code)

  console.log(`  🔧 Procesadas ${rows.length} filas válidas`)

  const uniqueFootnotes = new Set(rows.map(r => r.footnote_code)).size
  console.log(`  📊 ${uniqueFootnotes} footnotes únicos`)

  await deleteAll('measure_footnotes')
  return await batchInsert('measure_footnotes', rows, 'Measure Footnotes')
}

// ── MAIN ────────────────────────────────────────────────────

async function main() {
  console.log('╔═══════════════════════════════════════════════╗')
  console.log('║  BLOQUE 2 — Recarga de datos core             ║')
  console.log('║  LexAduana v5.1 — Marzo 2026                  ║')
  console.log('╚═══════════════════════════════════════════════╝')
  console.log('')
  console.log(`📂 Excel path: ${EXCEL_PATH}`)
  console.log(`🔑 Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}`)
  console.log(`🔑 Service Key: ${process.env.SUPABASE_SERVICE_KEY ? '✅' : '❌'}`)
  if (DRY_RUN) console.log('🧪 MODO DRY RUN — no se escribirá en Supabase')
  if (ONLY) console.log(`🎯 Solo ejecutando: ${ONLY}`)
  console.log('')

  const requiredFiles = [
    'Duties Import 01-99.xlsx',
    'Measure conditions.xlsx',
    'Measure exclusions.xlsx',
    'Measure footnotes.xlsx'
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
    if (!ONLY || ONLY === 'measures') {
      results.taricMeasures = await loadMeasures()
    }
    if (!ONLY || ONLY === 'conditions') {
      results.measureConditions = await loadConditions()
    }
    if (!ONLY || ONLY === 'exclusions') {
      results.measureExclusions = await loadExclusions()
    }
    if (!ONLY || ONLY === 'footnotes') {
      results.measureFootnotes = await loadFootnotes()
    }
  } catch (error) {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)

  console.log('\n╔═══════════════════════════════════════════════╗')
  console.log('║  RESUMEN BLOQUE 2                              ║')
  console.log('╠═══════════════════════════════════════════════╣')
  Object.entries(results).forEach(([key, count]) => {
    console.log(`║  ${key.padEnd(22)} ${String(count).padStart(8)} filas  ║`)
  })
  console.log(`╠═══════════════════════════════════════════════╣`)
  console.log(`║  ⏱️  Tiempo: ${elapsed}s${' '.repeat(Math.max(0, 30 - elapsed.length))}║`)
  console.log('╚═══════════════════════════════════════════════╝')

  console.log('\n📋 PRÓXIMOS PASOS:')
  console.log('   1. Verificar conteos en Supabase (query en bloque2-schema.sql)')
  console.log('   2. Si OK, eliminar backups:')
  console.log('      DROP TABLE IF EXISTS taric_measures_backup_mar26;')
  console.log('      DROP TABLE IF EXISTS measure_conditions_backup_mar26;')
  console.log('      DROP TABLE IF EXISTS measure_exclusions_backup_mar26;')
  console.log('   3. Ejecutar Bloque 3 (lookup tables)')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
