/**
 * Utilidades de seguridad para archivos subidos por el usuario.
 *
 * Diseñado para el endpoint /api/extract-invoice donde se recibe una
 * factura comercial (PDF/PNG/JPG) y se envía a Claude Vision.
 *
 * Principios:
 * - El Content-Type del navegador es FALSIFICABLE → validamos magic bytes.
 * - Limitamos tamaño y nº de páginas (anti-bomba/zip-bomb).
 * - El buffer se procesa en memoria; el caller NUNCA debe persistirlo.
 */

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
export const MAX_PDF_PAGES = 20

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
])

/**
 * Detecta el tipo real de un buffer mirando los primeros bytes (magic bytes).
 *
 * @param {Buffer} buffer
 * @returns {'application/pdf' | 'image/png' | 'image/jpeg' | null}
 */
export function detectMimeFromBuffer(buffer) {
  if (!buffer || buffer.length < 4) return null

  // PDF: %PDF (25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'application/pdf'
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png'
  }

  // JPEG: FF D8 FF
  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg'
  }

  return null
}

/**
 * Cuenta páginas en un buffer PDF de forma rápida (sin parsear completo).
 * Usa la heurística estándar de contar /Type /Page (no /Pages) en el stream.
 *
 * @param {Buffer} buffer
 * @returns {number} Número estimado de páginas, o 0 si no se puede determinar.
 */
export function countPdfPages(buffer) {
  try {
    const text = buffer.toString('latin1')
    // Coincidencias con /Type /Page (excluyendo /Pages)
    const matches = text.match(/\/Type\s*\/Page(?![sA-Za-z])/g)
    return matches ? matches.length : 0
  } catch {
    return 0
  }
}

/**
 * Validación completa del archivo subido.
 * Devuelve { ok: true, mime } o { ok: false, error, status }.
 *
 * @param {File} file - File del FormData
 * @param {Buffer} buffer - Buffer ya leído del archivo
 * @returns {{ok: true, mime: string} | {ok: false, error: string, status: number}}
 */
export function validateUploadedInvoice(file, buffer) {
  if (!file || !buffer) {
    return { ok: false, error: 'No se ha recibido ningún archivo.', status: 400 }
  }

  if (buffer.length === 0) {
    return { ok: false, error: 'El archivo está vacío.', status: 400 }
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `El archivo supera el tamaño máximo de ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`,
      status: 413,
    }
  }

  // 1. MIME declarado por el navegador (primer filtro)
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return {
      ok: false,
      error: 'Formato no soportado. Solo PDF, PNG o JPG.',
      status: 415,
    }
  }

  // 2. MIME REAL desde magic bytes (no es falsificable)
  const realMime = detectMimeFromBuffer(buffer)
  if (!realMime) {
    return {
      ok: false,
      error: 'No se ha podido verificar el tipo de archivo. Solo PDF, PNG o JPG.',
      status: 415,
    }
  }

  // 3. Coherencia entre lo declarado y lo real
  if (file.type && file.type !== realMime) {
    return {
      ok: false,
      error: 'El archivo no coincide con su extensión declarada.',
      status: 415,
    }
  }

  // 4. Si es PDF, comprobar nº de páginas
  if (realMime === 'application/pdf') {
    const pages = countPdfPages(buffer)
    if (pages > MAX_PDF_PAGES) {
      return {
        ok: false,
        error: `El PDF tiene demasiadas páginas (máximo ${MAX_PDF_PAGES}).`,
        status: 413,
      }
    }
  }

  return { ok: true, mime: realMime }
}

/**
 * Headers de seguridad estándar para respuestas que contienen datos sensibles.
 */
export const SECURE_RESPONSE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'Pragma': 'no-cache',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
}

/**
 * Verifica que la petición proviene del propio sitio (anti-CSRF básico).
 * Acepta requests sin Origin (apps móviles, tests) salvo en producción.
 */
export function isSameOrigin(request) {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL

  if (!allowedOrigin) {
    // Sin variable configurada → permitir (dev). En prod debe estar siempre.
    return true
  }

  if (origin) {
    return origin === allowedOrigin
  }

  if (referer) {
    try {
      const refUrl = new URL(referer)
      const allowedUrl = new URL(allowedOrigin)
      return refUrl.origin === allowedUrl.origin
    } catch {
      return false
    }
  }

  // Sin Origin ni Referer → bloquear en producción
  return process.env.NODE_ENV !== 'production'
}
