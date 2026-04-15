'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { documentRequirementsDict } from '@/lib/i18n/documentRequirements'

// Severity badge config
const SEVERITY_STYLES = {
  obligatorio: 'bg-red-100 text-red-800 border-red-200',
  condicional: 'bg-amber-100 text-amber-800 border-amber-200',
  si_aplica: 'bg-blue-100 text-blue-800 border-blue-200',
  informativo: 'bg-gray-100 text-gray-600 border-gray-200',
}

// Category accent colors (left border)
const CATEGORY_BORDERS = {
  restriccion: 'border-l-red-500',
  paraaduanero: 'border-l-amber-500',
  cbam: 'border-l-emerald-500',
  derechos: 'border-l-blue-500',
  info: 'border-l-gray-400',
  otro: 'border-l-gray-400',
}

// Known negative declaration certs (shown with lighter styling)
const NEGATIVE_CERTS = new Set([
  'Y900', 'Y160', 'Y169', 'Y792', 'Y793', 'Y036', 'Y085',
  'Y058', 'Y170', 'Y171', 'Y174', 'Y175', 'Y176', 'Y177',
  'Y072', 'Y073', 'Y076', 'Y077', 'Y078', 'Y079', 'Y151',
  'Y054', 'Y121', 'Y123', 'Y155',
  'Y786', 'Y787', 'Y789', 'Y790', 'Y791',
  'Y795', 'Y796', 'Y797', 'Y798', 'Y799'
])

// Unit translations for threshold exemptions
const UNIT_LABELS = {
  KGM: 'kg',
  TNE: 't',
  LTR: 'l',
  HLT: 'hl',
  MTR: 'm',
  MTK: 'm\u00B2',
  MTQ: 'm\u00B3',
}

export default function DocumentRequirements({ requirements }) {
  const t = useTranslation(documentRequirementsDict)

  if (!requirements || requirements.length === 0) return null

  return (
    <div className="space-y-3 mt-6">
      {/* Section header */}
      <h4 className="font-bold text-gray-900 flex items-center space-x-2">
        <svg className="w-5 h-5 text-[#0A3D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>{t('section.title')}</span>
        <span className="text-xs font-normal text-gray-500">({requirements.length})</span>
      </h4>

      <p className="text-xs text-gray-500 -mt-1">{t('section.subtitle')}</p>

      {/* Requirement cards */}
      {requirements.map((req, index) => (
        <RequirementCard key={`${req.measureType}-${req.originCode}-${index}`} req={req} t={t} />
      ))}

      {/* Box 44 note */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
        <p className="text-xs text-gray-700">
          <span className="font-semibold">{'📋 '}</span>
          {t('section.box44Note')}
        </p>
      </div>
    </div>
  )
}

function RequirementCard({ req, t }) {
  const [expanded, setExpanded] = useState(false)
  const borderClass = CATEGORY_BORDERS[req.category] || CATEGORY_BORDERS.otro
  const severityClass = SEVERITY_STYLES[req.severity] || SEVERITY_STYLES.informativo

  // Count total certificate options across all condition groups
  const totalOptions = req.conditionGroups.reduce((sum, g) => sum + g.options.length, 0)
  const hasNotes = req.explanatoryNotes && req.explanatoryNotes.length > 0

  return (
    <div className={`rounded-xl border-l-4 ${borderClass} bg-white border border-gray-200 overflow-hidden`}>
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <span className="text-xl flex-shrink-0">{req.measureIcon}</span>
          <div className="min-w-0">
            <h5 className="font-bold text-gray-900 text-sm truncate">{req.measureName}</h5>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-xs text-gray-500">{t(`category.${req.category}`)}</span>
              {totalOptions > 0 && (
                <span className="text-xs text-gray-400">
                  {' \u00B7 '}{totalOptions} {totalOptions === 1 ? 'certificado' : 'certificados'}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${severityClass}`}>
            {t(`severity.${req.severity}`)}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          {/* Condition groups */}
          {req.conditionGroups.map((group, gi) => (
            <ConditionGroup key={gi} group={group} t={t} showTypeLabel={req.conditionGroups.length > 1} />
          ))}

          {/* Explanatory notes */}
          {hasNotes && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-medium text-[#0A3D5C] hover:text-[#083049]">
                {t('notes.title')} ({req.explanatoryNotes.length})
              </summary>
              <div className="mt-2 space-y-2">
                {req.explanatoryNotes.map((note, ni) => (
                  <p key={ni} className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">
                    {note}
                  </p>
                ))}
              </div>
            </details>
          )}

          {/* Legal base */}
          {req.legalBase && (
            <p className="text-xs text-gray-400 mt-2">
              {t('notes.legalBase')}: {req.legalBase}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function ConditionGroup({ group, t, showTypeLabel }) {
  return (
    <div className="space-y-2">
      {showTypeLabel && (
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {t('conditions.option')} {group.conditionType}
        </p>
      )}

      {/* Certificate options */}
      {group.options.map((opt, i) => {
        const isNegative = NEGATIVE_CERTS.has(opt.certificateCode)
        return (
          <div
            key={i}
            className={`flex items-start space-x-3 rounded-lg p-2.5 ${
              isNegative ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
            }`}
          >
            {/* Option label */}
            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              isNegative ? 'bg-green-200 text-green-800' : 'bg-[#0A3D5C] text-white'
            }`}>
              {opt.label}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <code className="text-xs font-mono font-bold text-[#0A3D5C] bg-white px-1.5 py-0.5 rounded border border-gray-200">
                  {opt.certificateCode}
                </code>
                {isNegative && (
                  <span className="text-xs text-green-700 font-medium">
                    {t('conditions.negativeDeclaration')}
                  </span>
                )}
                {opt.action === 'denied' && (
                  <span className="text-xs text-red-600 font-medium">
                    {t('conditions.denied')}
                  </span>
                )}
              </div>
              {opt.certificateDescription && (
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {opt.certificateDescription}
                </p>
              )}
              {opt.duty && (
                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                  {t('conditions.dutyApplied').replace('{duty}', opt.duty)}
                </p>
              )}
            </div>
          </div>
        )
      })}

      {/* Threshold exemptions */}
      {group.exemptions && group.exemptions.length > 0 && group.exemptions.map((ex, i) => (
        <div key={`th-${i}`} className="flex items-center space-x-2 bg-blue-50 rounded-lg p-2.5 border border-blue-200">
          <span className="text-sm">{'📏'}</span>
          <p className="text-xs text-blue-800">
            {t('conditions.thresholdExempt')
              .replace('{amount}', ex.amount.toLocaleString())
              .replace('{unit}', UNIT_LABELS[ex.unit] || ex.unit)}
          </p>
        </div>
      ))}

      {/* Fallback */}
      {group.fallbackAction && (
        <div className={`rounded-lg p-2.5 text-xs ${
          group.fallbackAction === 'denied'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : group.fallbackAction === 'permitted'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-gray-50 text-gray-600 border border-gray-200'
        }`}>
          {group.fallbackAction === 'denied' && t('conditions.fallbackDenied')}
          {group.fallbackAction === 'permitted' && t('conditions.fallbackPermitted')}
          {group.fallbackAction === 'not_applicable' && t('conditions.fallbackNotApplicable')}
        </div>
      )}
    </div>
  )
}
