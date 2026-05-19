/**
 * CBAM Regulatory Parameters
 *
 * Parámetros regulatorios oficiales del Mecanismo de Ajuste en Frontera por
 * Carbono (MAFC/CBAM). Centralizados aquí para poder citar la fuente en los
 * informes PDF y actualizarlos de forma controlada conforme la Comisión
 * publique nuevos valores.
 *
 * IMPORTANTE: cada constante incluye la referencia al acto jurídico que la
 * establece. Cuando actualices un valor, ACTUALIZA TAMBIÉN la fuente.
 */

// ============================================================
// 1. FACTOR CBAM (F_CBAM) — "Factor de obligación gradual"
// ============================================================
//
// Define el porcentaje de las emisiones incorporadas que el importador debe
// compensar mediante certificados CBAM, como contrapartida del phase-out
// gradual de las asignaciones gratuitas del régimen EU ETS.
//
// Base legal: Art. 36(2)(b) del Reglamento (UE) 2023/956 del Parlamento
// Europeo y del Consejo, de 10 de mayo de 2023.
//
// Calendario oficial (Art. 36 Reg. 2023/956):
//  - 2026: 2,5 %  → F_CBAM = 0,975
//  - 2027: 5 %    → F_CBAM = 0,95
//  - 2028: 10 %   → F_CBAM = 0,90
//  - 2029: 22,5 % → F_CBAM = 0,775
//  - 2030: 48,5 % → F_CBAM = 0,515
//  - 2031: 61 %   → F_CBAM = 0,39
//  - 2032: 73,5 % → F_CBAM = 0,265
//  - 2033: 86 %   → F_CBAM = 0,14
//  - 2034+: 100 % → F_CBAM = 0,00 (asignaciones gratuitas eliminadas)
//
// Nota: F_CBAM representa el "porcentaje de asignación gratuita equivalente"
// que el importador todavía conserva. La obligación real de compra es
// (1 − F_CBAM) del total, aplicado sobre el benchmark. Ver fórmula en
// cbamAdvisoryCalculator.js.

export const CBAM_FACTOR_BY_YEAR = {
  2026: 0.975,
  2027: 0.95,
  2028: 0.90,
  2029: 0.775,
  2030: 0.515,
  2031: 0.39,
  2032: 0.265,
  2033: 0.14,
  2034: 0.0,
}

export const CBAM_FACTOR_SOURCE = 'Art. 36(2)(b) Reg. (UE) 2023/956'

export function getCbamFactor(year) {
  if (year >= 2034) return 0
  if (year < 2026) return 1 // periodo transitorio: sin obligación
  return CBAM_FACTOR_BY_YEAR[year] ?? 0.975
}

// ============================================================
// 2. FCI — Factor de Corrección Intersectorial
// ============================================================
//
// Ajuste a la asignación gratuita específica por instalación para garantizar
// que la suma de asignaciones no supera el límite anual fijado por la UE.
//
// Se calcula y publica anualmente por la Comisión Europea al cierre del
// ejercicio anterior, una vez conocido el sumatorio total de asignaciones
// gratuitas asignadas a productores europeos del sector EU ETS.
//
// Base legal: Art. 10a(5) de la Directiva 2003/87/CE (EU ETS) aplicado a
// CBAM mediante el Reglamento de Ejecución (UE) 2025/2620 de la Comisión,
// de 16 de diciembre de 2025.
//
// Estado actual: para 2026 NO se ha publicado aún. Se usa el valor
// provisional 1,0 (sin corrección). Cuando la CE publique el valor oficial
// habrá que actualizar esta constante.

export const FCI_BY_YEAR = {
  2026: 1.0, // provisional, pendiente de publicación oficial
}

export const FCI_SOURCE_OFFICIAL = 'Reg. Ejecución (UE) 2025/2620'
export const FCI_SOURCE_PROVISIONAL = 'Provisional — pendiente publicación CE'

export function getFci(year) {
  return FCI_BY_YEAR[year] ?? 1.0
}

export function getFciSource(year) {
  // Cuando haya un valor oficial para un año concreto, cambiar aquí.
  return FCI_SOURCE_PROVISIONAL
}

// ============================================================
// 3. PRECIO CERTIFICADO CBAM
// ============================================================
//
// El precio de los certificados CBAM se calcula y publica trimestralmente
// por la Comisión Europea como media del precio de cierre EUA (EU Allowance)
// del trimestre anterior, conforme al Reglamento de Ejecución (UE) 2025/2548
// de la Comisión, de 10 de diciembre de 2025.
//
// Lectura híbrida:
//  - Fuente primaria en runtime: tabla `cbam_ets_prices` (campo is_current=true).
//    El calculator la consulta vía getCurrentETSPrice() en cbamService.js.
//  - Fuente de respaldo (build time, tests, env vars Supabase faltantes):
//    la constante CBAM_CERTIFICATE_PRICE_FALLBACK definida abajo.
//
// Mantener sincronizadas ambas fuentes: cuando la CE publique un nuevo
// precio trimestral, actualizar la fila en cbam_ets_prices AND la
// constante de respaldo. El script scripts/testCBAME2E.js también la
// duplica — mantener al día.
//
// Valor actual: Q1 2026 oficial (publicado 2026-04-08 por la CE).

export const CBAM_CERTIFICATE_PRICE_FALLBACK = 75.36 // €/tCO₂e — respaldo si BD no disponible
export const CBAM_CERTIFICATE_PRICE_DATE = '2026-Q1'
export const CBAM_CERTIFICATE_PRICE_SOURCE = 'Reg. Ejecución (UE) 2025/2548'

export function getCbamCertificatePrice() {
  return {
    price: CBAM_CERTIFICATE_PRICE_FALLBACK,
    date: CBAM_CERTIFICATE_PRICE_DATE,
    source: CBAM_CERTIFICATE_PRICE_SOURCE,
    note: 'Precio de respaldo (constante). La fuente primaria es cbam_ets_prices vía getCurrentETSPrice().',
  }
}

// ============================================================
// 4. REFERENCIAS NORMATIVAS CONSOLIDADAS
// ============================================================
//
// Diccionario para que los informes puedan citar una fuente con un único
// identificador y siempre un texto coherente.

export const REGULATORY_SOURCES = {
  CBAM_REGULATION: {
    id: 'REG_2023_956',
    title: 'Reglamento (UE) 2023/956',
    fullTitle:
      'Reglamento (UE) 2023/956 del Parlamento Europeo y del Consejo, de 10 de mayo de 2023, por el que se establece un Mecanismo de Ajuste en Frontera por Carbono',
    url: 'https://eur-lex.europa.eu/eli/reg/2023/956/oj',
  },
  DEFAULT_VALUES: {
    id: 'REG_2025_2621',
    title: 'Reg. Ejecución (UE) 2025/2621',
    fullTitle:
      'Reglamento de Ejecución (UE) 2025/2621 de la Comisión, de 16 de diciembre de 2025, relativo al establecimiento de valores por defecto',
    url: 'https://www.boe.es/buscar/doc.php?id=DOUE-L-2025-82052',
  },
  FREE_ALLOCATION_ADJUSTMENT: {
    id: 'REG_2025_2620',
    title: 'Reg. Ejecución (UE) 2025/2620',
    fullTitle:
      'Reglamento de Ejecución (UE) 2025/2620 de la Comisión, de 16 de diciembre de 2025, relativo al cálculo del ajuste de la asignación gratuita',
    url: 'https://www.boe.es/buscar/doc.php?id=DOUE-L-2025-82002',
  },
  CERTIFICATE_PRICE: {
    id: 'REG_2025_2548',
    title: 'Reg. Ejecución (UE) 2025/2548',
    fullTitle:
      'Reglamento de Ejecución (UE) 2025/2548 de la Comisión, de 10 de diciembre de 2025, sobre el cálculo y publicación del precio de los certificados MAFC',
    url: 'https://www.boe.es/buscar/doc.php?id=DOUE-L-2025-82003',
  },
  AUTHORIZED_DECLARANT: {
    id: 'REG_2025_2549',
    title: 'Reg. Ejecución (UE) 2025/2549',
    fullTitle:
      'Reglamento de Ejecución (UE) 2025/2549 de la Comisión, de 10 de diciembre de 2025, sobre la condición de declarante autorizado MAFC',
    url: 'https://www.boe.es/buscar/doc.php?id=DOUE-L-2025-82004',
  },
  ETS_DIRECTIVE: {
    id: 'DIR_2003_87',
    title: 'Directiva 2003/87/CE',
    fullTitle:
      'Directiva 2003/87/CE del Parlamento Europeo y del Consejo por la que se establece el régimen para el comercio de derechos de emisión de gases de efecto invernadero (EU ETS)',
    url: 'https://eur-lex.europa.eu/eli/dir/2003/87/oj',
  },
}

/**
 * Devuelve un objeto con todos los parámetros regulatorios aplicados en un
 * año concreto, junto con sus fuentes. Pensado para incrustar en el snapshot
 * del informe y poder mostrarlo en la tabla de "Metodología / Fuentes".
 */
export function getRegulatoryParamsForYear(year) {
  const cbamFactor = getCbamFactor(year)
  const fci = getFci(year)
  const price = getCbamCertificatePrice()

  return {
    year,
    cbamFactor,
    cbamFactorPct: Math.round((1 - cbamFactor) * 1000) / 10, // % de obligación
    cbamFactorSource: CBAM_FACTOR_SOURCE,
    fci,
    fciSource: getFciSource(year),
    certificatePrice: price.price,
    certificatePriceDate: price.date,
    certificatePriceSource: price.source,
    certificatePriceNote: price.note,
    sources: REGULATORY_SOURCES,
  }
}
