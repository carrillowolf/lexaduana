'use client'

import { useState } from 'react'
import { checkCBAM } from '@/lib/cbamData'
import { trackEvent } from '@/lib/analytics'
import { useTranslation } from '@/lib/i18n'
import { cbamDict } from '@/lib/i18n/cbam'

/**
 * Verificador CBAM interactivo
 * Extraído de app/cbam/page.js para permitir que la página sea un server component.
 * Recibe el threshold como prop (fetched server-side).
 */
export default function CBAMVerifier({ threshold }) {
  const [hsCode, setHsCode] = useState('')
  const [result, setResult] = useState(null)
  const [checking, setChecking] = useState(false)
  const t = useTranslation(cbamDict)

  const handleCheck = () => {
    if (!hsCode.trim()) return

    setChecking(true)

    // Simular pequeña espera para UX
    setTimeout(() => {
      const cbamResult = checkCBAM(hsCode)
      setResult(cbamResult)
      trackEvent('cbam_check', { cn_code: hsCode, affected: cbamResult?.affected })
      setChecking(false)
    }, 300)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCheck()
    }
  }

  const massThreshold = threshold?.massThreshold || threshold?.mass_threshold || 50

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-8 py-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {t('verifier.title')}
        </h2>
        <p className="text-gray-600">
          {t('verifier.subtitle')}
        </p>
      </div>

      <div className="p-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              value={hsCode}
              onChange={(e) => setHsCode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('verifier.placeholder')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-lg font-mono placeholder:text-gray-500"
            />
          </div>
          <button
            onClick={handleCheck}
            disabled={checking || !hsCode.trim()}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {checking ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                {t('verifier.checking')}
              </>
            ) : (
              <>
                {t('verifier.check')}
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className={`p-6 rounded-xl ${
            result.affected
              ? 'bg-red-50 border-2 border-red-200'
              : 'bg-green-50 border-2 border-green-200'
          }`}>
            {result.affected ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{result.sector.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-red-700">
                      {t('verifier.affected')}
                    </h3>
                    <p className="text-red-600">
                      {t('verifier.affectedDesc')}
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-white/80 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">{t('verifier.sector')}</p>
                    <p className="font-bold text-gray-800">{result.sector.name}</p>
                  </div>
                  <div className="bg-white/80 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">{t('verifier.ghgGases')}</p>
                    <p className="font-bold text-gray-800">{result.gas}</p>
                  </div>
                  <div className="bg-white/80 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">{t('verifier.emissionType')}</p>
                    <p className="font-bold text-gray-800">{result.sector.emissions}</p>
                  </div>
                  <div className="bg-white/80 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">{t('verifier.description')}</p>
                    <p className="font-bold text-gray-800">{result.description}</p>
                  </div>
                </div>

                {/* De minimis indicator */}
                <div className={`mt-4 p-4 rounded-lg ${
                  result.deMinimisApplies
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-purple-50 border border-purple-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{result.deMinimisApplies ? '📦' : '⚡'}</span>
                    <div>
                      <p className={`font-bold ${result.deMinimisApplies ? 'text-blue-800' : 'text-purple-800'}`}>
                        {result.deMinimisApplies
                          ? t('verifier.deMinimisApplies')
                          : t('verifier.deMinimisNotApplies')
                        }
                      </p>
                      <p className={`text-sm ${result.deMinimisApplies ? 'text-blue-600' : 'text-purple-600'}`}>
                        {result.deMinimisApplies
                          ? t('verifier.deMinimisAppliesDesc').replace('{threshold}', massThreshold)
                          : t('verifier.deMinimisNotAppliesDesc')
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-bold text-amber-800 mb-2">{t('verifier.obligations')}</h4>
                  <ul className="text-amber-700 text-sm space-y-1">
                    <li>• <strong>{t('verifier.obligation1')}</strong> {t('verifier.obligation1Desc')}</li>
                    <li>• <strong>{t('verifier.obligation2')}</strong> {t('verifier.obligation2Desc')}</li>
                    <li>• {t('verifier.obligation3')}</li>
                    <li>• {t('verifier.obligation4')}</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-3xl">✅</span>
                <div>
                  <h3 className="text-xl font-bold text-green-700">
                    {t('verifier.notAffected')}
                  </h3>
                  <p className="text-green-600">
                    {t('verifier.notAffectedDesc')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
