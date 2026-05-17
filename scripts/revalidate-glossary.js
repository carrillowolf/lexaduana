/**
 * Script CLI para revalidar slugs del glosario en producción/preview.
 *
 * Uso:
 *   node scripts/revalidate-glossary.js taric codigo-hs nomenclatura-combinada
 *   node scripts/revalidate-glossary.js --all
 *
 * Variables de entorno (en .env.local):
 *   GLOSSARY_REVALIDATE_URL    Ej: https://lexaduana.es/api/revalidate/glossary
 *                              o el preview URL de Vercel.
 *   GLOSSARY_REVALIDATE_SECRET El mismo valor configurado en Vercel.
 */

import 'dotenv/config'

const url = process.env.GLOSSARY_REVALIDATE_URL
const secret = process.env.GLOSSARY_REVALIDATE_SECRET

if (!url || !secret) {
  console.error('Faltan GLOSSARY_REVALIDATE_URL o GLOSSARY_REVALIDATE_SECRET en .env.local')
  process.exit(1)
}

const args = process.argv.slice(2)
const all = args.includes('--all')
const slugs = args.filter((a) => !a.startsWith('--'))

if (!all && slugs.length === 0) {
  console.error('Indica al menos un slug o usa --all.')
  console.error('Ej: node scripts/revalidate-glossary.js taric codigo-hs')
  process.exit(1)
}

const body = all ? { secret, all: true } : { secret, slugs }

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
})

const json = await res.json().catch(() => ({ error: 'Non-JSON response' }))
console.log('Status:', res.status)
console.log('Response:', JSON.stringify(json, null, 2))

if (!res.ok) process.exit(1)
