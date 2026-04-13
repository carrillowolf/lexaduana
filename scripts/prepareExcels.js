/**
 * PREPARACIÓN DE EXCELS CIRCABC — Renombra y organiza archivos descargados
 * LexAduana v5.x
 *
 * Los archivos de CIRCABC a veces traen el mes en el nombre
 * (ej: "Duties Import 01-99 abril 2026.xlsx").
 * Este script los busca por patrón y los copia con nombres estándar
 * a una carpeta organizada, lista para detectChanges.js y loadBlock*.js.
 *
 * Uso:
 *   node scripts/prepareExcels.js --source=/ruta/descargas --month=2026-04
 *   node scripts/prepareExcels.js --source=/ruta/descargas --month=2026-04 --dry-run
 *
 * El script creará la carpeta de destino:
 *   /Users/carloscarrillo/Desktop/Archivos de Lexaduana/Abril 26/
 *   con todos los archivos renombrados a los nombres estándar.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ── Argumentos CLI ──────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const SOURCE = args.find(a => a.startsWith('--source='))?.split('=')[1]
const MONTH = args.find(a => a.startsWith('--month='))?.split('=')[1]

if (!SOURCE || !MONTH) {
  console.error('❌ Uso: node scripts/prepareExcels.js --source=/ruta/descargas --month=2026-04 [--dry-run]')
  process.exit(1)
}

if (!/^\d{4}-\d{2}$/.test(MONTH)) {
  console.error('❌ Formato de mes inválido. Usar YYYY-MM (ej: 2026-04)')
  process.exit(1)
}

// ── Nombres de meses para la carpeta de destino ─────────────
const MONTH_NAMES = {
  '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
  '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
  '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre',
}

const [year, monthNum] = MONTH.split('-')
const shortYear = year.slice(2) // '2026' → '26'
const monthName = MONTH_NAMES[monthNum]
const destFolder = path.join('/Users/carloscarrillo/Desktop/Archivos de Lexaduana', `${monthName} ${shortYear}`)

/**
 * Archivos esperados: patrón de búsqueda → nombre estándar de destino.
 * Ordenados por prioridad (Block2 primero para detectChanges, luego Block1 y Block3).
 *
 * Los patrones son case-insensitive y buscan coincidencia parcial.
 */
const FILE_MAPPINGS = [
  // ── Block 2 (core — los que compara detectChanges.js) ──
  { pattern: /duties\s*import/i,              standard: 'Duties Import 01-99.xlsx',          block: 2, required: true },
  { pattern: /measure\s*conditions/i,         standard: 'Measure conditions.xlsx',            block: 2, required: true },
  { pattern: /measure\s*exclusions/i,         standard: 'Measure exclusions.xlsx',            block: 2, required: true },
  { pattern: /measure\s*footnotes/i,          standard: 'Measure footnotes.xlsx',             block: 2, required: true },

  // ── Block 1 (master data) ──
  { pattern: /geographical\s*areas?\s*comp/i, standard: 'Geographical areas composition.xlsx', block: 1, required: false },
  { pattern: /geographical\s*areas?\s*desc/i, standard: 'Geographical areas description.xlsx', block: 1, required: false },
  { pattern: /nomenclature/i,                 standard: 'Nomenclature EN.xlsx',               block: 1, required: false },
  { pattern: /declarable\s*codes/i,           standard: 'Declarable codes.xlsx',              block: 1, required: false },
  { pattern: /box\s*44/i,                     standard: 'Box 44 codes of the SAD.xlsx',       block: 1, required: false },

  // ── Block 3 (lookup tables) ──
  { pattern: /footnotes?\s*desc/i,            standard: 'Footnotes descriptions.xlsx',        block: 3, required: false },
  { pattern: /additional\s*codes?\s*desc/i,   standard: 'Additional codes descriptions.xlsx', block: 3, required: false },
  { pattern: /exchange\s*rates/i,             standard: 'CCT Exchange rates.xlsx',            block: 3, required: false },
  { pattern: /legal\s*bas/i,                  standard: 'Legal basis.xlsx',                   block: 3, required: false },

  // ── Otros (no usados por scripts pero útil tenerlos) ──
  { pattern: /duties\s*export/i,              standard: 'Duties Export 01-99.xlsx',           block: 0, required: false },
]

// ── Main ────────────────────────────────────────────────────

function main() {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  PREPARACIÓN DE EXCELS CIRCABC                   ║')
  console.log(`║  Periodo: ${MONTH} (${monthName} ${year})${' '.repeat(Math.max(0, 25 - monthName.length))}║`)
  console.log('╚══════════════════════════════════════════════════╝')
  console.log('')

  // Verificar carpeta origen
  if (!fs.existsSync(SOURCE)) {
    console.error(`❌ No existe la carpeta origen: ${SOURCE}`)
    process.exit(1)
  }

  // Listar archivos .xlsx en la carpeta origen
  const files = fs.readdirSync(SOURCE).filter(f => f.endsWith('.xlsx') || f.endsWith('.XLSX'))
  console.log(`📂 Origen: ${SOURCE}`)
  console.log(`   ${files.length} archivos Excel encontrados`)
  console.log(`📁 Destino: ${destFolder}`)
  if (DRY_RUN) console.log('🧪 MODO DRY RUN — no se copiarán archivos')
  console.log('')

  // Emparejar archivos con los patrones
  const matched = []
  const unmatched = []

  for (const file of files) {
    const baseName = path.basename(file, path.extname(file))
    const mapping = FILE_MAPPINGS.find(m => m.pattern.test(baseName))

    if (mapping) {
      // Verificar que no haya duplicados
      const existing = matched.find(m => m.standard === mapping.standard)
      if (existing) {
        console.warn(`   ⚠️  Duplicado para "${mapping.standard}": "${file}" (ya tenemos "${existing.source}")`)
        continue
      }
      matched.push({ source: file, standard: mapping.standard, block: mapping.block })
    } else {
      unmatched.push(file)
    }
  }

  // Resumen de emparejamiento
  console.log('📋 Archivos emparejados:')
  for (const m of matched.sort((a, b) => a.block - b.block)) {
    const blockLabel = m.block > 0 ? `Block ${m.block}` : 'Extra'
    const changed = m.source !== m.standard
    console.log(`   ✅ [${blockLabel}] ${m.source}${changed ? ` → ${m.standard}` : ''}`)
  }

  if (unmatched.length > 0) {
    console.log('\n   ⚠️  Sin emparejar (se copiarán tal cual):')
    unmatched.forEach(f => console.log(`      ${f}`))
  }

  // Verificar archivos requeridos
  const missingRequired = FILE_MAPPINGS
    .filter(m => m.required)
    .filter(m => !matched.find(match => match.standard === m.standard))

  if (missingRequired.length > 0) {
    console.log('\n❌ Faltan archivos requeridos para detectChanges.js:')
    missingRequired.forEach(m => console.log(`   - ${m.standard} (patrón: ${m.pattern})`))
    console.log('\n   Asegúrate de descargar todos los archivos de CIRCABC.')
    // No salir — permitir continuar con los que hay
  }

  if (DRY_RUN) {
    console.log('\n🧪 DRY RUN — nada se ha copiado')
    return
  }

  // Crear carpeta destino
  fs.mkdirSync(destFolder, { recursive: true })

  // Copiar archivos emparejados
  let copied = 0
  for (const m of matched) {
    const src = path.join(SOURCE, m.source)
    const dst = path.join(destFolder, m.standard)
    fs.copyFileSync(src, dst)
    copied++
  }

  // Copiar archivos sin emparejar
  for (const f of unmatched) {
    const src = path.join(SOURCE, f)
    const dst = path.join(destFolder, f)
    fs.copyFileSync(src, dst)
    copied++
  }

  console.log(`\n✅ ${copied} archivos copiados a ${destFolder}`)

  // Verificar
  const destFiles = fs.readdirSync(destFolder).filter(f => f.endsWith('.xlsx'))
  console.log(`📁 Contenido del destino: ${destFiles.length} archivos`)

  // Siguiente paso
  const hasAllBlock2 = missingRequired.length === 0
  console.log('\n📋 SIGUIENTE PASO:')
  if (hasAllBlock2) {
    console.log(`   node scripts/detectChanges.js --excel-path="${destFolder}" --month=${MONTH} --dry-run`)
    console.log(`   node scripts/detectChanges.js --excel-path="${destFolder}" --month=${MONTH}`)
  } else {
    console.log(`   node scripts/detectChanges.js --excel-path="${destFolder}" --month=${MONTH} --tables=measures --dry-run`)
    console.log('   (solo measures porque faltan otros archivos)')
  }
  console.log(`   node scripts/loadBlock1.js --excel-path="${destFolder}"`)
  console.log(`   node scripts/loadBlock2.js --excel-path="${destFolder}"`)
  console.log(`   node scripts/loadBlock3.js --excel-path="${destFolder}"`)
}

main()
