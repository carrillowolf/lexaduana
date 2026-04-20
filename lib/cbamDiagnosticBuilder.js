/**
 * CBAM Diagnostic Builder — Nivel 2 post-Día 6.
 *
 * Transforma el resultado del motor puro (`calculateProducts`) en un payload
 * de diagnóstico cualitativo: semáforo, rangos de certificados, exposición
 * económica, ahorro potencial y recomendación automática de paquete.
 *
 * La cifra exacta en € se calcula internamente igual (el motor no cambia) pero
 * NO se expone al cliente por defecto. Solo si `showCost=true` — controlado
 * por la env `NIVEL_2_SHOW_COST` — se incluyen `totalCost` y
 * `totalCertificates` en el payload para mantener reversibilidad del cambio
 * sin redeploy.
 *
 * Este módulo es puro: no toca BD, no hace fetch, no depende de React.
 */

import { resolvePredominantSector, resolveCertificateRange } from './cbamDiagnosticRanges.js'

// ── Umbrales tonelaje CBAM para el semáforo ─────────────
export const TRAFFIC_LIGHT_GREEN_MAX = 50     // < 50 t → verde
export const TRAFFIC_LIGHT_YELLOW_MAX = 200   // 50-200 t → amarillo; > 200 → rojo

// ── Umbrales del recomendador de paquete ────────────────
export const RECURRING_TONNAGE_MIN = 500      // > 500 t total → monitorización
export const BASIC_INSTALLATIONS_MAX = 3
export const BASIC_PRODUCTS_MAX = 5
export const BASIC_COUNTRIES_MAX = 1

/**
 * Clasifica el tonelaje CBAM total en el semáforo de urgencia.
 *
 * Verde:    < 50 t   → de minimis, sin obligación CBAM en el alcance declarado.
 * Amarillo: 50-200 t → exposición moderada, aconsejable informe oficial.
 * Rojo:     > 200 t  → exposición alta, informe oficial muy recomendable.
 */
export function resolveTrafficLight(totalTonnage) {
  const t = Number(totalTonnage) || 0
  if (t < TRAFFIC_LIGHT_GREEN_MAX) return 'green'
  if (t <= TRAFFIC_LIGHT_YELLOW_MAX) return 'yellow'
  return 'red'
}

/**
 * Mapea el tier del rango de certificados (0..3) a etiqueta cualitativa de
 * exposición económica. Mantenemos 4 niveles para coherencia con los 4 rangos
 * del sector.
 */
function tierToEconomicExposure(tier) {
  return ['low', 'moderate', 'high', 'very_high'][Math.min(3, Math.max(0, tier))]
}

/**
 * Estima el ahorro potencial cualitativo de pasar de valores por defecto a
 * emisiones reales verificadas del proveedor. Se mide sobre la mezcla de
 * productos declarada:
 *   - Todos ya con reales         → 'negligible' (no hay margen)
 *   - Parcial real / parcial def. → 'moderate'
 *   - Todos con defaults          → 'significant'
 *
 * Si no hay líneas con datos oficiales, devolvemos 'negligible' para no
 * sobre-prometer.
 */
function resolvePotentialSaving(lines) {
  const usableLines = (lines || []).filter(l => l && l.hasOfficialData !== false)
  if (usableLines.length === 0) return 'negligible'

  let realCount = 0
  let defaultCount = 0
  for (const line of usableLines) {
    if (line.emissionSource === 'real') realCount++
    else defaultCount++
  }

  if (defaultCount === 0) return 'negligible'
  if (realCount === 0) return 'significant'
  return 'moderate'
}

/**
 * Recomendación automática de paquete Advisory.
 *
 * Criterios (acumulativos):
 *   - totalTonnage > 500  →  monitorizacion
 *   - installations <= 3 && productsCount <= 5 && countriesCount <= 1 → basico
 *   - en otro caso → completo
 *
 * Si algún criterio no está disponible (el motor libre no siempre conoce
 * `installations` ni `hasRecurringImports`), se aplica el criterio disponible
 * de forma conservadora. El wizard Advisory aplicará el detector definitivo
 * con los datos completos del usuario.
 */
export function recommendPackage({
  totalTonnage = 0,
  installations = 1,
  productsCount = 0,
  countriesCount = 0,
  hasRecurringImports = false,
}) {
  if (totalTonnage > RECURRING_TONNAGE_MIN || hasRecurringImports) {
    return 'monitorizacion'
  }
  if (
    installations <= BASIC_INSTALLATIONS_MAX
    && productsCount <= BASIC_PRODUCTS_MAX
    && countriesCount <= BASIC_COUNTRIES_MAX
  ) {
    return 'basico'
  }
  return 'completo'
}

/**
 * Construye el URL del wizard Advisory pre-rellenado desde el diagnóstico.
 *
 * Para "monitorizacion" enruta al wizard específico de Monitorización
 * (`/cbam/asesoria/solicitud/monitorizacion`), que es un flujo distinto del
 * Advisory (pide empresa + volumen en bandas + autorización DUAs, no
 * productos CN individuales). Antes apuntaba al wizard Advisory con
 * `tipo=basico`, lo que contradecía el mensaje en pantalla.
 *
 * El pre-relleno real se inyecta via localStorage en el cliente sólo para los
 * paquetes que realmente lo consumen (básico / completo).
 */
export function buildCtaUrl(recommendedPackage) {
  if (recommendedPackage === 'monitorizacion') {
    return '/cbam/asesoria/solicitud/monitorizacion?from=diagnostic'
  }
  const tipo = recommendedPackage === 'completo' ? 'completo' : 'basico'
  return `/cbam/asesoria/solicitud?tipo=${tipo}&from=diagnostic`
}

/**
 * buildDiagnostic — función pura que transforma el resultado del motor en el
 * payload de diagnóstico Nivel 2.
 *
 * @param {Object} engineResult  - salida de `calculateProducts` (lines, totals, regParams)
 * @param {Object} [opts]
 * @param {boolean}[opts.showCost=false] - si true, incluye totalCost/totalCertificates
 * @param {Array}  [opts.inputProducts]  - productos de entrada (usado solo para derivar
 *                                         countriesCount y productsCount si `lines` no
 *                                         los representa fielmente; opcional).
 * @param {Object} [opts.scope]          - metadatos externos:
 *                                         { installations, hasRecurringImports }
 */
export function buildDiagnostic(engineResult, opts = {}) {
  const { showCost = false, inputProducts = null, scope = {} } = opts
  const lines = Array.isArray(engineResult?.lines) ? engineResult.lines : []
  const totals = engineResult?.totals || {}
  const regParams = engineResult?.regParams || {}

  // Totales base —la tabla ya excluye las líneas sin hasOfficialData
  // (lib/cbamAdvisoryCalculator.js lo hace). Aquí seguimos el mismo criterio.
  const usableLines = lines.filter(l => l && l.hasOfficialData !== false && l.sectorId)

  const totalTonnage = Math.round((Number(totals.totalTonnes) || 0) * 100) / 100
  const productCount = Array.isArray(inputProducts) ? inputProducts.length : lines.length

  const countries = new Set()
  const productsList = Array.isArray(inputProducts) ? inputProducts : lines
  for (const p of productsList) {
    const cc = (p?.countryCode || '').trim()
    if (cc) countries.add(cc)
  }
  const countriesCount = countries.size

  // Sector predominante + rango de certificados.
  const { sectorId: predominantSector, isMixed } = resolvePredominantSector(usableLines)
  const totalCertificatesRaw = (usableLines || []).reduce(
    (acc, l) => acc + (Number(l.certificates) || 0),
    0,
  )
  const certificatesRange = resolveCertificateRange(totalCertificatesRaw, predominantSector)

  const trafficLight = resolveTrafficLight(totalTonnage)
  const economicExposure = tierToEconomicExposure(certificatesRange.tier)
  const potentialSaving = resolvePotentialSaving(lines)

  const installations = Number(scope.installations) > 0
    ? Number(scope.installations)
    : 1
  const hasRecurringImports = Boolean(scope.hasRecurringImports)

  const recommended = recommendPackage({
    totalTonnage,
    installations,
    productsCount: productCount,
    countriesCount,
    hasRecurringImports,
  })

  const diagnostic = {
    trafficLight,
    trafficLightMessage: `diagnostic.trafficLight.${trafficLight}.message`,
    totalTonnage,
    productCount,
    countriesCount,
    installationsEstimate: installations,
    year: Number(regParams.year) || Number(totals.year) || null,
    certificatesRange: {
      label: certificatesRange.label,
      tier: certificatesRange.tier,
      sectorUsed: predominantSector,
      isMixedSector: isMixed,
    },
    economicExposure,
    potentialSaving,
    recommendedPackage: recommended,
    recommendedPackageReason: `diagnostic.recommendation.reason_${recommended}`,
    ctaUrl: buildCtaUrl(recommended),
  }

  if (showCost) {
    const totalCertificates = Math.round(totalCertificatesRaw * 10000) / 10000
    const totalCost = Math.round((Number(totals.totalEstimatedCost ?? totals.totalCost) || 0) * 100) / 100
    diagnostic.totalCost = totalCost
    diagnostic.totalCertificates = totalCertificates
  }

  return diagnostic
}

/**
 * Helper: lee el flag de entorno `NIVEL_2_SHOW_COST` de forma segura. Siempre
 * defaulteado a `false` si no existe o no es exactamente 'true'.
 */
export function shouldShowCost() {
  return process.env.NIVEL_2_SHOW_COST === 'true'
}
