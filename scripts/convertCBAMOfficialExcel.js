/**
 * Convert CBAM Official Excel Files → JSON
 *
 * Reads the two official Excel files from the EU regulatory package
 * (December 2025) and produces normalized JSON files for seeding.
 *
 * Input:
 *   - docs/cbam-regulations/CBAM_Benchmarks_20260206.xlsx (1.805 benchmark values)
 *   - docs/cbam-regulations/DVs_as_adopted_v20260204.xlsx (120 countries × CN × route)
 *
 * Output:
 *   - lib/data/cbam_benchmarks_official_v2.json
 *   - lib/data/cbam_default_values_official.json
 *
 * Usage: node scripts/convertCBAMOfficialExcel.js
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const require = createRequire(join(ROOT, 'lexaduana-migration', 'package.json'))
const XLSX = require('xlsx')

// ============================================================
// COUNTRY NAME → ISO 3166-1 alpha-2
// ============================================================
const COUNTRY_NAME_TO_ISO = {
  'Albania': 'AL', 'Algeria': 'DZ', 'Angola': 'AO', 'Argentina': 'AR',
  'Armenia': 'AM', 'Australia': 'AU', 'Azerbaijan': 'AZ', 'Bangladesh': 'BD',
  'Bahrain': 'BH', 'Belarus': 'BY', 'Benin': 'BJ', 'Bolivia': 'BO',
  'Bosnia and Herzegovina': 'BA', 'Brazil': 'BR', 'Brunei': 'BN',
  'Cambodia': 'KH', 'Cameroon': 'CM', 'Canada': 'CA', 'Chile': 'CL',
  'China': 'CN', 'Colombia': 'CO', 'Congo': 'CG', 'Costa Rica': 'CR',
  "Côte d'Ivoire": 'CI', 'Cuba': 'CU', 'Curaçao': 'CW',
  'Democratic Republic of the Cong': 'CD', 'Dominican Republic': 'DO',
  'Ecuador': 'EC', 'Egypt': 'EG', 'El Salvador': 'SV',
  'Equatorial Guinea': 'GQ', 'Eritrea': 'ER', 'Eswatini': 'SZ',
  'Ethiopia': 'ET', 'Gabon': 'GA', 'Georgia': 'GE', 'Ghana': 'GH',
  'Guatemala': 'GT', 'Haiti': 'HT', 'Honduras': 'HN', 'Hong Kong': 'HK',
  'India': 'IN', 'Indonesia': 'ID', 'Iran': 'IR', 'Iraq': 'IQ',
  'Israel': 'IL', 'Jamaica': 'JM', 'Japan': 'JP', 'Jordan': 'JO',
  'Kazakhstan': 'KZ', 'Kenya': 'KE', 'Kuwait': 'KW', 'Kyrgyzstan': 'KG',
  'Laos': 'LA', 'Lebanon': 'LB', 'Libya': 'LY', 'Madagascar': 'MG',
  'Malaysia': 'MY', 'Mali': 'ML', 'Mauritius': 'MU', 'Mauritania': 'MR',
  'Mexico': 'MX', 'Moldova': 'MD', 'Mongolia': 'MN', 'Montenegro': 'ME',
  'Morocco': 'MA', 'Mozambique': 'MZ', 'Myanmar_Burma': 'MM',
  'Namibia': 'NA', 'Nepal': 'NP', 'New Zealand': 'NZ', 'Nicaragua': 'NI',
  'Niger': 'NE', 'Nigeria': 'NG', 'North Korea': 'KP',
  'North Macedonia': 'MK', 'Oman': 'OM', 'Pakistan': 'PK',
  'Papua New Guinea': 'PG', 'Panama': 'PA', 'Paraguay': 'PY', 'Peru': 'PE',
  'Philippines': 'PH', 'Qatar': 'QA', 'Russia': 'RU', 'Rwanda': 'RW',
  'Saudi Arabia': 'SA', 'Senegal': 'SN', 'Serbia': 'RS',
  'Sierra Leone': 'SL', 'Singapore': 'SG', 'South Africa': 'ZA',
  'South Korea': 'KR', 'Sri Lanka': 'LK', 'Sudan': 'SD', 'Suriname': 'SR',
  'Syria': 'SY', 'Taiwan': 'TW', 'Tajikistan': 'TJ', 'Tanzania': 'TZ',
  'Thailand': 'TH', 'Togo': 'TG', 'Trinidad and Tobago': 'TT',
  'Tunisia': 'TN', 'Türkiye': 'TR', 'Turkmenistan': 'TM', 'Uganda': 'UG',
  'Ukraine': 'UA', 'United Arab Emirates': 'AE', 'United Kingdom': 'GB',
  'United States': 'US', 'Uruguay': 'UY', 'Uzbekistan': 'UZ',
  'Venezuela': 'VE', 'Vietnam': 'VN', 'Yemen': 'YE', 'Zambia': 'ZM',
  'Zimbabwe': 'ZW', '_Other Countries and Territorie': 'XX',
}

// ============================================================
// SECTOR DETECTION
// ============================================================
const SECTOR_HEADERS = [
  'Cement', 'Fertilisers', 'Fertilizers', 'Iron & Steel', 'Iron and steel',
  'Iron and Steel', 'Aluminium', 'Hydrogen', 'Electricity',
]

function normalizeSector(raw) {
  const s = (raw || '').trim()
  if (s.match(/cement/i)) return 'cement'
  if (s.match(/fertili/i)) return 'fertilizers'
  if (s.match(/iron|steel/i)) return 'ironSteel'
  if (s.match(/alumini/i)) return 'aluminium'
  if (s.match(/hydrogen/i)) return 'hydrogen'
  if (s.match(/electric/i)) return 'electricity'
  return null
}

function isSectorHeader(cellValue) {
  if (!cellValue || typeof cellValue !== 'string') return false
  return SECTOR_HEADERS.some(h => cellValue.trim().toLowerCase() === h.toLowerCase())
}

// ============================================================
// NORMALIZE CN CODE
// ============================================================
function normalizeCN(raw) {
  if (raw == null) return null
  const s = String(raw).replace(/\s+/g, '').replace(/\D/g, '')
  if (!s || s.length < 4) return null
  // Pad to 8 digits
  return s.padEnd(8, '0')
}

// ============================================================
// 1. CONVERT BENCHMARKS
// ============================================================
function convertBenchmarks() {
  console.log('\n📊 Converting Benchmarks Excel...')
  const path = join(ROOT, 'docs', 'cbam-regulations', 'CBAM_Benchmarks_20260206.xlsx')
  const wb = XLSX.readFile(path)
  const ws = wb.Sheets['Benchmarks']
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

  // Row 0 is header: [CN code, Description, ColA BM, ColA route, ColB BM, ColB route]
  const results = []
  let currentSector = null
  let currentCN = null
  let currentDesc = null
  let currentEntry = null

  for (let i = 1; i < raw.length; i++) {
    const row = raw[i]
    const col0 = row[0]
    const colA = row[2]
    const colARoute = row[3]
    const colB = row[4]
    const colBRoute = row[5]

    // Sector header row
    if (col0 && typeof col0 === 'string' && isSectorHeader(col0)) {
      currentSector = normalizeSector(col0)
      continue
    }

    // Skip if no benchmark values on this row
    if (colA == null && colB == null) continue

    // Row with CN code = new product
    if (col0 != null) {
      const cn = normalizeCN(col0)
      if (!cn) continue

      currentCN = cn
      currentDesc = row[1] || ''

      currentEntry = {
        cnCode: cn,
        sector: currentSector,
        description: currentDesc,
        benchmarkValues: [],
      }
      results.push(currentEntry)
    }

    // Add benchmark value (both main rows and continuation rows)
    if (currentEntry) {
      currentEntry.benchmarkValues.push({
        columnA: typeof colA === 'number' ? colA : 0,
        columnARoute: typeof colARoute === 'string' ? colARoute.trim() : null,
        columnB: typeof colB === 'number' ? colB : 0,
        columnBRoute: typeof colBRoute === 'string' ? colBRoute.trim() : null,
      })
    }
  }

  // Stats
  const totalValues = results.reduce((s, r) => s + r.benchmarkValues.length, 0)
  const sectors = [...new Set(results.map(r => r.sector))]
  console.log(`  CN codes: ${results.length}`)
  console.log(`  Total benchmark values (incl. routes): ${totalValues}`)
  console.log(`  Sectors: ${sectors.join(', ')}`)

  return results
}

// ============================================================
// 2. CONVERT DEFAULT VALUES
// ============================================================
function convertDefaultValues() {
  console.log('\n🌍 Converting Default Values Excel...')
  const path = join(ROOT, 'docs', 'cbam-regulations', 'DVs_as_adopted_v20260204.xlsx')
  const wb = XLSX.readFile(path)

  const countrySheets = wb.SheetNames.filter(n => !['Overview', 'Version History'].includes(n))
  const results = []
  let skippedDash = 0

  for (const sheetName of countrySheets) {
    const countryCode = COUNTRY_NAME_TO_ISO[sheetName]
    if (!countryCode) {
      console.warn(`  ⚠ No ISO code for sheet "${sheetName}", skipping`)
      continue
    }

    const ws = wb.Sheets[sheetName]
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

    // Row 0: country name
    // Row 1: headers [CN Code, Description, Direct, Indirect, Total, 2026, 2027, 2028+, Route]
    // Row 2+: sector header or data rows

    let currentSector = null

    for (let i = 2; i < raw.length; i++) {
      const row = raw[i]
      const col0 = row[0]

      // Sector header
      if (col0 && typeof col0 === 'string' && isSectorHeader(col0)) {
        currentSector = normalizeSector(col0)
        continue
      }

      // Sector sub-header (markup label row like "10% mark-up")
      if (col0 && typeof col0 === 'string' && col0.match(/mark-?up/i)) {
        continue
      }

      // Data row — CN code can be string ("2507 00 80") or number (7601)
      const cn = normalizeCN(col0)
      if (!cn) continue

      const direct = row[2]
      const indirect = row[3]
      const total = row[4]
      const markup2026 = row[5]
      const markup2027 = row[6]
      const markup2028 = row[7]
      const route = row[8]

      // Skip rows where all values are dashes or missing
      if (isDash(direct) && isDash(total)) {
        skippedDash++
        continue
      }

      results.push({
        countryCode,
        countryName: sheetName,
        cnCode: cn,
        description: typeof row[1] === 'string' ? row[1].trim() : '',
        sector: currentSector,
        directEmissions: parseNum(direct),
        indirectEmissions: parseNum(indirect),
        totalEmissions: parseNum(total),
        withMarkup2026: parseNum(markup2026),
        withMarkup2027: parseNum(markup2027),
        withMarkup2028: parseNum(markup2028),
        productionRoute: typeof route === 'string' ? route.trim() : null,
      })
    }
  }

  // Stats
  const countries = [...new Set(results.map(r => r.countryCode))]
  const sectors = [...new Set(results.map(r => r.sector).filter(Boolean))]
  console.log(`  Countries: ${countries.length}`)
  console.log(`  Total rows: ${results.length}`)
  console.log(`  Skipped (dash/not applicable): ${skippedDash}`)
  console.log(`  Sectors: ${sectors.join(', ')}`)

  return results
}

function isDash(v) {
  if (v == null) return true
  if (typeof v === 'string') return v.trim() === '–' || v.trim() === '-' || v.trim() === '_' || v.trim() === ''
  return false
}

function parseNum(v) {
  if (v == null) return null
  if (typeof v === 'number') return Math.round(v * 1e6) / 1e6 // avoid float noise
  if (typeof v === 'string') {
    const s = v.trim()
    if (s === '–' || s === '-' || s === '_' || s === '' || s === 'N/A') return null
    const n = parseFloat(s)
    return isNaN(n) ? null : Math.round(n * 1e6) / 1e6
  }
  return null
}

// ============================================================
// MAIN
// ============================================================
function main() {
  console.log('🔄 Converting CBAM Official Excel files to JSON...\n')

  // 1. Benchmarks
  const benchmarks = convertBenchmarks()
  const bmPath = join(ROOT, 'lib', 'data', 'cbam_benchmarks_official_v2.json')
  writeFileSync(bmPath, JSON.stringify(benchmarks, null, 2), 'utf-8')
  console.log(`  ✅ Written to ${bmPath}`)

  // 2. Default Values
  const dvs = convertDefaultValues()
  const dvPath = join(ROOT, 'lib', 'data', 'cbam_default_values_official.json')
  writeFileSync(dvPath, JSON.stringify(dvs, null, 2), 'utf-8')
  console.log(`  ✅ Written to ${dvPath}`)

  console.log('\n✨ Done!')
}

main()
