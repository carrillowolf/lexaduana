// lib/cbamExcelExporter.js
import * as XLSX from 'xlsx'

const SECTOR_NAMES = {
  cement: 'Cemento', ironSteel: 'Hierro y Acero', aluminium: 'Aluminio',
  fertilizers: 'Fertilizantes', hydrogen: 'Hidrógeno', electricity: 'Electricidad'
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Exporta cálculos CBAM a Excel con múltiples hojas
 * @param {Array} calculations - Array de cálculos CBAM desde cbam_user_calculations
 */
export function exportCBAMToExcel(calculations) {
  if (!calculations || calculations.length === 0) return

  // Calcular totales
  const totals = calculations.reduce((acc, c) => ({
    tonnes: acc.tonnes + parseFloat(c.tonnes || 0),
    cost: acc.cost + parseFloat(c.total_cost || 0),
    emissions: acc.emissions + parseFloat(c.total_emissions || 0),
  }), { tonnes: 0, cost: 0, emissions: 0 })

  // Agrupar por sector
  const bySector = {}
  calculations.forEach(c => {
    const sector = SECTOR_NAMES[c.sector_id] || c.sector_id
    if (!bySector[sector]) {
      bySector[sector] = { count: 0, tonnes: 0, cost: 0, emissions: 0 }
    }
    bySector[sector].count++
    bySector[sector].tonnes += parseFloat(c.tonnes || 0)
    bySector[sector].cost += parseFloat(c.total_cost || 0)
    bySector[sector].emissions += parseFloat(c.total_emissions || 0)
  })

  // SHEET 1: Resumen Ejecutivo
  const summaryData = [
    ['INFORME CBAM - LEXADUANA'],
    ['Mecanismo de Ajuste en Frontera por Carbono'],
    [''],
    ['Fecha de exportación:', new Date().toLocaleString('es-ES')],
    ['Período cubierto:', calculations.length > 1
      ? `${formatDate(calculations[calculations.length - 1].created_at)} - ${formatDate(calculations[0].created_at)}`
      : formatDate(calculations[0].created_at)
    ],
    [''],
    ['RESUMEN GENERAL'],
    ['Total de cálculos:', calculations.length],
    ['Total toneladas importadas:', `${totals.tonnes.toLocaleString('es-ES', { maximumFractionDigits: 1 })} t`],
    ['Total emisiones asociadas:', `${totals.emissions.toLocaleString('es-ES', { maximumFractionDigits: 2 })} tCO₂`],
    ['Coste CBAM total estimado:', formatCurrency(totals.cost)],
    [''],
    ['DISTRIBUCIÓN POR SECTOR'],
    ['Sector', 'Cálculos', 'Toneladas', 'Emisiones (tCO₂)', 'Coste CBAM'],
  ]

  Object.entries(bySector).forEach(([sector, data]) => {
    summaryData.push([
      sector,
      data.count,
      `${data.tonnes.toLocaleString('es-ES', { maximumFractionDigits: 1 })} t`,
      `${data.emissions.toLocaleString('es-ES', { maximumFractionDigits: 2 })} tCO₂`,
      formatCurrency(data.cost)
    ])
  })

  summaryData.push(
    [''],
    ['NOTA LEGAL'],
    ['Este informe es una estimación basada en los datos introducidos por el usuario.'],
    ['Los valores reales pueden variar según el precio EU ETS vigente y las emisiones verificadas.'],
    ['Consulte el Reglamento (UE) 2023/956 y el Reglamento de Ejecución (UE) 2023/1773.'],
    ['Generado por LexAduana (lexaduana.es) - Herramienta de compliance CBAM'],
  )

  // SHEET 2: Detalle de Cálculos
  const detailData = [
    [
      '#',
      'Fecha',
      'Sector',
      'Toneladas',
      'Factor Emisión',
      'Emisiones Totales (tCO₂)',
      'Fuente Emisiones',
      'Precio CO₂ (€)',
      'Markup (%)',
      'Coste CBAM (€)',
      'Notas'
    ]
  ]

  calculations.forEach((calc, index) => {
    detailData.push([
      index + 1,
      formatDate(calc.created_at),
      SECTOR_NAMES[calc.sector_id] || calc.sector_id,
      parseFloat(calc.tonnes || 0),
      parseFloat(calc.emission_factor || 0),
      parseFloat(calc.total_emissions || 0),
      calc.emission_source === 'real' ? 'Real (verificada)' : 'Valor por defecto',
      parseFloat(calc.co2_price || 0),
      calc.markup_pct ? `${(parseFloat(calc.markup_pct) * 100).toFixed(0)}%` : '0%',
      parseFloat(calc.total_cost || 0),
      calc.notes || ''
    ])
  })

  // Fila de totales
  detailData.push([])
  detailData.push([
    '',
    '',
    'TOTALES',
    totals.tonnes,
    '',
    totals.emissions,
    '',
    '',
    '',
    totals.cost,
    ''
  ])

  // SHEET 3: Análisis por Fuente de Emisiones
  const realCalcs = calculations.filter(c => c.emission_source === 'real')
  const defaultCalcs = calculations.filter(c => c.emission_source !== 'real')

  const analysisData = [
    ['ANÁLISIS POR FUENTE DE EMISIONES'],
    [''],
    ['Tipo', 'Cantidad', 'Toneladas', 'Coste CBAM', '% del Total'],
    [
      'Emisiones reales (verificadas)',
      realCalcs.length,
      `${realCalcs.reduce((s, c) => s + parseFloat(c.tonnes || 0), 0).toLocaleString('es-ES')} t`,
      formatCurrency(realCalcs.reduce((s, c) => s + parseFloat(c.total_cost || 0), 0)),
      `${calculations.length > 0 ? ((realCalcs.length / calculations.length) * 100).toFixed(1) : 0}%`
    ],
    [
      'Valores por defecto (con markup)',
      defaultCalcs.length,
      `${defaultCalcs.reduce((s, c) => s + parseFloat(c.tonnes || 0), 0).toLocaleString('es-ES')} t`,
      formatCurrency(defaultCalcs.reduce((s, c) => s + parseFloat(c.total_cost || 0), 0)),
      `${calculations.length > 0 ? ((defaultCalcs.length / calculations.length) * 100).toFixed(1) : 0}%`
    ],
    [''],
    ['RECOMENDACIÓN'],
    defaultCalcs.length > 0
      ? ['Tiene cálculos usando valores por defecto. Solicitar datos reales de emisiones a sus proveedores puede reducir significativamente el coste CBAM.']
      : ['Todos sus cálculos usan emisiones reales verificadas. Esto optimiza su coste CBAM.'],
    [''],
    ['CALENDARIO DE MARKUP POR VALORES POR DEFECTO'],
    ['Año', 'Markup Adicional', 'Base Legal'],
    ['2026', '+10%', 'C(2025) 8552'],
    ['2027', '+20%', 'C(2025) 8552'],
    ['2028 en adelante', '+30%', 'C(2025) 8552'],
  ]

  // Crear workbook
  const wb = XLSX.utils.book_new()

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
  const ws2 = XLSX.utils.aoa_to_sheet(detailData)
  const ws3 = XLSX.utils.aoa_to_sheet(analysisData)

  // Anchos de columnas
  ws1['!cols'] = [
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 }
  ]

  ws2['!cols'] = [
    { wch: 5 },   // #
    { wch: 20 },  // Fecha
    { wch: 18 },  // Sector
    { wch: 12 },  // Toneladas
    { wch: 14 },  // Factor
    { wch: 20 },  // Emisiones
    { wch: 20 },  // Fuente
    { wch: 12 },  // Precio CO₂
    { wch: 10 },  // Markup
    { wch: 15 },  // Coste
    { wch: 30 }   // Notas
  ]

  ws3['!cols'] = [
    { wch: 35 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 }
  ]

  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen CBAM')
  XLSX.utils.book_append_sheet(wb, ws2, 'Detalle Cálculos')
  XLSX.utils.book_append_sheet(wb, ws3, 'Análisis Emisiones')

  // Generar archivo
  const fileName = `CBAM_LexAduana_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}
