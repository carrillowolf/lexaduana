/**
 * API de Clasificación de Productos con IA
 * Ruta: /api/classify-product
 *
 * SEGURIDAD IMPLEMENTADA:
 * - Rate limiting por IP: 20 peticiones/hora
 * - Límite diario por usuario: 50 clasificaciones/día
 * - Validación de entrada completa
 * - Solo usuarios autenticados
 *
 * ESTRATEGIA DE CLASIFICACIÓN (Phase 8 deuda técnica):
 * - Sin pre-restricción del catálogo en el prompt: la búsqueda anterior por
 *   keywords ES vs descriptions EN devolvía 0 y forzaba ERROR_CLASIFICACION.
 * - Validación posterior contra declarable_codes/tariffs y, si el primaryCode
 *   no existe en BD, fallback a hermanos del mismo HS6.
 */

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

import {
  checkRateLimit,
  aiClassifierLimiter,
  checkDailyAILimit,
  rateLimitHeaders
} from '@/lib/rate-limit'
import { validateClassificationInput } from '@/lib/validation'
import { isAdminEmail } from '@/lib/cbamAdminAuth'
import { safeLogger } from '@/lib/safe-logger'
import { CLAUDE_MODEL, getResponseText } from '@/lib/claudeModel'
import { buildClassificationPrompt } from '@/lib/classifierPrompt'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MAX_ALTERNATIVES = 10

export async function POST(request) {
  try {
    // =========================================
    // 1. AUTENTICACIÓN (necesaria para detectar admin antes del rate limit)
    // =========================================
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para usar el clasificador IA' },
        { status: 401 }
      )
    }

    const isAdmin = isAdminEmail(user.email)

    // =========================================
    // 2. RATE LIMITING POR IP (admin lo salta)
    // =========================================
    let rateLimit = { success: true, configured: false, limit: 0, remaining: 0, reset: 0 }
    if (!isAdmin) {
      rateLimit = await checkRateLimit(request, aiClassifierLimiter)

      if (!rateLimit.success) {
        const resetInMinutes = Math.ceil((rateLimit.reset - Date.now()) / 1000 / 60)
        return NextResponse.json(
          {
            error: 'Has excedido el límite de clasificaciones por hora. Intenta de nuevo más tarde.',
            retryAfterMinutes: resetInMinutes,
          },
          {
            status: 429,
            headers: rateLimitHeaders(rateLimit),
          }
        )
      }
    }

    // =========================================
    // 3. LÍMITE DIARIO POR USUARIO (admin sin límite)
    // =========================================
    let dailyLimit
    if (isAdmin) {
      dailyLimit = { allowed: true, used: 0, limit: -1, remaining: -1 }
    } else {
      dailyLimit = await checkDailyAILimit(user.id)

      if (!dailyLimit.allowed) {
        return NextResponse.json(
          {
            error: `Has alcanzado tu límite de ${dailyLimit.limit} clasificaciones diarias. Se reinicia en 24 horas.`,
            usage: {
              used: dailyLimit.used,
              limit: dailyLimit.limit,
              remaining: 0,
            },
          },
          { status: 429 }
        )
      }
    }

    // =========================================
    // 4. PARSEAR Y VALIDAR ENTRADA
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

    const validation = validateClassificationInput(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { description, countryCode, cifValue } = validation.sanitized

    // =========================================
    // 5. PROMPT PARA CLAUDE (sin pre-restricción de catálogo BD)
    // =========================================
    const prompt = buildClassificationPrompt({ description, countryCode, cifValue })

    // =========================================
    // 6. LLAMAR A CLAUDE API
    // =========================================
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8000,
      output_config: { effort: 'medium' },
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    // =========================================
    // 7. PARSEAR RESPUESTA
    // =========================================
    let responseText = ''
    let classification

    try {
      responseText = getResponseText(message)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        classification = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No se pudo extraer JSON de la respuesta')
      }
    } catch (parseError) {
      safeLogger.error('Error parseando respuesta de Claude:', parseError)
      return NextResponse.json({
        error: 'Error al procesar la respuesta de IA',
        rawResponse: responseText
      }, { status: 500 })
    }

    // =========================================
    // 8. VALIDAR CÓDIGO EN BD + FALLBACK HS6
    // =========================================

    // 8.1 Validar primaryCode contra declarable_codes y tariffs
    const { data: validDeclarable } = await supabase
      .from('declarable_codes')
      .select('goods_code, is_leaf')
      .eq('goods_code', classification.primaryCode)
      .eq('is_leaf', true)
      .maybeSingle()

    const { data: validTariff } = await supabase
      .from('tariffs')
      .select('goods_code, duty')
      .eq('goods_code', classification.primaryCode)
      .maybeSingle()

    const primaryExistsInBd = !!(validDeclarable || validTariff)

    // 8.2 Si primaryCode NO existe en BD, fallback HS6
    let finalPrimaryCode = classification.primaryCode
    let primaryInferredFromHs6 = false
    let hs6SubgroupCodes = []

    if (!primaryExistsInBd) {
      const hs6 = classification.primaryCode?.substring(0, 6)

      if (hs6 && hs6.length === 6) {
        const { data: hs6Subgroup } = await supabase
          .from('declarable_codes')
          .select('goods_code')
          .like('goods_code', `${hs6}%`)
          .eq('is_leaf', true)
          .order('goods_code')

        hs6SubgroupCodes = hs6Subgroup || []

        if (hs6SubgroupCodes.length > 0) {
          // Heurística: si Claude propuso alternativas que SÍ existen, usar la primera;
          // si no, primero del subgrupo HS6 por orden alfanumérico.
          const claudeAlternativesInBd = (classification.alternativeCodes || [])
            .filter(alt => hs6SubgroupCodes.some(c => c.goods_code === alt.code))

          if (claudeAlternativesInBd.length > 0) {
            finalPrimaryCode = claudeAlternativesInBd[0].code
          } else {
            finalPrimaryCode = hs6SubgroupCodes[0].goods_code
          }

          primaryInferredFromHs6 = true
        }
        // Si hs6SubgroupCodes está vacío: finalPrimaryCode se queda con el original
        // de Claude. La UI mostrará primaryCodeExists=false (badge "Verificar manualmente").
      }
    }

    // 8.3 Recomprobar tariff del finalPrimaryCode si hubo fallback
    let finalDutyRate = validTariff?.duty
    if (primaryInferredFromHs6) {
      const { data: newTariff } = await supabase
        .from('tariffs')
        .select('goods_code, duty')
        .eq('goods_code', finalPrimaryCode)
        .maybeSingle()
      finalDutyRate = newTariff?.duty
    }

    // 8.4 Construir alternativeCodes finales
    let validatedAlternatives = []

    if (primaryInferredFromHs6) {
      // Hermanos del subgrupo HS6 menos el primaryCode final, hasta MAX_ALTERNATIVES.
      const siblingCodes = hs6SubgroupCodes
        .filter(c => c.goods_code !== finalPrimaryCode)
        .slice(0, MAX_ALTERNATIVES)
        .map(c => c.goods_code)

      if (siblingCodes.length > 0) {
        const { data: siblingDescs } = await supabase
          .from('descriptions')
          .select('goods_code, description')
          .in('goods_code', siblingCodes)

        const { data: siblingTariffs } = await supabase
          .from('tariffs')
          .select('goods_code, duty')
          .in('goods_code', siblingCodes)

        const descMap = new Map((siblingDescs || []).map(d => [d.goods_code, d.description]))
        const tariffMap = new Map((siblingTariffs || []).map(t => [t.goods_code, t.duty]))

        validatedAlternatives = siblingCodes.map(code => ({
          code,
          reason: `Código alternativo del mismo subgrupo HS6 (${classification.primaryCode?.substring(0, 6)})`,
          confidence: null,
          dutyRate: tariffMap.get(code),
          description: descMap.get(code),
          validated: true,
          siblingFromHs6: true,
        }))
      }
    } else {
      // Validar las alternativas que devolvió Claude. Solo se incluyen las que
      // existen realmente en BD (filtrado más estricto que el flujo previo).
      for (const alt of (classification.alternativeCodes || []).slice(0, MAX_ALTERNATIVES)) {
        const { data: altDeclarable } = await supabase
          .from('declarable_codes')
          .select('goods_code, is_leaf')
          .eq('goods_code', alt.code)
          .eq('is_leaf', true)
          .maybeSingle()

        const { data: altTariff } = await supabase
          .from('tariffs')
          .select('goods_code, duty')
          .eq('goods_code', alt.code)
          .maybeSingle()

        if (altDeclarable || altTariff) {
          validatedAlternatives.push({
            ...alt,
            dutyRate: altTariff?.duty,
            validated: true,
          })
        }
      }
    }

    // =========================================
    // 9. REGISTRAR USO PARA ESTADÍSTICAS
    // =========================================
    // suggested_code es VARCHAR(10). Tras el fallback HS6, finalPrimaryCode
    // siempre es un goods_code de declarable_codes (10 dígitos exactos), por
    // lo que el INSERT no se desborda. En el caso límite HS6 vacío, queda el
    // primaryCode original de Claude — que también debería ser de 10 dígitos
    // si respeta el formato del prompt.
    await supabase
      .from('classification_logs')
      .insert({
        user_id: user.id,
        description: description.substring(0, 500),
        suggested_code: finalPrimaryCode,
        confidence: classification.confidence,
        model_used: CLAUDE_MODEL
      })
      .select()
      .single()

    // =========================================
    // 10. RESPUESTA EXITOSA
    // =========================================
    const finalPrimaryExists = primaryExistsInBd || primaryInferredFromHs6

    return NextResponse.json({
      success: true,
      classification: {
        ...classification,
        primaryCode: finalPrimaryCode,
        primaryCodeExists: finalPrimaryExists,
        primaryCodeDutyRate: finalDutyRate,
        primaryInferredFromHs6,
        originalSuggestedCode: primaryInferredFromHs6 ? classification.primaryCode : null,
        alternativeCodes: validatedAlternatives,
        recommendedOrigins: classification.recommendedOrigins || [],
        additionalInfo: classification.additionalInfo || null,
      },
      metadata: {
        model: CLAUDE_MODEL,
        timestamp: new Date().toISOString(),
        tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      },
      usage: {
        daily: {
          used: dailyLimit.used,
          limit: dailyLimit.limit,
          remaining: dailyLimit.remaining,
        }
      }
    }, {
      headers: rateLimitHeaders(rateLimit),
    })

  } catch (error) {
    safeLogger.error('Error en clasificación:', error)

    return NextResponse.json(
      { error: 'Error al clasificar producto. Inténtalo de nuevo.' },
      { status: 500 }
    )
  }
}
