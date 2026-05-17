/**
 * Seed Glossary — Fase 1
 * LexAduana
 *
 * Importa los términos de `data/glossary.json` a las tablas Supabase
 * `glossary_terms` y `glossary_term_related` creadas en
 * supabase/migrations/20260511120000_glossary.sql.
 *
 * - Mapea cada `category` legado al slug de `glossary_categories`.
 * - Genera `short_definition_es` truncando la `definition` a 180 chars
 *   (es un placeholder temporal hasta Fase 3, que reescribirá copy SEO).
 * - Marca todos los términos como `published = true` (los 24 ya están
 *   en producción en la UI vía JSON).
 * - Resuelve `related`: inserta solo los que existen, registra rotos.
 * - Idempotente: ON CONFLICT DO NOTHING en términos y relaciones.
 * - Genera `scripts/seed-report.json` con el detalle de la importación.
 *
 * Uso:
 *   node scripts/seedGlossary.js [--dry-run]
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const DRY_RUN = process.argv.includes('--dry-run')

const CATEGORY_MAPPING = {
  'arancel':                   'tributacion',
  'taric':                     'clasificacion',
  'codigo-hs':                 'clasificacion',
  'valor-cif':                 'valoracion',
  'valor-fob':                 'valoracion',
  'iva-importacion':           'tributacion',
  'iva-superreducido':         'tributacion',
  'iva-reducido':              'tributacion',
  'dua':                       'documentos',
  'eur1':                      'documentos',
  'origen-preferencial':       'origen',
  'incoterms':                 'valoracion',
  'exw':                       'valoracion',
  'ddp':                       'valoracion',
  'agente-aduanas':            'operadores',
  'transitario':               'operadores',
  'contingente-arancelario':   'tributacion',
  'nomenclatura-combinada':    'clasificacion',
  'regimen-aduanero':          'regimenes',
  'deposito-aduanero':         'regimenes',
  'certificado-fitosanitario': 'documentos',
  'erga-omnes':                'tributacion',
  'antidumping':               'tributacion',
  'base-imponible':            'tributacion'
}

function truncateShortDef(text, max = 180) {
  if (!text) return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut) + '…'
}

async function main() {
  console.log(`Seed glosario ${DRY_RUN ? '(DRY RUN)' : ''}`)
  console.log(`Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)

  const jsonPath = path.resolve(__dirname, '..', 'data', 'glossary.json')
  const glossary = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  const terms = glossary.terms
  console.log(`Términos en JSON: ${terms.length}`)

  const knownIds = new Set(terms.map(t => t.id))

  const { data: categories, error: catErr } = await supabase
    .from('glossary_categories')
    .select('id, slug')
  if (catErr) {
    console.error('Error leyendo categorías:', catErr.message)
    process.exit(1)
  }
  const categoryIdBySlug = Object.fromEntries(categories.map(c => [c.slug, c.id]))
  console.log(`Categorías disponibles: ${categories.length}`)

  const report = {
    runAt: new Date().toISOString(),
    dryRun: DRY_RUN,
    termsInJson: terms.length,
    termsInserted: 0,
    termsAlreadyExisting: 0,
    termsFailed: [],
    relatedInserted: 0,
    relatedAlreadyExisting: 0,
    brokenRelated: [],
    missingTerms: [],
    missingCategoryMapping: []
  }

  for (const term of terms) {
    const categorySlug = CATEGORY_MAPPING[term.id]
    if (!categorySlug) {
      report.missingCategoryMapping.push(term.id)
      console.warn(`! Sin mapeo de categoría para "${term.id}", se salta`)
      continue
    }
    const categoryId = categoryIdBySlug[categorySlug]
    if (!categoryId) {
      report.missingCategoryMapping.push(`${term.id} → ${categorySlug}`)
      console.warn(`! Categoría "${categorySlug}" no existe en BD para "${term.id}"`)
      continue
    }

    const payload = {
      slug: term.id,
      category_id: categoryId,
      term_es: term.term,
      short_definition_es: truncateShortDef(term.definition),
      definition_es: term.definition,
      example_es: term.example || null,
      published: true,
      published_at: new Date().toISOString()
    }

    if (DRY_RUN) {
      console.log(`  [dry] ${term.id} → ${categorySlug}`)
      report.termsInserted++
      continue
    }

    const { data: existing } = await supabase
      .from('glossary_terms')
      .select('id')
      .eq('slug', term.id)
      .maybeSingle()

    if (existing) {
      report.termsAlreadyExisting++
    } else {
      const { error: insErr } = await supabase
        .from('glossary_terms')
        .insert(payload)
      if (insErr) {
        report.termsFailed.push({ slug: term.id, error: insErr.message })
        console.error(`  X ${term.id}: ${insErr.message}`)
        continue
      }
      report.termsInserted++
      console.log(`  + ${term.id} (${categorySlug})`)
    }
  }

  console.log('\nResolviendo related...')

  if (!DRY_RUN) {
    const { data: dbTerms, error: dbErr } = await supabase
      .from('glossary_terms')
      .select('id, slug')
    if (dbErr) {
      console.error('Error leyendo términos para related:', dbErr.message)
      process.exit(1)
    }
    const termIdBySlug = Object.fromEntries(dbTerms.map(t => [t.slug, t.id]))

    for (const term of terms) {
      const sourceId = termIdBySlug[term.id]
      if (!sourceId) continue
      const related = term.related || []
      for (const relSlug of related) {
        if (!knownIds.has(relSlug)) {
          report.brokenRelated.push({ term: term.id, missingRelated: relSlug })
          if (!report.missingTerms.includes(relSlug)) report.missingTerms.push(relSlug)
          continue
        }
        const targetId = termIdBySlug[relSlug]
        if (!targetId) continue

        const { data: existingRel } = await supabase
          .from('glossary_term_related')
          .select('term_id')
          .eq('term_id', sourceId)
          .eq('related_term_id', targetId)
          .maybeSingle()

        if (existingRel) {
          report.relatedAlreadyExisting++
          continue
        }

        const { error: relErr } = await supabase
          .from('glossary_term_related')
          .insert({ term_id: sourceId, related_term_id: targetId })

        if (relErr) {
          console.error(`  X related ${term.id} → ${relSlug}: ${relErr.message}`)
        } else {
          report.relatedInserted++
        }
      }
    }
  } else {
    for (const term of terms) {
      const related = term.related || []
      for (const relSlug of related) {
        if (!knownIds.has(relSlug)) {
          report.brokenRelated.push({ term: term.id, missingRelated: relSlug })
          if (!report.missingTerms.includes(relSlug)) report.missingTerms.push(relSlug)
        } else {
          report.relatedInserted++
        }
      }
    }
  }

  const reportPath = path.resolve(__dirname, 'seed-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log('\n=== Resumen ===')
  console.log(`Términos insertados:     ${report.termsInserted}`)
  console.log(`Ya existentes (skip):    ${report.termsAlreadyExisting}`)
  console.log(`Términos fallidos:       ${report.termsFailed.length}`)
  console.log(`Related insertados:      ${report.relatedInserted}`)
  console.log(`Related rotos:           ${report.brokenRelated.length}`)
  console.log(`Slugs ausentes únicos:   ${report.missingTerms.length}`)
  console.log(`Report → ${reportPath}`)
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
