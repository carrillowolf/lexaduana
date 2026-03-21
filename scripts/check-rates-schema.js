import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
  // Check current_exchange_rates
  const { data: current, error: e1 } = await supabase
    .from('current_exchange_rates')
    .select('*')
    .limit(2)
  console.log('=== current_exchange_rates ===')
  if (e1) console.log('Error:', e1.message)
  else { console.log('Columns:', Object.keys(current[0] || {})); console.log('Sample:', current) }

  // Check upcoming_exchange_rates
  const { data: upcoming, error: e2 } = await supabase
    .from('upcoming_exchange_rates')
    .select('*')
    .limit(2)
  console.log('\n=== upcoming_exchange_rates ===')
  if (e2) console.log('Error:', e2.message)
  else { console.log('Columns:', Object.keys(upcoming[0] || {})); console.log('Sample:', upcoming); console.log('Count:', upcoming.length) }

  // Check base exchange_rates table
  const { data: base, error: e3 } = await supabase
    .from('exchange_rates')
    .select('*')
    .limit(2)
  console.log('\n=== exchange_rates (base) ===')
  if (e3) console.log('Error:', e3.message)
  else { console.log('Columns:', Object.keys(base[0] || {})); console.log('Sample:', base) }
}

check()
