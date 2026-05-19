/**
 * Matemática CBAM por línea de producto — motor puro.
 *
 * Aislado del resto del calculator (que tira de Supabase y de imports
 * con alias @/) para que sea testeable con `node --test` sin necesidad
 * de toolchain de Next ni env vars.
 *
 * Reglas invariantes:
 *  - raw = max(0, Tn·FE − Tn·F_CBAM·FCI·BM) en full precision.
 *  - certificatesToSurrender = Math.ceil(raw) — sobre el RAW, NUNCA sobre
 *    el redondeado a 2 decimales. Cada línea es una entrega independiente
 *    (Art. 20 Reg. (UE) 2023/956). El total se calcula como suma de ceils
 *    por línea, NUNCA como ceil del total.
 *  - lineCost = certificatesToSurrender × price — entero × precio, no
 *    decimal × precio. Esto evita que el cliente reciba un total con
 *    décimas de certificado que el registro CBAM no acepta.
 *  - certificatesPhysical = round2(raw) — solo presentación; no para coste.
 */

/**
 * @param {Object}  params
 * @param {number}  params.tonnes
 * @param {number}  params.emissionFactor   — FE aplicado (con markup si default)
 * @param {number}  params.benchmark        — BM crudo del CN code (Column A o B)
 * @param {number}  params.cbamFactor       — F_CBAM del año (Art. 36 Reg. 2023/956)
 * @param {number}  params.fci              — Factor de Corrección Intersectorial
 * @param {number}  params.price            — Precio certificado CBAM €/tCO₂e
 * @returns {{
 *   incorporatedEmissions: number,
 *   effectiveBenchmark: number,
 *   freeAllocationImplicit: number,
 *   certificatesPhysical: number,
 *   certificatesToSurrender: number,
 *   lineCost: number,
 * }}
 */
export function calculateLineMath({ tonnes, emissionFactor, benchmark, cbamFactor, fci, price }) {
  const t = Number(tonnes) || 0
  const fe = Number(emissionFactor) || 0
  const bm = Number(benchmark) || 0
  const cf = Number(cbamFactor) || 0
  const fc = Number(fci) || 0
  const p = Number(price) || 0

  const incorporatedEmissions = t * fe
  const effectiveBenchmark = cf * fc * bm
  const freeAllocationImplicit = t * effectiveBenchmark

  // raw: valor crudo en full precision sobre el que se aplica el ceil.
  const raw = Math.max(0, incorporatedEmissions - freeAllocationImplicit)

  const certificatesToSurrender = Math.ceil(raw)
  const certificatesPhysical = Math.round(raw * 100) / 100 // round2 — presentación
  const lineCost = Math.round(certificatesToSurrender * p * 100) / 100

  return {
    incorporatedEmissions,
    effectiveBenchmark,
    freeAllocationImplicit,
    certificatesPhysical,
    certificatesToSurrender,
    lineCost,
  }
}
