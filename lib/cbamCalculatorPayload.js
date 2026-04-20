/**
 * CBAM Calculator — payload filter (free-tier).
 *
 * El motor puro `calculateProducts` devuelve todos los campos técnicos
 * (FE aplicado, Column A/B, markup, ruta aplicada, benchmark). Estos campos
 * son **premium** — solo el Advisory (informe PDF) los expone al usuario.
 *
 * Desde el Día 6 la Calculadora pública (Nivel 2) entrega un **diagnóstico
 * cualitativo** en lugar de la cifra exacta: semáforo por tonelaje, rangos de
 * certificados y exposición económica cualitativa. La función base
 * `toFreeTierPayload` sigue existiendo (se usa al guardar el snapshot completo
 * en BD, para poder revertir el flag sin regenerar) pero el endpoint público
 * entrega `toDiagnosticPayload`, que además aplica el semáforo por línea y
 * oculta `certificates`/`totalCost` salvo que `NIVEL_2_SHOW_COST=true`.
 */

import { buildDiagnostic, resolveTrafficLight, shouldShowCost } from './cbamDiagnosticBuilder.js'

/**
 * Filtra una línea de resultado del motor dejando solo campos públicos.
 * Echo de vuelta el input del producto (CN, country, tonnes, descripción,
 * fuente) para que el UI pueda renderizar la tabla sin volver a leer state.
 */
function filterLineForFreeTier(line, inputProduct) {
  return {
    // Identificadores y echo del input
    productDescription: inputProduct?.productDescription || '',
    cnCode: line.cnCode || inputProduct?.cnCode || '',
    countryCode: line.countryCode || inputProduct?.countryCode || '',
    annualTonnes: line.annualTonnes ?? (Number(inputProduct?.annualTonnes) || 0),
    emissionSource: line.emissionSource,    // 'real' | 'default' — el user ya lo eligió
    sectorId: line.sectorId,                // nombre del sector, útil para label

    // Métricas públicas del cálculo
    totalEmissions: round4(line.totalEmissions),
    agie: round4(line.agie),
    certificates: round4(line.certificates),
    totalCost: round2(line.totalCost),

    // Metadata no-sensitiva (no es dato premium; es bandera de calidad
    // del dataset oficial para que la UI distinga "0 €" silencioso de
    // "sin DV oficial publicado para CN×país").
    hasOfficialData: line.hasOfficialData !== false,
    hasError: !line.sectorId,               // CN no-CBAM o no encontrado
    errorReason: !line.sectorId ? 'not_cbam_or_not_found' : null,
  }
}

/**
 * Filtra el resultado completo del motor (lines + totals) a su forma free-tier.
 * @param {Object} engineResult - lo que devuelve calculateProducts
 * @param {Array}  inputProducts - array original de productos input
 */
export function toFreeTierPayload(engineResult, inputProducts = []) {
  const lines = (engineResult.lines || []).map((line, i) =>
    filterLineForFreeTier(line, inputProducts[i])
  )
  const missingDataCount = lines.filter(l => !l.hasOfficialData).length
  // Sumamos certificates solo de líneas con datos oficiales. El motor puro
  // ya excluye las sin datos de los totales (totalCost, totalEmissions,
  // totalTonnes); aquí mantenemos la misma regla para totalCertificates.
  const totalCertificates = round4(
    lines.reduce((acc, l) => acc + (l.hasOfficialData ? (l.certificates || 0) : 0), 0)
  )
  return {
    lines,
    totals: {
      totalCost: round2(engineResult.totals?.totalEstimatedCost || 0),
      totalCertificates,
      totalEmissions: round4(engineResult.totals?.totalEmissions || 0),
      totalTonnes: round2(engineResult.totals?.totalTonnes || 0),
      exceedsDeMinisMis: engineResult.totals?.exceedsDeMinisMis || false,
      co2PriceUsed: round2(engineResult.totals?.co2PriceUsed || 0),
      missingDataCount,
    },
    regParams: {
      year: engineResult.regParams?.year,
      certificatePrice: round2(engineResult.regParams?.certificatePrice || 0),
      // NO exponemos cbamFactor ni fci aquí por higiene, aunque técnicamente
      // son públicos por regulación. Mantener el output minimalista.
    },
  }
}

function round2(v) {
  if (v == null || isNaN(v)) return 0
  return Math.round(v * 100) / 100
}

function round4(v) {
  if (v == null || isNaN(v)) return 0
  return Math.round(v * 10000) / 10000
}

// ============================================================
// DIAGNÓSTICO CUALITATIVO (Nivel 2 post-Día 6)
// ============================================================

/**
 * Filtra una línea para el payload público del diagnóstico: se conserva
 * identificación, tonelaje y semáforo de línea; se oculta `certificates` y
 * `totalCost` salvo que `showCost=true`.
 */
function filterLineForDiagnostic(line, inputProduct, { showCost }) {
  const tonnes = line.annualTonnes ?? (Number(inputProduct?.annualTonnes) || 0)
  const lineTrafficLight = resolveTrafficLight(tonnes)

  const base = {
    productDescription: inputProduct?.productDescription || '',
    cnCode: line.cnCode || inputProduct?.cnCode || '',
    countryCode: line.countryCode || inputProduct?.countryCode || '',
    annualTonnes: tonnes,
    emissionSource: line.emissionSource,
    sectorId: line.sectorId,
    totalEmissions: round4(line.totalEmissions),
    hasOfficialData: line.hasOfficialData !== false,
    hasError: !line.sectorId,
    errorReason: !line.sectorId ? 'not_cbam_or_not_found' : null,
    lineTrafficLight,
  }

  if (showCost) {
    base.certificates = round4(line.certificates)
    base.totalCost = round2(line.totalCost)
  }
  return base
}

/**
 * Payload público para el endpoint `/api/cbam/calculator/calculate` y para
 * el detalle del historial. Aplica `buildDiagnostic` + filtra líneas.
 *
 * La cifra exacta (`totalCost`, `totalCertificates`, columnas Cert/Coste) se
 * esconde por defecto. Si el operador fija `NIVEL_2_SHOW_COST=true`, esos
 * campos vuelven — lo que permite revertir el cambio del Día 6 sin redeploy.
 *
 * @param {Object} engineResult   - salida de `calculateProducts`
 * @param {Array}  inputProducts  - productos de entrada (para echo en tabla)
 * @param {Object} [opts]
 * @param {boolean}[opts.showCost] - override manual del flag; si se omite usa env
 */
export function toDiagnosticPayload(engineResult, inputProducts = [], opts = {}) {
  const showCost = opts.showCost ?? shouldShowCost()
  const diagnostic = buildDiagnostic(engineResult, {
    showCost,
    inputProducts,
    scope: opts.scope || {},
  })

  const rawLines = Array.isArray(engineResult?.lines) ? engineResult.lines : []
  const lines = rawLines.map((line, i) =>
    filterLineForDiagnostic(line, inputProducts[i], { showCost }),
  )
  const missingDataCount = lines.filter(l => !l.hasOfficialData).length

  const totals = {
    totalTonnes: round2(engineResult.totals?.totalTonnes || 0),
    exceedsDeMinisMis: engineResult.totals?.exceedsDeMinisMis || false,
    missingDataCount,
  }
  if (showCost) {
    totals.totalCost = round2(engineResult.totals?.totalEstimatedCost || 0)
    totals.totalCertificates = round4(
      rawLines.reduce(
        (acc, l) => acc + (l?.hasOfficialData !== false ? Number(l.certificates) || 0 : 0),
        0,
      ),
    )
    totals.co2PriceUsed = round2(engineResult.totals?.co2PriceUsed || 0)
  }

  const regParams = {
    year: engineResult.regParams?.year,
  }
  if (showCost) {
    regParams.certificatePrice = round2(engineResult.regParams?.certificatePrice || 0)
  }

  return {
    diagnostic,
    lines,
    totals,
    regParams,
    showCost,
  }
}

/**
 * Reconstruye un payload de diagnóstico a partir de un snapshot previamente
 * guardado en BD con `toFreeTierPayload` (contiene lines con cert/coste). Se
 * usa en el historial para re-aplicar el filtro del flag actual sin regenerar
 * el cálculo — el snapshot es reproducible y no cambia aunque el flag cambie.
 *
 * @param {Object} snapshot     - objeto persistido en `result_snapshot`
 * @param {Array}  inputProducts - products persistidos en `products`
 * @param {Object} [opts]
 */
export function toDiagnosticFromSnapshot(snapshot, inputProducts = [], opts = {}) {
  const engineLike = {
    lines: Array.isArray(snapshot?.lines) ? snapshot.lines : [],
    totals: {
      totalEstimatedCost: snapshot?.totals?.totalCost || 0,
      totalTonnes: snapshot?.totals?.totalTonnes || 0,
      totalEmissions: snapshot?.totals?.totalEmissions || 0,
      exceedsDeMinisMis: snapshot?.totals?.exceedsDeMinisMis || false,
      co2PriceUsed: snapshot?.totals?.co2PriceUsed || 0,
    },
    regParams: snapshot?.regParams || {},
  }
  return toDiagnosticPayload(engineLike, inputProducts, opts)
}
