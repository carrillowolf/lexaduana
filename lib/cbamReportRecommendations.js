/**
 * CBAM Report Recommendations - Phase 3
 *
 * Lógica de recomendaciones automáticas para el informe de exposición CBAM.
 * Se invoca con el snapshot del informe y devuelve un array de recomendaciones
 * priorizadas. Bilingüe ES + EN forzado.
 *
 * Cada recomendación tiene:
 *   { id, priority, titleEs, titleEn, bodyEs, bodyEn }
 *
 * priority: 'high' | 'medium' | 'low'
 *
 * NO depende de cliente Supabase. Pura lógica de negocio para poder testearse.
 */

// ============================================================
// CONSTANTES
// ============================================================

const DE_MINIMIS_TONNES = 50  // Umbral CBAM
const DOWNSTREAM_2028_SECTORS = ['steel', 'iron', 'aluminium', 'aluminum']

// ============================================================
// HELPERS
// ============================================================

/** Detecta líneas que NO tienen datos reales de emisiones (usan default) */
function findLinesWithoutRealData(products) {
  return (products || []).filter(p => {
    const source = p.emissionSource || p.emission_source
    return source !== 'real'
  })
}

/** Suma el ahorro potencial de líneas sin datos reales (estimado a partir de defaults) */
function estimatePotentialSavings(products) {
  return (products || []).reduce((sum, p) => {
    const source = p.emissionSource || p.emission_source
    if (source === 'real') return sum
    const cost = parseFloat(p.totalCost || p.total_cost || 0)
    // Heurística: asumir ahorro potencial del 15% si se obtienen datos reales
    return sum + cost * 0.15
  }, 0)
}

/** Detecta si hay productos en sectores con downstream extension 2028 */
function hasDownstreamExposedSectors(products) {
  return (products || []).some(p => {
    const sector = (p.sectorId || p.sector_id || '').toLowerCase()
    return DOWNSTREAM_2028_SECTORS.some(s => sector.includes(s))
  })
}

/** Formatea EUR con miles */
function fmtEUR(value) {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0))
}

// ============================================================
// MAIN
// ============================================================

/**
 * Genera el array de recomendaciones para un snapshot del informe.
 *
 * @param {Object} snapshot - Estructura con { request, products, totals }
 * @returns {Array<Object>} Recomendaciones priorizadas
 */
export function generateRecommendations(snapshot) {
  const recommendations = []
  const { request, products, totals } = snapshot

  const linesWithoutReal = findLinesWithoutRealData(products)
  const totalTonnes = parseFloat(totals?.totalTonnes || request?.totalTonnes || 0)

  // ========================================================
  // 1. Datos reales vs valores por defecto
  // ========================================================
  if (linesWithoutReal.length > 0) {
    const potentialSavings = estimatePotentialSavings(products)
    const supplierNames = [
      ...new Set(
        linesWithoutReal
          .map(p => p.supplierName || p.supplier_name)
          .filter(Boolean)
      ),
    ].slice(0, 3)

    const supplierStr = supplierNames.length
      ? supplierNames.join(', ')
      : 'sus proveedores / your suppliers'

    recommendations.push({
      id: 'request_real_data',
      priority: 'high',
      titleEs: 'Solicitar datos reales de emisiones a sus proveedores',
      titleEn: 'Request actual emissions data from your suppliers',
      bodyEs:
        `Tiene ${linesWithoutReal.length} línea(s) de importación sin datos reales de emisiones, ` +
        `donde se aplican valores por defecto UE (con markup). Solicitando los datos reales ` +
        `de instalación a ${supplierStr}, podría reducir el coste CBAM estimado en aproximadamente ` +
        `${fmtEUR(potentialSavings)} EUR/año. Los datos deben ser verificados por un acreditador ` +
        `independiente acreditado por EA (European Accreditation).`,
      bodyEn:
        `You have ${linesWithoutReal.length} import line(s) without actual emissions data, ` +
        `where EU default values (with markup) apply. By requesting actual installation data ` +
        `from ${supplierStr}, you could reduce the estimated CBAM cost by approximately ` +
        `${fmtEUR(potentialSavings)} EUR/year. The data must be verified by an independent ` +
        `accreditor accredited by EA (European Accreditation).`,
    })
  } else {
    recommendations.push({
      id: 'maintain_real_data',
      priority: 'medium',
      titleEs: 'Mantener actualizados los datos reales y verificación periódica',
      titleEn: 'Keep actual data updated and ensure periodic verification',
      bodyEs:
        'Todas sus líneas de importación cuentan con datos reales de emisiones — excelente. ' +
        'Recomendamos asegurar que estos datos se actualicen anualmente y que la verificación ' +
        'por acreditador se renueve dentro de los plazos exigidos por el Reglamento (UE) 2023/956. ' +
        'Solicite a sus proveedores los certificados de verificación para cada año fiscal.',
      bodyEn:
        'All your import lines have actual emissions data — excellent. We recommend ensuring ' +
        'this data is updated annually and that accreditor verification is renewed within the ' +
        'deadlines required by Regulation (EU) 2023/956. Request verification certificates ' +
        'from your suppliers for each fiscal year.',
    })
  }

  // ========================================================
  // 2. Alerta de minimis
  // ========================================================
  if (totalTonnes >= DE_MINIMIS_TONNES * 0.8 && totalTonnes < DE_MINIMIS_TONNES * 1.5) {
    recommendations.push({
      id: 'de_minimis_alert',
      priority: 'high',
      titleEs: 'Atención al umbral de de minimis (50 toneladas)',
      titleEn: 'Watch the de minimis threshold (50 tonnes)',
      bodyEs:
        `Su volumen total de importaciones (${fmtEUR(totalTonnes)} t) está cerca del umbral ` +
        `de de minimis de 50 toneladas. Por debajo de este umbral, las importaciones quedan ` +
        `exentas de obligaciones CBAM. Si está cerca, evalúe consolidar o repartir importaciones ` +
        `entre años fiscales para optimizar su exposición.`,
      bodyEn:
        `Your total import volume (${fmtEUR(totalTonnes)} t) is close to the 50-tonne ` +
        `de minimis threshold. Below this threshold, imports are exempt from CBAM obligations. ` +
        `If you're close, consider consolidating or splitting imports across fiscal years ` +
        `to optimize your exposure.`,
    })
  }

  // ========================================================
  // 3. Downstream extension 2028
  // ========================================================
  if (hasDownstreamExposedSectors(products)) {
    recommendations.push({
      id: 'downstream_2028',
      priority: 'medium',
      titleEs: 'Prepararse para la extensión downstream 2028',
      titleEn: 'Prepare for the 2028 downstream extension',
      bodyEs:
        'Importa productos de sectores (acero, aluminio) que serán afectados por la extensión ' +
        'downstream del CBAM prevista para 2028. Esta extensión incluirá productos transformados ' +
        'que actualmente quedan fuera del ámbito. Recomendamos revisar su cartera de productos ' +
        'transformados y empezar a recopilar datos de emisiones de su cadena de suministro.',
      bodyEn:
        'You import products in sectors (steel, aluminium) that will be affected by the ' +
        'CBAM downstream extension scheduled for 2028. This extension will include processed ' +
        'products currently outside the scope. We recommend reviewing your processed product ' +
        'portfolio and starting to collect emissions data from your supply chain.',
    })
  }

  // ========================================================
  // 4. Registro CBAM (siempre que esté en producción)
  // ========================================================
  recommendations.push({
    id: 'cbam_account_registration',
    priority: 'medium',
    titleEs: 'Registro como CBAM Authorized Declarant',
    titleEn: 'Registration as CBAM Authorized Declarant',
    bodyEs:
      'Verifique que su empresa está registrada como CBAM Authorized Declarant en el portal ' +
      'del Estado miembro (en España, AEAT). El registro es obligatorio para todos los ' +
      'importadores afectados a partir de 2026. La cuenta CBAM permitirá adquirir certificados ' +
      'a partir de 2027.',
    bodyEn:
      'Verify that your company is registered as a CBAM Authorized Declarant in the Member ' +
      'State portal (in Spain, AEAT). Registration is mandatory for all affected importers ' +
      'from 2026 onwards. The CBAM account will allow you to purchase certificates from 2027.',
  })

  // ========================================================
  // 5. Obligaciones del período definitivo CBAM
  // ========================================================
  recommendations.push({
    id: 'definitive_period_obligations',
    priority: 'low',
    titleEs: 'Obligaciones del período definitivo CBAM (desde 1 de enero de 2026)',
    titleEn: 'Definitive CBAM period obligations (from 1 January 2026)',
    bodyEs:
      'Desde el 1 de enero de 2026 se aplica el período definitivo del CBAM. Las obligaciones ' +
      'principales son: (1) Declaración anual CBAM antes del 31 de mayo del año siguiente ' +
      '(primera declaración: 31 de mayo de 2027 para el ejercicio 2026). (2) Adquisición ' +
      'y entrega de certificados CBAM correspondientes a las emisiones incorporadas declaradas, ' +
      'con entregas trimestrales parciales. (3) Mantener el estatus de declarante autorizado ' +
      'vigente en el CBAM Registry del Estado miembro. LexAduana puede asistirle en la ' +
      'preparación de la declaración anual y la gestión de certificados.',
    bodyEn:
      'From 1 January 2026, the definitive CBAM period applies. Key obligations are: ' +
      '(1) Annual CBAM declaration by 31 May of the following year (first declaration: ' +
      '31 May 2027 for fiscal year 2026). (2) Purchase and surrender of CBAM certificates ' +
      'corresponding to declared embedded emissions, with quarterly partial surrenders. ' +
      '(3) Maintain active authorized declarant status in the Member State CBAM Registry. ' +
      'LexAduana can assist you in preparing the annual declaration and managing certificates.',
  })

  return recommendations
}
