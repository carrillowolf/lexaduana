/**
 * API de Clasificación de Productos con IA
 * Ruta: /api/classify-product
 * 
 * SEGURIDAD IMPLEMENTADA:
 * - Rate limiting por IP: 20 peticiones/hora
 * - Límite diario por usuario: 50 clasificaciones/día
 * - Validación de entrada completa
 * - Solo usuarios autenticados
 */

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Importar sistema de seguridad
import {
  checkRateLimit,
  aiClassifierLimiter,
  checkDailyAILimit,
  rateLimitHeaders
} from '@/lib/rate-limit'
import { validateClassificationInput } from '@/lib/validation'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request) {
  try {
    // =========================================
    // 1. RATE LIMITING POR IP
    // =========================================
    const rateLimit = await checkRateLimit(request, aiClassifierLimiter)

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

    // =========================================
    // 2. AUTENTICACIÓN
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

    // =========================================
    // 3. LÍMITE DIARIO POR USUARIO
    // =========================================
    const dailyLimit = await checkDailyAILimit(user.id)

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

    // Usar datos sanitizados
    const { description, countryCode, cifValue } = validation.sanitized

    // =========================================
    // 5. BUSCAR CÓDIGOS RELACIONADOS EN BD
    // =========================================
    const keywords = description.toLowerCase().split(' ').filter(w => w.length > 3).slice(0, 5)

    const { data: relatedCodes } = await supabase
      .from('descriptions')
      .select('hs_code, description_es')
      .or(keywords.map(k => `description_es.ilike.%${k}%`).join(','))
      .limit(50)

    // BUSCAR EJEMPLOS DE CLASIFICACIÓN VERIFICADOS
    let verifiedExamplesContext = ''
    if (keywords.length > 0) {
      const { data: examples } = await supabase
        .from('classification_examples')
        .select('keywords, correct_code, correct_description, incorrect_codes, explanation')
        .eq('active', true)
        .or(keywords.map(k => `keywords.ilike.%${k}%`).join(','))
        .limit(5)

      if (examples && examples.length > 0) {
        verifiedExamplesContext = `\nEJEMPLOS DE CLASIFICACIÓN VERIFICADOS POR EXPERTOS:
${examples.map(ex => `- Producto similar: "${ex.keywords}"
  → Código CORRECTO: ${ex.correct_code} (${ex.correct_description || ''})
  ${ex.incorrect_codes && ex.incorrect_codes.length > 0 ? `→ Códigos INCORRECTOS a evitar: ${ex.incorrect_codes.join(', ')}` : ''}
  → Razón: ${ex.explanation || 'Clasificación verificada por experto aduanero'}`).join('\n')}

IMPORTANTE: Si el producto a clasificar es similar a estos ejemplos, usar el código correcto indicado.\n`
      }
    }

    // Buscar por capítulo si tenemos info del producto
    let chapterContext = ''
    if (relatedCodes && relatedCodes.length > 0) {
      const chapters = [...new Set(relatedCodes.map(c => c.hs_code.substring(0, 2)))]
      chapterContext = `\nCapítulos relevantes detectados: ${chapters.join(', ')}`
    }

    // Crear contexto con códigos relacionados
    const hsContext = relatedCodes?.slice(0, 15).map(h =>
      `- ${h.hs_code}: ${h.description_es}`
    ).join('\n') || 'No se encontraron códigos similares en búsqueda inicial.'

    // =========================================
    // 6. PROMPT PARA CLAUDE
    // =========================================
    const prompt = `Eres un agente de aduanas experto en clasificación arancelaria TARIC de la Unión Europea con 20 años de experiencia.

REGLAS GENERALES DE INTERPRETACIÓN (RGI):
1. Los títulos de Secciones/Capítulos son meramente indicativos
2. Artículos incompletos/sin terminar se clasifican como completos si tienen características esenciales
3. Mezclas/combinaciones de materias: regla de la materia que confiere carácter esencial
4. Artículos similares: clasificar con los más análogos
5. Envases/estuches: se clasifican con el producto si son del tipo normal
6. Subpartidas: aplicar RGI 1-5 dentro del mismo código

PRODUCTO A CLASIFICAR:
"${description}"

DATOS ADICIONALES:
${countryCode ? `- País de origen: ${countryCode}` : '- País de origen: No especificado'}
${cifValue ? `- Valor estimado: ${cifValue}€` : '- Valor: No especificado'}${chapterContext}
${verifiedExamplesContext}
CÓDIGOS HS RELACIONADOS EN BASE DE DATOS:
${hsContext}

METODOLOGÍA DE CLASIFICACIÓN:
1. **Identificar función principal**: ¿Cuál es el uso/propósito primario?
2. **Determinar materia constitutiva**: ¿De qué está hecho principalmente?
3. **Analizar características esenciales**: ¿Qué lo define como tal?
4. **Aplicar RGI en orden**: Empezar por RGI 1, luego 2, etc.
5. **Considerar Notas de Sección/Capítulo**: Pueden excluir ciertos artículos
6. **Verificar si es conjunto/surtido**: Reglas especiales aplican
7. **Elegir partida (4 dígitos)** → **Subpartida (6 dígitos)** → **Código completo (10 dígitos)**

CRITERIOS DE DECISIÓN:
- Si multifunción: clasificar según función que le confiere carácter esencial
- Si duda entre 2 códigos: elegir el más específico (regla del último lugar por orden numérico)
- Si artículo compuesto: identificar componente que da el carácter esencial
- Considerar si hay Notas Explicativas que aclaren casos límite

ANÁLISIS REQUERIDO:
- Listar todos los criterios considerados
- Explicar por qué se descartaron códigos alternativos
- Mencionar si hay Notas de Sección/Capítulo relevantes
- Indicar nivel de certeza y razones de cualquier duda
- Sugerir información adicional que ayudaría a confirmar

IMPORTANTE:
- Solo códigos existentes en nomenclatura TARIC
- Si confianza < 70%: explicar claramente las dudas
- Mencionar posibles alertas TARIC (certificados, restricciones)
- Si producto puede clasificarse de múltiples formas: explicar contextos

FORMATO DE RESPUESTA (JSON):
{
  "primaryCode": "8471300000",
  "confidence": 85,
  "reasoning": "Análisis detallado aplicando RGI: [explicar paso a paso el razonamiento, mencionando qué RGI se aplicó y por qué]",
  "alternativeCodes": [
    {
      "code": "8471410000",
      "reason": "Podría aplicarse si se considera que... [explicar contexto específico]",
      "confidence": 60
    }
  ],
  "keyFactors": [
    "Función principal identificada: [X]",
    "Materia constitutiva: [Y]",
    "RGI aplicada: [Z]",
    "Característica esencial: [W]"
  ],
  "warnings": [
    "Verificar si requiere certificado específico",
    "Confirmar composición exacta de materiales para mayor precisión"
  ],
  "recommendedOrigins": ["VN", "TH"],
  "additionalInfo": "Para clasificación definitiva se recomienda: [detalles específicos a verificar]"
}

Responde ÚNICAMENTE con el JSON válido, sin markdown ni texto adicional.`

    // =========================================
    // 7. LLAMAR A CLAUDE API
    // =========================================
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    // =========================================
    // 8. PARSEAR RESPUESTA
    // =========================================
    const responseText = message.content[0].text
    let classification

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        classification = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No se pudo extraer JSON de la respuesta')
      }
    } catch (parseError) {
      console.error('Error parseando respuesta de Claude:', parseError)
      return NextResponse.json({
        error: 'Error al procesar la respuesta de IA',
        rawResponse: responseText
      }, { status: 500 })
    }

    // =========================================
    // 9. VALIDAR CÓDIGO EN BASE DE DATOS
    // =========================================
    const { data: validCode } = await supabase
      .from('tariffs')
      .select('hs_code, duty_rate')
      .eq('hs_code', classification.primaryCode)
      .single()

    // Verificar códigos alternativos
    const validatedAlternatives = []
    if (classification.alternativeCodes) {
      for (const alt of classification.alternativeCodes) {
        const { data: altValid } = await supabase
          .from('tariffs')
          .select('hs_code, duty_rate')
          .eq('hs_code', alt.code)
          .single()

        if (altValid) {
          validatedAlternatives.push({
            ...alt,
            dutyRate: altValid.duty_rate,
            validated: true
          })
        } else {
          validatedAlternatives.push({
            ...alt,
            validated: false
          })
        }
      }
    }

    // =========================================
    // 10. REGISTRAR USO PARA ESTADÍSTICAS
    // =========================================
    await supabase
      .from('classification_logs')
      .insert({
        user_id: user.id,
        description: description.substring(0, 500),
        suggested_code: classification.primaryCode,
        confidence: classification.confidence,
        model_used: 'claude-sonnet-4-5'
      })
      .select()
      .single()

    // =========================================
    // 11. RESPUESTA EXITOSA
    // =========================================
    return NextResponse.json({
      success: true,
      classification: {
        ...classification,
        primaryCodeExists: !!validCode,
        primaryCodeDutyRate: validCode?.duty_rate,
        alternativeCodes: validatedAlternatives,
        recommendedOrigins: classification.recommendedOrigins || [],
        additionalInfo: classification.additionalInfo || null
      },
      metadata: {
        model: 'claude-sonnet-4-5-20250929',
        timestamp: new Date().toISOString(),
        tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
        relatedCodesFound: relatedCodes?.length || 0
      },
      // Información de uso para mostrar al usuario
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
    console.error('Error en clasificación:', error)

    // No exponer detalles internos en producción
    return NextResponse.json(
      { error: 'Error al clasificar producto. Inténtalo de nuevo.' },
      { status: 500 }
    )
  }
}