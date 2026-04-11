'use client'

import Link from 'next/link'
import { checkCBAM } from '@/lib/cbamData'
import { useTranslation } from '@/lib/i18n'
import { sharedComponentsDict } from '@/lib/i18n/shared-components'

/**
 * Badge pequeño para mostrar junto al código HS
 */
export function CBAMBadge({ hsCode }) {
  const result = checkCBAM(hsCode)
  const t = useTranslation(sharedComponentsDict)

  if (!result?.affected) return null
  
  return (
    <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full ml-2">
      <span className="mr-1">🌍</span>
      {t('cbam.badge')}
    </span>
  )
}

/**
 * Alerta completa para mostrar en resultados de cálculo
 */
export function CBAMAlert({ hsCode, className = '' }) {
  const result = checkCBAM(hsCode)
  const t = useTranslation(sharedComponentsDict)

  if (!result?.affected) return null
  
  return (
    <div className={`bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-5 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">{result.sector.icon}</span>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-amber-800">
              {'🌍 ' + t('cbam.affected')}
            </h3>
            <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-medium rounded-full">
              {result.sector.name}
            </span>
          </div>
          
          <p className="text-amber-700 text-sm mb-3">
            Este código está sujeto al <strong>Mecanismo de Ajuste en Frontera por Carbono</strong> de la UE.
            {result.sector.emissions === 'directas + indirectas' 
              ? ' Debes declarar emisiones directas e indirectas.'
              : ' Solo se declaran emisiones directas.'}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center px-2 py-1 bg-white/80 text-amber-700 text-xs rounded-lg">
              <strong className="mr-1">Gases:</strong> {result.gas}
            </span>
            <span className="inline-flex items-center px-2 py-1 bg-white/80 text-amber-700 text-xs rounded-lg">
              <strong className="mr-1">Emisiones:</strong> {result.sector.emissions}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href="/cbam"
              className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('cbam.viewObligations')}
            </Link>
            <a
              href="https://cbam.ec.europa.eu/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-amber-700 text-sm font-medium rounded-lg border border-amber-300 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {t('cbam.euRegistry')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Alerta compacta para listas y tablas
 */
export function CBAMAlertCompact({ hsCode }) {
  const result = checkCBAM(hsCode)
  const t = useTranslation(sharedComponentsDict)

  if (!result?.affected) return null
  
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm">
      <span>{result.sector.icon}</span>
      <span className="text-amber-700">
        <strong>CBAM:</strong> {result.sector.name}
      </span>
      <Link href="/cbam" className="text-amber-600 hover:text-amber-800 underline ml-auto">
        {t('cbam.learnMore')}
      </Link>
    </div>
  )
}

/**
 * Indicador para la tabla de resultados bulk
 */
export function CBAMIndicator({ hsCode }) {
  const result = checkCBAM(hsCode)
  
  if (!result?.affected) return null
  
  return (
    <span 
      title={`CBAM: ${result.sector.name} - ${result.description}`}
      className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-600 rounded-full cursor-help"
    >
      🌍
    </span>
  )
}

/**
 * Banner informativo para páginas
 */
export function CBAMInfoBanner() {
  return (
    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-4 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌍</span>
          <div>
            <h4 className="font-bold">CBAM - Mecanismo de Ajuste en Frontera por Carbono</h4>
            <p className="text-emerald-100 text-sm">
              Obligatorio desde enero 2026. Verifica si tus importaciones están afectadas.
            </p>
          </div>
        </div>
        <Link
          href="/cbam"
          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          Saber más →
        </Link>
      </div>
    </div>
  )
}

export default CBAMAlert
