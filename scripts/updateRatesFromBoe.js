/**
 * Actualiza current_exchange_rates / upcoming_exchange_rates desde el BOE.
 *
 * Los tipos aduaneros de un mes son los cambios del euro del BCE del penúltimo
 * miércoles del mes anterior, que el Banco de España publica en el BOE al día
 * siguiente ("Resolución ... por la que se publican los cambios del euro
 * correspondientes al día ..."). El script descarga esa resolución, la parsea y
 * sustituye la tabla indicada.
 *
 * Uso:
 *   node scripts/updateRatesFromBoe.js --current=BOE-A-2026-19839 [--upcoming=BOE-A-...] [--dry-run]
 *
 * Desde entornos con proxy: NODE_USE_ENV_PROXY=1
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') })

const args = process.argv.slice(2)
const arg = name => args.find(a => a.startsWith(`--${name}=`))?.split('=')[1] || null
const DRY_RUN = args.includes('--dry-run')
const TARGETS = { current: arg('current'), upcoming: arg('upcoming') }

if (!TARGETS.current && !TARGETS.upcoming) {
  console.error('❌ Uso: node scripts/updateRatesFromBoe.js --current=BOE-A-... [--upcoming=BOE-A-...] [--dry-run]')
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, supabaseKey)

// Nombre en el BOE → código ISO y nombre que muestra la web
const CURRENCIES = {
  'dólares USA': ['USD', 'Dólar USA'],
  'yenes japoneses': ['JPY', 'Yen japonés'],
  'coronas checas': ['CZK', 'Corona checa'],
  'coronas danesas': ['DKK', 'Corona danesa'],
  'libras esterlinas': ['GBP', 'Libra esterlina'],
  'forints húngaros': ['HUF', 'Forinto húngaro'],
  'zlotys polacos': ['PLN', 'Zloty polaco'],
  'nuevos leus rumanos': ['RON', 'Leu rumano'],
  'coronas suecas': ['SEK', 'Corona sueca'],
  'francos suizos': ['CHF', 'Franco suizo'],
  'coronas islandesas': ['ISK', 'Corona islandesa'],
  'coronas noruegas': ['NOK', 'Corona noruega'],
  'liras turcas': ['TRY', 'Lira turca'],
  'dólares australianos': ['AUD', 'Dólar australiano'],
  'reales brasileños': ['BRL', 'Real brasileño'],
  'dólares canadienses': ['CAD', 'Dólar canadiense'],
  'yuanes renminbi chinos': ['CNY', 'Yuan renminbi chino'],
  'dólares de Hong-Kong': ['HKD', 'Dólar de Hong Kong'],
  'rupias indonesias': ['IDR', 'Rupia indonesia'],
  'shekel israelí': ['ILS', 'Shekel israelí'],
  'rupias indias': ['INR', 'Rupia india'],
  'wons surcoreanos': ['KRW', 'Won surcoreano'],
  'pesos mexicanos': ['MXN', 'Peso mexicano'],
  'ringgits malasios': ['MYR', 'Ringgit malasio'],
  'dólares neozelandeses': ['NZD', 'Dólar neozelandés'],
  'pesos filipinos': ['PHP', 'Peso filipino'],
  'dólares de Singapur': ['SGD', 'Dólar de Singapur'],
  'bahts tailandeses': ['THB', 'Baht tailandés'],
  'rands sudafricanos': ['ZAR', 'Rand sudafricano'],
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function decodeEntities(s) {
  return s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
}

/** Penúltimo miércoles del mes de la fecha dada (YYYY-MM-DD). */
function penultimateWednesday(year, month) {
  const last = new Date(Date.UTC(year, month + 1, 0))
  const lastWed = last.getUTCDate() - ((last.getUTCDay() - 3 + 7) % 7)
  return lastWed - 7
}

async function fetchResolution(boeId) {
  const res = await fetch(`https://www.boe.es/diario_boe/xml.php?id=${boeId}`)
  if (!res.ok) throw new Error(`BOE ${boeId}: HTTP ${res.status}`)
  const xml = await res.text()

  const titulo = decodeEntities(xml.match(/<titulo>([^<]+)<\/titulo>/)?.[1] || '')
  const pub = xml.match(/<fecha_publicacion>(\d{8})</)?.[1]
  const day = titulo.match(/cambios del euro correspondientes al día (\d+) de (\w+) de (\d{4})/)
  if (!titulo.includes('Banco de España') || !day || !pub) {
    throw new Error(`${boeId} no es una resolución de cambios del euro del Banco de España: "${titulo.slice(0, 120)}"`)
  }

  const [, d, monthName, y] = day
  const year = Number(y)
  const month = MONTHS.indexOf(monthName.toLowerCase())
  if (Number(d) !== penultimateWednesday(year, month)) {
    console.warn(`  ⚠️  ${boeId}: cambios del día ${d} de ${monthName}, que no es el penúltimo miércoles del mes`)
  }
  const next = new Date(Date.UTC(year, month + 1, 1))
  const effectiveFrom = next.toISOString().substring(0, 10)
  const publicationDate = `${pub.substring(0, 4)}-${pub.substring(4, 6)}-${pub.substring(6, 8)}`

  const text = decodeEntities(xml.split('<texto>')[1].split('</texto>')[0].replace(/<[^>]+>/g, '|'))
    .replace(/\s*\|[\s|]*/g, '|')
  const rows = []
  for (const [, value, name] of text.matchAll(/1 euro =\|([\d.,]+)\|([^|]+?)\.?\|/g)) {
    const currency = CURRENCIES[name.trim()]
    if (!currency) throw new Error(`${boeId}: moneda desconocida "${name.trim()}"`)
    rows.push({
      currency_code: currency[0],
      currency_name: currency[1],
      rate: Number(value.replace(/\./g, '').replace(',', '.')),
      effective_from: effectiveFrom,
      publication_date: publicationDate,
      boe_reference: boeId,
    })
  }

  const missing = Object.values(CURRENCIES).map(c => c[0]).filter(c => !rows.some(r => r.currency_code === c))
  if (missing.length || rows.some(r => !(r.rate > 0))) {
    throw new Error(`${boeId}: faltan monedas (${missing.join(', ')}) o hay tipos no válidos`)
  }
  return rows.sort((a, b) => a.currency_code.localeCompare(b.currency_code))
}

async function replaceTable(table, rows) {
  const { error: delErr } = await supabase.from(table).delete().gte('currency_code', '')
  if (delErr) throw new Error(`borrando ${table}: ${delErr.message}`)
  const { data, error } = await supabase.from(table).insert(rows).select()
  if (error) throw new Error(`insertando en ${table}: ${error.message}`)
  console.log(`  ✅ ${data.length} registros en ${table}`)
}

async function main() {
  console.log(DRY_RUN ? '🧪 DRY RUN — no se escribirá en Supabase\n' : '🚀 Actualizando tipos de cambio\n')

  for (const [kind, boeId] of Object.entries(TARGETS)) {
    if (!boeId) continue
    const table = `${kind}_exchange_rates`
    const rows = await fetchResolution(boeId)
    const { data: prev } = await supabase.from(table).select('currency_code, rate')
    const prevRates = Object.fromEntries((prev || []).map(r => [r.currency_code, r.rate]))

    console.log(`📊 ${table}: ${boeId} (publicado ${rows[0].publication_date}, vigente desde ${rows[0].effective_from})`)
    for (const r of rows) {
      const old = prevRates[r.currency_code]
      const delta = old ? ` (antes ${old}, ${((r.rate / old - 1) * 100).toFixed(2)}%)` : ''
      console.log(`   ${r.currency_code}  ${r.rate}${delta}`)
    }
    if (!DRY_RUN) await replaceTable(table, rows)
    console.log('')
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
