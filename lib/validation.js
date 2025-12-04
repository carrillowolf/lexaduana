/**
 * Sistema de Validación de Entrada para LexAduana
 * 
 * Protege contra:
 * - Inyección SQL (aunque Supabase ya lo previene)
 * - XSS (Cross-Site Scripting)
 * - Datos malformados
 * - Valores fuera de rango
 * 
 * USO:
 * import { validateCalculationInput } from '@/lib/validation'
 * const validation = validateCalculationInput(body)
 * if (!validation.valid) {
 *   return NextResponse.json({ error: validation.error }, { status: 400 })
 * }
 * // Usar validation.sanitized.hsCode, etc.
 */

// ============================================
// VALIDADOR: CLASIFICADOR IA
// ============================================

/**
 * Valida entrada del clasificador IA (/api/classify-product)
 * 
 * @param {object} body - { description, countryCode?, cifValue? }
 * @returns {{ valid: boolean, error?: string, sanitized?: object }}
 */
export function validateClassificationInput(body) {
  const { description, countryCode, cifValue } = body || {}

  // Descripción obligatoria
  if (!description || typeof description !== 'string') {
    return { valid: false, error: 'La descripción del producto es obligatoria' }
  }

  // Longitud mínima y máxima
  const trimmedDesc = description.trim()
  if (trimmedDesc.length < 10) {
    return { valid: false, error: 'La descripción debe tener al menos 10 caracteres' }
  }
  if (trimmedDesc.length > 2000) {
    return { valid: false, error: 'La descripción no puede exceder 2000 caracteres' }
  }

  // Detectar patrones sospechosos
  if (containsSuspiciousPatterns(trimmedDesc)) {
    return { valid: false, error: 'La descripción contiene caracteres no permitidos' }
  }

  // País opcional pero si existe debe ser válido
  let cleanCountry = null
  if (countryCode) {
    if (typeof countryCode !== 'string') {
      return { valid: false, error: 'Código de país inválido' }
    }
    cleanCountry = countryCode.toUpperCase().trim()
    if (!/^[A-Z]{2,3}$/.test(cleanCountry) && cleanCountry !== 'ERGA OMNES') {
      return { valid: false, error: 'Código de país debe ser ISO 2-3 letras (ej: CN, US, DEU)' }
    }
  }

  // Valor CIF opcional pero si existe debe ser positivo
  let numericCif = null
  if (cifValue !== undefined && cifValue !== null && cifValue !== '') {
    numericCif = parseFloat(cifValue)
    if (isNaN(numericCif) || numericCif < 0) {
      return { valid: false, error: 'El valor CIF debe ser un número positivo' }
    }
    if (numericCif > 999999999) {
      return { valid: false, error: 'El valor CIF excede el máximo permitido' }
    }
  }

  return {
    valid: true,
    sanitized: {
      description: sanitizeString(trimmedDesc),
      countryCode: cleanCountry,
      cifValue: numericCif,
    },
  }
}

// ============================================
// VALIDADOR: CÁLCULO DE ARANCELES
// ============================================

/**
 * Valida entrada del cálculo de aranceles (/api/calculate)
 * 
 * @param {object} body - { hsCode, cifValue, countryCode? }
 * @returns {{ valid: boolean, error?: string, sanitized?: object }}
 */
export function validateCalculationInput(body) {
  const { hsCode, cifValue, countryCode } = body || {}

  // Código HS obligatorio
  if (!hsCode || typeof hsCode !== 'string') {
    return { valid: false, error: 'El código HS es obligatorio' }
  }

  // Limpiar espacios y validar formato (8-10 dígitos)
  const cleanHsCode = hsCode.replace(/[\s.-]/g, '')
  if (!/^\d{4,10}$/.test(cleanHsCode)) {
    return { valid: false, error: 'El código HS debe tener entre 4 y 10 dígitos numéricos' }
  }

  // Valor CIF obligatorio y positivo
  if (cifValue === undefined || cifValue === null || cifValue === '') {
    return { valid: false, error: 'El valor en aduana (CIF) es obligatorio' }
  }

  const numericValue = parseFloat(cifValue)
  if (isNaN(numericValue)) {
    return { valid: false, error: 'El valor en aduana debe ser un número' }
  }
  if (numericValue <= 0) {
    return { valid: false, error: 'El valor en aduana debe ser mayor que cero' }
  }
  if (numericValue > 999999999) {
    return { valid: false, error: 'El valor en aduana excede el máximo permitido (999.999.999€)' }
  }

  // País opcional, por defecto ERGA OMNES
  let cleanCountry = 'ERGA OMNES'
  if (countryCode && typeof countryCode === 'string') {
    cleanCountry = countryCode.toUpperCase().trim()
    // Permitir ISO 2-3 letras o códigos especiales como "ERGA OMNES"
    if (!/^[A-Z]{2,3}$/.test(cleanCountry) &&
      !['ERGA OMNES', 'EU', 'EFTA'].includes(cleanCountry)) {
      return { valid: false, error: 'Código de país no válido' }
    }
  }

  return {
    valid: true,
    sanitized: {
      hsCode: cleanHsCode,
      cifValue: numericValue,
      countryCode: cleanCountry,
    },
  }
}

// ============================================
// VALIDADOR: BÚSQUEDA DE CÓDIGOS
// ============================================

/**
 * Valida entrada de búsqueda de códigos (/api/search-codes)
 * 
 * @param {object} body - { query, limit? }
 * @returns {{ valid: boolean, error?: string, sanitized?: object }}
 */
export function validateSearchInput(body) {
  const { query, limit } = body || {}

  if (!query || typeof query !== 'string') {
    return { valid: false, error: 'El término de búsqueda es obligatorio' }
  }

  const trimmed = query.trim()
  if (trimmed.length < 2) {
    return { valid: false, error: 'El término de búsqueda debe tener al menos 2 caracteres' }
  }
  if (trimmed.length > 200) {
    return { valid: false, error: 'El término de búsqueda es demasiado largo (máx. 200)' }
  }

  // Detectar patrones sospechosos
  if (containsSuspiciousPatterns(trimmed)) {
    return { valid: false, error: 'El término contiene caracteres no permitidos' }
  }

  // Límite de resultados
  const numLimit = parseInt(limit) || 20
  if (numLimit < 1 || numLimit > 100) {
    return { valid: false, error: 'El límite debe estar entre 1 y 100' }
  }

  return {
    valid: true,
    sanitized: {
      query: sanitizeString(trimmed),
      limit: numLimit,
    },
  }
}

// ============================================
// VALIDADOR: CÁLCULO MASIVO (BULK)
// ============================================

/**
 * Valida entrada del cálculo masivo (/api/bulk-calculate)
 * 
 * @param {object} body - { items: [{ hsCode, cifValue, countryCode? }, ...] }
 * @returns {{ valid: boolean, error?: string, sanitized?: object }}
 */
export function validateBulkCalculationInput(body) {
  const { items } = body || {}

  if (!Array.isArray(items)) {
    return { valid: false, error: 'Se esperaba un array de productos' }
  }

  if (items.length === 0) {
    return { valid: false, error: 'El array de productos está vacío' }
  }

  if (items.length > 100) {
    return { valid: false, error: 'Máximo 100 productos por petición' }
  }

  const sanitizedItems = []
  for (let i = 0; i < items.length; i++) {
    const validation = validateCalculationInput(items[i])
    if (!validation.valid) {
      return { valid: false, error: `Producto ${i + 1}: ${validation.error}` }
    }
    sanitizedItems.push(validation.sanitized)
  }

  return { valid: true, sanitized: { items: sanitizedItems } }
}

// ============================================
// VALIDADOR: GUARDAR CÁLCULO
// ============================================

/**
 * Valida entrada para guardar cálculo en historial
 * 
 * @param {object} body - Datos del cálculo a guardar
 * @returns {{ valid: boolean, error?: string, sanitized?: object }}
 */
export function validateSaveCalculationInput(body) {
  const {
    hsCode,
    cifValue,
    countryCode,
    dutyRate,
    dutyAmount,
    vatRate,
    vatAmount,
    totalAmount,
    description,
    notes
  } = body || {}

  // Validar campos básicos del cálculo
  const calcValidation = validateCalculationInput({ hsCode, cifValue, countryCode })
  if (!calcValidation.valid) {
    return calcValidation
  }

  // Validar montos (deben ser números)
  const amounts = { dutyRate, dutyAmount, vatRate, vatAmount, totalAmount }
  for (const [key, value] of Object.entries(amounts)) {
    if (value !== undefined && value !== null) {
      const num = parseFloat(value)
      if (isNaN(num) || num < 0) {
        return { valid: false, error: `${key} debe ser un número positivo` }
      }
    }
  }

  // Descripción opcional pero sanitizada
  let cleanDescription = null
  if (description && typeof description === 'string') {
    cleanDescription = sanitizeString(description.trim()).substring(0, 500)
  }

  // Notas opcionales pero sanitizadas
  let cleanNotes = null
  if (notes && typeof notes === 'string') {
    cleanNotes = sanitizeString(notes.trim()).substring(0, 1000)
  }

  return {
    valid: true,
    sanitized: {
      ...calcValidation.sanitized,
      dutyRate: dutyRate ? parseFloat(dutyRate) : null,
      dutyAmount: dutyAmount ? parseFloat(dutyAmount) : null,
      vatRate: vatRate ? parseFloat(vatRate) : null,
      vatAmount: vatAmount ? parseFloat(vatAmount) : null,
      totalAmount: totalAmount ? parseFloat(totalAmount) : null,
      description: cleanDescription,
      notes: cleanNotes,
    },
  }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Detecta patrones sospechosos (inyección SQL, XSS, etc.)
 * @param {string} str 
 * @returns {boolean}
 */
function containsSuspiciousPatterns(str) {
  const suspiciousPatterns = [
    /<script/i,           // XSS
    /javascript:/i,       // XSS
    /on\w+\s*=/i,         // Event handlers (onclick=, onerror=, etc.)
    /DROP\s+TABLE/i,      // SQL injection
    /DELETE\s+FROM/i,     // SQL injection
    /INSERT\s+INTO/i,     // SQL injection
    /UPDATE\s+.*SET/i,    // SQL injection
    /UNION\s+SELECT/i,    // SQL injection
    /--\s*$/,             // SQL comment at end
    /\/\*.*\*\//,         // SQL block comment
    /;\s*DROP/i,          // SQL injection
    /\x00/,               // Null byte
    /\\x[0-9a-f]{2}/i,    // Hex escape
  ]

  return suspiciousPatterns.some(pattern => pattern.test(str))
}

/**
 * Sanitiza un string removiendo caracteres potencialmente peligrosos
 * @param {string} str 
 * @returns {string}
 */
function sanitizeString(str) {
  return str
    .replace(/[<>]/g, '')           // Remove < >
    .replace(/[\x00-\x1F]/g, '')    // Remove control characters
    .trim()
}

/**
 * Valida formato UUID
 * @param {string} str 
 * @returns {boolean}
 */
export function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Valida formato email
 * @param {string} email 
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}