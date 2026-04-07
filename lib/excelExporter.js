// lib/excelExporter.js
import * as XLSX from 'xlsx'

export function exportBulkToExcel(bulkResults) {
  const { results, summary, batchId } = bulkResults

  // Preparar datos para cada sheet
  const successfulResults = results.filter(r => r.status === 'success')
  const failedResults = results.filter(r => r.status === 'error')

  // SHEET 1: Resumen Ejecutivo
  const summaryData = [
    ['RESUMEN EJECUTIVO - CALCULADORA MASIVA LEXADUANA'],
    [''],
    ['Fecha de procesamiento:', new Date().toLocaleString('es-ES')],
    ['ID de lote:', batchId],
    [''],
    ['ESTADÍSTICAS'],
    ['Total de productos procesados:', summary.total],
    ['Procesados exitosamente:', summary.successful],
    ['Con errores:', summary.failed],
    ['Tasa de éxito:', `${((summary.successful / summary.total) * 100).toFixed(1)}%`],
    [''],
    ['TOTALES FINANCIEROS'],
    ['Total Valor CIF:', `${formatCurrency(summary.totals.totalCIF)}`],
    ['Total Aranceles:', `${formatCurrency(summary.totals.totalDuties)}`],
    ['Total IVA:', `${formatCurrency(summary.totals.totalVAT)}`],
    ['TOTAL A PAGAR:', `${formatCurrency(summary.totals.totalAmount)}`],
    [''],
    ['DISTRIBUCIÓN POR PAÍS'],
  ]

  // Agrupar por país
  const byCountry = {}
  successfulResults.forEach(r => {
    const country = r.countryName
    if (!byCountry[country]) {
      byCountry[country] = {
        count: 0,
        totalCIF: 0,
        totalAmount: 0
      }
    }
    byCountry[country].count++
    byCountry[country].totalCIF += r.cifValue
    byCountry[country].totalAmount += r.total
  })

  Object.entries(byCountry).forEach(([country, data]) => {
    summaryData.push([
      country,
      `${data.count} productos`,
      formatCurrency(data.totalCIF),
      formatCurrency(data.totalAmount)
    ])
  })

  // SHEET 2: Detalle de Productos
  const detailData = [
    [
      'Línea',
      'Código HS',
      'Descripción',
      'País Origen',
      'Acuerdo',
      'Valor CIF',
      'Arancel ERGA %',
      'Arancel Aplicado %',
      'Arancel €',
      'Ahorro €',
      'IVA %',
      'IVA €',
      'Anti-dumping',
      'Total €'
    ]
  ]

  successfulResults.forEach((item, index) => {
    detailData.push([
      item.lineNumber || index + 1,
      item.hsCode,
      item.description || 'Sin descripción',
      item.countryName,
      item.agreement || 'ERGA OMNES',
      item.cifValue,
      item.standardRate,
      item.appliedRate,
      item.dutyAmount,
      item.savings || 0,
      item.vatRate,
      item.vatAmount,
      item.hasAntidumping ? `Sí (${item.antidumpingRate}%)` : 'No',
      item.total
    ])
  })

  // SHEET 3: Errores (si los hay)
  let errorsData = null
  if (failedResults.length > 0) {
    errorsData = [
      ['Línea', 'Código HS', 'País', 'Error']
    ]
    failedResults.forEach(item => {
      errorsData.push([
        item.lineNumber || '-',
        item.hsCode || '-',
        item.countryCode || '-',
        item.error || 'Error desconocido'
      ])
    })
  }

  // Crear workbook
  const wb = XLSX.utils.book_new()

  // Añadir sheets
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
  const ws2 = XLSX.utils.aoa_to_sheet(detailData)

  // Aplicar estilos (ancho de columnas)
  ws1['!cols'] = [
    { wch: 30 },
    { wch: 20 }
  ]

  ws2['!cols'] = [
    { wch: 8 },  // Línea
    { wch: 15 }, // HS Code
    { wch: 40 }, // Descripción
    { wch: 20 }, // País
    { wch: 25 }, // Acuerdo
    { wch: 12 }, // Valor CIF
    { wch: 12 }, // Arancel ERGA %
    { wch: 14 }, // Arancel Aplicado %
    { wch: 12 }, // Arancel €
    { wch: 12 }, // Ahorro €
    { wch: 8 },  // IVA %
    { wch: 12 }, // IVA €
    { wch: 14 }, // Anti-dumping
    { wch: 12 }  // Total
  ]

  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen')
  XLSX.utils.book_append_sheet(wb, ws2, 'Detalle Productos')

  if (errorsData) {
    const ws3 = XLSX.utils.aoa_to_sheet(errorsData)
    ws3['!cols'] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 15 },
      { wch: 50 }
    ]
    XLSX.utils.book_append_sheet(wb, ws3, 'Errores')
  }

  // Generar archivo
  const fileName = `LexAduana_Bulk_${new Date().toISOString().split('T')[0]}_${batchId.split('-')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}
