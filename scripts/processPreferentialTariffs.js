import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function processPreferentialTariffs() {
  console.log('🚀 Procesando Excel de aranceles preferenciales...\n');

  // Leer el Excel
  const workbook = XLSX.readFile('Duties Import 0199 OCT.xlsx');
  const worksheet = workbook.Sheets['Export Worksheet'];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 Total registros en Excel: ${data.length.toLocaleString()}\n`);

  // Filtrar solo "Tariff preference" (aranceles preferenciales)
  const preferentialData = data.filter(row => {
    return row['Measure type'] === 'Tariff preference' && 
           row['Origin code'] && 
           row['Origin code'] !== '1011' && // Excluir ERGA OMNES
           row['Goods code'];
  });

  console.log(`✅ Registros de aranceles preferenciales: ${preferentialData.length.toLocaleString()}\n`);

  // Preparar datos para insertar
  const recordsToInsert = [];
  const errors = [];

  preferentialData.forEach((row, index) => {
    try {
      // Extraer el porcentaje del campo "Duty"
      let dutyRate = 0;
      const dutyText = row['Duty'];
      
      if (dutyText) {
        // Extraer número del formato "0.000 % " o "5.5 %"
        const match = dutyText.match(/([\d.]+)\s*%/);
        if (match) {
          dutyRate = parseFloat(match[1]);
        }
      }

      recordsToInsert.push({
        goods_code: row['Goods code'],
        country_code: row['Origin code'],
        country_name: row['Origin'],
        preferential_duty: dutyRate,
        measure_type: row['Measure type'],
        legal_base: row['Legal base'],
        start_date: row['Start date'] || null,
        end_date: row['End date'] || null
      });

      // Log de progreso cada 10,000 registros
      if ((index + 1) % 10000 === 0) {
        console.log(`   Procesados: ${(index + 1).toLocaleString()} / ${preferentialData.length.toLocaleString()}`);
      }

    } catch (error) {
      errors.push({
        row: index + 1,
        data: row,
        error: error.message
      });
    }
  });

  console.log(`\n✅ Registros preparados: ${recordsToInsert.length.toLocaleString()}`);
  
  if (errors.length > 0) {
    console.log(`⚠️  Errores encontrados: ${errors.length}`);
    console.log('Primeros 3 errores:', errors.slice(0, 3));
  }

  // Estadísticas
  const countriesSet = new Set(recordsToInsert.map(r => r.country_code));
  const hsCodesSet = new Set(recordsToInsert.map(r => r.goods_code));
  
  console.log(`\n📈 Estadísticas:`);
  console.log(`   Países únicos: ${countriesSet.size}`);
  console.log(`   Códigos HS únicos: ${hsCodesSet.size}`);
  
  // Muestra de países
  console.log(`\n🌍 Muestra de países con aranceles preferenciales:`);
  Array.from(countriesSet).slice(0, 10).forEach(code => {
    const example = recordsToInsert.find(r => r.country_code === code);
    console.log(`   ${code}: ${example.country_name}`);
  });

  // Preguntar antes de insertar
  console.log(`\n⚠️  ¿PROCEDER A INSERTAR ${recordsToInsert.length.toLocaleString()} REGISTROS EN SUPABASE?`);
  console.log(`   Esto puede tardar varios minutos...`);
  console.log(`\n   Descomenta la línea "await insertRecords..." para ejecutar.\n`);

  // DESCOMENTAR PARA EJECUTAR LA INSERCIÓN:
  await insertRecords(recordsToInsert);
}

async function insertRecords(records) {
  console.log('\n🔄 Iniciando inserción en Supabase...\n');

  const BATCH_SIZE = 1000;
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    
    try {
      const { data, error } = await supabase
        .from('preferential_tariffs')
        .insert(batch);

      if (error) {
        console.error(`❌ Error en batch ${i / BATCH_SIZE + 1}:`, error.message);
        failed += batch.length;
      } else {
        inserted += batch.length;
        console.log(`✅ Batch ${i / BATCH_SIZE + 1}: ${inserted.toLocaleString()} / ${records.length.toLocaleString()} insertados`);
      }
    } catch (error) {
      console.error(`❌ Error inesperado en batch ${i / BATCH_SIZE + 1}:`, error.message);
      failed += batch.length;
    }

    // Pausa breve entre batches para no saturar Supabase
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✅ PROCESO COMPLETADO`);
  console.log(`   Insertados: ${inserted.toLocaleString()}`);
  console.log(`   Fallidos: ${failed.toLocaleString()}`);
}

// Ejecutar
processPreferentialTariffs().catch(console.error);
