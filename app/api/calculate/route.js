/**
 * API de Cálculo Individual de Aranceles
 * Ruta: /api/calculate
 * 
 * SEGURIDAD IMPLEMENTADA:
 * - Rate limiting: 150 peticiones/minuto por IP
 * - Validación de entrada completa
 * 
 * Usa el módulo compartido calculateTariff para garantizar
 * consistencia con el comparador multi-origen.
 */

import { calculateTariff, getCountries } from '@/lib/calculateTariff'
import { NextResponse } from 'next/server'

// Importar sistema de seguridad
import { checkRateLimit, calculatorLimiter, rateLimitHeaders } from '@/lib/rate-limit'
import { validateCalculationInput } from '@/lib/validation'
import { safeLogger } from '@/lib/safe-logger'

export async function POST(request) {
  try {
    // =========================================
    // 1. RATE LIMITING POR IP
    // =========================================
    const rateLimit = await checkRateLimit(request, calculatorLimiter)

    if (!rateLimit.success) {
      const resetInSeconds = Math.ceil((rateLimit.reset - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: 'Demasiadas peticiones. Por favor, espera un momento.',
          retryAfterSeconds: resetInSeconds,
        },
        {
          status: 429,
          headers: rateLimitHeaders(rateLimit),
        }
      )
    }

    // =========================================
    // 2. PARSEAR Y VALIDAR ENTRADA
    // =========================================
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        { error: 'JSON inválido en el cuerpo de la petición' },
        { status: 400 }
      )
    }

    const validation = validateCalculationInput(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Usar datos sanitizados
    const { hsCode, cifValue, countryCode } = validation.sanitized

    // =========================================
    // 3. LLAMAR AL MÓDULO DE CÁLCULO
    // =========================================
    const result = await calculateTariff({
      hsCode,
      cifValue,
      countryCode
    })

    // Si hay error o código incompleto, devolver con el status apropiado
    if (!result.success) {
      // Código incompleto con sugerencias - devolver 200 con flag
      if (result.incomplete) {
        return NextResponse.json(result, {
          headers: rateLimitHeaders(rateLimit),
        })
      }
      // Error real - devolver 400 o 404
      return NextResponse.json(
        { error: result.error },
        {
          status: result.error.includes('No se encontró') ? 404 : 400,
          headers: rateLimitHeaders(rateLimit),
        }
      )
    }

    // =========================================
    // 4. RESPUESTA EXITOSA
    // =========================================
    return NextResponse.json(result, {
      headers: rateLimitHeaders(rateLimit),
    })

  } catch (error) {
    safeLogger.error('Error en cálculo:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

// =========================================
// RUTA GET: LISTA DE PAÍSES
// =========================================
export async function GET(request) {
  try {
    // Rate limiting también para GET
    const rateLimit = await checkRateLimit(request, calculatorLimiter)

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones. Espera un momento.' },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      )
    }

    const countries = await getCountries()

    return NextResponse.json({
      success: true,
      countries
    }, {
      headers: rateLimitHeaders(rateLimit),
    })
  } catch (error) {
    safeLogger.error('Error obteniendo países:', error)
    return NextResponse.json(
      { success: true, countries: [] },
      { status: 200 }
    )
  }
}