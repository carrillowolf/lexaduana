/**
 * Sistema de Rate Limiting para LexAduana
 * 
 * Protege las APIs contra abusos limitando peticiones por IP/usuario.
 * Usa Upstash Redis (plan gratuito) para persistencia entre deploys.
 * 
 * LÍMITES CONFIGURADOS:
 * - APIs generales (calculate, search): 100 req/min por IP
 * - Clasificador IA: 20 req/hora por IP + 50/día por usuario
 * - Bulk calculate: 10 req/min por IP
 * 
 * USO:
 * import { checkRateLimit, calculatorLimiter } from '@/lib/rate-limit'
 * const { success, remaining } = await checkRateLimit(request, calculatorLimiter)
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ============================================
// CONEXIÓN A REDIS
// ============================================

// Verificar que las variables existen
const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

// Cliente Redis (solo se crea si hay credenciales)
let redis = null
if (redisUrl && redisToken) {
  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  })
}

// ============================================
// CONFIGURACIÓN DE LIMITERS
// ============================================

/**
 * Rate limiter GENERAL para APIs públicas
 * 100 peticiones por minuto por IP
 */
export const generalLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'lexaduana:general',
}) : null

/**
 * Rate limiter para CALCULADORA
 * 150 peticiones por minuto (más permisivo, no cuesta dinero)
 */
export const calculatorLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(150, '1 m'),
  analytics: true,
  prefix: 'lexaduana:calc',
}) : null

/**
 * Rate limiter para CLASIFICADOR IA
 * MUY restrictivo: 20 por hora por IP
 * (además hay límite diario por usuario)
 */
export const aiClassifierLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: true,
  prefix: 'lexaduana:ai',
}) : null

/**
 * Rate limiter para BÚSQUEDAS
 * 100 peticiones por minuto
 */
export const searchLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'lexaduana:search',
}) : null

/**
 * Rate limiter para BULK (cálculo masivo)
 * 10 peticiones por minuto (operaciones pesadas)
 */
export const bulkLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'lexaduana:bulk',
}) : null

// ============================================
// FUNCIÓN PRINCIPAL DE VERIFICACIÓN
// ============================================

/**
 * Verifica el rate limit para una petición
 * 
 * @param {Request} request - Request de Next.js
 * @param {Ratelimit} limiter - Qué limiter usar (calculatorLimiter, aiClassifierLimiter, etc.)
 * @param {string} identifier - Opcional: ID personalizado (ej: visitorId, visitorIp) en lugar de IP
 * @returns {Promise<{success: boolean, limit: number, remaining: number, reset: number}>}
 * 
 * @example
 * import { checkRateLimit, calculatorLimiter } from '@/lib/rate-limit'
 * 
 * const rateLimit = await checkRateLimit(request, calculatorLimiter)
 * if (!rateLimit.success) {
 *   return NextResponse.json(
 *     { error: 'Demasiadas peticiones. Espera un momento.' },
 *     { status: 429 }
 *   )
 * }
 */
export async function checkRateLimit(request, limiter, identifier = null) {
  // Si Redis no está configurado, permitir (fail-open)
  if (!limiter || !redis) {
    console.warn('Rate limiting no configurado - permitiendo petición')
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
      configured: false,
    }
  }

  // Obtener IP del usuario
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() :
    request.headers.get('x-real-ip') ||
    'anonymous'

  // Usar identificador personalizado o IP
  const id = identifier || ip

  try {
    const result = await limiter.limit(id)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      configured: true,
    }
  } catch (error) {
    // Si Redis falla, permitir la petición (fail-open)
    // Mejor permitir que bloquear usuarios por error de infraestructura
    console.error('Rate limit check failed:', error)
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
      configured: false,
      error: error.message,
    }
  }
}

// ============================================
// LÍMITE DIARIO ESPECIAL PARA CLASIFICADOR IA
// ============================================

/**
 * Verifica y actualiza el límite diario del clasificador IA por usuario
 * 
 * @param {string} userId - ID del usuario de Supabase (auth.uid())
 * @returns {Promise<{allowed: boolean, used: number, limit: number, remaining: number}>}
 * 
 * @example
 * const dailyLimit = await checkDailyAILimit(user.id)
 * if (!dailyLimit.allowed) {
 *   return NextResponse.json(
 *     { error: `Has alcanzado tu límite de ${dailyLimit.limit} clasificaciones diarias` },
 *     { status: 429 }
 *   )
 * }
 */
export async function checkDailyAILimit(userId) {
  const DAILY_LIMIT = 10 // 10 clasificaciones por día por usuario

  // Si Redis no está configurado, permitir
  if (!redis) {
    return { allowed: true, used: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT }
  }

  const key = `lexaduana:ai:daily:${userId}`

  try {
    // Obtener uso actual
    const currentRaw = await redis.get(key)
    const current = parseInt(currentRaw) || 0

    if (current >= DAILY_LIMIT) {
      return {
        allowed: false,
        used: current,
        limit: DAILY_LIMIT,
        remaining: 0,
      }
    }

    // Incrementar contador
    const newCount = await redis.incr(key)

    // Si es el primer uso del día, establecer expiración de 24h
    if (newCount === 1) {
      await redis.expire(key, 86400) // 24 horas en segundos
    }

    return {
      allowed: true,
      used: newCount,
      limit: DAILY_LIMIT,
      remaining: Math.max(0, DAILY_LIMIT - newCount),
    }
  } catch (error) {
    console.error('Daily AI limit check failed:', error)
    // Fail-open
    return { allowed: true, used: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT }
  }
}

/**
 * Obtener estadísticas de uso de IA de un usuario (para mostrar en dashboard)
 * 
 * @param {string} userId - ID del usuario
 * @returns {Promise<{used: number, limit: number, remaining: number, resetsIn: number}>}
 */
export async function getUserAIUsage(userId) {
  const DAILY_LIMIT = 10

  if (!redis) {
    return { used: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT, resetsIn: 86400 }
  }

  const key = `lexaduana:ai:daily:${userId}`

  try {
    const [usedRaw, ttl] = await Promise.all([
      redis.get(key),
      redis.ttl(key),
    ])

    const used = parseInt(usedRaw) || 0

    return {
      used,
      limit: DAILY_LIMIT,
      remaining: Math.max(0, DAILY_LIMIT - used),
      resetsIn: ttl > 0 ? ttl : 86400, // Segundos hasta reset
    }
  } catch (error) {
    console.error('Get AI usage failed:', error)
    return { used: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT, resetsIn: 86400 }
  }
}

// ============================================
// HEADERS DE RESPUESTA
// ============================================

/**
 * Genera headers estándar de rate limiting para incluir en respuestas
 * Informa al cliente de su estado de límites
 * 
 * @param {object} result - Resultado de checkRateLimit
 * @returns {object} Headers para añadir a la respuesta
 */
export function rateLimitHeaders(result) {
  if (!result.configured) return {}

  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
  }
}

// ============================================
// UTILIDAD: Verificar si Redis está configurado
// ============================================

export function isRateLimitConfigured() {
  return !!(redis && redisUrl && redisToken)
}