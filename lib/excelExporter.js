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
    const country = r.result.country.name
    if (!byCountry[country]) {
      byCountry[country] = {
        count: 0,
        totalCIF: 0,
        totalAmount: 0
      }
    }
    byCountry[country].count++
    byCountry[country].totalCIF += r.result.cifValue
    byCountry[country].totalAmount += r.result.total
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
      'Valor CIF',
      'Arancel %',
      'Arancel €',
      'IVA %',
      'IVA €',
      'Total €',
      'Tiene Alertas'
    ]
  ]

  successfulResults.forEach((item, index) => {
    const r = item.result
    detailData.push([
      index + 1,
      r.hsCode,
      r.description || 'Sin descripción',
      r.country.name,
      r.cifValue,
      r.duty.appliedRate,
      r.duty.amount,
      r.vat.rate,
      r.vat.amount,
      r.total,
      r.alerts && r.alerts.length > 0 ? 'SÍ' : 'NO'
    ])
  })

  // SHEET 3: Alertas TARIC
  const alertsData = [
    ['Código HS', 'País', 'Tipo de Alerta', 'Código', 'Descripción', 'Prioridad']
  ]

  successfulResults.forEach(item => {
    const r = item.result
    if (r.alerts && r.alerts.length > 0) {
      r.alerts.forEach(alert => {
        alertsData.push([
          r.hsCode,
          r.country.name,
          alert.type || 'General',
          alert.code || '-',
          alert.description || alert.message,
          alert.priority || 3
        ])
      })
    }
  })

  // Si no hay alertas, añadir mensaje
  if (alertsData.length === 1) {
    alertsData.push(['No se encontraron alertas TARIC para este lote'])
  }

  // SHEET 4: Errores (si los hay)
  let errorsData = null
  if (failedResults.length > 0) {
    errorsData = [
      ['Línea', 'Código HS', 'País', 'Valor CIF', 'Error']
    ]
    failedResults.forEach(item => {
      errorsData.push([
        item.lineNumber || '-',
        item.hsCode || '-',
        item.countryCode || '-',
        item.cifValue || '-',
        item.error || 'Error desconocido'
      ])
    })
  }

  // Crear workbook
  const wb = XLSX.utils.book_new()

  // Añadir sheets
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
  const ws2 = XLSX.utils.aoa_to_sheet(detailData)
  const ws3 = XLSX.utils.aoa_to_sheet(alertsData)

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
    { wch: 12 }, // Valor CIF
    { wch: 10 }, // Arancel %
    { wch: 12 }, // Arancel €
    { wch: 8 },  // IVA %
    { wch: 12 }, // IVA €
    { wch: 12 }, // Total
    { wch: 12 }  // Alertas
  ]

  ws3['!cols'] = [
    { wch: 15 }, // HS Code
    { wch: 20 }, // País
    { wch: 15 }, // Tipo
    { wch: 12 }, // Código
    { wch: 50 }, // Descripción
    { wch: 10 }  // Prioridad
  ]

  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen')
  XLSX.utils.book_append_sheet(wb, ws2, 'Detalle Productos')
  XLSX.utils.book_append_sheet(wb, ws3, 'Alertas TARIC')

  if (errorsData) {
    const ws4 = XLSX.utils.aoa_to_sheet(errorsData)
    ws4['!cols'] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 50 }
    ]
    XLSX.utils.book_append_sheet(wb, ws4, 'Errores')
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
