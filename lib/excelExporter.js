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

// =============================================================
// EXPORTADOR DE FACTURAS COMERCIALES (OCR)
// =============================================================

/**
 * Exporta los datos extraídos de una factura comercial a Excel.
 *
 * Genera 3 hojas:
 *  - "Cabecera": datos generales de la factura (proveedor, comprador, totales)
 *  - "Líneas": tabla completa de líneas con clasificación TARIC y cálculos
 *  - "Resumen": totales por país, divisa, código TARIC; suma de aranceles e IVA
 *
 * @param {object} invoiceData    JSON extraído por Claude (estructura {invoice, buyer, lines, transport})
 * @param {object} classifications Map { line_number: { suggested_code, confidence, ... } }
 * @param {Array}  calcResults    Array de resultados de /api/calculate por línea (opcional)
 */
export function exportInvoiceToExcel(invoiceData, classifications = {}, calcResults = null) {
  if (!invoiceData) return

  const invoice = invoiceData.invoice || {}
  const buyer = invoiceData.buyer || {}
  const transport = invoiceData.transport || {}
  const lines = Array.isArray(invoiceData.lines) ? invoiceData.lines : []
  const calcMap = {}
  if (Array.isArray(calcResults)) {
    calcResults.forEach((r) => { if (r?.line_number) calcMap[r.line_number] = r })
  }

  const wb = XLSX.utils.book_new()

  // ----------------------------------------------
  // SHEET 1: CABECERA
  // ----------------------------------------------
  const headerRows = [
    ['FACTURA COMERCIAL — DATOS EXTRAÍDOS'],
    [''],
    ['Generado por:', 'LexAduana — Extractor de Facturas con IA'],
    ['Fecha de extracción:', new Date().toLocaleString('es-ES')],
    [''],
    ['DATOS DEL PROVEEDOR'],
    ['Nombre:', invoice.supplier_name || ''],
    ['País (ISO 2):', invoice.supplier_country || ''],
    ['Dirección:', invoice.supplier_address || ''],
    [''],
    ['DATOS DE LA FACTURA'],
    ['Nº de factura:', invoice.invoice_number || ''],
    ['Fecha:', invoice.invoice_date || ''],
    ['Divisa:', invoice.currency || ''],
    ['Incoterm:', invoice.incoterm || ''],
    ['Condiciones de pago:', invoice.payment_terms || ''],
    ['Importe total:', invoice.total_amount ?? ''],
    [''],
    ['DATOS DEL COMPRADOR'],
    ['Nombre:', buyer.buyer_name || ''],
    ['País (ISO 2):', buyer.buyer_country || ''],
    [''],
    ['TRANSPORTE'],
    ['Modo:', transport.transport_mode || ''],
    ['Puerto de carga:', transport.port_of_loading || ''],
    ['Puerto de descarga:', transport.port_of_discharge || ''],
    ['Buque:', transport.vessel_name || ''],
    ['Contenedor:', transport.container_number || ''],
  ]
  const headerSheet = XLSX.utils.aoa_to_sheet(headerRows)
  headerSheet['!cols'] = [{ wch: 22 }, { wch: 50 }]
  XLSX.utils.book_append_sheet(wb, headerSheet, 'Cabecera')

  // ----------------------------------------------
  // SHEET 2: LÍNEAS (la hoja más importante para filtrar/sumar)
  // ----------------------------------------------
  const linesHeader = [
    'Línea',
    'Descripción (original)',
    'Descripción (ES)',
    'Cantidad',
    'Unidad',
    'Precio unitario',
    'Total línea',
    'País origen',
    'Peso neto (kg)',
    'Peso bruto (kg)',
    'HS en factura',
    'TARIC sugerido (IA)',
    'Confianza IA (%)',
    'TARIC final',
    'Arancel (%)',
    'Arancel (€)',
    'IVA (%)',
    'IVA (€)',
    'Total tributos (€)',
  ]

  const linesRows = lines.map((line) => {
    const sug = classifications[line.line_number] || {}
    const calc = calcMap[line.line_number] || {}
    const finalCode = line.taric_code || sug.suggested_code || line.hs_code_on_invoice || ''
    const dutyAmount = calc.dutyAmount ?? null
    const vatAmount = calc.vatAmount ?? null
    const totalTributos = (dutyAmount || 0) + (vatAmount || 0)

    return [
      line.line_number ?? '',
      line.description || '',
      line.description_es || '',
      line.quantity ?? '',
      line.unit || '',
      line.unit_price ?? '',
      line.total_price ?? '',
      line.country_of_origin || invoice.supplier_country || '',
      line.net_weight_kg ?? '',
      line.gross_weight_kg ?? '',
      line.hs_code_on_invoice || '',
      sug.suggested_code || '',
      sug.confidence ?? '',
      finalCode,
      calc.dutyRate ?? '',
      dutyAmount ?? '',
      calc.vatRate ?? '',
      vatAmount ?? '',
      dutyAmount !== null || vatAmount !== null ? totalTributos : '',
    ]
  })

  // Fila de totales al final
  const totalQty = lines.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0)
  const totalValue = lines.reduce((acc, l) => acc + (Number(l.total_price) || 0), 0)
  const totalDuty = Object.values(calcMap).reduce((acc, c) => acc + (Number(c?.dutyAmount) || 0), 0)
  const totalVat = Object.values(calcMap).reduce((acc, c) => acc + (Number(c?.vatAmount) || 0), 0)
  linesRows.push([])
  linesRows.push([
    'TOTALES', '', '',
    totalQty, '', '',
    totalValue,
    '', '', '', '', '', '', '', '',
    totalDuty || '', '',
    totalVat || '',
    (totalDuty || 0) + (totalVat || 0) || '',
  ])

  const linesSheet = XLSX.utils.aoa_to_sheet([linesHeader, ...linesRows])
  linesSheet['!cols'] = [
    { wch: 6 }, { wch: 40 }, { wch: 40 }, { wch: 10 }, { wch: 8 },
    { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
    { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 10 },
    { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 16 },
  ]
  // Activar autofiltro
  linesSheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: linesHeader.length - 1 } }) }
  XLSX.utils.book_append_sheet(wb, linesSheet, 'Líneas')

  // ----------------------------------------------
  // SHEET 3: RESUMEN (agrupaciones útiles)
  // ----------------------------------------------
  // Agrupar por país de origen
  const byCountry = {}
  lines.forEach((l) => {
    const country = l.country_of_origin || invoice.supplier_country || 'N/A'
    if (!byCountry[country]) byCountry[country] = { lines: 0, value: 0 }
    byCountry[country].lines += 1
    byCountry[country].value += Number(l.total_price) || 0
  })

  // Agrupar por código TARIC
  const byTaric = {}
  lines.forEach((l) => {
    const sug = classifications[l.line_number] || {}
    const code = l.taric_code || sug.suggested_code || l.hs_code_on_invoice || 'Sin clasificar'
    if (!byTaric[code]) byTaric[code] = { lines: 0, value: 0 }
    byTaric[code].lines += 1
    byTaric[code].value += Number(l.total_price) || 0
  })

  const summaryRows = [
    ['RESUMEN DE LA FACTURA'],
    [''],
    ['Total líneas:', lines.length],
    ['Total cantidad:', totalQty],
    [`Total valor (${invoice.currency || ''}):`, totalValue],
    [''],
  ]

  if (calcResults?.length) {
    summaryRows.push(['Total arancel (€):', totalDuty])
    summaryRows.push(['Total IVA (€):', totalVat])
    summaryRows.push(['TOTAL TRIBUTOS (€):', totalDuty + totalVat])
    summaryRows.push([''])
  }

  summaryRows.push(['POR PAÍS DE ORIGEN'])
  summaryRows.push(['País', 'Nº líneas', 'Valor'])
  Object.entries(byCountry).forEach(([country, d]) => {
    summaryRows.push([country, d.lines, d.value])
  })

  summaryRows.push([''])
  summaryRows.push(['POR CÓDIGO TARIC'])
  summaryRows.push(['Código', 'Nº líneas', 'Valor'])
  Object.entries(byTaric).forEach(([code, d]) => {
    summaryRows.push([code, d.lines, d.value])
  })

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
  summarySheet['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumen')

  // ----------------------------------------------
  // Guardar archivo
  // ----------------------------------------------
  const supplierSlug = (invoice.supplier_name || 'factura')
    .replace(/[^a-z0-9]/gi, '_')
    .substring(0, 30)
  const dateSlug = (invoice.invoice_date || new Date().toISOString().split('T')[0]).replace(/[^0-9-]/g, '')
  const fileName = `LexAduana_${supplierSlug}_${dateSlug}.xlsx`
  XLSX.writeFile(wb, fileName)
}
