/**
 * BLOQUE 3 — Lookup tables (Marzo 2026)
 * LexAduana v5.1
 *
 * REQUISITO: Ejecutar bloque3-schema.sql en Supabase SQL Editor ANTES
 *
 * Carga:
 *   1. certificate_types     (EN + ES = 1766)
 *   2. footnote_descriptions (EN + ES = 5280)
 *   3. additional_codes      (EN + ES = 6506)
 *   4. exchange_rates        (2235)
 *   5. legal_bases           (4460)
 *
 * Uso:
 *   node scripts/loadBlock3.js [--dry-run] [--only=certificates|footnotes|additional|rates|legal] [--excel-path=/ruta]
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
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null
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

function dedupeByKey(rows, keyFn) {
  const seen = new Set()
  return rows.filter(r => {
    const k = keyFn(r)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

async function batchInsert(table, rows, label, { onConflict } = {}) {
  if (DRY_RUN) {
    console.log(`  🧪 DRY RUN: ${rows.length} filas para ${table}`)
    if (rows.length > 0) console.log(`     Sample:`, JSON.stringify(rows[0], null, 2))
    return rows.length
  }

  let inserted = 0
  const total = rows.length
  const op = onConflict ? 'upsert' : 'insert'

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = onConflict
      ? await supabase.from(table).upsert(batch, { onConflict })
      : await supabase.from(table).insert(batch)

    if (error) {
      console.error(`\n  ❌ Error en lote ${Math.floor(i / BATCH_SIZE) + 1} de ${table}:`, error.message)
      const subSize = 50
      for (let j = 0; j < batch.length; j += subSize) {
        const sub = batch.slice(j, j + subSize)
        const { error: subErr } = onConflict
          ? await supabase.from(table).upsert(sub, { onConflict })
          : await supabase.from(table).insert(sub)
        if (subErr) {
          console.error(`     Sub-lote ${j / subSize + 1} falló:`, subErr.message)
        } else {
          inserted += sub.length
        }
      }
    } else {
      inserted += batch.length
    }

    if ((i / BATCH_SIZE) % 10 === 0 || i + BATCH_SIZE >= total) {
      const pct = Math.round((Math.min(i + BATCH_SIZE, total) / total) * 100)
      process.stdout.write(`\r  📊 ${label}: ${inserted}/${total} (${pct}%)`)
    }
  }

  console.log(`\n  ✅ ${label}: ${inserted} filas ${op === 'upsert' ? 'upserted' : 'insertadas'}`)
  return inserted
}

// ── 1. CERTIFICATE TYPES ────────────────────────────────────

async function loadCertificates() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('1️⃣  CERTIFICATE TYPES (EN + ES)')
  console.log('═══════════════════════════════════════════════')

  const raw = readExcel('Box 44 codes of the SAD.xlsx')
  console.log(`  📂 Leídas ${raw.length} filas del Excel`)

  const filtered = raw.filter(r => r['Language'] === 'EN' || r['Language'] === 'ES')
  console.log(`  🔧 Filtradas ${filtered.length} filas (EN + ES)`)

  const rows = filtered.map(r => ({
    certificate_code: clean(r['Certificate code']),
    language: r['Language'],
    description: clean(r['Description']),
    start_date: parseDate(r['Start date']),
    description_start_date: parseDate(r['Description start date']),
    end_date: parseDate(r['End date'])
  })).filter(r => r.certificate_code)

  const unique = dedupeByKey(rows, r => `${r.certificate_code}\t${r.language}`)
  const dupes = rows.length - unique.length
  if (dupes > 0) console.log(`  ⚠️  ${dupes} duplicados eliminados`)
  console.log(`  🔧 Procesadas ${unique.length} filas únicas`)

  return await batchInsert('certificate_types', unique, 'Certificate Types', { onConflict: 'certificate_code,language' })
}

// ── 2. FOOTNOTE DESCRIPTIONS ────────────────────────────────

async function loadFootnoteDescriptions() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('2️⃣  FOOTNOTE DESCRIPTIONS (EN + ES)')
  console.log('═══════════════════════════════════════════════')

  const raw = readExcel('Footnotes descriptions.xlsx')
  console.log(`  📂 Leídas ${raw.length} filas del Excel`)

  const filtered = raw.filter(r => r['Language'] === 'EN' || r['Language'] === 'ES')
  console.log(`  🔧 Filtradas ${filtered.length} filas (EN + ES)`)

  const rows = filtered.map(r => ({
    footnote_code: clean(r['Footnote']),
    language: r['Language'],
    description: clean(r['Description']),
    start_date: parseDate(r['Start date']),
    description_start_date: parseDate(r['Descr. start date']),
    end_date: parseDate(r['End date'])
  })).filter(r => r.footnote_code)

  console.log(`  🔧 Procesadas ${rows.length} filas válidas`)
  return await batchInsert('footnote_descriptions', rows, 'Footnote Descriptions', { onConflict: 'footnote_code,language' })
}

// ── 3. ADDITIONAL CODES ─────────────────────────────────────

async function loadAdditionalCodes() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('3️⃣  ADDITIONAL CODES (EN + ES)')
  console.log('═══════════════════════════════════════════════')

  const raw = readExcel('Additional codes descriptions.xlsx')
  console.log(`  📂 Leídas ${raw.length} filas del Excel`)

  const filtered = raw.filter(r => r['Language'] === 'EN' || r['Language'] === 'ES')
  console.log(`  🔧 Filtradas ${filtered.length} filas (EN + ES)`)

  const rows = filtered.map(r => ({
    add_code: clean(r['Add code']),
    language: r['Language'],
    description: clean(r['Description']),
    start_date: parseDate(r['Start date']),
    description_start_date: parseDate(r['Descr. start date']),
    end_date: parseDate(r['End date'])
  })).filter(r => r.add_code)

  console.log(`  🔧 Procesadas ${rows.length} filas válidas`)
  return await batchInsert('additional_codes', rows, 'Additional Codes', { onConflict: 'add_code,language' })
}

// ── 4. EXCHANGE RATES ───────────────────────────────────────

async function loadExchangeRates() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('4️⃣  EXCHANGE RATES')
  console.log('═══════════════════════════════════════════════')

  const raw = readExcel('CCT Exchange rates.xlsx')
  console.log(`  📂 Leídas ${raw.length} filas del Excel`)

  const rows = raw.map(r => ({
    base_currency: clean(r['MON_UNIT_COD']) || 'EUR',
    target_currency: clean(r['MON_UNIT_COD_1']),
    start_date: parseDate(r['DAT_START']),
    end_date: parseDate(r['DAT_END']),
    rate: r['EXCH_RATE'] != null && !isNaN(r['EXCH_RATE'])
      ? parseFloat(r['EXCH_RATE']) : null
  })).filter(r => r.target_currency && r.start_date && r.rate != null)

  console.log(`  🔧 Procesadas ${rows.length} filas válidas`)

  const currencies = new Set(rows.map(r => r.target_currency))
  console.log(`  📊 ${currencies.size} monedas: ${[...currencies].join(', ')}`)

  return await batchInsert('exchange_rates', rows, 'Exchange Rates')
}

// ── 5. LEGAL BASES ──────────────────────────────────────────

async function loadLegalBases() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('5️⃣  LEGAL BASES')
  console.log('═══════════════════════════════════════════════')

  const raw = readExcel('Legal basis.xlsx')
  console.log(`  📂 Leídas ${raw.length} filas del Excel`)

  const rows = raw.map(r => ({
    legal_base: clean(r['Legal base']),
    official_journal: clean(r['Off. Journal']),
    page: r['Page'] != null && !isNaN(r['Page']) ? parseInt(r['Page']) : null,
    publication_date: parseDate(r['Publ. date'])
  })).filter(r => r.legal_base)

  const unique = dedupeByKey(rows, r => r.legal_base)

  const dupes = rows.length - unique.length
  if (dupes > 0) console.log(`  ⚠️  ${dupes} duplicados eliminados`)
  console.log(`  🔧 Procesadas ${unique.length} filas únicas`)

  return await batchInsert('legal_bases', unique, 'Legal Bases', { onConflict: 'legal_base' })
}

// ── MAIN ────────────────────────────────────────────────────

async function main() {
  console.log('╔═══════════════════════════════════════════════╗')
  console.log('║  BLOQUE 3 — Lookup tables                     ║')
  console.log('║  LexAduana v5.1 — Marzo 2026                  ║')
  console.log('╚═══════════════════════════════════════════════╝')
  console.log('')
  console.log(`📂 Excel path: ${EXCEL_PATH}`)
  console.log(`🔑 Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}`)
  console.log(`🔑 Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌'}`)
  if (DRY_RUN) console.log('🧪 MODO DRY RUN — no se escribirá en Supabase')
  if (ONLY) console.log(`🎯 Solo ejecutando: ${ONLY}`)
  console.log('')

  const requiredFiles = [
    'Box 44 codes of the SAD.xlsx',
    'Footnotes descriptions.xlsx',
    'Additional codes descriptions.xlsx',
    'CCT Exchange rates.xlsx',
    'Legal basis.xlsx'
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
    if (!ONLY || ONLY === 'certificates') {
      results.certificateTypes = await loadCertificates()
    }
    if (!ONLY || ONLY === 'footnotes') {
      results.footnoteDescriptions = await loadFootnoteDescriptions()
    }
    if (!ONLY || ONLY === 'additional') {
      results.additionalCodes = await loadAdditionalCodes()
    }
    if (!ONLY || ONLY === 'rates') {
      results.exchangeRates = await loadExchangeRates()
    }
    if (!ONLY || ONLY === 'legal') {
      results.legalBases = await loadLegalBases()
    }
  } catch (error) {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)

  console.log('\n╔═══════════════════════════════════════════════╗')
  console.log('║  RESUMEN BLOQUE 3                              ║')
  console.log('╠═══════════════════════════════════════════════╣')
  Object.entries(results).forEach(([key, count]) => {
    console.log(`║  ${key.padEnd(22)} ${String(count).padStart(8)} filas  ║`)
  })
  console.log(`╠═══════════════════════════════════════════════╣`)
  console.log(`║  ⏱️  Tiempo: ${elapsed}s${' '.repeat(Math.max(0, 30 - elapsed.length))}║`)
  console.log('╚═══════════════════════════════════════════════╝')

  console.log('\n📋 PRÓXIMOS PASOS:')
  console.log('   1. Verificar conteos en Supabase')
  console.log('   2. Si OK, eliminar tablas _old:')
  console.log('      DROP TABLE IF EXISTS certificate_types_old;')
  console.log('      DROP TABLE IF EXISTS footnote_descriptions_old;')
  console.log('      DROP TABLE IF EXISTS exchange_rates_old;')
  console.log('   3. Actualizar calculateTariff.js para usar las nuevas lookup tables')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
