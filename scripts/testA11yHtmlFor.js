#!/usr/bin/env node
/**
 * A11y test — Día 5, Pieza 3: verifica que todo `<label>` de los formularios
 * de producción (wizards Advisory/Monitorización, calculadora, login/register)
 * que renderiza un label+input hermano tiene un `htmlFor` apuntando a un `id`
 * existente en el mismo archivo.
 *
 * Se excluyen explícitamente:
 *   - Labels-contenedor (`<label className="flex ...">`) que envuelven un
 *     checkbox/radio inside. Estos son válidos por asociación implícita.
 *   - El label del selector de año en CalculatorClient.js (apunta a grupo de
 *     <button>, no a un input).
 *
 * Ejecución:  node scripts/testA11yHtmlFor.js
 */

'use strict'

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const FILES = [
  'components/cbam/advisory/AdvisoryIntakeForm.js',
  'components/cbam/advisory/MonitoringSubscriptionForm.js',
  'components/cbam/advisory/ProductLineEditor.js',
  'components/cbam/calculator/CalculatorProductLine.js',
  'app/auth/login/page.js',
  'app/auth/register/page.js',
]

// Etiquetas a ignorar (labels-contenedor de checkbox/radio). Se identifican
// porque el className empieza con "flex" (filas con input inside). Acepta
// tanto className="flex..." como className={`flex...`} o className={cond?...}
function isContainerLabel(labelTag) {
  // className="flex..." | className='flex...'
  if (/className=["']flex[\s\w-]/.test(labelTag)) return true
  // className={`flex ...`}
  if (/className=\{`flex[\s\w-]/.test(labelTag)) return true
  // className={`...flex items-center...`} (template con flex)
  if (/className=\{`[^`]*flex items/.test(labelTag)) return true
  return false
}

// ¿Es una llamada a `<label className="block ...">` con htmlFor?
function hasHtmlFor(labelTag) {
  return /\bhtmlFor\s*=/.test(labelTag)
}

// Extrae todos los `<label ... >` (solo la apertura) y su índice en el archivo
function findLabelOpenings(src) {
  const labels = []
  const re = /<label\b[^>]*>/g
  let m
  while ((m = re.exec(src)) !== null) {
    labels.push({ tag: m[0], pos: m.index })
  }
  return labels
}

let failed = 0
function fail(msg) { console.error(`✗ FAIL — ${msg}`); failed++ }
function pass(msg) { console.log(`✓ PASS — ${msg}`) }

for (const rel of FILES) {
  const abs = path.join(ROOT, rel)
  const src = readFileSync(abs, 'utf8')
  const labels = findLabelOpenings(src)

  let total = 0, withHtmlFor = 0, containers = 0, orphans = 0

  for (const { tag } of labels) {
    total++
    if (isContainerLabel(tag)) {
      containers++
      continue
    }
    if (hasHtmlFor(tag)) {
      withHtmlFor++
      // Verifica que el id referenciado existe en el archivo
      const match = tag.match(/htmlFor\s*=\s*(?:(["'])([^"']+)\1|\{`([^`]+)`\})/)
      if (match) {
        const ref = match[2] || match[3]
        // Si la referencia es dinámica con `${...}`, convertimos a pattern id
        const idLiteral = ref.replace(/\$\{[^}]+\}/g, '.+')
        const idRegex = new RegExp(`\\bid\\s*=\\s*(?:(["'])${idLiteral}\\1|\\{\`${idLiteral}\`\\})`)
        if (!idRegex.test(src)) {
          fail(`${rel}: htmlFor=${ref} no encuentra id correspondiente`)
        }
      }
      continue
    }
    // No-container sin htmlFor → candidato a orphan. Validar:
    //   - si el label es del tipo "label de grupo" (seguido directo por <div
    //     class="flex" con radios/buttons dentro), lo toleramos.
    orphans++
  }

  // El archivo pasa si no hay orphans reales (excepto excepciones conocidas).
  // Excepciones por archivo:
  //   - MonitoringSubscriptionForm: 1 label es "volumeLabel" (grupo de radios)
  //   - CalculatorProductLine: 1 label es "emissionsSourceLabel" (grupo de radios)
  const EXPECTED_ORPHANS = {
    'components/cbam/advisory/MonitoringSubscriptionForm.js': 1,
    'components/cbam/calculator/CalculatorProductLine.js': 1,
  }
  const expected = EXPECTED_ORPHANS[rel] || 0
  if (orphans === expected) {
    pass(`${rel}: ${total} labels (${withHtmlFor} htmlFor, ${containers} contenedores, ${orphans} grupo)`)
  } else {
    fail(`${rel}: ${orphans} orphans (esperado ${expected})`)
  }
}

console.log('')
if (failed > 0) {
  console.error(`❌ ${failed} check(s) fallaron`)
  process.exit(1)
} else {
  console.log('✅ Todos los labels de producción tienen htmlFor válido (o son container/grupo legítimos)')
}
