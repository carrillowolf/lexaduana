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

    // Buscar códigos relacionados en la base de datos
    const keywords = description.toLowerCase().split(' ').filter(w => w.length > 3).slice(0, 5)

    const { data: relatedCodes } = await supabase
      .from('descriptions')
      .select('hs_code, description_es')
      .or(keywords.map(k => `description_es.ilike.%${k}%`).join(','))
      .limit(50)

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

    // Prompt mejorado con contexto TARIC completo
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

    // Llamar a Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4.5-20250929',
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
        alternativeCodes: validatedAlternatives,
        recommendedOrigins: classification.recommendedOrigins || [],
        additionalInfo: classification.additionalInfo || null
      },
      metadata: {
        model: 'claude-sonnet-4-5-20250929',
        timestamp: new Date().toISOString(),
        tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
        relatedCodesFound: relatedCodes?.length || 0
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