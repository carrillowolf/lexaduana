/**
 * Descarga una versión TARIC completa de la API de Omnesia y genera los Excel
 * con las mismas cabeceras que CIRCABC en data/nuevo-mes/, para que
 * detectChanges.js y loadBlock1/2/3.js funcionen sin cambios.
 *
 * Requiere OMNESIA_API_KEY (en .env.local o en el entorno).
 * Opcional: OMNESIA_BASE_URL (por defecto https://api-pre.omnesia.tech/taric/v1)
 *
 * Uso:
 *   node scripts/fetchOmnesia.js [--version=YYYYMM] [--out=/ruta] [--only=measures,conditions,...]
 *
 * Sin --version usa la última versión con sincronización completa en sync-logs.
 *
 * Omnesia no expone "Footnotes descriptions": ese Excel NO se genera y en el
 * Bloque 3 hay que saltar la carga de footnotes (ver docs/RUNBOOK_TARIC_MENSUAL.md).
 */

import * as XLSX from 'xlsx'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') })

const API_KEY = process.env.OMNESIA_API_KEY
const BASE_URL = (process.env.OMNESIA_BASE_URL || 'https://api-pre.omnesia.tech/taric/v1').replace(/\/$/, '')

if (!API_KEY) {
  console.error('❌ Falta OMNESIA_API_KEY en .env.local o en el entorno')
  process.exit(1)
}

const args = process.argv.slice(2)
const arg = name => args.find(a => a.startsWith(`--${name}=`))?.split('=')[1] || null
const OUT_PATH = arg('out') || path.resolve(__dirname, '..', 'data', 'nuevo-mes')
const ONLY = arg('only')?.split(',') || null
let VERSION = arg('version')

const CONCURRENCY = 6
const OPEN_END = '9999-12-31'

// ── HTTP ────────────────────────────────────────────────────

async function get(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}/${endpoint}`)
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, v)
  }
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'x-api-key': API_KEY } })
      if (res.ok) return await res.json()
      if (res.status < 500 && res.status !== 429) {
        throw new Error(`HTTP ${res.status} ${url}: ${await res.text()}`)
      }
      if (attempt >= 5) throw new Error(`HTTP ${res.status} ${url}`)
    } catch (err) {
      if (attempt >= 5 || err.message.startsWith('HTTP 4')) throw err
    }
    await new Promise(r => setTimeout(r, 1000 * 2 ** attempt))
  }
}

/**
 * Descarga todas las páginas de un endpoint. Algunos endpoints no devuelven
 * `total` (duties-import), así que se pide en tandas de CONCURRENCY páginas
 * hasta recibir una incompleta. Las filas se deduplican por `id` cuando existe.
 *
 * duties-import ordena solo por goods_code y el orden entre filas del mismo
 * código cambia de una petición a otra, así que en los cortes de página se
 * pierden y repiten filas. Con `tieKey` se vuelven a pedir completos, filtrando
 * por ese campo, los valores que caen en un corte.
 */
async function fetchAll(endpoint, params, pageSize, label, tieKey = null) {
  const rows = []
  const boundaryKeys = new Set()
  let offset = 0
  let done = false

  while (!done) {
    const offsets = Array.from({ length: CONCURRENCY }, (_, i) => offset + i * pageSize)
    const pages = await Promise.all(offsets.map(o => get(endpoint, { ...params, offset: o, limit: pageSize })))
    for (const page of pages) {
      rows.push(...page.data)
      if (tieKey && page.data.length) {
        boundaryKeys.add(page.data[0][tieKey])
        boundaryKeys.add(page.data[page.data.length - 1][tieKey])
      }
      if (page.data.length < pageSize) done = true
    }
    offset += CONCURRENCY * pageSize
    process.stdout.write(`\r  📥 ${label}: ${rows.length} filas`)
  }

  const keys = [...boundaryKeys]
  for (let i = 0; i < keys.length; i += CONCURRENCY) {
    await Promise.all(keys.slice(i, i + CONCURRENCY).map(async key => {
      for (let o = 0; ; o += pageSize) {
        const page = await get(endpoint, { ...params, [tieKey]: key, offset: o, limit: pageSize })
        rows.push(...page.data)
        if (page.data.length < pageSize) break
      }
    }))
    process.stdout.write(`\r  📥 ${label}: revisando cortes de página ${Math.min(i + CONCURRENCY, keys.length)}/${keys.length}`)
  }

  const seen = new Set()
  const unique = rows.filter(r => {
    if (r.id == null) return true
    if (seen.has(r.id)) return false
    seen.add(r.id)
    return true
  })
  console.log(`\r  📥 ${label}: ${unique.length} filas`)
  return unique
}

// ── Utilidades ──────────────────────────────────────────────

/** CIRCABC deja vacía la fecha de fin abierta; Omnesia usa 9999-12-31. */
function endDate(val) {
  return !val || val === OPEN_END ? '' : val
}

function str(val) {
  return val == null ? '' : String(val)
}

function num(val) {
  if (val == null || val === '') return ''
  const n = Number(val)
  return Number.isNaN(n) ? '' : n
}

/** "871200300080" → "8712003000 80" (formato CIRCABC) */
function fullGoodsCode(code12) {
  return `${code12.substring(0, 10)} ${code12.substring(10, 12)}`
}

/** Nivel jerárquico CIRCABC: dígitos significativos quitando pares de ceros finales. */
function hierPos(code10) {
  let c = code10
  while (c.length > 2 && c.endsWith('00')) c = c.substring(0, c.length - 2)
  return c.length
}

function writeExcel(filename, rows) {
  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1')
  XLSX.writeFile(workbook, path.join(OUT_PATH, filename), { compression: true })
  console.log(`  💾 ${filename}: ${rows.length} filas`)
}

// ── Versión ─────────────────────────────────────────────────

async function resolveVersion() {
  const { data } = await get('sync-logs', { limit: 1 })
  if (!data.length) throw new Error('sync-logs vacío: no se puede determinar la versión TARIC')
  return data[0].taric_version
}

async function expectedRows(version) {
  const { data } = await get('sync-logs', { taric_version: version, limit: 100 })
  return Object.fromEntries(data.map(r => [r.component, r.rows]))
}

// ── Bloque 2: medidas ───────────────────────────────────────

async function measures() {
  const raw = await fetchAll('duties-import', { taric_version: VERSION, structured: false }, 200, 'Duties import', 'goods_code')
  writeExcel('Duties Import 01-99.xlsx', raw.map(r => ({
    'Goods code': r.goods_code,
    'Add code': str(r.add_code),
    'Order No.': str(r.order_number),
    'Start date': r.start_date,
    'End date': endDate(r.end_date),
    'RED_IND': '',
    'Origin code': r.origin_code,
    'Origin': r.origin,
    'Meas. type code': r.measure_type_code,
    'Measure type': r.measure_type,
    'Legal base': str(r.legal_base),
    'Duty': str(r.duty)
  })))
  return raw.length
}

async function conditions() {
  const raw = await fetchAll('measure-conditions', { taric_version: VERSION }, 1000, 'Measure conditions')
  writeExcel('Measure conditions.xlsx', raw.map(r => ({
    'Goods code': r.goods_code,
    'Add code': str(r.add_code),
    'Order No.': str(r.order_no),
    'Start date': r.start_date,
    'End date': endDate(r.end_date),
    'Origin code': r.origin_code,
    'Meas. type code': r.measure_type_code,
    'Meas. cond': str(r.measure_condition),
    'Sequence': num(r.sequence),
    'Certificate': str(r.certificate),
    'Cond. amount': num(r.condition_amount),
    'Mon. unit': str(r.mon_unit),
    'Meas. unit': str(r.measure_unit),
    'Meas. unit qual': str(r.measure_unit_qual),
    'Meas. action': str(r.measure_action)
  })))
  return raw.length
}

async function exclusions() {
  const raw = await fetchAll('measure-exclusions', { taric_version: VERSION }, 1000, 'Measure exclusions')
  writeExcel('Measure exclusions.xlsx', raw.map(r => ({
    'Goods code': r.goods_code,
    'Add code': str(r.add_code),
    'Order No.': str(r.order_no),
    'Start date': r.start_date,
    'End date': endDate(r.end_date),
    'Origin code': r.origin_code,
    'Origin': r.origin,
    'Meas. type code': r.measure_type_code,
    'Measure type': r.measure_type,
    // En el Excel CIRCABC estas dos columnas vienen invertidas y los loaders lo
    // compensan: 'Excluded country' lleva el código ISO y 'Excluded country code' el nombre.
    'Excluded country': r.excluded_country_code,
    'Excluded country code': r.excluded_country
  })))
  return raw.length
}

async function footnotes() {
  const raw = await fetchAll('measure-footnotes', { taric_version: VERSION }, 1000, 'Measure footnotes')
  writeExcel('Measure footnotes.xlsx', raw.map(r => ({
    'Goods code': r.goods_code,
    'Add code': str(r.add_code),
    'Order No.': str(r.order_no),
    'Origin code': r.origin_code,
    'Start date': r.start_date,
    'End date': endDate(r.end_date),
    'Meas. type code': r.measure_type_code,
    'Origin': r.origin,
    'Measure type': r.measure_type,
    'Footnote': r.footnote
  })))
  return raw.length
}

// ── Bloque 1: master data ───────────────────────────────────

async function geoComposition() {
  // El endpoint no filtra por versión: se descarga en EN y se filtra aquí.
  const raw = (await fetchAll('geographical-area-compositions', { language: 'en' }, 1000, 'Geo compositions'))
    .filter(r => r.taric_version === VERSION)
  writeExcel('Geographical areas composition.xlsx', raw.map(r => ({
    'Country group': r.area_code,
    'Abbrev.': str(r.group_abbreviation),
    'Country group descr.': str(r.group_description),
    'Start date': r.start_date,
    'End date': endDate(r.end_date),
    'Member country': r.member_country_code,
    'Abbrev._1': str(r.member_abbreviation),
    'Description': str(r.member_description),
    'Mbship start date': r.membership_start_date,
    'Mbship end date': endDate(r.membership_end_date)
  })))
  return raw.length
}

async function geoAreas() {
  const raw = (await fetchAll('geographical-area-descriptions', { language: 'en' }, 1000, 'Geo descriptions'))
    .filter(r => r.taric_version === VERSION)
  writeExcel('Geographical areas description.xlsx', raw.map(r => ({
    'Or./Dest.': r.area_code,
    'Language': 'EN',
    'Abbrev.': str(r.abbreviation),
    'Description': str(r.description),
    'Start date': r.start_date,
    'Descr. start date': r.description_start_date,
    'End date': endDate(r.end_date)
  })))
  return raw.length
}

/**
 * Genera "Nomenclature EN.xlsx" y "Declarable codes.xlsx" desde la nomenclatura.
 * Omnesia no trae Hier. Pos. ni IS_LEAF: se derivan del código y del sangrado
 * (una línea es hoja si la siguiente no está más indentada). "Decl. start date"
 * tampoco existe y se usa la fecha de inicio de la línea.
 */
async function nomenclature() {
  const raw = (await fetchAll('nomenclature', { taric_version: VERSION }, 1000, 'Nomenclature'))
    .filter(r => r.language === 'en')
    .sort((a, b) => a.goods_code.localeCompare(b.goods_code))

  const lines = raw.map(r => {
    const code10 = r.goods_code.substring(0, 10)
    const hier = hierPos(code10)
    const dashes = (r.indent.match(/-/g) || []).length
    // Capítulos y partidas no llevan guiones: se les da profundidad negativa
    const depth = hier === 2 ? -2 : hier === 4 ? -1 : dashes
    return { r, code10, hier, depth }
  })

  writeExcel('Nomenclature EN.xlsx', lines.map(({ r, hier }) => ({
    'Goods code': fullGoodsCode(r.goods_code),
    'Start date': r.start_date,
    'End date': endDate(r.end_date),
    'Language': 'EN',
    'Hier. Pos.': hier,
    'Indent': r.indent.trim(),
    'Description': str(r.description),
    'Descr. start date': r.description_start_date
  })))

  writeExcel('Declarable codes.xlsx', lines.map(({ r, depth }, i) => {
    const next = lines[i + 1]
    const isLeaf = r.goods_code.endsWith('80') && (!next || next.depth <= depth)
    return {
      'Goods code': fullGoodsCode(r.goods_code),
      'Start date': r.start_date,
      'End date': endDate(r.end_date),
      'Decl. start date': r.start_date,
      'IS_LEAF': isLeaf ? 1 : 0
    }
  }))
  return raw.length
}

// ── Bloque 3: lookup tables ─────────────────────────────────

async function certificates() {
  const rows = []
  for (const lang of ['en', 'es']) {
    const raw = (await fetchAll('box44-certificates', { language: lang }, 1000, `Box 44 (${lang})`))
      .filter(r => r.taric_version === VERSION)
    rows.push(...raw)
  }
  writeExcel('Box 44 codes of the SAD.xlsx', rows.map(r => ({
    'Certificate code': r.certificate_code,
    'Language': r.language.toUpperCase(),
    'Description': str(r.description),
    'Start date': r.start_date,
    'Description start date': r.description_start_date,
    'End date': endDate(r.end_date)
  })))
  return rows.length
}

async function additionalCodes() {
  const rows = []
  for (const lang of ['en', 'es']) {
    rows.push(...await fetchAll('additional-codes-descriptions', { taric_version: VERSION, language: lang }, 1000, `Additional codes (${lang})`))
  }
  writeExcel('Additional codes descriptions.xlsx', rows.map(r => ({
    'Add code': r.add_code,
    'Language': r.language.toUpperCase(),
    'Description': str(r.description),
    'Start date': r.start_date,
    'Descr. start date': r.description_start_date,
    'End date': endDate(r.end_date)
  })))
  return rows.length
}

async function exchangeRates() {
  const raw = await fetchAll('cct-exchange-rates', { taric_version: VERSION }, 1000, 'CCT exchange rates')
  writeExcel('CCT Exchange rates.xlsx', raw.map(r => ({
    'MON_UNIT_COD': str(r.mon_unit_cod),
    'MON_UNIT_COD_1': str(r.mon_unit_cod_1),
    'DAT_START': r.dat_start,
    'DAT_END': endDate(r.dat_end),
    'EXCH_RATE': num(r.exch_rate)
  })))
  return raw.length
}

async function legalBases() {
  const raw = (await fetchAll('legal-bases', {}, 1000, 'Legal bases'))
    .filter(r => r.taric_version === VERSION)
  writeExcel('Legal basis.xlsx', raw.map(r => ({
    'Legal base': r.legal_base,
    'Off. Journal': str(r.official_journal),
    'Page': num(r.page),
    'Publ. date': str(r.publication_date)
  })))
  return raw.length
}

// ── MAIN ────────────────────────────────────────────────────

const STEPS = {
  measures: { fn: measures, component: 'TaricDutiesImportSync' },
  conditions: { fn: conditions },
  exclusions: { fn: exclusions },
  footnotes: { fn: footnotes },
  geoComposition: { fn: geoComposition },
  geoAreas: { fn: geoAreas },
  nomenclature: { fn: nomenclature, component: 'TaricNomenclatureSync', perLanguage: true },
  certificates: { fn: certificates },
  additionalCodes: { fn: additionalCodes },
  exchangeRates: { fn: exchangeRates, component: 'TaricCctExchangeRatesSync' },
  legalBases: { fn: legalBases }
}

async function main() {
  console.log(`🌐 Omnesia: ${BASE_URL}`)
  const health = await get('health')
  console.log(`✅ API ${health.status} (v${health.version})`)

  VERSION = VERSION || await resolveVersion()
  console.log(`📅 Versión TARIC: ${VERSION}`)
  console.log(`📂 Salida: ${OUT_PATH}\n`)
  fs.mkdirSync(OUT_PATH, { recursive: true })

  const expected = await expectedRows(VERSION)
  const start = Date.now()

  for (const [name, step] of Object.entries(STEPS)) {
    if (ONLY && !ONLY.includes(name)) continue
    const count = await step.fn()
    // Contraste con el número de filas que Omnesia registró al sincronizar
    const exp = step.component && expected[step.component]
    if (exp && !step.perLanguage && count !== exp) {
      console.warn(`  ⚠️  ${name}: ${count} filas descargadas, sync-logs indica ${exp}`)
    }
  }

  console.log(`\n✅ Excel generados en ${((Date.now() - start) / 1000).toFixed(1)}s`)
  console.log('📋 Siguiente: node scripts/detectChanges.js --month=YYYY-MM --dry-run')
}

main().catch(err => {
  console.error('\n❌ Error:', err.message)
  process.exit(1)
})
