/**
 * Tests del motor matemático CBAM por línea (Bloque 3).
 *
 * Apunta a `calculateLineMath`, la función pura extraída del calculator.
 * NO depende de Supabase ni de Next, solo del runtime de Node.
 *
 * Ejecución: `node --test __tests__/cbamAdvisoryCalculator.test.js`
 *
 * Casos 1-6: extraídos del análisis de la webinar 2026-05-12 a precio
 * oficial Q1 2026 (75,36 €/tCO₂e). Los costes diferirán de los del
 * experto porque él usa precios trimestrales proyectados pre-publicación
 * (79,7 / 82,3 / 84,3 €). Nosotros usamos el oficial — divergencia esperada.
 *
 * Casos 7-9: edge cases del redondeo:
 *   - Suma de ceils por línea ≠ ceil de la suma.
 *   - Línea con raw=0 (no genera certificados).
 *   - Línea con raw entero exacto (ceil idempotente).
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { calculateLineMath } from '../lib/cbamLineMath.js'

// ─── Parámetros regulatorios 2026 ─────────────────────────────────────────
const REG = {
  cbamFactor: 0.975,   // Art. 36(2)(b) Reg. (UE) 2023/956 — F_CBAM 2026
  fci: 1.0,            // Reg. Ejec. (UE) 2025/2620 — provisional 2026
  price: 75.36,        // Q1 2026 oficial — Reg. Ejec. (UE) 2025/2548
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function run(tonnes, fe, bm) {
  return calculateLineMath({
    tonnes,
    emissionFactor: fe,
    benchmark: bm,
    cbamFactor: REG.cbamFactor,
    fci: REG.fci,
    price: REG.price,
  })
}

// ─── Casos 1-6: webinar 2026-05-12 ────────────────────────────────────────
test('Caso 1 — Acero 7208 Metales Inc.: tn=500, FE=1,96, BM=1,16', () => {
  const r = run(500, 1.96, 1.16)
  assert.equal(r.certificatesToSurrender, 415)
  assert.equal(r.lineCost, 31274.40)
  assert.ok(Math.abs(r.certificatesPhysical - 414.5) < 0.05,
    `physical ${r.certificatesPhysical} fuera de tolerancia respecto a 414.5`)
})

test('Caso 2 — Acero 7219 Inox Co.: tn=298, FE=2,52, BM=1,36', () => {
  const r = run(298, 2.52, 1.36)
  assert.equal(r.certificatesToSurrender, 356)
  assert.equal(r.lineCost, 26828.16)
  assert.ok(Math.abs(r.certificatesPhysical - 355.81) < 0.05)
})

test('Caso 3 — Acero 7219 Aceros Ltd defaults: tn=192, FE=2,70, BM=1,36', () => {
  const r = run(192, 2.70, 1.36)
  assert.equal(r.certificatesToSurrender, 264)
  assert.equal(r.lineCost, 19895.04)
  assert.ok(Math.abs(r.certificatesPhysical - 263.81) < 0.05)
})

test('Caso 4 — Acero 7229 Alambrinox: tn=51, FE=1,90, BM=1,16', () => {
  const r = run(51, 1.90, 1.16)
  assert.equal(r.certificatesToSurrender, 40)
  assert.equal(r.lineCost, 3014.40)
  assert.ok(Math.abs(r.certificatesPhysical - 39.22) < 0.05)
})

test('Caso 5 — Acero 7229 Metalix: tn=73, FE=1,72, BM=1,16', () => {
  const r = run(73, 1.72, 1.16)
  assert.equal(r.certificatesToSurrender, 43)
  assert.equal(r.lineCost, 3240.48)
  assert.ok(Math.abs(r.certificatesPhysical - 43.00) < 0.05)
})

test('Caso 6 — Fertilizante 3102.10 Agro Ltd: tn=50, FE=1,45, BM=1,08', () => {
  const r = run(50, 1.45, 1.08)
  assert.equal(r.certificatesToSurrender, 20)
  assert.equal(r.lineCost, 1507.20)
  // Magnitud física exacta es 19.85; el spec de la webinar la redondeaba a 20.
  // Aceptamos tolerancia generosa porque la magnitud presentacional puede
  // diferir según interpretación; lo crítico (uds + coste) coincide.
  assert.ok(r.certificatesPhysical >= 19.8 && r.certificatesPhysical <= 20.0)
})

// ─── Casos 7-9: edge cases del redondeo ───────────────────────────────────
test('Caso 7 — Suma de ceils por línea ≠ ceil de la suma', () => {
  // Dos líneas con raw=0.5 cada una.
  // Suma de ceils: ceil(0.5) + ceil(0.5) = 1 + 1 = 2.
  // Ceil de suma:  ceil(0.5 + 0.5) = ceil(1.0) = 1.
  // El total debe valer 2, NUNCA 1.
  //
  // Construyo dos líneas que dan raw=0.5 exacto:
  //   raw = T * FE - T * F_CBAM * FCI * BM
  //   con cbamFactor=0.975 y fci=1.0 → raw = T*(FE - 0.975*BM)
  //   T=1, FE=0.975 + 0.5 = 1.475, BM=1 → raw = 1.475 - 0.975 = 0.5 ✓
  const r1 = run(1, 1.475, 1)
  const r2 = run(1, 1.475, 1)
  assert.equal(r1.certificatesToSurrender, 1)
  assert.equal(r2.certificatesToSurrender, 1)
  const totalSurrender = r1.certificatesToSurrender + r2.certificatesToSurrender
  assert.equal(totalSurrender, 2, 'la suma de ceils por línea debe ser 2')
  // Validación negativa: el ceil del total daría 1 — fórmula prohibida.
  const wrongTotal = Math.ceil(r1.certificatesPhysical + r2.certificatesPhysical)
  assert.equal(wrongTotal, 1, 'ceil(suma) sería 1 — éste es el bug que evitamos')
  assert.notEqual(totalSurrender, wrongTotal, 'suma de ceils ≠ ceil de suma — invariante')
})

test('Caso 8 — Línea con raw=0 (FE < benchmark efectivo): sin certificados', () => {
  // FE = 1, BM = 10 → BM efectivo = 9.75. FE < BM eff → raw = 0.
  const r = run(100, 1, 10)
  assert.equal(r.certificatesPhysical, 0)
  assert.equal(r.certificatesToSurrender, 0)
  assert.equal(r.lineCost, 0)
})

test('Caso 9 — Línea con raw entero exacto: ceil idempotente', () => {
  // Construyo raw = 415 exacto.
  //   T=1000, FE=1.0, BM=0.6 →
  //   incorp = 1000, AGIE = 1000 * 0.975 * 0.6 = 585, raw = 415 ✓
  const r = run(1000, 1.0, 0.6)
  assert.equal(r.certificatesPhysical, 415)
  assert.equal(r.certificatesToSurrender, 415)
  // Si ceil tuviese un off-by-one, daría 416 — no debe pasar.
  assert.notEqual(r.certificatesToSurrender, 416)
})

// ─── Caso Noatum ─────────────────────────────────────────────────────────
//
// La ficha de diagnóstico (sesión previa) confirmó que los inputs estructurados
// del caso Noatum NO están en el repo — solo viven como prosa en README.md:689
// (outputs: 51.060,87 € defaults / 24.120,36 € reales). Sin inputs (CN, país,
// tonnes, FE real específico, BM, ruta de producción) no se puede reconstruir
// como test ejecutable defensible.
//
// Mantenemos el placeholder como skip + TODO operativo. Cuando los inputs
// estén disponibles, reactivar y documentar el delta vs el valor histórico
// (cambia por dos motivos: precio 74,76 → 75,36 y redondeo ceil por línea).
test.skip('Caso Noatum — defaults: 51.060,87 € (histórico) [TODO inputs no disponibles]', () => {
  // assert.equal(...)
})

test.skip('Caso Noatum — reales: 24.120,36 € (histórico) [TODO inputs no disponibles]', () => {
  // assert.equal(...)
})
