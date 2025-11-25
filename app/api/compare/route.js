/**
 * API Comparador Multi-Origen
 * Ruta: /api/compare
 * 
 * Compara costes de importación desde múltiples países de origen.
 * Usa el módulo compartido calculateTariff para garantizar
 * consistencia con la calculadora individual.
 * 
 * IMPORTANTE: Ya no hace fetch HTTP interno, llama directamente
 * a la función de cálculo para evitar problemas en Vercel.
 */

import { calculateTariff } from '@/lib/calculateTariff'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { hsCode, cifValue, countryCodes } = body

    // Validación de parámetros
    if (!hsCode || !cifValue || !countryCodes || !Array.isArray(countryCodes)) {
      return NextResponse.json(
        { error: 'Parámetros inválidos. Se requiere hsCode, cifValue y countryCodes (array)' },
        { status: 400 }
      )
    }

    if (countryCodes.length === 0) {
      return NextResponse.json(
        { error: 'Debe seleccionar al menos un país' },
        { status: 400 }
      )
    }

    if (countryCodes.length > 5) {
      return NextResponse.json(
        { error: 'Máximo 5 países permitidos' },
        { status: 400 }
      )
    }

    const parsedCifValue = parseFloat(cifValue)
    if (isNaN(parsedCifValue) || parsedCifValue <= 0) {
      return NextResponse.json(
        { error: 'Valor CIF inválido' },
        { status: 400 }
      )
    }

    const results = []

    console.log('=== INICIANDO COMPARACIÓN MULTI-ORIGEN ===')
    console.log('HS Code:', hsCode)
    console.log('CIF Value:', parsedCifValue)
    console.log('Países:', countryCodes)

    // Calcular para cada país usando el módulo compartido
    for (const countryCode of countryCodes) {
      console.log(`\n--- Calculando para país: ${countryCode} ---`)

      try {
        // Llamar DIRECTAMENTE al módulo compartido (no fetch HTTP)
        const calcResult = await calculateTariff({
          hsCode,
          cifValue: parsedCifValue,
          countryCode
        })

        // Si el código está incompleto, devolver error para este país
        if (calcResult.incomplete) {
          return NextResponse.json({
            success: false,
            incomplete: true,
            message: calcResult.message,
            suggestions: calcResult.suggestions,
            originalCode: calcResult.originalCode
          })
        }

        // Si hay error en el cálculo
        if (!calcResult.success) {
          console.error(`Error calculando ${countryCode}:`, calcResult.error)
          results.push({
            countryCode,
            countryName: countryCode,
            error: calcResult.error || 'Error en el cálculo'
          })
          continue
        }

        const data = calcResult.data

        console.log(`✓ ${data.country.name}: Arancel ${data.duty.appliedRate}% = €${data.duty.amount.toFixed(2)}`)

        // Determinar si hay arancel preferencial diferente al estándar
        const hasPreferential = data.duty.appliedRate < data.duty.standardRate

        if (hasPreferential) {
          // OPCIÓN 1: CON preferencial
          results.push({
            countryCode,
            countryName: data.country.name,
            hasAgreement: true,
            agreementInfo: data.country.agreement || 'Acuerdo comercial',
            dutyType: 'preferential',
            dutyRate: data.duty.appliedRate,
            dutyAmount: parseFloat(data.duty.amount.toFixed(2)),
            standardRate: data.duty.standardRate,
            vatRate: data.vat.rate,
            vatType: data.vat.type,
            vatAmount: parseFloat(data.vat.amount.toFixed(2)),
            totalCost: parseFloat(data.total.toFixed(2)),
            savings: 0, // Se calcula después
            description: data.description,
            alerts: data.alerts || [],
            requiresCertificate: true,
            isPreferentialOption: true
          })

          // OPCIÓN 2: SIN preferencial (arancel estándar ERGA OMNES)
          const standardDutyAmount = (parsedCifValue * data.duty.standardRate) / 100
          const standardTaxableBase = parsedCifValue + standardDutyAmount
          const standardVatAmount = (standardTaxableBase * data.vat.rate) / 100
          const standardTotal = parsedCifValue + standardDutyAmount + standardVatAmount

          results.push({
            countryCode,
            countryName: data.country.name,
            hasAgreement: false,
            agreementInfo: null,
            dutyType: 'erga_omnes',
            dutyRate: data.duty.standardRate,
            dutyAmount: parseFloat(standardDutyAmount.toFixed(2)),
            standardRate: data.duty.standardRate,
            vatRate: data.vat.rate,
            vatType: data.vat.type,
            vatAmount: parseFloat(standardVatAmount.toFixed(2)),
            totalCost: parseFloat(standardTotal.toFixed(2)),
            savings: 0,
            description: data.description,
            alerts: data.alerts || [],
            requiresCertificate: false,
            isPreferentialOption: false
          })
        } else {
          // NO hay preferencial diferente, solo una opción
          results.push({
            countryCode,
            countryName: data.country.name,
            hasAgreement: data.country.agreement ? true : false,
            agreementInfo: data.country.agreement || null,
            dutyType: data.duty.appliedRate < data.duty.standardRate ? 'preferential' : 'erga_omnes',
            dutyRate: data.duty.appliedRate,
            dutyAmount: parseFloat(data.duty.amount.toFixed(2)),
            standardRate: data.duty.standardRate,
            vatRate: data.vat.rate,
            vatType: data.vat.type,
            vatAmount: parseFloat(data.vat.amount.toFixed(2)),
            totalCost: parseFloat(data.total.toFixed(2)),
            savings: 0,
            description: data.description,
            alerts: data.alerts || [],
            requiresCertificate: false,
            isPreferentialOption: false
          })
        }

      } catch (error) {
        console.error(`Error procesando ${countryCode}:`, error)
        results.push({
          countryCode,
          countryName: countryCode,
          error: 'Error al procesar el cálculo'
        })
      }
    }

    // Calcular ahorros y marcar mejor/peor opción
    if (results.length > 0) {
      const validResults = results.filter(r => !r.error)

      if (validResults.length > 0) {
        const maxCost = Math.max(...validResults.map(r => r.totalCost))
        const minCost = Math.min(...validResults.map(r => r.totalCost))

        validResults.forEach(r => {
          r.savings = parseFloat((maxCost - r.totalCost).toFixed(2))
          r.isBest = r.totalCost === minCost
          r.isWorst = r.totalCost === maxCost && validResults.length > 1
        })
      }

      // Ordenar por coste total (menor a mayor)
      results.sort((a, b) => {
        if (a.error) return 1
        if (b.error) return -1
        return a.totalCost - b.totalCost
      })
    }

    const bestOption = results.find(r => r.isBest)
    console.log('\n=== COMPARACIÓN COMPLETADA ===')
    console.log(`Total resultados: ${results.length}`)
    if (bestOption) {
      console.log(`Mejor opción: ${bestOption.countryName} (€${bestOption.totalCost})`)
    }

    return NextResponse.json({
      success: true,
      hsCode,
      cifValue: parsedCifValue,
      results,
      summary: {
        totalOptions: results.length,
        validOptions: results.filter(r => !r.error).length,
        bestOption: bestOption ? {
          country: bestOption.countryName,
          totalCost: bestOption.totalCost,
          savings: bestOption.savings
        } : null
      }
    })

  } catch (error) {
    console.error('Error in compare API:', error)
    return NextResponse.json(
      { error: 'Error del servidor: ' + error.message },
      { status: 500 }
    )
  }
}
