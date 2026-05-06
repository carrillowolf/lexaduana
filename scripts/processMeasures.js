// Script para procesar los CSV y subirlos a Supabase
import fs from 'fs'
import csv from 'csv-parser'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Cargar .env.local desde la raíz del proyecto (un nivel arriba)
const envPath = path.resolve(__dirname, '..', '.env.local')
console.log('📂 Buscando .env.local en:', envPath)

const result = dotenv.config({ path: envPath })

if (result.error) {
  console.error('❌ Error cargando .env.local:', result.error)
  process.exit(1)
}

// DEBUG: Verificar que las variables se cargaron
console.log('🔑 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌')
console.log('🔑 KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌')
console.log('')

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Faltan variables de entorno')
  process.exit(1)
}

// Configurar Supabase desde .env.local
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Mapeo de códigos de certificados a descripciones cortas
const CERT_DESCRIPTIONS = {
  'C074': '📋 Certificado fitosanitario',
  'C078': '📋 Certificado de origen',
  'Y864': '🏥 Certificado sanitario',
  'U088': '📊 Licencia de importación',
  'C075': '🌾 Certificado agricultura ecológica',
  // Añadir más según vayas identificando
}

// Mapeo de tipos de medida
const MEASURE_TYPES = {
  '103': 'Arancel preferencial',
  '105': 'Cuota arancelaria',
  '123': 'Licencia requerida',
  '142': 'Arancel adicional',
  '410': 'Control veterinario',
  '695': 'Sanciones',
  '750': 'Control productos orgánicos'
}

async function processMeasureConditions() {
  const alerts = []
  
  console.log('📂 Leyendo measure_conditions.csv...')
  
  // Leer CSV de condiciones
  fs.createReadStream('measure_conditions.csv')
    .pipe(csv({ 
      separator: ';',
      mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, '') // Eliminar BOM
    }))
    .on('data', (row) => {
    
    // Solo procesar si tiene certificado o condición importante
    if (row.Certificate || row['Cond. amount']) {
      const alert = {
        goods_code: row['Goods code']?.substring(0, 10),
        measure_code: row['Meas. type code'],
        alert_type: determinateAlertType(row),
        short_text: generateShortText(row),
        full_text: generateFullText(row),
        origin_code: row['Origin code'] || 'ALL',
        certificate: row.Certificate,
        priority: calculatePriority(row)
      }
      
      // Solo añadir si es relevante
      if (alert.short_text && alert.goods_code) {
        alerts.push(alert)
      }
    }
  })
  .on('end', async () => {
    console.log(`\n📊 Procesadas ${alerts.length} alertas`)
      
      // Subir a Supabase en lotes
      const batchSize = 1000
      for (let i = 0; i < alerts.length; i += batchSize) {
        const batch = alerts.slice(i, i + batchSize)
        
        const { error } = await supabase
          .from('measure_alerts')
          .insert(batch)
        
        if (error) {
          console.error(`❌ Error en lote ${i}:`, error)
        } else {
          console.log(`✅ Subido lote ${i / batchSize + 1}`)
        }
      }
      
      console.log(`\n🎉 Proceso completado: ${alerts.length} alertas subidas a Supabase`)
    })
}

function determinateAlertType(row) {
  if (row.Certificate) return 'certificate'
  if (row['Cond. amount']) return 'quota'
  if (row['Meas. type code'] === '695') return 'sanction'
  return 'condition'
}

function generateShortText(row) {
  // Generar texto corto y claro
  if (row.Certificate) {
    return CERT_DESCRIPTIONS[row.Certificate] || `📋 Certificado ${row.Certificate} requerido`
  }
  
  if (row['Cond. amount'] && row['Mon. unit']) {
    return `📊 Cuota: ${row['Cond. amount']} ${row['Mon. unit']}`
  }
  
  if (row['Meas. type code']) {
    return MEASURE_TYPES[row['Meas. type code']] || `Medida ${row['Meas. type code']}`
  }
  
  return null
}

function generateFullText(row) {
  // Texto completo con toda la información
  let text = `Código de medida: ${row['Meas. type code']}\n`
  
  if (row.Certificate) {
    text += `Certificado requerido: ${row.Certificate}\n`
  }
  
  if (row['Origin code']) {
    text += `Aplicable a: ${row['Origin code']}\n`
  }
  
  if (row['Cond. amount']) {
    text += `Cantidad/Valor: ${row['Cond. amount']} ${row['Mon. unit'] || row['Meas. unit'] || ''}\n`
  }
  
  if (row['Start date']) {
    text += `Vigente desde: ${row['Start date']}\n`
  }
  
  if (row['End date']) {
    text += `Vigente hasta: ${row['End date']}\n`
  }
  
  return text
}

function calculatePriority(row) {
  // 1 = crítico, 2 = importante, 3 = informativo
  if (row.Certificate) return 2
  if (row['Meas. type code'] === '695') return 1 // Sanciones
  if (row['Cond. amount']) return 2
  return 3
}

// Ejecutar
console.log('🚀 Iniciando procesamiento...\n')
processMeasureConditions()