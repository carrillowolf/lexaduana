import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function exportToPDF(result, formatCurrency) {
  const pdf = new jsPDF('p', 'mm', 'a4')
  
  // Configuración de colores (basados en tu logo)
  const primaryColor = [0, 75, 135] // Azul marino
  const accentColor = [235, 183, 65] // Dorado
  
  // Fecha actual
  const fecha = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  // Encabezado con logo
  try {
    // Si tienes el logo en base64, puedes incluirlo
    const img = new Image()
    img.src = '/logo.png'
    await new Promise((resolve) => {
      img.onload = () => {
        pdf.addImage(img, 'PNG', 15, 10, 30, 30)
        resolve()
      }
      img.onerror = resolve // Continuar sin logo si hay error
    })
  } catch (e) {
    console.log('Logo no disponible')
  }
  
  // Título
  pdf.setFontSize(24)
  pdf.setTextColor(...primaryColor)
  pdf.text('LEX ADUANA', 55, 20)
  
  pdf.setFontSize(18)
  pdf.text('Cálculo de Aranceles e IVA', 55, 30)
  
  pdf.setFontSize(10)
  pdf.setTextColor(100)
  pdf.text(`Fecha: ${fecha}`, 55, 38)
  
  // Línea separadora
  pdf.setDrawColor(...accentColor)
  pdf.setLineWidth(0.5)
  pdf.line(15, 45, 195, 45)
  
  // Información del cálculo
  let yPos = 60
  
  // Sección: Datos de entrada
  pdf.setFontSize(14)
  pdf.setTextColor(...primaryColor)
  pdf.setFont(undefined, 'bold')
  pdf.text('DATOS DE LA IMPORTACIÓN', 15, yPos)
  
  yPos += 10
  pdf.setFontSize(11)
  pdf.setFont(undefined, 'normal')
  pdf.setTextColor(50)
  
  pdf.text(`Código HS/TARIC:`, 15, yPos)
  pdf.setFont(undefined, 'bold')
  pdf.text(result.hsCode, 60, yPos)
  pdf.setFont(undefined, 'normal')
  
  yPos += 7
  pdf.text(`Valor CIF:`, 15, yPos)
  pdf.setFont(undefined, 'bold')
  pdf.text(formatCurrency(result.cifValue), 60, yPos)
  pdf.setFont(undefined, 'normal')
  
  yPos += 7
  pdf.text(`País de origen:`, 15, yPos)
  pdf.setFont(undefined, 'bold')
  pdf.text(result.country.name, 60, yPos)
  pdf.setFont(undefined, 'normal')
  
  if (result.country.agreement) {
    yPos += 7
    pdf.text(`Acuerdo:`, 15, yPos)
    pdf.text(result.country.agreement, 60, yPos)
  }
  
  // Descripción del producto
  if (result.description) {
    yPos += 10
    pdf.setFontSize(11)
    pdf.text(`Descripción:`, 15, yPos)
    
    // Dividir descripción larga en líneas
    const descLines = pdf.splitTextToSize(result.description, 170)
    yPos += 7
    pdf.setFontSize(10)
    descLines.forEach(line => {
      pdf.text(line, 15, yPos)
      yPos += 5
    })
  }
  
  // Línea separadora
  yPos += 5
  pdf.setDrawColor(200)
  pdf.setLineWidth(0.2)
  pdf.line(15, yPos, 195, yPos)
  
  // Sección: Cálculo de costes
  yPos += 10
  pdf.setFontSize(14)
  pdf.setTextColor(...primaryColor)
  pdf.setFont(undefined, 'bold')
  pdf.text('DESGLOSE DE COSTES', 15, yPos)
  
  yPos += 10
  pdf.setFontSize(11)
  pdf.setFont(undefined, 'normal')
  pdf.setTextColor(50)
  
  // Tabla de costes
  const tableData = [
    ['Concepto', 'Base', 'Tipo', 'Importe'],
    ['Valor CIF', '', '', formatCurrency(result.cifValue)],
    ['Arancel aduanero', formatCurrency(result.cifValue), `${result.duty.appliedRate}%`, formatCurrency(result.duty.amount)],
    ['Base IVA', formatCurrency(result.customsBase), '', ''],
    ['IVA', formatCurrency(result.customsBase), `${result.vat.rate}%`, formatCurrency(result.vat.amount)]
  ]
  
  // Dibujar tabla
  let tableY = yPos
  const cellHeight = 8
  const colWidths = [60, 40, 30, 50]
  
  tableData.forEach((row, rowIndex) => {
    let xPos = 15
    
    if (rowIndex === 0) {
      // Encabezado
      pdf.setFillColor(...primaryColor)
      pdf.setTextColor(255)
      pdf.rect(15, tableY, 180, cellHeight, 'F')
      pdf.setFont(undefined, 'bold')
    } else {
      pdf.setTextColor(50)
      pdf.setFont(undefined, 'normal')
      
      // Alternar color de fondo
      if (rowIndex % 2 === 0) {
        pdf.setFillColor(245, 245, 245)
        pdf.rect(15, tableY, 180, cellHeight, 'F')
      }
    }
    
    row.forEach((cell, cellIndex) => {
      pdf.text(cell, xPos + 2, tableY + 5)
      xPos += colWidths[cellIndex]
    })
    
    tableY += cellHeight
  })
  
  // Total
  yPos = tableY + 10
  pdf.setFillColor(...accentColor)
  pdf.rect(15, yPos - 7, 180, 12, 'F')
  
  pdf.setFontSize(14)
  pdf.setTextColor(...primaryColor)
  pdf.setFont(undefined, 'bold')
  pdf.text('TOTAL A PAGAR:', 20, yPos)
  pdf.text(formatCurrency(result.total), 145, yPos)
  
  // Nota importante si hay acuerdo
  if (result.country.notes && result.country.notes.includes('⚠️')) {
    yPos += 20
    pdf.setFontSize(10)
    pdf.setTextColor(200, 100, 0)
    pdf.setFont(undefined, 'italic')
    
    const noteLines = pdf.splitTextToSize(
      'Nota: ' + result.country.notes.replace('⚠️', ''),
      170
    )
    noteLines.forEach(line => {
      pdf.text(line, 15, yPos)
      yPos += 5
    })
  }
  
  // Pie de página
  pdf.setFontSize(9)
  pdf.setTextColor(150)
  pdf.setFont(undefined, 'normal')
  pdf.text('Documento generado en www.lexaduana.es', 105, 280, { align: 'center' })
  pdf.text('Cálculo orientativo sujeto a verificación oficial', 105, 285, { align: 'center' })
  
  // Guardar PDF
  pdf.save(`calculo-arancel-${result.hsCode}-${new Date().getTime()}.pdf`)
}
