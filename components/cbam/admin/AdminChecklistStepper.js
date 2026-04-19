'use client'

/**
 * Stepper pre-entrega horizontal — Día 5, Pieza 2.
 *
 * Paleta sobria:
 *   - Completado: verde #059669, check blanco.
 *   - Actual (siguiente a marcar): azul marino #0A3D5C, numerado.
 *   - Futuro: gris neutro, numerado.
 *
 * Pasos automáticos: círculo numerado, no clickeables.
 * Pasos manuales completos/pendientes: clickeables → POST al endpoint.
 *
 * Responsive: permite scroll horizontal en pantallas estrechas. Refactor
 * a vertical colapsado queda para iteración futura.
 */

import { useState } from 'react'
import { computeChecklistState, currentStepIndex } from '@/lib/cbamChecklist'

function formatRelative(at) {
  if (!at) return null
  const d = new Date(at)
  if (isNaN(d.getTime())) return null
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

export default function AdminChecklistStepper({
  kind, // 'advisory' | 'monitoring'
  status,
  checklist,
  endpoint, // p.ej. `/api/admin/cbam/asesoria/${id}/checklist`
  onChange, // callback(nextChecklist) tras toggle OK
}) {
  const [savingKey, setSavingKey] = useState(null)
  const [error, setError] = useState(null)

  const steps = computeChecklistState(kind, { status, checklist })
  const currentIdx = currentStepIndex(steps)

  const handleToggle = async (step) => {
    if (step.kind !== 'manual') return
    setSavingKey(step.key)
    setError(null)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: step.key, completed: !step.completed }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error')
      onChange?.(json.data?.checklist || {})
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Checklist pre-entrega</h3>
        <span className="text-xs text-gray-500">
          {steps.filter(s => s.completed).length} / {steps.length} completados
        </span>
      </div>

      {error && (
        <div className="mb-3 p-2 rounded bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="flex items-start min-w-max pt-1 pb-2">
          {steps.map((step, idx) => {
            const isCurrent = idx === currentIdx
            const isLast = idx === steps.length - 1
            const saving = savingKey === step.key
            const clickable = step.kind === 'manual' && !saving

            let circleClasses =
              'flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold shrink-0 border-2 transition-colors'
            if (step.completed) {
              circleClasses += ' bg-[#059669] border-[#059669] text-white'
            } else if (isCurrent) {
              circleClasses += ' bg-[#0A3D5C] border-[#0A3D5C] text-white'
            } else {
              circleClasses += ' bg-white border-gray-300 text-gray-400'
            }
            if (clickable) circleClasses += ' cursor-pointer hover:scale-105'

            let lineClasses = 'h-0.5 flex-1 mx-1 mt-4 transition-colors'
            // Línea se "rellena" si el paso actual está completo
            if (step.completed) lineClasses += ' bg-[#059669]'
            else lineClasses += ' bg-gray-200'

            return (
              <div
                key={step.key}
                className="flex flex-col items-center text-center"
                style={{ minWidth: '110px' }}
              >
                <div className="flex items-center w-full">
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={clickable ? () => handleToggle(step) : undefined}
                    disabled={!clickable}
                    title={step.description + (step.kind === 'manual' ? ' — clic para marcar' : ' — automático')}
                    className={circleClasses}
                    data-testid={`checklist-step-${step.key}`}
                    aria-label={step.label}
                  >
                    {step.completed ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : saving ? (
                      <span className="animate-pulse">…</span>
                    ) : (
                      idx + 1
                    )}
                  </button>
                  {!isLast && <div className={lineClasses} />}
                </div>

                <div className="mt-2 px-1">
                  <div className={`text-[11px] font-medium leading-tight ${step.completed ? 'text-[#059669]' : isCurrent ? 'text-[#0A3D5C]' : 'text-gray-500'}`}>
                    {step.label}
                  </div>
                  {step.kind === 'auto' && !step.completed && (
                    <div className="text-[10px] text-gray-400 mt-0.5">(automático)</div>
                  )}
                  {step.at && (
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {formatRelative(step.at)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
