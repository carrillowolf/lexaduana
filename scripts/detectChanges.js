/**
 * DETECCIÓN DE CAMBIOS TARIC — Compara Excel nuevo vs Supabase actual
 * LexAduana v5.x
 *
 * REQUISITO: Ejecutar changes-schema.sql en Supabase SQL Editor ANTES de este script
 *
 * Este script se ejecuta ANTES de los scripts de carga (loadBlock1/2/3).
 * Detecta diferencias y las guarda en taric_changes para la página /cambios.
 *
 * Uso:
 *   node scripts/detectChanges.js --excel-path=/ruta --month=2026-05
 *   node scripts/detectChanges.js --excel-path=/ruta --month=2026-05 --dry-run
 *   node scripts/detectChanges.js --excel-path=/ruta --month=2026-05 --tables=measures
 *   node scripts/detectChanges.js --excel-path=/ruta --month=2026-05 --tables=measures,conditions
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

// ── Argumentos CLI ──────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const DEFAULT_EXCEL_PATH = path.resolve(__dirname, '..', 'data', 'nuevo-mes')
const EXCEL_PATH = args.find(a => a.startsWith('--excel-path='))?.split('=')[1] || DEFAULT_EXCEL_PATH
const MONTH = args.find(a => a.startsWith('--month='))?.split('=')[1]
const TABLES_ARG = args.find(a => a.startsWith('--tables='))?.split('=')[1]

if (!MONTH) {
  console.error('❌ Uso: node scripts/detectChanges.js --month=2026-05 [--dry-run] [--tables=measures,conditions] [--excel-path=/ruta]')
  console.error('   Sin --excel-path se usa: data/nuevo-mes/')
  process.exit(1)
}

if (!/^\d{4}-\d{2}$/.test(MONTH)) {
  console.error('❌ Formato de mes inválido. Usar YYYY-MM (ej: 2026-05)')
  process.exit(1)
}

const BATCH_SIZE = 500
const PAGE_SIZE = 1000

// ── Utilidades (mismas que loadBlock2.js) ───────────────────

function readExcel(filename) {
  const filepath = path.join(EXCEL_PATH, filename)
  if (!fs.existsSync(filepath)) {
    console.error(`❌ No se encuentra: ${filepath}`)
    return null
  }
  const buffer = fs.readFileSync(filepath)
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet)
}

function parseDate(val) {
  if (!val) return null
  if (val instanceof Date) {
    const y = val.getFullYear()
    const m = String(val.getMonth() + 1).padStart(2, '0')
    const d = String(val.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
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

// ── Configuración de tablas a comparar ──────────────────────

/**
 * Cada tabla define:
 * - excelFile: nombre exacto del Excel en el directorio
 * - normalize: función que transforma una fila del Excel al formato de Supabase
 * - keyColumns: columnas que forman la clave compuesta (identidad de la fila)
 * - valueColumns: columnas cuyos cambios se detectan como 'modified'
 * - severityRules: reglas para clasificar la severidad del cambio
 */
const TABLE_CONFIG = {
  measures: {
    tableName: 'taric_measures',
    excelFile: 'Duties Import 01-99.xlsx',
    normalize(r) {
      return {
        goods_code: padGoodsCode(r['Goods code']),
        start_date: parseDate(r['Start date']),
        origin_code: clean(r['Origin code']),
        measure_type_code: String(parseInt(r['Meas. type code']) || ''),
        duty_expression: clean(r['Duty']),
        legal_base: clean(r['Legal base']),
        origin_name: clean(r['Origin']),
        measure_type_name: clean(r['Measure type']),
      }
    },
    // Clave compuesta: identifica una medida única en el Excel CIRCABC
    keyColumns: ['goods_code', 'start_date', 'origin_code', 'measure_type_code'],
    valueColumns: ['duty_expression', 'legal_base'],
    severityForField: {
      duty_expression: 'critical',
      legal_base: 'info',
    },
    severityForAdded(row) {
      const criticalTypes = ['142', '143', '551', '552', '553', '554', '555', '775']
      return criticalTypes.includes(row.measure_type_code) ? 'critical' : 'warning'
    },
    severityForRemoved: 'warning',
  },

  conditions: {
    tableName: 'measure_conditions',
    excelFile: 'Measure conditions.xlsx',
    normalize(r) {
      return {
        goods_code: padGoodsCode(r['Goods code']),
        add_code: clean(r['Add code']),
        order_no: clean(r['Order No.']),
        start_date: parseDate(r['Start date']),
        end_date: parseDate(r['End date']),
        origin_code: clean(r['Origin code']),
        measure_type_code: String(parseInt(r['Meas. type code']) || ''),
        condition_code: clean(r['Meas. cond']),
        condition_sequence: r['Sequence'] != null ? String(parseInt(r['Sequence'])) : null,
        certificate_code: clean(r['Certificate']),
        action_code: r['Meas. action'] != null ? String(parseInt(r['Meas. action'])) : null,
      }
    },
    keyColumns: ['goods_code', 'add_code', 'order_no', 'start_date', 'origin_code', 'measure_type_code', 'condition_code', 'condition_sequence', 'certificate_code'],
    valueColumns: ['action_code'],
    severityForField: {
      action_code: 'warning',
    },
    severityForAdded: () => 'warning',
    severityForRemoved: 'info',
  },

  exclusions: {
    tableName: 'measure_exclusions',
    excelFile: 'Measure exclusions.xlsx',
    normalize(r) {
      const exportTypes = [706, 708, 751, 780, 781]
      const mtc = parseInt(r['Meas. type code'])
      if (exportTypes.includes(mtc)) return null // Filtrar export
      return {
        goods_code: padGoodsCode(r['Goods code']),
        add_code: clean(r['Add code']),
        order_no: clean(r['Order No.']),
        start_date: parseDate(r['Start date']),
        end_date: parseDate(r['End date']),
        origin_code: clean(r['Origin code']),
        measure_type_code: String(mtc || ''),
        // NOTA: campos invertidos en el Excel (igual que loadBlock2)
        excluded_country_code: clean(r['Excluded country']),
        excluded_country_name: clean(r['Excluded country code']),
      }
    },
    keyColumns: ['goods_code', 'add_code', 'order_no', 'start_date', 'origin_code', 'measure_type_code', 'excluded_country_code'],
    valueColumns: [],
    severityForField: {},
    severityForAdded: () => 'warning',
    severityForRemoved: 'warning',
  },

  footnotes: {
    tableName: 'measure_footnotes',
    excelFile: 'Measure footnotes.xlsx',
    normalize(r) {
      return {
        goods_code: padGoodsCode(r['Goods code']),
        add_code: clean(r['Add code']),
        order_no: clean(r['Order No.']),
        origin_code: clean(r['Origin code']),
        start_date: parseDate(r['Start date']),
        end_date: parseDate(r['End date']),
        measure_type_code: String(parseInt(r['Meas. type code']) || ''),
        footnote_code: clean(r['Footnote']),
      }
    },
    keyColumns: ['goods_code', 'add_code', 'order_no', 'start_date', 'origin_code', 'measure_type_code', 'footnote_code'],
    valueColumns: [],
    severityForField: {},
    severityForAdded: () => 'info',
    severityForRemoved: 'info',
  },
}

// ── Funciones de comparación ────────────────────────────────

/**
 * Genera una clave compuesta para identificar una fila
 */
function makeKey(row, keyColumns) {
  return keyColumns.map(col => String(row[col] ?? '')).join('|')
}

/**
 * Genera campos derivados del goods_code
 */
function deriveFields(goodsCode) {
  const padded = String(goodsCode || '').padStart(10, '0')
  return {
    goods_code: padded,
    goods_code_short: padded.substring(0, 6),
    chapter: padded.substring(0, 2),
  }
}

/**
 * Descarga datos actuales de Supabase para una tabla, paginando por capítulo
 */
async function getCurrentData(tableName) {
  // Primero verificar si la tabla tiene datos
  const { count, error: countError } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })

  if (countError) throw countError

  if (count === 0) {
    console.log(`   ℹ️  Tabla ${tableName} vacía — todos serán 'added'`)
    return new Map()
  }

  console.log(`   📥 Descargando ${count.toLocaleString('es-ES')} filas de ${tableName}...`)

  const allData = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) throw error
    allData.push(...data)

    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE

    if (offset % 10000 === 0) {
      process.stdout.write(`\r   📥 Descargadas ${allData.length.toLocaleString('es-ES')} filas...`)
    }
  }

  if (allData.length > 10000) {
    console.log(`\r   📥 Descargadas ${allData.length.toLocaleString('es-ES')} filas de ${tableName}`)
  }

  return allData
}

/**
 * Compara datos nuevos (Excel) vs actuales (Supabase) y detecta cambios
 */
function detectChanges(newRows, currentRows, config) {
  const { keyColumns, valueColumns, severityForField, severityForAdded, severityForRemoved } = config

  // Indexar datos actuales por clave compuesta
  const currentMap = new Map()
  for (const row of currentRows) {
    // Normalizar measure_type_code a string para comparación consistente
    const normalized = { ...row }
    if (normalized.measure_type_code != null) {
      normalized.measure_type_code = String(normalized.measure_type_code)
    }
    const key = makeKey(normalized, keyColumns)
    currentMap.set(key, normalized)
  }

  // Indexar datos nuevos
  const newMap = new Map()
  for (const row of newRows) {
    const key = makeKey(row, keyColumns)
    newMap.set(key, row)
  }

  const changes = []
  const derived = (row) => deriveFields(row.goods_code)

  // 1. ADDED: en nuevo pero no en actual
  for (const [key, row] of newMap) {
    if (!currentMap.has(key)) {
      const d = derived(row)
      const severity = typeof severityForAdded === 'function' ? severityForAdded(row) : severityForAdded
      changes.push({
        change_type: 'added',
        ...d,
        measure_type_code: row.measure_type_code || null,
        origin_code: row.origin_code || null,
        field_changed: null,
        old_value: null,
        new_value: null,
        measure_data: row,
        duty_expression: row.duty_expression || null,
        start_date: row.start_date || null,
        end_date: row.end_date || null,
        severity,
      })
    }
  }

  // 2. REMOVED: en actual pero no en nuevo
  for (const [key, row] of currentMap) {
    if (!newMap.has(key)) {
      const d = derived(row)
      const severity = typeof severityForRemoved === 'function' ? severityForRemoved(row) : severityForRemoved
      changes.push({
        change_type: 'removed',
        ...d,
        measure_type_code: row.measure_type_code || null,
        origin_code: row.origin_code || null,
        field_changed: null,
        old_value: null,
        new_value: null,
        measure_data: row,
        duty_expression: row.duty_expression || null,
        start_date: row.start_date || null,
        end_date: row.end_date || null,
        severity,
      })
    }
  }

  // 3. MODIFIED: misma clave, valores distintos
  for (const [key, newRow] of newMap) {
    const currentRow = currentMap.get(key)
    if (!currentRow) continue

    for (const col of valueColumns) {
      const oldVal = String(currentRow[col] ?? '')
      const newVal = String(newRow[col] ?? '')

      if (oldVal !== newVal) {
        const d = derived(newRow)
        const severity = severityForField[col] || 'info'
        changes.push({
          change_type: 'modified',
          ...d,
          measure_type_code: newRow.measure_type_code || null,
          origin_code: newRow.origin_code || null,
          field_changed: col,
          old_value: oldVal || null,
          new_value: newVal || null,
          measure_data: newRow,
          duty_expression: newRow.duty_expression || null,
          start_date: newRow.start_date || null,
          end_date: newRow.end_date || null,
          severity,
        })
      }
    }
  }

  return changes
}

// ── Inserción en Supabase ───────────────────────────────────

async function insertChanges(changes, runId) {
  if (changes.length === 0) return 0
  if (DRY_RUN) {
    console.log(`   🧪 DRY RUN: ${changes.length} cambios (no se insertan)`)
    return changes.length
  }

  const rows = changes.map(c => ({
    run_id: runId,
    data_month: MONTH,
    table_name: c._tableName,
    change_type: c.change_type,
    goods_code: c.goods_code,
    goods_code_short: c.goods_code_short,
    chapter: c.chapter,
    measure_type_code: c.measure_type_code,
    origin_code: c.origin_code,
    field_changed: c.field_changed,
    old_value: c.old_value,
    new_value: c.new_value,
    measure_data: c.measure_data,
    duty_expression: c.duty_expression,
    start_date: c.start_date,
    end_date: c.end_date,
    severity: c.severity,
  }))

  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('taric_changes').insert(batch)

    if (error) {
      console.error(`   ❌ Error insertando lote: ${error.message}`)
      // Retry con sublotes de 50
      for (let j = 0; j < batch.length; j += 50) {
        const sub = batch.slice(j, j + 50)
        const { error: subErr } = await supabase.from('taric_changes').insert(sub)
        if (!subErr) inserted += sub.length
        else console.error(`   ❌ Sub-lote falló: ${subErr.message}`)
      }
    } else {
      inserted += batch.length
    }
  }

  return inserted
}

// ── Procesamiento de una tabla ──────────────────────────────

async function processTable(shortName, config) {
  const { tableName, excelFile, normalize } = config

  console.log(`\n📊 Comparando ${tableName}...`)

  // 1. Leer Excel nuevo
  const raw = readExcel(excelFile)
  if (!raw) {
    console.log(`   ⚠️  Excel no encontrado, saltando ${tableName}`)
    return { changes: [], skipped: true }
  }

  // 2. Normalizar
  const newRows = raw
    .map(normalize)
    .filter(r => r !== null && r.goods_code)

  console.log(`   📂 Excel nuevo: ${newRows.length.toLocaleString('es-ES')} filas`)

  // 3. Descargar datos actuales
  const currentRows = await getCurrentData(tableName)
  const currentCount = Array.isArray(currentRows) ? currentRows.length : 0
  console.log(`   💾 Supabase actual: ${currentCount.toLocaleString('es-ES')} filas`)

  // 4. Detectar cambios
  const currentArray = Array.isArray(currentRows) ? currentRows : []
  const changes = detectChanges(newRows, currentArray, config)

  // Anotar el nombre de tabla en cada cambio
  changes.forEach(c => { c._tableName = tableName })

  // 5. Stats
  const added = changes.filter(c => c.change_type === 'added').length
  const removed = changes.filter(c => c.change_type === 'removed').length
  const modified = changes.filter(c => c.change_type === 'modified').length
  const critical = changes.filter(c => c.severity === 'critical').length
  const warning = changes.filter(c => c.severity === 'warning').length

  console.log(`   ✅ Añadidas: ${added.toLocaleString('es-ES')}`)
  console.log(`   ❌ Eliminadas: ${removed.toLocaleString('es-ES')}`)
  console.log(`   ✏️  Modificadas: ${modified.toLocaleString('es-ES')}`)
  if (critical > 0) console.log(`   🔴 Críticos: ${critical}`)
  if (warning > 0) console.log(`   🟡 Warnings: ${warning}`)

  return { changes, added, removed, modified, critical, warning }
}

// ── MAIN ────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  DETECCIÓN DE CAMBIOS TARIC                      ║')
  console.log(`║  Periodo: ${MONTH}${' '.repeat(37 - MONTH.length)}║`)
  console.log('╚══════════════════════════════════════════════════╝')
  console.log('')
  console.log(`📂 Excel path: ${EXCEL_PATH}`)
  console.log(`🔑 Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}`)
  if (DRY_RUN) console.log('🧪 MODO DRY RUN — no se escribirá en Supabase')
  console.log('')

  // Determinar qué tablas procesar
  const tablesToProcess = TABLES_ARG
    ? TABLES_ARG.split(',').map(t => t.trim())
    : Object.keys(TABLE_CONFIG)

  // Verificar que los Excel existen
  for (const shortName of tablesToProcess) {
    const config = TABLE_CONFIG[shortName]
    if (!config) {
      console.error(`❌ Tabla desconocida: ${shortName}. Opciones: ${Object.keys(TABLE_CONFIG).join(', ')}`)
      process.exit(1)
    }
    const fp = path.join(EXCEL_PATH, config.excelFile)
    if (!fs.existsSync(fp)) {
      console.error(`❌ Falta archivo: ${fp}`)
      process.exit(1)
    }
  }

  console.log('✅ Todos los archivos Excel encontrados')
  console.log(`📋 Tablas a comparar: ${tablesToProcess.join(', ')}`)

  // Crear registro de ejecución
  let runId = null
  if (!DRY_RUN) {
    const { data, error } = await supabase
      .from('taric_update_runs')
      .insert({
        data_month: MONTH,
        source_description: `CIRCABC EUR-Lex ${MONTH}`,
        status: 'running',
        tables_processed: tablesToProcess.map(t => TABLE_CONFIG[t].tableName),
      })
      .select('id')
      .single()

    if (error) {
      console.error('❌ Error creando registro de ejecución:', error.message)
      console.error('   ¿Has ejecutado changes-schema.sql en Supabase?')
      process.exit(1)
    }

    runId = data.id
    console.log(`\n🏷️  Run ID: ${runId}`)
  }

  const start = Date.now()
  let allChanges = []
  const totals = { added: 0, removed: 0, modified: 0, critical: 0, warning: 0 }

  // Procesar cada tabla
  for (const shortName of tablesToProcess) {
    const config = TABLE_CONFIG[shortName]
    try {
      const result = await processTable(shortName, config)
      if (!result.skipped) {
        allChanges = allChanges.concat(result.changes)
        totals.added += result.added || 0
        totals.removed += result.removed || 0
        totals.modified += result.modified || 0
        totals.critical += result.critical || 0
        totals.warning += result.warning || 0
      }
    } catch (err) {
      console.error(`\n❌ Error procesando ${config.tableName}:`, err.message)
      if (!DRY_RUN && runId) {
        await supabase.from('taric_update_runs').update({
          status: 'failed',
          error_log: `Error en ${config.tableName}: ${err.message}`,
          completed_at: new Date().toISOString(),
        }).eq('id', runId)
      }
      process.exit(1)
    }
  }

  // Insertar cambios
  if (allChanges.length > 0) {
    console.log(`\n💾 Insertando ${allChanges.length.toLocaleString('es-ES')} cambios en taric_changes...`)
    const inserted = await insertChanges(allChanges, runId)
    console.log(`   ✅ ${inserted.toLocaleString('es-ES')} cambios insertados`)
  }

  // Actualizar registro de ejecución
  if (!DRY_RUN && runId) {
    await supabase.from('taric_update_runs').update({
      status: 'completed',
      total_changes: allChanges.length,
      changes_by_type: {
        added: totals.added,
        removed: totals.removed,
        modified: totals.modified,
      },
      completed_at: new Date().toISOString(),
    }).eq('id', runId)
  }

  // Resumen final
  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  const totalInfo = allChanges.length - totals.critical - totals.warning

  // Capítulos más afectados
  const chapterCounts = {}
  allChanges.forEach(c => {
    chapterCounts[c.chapter] = (chapterCounts[c.chapter] || 0) + 1
  })
  const topChapters = Object.entries(chapterCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  console.log('\n══════════════════════════════════════════════════')
  console.log(`  RESUMEN: ${allChanges.length.toLocaleString('es-ES')} cambios detectados`)
  console.log(`  🔴 ${totals.critical} críticos | 🟡 ${totals.warning} warnings | ℹ️  ${totalInfo} info`)
  if (topChapters.length > 0) {
    console.log(`  Capítulos más afectados: ${topChapters.map(([ch, n]) => `${ch}(${n})`).join(', ')}`)
  }
  console.log(`  ⏱️  Tiempo: ${elapsed}s`)
  console.log('══════════════════════════════════════════════════')

  if (!DRY_RUN && runId) {
    console.log(`\n✅ Cambios guardados en taric_changes (run_id: ${runId})`)
  }

  console.log('\n⚠️  SIGUIENTE PASO: Ejecutar los scripts de carga para actualizar los datos:')
  console.log(`   node scripts/loadBlock1.js --excel-path=${EXCEL_PATH}`)
  console.log(`   node scripts/loadBlock2.js --excel-path=${EXCEL_PATH}`)
  console.log(`   node scripts/loadBlock3.js --excel-path=${EXCEL_PATH}`)
}

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
