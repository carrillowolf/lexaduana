/**
 * CBAM Calculator — payload filter (free-tier)
 *
 * El motor puro `calculateProducts` devuelve todos los campos técnicos
 * (FE aplicado, Column A/B, markup, ruta aplicada, benchmark). Estos campos
 * son **premium** — solo el Advisory (informe PDF) los expone al usuario.
 *
 * La Calculadora pública (Nivel 2 freemium) solo devuelve los campos públicos.
 * El filtro vive en backend para que el usuario no pueda leerlos vía DevTools.
 *
 * Este módulo es la única fuente de verdad para qué se considera "free-tier".
 */

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
