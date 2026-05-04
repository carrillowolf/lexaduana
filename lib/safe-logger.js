/**
 * Safe logger — wraps console.* with automatic redaction of common PII patterns.
 *
 * Replace `console.log/info/warn/error/debug` with `safeLogger.*` in any code
 * that touches user input or DB rows. Strings and JSON-serializable objects
 * are scanned and the following patterns are redacted before reaching the
 * underlying console:
 *
 *   - Emails                   → [EMAIL_REDACTED]
 *   - JWT tokens               → [JWT_REDACTED]
 *   - API keys (sk-…)          → [API_KEY_REDACTED]
 *   - Spanish NIF/DNI          → [ID_REDACTED]
 *   - Spanish phone numbers    → [PHONE_REDACTED]
 *   - IPv4 addresses           → [IP_REDACTED]
 *
 * Non-string primitives (numbers, booleans) and circular/non-serializable
 * objects pass through unchanged.
 *
 * Scope: runtime production code (app/, components/, lib/). NOT used in
 * scripts/ (CLI ETL, debugging local) ni en app/api/csp-report/route.js
 * (que ya es safe by construction).
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const JWT_REGEX = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g
const API_KEY_REGEX = /sk-[a-zA-Z0-9]{20,}/g
const NIF_REGEX = /\b\d{8}[A-HJ-NP-TV-Z]\b/g
const PHONE_REGEX = /\b(?:\+34|0034)?[ -]?[6-9]\d{2}[ -]?\d{3}[ -]?\d{3}\b/g
const IPV4_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g

function sanitizeString(str) {
  return str
    .replace(EMAIL_REGEX, '[EMAIL_REDACTED]')
    .replace(JWT_REGEX, '[JWT_REDACTED]')
    .replace(API_KEY_REGEX, '[API_KEY_REDACTED]')
    .replace(NIF_REGEX, '[ID_REDACTED]')
    .replace(PHONE_REGEX, '[PHONE_REDACTED]')
    .replace(IPV4_REGEX, '[IP_REDACTED]')
}

function sanitize(input) {
  if (input === null || input === undefined) return input
  if (typeof input === 'string') return sanitizeString(input)
  if (input instanceof Error) {
    // Preserve Error type, sanitize message + stack
    const sanitized = new Error(sanitizeString(input.message))
    if (input.stack) sanitized.stack = sanitizeString(input.stack)
    sanitized.name = input.name
    return sanitized
  }
  if (typeof input === 'object') {
    try {
      const json = JSON.stringify(input)
      return JSON.parse(sanitizeString(json))
    } catch {
      return input
    }
  }
  return input
}

export const safeLogger = {
  log: (...args) => console.log(...args.map(sanitize)),
  info: (...args) => console.info(...args.map(sanitize)),
  warn: (...args) => console.warn(...args.map(sanitize)),
  error: (...args) => console.error(...args.map(sanitize)),
  debug: (...args) => console.debug(...args.map(sanitize)),
}

// Exported for testing (not part of public API)
export const __sanitize = sanitize
