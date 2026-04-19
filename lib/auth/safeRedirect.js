export function safeInternalRedirect(candidate, fallback = '/calculadora') {
  if (typeof candidate !== 'string' || candidate.length === 0) return fallback
  if (!candidate.startsWith('/')) return fallback
  if (candidate.startsWith('//')) return fallback
  if (candidate.startsWith('/\\')) return fallback
  if (/^\/+[a-z][a-z0-9+.-]*:/i.test(candidate)) return fallback
  return candidate
}
