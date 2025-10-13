// Script para procesar measure_exclusions.csv y subirlo a Supabase
import fs from 'fs'
import csv from 'csv-parser'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Cargar .env.local desde la raíz del proyecto
const envPath = path.resolve(__dirname, '..', '.env.local')
console.log('📂 Buscando .env.local en:', envPath)

const result = dotenv.config({ path: envPath })

if (result.error) {
  console.error('❌ Error cargando .env.local:', result.error)
  process.exit(1)
}

// Verificar variables de entorno
console.log('🔑 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌')
console.log('🔑 KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅' : '❌')
console.log('')

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Faltan variables de entorno')
  process.exit(1)
}

// Configurar Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function processExclusions() {
  const exclusions = []
  
  console.log('📂 Leyendo measure_exclusions.csv...')
  
  fs.createReadStream('measure_exclusions.csv')
    .pipe(csv({ 
      separator: ';',
      mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, '') // Eliminar BOM
    }))
    .on('data', (row) => {
      // Procesar cada fila
      if (row['Goods code'] && row['Excluded country code']) {
        const exclusion = {
          goods_code: row['Goods code']?.substring(0, 10),
          measure_type_code: row['Meas. type code']?.trim() || null,
          measure_description: row['Measure type']?.trim() || null,
          excluded_country_name: row['Excluded country code']?.trim(),
          excluded_country_code: row['Excluded country']?.trim() || null,
          origin_scope: row['Origin']?.trim() || null
        }
        
        // Solo añadir si tiene los datos mínimos necesarios
        if (exclusion.goods_code && exclusion.excluded_country_code) {
          exclusions.push(exclusion)
        }
      }
    })
    .on('end', async () => {
      console.log(`\n📊 Procesadas ${exclusions.length} exclusiones`)
      
      if (exclusions.length === 0) {
        console.log('⚠️ No hay exclusiones para subir')
        return
      }
      
      // Subir a Supabase en lotes de 1000
      const batchSize = 1000
      let inserted = 0
      
      for (let i = 0; i < exclusions.length; i += batchSize) {
        const batch = exclusions.slice(i, i + batchSize)
        
        const { error } = await supabase
          .from('measure_exclusions')
          .insert(batch)
        
        if (error) {
          console.error(`❌ Error en lote ${i / batchSize + 1}:`, error.message)
        } else {
          inserted += batch.length
          console.log(`✅ Subido lote ${i / batchSize + 1} (${inserted}/${exclusions.length})`)
        }
      }
      
      console.log(`\n🎉 Proceso completado: ${inserted} exclusiones subidas a Supabase`)
    })
    .on('error', (error) => {
      console.error('❌ Error leyendo el CSV:', error)
    })
}

// Ejecutar
console.log('🚀 Iniciando procesamiento...\n')
processExclusions()
