/**
 * CBAM Self-Assessment Data Layer (Fallback + Helpers)
 *
 * Fuente oficial:
 * - cbam_cn_codes_full.json — CBAM Self Assessment Tool v1.1 (CE, 28/03/2025) — 573 registros
 * - cbam_benchmarks.json   — Reg. (EU) 2025/2620 (06/02/2026) — 570 CN codes, 661 valores
 * - cbam_countries.json    — 246 países con estado CBAM
 *
 * Este módulo se usa como fallback cuando Supabase no está disponible.
 * El patrón es idéntico al resto de cbamService.js: Supabase → fallback hardcoded.
 */

import cnCodesFullData from '@/lib/data/cbam_cn_codes_full.json'
import benchmarksData from '@/lib/data/cbam_benchmarks.json'
import countriesData from '@/lib/data/cbam_countries.json'

// Re-exportar datos crudos para seed scripts y uso directo
export const CBAM_CN_CODES_FULL = cnCodesFullData
export const CBAM_BENCHMARKS_OFFICIAL = benchmarksData
export const CBAM_COUNTRIES = countriesData

// ============================================================
// HELPERS DE BÚSQUEDA
// ============================================================

/**
 * Busca un CN code completo con toda su información de assessment
 * @param {string} cnCode - Código CN de 8 dígitos (con o sin ceros a la izquierda)
 * @returns {object|null}
 */
export function findCNCodeFull(cnCode) {
  if (!cnCode) return null
  const normalized = cnCode.replace(/\D/g, '').padEnd(8, '0')

  // Búsqueda exacta primero
  let match = CBAM_CN_CODES_FULL.find(c => c.cnCode === normalized)
  if (match) return match

  // Búsqueda por prefijo (el usuario puede poner 6 dígitos)
  const code = cnCode.replace(/\D/g, '')
  match = CBAM_CN_CODES_FULL.find(c => c.cnCode.startsWith(code) || code.startsWith(c.cnCode))
  return match || null
}

/**
 * Busca benchmarks oficiales para un CN code
 * @param {string} cnCode - Código CN de 8 dígitos
 * @returns {object|null} - { sector, cnCode, description, benchmarkValues: [...] }
 */
export function findBenchmarksForCN(cnCode) {
  if (!cnCode) return null
  const normalized = cnCode.replace(/\D/g, '').padEnd(8, '0')

  let match = CBAM_BENCHMARKS_OFFICIAL.find(b => b.cnCode === normalized)
  if (match) return match

  // Búsqueda por prefijo
  const code = cnCode.replace(/\D/g, '')
  match = CBAM_BENCHMARKS_OFFICIAL.find(b => b.cnCode.startsWith(code) || code.startsWith(b.cnCode))
  return match || null
}

/**
 * Verifica si un país está sujeto a CBAM
 * @param {string} countryCode - ISO 2-letter code
 * @returns {object|null} - { code, name, cbamApplies, isEUMember }
 */
export function findCountry(countryCode) {
  if (!countryCode) return null
  return CBAM_COUNTRIES.find(c => c.code === countryCode.toUpperCase()) || null
}

/**
 * Obtiene la lista de países donde CBAM aplica (para el select del formulario)
 * @returns {Array<{code: string, name: string}>}
 */
export function getCBAMApplicableCountries() {
  return CBAM_COUNTRIES
    .filter(c => c.cbamApplies)
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Obtiene la lista de países excluidos
 * @returns {Array}
 */
export function getCBAMExcludedCountries() {
  return CBAM_COUNTRIES
    .filter(c => !c.cbamApplies)
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Ejecuta el self-assessment completo para un CN code + país
 * @param {string} cnCode
 * @param {string} countryCode
 * @param {string} importType - 'libre_practica' | 'devolucion_203' | 'otro'
 * @param {string} valueRange - 'lte150' | 'gt150'
 * @returns {object} - Resultado completo del assessment
 */
export function runSelfAssessment(cnCode, countryCode, importType = 'libre_practica', valueRange = 'gt150') {
  const result = {
    cbamApplies: false,
    exclusionReasons: [],
    product: null,
    country: null,
    benchmarks: null,
    requirements: null,
  }

  // 1. Verificar país
  const country = findCountry(countryCode)
  result.country = country

  if (country && !country.cbamApplies) {
    result.exclusionReasons.push({
      code: 'COUNTRY_EXCLUDED',
      reason: country.isEUMember
        ? `${country.name} es Estado miembro de la UE — CBAM no aplica a comercio intra-UE`
        : `${country.name} está excluido del CBAM (EEE/acuerdo ETS equivalente)`
    })
  }

  // 2. Verificar valor de minimis por envío
  if (valueRange === 'lte150') {
    result.exclusionReasons.push({
      code: 'VALUE_THRESHOLD',
      reason: 'Envíos con valor ≤ 150€ están exentos del CBAM'
    })
  }

  // 3. Verificar tipo de importación
  if (importType === 'devolucion_203') {
    result.exclusionReasons.push({
      code: 'RETURNED_GOODS',
      reason: 'Mercancías devueltas (Art. 203 UCC) están exentas del CBAM'
    })
  }

  // 4. Buscar CN code
  const product = findCNCodeFull(cnCode)
  result.product = product

  if (!product) {
    result.exclusionReasons.push({
      code: 'CN_NOT_CBAM',
      reason: `El código CN ${cnCode} no está incluido en la lista de productos CBAM (573 códigos)`
    })
  }

  // 5. Buscar benchmarks
  if (product) {
    result.benchmarks = findBenchmarksForCN(cnCode)
  }

  // 6. Determinar resultado
  if (result.exclusionReasons.length === 0 && product) {
    result.cbamApplies = true

    // Parsear precursores
    const precursors = parsePrecursors(product.precursors)

    // Parsear rutas de producción
    const routes = parseProductionRoutes(product.productionRoutes)

    // Determinar si aplica de minimis al sector
    const deMinimisApplies = !['Electricity', 'Chemicals (hydrogen)'].includes(product.mainCategory)

    result.requirements = {
      sector: product.mainCategory,
      aggregatedCategory: product.aggregatedCategory,
      cnCode: product.cnCode,
      description: product.description,
      indirectEmissions: product.indirectEmissions,
      productionRoutes: routes,
      productionRoutesDetail: product.productionRoutesDetail,
      precursors,
      installationData: product.installationData,
      extraDataRequired: product.extraDataRequired !== 'None' ? product.extraDataRequired : null,
      indirectEmissionsData: product.indirectEmissions ? product.indirectEmissionsData : null,
      specialProvisions: product.specialProvisions !== 'None' ? product.specialProvisions : null,
      carbonPriceAbroad: product.carbonPriceAbroad,
      deMinimisApplies,
      deMinimisThreshold: deMinimisApplies ? 50 : null,
      quantityUnit: product.quantity,
    }
  }

  return result
}

// ============================================================
// PARSERS INTERNOS
// ============================================================

/**
 * Parsea la cadena de precursores en un array estructurado
 * @param {string} raw - Ej: "Cement clinker;\nCalcined clay, if used in the process"
 * @returns {Array<{name: string, conditional: boolean, condition: string|null}>}
 */
function parsePrecursors(raw) {
  if (!raw || raw === 'None') return []

  return raw
    .split(/[;\n]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(line => {
      const ifMatch = line.match(/^(.+?),?\s+if\s+(.+)$/i)
      if (ifMatch) {
        return {
          name: ifMatch[1].trim(),
          conditional: true,
          condition: ifMatch[2].trim()
        }
      }
      return {
        name: line.replace(/[,;]+$/, '').trim(),
        conditional: false,
        condition: null
      }
    })
}

/**
 * Parsea las rutas de producción
 * @param {string} raw - Ej: "BOF, BOF+BF, EAF, EAF (alloy)"
 * @returns {string[]}
 */
function parseProductionRoutes(raw) {
  if (!raw || raw === 'None') return []
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

// ============================================================
// MAPEO DE SECTORES (normalización de nombres)
// ============================================================

export const SECTOR_DISPLAY = {
  'Cement': { id: 'cement', name: 'Cemento', icon: '🏗️', color: 'gray' },
  'Iron and steel': { id: 'ironSteel', name: 'Hierro y Acero', icon: '🔩', color: 'slate' },
  'Iron & Steel': { id: 'ironSteel', name: 'Hierro y Acero', icon: '🔩', color: 'slate' },
  'Aluminium': { id: 'aluminium', name: 'Aluminio', icon: '🥫', color: 'blue' },
  'Fertilisers': { id: 'fertilizers', name: 'Fertilizantes', icon: '🌱', color: 'green' },
  'Chemicals (hydrogen)': { id: 'hydrogen', name: 'Hidrógeno', icon: '💨', color: 'cyan' },
  'Hydrogen': { id: 'hydrogen', name: 'Hidrógeno', icon: '💨', color: 'cyan' },
  'Electricity': { id: 'electricity', name: 'Electricidad', icon: '⚡', color: 'yellow' },
}

/**
 * Normaliza el nombre de sector del JSON al formato display
 */
export function getSectorDisplay(mainCategory) {
  return SECTOR_DISPLAY[mainCategory] || { id: mainCategory, name: mainCategory, icon: '📦', color: 'gray' }
}
