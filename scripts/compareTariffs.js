import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function compareTariffs(newExcelFile, changeDate) {
  console.log('🔍 COMPARADOR DE ARANCELES TARIC\n');
  console.log(`📅 Fecha de cambios: ${changeDate}`);
  console.log(`📁 Archivo nuevo: ${newExcelFile}\n`);

  // 1. Leer Excel nuevo y crear mapa único
  console.log('📊 Leyendo Excel nuevo...');
  const workbook = XLSX.readFile(newExcelFile);
  const worksheet = workbook.Sheets['Export Worksheet'];
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });

  console.log(`   Total filas en Excel: ${data.length.toLocaleString()}`);

  const excelMap = new Map();

  data
    .filter(row =>
      row['Measure type'] === 'Tariff preference' &&
      row['Origin code'] &&
      row['Origin code'] !== '1011' &&
      row['Goods code']
    )
    .forEach(row => {
      const dutyText = row['Duty'];
      let dutyRate = 0;
      if (dutyText) {
        const match = dutyText.match(/([\d.]+)\s*%/);
        if (match) dutyRate = parseFloat(match[1]);
      }

      const key = `${row['Goods code']}-${row['Origin code']}`;
      excelMap.set(key, dutyRate);
    });

  console.log(`✅ Combinaciones únicas en Excel: ${excelMap.size.toLocaleString()}\n`);

  // 2. Obtener aranceles actuales de BD
  console.log('🗄️  Obteniendo aranceles actuales de BD...');
  // Obtener TODOS los registros sin límite de 1000
  let allTariffs = [];
  let from = 0;
  const BATCH_SIZE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('preferential_tariffs')
      .select('goods_code, country_code, preferential_duty')
      .range(from, from + BATCH_SIZE - 1);

    if (error) {
      console.error('❌ Error:', error);
      break;
    }

    if (!data || data.length === 0) break;

    allTariffs = allTariffs.concat(data);
    console.log(`   Cargados: ${allTariffs.length.toLocaleString()} registros...`);

    if (data.length < BATCH_SIZE) break; // Última página
    from += BATCH_SIZE;
  }

  const currentTariffs = allTariffs;

  if (currentTariffs.length === 0) {
    console.error('❌ No se pudieron cargar datos de BD');
    return;
  }

  const currentMap = new Map();
  currentTariffs.forEach(t => {
    const key = `${t.goods_code}-${t.country_code}`;
    currentMap.set(key, parseFloat(t.preferential_duty));
  });

  console.log(`✅ Combinaciones únicas en BD: ${currentMap.size.toLocaleString()}\n`);

  // 3. DEBUG: Comparar muestras
  console.log('🔍 DEBUG: Comparación de claves\n');

  const excelKeys = Array.from(excelMap.keys()).sort();
  const dbKeys = Array.from(currentMap.keys()).sort();

  console.log('📋 Primeras 10 claves en Excel:');
  excelKeys.slice(0, 10).forEach(key => {
    const inDB = currentMap.has(key) ? '✅' : '❌';
    console.log(`   ${inDB} ${key} = ${excelMap.get(key)}%`);
  });

  console.log('\n📋 Primeras 10 claves en BD:');
  dbKeys.slice(0, 10).forEach(key => {
    const inExcel = excelMap.has(key) ? '✅' : '❌';
    console.log(`   ${inExcel} ${key} = ${currentMap.get(key)}%`);
  });

  // 4. Detectar diferencias
  console.log('\n🔍 Analizando diferencias...\n');

  const changes = {
    new: [],
    modified: [],
    deleted: []
  };

  // Nuevos: en Excel pero NO en BD
  excelMap.forEach((duty, key) => {
    if (!currentMap.has(key)) {
      const [goods_code, country_code] = key.split('-');
      changes.new.push({ goods_code, country_code, new_duty: duty });
    }
  });

  // Modificados: en ambos pero diferente valor
  excelMap.forEach((newDuty, key) => {
    if (currentMap.has(key)) {
      const oldDuty = currentMap.get(key);
      if (Math.abs(oldDuty - newDuty) > 0.001) {
        const [goods_code, country_code] = key.split('-');
        changes.modified.push({
          goods_code,
          country_code,
          old_duty: oldDuty,
          new_duty: newDuty,
          difference: newDuty - oldDuty
        });
      }
    }
  });

  // Eliminados: en BD pero NO en Excel
  currentMap.forEach((duty, key) => {
    if (!excelMap.has(key)) {
      const [goods_code, country_code] = key.split('-');
      changes.deleted.push({ goods_code, country_code, old_duty: duty });
    }
  });

  // 5. Mostrar resumen
  console.log('📊 RESUMEN DE CAMBIOS:');
  console.log(`   ✨ Nuevos aranceles: ${changes.new.length.toLocaleString()}`);
  console.log(`   📝 Modificados: ${changes.modified.length.toLocaleString()}`);
  console.log(`   🗑️  Eliminados: ${changes.deleted.length.toLocaleString()}\n`);

  if (changes.new.length > 0) {
    console.log('✨ MUESTRA DE NUEVOS (primeros 10):');
    changes.new.slice(0, 10).forEach(c => {
      console.log(`   ${c.goods_code} - ${c.country_code}: ${c.new_duty}%`);
    });
    console.log('');
  }

  if (changes.modified.length > 0) {
    console.log('📝 MUESTRA DE MODIFICADOS (primeros 5):');
    changes.modified.slice(0, 5).forEach(c => {
      const arrow = c.difference > 0 ? '📈' : '📉';
      console.log(`   ${arrow} ${c.goods_code} - ${c.country_code}: ${c.old_duty}% → ${c.new_duty}%`);
    });
    console.log('');
  }

  return changes;
}

// Ejecutar
const newFile = process.argv[2] || 'duties_oct.xlsx';
const changeDate = process.argv[3] || new Date().toISOString().split('T')[0];

compareTariffs(newFile, changeDate).catch(console.error);