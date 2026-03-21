/**
 * Actualización de tipos de cambio BCE - Marzo 2026
 *
 * Fuentes:
 *   ACTUALES:  BOE-A-2026-3809 (17 feb 2026) → vigentes desde 1 marzo 2026
 *   PRÓXIMOS:  BOE-A-2026-6470 (18 mar 2026) → vigentes desde 1 abril 2026
 *
 * Uso: node scripts/update-rates.js [--dry-run]
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Cargar .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const isDryRun = process.argv.includes('--dry-run')

// ============================================================
// DATOS: BOE-A-2026-3809 (17 feb 2026) → vigentes 1 marzo 2026
// ============================================================
const currentRates = [
  { currency_code: 'AUD', currency_name: 'Dólar australiano',    rate: 1.6776 },
  { currency_code: 'BRL', currency_name: 'Real brasileño',       rate: 6.1788 },
  { currency_code: 'CAD', currency_name: 'Dólar canadiense',     rate: 1.6149 },
  { currency_code: 'CHF', currency_name: 'Franco suizo',         rate: 0.9116 },
  { currency_code: 'CNY', currency_name: 'Yuan renminbi chino',  rate: 8.1702 },
  { currency_code: 'CZK', currency_name: 'Corona checa',         rate: 24.276 },
  { currency_code: 'DKK', currency_name: 'Corona danesa',        rate: 7.4706 },
  { currency_code: 'GBP', currency_name: 'Libra esterlina',      rate: 0.87330 },
  { currency_code: 'HKD', currency_name: 'Dólar de Hong Kong',   rate: 9.2428 },
  { currency_code: 'HUF', currency_name: 'Forinto húngaro',      rate: 378.43 },
  { currency_code: 'IDR', currency_name: 'Rupia indonesia',      rate: 19901.98 },
  { currency_code: 'ILS', currency_name: 'Shekel israelí',       rate: 3.6720 },
  { currency_code: 'INR', currency_name: 'Rupia india',          rate: 107.2565 },
  { currency_code: 'ISK', currency_name: 'Corona islandesa',     rate: 145.00 },
  { currency_code: 'JPY', currency_name: 'Yen japonés',          rate: 181.06 },
  { currency_code: 'KRW', currency_name: 'Won surcoreano',       rate: 1709.83 },
  { currency_code: 'MXN', currency_name: 'Peso mexicano',        rate: 20.3572 },
  { currency_code: 'MYR', currency_name: 'Ringgit malasio',      rate: 4.6121 },
  { currency_code: 'NOK', currency_name: 'Corona noruega',       rate: 11.2815 },
  { currency_code: 'NZD', currency_name: 'Dólar neozelandés',    rate: 1.9623 },
  { currency_code: 'PHP', currency_name: 'Peso filipino',        rate: 68.395 },
  { currency_code: 'PLN', currency_name: 'Zloty polaco',         rate: 4.2138 },
  { currency_code: 'RON', currency_name: 'Leu rumano',           rate: 5.0967 },
  { currency_code: 'SEK', currency_name: 'Corona sueca',         rate: 10.6480 },
  { currency_code: 'SGD', currency_name: 'Dólar de Singapur',    rate: 1.4946 },
  { currency_code: 'THB', currency_name: 'Baht tailandés',       rate: 37.021 },
  { currency_code: 'TRY', currency_name: 'Lira turca',           rate: 51.7114 },
  { currency_code: 'USD', currency_name: 'Dólar USA',            rate: 1.1826 },
  { currency_code: 'ZAR', currency_name: 'Rand sudafricano',     rate: 19.0320 },
].map(r => ({
  ...r,
  effective_from: '2026-03-01',
  publication_date: '2026-02-18',
  boe_reference: 'BOE-A-2026-3809',
}))

// ============================================================
// DATOS: BOE-A-2026-6470 (18 mar 2026) → vigentes 1 abril 2026
// ============================================================
const upcomingRates = [
  { currency_code: 'AUD', currency_name: 'Dólar australiano',    rate: 1.6305 },
  { currency_code: 'BRL', currency_name: 'Real brasileño',       rate: 6.0079 },
  { currency_code: 'CAD', currency_name: 'Dólar canadiense',     rate: 1.5774 },
  { currency_code: 'CHF', currency_name: 'Franco suizo',         rate: 0.9073 },
  { currency_code: 'CNY', currency_name: 'Yuan renminbi chino',  rate: 7.9214 },
  { currency_code: 'CZK', currency_name: 'Corona checa',         rate: 24.467 },
  { currency_code: 'DKK', currency_name: 'Corona danesa',        rate: 7.4720 },
  { currency_code: 'GBP', currency_name: 'Libra esterlina',      rate: 0.86393 },
  { currency_code: 'HKD', currency_name: 'Dólar de Hong Kong',   rate: 9.0135 },
  { currency_code: 'HUF', currency_name: 'Forinto húngaro',      rate: 392.83 },
  { currency_code: 'IDR', currency_name: 'Rupia indonesia',      rate: 19543.10 },
  { currency_code: 'ILS', currency_name: 'Shekel israelí',       rate: 3.5680 },
  { currency_code: 'INR', currency_name: 'Rupia india',          rate: 106.8300 },
  { currency_code: 'ISK', currency_name: 'Corona islandesa',     rate: 143.60 },
  { currency_code: 'JPY', currency_name: 'Yen japonés',          rate: 183.49 },
  { currency_code: 'KRW', currency_name: 'Won surcoreano',       rate: 1729.08 },
  { currency_code: 'MXN', currency_name: 'Peso mexicano',        rate: 20.3942 },
  { currency_code: 'MYR', currency_name: 'Ringgit malasio',      rate: 4.5040 },
  { currency_code: 'NOK', currency_name: 'Corona noruega',       rate: 11.0205 },
  { currency_code: 'NZD', currency_name: 'Dólar neozelandés',    rate: 1.9763 },
  { currency_code: 'PHP', currency_name: 'Peso filipino',        rate: 69.001 },
  { currency_code: 'PLN', currency_name: 'Zloty polaco',         rate: 4.2713 },
  { currency_code: 'RON', currency_name: 'Leu rumano',           rate: 5.0938 },
  { currency_code: 'SEK', currency_name: 'Corona sueca',         rate: 10.7778 },
  { currency_code: 'SGD', currency_name: 'Dólar de Singapur',    rate: 1.4734 },
  { currency_code: 'THB', currency_name: 'Baht tailandés',       rate: 37.565 },
  { currency_code: 'TRY', currency_name: 'Lira turca',           rate: 50.8539 },
  { currency_code: 'USD', currency_name: 'Dólar USA',            rate: 1.1500 },
  { currency_code: 'ZAR', currency_name: 'Rand sudafricano',     rate: 19.4174 },
].map(r => ({
  ...r,
  effective_from: '2026-04-01',
  publication_date: '2026-03-19',
  boe_reference: 'BOE-A-2026-6470',
}))

async function run() {
  console.log(isDryRun ? '🔍 DRY RUN - no se escribirá en Supabase\n' : '🚀 Ejecutando actualización...\n')

  // --- CURRENT ---
  console.log(`📊 Tipos ACTUALES: ${currentRates.length} monedas (BOE-A-2026-3809, vigentes desde 2026-03-01)`)
  if (isDryRun) {
    currentRates.forEach(r => console.log(`   ${r.currency_code}  ${r.rate}`))
  } else {
    // Borrar existentes
    const { error: delErr1 } = await supabase.from('current_exchange_rates').delete().gte('currency_code', '')
    if (delErr1) { console.error('❌ Error borrando current:', delErr1.message); process.exit(1) }

    // Insertar nuevos
    const { data: ins1, error: insErr1 } = await supabase.from('current_exchange_rates').insert(currentRates).select()
    if (insErr1) { console.error('❌ Error insertando current:', insErr1.message); process.exit(1) }
    console.log(`   ✅ ${ins1.length} registros insertados en current_exchange_rates`)
  }

  // --- UPCOMING ---
  console.log(`\n📅 Tipos PRÓXIMOS: ${upcomingRates.length} monedas (BOE-A-2026-6470, vigentes desde 2026-04-01)`)
  if (isDryRun) {
    upcomingRates.forEach(r => console.log(`   ${r.currency_code}  ${r.rate}`))
  } else {
    const { error: delErr2 } = await supabase.from('upcoming_exchange_rates').delete().gte('currency_code', '')
    if (delErr2) { console.error('❌ Error borrando upcoming:', delErr2.message); process.exit(1) }

    const { data: ins2, error: insErr2 } = await supabase.from('upcoming_exchange_rates').insert(upcomingRates).select()
    if (insErr2) { console.error('❌ Error insertando upcoming:', insErr2.message); process.exit(1) }
    console.log(`   ✅ ${ins2.length} registros insertados en upcoming_exchange_rates`)
  }

  console.log('\n🎉 Actualización completada')
  console.log('   Banner se activará automáticamente el 25 de marzo (7 días antes del 1 de abril)')
}

run().catch(err => { console.error('❌ Error:', err); process.exit(1) })
