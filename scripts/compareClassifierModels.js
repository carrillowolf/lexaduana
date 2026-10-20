/**
 * Prueba un modelo de Claude con los prompts del clasificador y del OCR de
 * facturas antes de cambiarlo en producción.
 *
 * - Clasificador: toma las últimas descripciones reales de classification_logs,
 *   las clasifica con el modelo y compara con el código que se dio entonces
 *   (coincidencia a 4, 6 y 10 dígitos) y con declarable_codes.
 * - Facturas: extrae los PDF de test-invoices/ y muestra los campos principales.
 *
 * Requiere ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
 *
 * Uso:
 *   node scripts/compareClassifierModels.js [--model=claude-haiku-5-5] [--limit=20] [--skip-invoices] [--out=/ruta/resultados.json]
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { CLAUDE_MODEL, getResponseText } from '../lib/claudeModel.js'
import { buildClassificationPrompt } from '../lib/classifierPrompt.js'
import { INVOICE_EXTRACTION_PROMPT } from '../lib/invoicePrompt.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') })

const args = process.argv.slice(2)
const arg = name => args.find(a => a.startsWith(`--${name}=`))?.split('=')[1] || null
const MODEL = arg('model') || CLAUDE_MODEL
const LIMIT = Number(arg('limit') || 20)
const OUT = arg('out')

// $/millón de tokens (entrada, salida) para estimar el coste
const PRICES = {
  'claude-haiku-5-5': [0.10, 0.50],
  'claude-sonnet-5-5': [2, 10],
  'claude-sonnet-4-5-20250929': [3, 15],
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Falta ANTHROPIC_API_KEY')
  process.exit(1)
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

function cost(usage) {
  const [inPrice, outPrice] = PRICES[MODEL] || [0, 0]
  return (usage.input_tokens * inPrice + usage.output_tokens * outPrice) / 1e6
}

function parseJson(text) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No hay JSON en la respuesta')
  return JSON.parse(match[0])
}

async function classify(description) {
  const start = Date.now()
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8000,
    output_config: { effort: 'medium' },
    messages: [{ role: 'user', content: buildClassificationPrompt({ description }) }],
  })
  return { result: parseJson(getResponseText(message)), usage: message.usage, ms: Date.now() - start }
}

async function compareClassifier() {
  const { data, error } = await supabase
    .from('classification_logs')
    .select('description, suggested_code, confidence, model_used, created_at')
    .order('created_at', { ascending: false })
    .limit(LIMIT * 3)
  if (error) throw error

  // Descripciones distintas, las más recientes primero
  const seen = new Set()
  const cases = data.filter(r => !seen.has(r.description) && seen.add(r.description)).slice(0, LIMIT)

  console.log(`\n📊 Clasificador: ${cases.length} descripciones de classification_logs con ${MODEL}\n`)
  const rows = []
  for (const c of cases) {
    try {
      const { result, usage, ms } = await classify(c.description)
      const code = String(result.primaryCode || '').replace(/\D/g, '')
      const { data: leaf } = await supabase
        .from('declarable_codes').select('goods_code').eq('goods_code', code).eq('is_leaf', true).maybeSingle()
      const prev = c.suggested_code || ''
      const row = {
        description: c.description,
        previous: { code: prev, confidence: c.confidence, model: c.model_used },
        current: { code, confidence: result.confidence, isLeaf: !!leaf },
        match4: code.slice(0, 4) === prev.slice(0, 4),
        match6: code.slice(0, 6) === prev.slice(0, 6),
        match10: code === prev,
        usage, cost: cost(usage), ms,
      }
      rows.push(row)
      const mark = row.match10 ? '✅' : row.match6 ? '🟡' : row.match4 ? '🟠' : '❌'
      console.log(`${mark} ${prev} → ${code}${leaf ? '' : ' (no es hoja)'}  ${c.description.slice(0, 60)}`)
    } catch (err) {
      rows.push({ description: c.description, error: err.message })
      console.log(`💥 ${err.message}  ${c.description.slice(0, 60)}`)
    }
  }

  const ok = rows.filter(r => !r.error)
  const pct = n => `${n}/${ok.length} (${ok.length ? Math.round(n / ok.length * 100) : 0}%)`
  console.log(`\n   Coincide partida (4 dígitos):    ${pct(ok.filter(r => r.match4).length)}`)
  console.log(`   Coincide subpartida (6 dígitos): ${pct(ok.filter(r => r.match6).length)}`)
  console.log(`   Coincide código (10 dígitos):    ${pct(ok.filter(r => r.match10).length)}`)
  console.log(`   Código declarable válido:        ${pct(ok.filter(r => r.current.isLeaf).length)}`)
  console.log(`   Errores:                         ${rows.length - ok.length}`)
  if (ok.length) {
    const avg = f => ok.reduce((s, r) => s + f(r), 0) / ok.length
    console.log(`   Media: ${Math.round(avg(r => r.usage.input_tokens))} tokens entrada, ${Math.round(avg(r => r.usage.output_tokens))} salida, ${(avg(r => r.ms) / 1000).toFixed(1)}s, $${avg(r => r.cost).toFixed(5)} por clasificación`)
  }
  return rows
}

async function compareInvoices() {
  const dir = path.resolve(__dirname, '..', 'test-invoices')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf')).sort()
  console.log(`\n📄 Facturas: ${files.length} PDF de test-invoices/ con ${MODEL}\n`)
  const rows = []
  for (const file of files) {
    const start = Date.now()
    try {
      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 16000,
        output_config: { effort: 'low' },
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fs.readFileSync(path.join(dir, file)).toString('base64') } },
            { type: 'text', text: INVOICE_EXTRACTION_PROMPT },
          ],
        }],
      })
      const data = parseJson(getResponseText(message))
      rows.push({ file, data, usage: message.usage, cost: cost(message.usage), ms: Date.now() - start })
      console.log(`✅ ${file}: ${JSON.stringify(data).length} caracteres de JSON, ${data.lines?.length ?? 0} líneas, $${cost(message.usage).toFixed(5)}`)
      console.log(`   ${JSON.stringify(data).slice(0, 400)}`)
    } catch (err) {
      rows.push({ file, error: err.message })
      console.log(`💥 ${file}: ${err.message}`)
    }
  }
  return rows
}

async function main() {
  const results = { model: MODEL, date: new Date().toISOString() }
  results.classifier = await compareClassifier()
  if (!args.includes('--skip-invoices')) results.invoices = await compareInvoices()
  if (OUT) {
    fs.writeFileSync(OUT, JSON.stringify(results, null, 2))
    console.log(`\n💾 Resultados completos en ${OUT}`)
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
