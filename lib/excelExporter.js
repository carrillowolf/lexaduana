import * as XLSX from 'xlsx'

export function exportCalculationsToExcel(calculations, userEmail) {
  // Crear nuevo workbook
  const wb = XLSX.utils.book_new()
  
  // ==========================================
  // HOJA 1: RESUMEN
  // ==========================================
  
  const totalCIF = calculations.reduce((sum, c) => sum + parseFloat(c.cif_value || 0), 0)
  const totalDuties = calculations.reduce((sum, c) => sum + parseFloat(c.duty_amount || 0), 0)
  const totalVAT = calculations.reduce((sum, c) => sum + parseFloat(c.vat_amount || 0), 0)
  const totalAmount = calculations.reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0)
  
  // Países más consultados
  const countryCounts = {}
  calculations.forEach(c => {
    countryCounts[c.country_name] = (countryCounts[c.country_name] || 0) + 1
  })
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  
  // Códigos HS más usados
  const hsCodeCounts = {}
  calculations.forEach(c => {
    hsCodeCounts[c.hs_code] = (hsCodeCounts[c.hs_code] || 0) + 1
  })
  const topHSCodes = Object.entries(hsCodeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  
  const summaryData = [
    ['RESUMEN DE CÁLCULOS - LEXADUANA'],
    [''],
    ['Usuario:', userEmail],
    ['Fecha de exportación:', new Date().toLocaleDateString('es-ES')],
    ['Total de cálculos:', calculations.length],
    [''],
    ['TOTALES FINANCIEROS'],
    ['Total Valor CIF:', formatCurrency(totalCIF)],
    ['Total Aranceles:', formatCurrency(totalDuties)],
    ['Total IVA:', formatCurrency(totalVAT)],
    ['TOTAL GENERAL:', formatCurrency(totalAmount)],
    [''],
    ['PAÍSES MÁS CONSULTADOS'],
    ...topCountries.map(([country, count]) => [country, `${count} cálculos`]),
    [''],
    ['CÓDIGOS HS MÁS USADOS'],
    ...topHSCodes.map(([code, count]) => [code, `${count} veces`])
  ]
  
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
  
  // Estilos para el resumen (anchos de columna)
  ws1['!cols'] = [
    { wch: 30 },
    { wch: 20 }
  ]
  
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen')
  
  // ==========================================
  // HOJA 2: DETALLE
  // ==========================================
  
  const detailData = [
    [
      'Fecha',
      'Código HS',
      'Descripción',
      'País',
      'Valor CIF (€)',
      'Arancel %',
      'Arancel (€)',
      'IVA %',
      'Tipo IVA',
      'IVA (€)',
      'TOTAL (€)'
    ],
    ...calculations.map(c => [
      new Date(c.created_at).toLocaleDateString('es-ES'),
      c.hs_code,
      c.description?.split('→')[0]?.substring(0, 50) || 'Sin descripción',
      c.country_name,
      parseFloat(c.cif_value || 0),
      parseFloat(c.duty_rate || 0),
      parseFloat(c.duty_amount || 0),
      parseFloat(c.vat_rate || 0),
      c.vat_type || 'general',
      parseFloat(c.vat_amount || 0),
      parseFloat(c.total_amount || 0)
    ])
  ]
  
  const ws2 = XLSX.utils.aoa_to_sheet(detailData)
  
  // Anchos de columna
  ws2['!cols'] = [
    { wch: 12 },  // Fecha
    { wch: 12 },  // HS Code
    { wch: 40 },  // Descripción
    { wch: 15 },  // País
    { wch: 12 },  // CIF
    { wch: 10 },  // Arancel %
    { wch: 12 },  // Arancel €
    { wch: 8 },   // IVA %
    { wch: 14 },  // Tipo IVA
    { wch: 12 },  // IVA €
    { wch: 12 }   // Total
  ]
  
  XLSX.utils.book_append_sheet(wb, ws2, 'Detalle Completo')
  
  // ==========================================
  // EXPORTAR ARCHIVO
  // ==========================================
  
  const fileName = `Lexaduana_Historial_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}
