// Script para ejecutar mensualmente (día 1 de cada mes)
// Puede ejecutarse manualmente o via GitHub Actions / Vercel Cron

import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import fetch from 'node-fetch'
import fs from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Service key con permisos admin
)

async function downloadLatestTariff() {
  // URL del Excel de EUR-Lex (actualizar mensualmente)
  const month = new Date().toISOString().slice(0, 7) // YYYY-MM
  const eurLexUrl = `https://eur-lex.europa.eu/taric/${month}/taric_data.xlsx`
  
  console.log(`📥 Descargando TARIC de ${month}...`)
  
  try {
    // Aquí pondrías la URL real cuando la tengamos
    // Por ahora simulamos con el archivo local
    const response = await fetch(eurLexUrl)
    const buffer = await response.buffer()
    fs.writeFileSync('temp_taric.xlsx', buffer)
    return 'temp_taric.xlsx'
  } catch (error) {
    console.error('Error descargando:', error)
    throw error
  }
}

async function processExcelFile(filepath) {
  const workbook = XLSX.readFile(filepath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 })
  
  const tariffs = []
  
  // Procesar cada fila (ajustar según formato real)
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (row[0] && row[4]) { // Si tiene código y arancel
      tariffs.push({
        goods_code: String(row[0]).padEnd(10, '0'),
        duty: parseFloat(String(row[4]).replace('%', '').trim())
      })
    }
  }
  
  return tariffs
}

async function detectChanges(newTariffs) {
  const changes = []
  const updateDate = new Date().toISOString().slice(0, 10)
  
  console.log(`🔍 Comparando ${newTariffs.length} aranceles...`)
  
  for (const newTariff of newTariffs) {
    // Obtener arancel actual de la BD
    const { data: currentTariff } = await supabase
      .from('tariffs')
      .select('duty')
      .eq('goods_code', newTariff.goods_code)
      .eq('origin', 'ERGA OMNES')
      .single()
    
    if (currentTariff && currentTariff.duty !== newTariff.duty) {
      // Cambio detectado!
      changes.push({
        goods_code: newTariff.goods_code,
        old_duty: currentTariff.duty,
        new_duty: newTariff.duty,
        change_detected: updateDate
      })
      
      console.log(`⚠️ Cambio detectado: ${newTariff.goods_code} de ${currentTariff.duty}% a ${newTariff.duty}%`)
    }
  }
  
  return changes
}

async function updateDatabase(newTariffs, changes) {
  // Registrar actualización del sistema
  const { data: updateLog } = await supabase
    .from('system_updates')
    .insert({
      update_type: 'monthly_update',
      file_source: 'EUR-Lex',
      total_changes: changes.length,
      status: 'processing'
    })
    .select()
    .single()
  
  try {
    // 1. Guardar cambios en histórico
    if (changes.length > 0) {
      await supabase.from('tariff_history').insert(changes)
      console.log(`✅ ${changes.length} cambios guardados en histórico`)
    }
    
    // 2. Actualizar tabla principal de aranceles
    for (const tariff of newTariffs) {
      await supabase
        .from('tariffs')
        .upsert({
          goods_code: tariff.goods_code,
          origin: 'ERGA OMNES',
          duty: tariff.duty,
          measure_type: 'Third country duty',
          legal_base: 'Updated ' + new Date().toISOString().slice(0, 10)
        }, {
          onConflict: 'goods_code,origin'
        })
    }
    
    // 3. Marcar actualización como completada
    await supabase
      .from('system_updates')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', updateLog.id)
    
    console.log('✅ Base de datos actualizada')
    
  } catch (error) {
    await supabase
      .from('system_updates')
      .update({ 
        status: 'failed',
        notes: error.message
      })
      .eq('id', updateLog.id)
    
    throw error
  }
  
  return changes
}

async function notifyUsers(changes) {
  if (changes.length === 0) {
    console.log('ℹ️ No hay cambios, no se envían notificaciones')
    return
  }
  
  // Obtener usuarios afectados por los cambios
  const affectedCodes = changes.map(c => c.goods_code)
  
  const { data: affectedMonitors } = await supabase
    .from('monitored_codes')
    .select(`
      *,
      user_profiles!inner(email, company_name)
    `)
    .in('goods_code', affectedCodes)
    .eq('notification_enabled', true)
  
  console.log(`📧 Preparando ${affectedMonitors?.length || 0} notificaciones...`)
  
  // Agrupar por usuario
  const notificationsByUser = {}
  
  affectedMonitors?.forEach(monitor => {
    const userId = monitor.user_id
    if (!notificationsByUser[userId]) {
      notificationsByUser[userId] = {
        email: monitor.user_profiles.email,
        company: monitor.user_profiles.company_name,
        changes: []
      }
    }
    
    const change = changes.find(c => c.goods_code === monitor.goods_code)
    if (change) {
      notificationsByUser[userId].changes.push({
        ...change,
        description: monitor.product_description
      })
    }
  })
  
  // Enviar emails (aquí integrarías con Resend, SendGrid, etc.)
  for (const [userId, userData] of Object.entries(notificationsByUser)) {
    await sendEmail(userData)
    
    // Registrar notificación enviada
    for (const change of userData.changes) {
      await supabase.from('notifications_sent').insert({
        user_id: userId,
        goods_code: change.goods_code,
        email_status: 'sent'
      })
    }
    
    // Actualizar última fecha de chequeo
    await supabase
      .from('monitored_codes')
      .update({ last_checked: new Date().toISOString().slice(0, 10) })
      .eq('user_id', userId)
      .in('goods_code', userData.changes.map(c => c.goods_code))
  }
  
  console.log('✅ Notificaciones enviadas')
}

async function sendEmail(userData) {
  // Aquí integrarías con tu servicio de email
  // Por ahora solo log
  console.log(`📧 Email a ${userData.email}:`)
  console.log(`   Empresa: ${userData.company || 'N/A'}`)
  userData.changes.forEach(change => {
    console.log(`   - ${change.goods_code}: ${change.old_duty}% → ${change.new_duty}%`)
  })
  
  // Con Resend sería algo así:
  // await resend.emails.send({
  //   from: 'monitor@lexaduana.es',
  //   to: userData.email,
  //   subject: '⚠️ Cambios en aranceles monitorizados',
  //   html: generateEmailHTML(userData)
  // })
}

// EJECUTAR TODO
async function main() {
  console.log('🚀 Iniciando actualización mensual de TARIC...')
  console.log('📅 Fecha:', new Date().toISOString())
  
  try {
    // 1. Descargar último archivo
    const filepath = await downloadLatestTariff()
    
    // 2. Procesar Excel
    const newTariffs = await processExcelFile(filepath)
    console.log(`📊 ${newTariffs.length} aranceles procesados`)
    
    // 3. Detectar cambios
    const changes = await detectChanges(newTariffs)
    console.log(`🔄 ${changes.length} cambios detectados`)
    
    // 4. Actualizar base de datos
    await updateDatabase(newTariffs, changes)
    
    // 5. Notificar usuarios
    await notifyUsers(changes)
    
    // 6. Limpiar archivo temporal
    fs.unlinkSync(filepath)
    
    console.log('✅ Actualización completada exitosamente')
    
  } catch (error) {
    console.error('❌ Error en actualización:', error)
    process.exit(1)
  }
}

// Si se ejecuta directamente
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main()
}

export { main as updateTariffs }
