/**
 * Validador cruzado para datos extraídos de facturas comerciales.
 *
 * Tras la extracción IA (Claude Vision), comparamos los datos entre sí
 * para detectar errores comunes:
 *   - Cuadre de totales (suma de líneas vs total factura)
 *   - Coherencia precio × cantidad = total por línea
 *   - Campos críticos ausentes
 *   - Formatos inválidos
 *   - Situaciones especiales (facturas intra-UE, totales negativos, etc.)
 *
 * Se ejecuta tanto en backend (al recibir respuesta de Claude) como en
 * frontend (en tiempo real al editar campos).
 */

const VALID_INCOTERMS_2020 = [
  'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP',
  'FAS', 'FOB', 'CFR', 'CIF',
]

const VALID_CURRENCIES = [
  'EUR', 'USD', 'GBP', 'CNY', 'JPY', 'CHF', 'CAD', 'AUD',
  'HKD', 'SGD', 'KRW', 'INR', 'BRL', 'MXN', 'TRY', 'NOK',
  'SEK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'ZAR', 'AED',
  'SAR', 'THB', 'IDR', 'MYR', 'PHP', 'VND', 'ILS', 'NZD',
]

const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
])

const ISO_COUNTRY_RE = /^[A-Z]{2}$/

/**
 * Validar datos extraídos. Devuelve array de issues.
 *
 * @param {object} data - JSON parseado de Claude { invoice, buyer, lines, ... }
 * @returns {Array<{code: string, severity: 'error'|'warning'|'info', message: string, field?: string, lineNumber?: number}>}
 */
export function validateExtractedInvoice(data) {
  const issues = []

  if (!data || typeof data !== 'object') {
    issues.push({
      code: 'NO_DATA',
      severity: 'error',
      message: 'No se han podido extraer datos de la factura.',
    })
    return issues
  }

  const invoice = data.invoice || {}
  const buyer = data.buyer || {}
  const lines = Array.isArray(data.lines) ? data.lines : []

  // ================================================
  // 1. CUADRE DE TOTALES (la validación más crítica)
  // ================================================
  if (lines.length > 0 && typeof invoice.total_amount === 'number' && invoice.total_amount > 0) {
    const sumLines = lines.reduce((acc, l) => {
      return acc + (typeof l.total_price === 'number' ? l.total_price : 0)
    }, 0)
    const diff = Math.abs(sumLines - invoice.total_amount)
    const tolerance = invoice.total_amount * 0.01 // 1%

    if (diff > tolerance) {
      issues.push({
        code: 'TOTAL_MISMATCH',
        severity: 'error',
        field: 'invoice.total_amount',
        message: `La suma de las líneas (${sumLines.toFixed(2)}) no coincide con el total de la factura (${invoice.total_amount.toFixed(2)}). Diferencia: ${diff.toFixed(2)}.`,
      })
    }
  }

  // ================================================
  // 2. COHERENCIA precio × cantidad = total por línea
  // ================================================
  lines.forEach((line, idx) => {
    const lineNumber = line.line_number ?? idx + 1
    if (
      typeof line.quantity === 'number' &&
      typeof line.unit_price === 'number' &&
      typeof line.total_price === 'number' &&
      line.total_price > 0
    ) {
      const expected = line.quantity * line.unit_price
      const diff = Math.abs(expected - line.total_price)
      const tolerance = Math.max(line.total_price * 0.01, 0.02)
      if (diff > tolerance) {
        issues.push({
          code: 'LINE_CALC_MISMATCH',
          severity: 'error',
          field: 'lines.total_price',
          lineNumber,
          message: `Línea ${lineNumber}: ${line.quantity} × ${line.unit_price} = ${expected.toFixed(2)}, pero el total declarado es ${line.total_price.toFixed(2)}. Posible error en separador decimal.`,
        })
      }
    }
  })

  // ================================================
  // 3. CAMPOS CRÍTICOS AUSENTES
  // ================================================
  if (lines.length === 0) {
    issues.push({
      code: 'NO_LINES',
      severity: 'error',
      message: 'No se han identificado líneas de producto en la factura.',
    })
  }

  if (!invoice.supplier_country) {
    issues.push({
      code: 'MISSING_SUPPLIER_COUNTRY',
      severity: 'warning',
      field: 'invoice.supplier_country',
      message: 'No se ha detectado el país del proveedor (necesario para aranceles).',
    })
  }

  if (!invoice.currency) {
    issues.push({
      code: 'MISSING_CURRENCY',
      severity: 'warning',
      field: 'invoice.currency',
      message: 'No se ha detectado la divisa de la factura.',
    })
  }

  if (!invoice.incoterm) {
    issues.push({
      code: 'MISSING_INCOTERM',
      severity: 'warning',
      field: 'invoice.incoterm',
      message: 'No se ha detectado el Incoterm (importante para el valor en aduana).',
    })
  }

  // ================================================
  // 4. FORMATOS
  // ================================================
  if (invoice.supplier_country && !ISO_COUNTRY_RE.test(invoice.supplier_country)) {
    issues.push({
      code: 'INVALID_COUNTRY_FORMAT',
      severity: 'warning',
      field: 'invoice.supplier_country',
      message: `País del proveedor inválido: "${invoice.supplier_country}". Debe ser código ISO 2 letras (ej: CN, US).`,
    })
  }

  if (buyer.buyer_country && !ISO_COUNTRY_RE.test(buyer.buyer_country)) {
    issues.push({
      code: 'INVALID_COUNTRY_FORMAT',
      severity: 'warning',
      field: 'buyer.buyer_country',
      message: `País del comprador inválido: "${buyer.buyer_country}".`,
    })
  }

  if (invoice.currency && !VALID_CURRENCIES.includes(invoice.currency)) {
    issues.push({
      code: 'INVALID_CURRENCY',
      severity: 'warning',
      field: 'invoice.currency',
      message: `Divisa no reconocida: "${invoice.currency}".`,
    })
  }

  if (invoice.incoterm) {
    const incotermClean = String(invoice.incoterm).toUpperCase().split(' ')[0]
    if (!VALID_INCOTERMS_2020.includes(incotermClean)) {
      issues.push({
        code: 'INVALID_INCOTERM',
        severity: 'warning',
        field: 'invoice.incoterm',
        message: `Incoterm no reconocido: "${invoice.incoterm}". Debe ser uno de los 11 Incoterms 2020.`,
      })
    }
  }

  if (invoice.invoice_date) {
    const parsed = new Date(invoice.invoice_date)
    if (isNaN(parsed.getTime())) {
      issues.push({
        code: 'INVALID_DATE',
        severity: 'warning',
        field: 'invoice.invoice_date',
        message: `Fecha de factura no válida: "${invoice.invoice_date}".`,
      })
    } else if (parsed.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      issues.push({
        code: 'FUTURE_DATE',
        severity: 'warning',
        field: 'invoice.invoice_date',
        message: 'La fecha de la factura es futura. Verifica que sea correcta.',
      })
    }
  }

  // ================================================
  // 5. LÍNEAS SIN DATOS PARA CLASIFICAR
  // ================================================
  lines.forEach((line, idx) => {
    const lineNumber = line.line_number ?? idx + 1
    const desc = (line.description || line.description_es || '').trim()
    if (desc.length < 3) {
      issues.push({
        code: 'LINE_NO_DESCRIPTION',
        severity: 'warning',
        lineNumber,
        field: 'lines.description',
        message: `Línea ${lineNumber}: descripción demasiado corta o ausente. No se podrá clasificar.`,
      })
    }
    if (typeof line.total_price !== 'number' || line.total_price <= 0) {
      issues.push({
        code: 'LINE_NO_VALUE',
        severity: 'warning',
        lineNumber,
        field: 'lines.total_price',
        message: `Línea ${lineNumber}: sin valor. No se podrá calcular el arancel.`,
      })
    }
  })

  // ================================================
  // 6. SITUACIONES ESPECIALES
  // ================================================
  if (typeof invoice.total_amount === 'number' && invoice.total_amount <= 0) {
    issues.push({
      code: 'NEGATIVE_TOTAL',
      severity: 'error',
      field: 'invoice.total_amount',
      message: 'El total de la factura es 0 o negativo. ¿Es una nota de crédito o proforma?',
    })
  }

  if (
    invoice.supplier_country &&
    buyer.buyer_country &&
    invoice.supplier_country === buyer.buyer_country
  ) {
    issues.push({
      code: 'SAME_COUNTRY',
      severity: 'info',
      message: 'Proveedor y comprador están en el mismo país. Verifica si realmente es una importación.',
    })
  }

  if (invoice.supplier_country && EU_COUNTRIES.has(invoice.supplier_country)) {
    issues.push({
      code: 'INTRA_EU',
      severity: 'info',
      message: 'El proveedor está en la UE. No hay aranceles en operaciones intra-UE (puede aplicar IVA intracomunitario).',
    })
  }

  if (lines.length > 50) {
    issues.push({
      code: 'TOO_MANY_LINES',
      severity: 'warning',
      message: `La factura tiene ${lines.length} líneas. Verifica con atención que la extracción es correcta.`,
    })
  }

  return issues
}

/**
 * Resumen de validación con contadores.
 */
export function summarizeValidation(issues) {
  const errors = issues.filter(i => i.severity === 'error').length
  const warnings = issues.filter(i => i.severity === 'warning').length
  const infos = issues.filter(i => i.severity === 'info').length
  return {
    issues,
    errors,
    warnings,
    infos,
    is_reliable: errors === 0,
  }
}
