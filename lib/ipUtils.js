/**
 * Anonimiza una IP enmascarando el último octeto (IPv4) o los últimos 80 bits (IPv6).
 * Reduce identificabilidad individual pero conserva trazabilidad por red.
 * Recomendado por AEPD para registros de consentimiento.
 *
 * Ejemplos:
 *   192.168.1.42  →  192.168.1.0
 *   2001:db8::abc →  2001:db8::
 *   null o inválida → null
 */
export function anonymizeIp(ip) {
  if (!ip || typeof ip !== 'string') return null
  const trimmed = ip.trim()
  if (!trimmed) return null

  const ipv4Match = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/)
  if (ipv4Match) return `${ipv4Match[1]}.0`

  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').filter(Boolean)
    if (parts.length >= 3) return `${parts.slice(0, 3).join(':')}::`
    return null
  }

  return null
}

/**
 * Extrae IP del header x-forwarded-for de Vercel.
 * El header puede contener una cadena "client, proxy1, proxy2" — la primera es el cliente.
 */
export function extractClientIp(request) {
  const xff = request.headers.get('x-forwarded-for')
  if (!xff) return null
  return xff.split(',')[0]?.trim() || null
}
