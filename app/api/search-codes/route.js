import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        results: []
      })
    }
    
    // Limpiar query
    const cleanQuery = query.replace(/\s/g, '').replace(/\./g, '')
    
    // Buscar códigos que empiecen con el query
    // Primero buscar en tariffs para obtener códigos únicos con aranceles
    const { data: tariffCodes, error: tariffError } = await supabase
      .from('tariffs')
      .select('goods_code, duty')
      .eq('origin', 'ERGA OMNES')
      .like('goods_code', `${cleanQuery}%`)
      .limit(20)
      .order('goods_code')
    
    if (tariffError) throw tariffError
    
    // Si no hay resultados, buscar eliminando el último dígito
    if (!tariffCodes || tariffCodes.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        message: 'No se encontraron códigos'
      })
    }
    
    // Obtener descripciones para estos códigos
    const results = await Promise.all(
      tariffCodes.map(async (item) => {
        // Buscar descripción exacta
        let { data: desc } = await supabase
          .from('descriptions')
          .select('description')
          .eq('goods_code', item.goods_code)
          .single()
        
        // Si no hay descripción exacta, buscar la más cercana
        if (!desc) {
          // Intentar con 6 dígitos
          const hs6 = item.goods_code.substring(0, 6).padEnd(10, '0')
          const { data: desc6 } = await supabase
            .from('descriptions')
            .select('description')
            .eq('goods_code', hs6)
            .single()
          desc = desc6
        }
        
        // Si aún no hay, buscar con 4 dígitos
        if (!desc) {
          const hs4 = item.goods_code.substring(0, 4).padEnd(10, '0')
          const { data: desc4 } = await supabase
            .from('descriptions')
            .select('description')
            .eq('goods_code', hs4)
            .single()
          desc = desc4
        }
        
        return {
          code: item.goods_code,
          duty: item.duty,
          description: desc?.description || 'Sin descripción',
          // Formatear para mostrar
          display: `${item.goods_code.substring(0, 4)} ${item.goods_code.substring(4, 6)} ${item.goods_code.substring(6)}`.trim()
        }
      })
    )
    
    // Filtrar y ordenar resultados
    const uniqueResults = results.filter((item, index, self) => 
      index === self.findIndex(t => t.code === item.code)
    )
    
    // Priorizar códigos más cortos/generales primero
    uniqueResults.sort((a, b) => {
      // Contar ceros al final
      const zerosA = (a.code.match(/0+$/) || [''])[0].length
      const zerosB = (b.code.match(/0+$/) || [''])[0].length
      
      // Más ceros = más general = aparece primero
      if (zerosA !== zerosB) return zerosB - zerosA
      
      // Si igual, ordenar por código
      return a.code.localeCompare(b.code)
    })
    
    return NextResponse.json({
      success: true,
      results: uniqueResults.slice(0, 10), // Máximo 10 resultados
      query: cleanQuery
    })
    
  } catch (error) {
    console.error('Error en búsqueda:', error)
    return NextResponse.json(
      { error: 'Error al buscar códigos' },
      { status: 500 }
    )
  }
}
