import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verificar usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { description, countryCode, cifValue } = await request.json()

    if (!description || description.length < 10) {
      return NextResponse.json(
        { error: 'Descripción demasiado corta (mínimo 10 caracteres)' },
        { status: 400 }
      )
    }

    // Verificar límite de uso (implementar después)
    // TODO: Verificar créditos disponibles según plan

    // Obtener códigos HS de la base de datos para contexto
    const { data: hsCodes } = await supabase
      .from('descriptions')
      .select('hs_code, description_es')
      .limit(100)

    // Crear contexto con ejemplos reales
    const hsContext = hsCodes?.slice(0, 20).map(h =>
      `- ${h.hs_code}: ${h.description_es}`
    ).join('\n')

    // Prompt optimizado para clasificación TARIC
    const prompt = `Eres un experto en clasificación arancelaria TARIC de la Unión Europea.

Tu tarea es clasificar el siguiente producto y sugerir el código TARIC de 10 dígitos más apropiado.

DESCRIPCIÓN DEL PRODUCTO:
"${description}"

CONTEXTO ADICIONAL:
${countryCode ? `País de origen: ${countryCode}` : ''}
${cifValue ? `Valor CIF: ${cifValue}€` : ''}

EJEMPLOS DE CÓDIGOS HS VÁLIDOS:
${hsContext}

INSTRUCCIONES:
1. Analiza la descripción del producto cuidadosamente
2. Considera la función principal, material, uso final
3. Aplica las Reglas Generales de Interpretación del SA
4. Sugiere el código TARIC de 10 dígitos más apropiado
5. Proporciona 2-3 códigos alternativos si hay ambigüedad
6. Explica tu razonamiento de forma clara y profesional

IMPORTANTE:
- Solo usa códigos que existan en la nomenclatura TARIC
- Proporciona nivel de confianza (0-100%)
- Si hay dudas, indícalo claramente
- Menciona criterios clave de clasificación

FORMATO DE RESPUESTA (JSON):
{
  "primaryCode": "8471300000",
  "confidence": 85,
  "reasoning": "Explicación detallada...",
  "alternativeCodes": [
    {
      "code": "8471410000",
      "reason": "Si se considera...",
      "confidence": 60
    }
  ],
  "keyFactors": ["factor 1", "factor 2"],
  "warnings": ["posible ambigüedad en..."]
}

Responde SOLO con el JSON, sin texto adicional.`

    // Llamar a Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      temperature: 0.3, // Baja temperatura para más precisión
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    // Parsear respuesta
    const responseText = message.content[0].text
    let classification

    try {
      // Extraer JSON de la respuesta (por si Claude añade texto extra)
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

    // Validar que el código existe en nuestra base de datos
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

    // Registrar uso para estadísticas
    await supabase
      .from('classification_logs')
      .insert({
        user_id: user.id,
        description: description.substring(0, 500),
        suggested_code: classification.primaryCode,
        confidence: classification.confidence,
        model_used: 'claude-sonnet-4.5'
      })
      .select()
      .single()

    // Respuesta final
    return NextResponse.json({
      success: true,
      classification: {
        ...classification,
        primaryCodeExists: !!validCode,
        primaryCodeDutyRate: validCode?.duty_rate,
        alternativeCodes: validatedAlternatives
      },
      metadata: {
        model: 'claude-sonnet-4.5',
        timestamp: new Date().toISOString(),
        tokensUsed: message.usage.input_tokens + message.usage.output_tokens
      }
    })

  } catch (error) {
    console.error('Error en clasificación:', error)
    return NextResponse.json(
      { error: 'Error al clasificar producto', details: error.message },
      { status: 500 }
    )
  }
}