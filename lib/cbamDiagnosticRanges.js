/**
 * CBAM Diagnostic — Rangos cualitativos de certificados por sector.
 *
 * Nivel 2 post-Día 6: no mostramos cifras exactas, solo rangos cualitativos
 * calibrados a las emisiones/tonelada típicas de cada sector CBAM. Los valores
 * son orientativos y coherentes con los factores de emisión oficiales
 * (Reg. 2025/2621) — no sustituyen a un cálculo reproducible.
 *
 * Sector IDs reales usados por `lib/cbamData.js` (NO usar los del brief):
 *   cement · electricity · fertilizers · hydrogen · ironSteel · aluminium
 *
 * Para mix de sectores (ningún sector supera 60% del tonelaje) usamos los
 * rangos de ironSteel como neutros.
 */

export const CERTIFICATE_RANGES_BY_SECTOR = {
  ironSteel: [
    { max: 25, label: '<25' },
    { max: 100, label: '25-100' },
    { max: 500, label: '100-500' },
    { max: Infinity, label: '>500' },
  ],
  aluminium: [
    { max: 50, label: '<50' },
    { max: 200, label: '50-200' },
    { max: 1000, label: '200-1.000' },
    { max: Infinity, label: '>1.000' },
  ],
  cement: [
    { max: 10, label: '<10' },
    { max: 50, label: '10-50' },
    { max: 200, label: '50-200' },
    { max: Infinity, label: '>200' },
  ],
  fertilizers: [
    { max: 30, label: '<30' },
    { max: 150, label: '30-150' },
    { max: 500, label: '150-500' },
    { max: Infinity, label: '>500' },
  ],
  hydrogen: [
    { max: 50, label: '<50' },
    { max: 200, label: '50-200' },
    { max: 800, label: '200-800' },
    { max: Infinity, label: '>800' },
  ],
}

export const MIXED_SECTOR_KEY = 'ironSteel'
export const PREDOMINANT_THRESHOLD = 0.60

/**
 * Devuelve el sector predominante (el que supera el 60% del tonelaje total)
 * o `null` si ningún sector alcanza el umbral — entonces usa rangos neutros.
 *
 * @param {Array} lines - Array de líneas del motor (requiere `sectorId`
 *                        y `annualTonnes`).
 * @returns {{ sectorId: string, isMixed: boolean, tonnageBySector: Object }}
 */
export function resolvePredominantSector(lines) {
  const tonnageBySector = {}
  let totalTonnage = 0

  for (const line of lines) {
    if (!line || !line.sectorId) continue
    const t = Number(line.annualTonnes) || 0
    if (t <= 0) continue
    tonnageBySector[line.sectorId] = (tonnageBySector[line.sectorId] || 0) + t
    totalTonnage += t
  }

  if (totalTonnage === 0) {
    return { sectorId: MIXED_SECTOR_KEY, isMixed: true, tonnageBySector }
  }

  let topSector = null
  let topTonnage = 0
  for (const [sectorId, t] of Object.entries(tonnageBySector)) {
    if (t > topTonnage) {
      topSector = sectorId
      topTonnage = t
    }
  }

  const ratio = topTonnage / totalTonnage
  if (topSector && ratio >= PREDOMINANT_THRESHOLD && CERTIFICATE_RANGES_BY_SECTOR[topSector]) {
    return { sectorId: topSector, isMixed: false, tonnageBySector }
  }

  return { sectorId: MIXED_SECTOR_KEY, isMixed: true, tonnageBySector }
}

/**
 * Clasifica un número de certificados estimados en uno de los 4 rangos del
 * sector. Devuelve el label literal ('<25', '25-100', ...) y el tier index
 * 0..3 para mapear a la etiqueta de exposición cualitativa.
 */
export function resolveCertificateRange(totalCertificates, sectorId) {
  const ranges = CERTIFICATE_RANGES_BY_SECTOR[sectorId]
    || CERTIFICATE_RANGES_BY_SECTOR[MIXED_SECTOR_KEY]
  const certs = Math.max(0, Number(totalCertificates) || 0)

  for (let i = 0; i < ranges.length; i++) {
    if (certs < ranges[i].max) {
      return { label: ranges[i].label, tier: i }
    }
  }
  return { label: ranges[ranges.length - 1].label, tier: ranges.length - 1 }
}
