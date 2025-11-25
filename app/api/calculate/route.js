/**
 * API de Cálculo Individual de Aranceles
 * Ruta: /api/calculate
 * 
 * Usa el módulo compartido calculateTariff para garantizar
 * consistencia con el comparador multi-origen.
 */

import { calculateTariff, getCountries } from '@/lib/calculateTariff'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { hsCode, cifValue, countryCode = 'ERGA OMNES' } = await request.json()
    
    // Llamar al módulo compartido
    const result = await calculateTariff({ hsCode, cifValue, countryCode })
    
    // Si hay error o código incompleto, devolver con el status apropiado
    if (!result.success) {
      // Código incompleto con sugerencias - devolver 200 con flag
      if (result.incomplete) {
        return NextResponse.json(result)
      }
      // Error real - devolver 400 o 404
      return NextResponse.json(
        { error: result.error },
        { status: result.error.includes('No se encontró') ? 404 : 400 }
      )
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Error en cálculo:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

// Ruta para obtener lista de países
export async function GET() {
  try {
    const countries = await getCountries()
    
    return NextResponse.json({
      success: true,
      countries
    })
  } catch (error) {
    console.error('Error obteniendo países:', error)
    return NextResponse.json(
      { success: true, countries: [] },
      { status: 200 }
    )
  }
}
