'use client'

import { FileCheck, FileText, Brain } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { origenDict } from '@/lib/i18n/origen'

const PROOF_ICONS = {
  formulario: FileCheck,
  leyenda_en_factura: FileText,
  sin_documento: Brain,
}

const PROOF_TYPE_KEYS = {
  eur1: 'origen.proof.eur1',
  eurmed: 'origen.proof.eurmed',
  declaracion_factura: 'origen.proof.declaracion_factura',
  declaracion_origen: 'origen.proof.declaracion_origen',
  atr: 'origen.proof.atr',
  conocimiento_importador: 'origen.proof.conocimiento_importador',
}

const STATIC_EXAMPLE_VALUES = {
  num_autorizacion: 'ES/0123/2024',
  periodo_desde: '01/01/2025',
  periodo_hasta: '31/12/2025',
  criterio_origen: 'P',
}

function renderTemplate(template, highlight) {
  const parts = template.split(/(\{[^}]+\})/)
  return parts.map((part, i) => {
    if (part.startsWith('{') && part.endsWith('}')) {
      const key = part.slice(1, -1)
      if (highlight) {
        return (
          <span
            key={i}
            className="font-mono px-1.5 py-px rounded-md bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap"
          >
            {key}
          </span>
        )
      }
    }
    return part
  })
}

function renderFilledExample(template, countryName, areaCode) {
  const replacements = {
    ...STATIC_EXAMPLE_VALUES,
    pais_origen: countryName,
    num_referencia: `${areaCode}REX0000000000XX`,
  }
  const parts = template.split(/(\{[^}]+\})/)
  return parts.map((part, i) => {
    if (part.startsWith('{') && part.endsWith('}')) {
      const key = part.slice(1, -1)
      const val = replacements[key] || part
      return (
        <span key={i} className="font-mono text-slate-700">
          {val}
        </span>
      )
    }
    return part
  })
}

export default function ProofCard({ proof, countryName, areaCode }) {
  const t = useTranslation(origenDict)
  const Icon = PROOF_ICONS[proof.proofFormat] || FileText
  const proofName = t(PROOF_TYPE_KEYS[proof.proofType] || `origen.proof.${proof.proofType}`)
  const casilla = proof.casilla44Codes?.join(', ')

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-[18px_20px] mb-3">
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className="text-[#0A3D5C]">
          <Icon className="w-5 h-5" />
        </span>
        <span className="text-[15px] font-semibold">{proofName}</span>
        {casilla && (
          <span className="ml-auto font-mono text-[13px] text-slate-500 tabular-nums">
            {t('origen.casilla44')} · {casilla}
          </span>
        )}
      </div>

      {proof.noteEs && (
        <p className="text-[13.5px] text-slate-500 m-0">
          {proof.noteEs}
        </p>
      )}

      {proof.thresholdEur && (
        <p className="text-[13.5px] text-slate-500 m-0 mt-1">
          {t('origen.umbral_texto').replace(
            '{threshold}',
            new Intl.NumberFormat('es-ES', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(proof.thresholdEur)
          )}
        </p>
      )}

      {proof.proofFormat === 'leyenda_en_factura' && proof.declarationTemplateEs && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-500 mb-1.5">
            {t('origen.texto_factura')}
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-[10px] px-3.5 py-2.5 text-[13.5px] leading-relaxed">
            {renderTemplate(proof.declarationTemplateEs, true)}
          </div>

          <p className="text-xs font-semibold text-slate-500 mt-3 mb-1.5">
            {t('origen.ejemplo')}
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-[10px] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-slate-500">
            {renderFilledExample(proof.declarationTemplateEs, countryName, areaCode)}
          </div>
        </div>
      )}
    </div>
  )
}
