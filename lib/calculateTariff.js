/**
 * Módulo de cálculo de aranceles - VERSIÓN 4.3
 * 
 * CAMBIOS RESPECTO A v4.2:
 * - Usa nueva tabla taric_measures (unificada)
 * - Soporta contingentes (order_no)
 * - Mejor manejo de anti-dumping
 * - Fechas de vigencia en todas las medidas
 * 
 * Usado por: /api/calculate y /api/compare
 */

import { supabase } from '@/lib/supabase'
import {
  translateMeasureType,
  translateCertificate,
  translateGeographicalArea,
  getPriorityColors
} from '@/lib/taricTranslations'

/**
 * Calcula el arancel, IVA y alertas para un código HS y país
 * @param {Object} params - Parámetros de cálculo
 * @param {string} params.hsCode - Código HS (2-10 dígitos)
 * @param {number} params.cifValue - Valor CIF en EUR
 * @param {string} params.countryCode - Código ISO del país (ej: 'CN', 'US') o '1011' para ERGA OMNES
 * @param {Date} params.referenceDate - Fecha de referencia (opcional, default: hoy)
 * @returns {Promise<Object>} Resultado del cálculo o error
 */
export async function calculateTariff({
  hsCode,
  cifValue,
  countryCode = '1011',
  referenceDate = new Date()
}) {
  // Validación de entrada
  if (!hsCode || cifValue === undefined || cifValue === null) {
    return {
      success: false,
      error: 'HS Code y valor CIF son requeridos'
    }
  }

  const cif = parseFloat(cifValue)
  if (isNaN(cif) || cif < 0) {
    return {
      success: false,
      error: 'Valor CIF inválido'
    }
  }

  // Limpiar y formatear el HS code
  const cleanHsCode = hsCode.toString().replace(/\s/g, '').replace(/\./g, '')

  if (!/^\d+$/.test(cleanHsCode)) {
    return {
      success: false,
      error: 'El código HS debe contener solo números'
    }
  }

  // Normalizar código de país (convertir 'ERGA OMNES' a '1011')
  const normalizedCountryCode = countryCode === 'ERGA OMNES' ? '1011' : countryCode

  // Si el código tiene menos de 10 dígitos, verificar si hay múltiples opciones
  if (cleanHsCode.length < 10 && cleanHsCode.length >= 2) {
    const suggestions = await getCodeSuggestions(cleanHsCode)
    if (suggestions.length > 1) {
      return {
        success: false,
        incomplete: true,
        message: 'Código incompleto. Seleccione el código específico:',
        suggestions,
        originalCode: cleanHsCode
      }
    }
  }

  const paddedHsCode = cleanHsCode.padEnd(10, '0').substring(0, 10)
  const refDate = referenceDate.toISOString().split('T')[0]

  // Buscar medidas aplicables (búsqueda en cascada)
  const measures = await getApplicableMeasures(paddedHsCode, normalizedCountryCode, refDate)

  if (!measures.baseDuty) {
    return {
      success: false,
      error: 'No se encontró arancel para este código HS'
    }
  }

  // Obtener información del país
  const countryData = await getCountryInfo(normalizedCountryCode)

  // Obtener descripción jerárquica
  const fullDescription = await getHierarchicalDescription(paddedHsCode)

  // Determinar el arancel aplicable
  const dutyInfo = determineFinalDuty(measures, countryData)

  // Calcular valores
  const dutyAmount = (cif * dutyInfo.rate) / 100
  const customsBase = cif + dutyAmount

  // Determinar IVA aplicable
  const { vatRate, vatType } = await calculateVAT(paddedHsCode)
  const vatAmount = (customsBase * vatRate) / 100
  const totalAmount = customsBase + vatAmount

  // Calcular ahorro respecto a ERGA OMNES
  const standardDutyAmount = (cif * measures.baseDuty.rate) / 100
  const savings = standardDutyAmount - dutyAmount

  // Obtener alertas (controles, restricciones, etc.)
  const alerts = await getApplicableAlerts(paddedHsCode, normalizedCountryCode, refDate)

  return {
    success: true,
    data: {
      hsCode: paddedHsCode,
      description: fullDescription,
      cifValue: cif,
      country: {
        code: countryCode,
        name: countryData?.name || 'Terceros países',
        agreement: dutyInfo.agreement,
        notes: countryData?.notes
      },
      duty: {
        standardRate: measures.baseDuty.rate,
        appliedRate: dutyInfo.rate,
        amount: dutyAmount,
        savings: savings > 0 ? savings : 0,
        measureType: dutyInfo.measureType,
        legalBase: dutyInfo.legalBase,
        isConditional: dutyInfo.isConditional,
        conditions: dutyInfo.conditions
      },
      // Información de contingente si aplica
      quota: measures.quota ? {
        orderNo: measures.quota.order_no,
        rate: measures.quota.rate,
        legalBase: measures.quota.legalBase
      } : null,
      // Anti-dumping si aplica
      antidumping: measures.antidumping ? {
        rate: measures.antidumping.rate,
        type: measures.antidumping.type,
        legalBase: measures.antidumping.legalBase
      } : null,
      vat: {
        rate: vatRate,
        type: vatType,
        amount: vatAmount
      },
      customsBase,
      total: totalAmount,
      alerts,
      referenceDate: refDate
    }
  }
}

/**
 * Busca todas las medidas aplicables para un código y país
 */
async function getApplicableMeasures(goodsCode, originCode, refDate) {
  const result = {
    baseDuty: null,      // Arancel ERGA OMNES (103)
    preference: null,    // Preferencia arancelaria (142)
    quota: null,         // Contingente (122, 143)
    antidumping: null,   // Anti-dumping (551, 552, 553, 554)
    suspension: null     // Suspensión (112, 117)
  }

  // Búsqueda en cascada por longitud de código
  for (let len = 10; len >= 4; len -= 2) {
    const searchCode = goodsCode.substring(0, len).padEnd(10, '0')

    // Buscar todas las medidas para este código
    const { data: measures, error } = await supabase
      .from('taric_measures')
      .select('*')
      .eq('goods_code', searchCode)
      .lte('start_date', refDate)
      .or(`end_date.is.null,end_date.gte.${refDate}`)
      .order('measure_type_code')

    if (error || !measures || measures.length === 0) continue

    // Clasificar medidas por tipo
    for (const m of measures) {
      const typeCode = m.measure_type_code

      // Arancel base (ERGA OMNES)
      if ((typeCode === 103 || typeCode === 106) && m.origin_code === '1011') {
        if (!result.baseDuty) {
          result.baseDuty = {
            rate: m.duty_percentage || 0,
            expression: m.duty_expression,
            legalBase: m.legal_base,
            isConditional: m.is_conditional
          }
        }
      }

      // Preferencia arancelaria para el país específico
      if (typeCode === 142 && m.origin_code === originCode) {
        if (!result.preference) {
          result.preference = {
            rate: m.duty_percentage || 0,
            expression: m.duty_expression,
            legalBase: m.legal_base,
            isConditional: m.is_conditional,
            measureType: m.measure_type_name
          }
        }
      }

      // Contingente
      if ((typeCode === 122 || typeCode === 143) &&
        (m.origin_code === originCode || m.origin_code === '1011')) {
        if (!result.quota && m.order_no) {
          result.quota = {
            order_no: m.order_no,
            rate: m.duty_percentage || 0,
            legalBase: m.legal_base,
            originCode: m.origin_code
          }
        }
      }

      // Anti-dumping
      if ([551, 552, 553, 554, 555].includes(typeCode) && m.origin_code === originCode) {
        if (!result.antidumping) {
          result.antidumping = {
            rate: m.duty_percentage || 0,
            type: typeCode === 551 || typeCode === 553 ? 'provisional' : 'definitivo',
            legalBase: m.legal_base,
            addCode: m.add_code
          }
        }
      }

      // Suspensión autónoma
      if ((typeCode === 112 || typeCode === 117) && m.origin_code === '1011') {
        if (!result.suspension) {
          result.suspension = {
            rate: m.duty_percentage || 0,
            legalBase: m.legal_base
          }
        }
      }
    }

    // Si encontramos el arancel base, ya tenemos suficiente
    if (result.baseDuty) break
  }

  return result
}

/**
 * Determina el arancel final a aplicar basado en las medidas encontradas
 */
function determineFinalDuty(measures, countryData) {
  // Prioridad de aplicación:
  // 1. Suspensión autónoma (si es menor que ERGA OMNES)
  // 2. Preferencia arancelaria (si existe para el país)
  // 3. Arancel base ERGA OMNES
  // + Anti-dumping (se suma al arancel aplicable)

  let rate = measures.baseDuty?.rate || 0
  let agreement = null
  let measureType = 'Third country duty'
  let legalBase = measures.baseDuty?.legalBase
  let isConditional = measures.baseDuty?.isConditional || false
  let conditions = null

  // ¿Hay suspensión autónoma menor?
  if (measures.suspension && measures.suspension.rate < rate) {
    rate = measures.suspension.rate
    agreement = 'Suspensión autónoma'
    measureType = 'Autonomous suspension'
    legalBase = measures.suspension.legalBase
  }

  // ¿Hay preferencia para este país?
  if (measures.preference) {
    rate = measures.preference.rate
    agreement = countryData?.agreement_type || 'Preferencia arancelaria'
    measureType = measures.preference.measureType || 'Tariff preference'
    legalBase = measures.preference.legalBase
    isConditional = measures.preference.isConditional
  }

  // Añadir anti-dumping si aplica
  if (measures.antidumping) {
    rate += measures.antidumping.rate
    agreement = agreement
      ? `${agreement} + Anti-dumping ${measures.antidumping.type}`
      : `Anti-dumping ${measures.antidumping.type}`
  }

  return {
    rate,
    agreement,
    measureType,
    legalBase,
    isConditional,
    conditions
  }
}

/**
 * Obtiene sugerencias de códigos cuando el código está incompleto
 */
async function getCodeSuggestions(partialCode) {
  const { data: codes, error } = await supabase
    .from('taric_measures')
    .select('goods_code, duty_percentage')
    .eq('measure_type_code', 103)  // Solo Third country duty
    .eq('origin_code', '1011')      // Solo ERGA OMNES
    .like('goods_code', `${partialCode}%`)
    .order('goods_code')
    .limit(20)

  if (error || !codes) return []

  // Obtener descripciones
  const suggestions = await Promise.all(
    codes.map(async (code) => {
      const { data: desc } = await supabase
        .from('descriptions')
        .select('description')
        .eq('goods_code', code.goods_code)
        .single()

      return {
        goods_code: code.goods_code,
        duty: code.duty_percentage,
        description: desc?.description || 'Sin descripción'
      }
    })
  )

  return suggestions
}

/**
 * Obtiene información del país
 */
async function getCountryInfo(countryCode) {
  if (countryCode === '1011') {
    return { name: 'Terceros países (ERGA OMNES)', agreement_type: null }
  }

  const { data: country } = await supabase
    .from('countries')
    .select('*')
    .eq('country_code', countryCode)
    .single()

  return country
}

/**
 * Obtiene la descripción jerárquica de un código HS
 */
async function getHierarchicalDescription(paddedHsCode) {
  const descriptions = []
  const levels = [2, 4, 6, 8, 10]

  for (const len of levels) {
    const searchCode = paddedHsCode.substring(0, len).padEnd(10, '0')

    const { data: desc } = await supabase
      .from('descriptions')
      .select('description')
      .eq('goods_code', searchCode)
      .single()

    if (desc?.description) {
      const cleanDesc = desc.description.trim()
      // Evitar duplicados
      if (!descriptions.includes(cleanDesc)) {
        descriptions.push(cleanDesc)
      }
    }
  }

  return descriptions.length > 0
    ? descriptions.join(' → ')
    : `Código HS: ${paddedHsCode}`
}

/**
 * Calcula el IVA aplicable para un código HS
 */
async function calculateVAT(paddedHsCode) {
  let vatRate = 21
  let vatType = 'general'

  // Búsqueda en cascada en la tabla de IVA
  for (let len = 10; len >= 2; len -= 2) {
    const searchCode = paddedHsCode.substring(0, len).padEnd(10, '0')

    const { data: vatData } = await supabase
      .from('vat_rates')
      .select('vat_rate, vat_type')
      .eq('goods_code', searchCode)
      .maybeSingle()

    if (vatData) {
      vatRate = parseFloat(vatData.vat_rate)
      vatType = vatData.vat_type
      break
    }
  }

  // Fallback a reglas por capítulo si no está en la tabla
  if (vatRate === 21) {
    try {
      const { determineVATByChapter } = await import('@/lib/vatCalculator')
      const vatResult = determineVATByChapter(paddedHsCode)
      vatRate = vatResult.rate
      vatType = vatResult.type
    } catch (error) {
      // Mantener valores por defecto
    }
  }

  return { vatRate, vatType }
}

/**
 * Obtiene las alertas aplicables (controles, restricciones)
 */
async function getApplicableAlerts(goodsCode, originCode, refDate) {
  let alerts = []

  try {
    // Buscar medidas de control y restricción
    const controlTypes = [410, 415, 420, 710, 711, 714, 719, 750, 755, 760, 762, 731, 465, 473, 474, 475, 478]

    const { data: measures } = await supabase
      .from('taric_measures')
      .select('*')
      .eq('goods_code', goodsCode)
      .in('measure_type_code', controlTypes)
      .lte('start_date', refDate)
      .or(`end_date.is.null,end_date.gte.${refDate}`)
      .order('measure_type_code')
      .limit(10)

    if (measures && measures.length > 0) {
      // Filtrar por origen si aplica
      alerts = measures
        .filter(m => {
          // Si no especifica origen o es 1011, aplica a todos
          if (!m.origin_code || m.origin_code === '1011') return true
          // Si es específico para el país consultado
          if (m.origin_code === originCode) return true
          // Por defecto, mostrar
          return false
        })
        .map(m => {
          const measureInfo = translateMeasureType(String(m.measure_type_code))
          const priorityColors = getPriorityColors(m.is_prohibition ? 1 : 2)

          return {
            code: `M${m.measure_type_code}`,
            short_text: m.measure_type_name,
            full_text: m.duty_expression,
            priority: m.is_prohibition ? 1 : 2,
            measure_code: String(m.measure_type_code),
            origin_code: m.origin_code,
            translated: {
              measure: measureInfo,
              priorityLabel: priorityColors.label
            },
            description: measureInfo.text,
            icon: measureInfo.icon
          }
        })
    }

    // También buscar en measure_alerts (compatibilidad)
    const { data: legacyAlerts } = await supabase
      .from('measure_alerts')
      .select('*')
      .eq('goods_code', goodsCode)
      .order('priority')
      .limit(5)

    if (legacyAlerts && legacyAlerts.length > 0) {
      // Añadir alertas legacy que no estén duplicadas
      legacyAlerts.forEach(alert => {
        if (!alerts.find(a => a.measure_code === alert.measure_code)) {
          alerts.push({
            code: alert.alert_type || alert.certificate || `M${alert.measure_code}`,
            short_text: alert.short_text,
            full_text: alert.full_text,
            priority: alert.priority || 3,
            measure_code: alert.measure_code,
            origin_code: alert.origin_code,
            translated: {
              measure: translateMeasureType(alert.measure_code),
              certificate: alert.certificate ? translateCertificate(alert.certificate) : null
            }
          })
        }
      })
    }
  } catch (error) {
    console.error('Error obteniendo alertas:', error)
  }

  return alerts.slice(0, 5) // Máximo 5 alertas
}

/**
 * Obtiene la lista de todos los países disponibles
 */
export async function getCountries() {
  try {
    const { data: countries, error } = await supabase
      .from('countries')
      .select('country_code, country_name, agreement_type, reduction_rate, notes')
      .order('country_name')

    if (error) throw error
    return countries || []
  } catch (error) {
    console.error('Error obteniendo países:', error)
    return []
  }
}