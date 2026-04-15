/**
 * Motor de Interpretación de Requisitos Documentales TARIC
 *
 * Parsea las condiciones embebidas en duty_expression de taric_measures
 * y las condiciones estructuradas de measure_conditions, y las interpreta
 * como requisitos documentales prácticos para el despachante.
 */

// ─── Categorías de medida ──────────────────────────────────
export const MEASURE_CATEGORIES = {
  derechos: [103, 105, 106, 142, 143, 145, 146, 112, 115, 117, 119, 122, 551, 552, 553, 554, 555],
  paraaduanero: [710, 715, 410, 415, 350, 360, 465, 711, 714, 719, 724, 728, 731, 732, 755, 760, 761, 762, 707, 713, 726],
  restriccion: [277, 278, 474, 475, 695, 696, 750],
  cbam: [775],
  info: [109]
}

/**
 * Clasifica un measure_type_code en su categoría
 */
export function getMeasureCategory(typeCode) {
  for (const [category, codes] of Object.entries(MEASURE_CATEGORIES)) {
    if (codes.includes(typeCode)) return category
  }
  return 'otro'
}

// ─── Action code meanings ──────────────────────────────────
const ACTION_MEANINGS = {
  '29': 'permitted',   // Importación permitida tras control
  '24': 'permitted',   // Importación autorizada con licencia
  '27': 'apply_duty',  // Aplicar derecho mencionado
  '01': 'apply_duty',  // Aplicar derecho condicional
  '09': 'denied',      // Importación NO autorizada
  '04': 'denied',      // Importación no autorizada sin licencia
  '08': 'denied',      // Importación denegada (measure_conditions)
  '7':  'not_applicable', // Medida no aplicable
  '8':  'denied',      // Importación denegada (measure_conditions)
}

function actionMeaning(code) {
  return ACTION_MEANINGS[code] || 'unknown'
}

// ─── Parser de duty_expression ─────────────────────────────

/**
 * Parsea el campo duty_expression cuando contiene "Cond:".
 * Extrae: certificados requeridos, catch-all (fallbacks), y umbrales de exención.
 *
 * Soporta condition types de 1-2 caracteres (Y, B, E, YA, YB, etc.)
 * y patrones directos e invertidos (cert+29=habilitante, cert+04=identificativo).
 */
export function parseDutyConditions(dutyExpression) {
  if (!dutyExpression || !dutyExpression.startsWith('Cond:')) {
    return null
  }

  const text = dutyExpression.substring(5).trim() // Remove "Cond:"

  const certificates = []
  const fallbacks = []
  const thresholds = []

  // Regex to match each segment. Segments follow the pattern:
  // [TYPE] cert: [CODE] ([ACTION]):[DUTY]; or [TYPE] ([ACTION]):[DUTY];
  // TYPE can be 1-2 uppercase letters (Y, B, E, YA, YB, YC, etc.)
  //
  // We use a regex that finds each segment start (letter(s) followed by cert: or ( or digit)
  // and captures everything until the next segment or end of string.

  // Strategy: find all segments using matchAll with a pattern that captures each condition
  // Pattern for cert segments: TYPE cert: CODE (ACTION):DUTY
  const certRegex = /(?:^|;\s*)([A-Z]{1,2})\s+cert:\s*([A-Z0-9]-?[A-Z0-9]*(?:-\d+)?)\s*\((\d+)\):([^;]*)/g

  // Pattern for catch-all (no cert, no amount): TYPE (ACTION):
  const catchAllRegex = /(?:^|;\s*)([A-Z]{1,2})\s+\((\d+)\)\s*:/g

  // Pattern for threshold exemptions: TYPE AMOUNT/UNIT(ACTION):
  const thresholdRegex = /(?:^|;\s*)([A-Z]{1,2})\s+([\d,.]+)\/([A-Z]+)\s*\((\d+)\)\s*:/g

  // Extract certificate segments
  for (const match of text.matchAll(certRegex)) {
    const rawCode = match[2].replace(/-/g, '') // C-400 → C400
    certificates.push({
      type: match[1],
      certificate: rawCode,
      action: match[3],
      actionMeaning: actionMeaning(match[3]),
      duty: match[4]?.trim() || null
    })
  }

  // Extract catch-all segments (letter + action, no cert, no amount)
  for (const match of text.matchAll(catchAllRegex)) {
    // Make sure this isn't already captured as a cert or threshold
    const fullMatch = match[0]
    if (fullMatch.includes('cert:') || /\d+[.,]\d+\//.test(fullMatch)) continue

    fallbacks.push({
      type: match[1],
      certificate: null,
      action: match[2],
      actionMeaning: actionMeaning(match[2])
    })
  }

  // Extract threshold exemptions (amount without cert, with permissive action)
  for (const match of text.matchAll(thresholdRegex)) {
    const amount = parseFloat(match[2].replace(/\./g, '').replace(',', '.'))
    thresholds.push({
      type: match[1],
      amount,
      unit: match[3],
      action: match[4],
      actionMeaning: actionMeaning(match[4])
    })
  }

  if (certificates.length === 0 && fallbacks.length === 0 && thresholds.length === 0) {
    return null
  }

  return { certificates, fallbacks, thresholds }
}


// ─── Intérprete de condiciones ─────────────────────────────

/**
 * Interpreta las condiciones parseadas agrupándolas por condition type
 * y genera la estructura de requisitos documentales.
 *
 * @param {Object} parsed - Output de parseDutyConditions()
 * @param {Map} certDescriptions - Map de certificateCode → description (ES)
 * @returns {Object[]} Array de grupos de condiciones interpretados
 */
export function interpretConditions(parsed, certDescriptions = new Map()) {
  if (!parsed) return []

  const { certificates, fallbacks, thresholds } = parsed

  // Group certificates and fallbacks by condition type
  const groups = new Map()

  for (const cert of certificates) {
    if (!groups.has(cert.type)) {
      groups.set(cert.type, { certificates: [], fallback: null, thresholds: [] })
    }
    groups.get(cert.type).certificates.push(cert)
  }

  for (const fb of fallbacks) {
    if (!groups.has(fb.type)) {
      groups.set(fb.type, { certificates: [], fallback: null, thresholds: [] })
    }
    groups.get(fb.type).fallback = fb
  }

  for (const th of thresholds) {
    if (!groups.has(th.type)) {
      groups.set(th.type, { certificates: [], fallback: null, thresholds: [] })
    }
    groups.get(th.type).thresholds.push(th)
  }

  // Interpret each group
  const results = []

  for (const [type, group] of groups) {
    const options = group.certificates.map((cert, i) => {
      const desc = certDescriptions.get(cert.certificate) || null
      return {
        label: String.fromCharCode(65 + i), // A, B, C, ...
        certificateCode: cert.certificate,
        certificateDescription: desc,
        action: cert.actionMeaning,
        duty: cert.duty
      }
    })

    // Determine fallback action and text
    let fallbackAction = null
    let fallbackText = null
    if (group.fallback) {
      fallbackAction = group.fallback.actionMeaning
      if (fallbackAction === 'denied') {
        fallbackText = null // Will be translated by the component
      } else if (fallbackAction === 'permitted') {
        fallbackText = null
      }
    }

    // Threshold exemptions for this group
    const exemptions = group.thresholds
      .filter(th => th.actionMeaning === 'permitted')
      .map(th => ({
        amount: th.amount,
        unit: th.unit
      }))

    results.push({
      conditionType: type,
      options,
      fallbackAction,
      exemptions
    })
  }

  return results
}


// ─── Interpretación de measure_conditions (Fuente 2) ───────

/**
 * Interpreta filas de la tabla measure_conditions (preferencias, suspensiones, contingentes).
 *
 * @param {Object[]} rows - Filas de measure_conditions
 * @param {Map} certDescriptions - Map de certificateCode → description (ES)
 * @returns {Object[]} Array de grupos de condiciones interpretados
 */
export function interpretMeasureConditions(rows, certDescriptions = new Map()) {
  if (!rows || rows.length === 0) return []

  // Group by condition_code
  const groups = new Map()

  for (const row of rows) {
    const type = row.condition_code?.trim()
    if (!type) continue

    if (!groups.has(type)) {
      groups.set(type, { certificates: [], fallback: null })
    }

    if (row.certificate_code) {
      groups.get(type).certificates.push({
        certificate: row.certificate_code,
        action: row.action_code,
        actionMeaning: actionMeaning(row.action_code)
      })
    } else {
      // Catch-all (no cert)
      groups.get(type).fallback = {
        action: row.action_code,
        actionMeaning: actionMeaning(row.action_code)
      }
    }
  }

  const results = []

  for (const [type, group] of groups) {
    const options = group.certificates.map((cert, i) => ({
      label: String.fromCharCode(65 + i),
      certificateCode: cert.certificate,
      certificateDescription: certDescriptions.get(cert.certificate) || null,
      action: cert.actionMeaning,
      duty: null
    }))

    results.push({
      conditionType: type,
      options,
      fallbackAction: group.fallback?.actionMeaning || null,
      exemptions: []
    })
  }

  return results
}


// ─── Determinación de severidad ────────────────────────────

// Known "negative declaration" certificates (no real document required)
const NEGATIVE_DECLARATIONS = new Set([
  'Y900', 'Y160', 'Y169', 'Y792', 'Y793', 'Y036', 'Y085',
  'Y058', 'Y170', 'Y171', 'Y174', 'Y175', 'Y176', 'Y177',
  'Y072', 'Y073', 'Y076', 'Y077', 'Y078', 'Y079', 'Y151',
  'Y054', 'Y121', 'Y123', 'Y155',
  'Y786', 'Y787', 'Y789', 'Y790', 'Y791',
  'Y795', 'Y796', 'Y797', 'Y798', 'Y799'
])

/**
 * Determines severity for a document requirement based on its conditions.
 *
 * @param {number} measureType - The measure_type_code
 * @param {Object[]} conditionGroups - Interpreted condition groups
 * @returns {string} 'obligatorio' | 'condicional' | 'si_aplica' | 'informativo'
 */
export function determineSeverity(measureType, conditionGroups) {
  const category = getMeasureCategory(measureType)

  if (category === 'info') return 'informativo'

  // Preferences and suspensions: only apply if you present the cert
  if (category === 'derechos') return 'si_aplica'

  // No conditions parsed → the measure itself is a flat requirement (e.g. 109)
  if (!conditionGroups || conditionGroups.length === 0) return 'obligatorio'

  // Check if ANY group has all "permitted" certificates being negative declarations
  const hasNegativeOption = conditionGroups.some(group =>
    group.options.some(opt =>
      opt.action === 'permitted' && NEGATIVE_DECLARATIONS.has(opt.certificateCode)
    )
  )

  return hasNegativeOption ? 'condicional' : 'obligatorio'
}
