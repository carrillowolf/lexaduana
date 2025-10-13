import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function testAlerts() {
  const testCode = '3926909790'
  
  console.log(`🔍 Buscando alertas para código: ${testCode}\n`)
  
  const { data, error } = await supabase
    .from('measure_alerts')
    .select('*')
    .eq('goods_code', testCode)
  
  if (error) {
    console.error('❌ Error:', error)
  } else {
    console.log(`✅ Encontradas ${data?.length || 0} alertas:\n`)
    data?.forEach((alert, i) => {
      console.log(`--- Alerta ${i+1} ---`)
      console.log(`Tipo: ${alert.alert_type}`)
      console.log(`Código medida: ${alert.measure_code}`)
      console.log(`Texto: ${alert.short_text}`)
      console.log(`Certificado: ${alert.certificate || 'N/A'}`)
      console.log(`Origen aplicable: ${alert.origin_code || 'TODOS'}`)
      console.log(`Prioridad: ${alert.priority}`)
      console.log(`\nTexto completo:\n${alert.full_text}\n`)
    })
  }
}

testAlerts()
