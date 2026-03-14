/**
 * Módulo de cálculo de aranceles - VERSIÓN 5.2
 *
 * CAMBIOS RESPECTO A v5.1:
 * - Sugerencias filtradas por declarable_codes (solo códigos declarables)
 * - Condiciones enriquecidas con certificate_types (883 EN + 883 ES)
 * - Additional codes con descripción desde additional_codes (3253 EN + ES)
 * - Footnotes en alertas desde measure_footnotes (121.938) + footnote_descriptions
 * - Descripción jerárquica simplificada (tabla descriptions completa, sin fallbacks legacy)
 * - Resolución de grupos geográficos (geographical_areas_composition)
 * - Verificación de exclusiones en medidas y alertas
 * - Soporte para 78 tipos de medida
 * - Country info desde geographical_areas (311 entradas)
 * - Alertas ampliadas: CBAM (775), prohibiciones, controles REACH/POP/etc.
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
  const dutyInfo = determineFinalDuty(measures, countryData, paddedHsCode)

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
        legalBase: measures.antidumping.legalBase,
        addCode: measures.antidumping.addCode,
        addCodeDescription: measures.additionalCodes?.[measures.antidumping.addCode] || null
      } : null,
      // Additional codes encontrados
      additionalCodes: measures.additionalCodes,
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
 * Resuelve todos los origin_codes que aplican a un país.
 * Ejemplo: 'CN' → ['CN', '1011', '1008', '2005', ...]
 * Esto es CRÍTICO: sin esto, las preferencias con origin_code de grupo
 * (ej: '2012' para ACP) nunca se encuentran al buscar por país ISO.
 */
async function resolveOriginGroups(countryCode, refDate) {
  // Si ya es un grupo (numérico), devolver solo ese
  if (/^\d+$/.test(countryCode)) return [countryCode]

  // Buscar todos los grupos a los que pertenece este país
  const { data: memberships, error } = await supabase
    .from('geographical_areas_composition')
    .select('country_group')
    .eq('member_country', countryCode)
    .or(`membership_end_date.is.null,membership_end_date.gte.${refDate}`)

  if (error || !memberships) {
    console.error('Error resolviendo grupos geográficos:', error)
    // Fallback: solo el país + ERGA OMNES
    return [countryCode, '1011']
  }

  // País directo + todos los grupos a los que pertenece
  const groups = [countryCode, ...memberships.map(m => m.country_group)]
  // Deduplicar
  return [...new Set(groups)]
}

/**
 * Busca todas las medidas aplicables para un código y país.
 * Resuelve grupos geográficos para encontrar preferencias por grupo.
 */
async function getApplicableMeasures(goodsCode, originCode, refDate) {
  const result = {
    baseDuty: null,      // Arancel ERGA OMNES (103)
    preference: null,    // Preferencia arancelaria (142)
    quota: null,         // Contingente (122, 143)
    antidumping: null,   // Anti-dumping (551, 552, 553, 554)
    suspension: null     // Suspensión (112, 117)
  }

  // NUEVO: Resolver todos los origin codes aplicables al país
  const originGroups = await resolveOriginGroups(originCode, refDate)

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

    // Verificar exclusiones para este código (batch)
    const { data: exclusions } = await supabase
      .from('measure_exclusions')
      .select('measure_type_code, origin_code, excluded_country_code')
      .eq('goods_code', searchCode)
      .eq('excluded_country_code', originCode)

    const isExcluded = (measureTypeCode, measureOriginCode) => {
      if (!exclusions) return false
      return exclusions.some(e =>
        e.measure_type_code === measureTypeCode &&
        e.origin_code === String(measureOriginCode)
      )
    }

    // Clasificar medidas por tipo
    for (const m of measures) {
      const typeCode = m.measure_type_code
      const mOrigin = String(m.origin_code)

      // Arancel base (ERGA OMNES o All third countries)
      // Prioridad: 1) ERGA OMNES no excluido, 2) país directo tipo 103/106
      if ((typeCode === 103 || typeCode === 106)) {
        if (mOrigin === '1011' || mOrigin === '1008') {
          if (!result.baseDuty && !isExcluded(typeCode, mOrigin)) {
            result.baseDuty = {
              rate: m.duty_percentage || 0,
              expression: m.duty_expression,
              legalBase: m.legal_base,
              isConditional: m.is_conditional
            }
          }
        }
        // Si el país tiene su propio 103/106 (ej: RU con sanciones), usarlo como baseDuty
        // cuando ERGA OMNES está excluido para ese país
        else if (mOrigin === originCode && !result.baseDuty) {
          result.baseDuty = {
            rate: m.duty_percentage || 0,
            expression: m.duty_expression,
            legalBase: m.legal_base,
            isConditional: m.is_conditional,
            countrySpecific: true
          }
        }
      }

      // Preferencia arancelaria — AHORA busca en todos los grupos del país
      if ([142, 143, 145, 146, 147].includes(typeCode) && originGroups.includes(mOrigin)) {
        // Para preferencias, priorizar match directo sobre grupo
        const isDirect = mOrigin === originCode
        if (!isExcluded(typeCode, mOrigin)) {
          if (!result.preference || (isDirect && result.preference._fromGroup)) {
            // Contingente preferencial (143, 146, 147) va a quota
            if ([143, 146, 147].includes(typeCode) && m.order_no) {
              if (!result.quota) {
                result.quota = {
                  order_no: m.order_no,
                  rate: m.duty_percentage || 0,
                  legalBase: m.legal_base,
                  originCode: mOrigin
                }
              }
            } else {
              result.preference = {
                rate: m.duty_percentage || 0,
                expression: m.duty_expression,
                legalBase: m.legal_base,
                isConditional: m.is_conditional,
                measureType: m.measure_type_name,
                originCode: mOrigin,
                _fromGroup: !isDirect // Flag interno para priorizar match directo
              }
            }
          }
        }
      }

      // Contingente no preferencial
      if (typeCode === 122 && originGroups.includes(mOrigin)) {
        if (!result.quota && m.order_no && !isExcluded(typeCode, mOrigin)) {
          result.quota = {
            order_no: m.order_no,
            rate: m.duty_percentage || 0,
            legalBase: m.legal_base,
            originCode: mOrigin
          }
        }
      }

      // Anti-dumping — estos SÍ usan país directo (no grupos)
      if ([551, 552, 553, 554, 555].includes(typeCode) && mOrigin === originCode) {
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
      if ((typeCode === 112 || typeCode === 115 || typeCode === 117 || typeCode === 119)
        && (mOrigin === '1011' || mOrigin === '1008')) {
        if (!result.suspension && !isExcluded(typeCode, mOrigin)) {
          // Verificar si tiene condiciones (certificados requeridos)
          const { data: conditions } = await supabase
            .from('measure_conditions')
            .select('certificate_code, condition_code, action_code')
            .eq('goods_code', searchCode)
            .eq('measure_type_code', typeCode)
            .not('certificate_code', 'is', null)
            .limit(5)

          const hasConditions = conditions && conditions.length > 0

          // Enriquecer certificados con descripciones desde certificate_types
          let conditionDetails = null
          if (hasConditions) {
            const certCodes = [...new Set(conditions.map(c => c.certificate_code))]
            const { data: certDescs } = await supabase
              .from('certificate_types')
              .select('certificate_code, description')
              .in('certificate_code', certCodes)
              .eq('language', 'ES')

            const certMap = new Map()
            if (certDescs) certDescs.forEach(cd => certMap.set(cd.certificate_code, cd.description))

            conditionDetails = conditions.map(c => ({
              certificate: c.certificate_code,
              description: certMap.get(c.certificate_code) || translateCertificate(c.certificate_code).text,
              conditionCode: c.condition_code,
              actionCode: c.action_code
            }))
          }

          result.suspension = {
            rate: m.duty_percentage || 0,
            legalBase: m.legal_base,
            isConditional: hasConditions,
            certificateRequired: hasConditions ? conditions[0].certificate_code : null,
            conditions: conditionDetails
          }
        }
      }

      // Additional code — enriquecer con descripción si existe
      if (m.add_code && !result._addCodeDesc) {
        const { data: addDesc } = await supabase
          .from('additional_codes')
          .select('description')
          .eq('add_code', m.add_code)
          .eq('language', 'ES')
          .maybeSingle()

        if (addDesc) {
          result._addCodeDesc = result._addCodeDesc || {}
          result._addCodeDesc[m.add_code] = addDesc.description
        }
      }
    }

    // Si encontramos el arancel base, ya tenemos suficiente
    if (result.baseDuty) break
  }

  // Limpiar flags internos
  if (result.preference) delete result.preference._fromGroup
  // Exponer additional codes como mapa limpio
  result.additionalCodes = result._addCodeDesc || null
  delete result._addCodeDesc

  return result
}

/**
 * Determina el arancel final a aplicar basado en las medidas encontradas
 */
function determineFinalDuty(measures, countryData, goodsCode) {
  // Prioridad de aplicación:
  // 1. Suspensión autónoma (si es menor que ERGA OMNES)
  // 2. Preferencia arancelaria (si existe para el país)
  // 3. Preferencia implícita por acuerdo (productos industriales)
  // 4. Arancel base ERGA OMNES
  // + Anti-dumping (se suma al arancel aplicable)

  let rate = measures.baseDuty?.rate || 0
  let agreement = null
  let measureType = 'Third country duty'
  let legalBase = measures.baseDuty?.legalBase
  let isConditional = measures.baseDuty?.isConditional || false
  let conditions = null

  // ¿Hay suspensión autónoma menor? (solo si NO es condicional)
  if (measures.suspension &&
    measures.suspension.rate < rate &&
    !measures.suspension.isConditional) {
    rate = measures.suspension.rate
    agreement = 'Suspensión autónoma'
    measureType = 'Autonomous suspension'
    legalBase = measures.suspension.legalBase
  }

  // ¿Hay preferencia explícita para este país en taric_measures?
  if (measures.preference) {
    rate = measures.preference.rate
    agreement = countryData?.agreement_type || 'Preferencia arancelaria'
    measureType = measures.preference.measureType || 'Tariff preference'
    legalBase = measures.preference.legalBase
    isConditional = measures.preference.isConditional
  }
  // ¿Hay preferencia IMPLÍCITA por acuerdo de asociación? (productos industriales)
  else if (countryData?.agreement_type && isIndustrialProduct(goodsCode)) {
    // Países con acuerdos que liberalizan productos industriales
    const freeTradeAgreements = [
      'Acuerdo de Asociación',      // Marruecos, Túnez, Egipto, etc.
      'Unión Aduanera',             // Turquía
      'Acuerdo Euro-Mediterráneo',
      'Acuerdo de Libre Comercio',
      'EEE',                        // Noruega, Islandia, Liechtenstein
      'AELC'                        // Suiza
    ]

    if (freeTradeAgreements.some(a => countryData.agreement_type.includes(a))) {
      rate = 0
      agreement = countryData.agreement_type
      measureType = 'Tariff preference (implicit)'
      legalBase = 'Acuerdo de Asociación UE'
      isConditional = true // Requiere prueba de origen
    }
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
 * Determina si un producto es industrial (capítulos 25-97)
 * Los capítulos 01-24 son agrícolas y tienen reglas especiales
 */
function isIndustrialProduct(goodsCode) {
  const chapter = parseInt(goodsCode.substring(0, 2), 10)
  return chapter >= 25 && chapter <= 97
}

/**
 * Obtiene sugerencias de códigos cuando el código está incompleto.
 * Usa declarable_codes (25.697) para mostrar solo códigos válidos para declaración,
 * enriquecidos con descripciones y arancel base.
 */
async function getCodeSuggestions(partialCode) {
  const paddedPartial = partialCode.padEnd(10, '0').substring(0, 10)

  // Buscar en declarable_codes (solo códigos hoja = declarables en DUA)
  const { data: declarable, error: decError } = await supabase
    .from('declarable_codes')
    .select('goods_code, is_leaf, goods_code_full')
    .eq('is_leaf', true)
    .like('goods_code', `${partialCode}%`)
    .order('goods_code')
    .limit(20)

  // Fallback a taric_measures si declarable_codes falla
  if (decError || !declarable || declarable.length === 0) {
    const { data: codes } = await supabase
      .from('taric_measures')
      .select('goods_code, duty_percentage')
      .eq('measure_type_code', 103)
      .eq('origin_code', '1011')
      .like('goods_code', `${partialCode}%`)
      .order('goods_code')
      .limit(20)

    if (!codes) return []

    const suggestions = await Promise.all(
      codes.map(async (code) => {
        const { data: desc } = await supabase
          .from('descriptions')
          .select('description')
          .eq('goods_code', code.goods_code)
          .maybeSingle()

        return {
          goods_code: code.goods_code,
          duty: code.duty_percentage,
          description: desc?.description || 'Sin descripción'
        }
      })
    )
    return suggestions
  }

  // Enriquecer con descripción y arancel
  const suggestions = await Promise.all(
    declarable.map(async (dc) => {
      const [descResult, dutyResult] = await Promise.all([
        supabase
          .from('descriptions')
          .select('description')
          .eq('goods_code', dc.goods_code)
          .maybeSingle(),
        supabase
          .from('taric_measures')
          .select('duty_percentage')
          .eq('goods_code', dc.goods_code)
          .eq('measure_type_code', 103)
          .eq('origin_code', '1011')
          .maybeSingle()
      ])

      return {
        goods_code: dc.goods_code,
        duty: dutyResult.data?.duty_percentage ?? null,
        description: descResult.data?.description || 'Sin descripción',
        declarable: true
      }
    })
  )

  return suggestions
}

/**
 * Obtiene información del país.
 * Busca primero en geographical_areas (nueva), fallback a countries (legacy).
 */
async function getCountryInfo(countryCode) {
  if (countryCode === '1011') {
    return { name: 'Terceros países (ERGA OMNES)', agreement_type: null }
  }

  // Primero intentar en geographical_areas (tabla nueva, más completa)
  const { data: geoArea } = await supabase
    .from('geographical_areas')
    .select('*')
    .eq('area_code', countryCode)
    .maybeSingle()

  if (geoArea) {
    // Buscar datos de acuerdo en countries (legacy) para agreement_type
    const { data: country } = await supabase
      .from('countries')
      .select('agreement_type, reduction_rate, notes')
      .eq('country_code', countryCode)
      .maybeSingle()

    return {
      name: geoArea.description,
      country_code: countryCode,
      agreement_type: country?.agreement_type || null,
      reduction_rate: country?.reduction_rate || null,
      notes: country?.notes || null
    }
  }

  // Fallback a countries (legacy)
  const { data: country } = await supabase
    .from('countries')
    .select('*')
    .eq('country_code', countryCode)
    .maybeSingle()

  if (country) {
    return {
      name: country.country_name,
      country_code: countryCode,
      agreement_type: country.agreement_type,
      reduction_rate: country.reduction_rate,
      notes: country.notes
    }
  }

  return { name: countryCode, country_code: countryCode, agreement_type: null }
}

/**
 * Obtiene la descripción jerárquica de un código HS.
 * Usa descriptions (25.691 filas completas con hier_pos).
 * Construye la cadena: Capítulo → Partida → Subpartida → ... → Línea
 */
async function getHierarchicalDescription(paddedHsCode) {
  const levels = [2, 4, 6, 8, 10]
  const searchCodes = levels.map(len => paddedHsCode.substring(0, len).padEnd(10, '0'))

  // Hacer una sola query para todos los niveles (más eficiente)
  const { data: allDescs, error } = await supabase
    .from('descriptions')
    .select('goods_code, description, hier_pos')
    .in('goods_code', searchCodes)
    .order('hier_pos')

  if (error || !allDescs || allDescs.length === 0) {
    return `Código HS: ${paddedHsCode}`
  }

  // Construir jerarquía deduplicada
  const descriptions = []
  for (const len of levels) {
    const searchCode = paddedHsCode.substring(0, len).padEnd(10, '0')
    // Preferir el match exacto por hier_pos, luego cualquier match
    const match = allDescs.find(d => d.goods_code === searchCode && d.hier_pos === len)
      || allDescs.find(d => d.goods_code === searchCode)

    if (match?.description) {
      const cleanDesc = match.description.trim()
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
 * Obtiene las alertas aplicables (controles, restricciones).
 * Ahora resuelve grupos geográficos y verifica exclusiones.
 */
async function getApplicableAlerts(goodsCode, originCode, refDate) {
  let alerts = []

  try {
    // Resolver grupos del país para matchear alertas por grupo
    const originGroups = await resolveOriginGroups(originCode, refDate)

    // Tipos de control y restricción ampliados (78 tipos totales, estos son los de alerta)
    const controlTypes = [
      277,                                    // Import prohibition
      410, 415, 420,                          // Veterinary, phytosanitary
      464, 465, 473, 474, 475, 478,           // Free circulation restrictions
      481, 482, 483, 484,                     // Declaration subheading
      705,                                    // Prohibition (torture goods)
      710, 711, 712, 713, 714, 719,           // CITES, IAS, GMO, controls
      722, 724, 726, 728,                     // Food/feed, fluorinated gases, ozone, luxury
      730, 731, 732, 734, 738,                // Pre-export, controls, cultural, military
      745, 746, 747, 748, 750,                // Cat/dog fur, seal, timber, mercury, organic
      755, 760, 761, 762, 763, 769, 770,      // Waste, REACH, POP, FLEGT-Ghana
      775                                     // CBAM
    ]

    const { data: measures } = await supabase
      .from('taric_measures')
      .select('*')
      .eq('goods_code', goodsCode)
      .in('measure_type_code', controlTypes)
      .lte('start_date', refDate)
      .or(`end_date.is.null,end_date.gte.${refDate}`)
      .order('measure_type_code')
      .limit(20)

    if (measures && measures.length > 0) {
      // Verificar exclusiones
      const { data: exclusions } = await supabase
        .from('measure_exclusions')
        .select('measure_type_code, origin_code, excluded_country_code')
        .eq('goods_code', goodsCode)
        .eq('excluded_country_code', originCode)

      const isExcluded = (typeCode, mOrigin) => {
        if (!exclusions) return false
        return exclusions.some(e =>
          e.measure_type_code === typeCode &&
          e.origin_code === String(mOrigin)
        )
      }

      alerts = measures
        .filter(m => {
          const mOrigin = String(m.origin_code)
          // Verificar que aplica al país (directo o por grupo)
          if (!originGroups.includes(mOrigin)) return false
          // Verificar que no está excluido
          if (isExcluded(m.measure_type_code, mOrigin)) return false
          return true
        })
        .map(m => {
          const measureInfo = translateMeasureType(String(m.measure_type_code))
          const isProhibition = [277, 705].includes(m.measure_type_code)
          const priorityColors = getPriorityColors(isProhibition ? 1 : 2)

          return {
            code: `M${m.measure_type_code}`,
            short_text: m.measure_type_name,
            full_text: m.duty_expression,
            priority: isProhibition ? 1 : (m.measure_type_code === 775 ? 2 : 3),
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

    // Footnotes asociados a las medidas del producto (measure_footnotes + footnote_descriptions)
    const { data: footnotes } = await supabase
      .from('measure_footnotes')
      .select('footnote_code, measure_type_code, measure_type_name')
      .eq('goods_code', goodsCode)
      .limit(20)

    if (footnotes && footnotes.length > 0) {
      // Obtener descripciones de los footnotes en ES
      const fnCodes = [...new Set(footnotes.map(f => f.footnote_code))]
      const { data: fnDescs } = await supabase
        .from('footnote_descriptions')
        .select('footnote_code, description')
        .in('footnote_code', fnCodes)
        .eq('language', 'ES')

      const fnDescMap = new Map()
      if (fnDescs) fnDescs.forEach(fd => fnDescMap.set(fd.footnote_code, fd.description))

      // Añadir footnotes como alertas informativas (sin duplicar measure types ya presentes)
      const seenFn = new Set()
      footnotes.forEach(fn => {
        if (seenFn.has(fn.footnote_code)) return
        seenFn.add(fn.footnote_code)

        const desc = fnDescMap.get(fn.footnote_code)
        // Solo incluir footnotes que tengan descripción y no sean redundantes
        if (desc && !alerts.find(a => a.code === fn.footnote_code)) {
          alerts.push({
            code: fn.footnote_code,
            short_text: desc.substring(0, 120),
            full_text: desc,
            priority: 4, // Informativo
            measure_code: String(fn.measure_type_code),
            origin_code: null,
            isFootnote: true,
            translated: {
              measure: translateMeasureType(fn.measure_type_code)
            },
            description: desc,
            icon: '📝'
          })
        }
      })
    }

    // Alertas legacy (tabla measure_alerts) — fallback
    const { data: legacyAlerts } = await supabase
      .from('measure_alerts')
      .select('*')
      .eq('goods_code', goodsCode)
      .or(`origin_code.is.null,origin_code.eq.${originCode},origin_code.eq.1011`)
      .order('priority')
      .limit(5)

    if (legacyAlerts && legacyAlerts.length > 0) {
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

  // Ordenar por prioridad y limitar
  return alerts.sort((a, b) => a.priority - b.priority).slice(0, 8)
}

/**
 * Obtiene la lista de todos los países disponibles.
 * Combina geographical_areas (nueva, 311 entradas) con countries (legacy, acuerdos).
 */
export async function getCountries() {
  try {
    // Primero intentar geographical_areas (más completa)
    const { data: geoAreas, error: geoErr } = await supabase
      .from('geographical_areas')
      .select('area_code, abbrev, description, is_country')
      .eq('is_country', true)
      .is('end_date', null)
      .order('description')

    if (!geoErr && geoAreas && geoAreas.length > 0) {
      // Enriquecer con datos de acuerdos desde countries (legacy)
      const { data: agreements } = await supabase
        .from('countries')
        .select('country_code, agreement_type, reduction_rate, notes')

      const agreementMap = new Map()
      if (agreements) {
        agreements.forEach(a => agreementMap.set(a.country_code, a))
      }

      return geoAreas.map(ga => {
        const agreement = agreementMap.get(ga.area_code)
        return {
          country_code: ga.area_code,
          country_name: ga.description,
          agreement_type: agreement?.agreement_type || null,
          reduction_rate: agreement?.reduction_rate || null,
          notes: agreement?.notes || null
        }
      })
    }

    // Fallback a countries (legacy)
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