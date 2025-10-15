export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n')
  
  if (lines.length < 2) {
    throw new Error('El archivo debe contener al menos una fila de datos además del encabezado')
  }
  
  // Detectar separador (coma o punto y coma)
  const firstLine = lines[0]
  const separator = firstLine.includes(';') ? ';' : ','
  
  // Parse header
  const headers = firstLine.split(separator).map(h => h.trim().toLowerCase())
  
  // Validar columnas requeridas
  const requiredColumns = ['hs code', 'valor cif', 'pais', 'país', 'country', 'origen']
  
  const hsCodeCol = headers.findIndex(h => 
    h.includes('hs') || h.includes('codigo') || h.includes('código') || h === 'code'
  )
  
  const cifCol = headers.findIndex(h => 
    h.includes('cif') || h.includes('valor') || h.includes('value') || h.includes('importe')
  )
  
  const countryCol = headers.findIndex(h => 
    h.includes('pais') || h.includes('país') || h.includes('country') || h.includes('origen')
  )
  
  if (hsCodeCol === -1) {
    throw new Error('No se encuentra la columna "HS Code". Columnas encontradas: ' + headers.join(', '))
  }
  
  if (cifCol === -1) {
    throw new Error('No se encuentra la columna "Valor CIF". Columnas encontradas: ' + headers.join(', '))
  }
  
  if (countryCol === -1) {
    throw new Error('No se encuentra la columna "País/Origen". Columnas encontradas: ' + headers.join(', '))
  }
  
  // Parse data
  const items = []
  const errors = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // Saltar líneas vacías
    
    const values = line.split(separator).map(v => v.trim())
    
    const hsCode = values[hsCodeCol]?.replace(/\s/g, '').replace(/\./g, '')
    const cifValue = parseFloat(values[cifCol]?.replace(/[^\d.,]/g, '').replace(',', '.'))
    const countryCode = values[countryCol]?.toUpperCase()
    
    // Validar
    if (!hsCode || hsCode.length < 2) {
      errors.push({
        line: i + 1,
        error: 'Código HS inválido o vacío',
        data: values
      })
      continue
    }
    
    if (!cifValue || isNaN(cifValue) || cifValue <= 0) {
      errors.push({
        line: i + 1,
        error: 'Valor CIF inválido',
        data: values
      })
      continue
    }
    
    if (!countryCode || countryCode.length < 2) {
      errors.push({
        line: i + 1,
        error: 'País inválido o vacío',
        data: values
      })
      continue
    }
    
    items.push({
      hsCode,
      cifValue,
      countryCode,
      lineNumber: i + 1
    })
  }
  
  return {
    items,
    errors,
    total: items.length,
    hasErrors: errors.length > 0
  }
}

export function generateSampleCSV() {
  return `HS Code,Valor CIF,País
8471300000,1000,CN
0702000000,500,ES
8517620000,2000,JP
3004909900,1500,US
8471300000,3000,MX`
}
