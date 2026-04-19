/**
 * CBAM Admin Checklist — Día 5, Pieza 2
 *
 * Define los pasos del stepper pre-entrega para Advisory (7 pasos) y
 * Monitorización (5 pasos), y computa el estado combinando:
 *   - Pasos automáticos: derivados del `status` de la solicitud.
 *   - Pasos manuales: guardados en `admin_checklist` (JSONB) de la tabla.
 *
 * Solo los pasos manuales se persisten. Los automáticos se calculan en vivo.
 */

// ==========================================================================
// ADVISORY — 7 pasos
// ==========================================================================
// Orden del pipeline operativo de Carlos:
//   1. Datos del caso revisados               (manual)
//   2. Cálculo ejecutado                      (auto ← status ≥ report_ready)
//   3. Informe PDF generado y revisado        (manual)
//   4. Solicitud de pago enviada              (auto ← status = pending_payment o posterior)
//   5. Pago confirmado                        (manual)
//   6. Informe liberado al cliente            (auto ← status ≥ paid y deliveredAt no nulo, o status = delivered)
//   7. Email de entrega enviado               (auto ← status = delivered)
export const ADVISORY_STEPS = [
  {
    key: 'datos_revisados',
    label: 'Datos del caso revisados',
    description: 'Empresa, contacto, productos y documentos del cliente revisados.',
    kind: 'manual',
  },
  {
    key: 'calculo_ejecutado',
    label: 'Cálculo ejecutado',
    description: 'Motor CBAM ejecutado: emisiones y coste por línea calculados.',
    kind: 'auto',
    autoStatuses: ['report_ready', 'pending_payment', 'paid', 'delivered'],
  },
  {
    key: 'informe_revisado',
    label: 'Informe PDF generado y revisado',
    description: 'PDF descargado, revisado y validado por el admin.',
    kind: 'manual',
  },
  {
    key: 'solicitud_pago_enviada',
    label: 'Solicitud de pago enviada',
    description: 'Email profesional de solicitud de pago enviado al cliente.',
    kind: 'auto',
    autoStatuses: ['pending_payment', 'paid', 'delivered'],
  },
  {
    key: 'pago_confirmado',
    label: 'Pago confirmado',
    description: 'Transferencia verificada en banco. Marcar al ver ingreso.',
    kind: 'manual',
  },
  {
    key: 'informe_liberado',
    label: 'Informe liberado al cliente',
    description: 'Cliente tiene acceso al PDF en su panel "Mis solicitudes".',
    kind: 'auto',
    autoStatuses: ['delivered'],
  },
  {
    key: 'email_entrega_enviado',
    label: 'Email de entrega enviado',
    description: 'Notificación automática al cliente con link de descarga.',
    kind: 'auto',
    autoStatuses: ['delivered'],
  },
]

// ==========================================================================
// MONITORING — 5 pasos
// ==========================================================================
//   1. Datos de empresa revisados       (manual)
//   2. Autorización DUAs verificada     (manual)
//   3. Suscripción activada             (auto ← status = active)
//   4. Informe inicial entregado        (manual)
//   5. Primer email mensual programado  (manual — automatizable en el futuro)
export const MONITORING_STEPS = [
  {
    key: 'empresa_revisada',
    label: 'Datos de empresa revisados',
    description: 'Razón social, CIF y contacto verificados contra el formulario.',
    kind: 'manual',
  },
  {
    key: 'dua_verificada',
    label: 'Autorización DUAs verificada',
    description: 'Consentimiento DUAs firmado y versión registrada.',
    kind: 'manual',
  },
  {
    key: 'suscripcion_activada',
    label: 'Suscripción activada',
    description: 'Estado de la suscripción en `active` tras confirmar cobro.',
    kind: 'auto',
    autoStatuses: ['active', 'paused'], // paused mantiene el paso completo histórico
  },
  {
    key: 'informe_inicial_entregado',
    label: 'Informe inicial entregado',
    description: 'Primer informe mensual enviado al cliente.',
    kind: 'manual',
  },
  {
    key: 'email_mensual_programado',
    label: 'Primer email mensual programado',
    description:
      'Programado el envío del email mensual recurrente (manual hasta automatización).',
    kind: 'manual',
  },
]

export const CHECKLIST_CONFIG = {
  advisory: ADVISORY_STEPS,
  monitoring: MONITORING_STEPS,
}

// ==========================================================================
// COMPUTE — combina pasos auto (derivados) + manuales (JSON)
// ==========================================================================

/**
 * Computa el estado de cada paso combinando auto + manual.
 *
 * @param {'advisory'|'monitoring'} kind
 * @param {Object} opts
 * @param {string}  opts.status       Estado actual de la solicitud/suscripción.
 * @param {Object}  [opts.checklist]  Contenido de admin_checklist (JSONB).
 * @returns {Array<{
 *   key: string,
 *   label: string,
 *   description: string,
 *   kind: 'auto'|'manual',
 *   completed: boolean,
 *   at: string|null,
 *   by: string|null,
 * }>}
 */
export function computeChecklistState(kind, { status, checklist = {} } = {}) {
  const steps = CHECKLIST_CONFIG[kind]
  if (!steps) throw new Error(`Checklist kind desconocido: ${kind}`)

  return steps.map(step => {
    if (step.kind === 'auto') {
      const completed = step.autoStatuses.includes(status)
      return {
        key: step.key,
        label: step.label,
        description: step.description,
        kind: 'auto',
        completed,
        at: null,
        by: null,
      }
    }
    // Manual
    const entry = checklist?.[step.key] || null
    return {
      key: step.key,
      label: step.label,
      description: step.description,
      kind: 'manual',
      completed: !!entry?.completed,
      at: entry?.at || null,
      by: entry?.by || null,
    }
  })
}

/**
 * Deriva el "current step" = primer paso no completado (para resaltar).
 * Devuelve el índice, o -1 si todos están completos.
 */
export function currentStepIndex(computedSteps) {
  return computedSteps.findIndex(s => !s.completed)
}

/**
 * Valida y prepara el patch JSONB a guardar cuando el admin marca/desmarca
 * un paso manual. Rechaza pasos automáticos.
 *
 * @returns {Object} nuevo JSONB admin_checklist
 */
export function applyManualStepToggle({
  kind,
  currentChecklist = {},
  stepKey,
  completed,
  byEmail,
}) {
  const steps = CHECKLIST_CONFIG[kind]
  if (!steps) throw new Error(`Checklist kind desconocido: ${kind}`)

  const step = steps.find(s => s.key === stepKey)
  if (!step) throw new Error(`Paso desconocido: ${stepKey}`)
  if (step.kind !== 'manual') {
    throw new Error(`El paso "${stepKey}" es automático y no se puede marcar manualmente`)
  }

  const next = { ...currentChecklist }
  if (completed) {
    next[stepKey] = {
      completed: true,
      at: new Date().toISOString(),
      by: byEmail || null,
    }
  } else {
    delete next[stepKey]
  }
  return next
}
