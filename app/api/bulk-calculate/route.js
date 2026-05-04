import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { calculateTariff, resolveOriginGroups } from '@/lib/calculateTariff'
import { safeLogger } from '@/lib/safe-logger'

// Procesa un lote de promesas con concurrencia limitada
async function processWithConcurrency(items, fn, concurrency = 10) {
  const results = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchResults = await Promise.allSettled(batch.map(fn))
    results.push(...batchResults)
  }
  return results
}

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { items, batchName } = await request.json()

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No hay items para procesar' },
        { status: 400 }
      )
    }

    if (items.length > 100) {
      return NextResponse.json(
        { error: 'Máximo 100 items por lote' },
        { status: 400 }
      )
    }

    const batchId = crypto.randomUUID()
    const refDate = new Date()

    // Pre-cachear grupos geográficos por país (evita queries repetidas)
    const uniqueCountries = [...new Set(items.map(i => i.countryCode))]
    const originGroupsCache = new Map()

    await Promise.all(
      uniqueCountries.map(async (cc) => {
        const normalizedCC = cc === 'ERGA OMNES' ? '1011' : cc
        const groups = await resolveOriginGroups(normalizedCC, refDate.toISOString().split('T')[0])
        originGroupsCache.set(normalizedCC, groups)
      })
    )

    // Procesar items en paralelo (batches de 10)
    const settled = await processWithConcurrency(items, async (item) => {
      const normalizedCC = item.countryCode === 'ERGA OMNES' ? '1011' : item.countryCode
      const result = await calculateTariff({
        hsCode: item.hsCode,
        cifValue: item.cifValue,
        countryCode: item.countryCode,
        referenceDate: refDate,
        mode: 'lite',
        _originGroupsCache: originGroupsCache.get(normalizedCC)
      })
      return { item, result }
    }, 10)

    // Clasificar resultados
    const results = []
    const errors = []
    const dbRows = []

    for (const entry of settled) {
      if (entry.status === 'rejected') {
        const errMsg = entry.reason?.message || 'Error desconocido'
        results.push({ status: 'error', error: errMsg })
        errors.push({ error: errMsg })
        continue
      }

      const { item, result } = entry.value

      if (result.success) {
        const d = result.data
        results.push({
          hsCode: d.hsCode,
          description: d.description,
          cifValue: d.cifValue,
          countryCode: d.country.code,
          countryName: d.country.name,
          agreement: d.country.agreement,
          standardRate: d.duty.standardRate,
          appliedRate: d.duty.appliedRate,
          dutyAmount: d.duty.amount,
          savings: d.duty.savings,
          measureType: d.duty.measureType,
          hasAntidumping: d.hasAntidumping,
          antidumpingRate: d.antidumpingRate,
          vatRate: d.vat.rate,
          vatType: d.vat.type,
          vatAmount: d.vat.amount,
          total: d.total,
          lineNumber: item.lineNumber,
          status: 'success'
        })

        dbRows.push({
          user_id: user.id,
          hs_code: d.hsCode,
          cif_value: d.cifValue,
          country_code: d.country.code,
          country_name: d.country.name,
          duty_rate: d.duty.appliedRate,
          duty_amount: d.duty.amount,
          vat_rate: d.vat.rate,
          vat_type: d.vat.type,
          vat_amount: d.vat.amount,
          total_amount: d.total,
          description: d.description,
          is_bulk: true,
          bulk_batch_id: batchId,
          bulk_batch_name: batchName || `Lote ${new Date().toLocaleDateString('es-ES')}`
        })
      } else {
        results.push({
          hsCode: item.hsCode,
          lineNumber: item.lineNumber,
          status: 'error',
          error: result.error || 'Error desconocido'
        })
        errors.push({
          line: item.lineNumber,
          hsCode: item.hsCode,
          error: result.error || 'Error desconocido'
        })
      }
    }

    // Guardar en DB en un solo batch insert (en vez de 100 inserts individuales)
    if (dbRows.length > 0) {
      await supabase.from('user_calculations').insert(dbRows)
    }

    // Calcular totales
    const successful = results.filter(r => r.status === 'success')
    const totals = {
      totalCIF: successful.reduce((sum, r) => sum + (r.cifValue || 0), 0),
      totalDuties: successful.reduce((sum, r) => sum + (r.dutyAmount || 0), 0),
      totalVAT: successful.reduce((sum, r) => sum + (r.vatAmount || 0), 0),
      totalAmount: successful.reduce((sum, r) => sum + (r.total || 0), 0)
    }

    return NextResponse.json({
      success: true,
      batchId,
      results,
      errors,
      summary: {
        total: items.length,
        successful: successful.length,
        failed: errors.length,
        totals
      }
    })
  } catch (error) {
    safeLogger.error('Error en bulk calculate:', error)
    return NextResponse.json(
      { error: 'Error al procesar el lote' },
      { status: 500 }
    )
  }
}
