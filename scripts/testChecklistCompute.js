#!/usr/bin/env node
/**
 * Unit test: verifica la lógica computeChecklistState() del stepper
 * pre-entrega (Día 5 · Pieza 2).
 *
 * Ejecución:  node scripts/testChecklistCompute.js
 */

'use strict'

import {
  computeChecklistState,
  currentStepIndex,
  applyManualStepToggle,
  ADVISORY_STEPS,
  MONITORING_STEPS,
} from '../lib/cbamChecklist.js'

let failed = 0
function assert(cond, label) {
  if (!cond) { console.error(`✗ FAIL — ${label}`); failed++ }
  else       { console.log(`✓ PASS — ${label}`) }
}

// ============================================================
// Estructura de los pasos
// ============================================================
assert(ADVISORY_STEPS.length === 7, 'Advisory tiene 7 pasos')
assert(MONITORING_STEPS.length === 5, 'Monitoring tiene 5 pasos')
assert(ADVISORY_STEPS.filter(s => s.kind === 'manual').length === 3, 'Advisory: 3 manuales')
assert(ADVISORY_STEPS.filter(s => s.kind === 'auto').length === 4, 'Advisory: 4 automáticos')
assert(MONITORING_STEPS.filter(s => s.kind === 'manual').length === 4, 'Monitoring: 4 manuales')
assert(MONITORING_STEPS.filter(s => s.kind === 'auto').length === 1, 'Monitoring: 1 automático')

// ============================================================
// Advisory — estados automáticos por transición de status
// ============================================================
const draft = computeChecklistState('advisory', { status: 'draft', checklist: {} })
assert(draft.every(s => !s.completed), 'Advisory draft: ningún paso completo')

const reportReady = computeChecklistState('advisory', { status: 'report_ready', checklist: {} })
assert(reportReady.find(s => s.key === 'calculo_ejecutado').completed === true, 'report_ready: cálculo_ejecutado auto marcado')
assert(reportReady.find(s => s.key === 'solicitud_pago_enviada').completed === false, 'report_ready: solicitud_pago aún NO')
assert(reportReady.find(s => s.key === 'informe_revisado').completed === false, 'report_ready: informe_revisado (manual) sin marcar')

const pendingPayment = computeChecklistState('advisory', { status: 'pending_payment', checklist: {} })
assert(pendingPayment.find(s => s.key === 'solicitud_pago_enviada').completed === true, 'pending_payment: solicitud_pago auto marcada')
assert(pendingPayment.find(s => s.key === 'informe_liberado').completed === false, 'pending_payment: informe_liberado aún NO')

const delivered = computeChecklistState('advisory', { status: 'delivered', checklist: {} })
assert(delivered.find(s => s.key === 'informe_liberado').completed === true, 'delivered: informe_liberado auto')
assert(delivered.find(s => s.key === 'email_entrega_enviado').completed === true, 'delivered: email_entrega auto')
// Manuales siguen sin marcar aunque el status sea delivered
assert(delivered.find(s => s.key === 'datos_revisados').completed === false, 'delivered sin JSON: datos_revisados sigue NO')
assert(delivered.find(s => s.key === 'pago_confirmado').completed === false, 'delivered sin JSON: pago_confirmado sigue NO')

// ============================================================
// Advisory — manuales persistidos
// ============================================================
const withManual = computeChecklistState('advisory', {
  status: 'report_ready',
  checklist: {
    datos_revisados: { completed: true, at: '2026-04-19T10:00:00Z', by: 'carlos@lexaduana.es' },
    informe_revisado: { completed: true, at: '2026-04-19T12:00:00Z', by: 'carlos@lexaduana.es' },
  },
})
const datos = withManual.find(s => s.key === 'datos_revisados')
assert(datos.completed === true, 'manual: datos_revisados marcado')
assert(datos.at === '2026-04-19T10:00:00Z', 'manual: timestamp preservado')
assert(datos.by === 'carlos@lexaduana.es', 'manual: by preservado')

// ============================================================
// Monitoring — status transitions
// ============================================================
const subSubmitted = computeChecklistState('monitoring', { status: 'submitted', checklist: {} })
assert(subSubmitted.every(s => !s.completed), 'monitoring submitted: nada')

const subActive = computeChecklistState('monitoring', { status: 'active', checklist: {} })
assert(subActive.find(s => s.key === 'suscripcion_activada').completed === true, 'active: suscripción activada auto')
assert(subActive.find(s => s.key === 'empresa_revisada').completed === false, 'active sin JSON: empresa manual NO')

const subPaused = computeChecklistState('monitoring', { status: 'paused', checklist: {} })
assert(subPaused.find(s => s.key === 'suscripcion_activada').completed === true, 'paused: sigue mostrando activada hist.')

// ============================================================
// currentStepIndex
// ============================================================
assert(currentStepIndex(draft) === 0, 'draft: current step = 0 (datos_revisados)')
const allDone = ADVISORY_STEPS.map(s => ({ ...s, completed: true }))
assert(currentStepIndex(allDone) === -1, 'todos completos: -1')

// ============================================================
// applyManualStepToggle
// ============================================================
const patched = applyManualStepToggle({
  kind: 'advisory',
  currentChecklist: {},
  stepKey: 'datos_revisados',
  completed: true,
  byEmail: 'carlos@lexaduana.es',
})
assert(patched.datos_revisados.completed === true, 'toggle: marca manual')
assert(!!patched.datos_revisados.at, 'toggle: timestamp generado')
assert(patched.datos_revisados.by === 'carlos@lexaduana.es', 'toggle: by grabado')

const unpatched = applyManualStepToggle({
  kind: 'advisory',
  currentChecklist: patched,
  stepKey: 'datos_revisados',
  completed: false,
})
assert(unpatched.datos_revisados === undefined, 'toggle off: borra la entrada')

// Rechazo de paso automático
let threw = false
try {
  applyManualStepToggle({
    kind: 'advisory',
    currentChecklist: {},
    stepKey: 'calculo_ejecutado',
    completed: true,
  })
} catch (err) { threw = true }
assert(threw, 'toggle de paso auto lanza error')

// Rechazo de paso inexistente
threw = false
try {
  applyManualStepToggle({ kind: 'advisory', currentChecklist: {}, stepKey: 'no_existe', completed: true })
} catch (_) { threw = true }
assert(threw, 'toggle de step desconocido lanza error')

// ============================================================
// Resumen
// ============================================================
console.log('')
if (failed > 0) {
  console.error(`\n❌ ${failed} test(s) fallaron`)
  process.exit(1)
} else {
  console.log('\n✅ Todos los tests del Checklist pasaron')
}
