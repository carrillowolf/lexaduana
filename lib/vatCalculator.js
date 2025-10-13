// Función para determinar el tipo de IVA según código HS
export function determineVATByChapter(hsCode) {
  const chapter = hsCode.substring(0, 2)
  const chapterNum = parseInt(chapter)
  
  // Reglas por capítulo HS (primera aproximación)
  
  // Capítulos 1-24: Productos alimenticios
  if (chapterNum >= 1 && chapterNum <= 24) {
    // Capítulos con IVA superreducido (4%)
    if ([1, 2, 3, 4, 7, 8, 10, 11].includes(chapterNum)) {
      return { rate: 4, type: 'superreducido' }
    }
    // El resto de alimentos: IVA reducido (10%)
    return { rate: 10, type: 'reducido' }
  }
  
  // Capítulo 30: Productos farmacéuticos
  if (chapterNum === 30) {
    return { rate: 4, type: 'superreducido' }
  }
  
  // Capítulo 49: Libros, periódicos
  if (chapterNum === 49) {
    return { rate: 4, type: 'superreducido' }
  }
  
  // Capítulo 90.21: Prótesis
  if (hsCode.startsWith('9021')) {
    return { rate: 4, type: 'superreducido' }
  }
  
  // Capítulos 68-69: Materiales de construcción (algunos casos)
  if ([68, 69].includes(chapterNum)) {
    return { rate: 10, type: 'reducido' }
  }
  
  // Por defecto: IVA general
  return { rate: 21, type: 'general' }
}

export function getVATDescription(type) {
  const descriptions = {
    'superreducido': 'IVA Superreducido (4%) - Productos básicos',
    'reducido': 'IVA Reducido (10%) - Alimentos y servicios esenciales',
    'general': 'IVA General (21%) - Resto de productos'
  }
  return descriptions[type] || descriptions.general
}
