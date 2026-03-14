/**
 * CBAM Service - Capa de datos con Supabase + fallback a cbamData.js
 *
 * Este módulo reemplaza progresivamente los imports directos de cbamData.js.
 * Cada función consulta Supabase primero y cae al módulo hardcoded si falla.
 *
 * Uso:
 *   import { getCurrentETSPrice, checkCBAMFromDB, ... } from '@/lib/cbamService'
 */

import { supabase } from '@/lib/supabase'
import {
  checkCBAM as checkCBAMHardcoded,
  isCountryExcluded as isCountryExcludedHardcoded,
  calculateCBAMCost as calculateCBAMCostHardcoded,
  getBenchmark as getBenchmarkHardcoded,
  getNextDeadline as getNextDeadlineHardcoded,
  getDefaultValueMarkup as getDefaultValueMarkupHardcoded,
  applyDefaultValueMarkup as applyDefaultValueMarkupHardcoded,
  getCBAMStats as getCBAMStatsHardcoded,
  CBAM_SECTORS,
  CBAM_CODES,
  CBAM_EXCLUDED_COUNTRIES,
  CBAM_CERTIFICATES,
  CBAM_TIMELINE,
  CBAM_BENCHMARKS,
  CBAM_DEFAULT_VALUE_MARKUP,
  CBAM_DEFAULT_VALUES,
  CBAM_THRESHOLD,
  CBAM_CERTIFICATE_PRICING,
  CBAM_DOWNSTREAM_EXTENSION,
  CBAM_ANTI_CIRCUMVENTION,
  CBAM_ELECTRICITY_RULES,
} from '@/lib/cbamData'

// ============================================================
// PRECIO EU ETS (el fix más urgente)
// ============================================================

/**
 * Obtiene el precio actual del EU ETS desde Supabase
 * @returns {Promise<{price: number, date: string, source: string} | null>}
 */
export async function getCurrentETSPrice() {
  try {
    const { data, error } = await supabase
      .from('cbam_ets_prices')
      .select('price, price_date, source, created_at')
      .eq('is_current', true)
      .single()

    if (error || !data) {
      console.warn('[CBAM Service] No se encontró precio ETS actual, usando fallback')
      return { price: 68.50, date: '2024-12-01', source: 'fallback (hardcoded)' }
    }

    return {
      price: parseFloat(data.price),
      date: data.price_date,
      source: data.source
    }
  } catch (err) {
    console.error('[CBAM Service] Error obteniendo precio ETS:', err.message)
    return { price: 68.50, date: '2024-12-01', source: 'fallback (error)' }
  }
}

/**
 * Obtiene el historial de precios ETS
 * @param {number} limit - Número máximo de registros
 * @returns {Promise<Array>}
 */
export async function getETSPriceHistory(limit = 30) {
  try {
    const { data, error } = await supabase
      .from('cbam_ets_prices')
      .select('price, price_date, price_type, source')
      .order('price_date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('[CBAM Service] Error obteniendo historial de precios:', err.message)
    return []
  }
}

// ============================================================
// SECTORES
// ============================================================

/**
 * Obtiene todos los sectores CBAM activos
 * @returns {Promise<Array>}
 */
export async function getSectors() {
  try {
    const { data, error } = await supabase
      .from('cbam_sectors')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (error || !data?.length) throw error || new Error('No sectors found')
    // Mapear campos Supabase → formato esperado por page.js
    return data.map(s => ({
      ...s,
      emissions: s.emissions_type,
      deMinimisApplies: s.de_minimis_applies,
      nameEn: s.name_en
    }))
  } catch (err) {
    console.warn('[CBAM Service] Fallback a sectores hardcoded:', err?.message)
    return Object.values(CBAM_SECTORS)
  }
}

// ============================================================
// CÓDIGOS CN
// ============================================================

/**
 * Obtiene todos los códigos CN CBAM activos
 * @param {boolean} includeDownstream - Incluir códigos downstream (2028+)
 * @returns {Promise<Array>}
 */
export async function getCBAMCodes(includeDownstream = false) {
  try {
    const today = new Date().toISOString().split('T')[0]

    let query = supabase
      .from('cbam_cn_codes')
      .select('*')
      .lte('effective_from', today)
      .or(`effective_to.is.null,effective_to.gte.${today}`)

    if (!includeDownstream) {
      query = query.eq('is_downstream', false)
    }

    const { data, error } = await query.order('sector_id')

    if (error || !data?.length) throw error || new Error('No codes found')
    return data
  } catch (err) {
    console.warn('[CBAM Service] Fallback a códigos CN hardcoded:', err?.message)
    return CBAM_CODES
  }
}

// ============================================================
// PAÍSES EXCLUIDOS
// ============================================================

/**
 * Obtiene países excluidos del CBAM
 * @returns {Promise<Array>}
 */
export async function getExcludedCountries() {
  try {
    const { data, error } = await supabase
      .from('cbam_excluded_countries')
      .select('*')
      .order('country_code')

    if (error || !data?.length) throw error || new Error('No excluded countries')
    // Mapear campos Supabase → formato esperado por page.js
    return data.map(c => ({
      ...c,
      code: c.country_code,
      name: c.country_name
    }))
  } catch (err) {
    console.warn('[CBAM Service] Fallback a países excluidos hardcoded:', err?.message)
    return CBAM_EXCLUDED_COUNTRIES
  }
}

/**
 * Verifica si un país está excluido del CBAM (consulta Supabase)
 * @param {string} countryCode
 * @returns {Promise<object|null>}
 */
export async function isCountryExcludedDB(countryCode) {
  if (!countryCode) return null
  try {
    const { data, error } = await supabase
      .from('cbam_excluded_countries')
      .select('*')
      .eq('country_code', countryCode.toUpperCase())
      .single()

    if (error) return isCountryExcludedHardcoded(countryCode)
    return data || null
  } catch {
    return isCountryExcludedHardcoded(countryCode)
  }
}

// ============================================================
// FACTORES DE EMISIÓN
// ============================================================

/**
 * Obtiene factores de emisión por defecto, agrupados por sector
 * @returns {Promise<Object>}
 */
export async function getEmissionFactors() {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('cbam_emission_factors')
      .select('*')
      .lte('effective_from', today)
      .or(`effective_to.is.null,effective_to.gte.${today}`)
      .order('sector_id')

    if (error || !data?.length) throw error || new Error('No emission factors')

    // Agrupar por sector para mantener compatibilidad con el simulador
    const grouped = {}
    for (const row of data) {
      if (!grouped[row.sector_id]) {
        grouped[row.sector_id] = { products: [] }
      }
      grouped[row.sector_id].products.push({
        id: row.product_key,
        name: row.product_name,
        factor: parseFloat(row.factor_value),
        codes: row.applicable_cn_codes || []
      })
    }
    return grouped
  } catch (err) {
    console.warn('[CBAM Service] Fallback a factores de emisión hardcoded:', err?.message)
    return CBAM_DEFAULT_VALUES
  }
}

// ============================================================
// BENCHMARKS
// ============================================================

/**
 * Obtiene el benchmark por defecto de un sector
 * @param {string} sectorId
 * @param {number} year
 * @returns {Promise<number>}
 */
export async function getBenchmarkDB(sectorId, year = new Date().getFullYear()) {
  try {
    const { data, error } = await supabase
      .from('cbam_benchmarks')
      .select('value')
      .eq('sector_id', sectorId)
      .eq('is_default', true)
      .lte('year_from', year)
      .or(`year_to.is.null,year_to.gte.${year}`)
      .order('year_from', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) throw error || new Error('No benchmark found')
    return parseFloat(data.value)
  } catch {
    return getBenchmarkHardcoded(sectorId, year)
  }
}

/**
 * Obtiene todos los benchmarks de un sector
 * @param {string} sectorId
 * @returns {Promise<Array>}
 */
export async function getBenchmarksBySector(sectorId) {
  try {
    const { data, error } = await supabase
      .from('cbam_benchmarks')
      .select('*')
      .eq('sector_id', sectorId)
      .order('is_default', { ascending: false })

    if (error || !data?.length) throw error
    return data
  } catch (err) {
    console.warn('[CBAM Service] Fallback benchmarks:', err?.message)
    const sectorBenchmarks = CBAM_BENCHMARKS[sectorId]
    if (!sectorBenchmarks) return []
    return Object.entries(sectorBenchmarks)
      .filter(([key]) => key !== 'default' && key !== 'note')
      .map(([key, val]) => ({
        benchmark_key: key,
        description: typeof val === 'object' ? val.description : key,
        value: typeof val === 'object' ? val.value : val,
        unit: 'tCO2e/t',
        is_default: false
      }))
  }
}

// ============================================================
// TIMELINE
// ============================================================

/**
 * Obtiene todos los eventos del timeline CBAM
 * @returns {Promise<Array>}
 */
export async function getTimeline() {
  try {
    const { data, error } = await supabase
      .from('cbam_timeline')
      .select('*')
      .order('event_date')

    if (error || !data?.length) throw error || new Error('No timeline')
    // Mapear campos Supabase → formato esperado por page.js
    return data.map(e => ({
      ...e,
      date: e.event_date,
      status: e.event_type,
      quarter: e.quarter_label,
      isNew: e.is_new,
      isPast: e.event_date < new Date().toISOString().split('T')[0]
    }))
  } catch (err) {
    console.warn('[CBAM Service] Fallback timeline:', err?.message)
    return CBAM_TIMELINE
  }
}

/**
 * Obtiene el próximo deadline CBAM
 * @returns {Promise<Object>}
 */
export async function getNextDeadlineDB() {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('cbam_timeline')
      .select('*')
      .gt('event_date', today)
      .order('event_date')
      .limit(1)
      .single()

    if (error || !data) throw error || new Error('No upcoming deadlines')

    const deadline = new Date(data.event_date)
    const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24))

    return {
      ...data,
      date: data.event_date,
      deadline: data.event_date,
      daysLeft,
      isUrgent: daysLeft <= 30,
      status: data.event_type
    }
  } catch {
    return getNextDeadlineHardcoded()
  }
}

// ============================================================
// CERTIFICADOS
// ============================================================

/**
 * Obtiene todos los certificados CBAM
 * @returns {Promise<Array>}
 */
export async function getCertificates() {
  try {
    const { data, error } = await supabase
      .from('cbam_certificates')
      .select('*')
      .order('sort_order')

    if (error || !data?.length) throw error
    // Mapear campos Supabase → formato esperado por page.js
    return data.map(c => ({
      ...c,
      required: c.is_required,
      condition: c.condition_code,
      appliesTo: c.applies_to_sectors,
      notAppliesTo: c.not_applies_to_sectors
    }))
  } catch (err) {
    console.warn('[CBAM Service] Fallback certificados:', err?.message)
    return Object.values(CBAM_CERTIFICATES)
  }
}

// ============================================================
// MARKUP VALORES POR DEFECTO
// ============================================================

/**
 * Obtiene el markup aplicable según el año
 * @param {number} year
 * @returns {Promise<Object>}
 */
export async function getDefaultValueMarkupDB(year = new Date().getFullYear()) {
  try {
    const { data, error } = await supabase
      .from('cbam_default_value_markup')
      .select('*')
      .lte('year', year)
      .order('year', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) throw error || new Error('No markup')
    return {
      markup: parseFloat(data.markup_pct),
      label: data.label,
      description: data.description
    }
  } catch {
    return getDefaultValueMarkupHardcoded(year)
  }
}

// ============================================================
// MARKUP SCHEDULE (todos los años para la tabla de la página)
// ============================================================

/**
 * Obtiene el calendario completo de markups por año
 * Usado para renderizar la tabla de penalización en page.js
 * @returns {Promise<Array<{year: number, markup: number, label: string, description: string}>>}
 */
export async function getDefaultValueMarkupSchedule() {
  try {
    const { data, error } = await supabase
      .from('cbam_default_value_markup')
      .select('year, markup_pct, label, description')
      .order('year')

    if (error || !data?.length) throw error || new Error('No markup schedule')
    return data.map(row => ({
      year: row.year,
      markup: parseFloat(row.markup_pct),
      label: row.label,
      description: row.description
    }))
  } catch (err) {
    console.warn('[CBAM Service] Fallback markup schedule:', err?.message)
    return CBAM_DEFAULT_VALUE_MARKUP.schedule
  }
}

// ============================================================
// EXTENSIÓN DOWNSTREAM
// ============================================================

/**
 * Obtiene la configuración de extensión downstream (2028)
 * @returns {Promise<Object>}
 */
export async function getDownstreamExtension() {
  try {
    const { data, error } = await supabase
      .from('cbam_config')
      .select('value')
      .eq('key', 'downstream_extension')
      .single()

    if (error || !data) throw error || new Error('No downstream config')

    const val = data.value
    // Si la estructura de Supabase es plana, mapear al formato que espera page.js
    if (val.stats) return val // Ya tiene formato completo (fallback-compatible)
    return {
      ...val,
      effectiveDate: val.effective_date || val.effectiveDate || '2028-01-01',
      stats: {
        newCNCodes: val.new_cn_codes ?? val.stats?.newCNCodes ?? 180,
        newImporters: val.new_importers ?? val.stats?.newImporters ?? 7500,
        newSMEs: val.new_smes ?? val.stats?.newSMEs ?? 3850,
      },
      // Usar datos del fallback hardcoded para campos que no se guardaron en la DB
      sectors: CBAM_DOWNSTREAM_EXTENSION.sectors,
      notIncluded: CBAM_DOWNSTREAM_EXTENSION.notIncluded,
      selectionCriteria: CBAM_DOWNSTREAM_EXTENSION.selectionCriteria,
    }
  } catch (err) {
    console.warn('[CBAM Service] Fallback downstream extension:', err?.message)
    return CBAM_DOWNSTREAM_EXTENSION
  }
}

// ============================================================
// UMBRAL DE MINIMIS
// ============================================================

/**
 * Obtiene el umbral de minimis CBAM
 * @returns {Promise<Object>}
 */
export async function getThreshold() {
  try {
    const { data, error } = await supabase
      .from('cbam_config')
      .select('value')
      .eq('key', 'de_minimis_threshold')
      .single()

    if (error || !data) throw error || new Error('No threshold config')

    const val = data.value
    // Mapear campos Supabase (snake_case) → formato page.js (camelCase)
    return {
      ...val,
      massThreshold: val.massThreshold ?? val.mass_threshold ?? 50,
      emissionsTarget: val.emissionsTarget ?? val.emissions_target ?? 0.99,
      appliesTo: val.appliesTo ?? val.applies_to ?? ['cement', 'fertilizers', 'ironSteel', 'aluminium'],
      notAppliesTo: val.notAppliesTo ?? val.not_applies_to ?? ['electricity', 'hydrogen'],
    }
  } catch (err) {
    console.warn('[CBAM Service] Fallback threshold:', err?.message)
    return CBAM_THRESHOLD
  }
}

// ============================================================
// CONFIGURACIÓN
// ============================================================

/**
 * Obtiene un valor de configuración CBAM
 * @param {string} key
 * @returns {Promise<any>}
 */
export async function getCBAMConfig(key) {
  try {
    const { data, error } = await supabase
      .from('cbam_config')
      .select('value')
      .eq('key', key)
      .single()

    if (error || !data) throw error
    return data.value
  } catch {
    // Fallback según la key
    const fallbacks = {
      de_minimis_threshold: CBAM_THRESHOLD,
      certificate_pricing: CBAM_CERTIFICATE_PRICING,
      downstream_extension: CBAM_DOWNSTREAM_EXTENSION,
    }
    return fallbacks[key] || null
  }
}

// ============================================================
// REGLAMENTOS
// ============================================================

/**
 * Obtiene todos los reglamentos CBAM
 * @returns {Promise<Array>}
 */
export async function getRegulations() {
  try {
    const { data, error } = await supabase
      .from('cbam_regulations')
      .select('*')
      .order('effective_date', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.warn('[CBAM Service] Error obteniendo reglamentos:', err?.message)
    return []
  }
}

// ============================================================
// CÁLCULOS CBAM (con Supabase)
// ============================================================

/**
 * Calcula el coste CBAM usando datos de Supabase
 * Compatible con la firma de calculateCBAMCost de cbamData.js
 *
 * @param {number} tonnes
 * @param {number} emissions - tCO2/t
 * @param {number} co2Price - EUR/tCO2
 * @param {string} sectorId
 * @returns {Promise<Object>}
 */
export async function calculateCBAMCostDB(tonnes, emissions, co2Price, sectorId) {
  try {
    const benchmark = await getBenchmarkDB(sectorId)

    const emissionsSubjectToCBAM = Math.max(0, emissions - benchmark)
    const totalEmissions = tonnes * emissionsSubjectToCBAM
    const totalCost = totalEmissions * co2Price

    return {
      tonnes,
      emissionsPerTonne: emissions,
      co2Price,
      benchmark,
      emissionsSubjectToCBAM,
      totalEmissions,
      totalCost,
      breakdown: {
        step1: `${emissions.toFixed(3)} tCO2/t (emisiones declaradas)`,
        step2: `${benchmark.toFixed(3)} tCO2/t (benchmark UE - NO se cobra)`,
        step3: `${emissionsSubjectToCBAM.toFixed(3)} tCO2/t (emisiones sujetas a CBAM)`,
        step4: `${tonnes} t × ${emissionsSubjectToCBAM.toFixed(3)} tCO2/t = ${totalEmissions.toFixed(2)} tCO2`,
        step5: `${totalEmissions.toFixed(2)} tCO2 × €${co2Price}/tCO2 = €${totalCost.toFixed(2)}`
      },
      info: {
        benchmarkExplanation: 'El benchmark representa las emisiones de las instalaciones europeas más eficientes (top 10%). Solo se cobra por emisiones que exceden este nivel.',
        savingsVsFullEmissions: `Ahorro vs cobrar todas las emisiones: €${((tonnes * emissions * co2Price) - totalCost).toFixed(2)}`
      }
    }
  } catch {
    return calculateCBAMCostHardcoded(tonnes, emissions, co2Price, sectorId)
  }
}

// ============================================================
// CÁLCULOS DE USUARIO
// ============================================================

/**
 * Guarda un cálculo CBAM del usuario
 * @param {string} userId
 * @param {Object} calculation
 * @returns {Promise<Object|null>}
 */
export async function saveCBAMCalculation(userId, calculation) {
  try {
    const { data, error } = await supabase
      .from('cbam_user_calculations')
      .insert({
        user_id: userId,
        sector_id: calculation.sectorId,
        product_key: calculation.productKey,
        cn_code: calculation.cnCode,
        country_code: calculation.countryCode,
        tonnes: calculation.tonnes,
        emission_factor: calculation.emissionFactor,
        emission_source: calculation.emissionSource || 'default',
        benchmark_value: calculation.benchmark,
        co2_price: calculation.co2Price,
        total_emissions: calculation.totalEmissions,
        total_cost: calculation.totalCost,
        markup_applied: calculation.markupApplied || 0,
        notes: calculation.notes
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('[CBAM Service] Error guardando cálculo:', err.message)
    return null
  }
}

/**
 * Obtiene el historial de cálculos CBAM del usuario
 * @param {string} userId
 * @param {number} limit
 * @param {number} offset
 * @returns {Promise<Array>}
 */
export async function getCBAMCalculationHistory(userId, limit = 20, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('cbam_user_calculations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('[CBAM Service] Error obteniendo historial:', err.message)
    return []
  }
}

// ============================================================
// ADMIN: ACTUALIZAR PRECIO ETS
// ============================================================

/**
 * Actualiza el precio actual del EU ETS (solo admin)
 * @param {number} price
 * @param {string} date - YYYY-MM-DD
 * @param {string} source - 'EEX', 'ICE', 'manual'
 * @returns {Promise<boolean>}
 */
export async function updateETSPrice(price, date, source = 'manual') {
  try {
    // Desmarcar el precio actual anterior
    await supabase
      .from('cbam_ets_prices')
      .update({ is_current: false })
      .eq('is_current', true)

    // Insertar nuevo precio como actual
    const { error } = await supabase
      .from('cbam_ets_prices')
      .insert({
        price,
        price_date: date,
        price_type: 'closing',
        source,
        is_current: true
      })

    if (error) throw error
    return true
  } catch (err) {
    console.error('[CBAM Service] Error actualizando precio ETS:', err.message)
    return false
  }
}
