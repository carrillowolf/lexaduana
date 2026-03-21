'use client'

import { useState } from 'react'
import { checkCBAM } from '@/lib/cbamData'
import { trackEvent } from '@/lib/analytics'

/**
 * Verificador CBAM interactivo
 * Extraído de app/cbam/page.js para permitir que la página sea un server component.
 * Recibe el threshold como prop (fetched server-side).
 */
export default function CBAMVerifier({ threshold }) {
  const [hsCode, setHsCode] = useState('')
  const [result, setResult] = useState(null)
  const [checking, setChecking] = useState(false)

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
          Verificador CBAM
        </h2>
        <p className="text-gray-600">
          Comprueba si tu codigo arancelario esta afectado por el CBAM
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
              placeholder="Introduce codigo HS/CN (ej: 7601, 2523, 72101100)"
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
                Verificando...
              </>
            ) : (
              <>
                Verificar
              </>
            )}
          </button>
        </div>

        {/* Resultado */}
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
                      Producto AFECTADO por CBAM
                    </h3>
                    <p className="text-red-600">
                      Este codigo esta sujeto al Mecanismo de Ajuste en Frontera por Carbono
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-white/80 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Sector</p>
                    <p className="font-bold text-gray-800">{result.sector.name}</p>
                  </div>
                  <div className="bg-white/80 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Gases de efecto invernadero</p>
                    <p className="font-bold text-gray-800">{result.gas}</p>
                  </div>
                  <div className="bg-white/80 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Tipo de emisiones</p>
                    <p className="font-bold text-gray-800">{result.sector.emissions}</p>
                  </div>
                  <div className="bg-white/80 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Descripcion</p>
                    <p className="font-bold text-gray-800">{result.description}</p>
                  </div>
                </div>

                {/* Indicador de minimis */}
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
                          ? `Exencion de minimis APLICABLE (< ${massThreshold}t/año)`
                          : 'Exencion de minimis NO APLICABLE'
                        }
                      </p>
                      <p className={`text-sm ${result.deMinimisApplies ? 'text-blue-600' : 'text-purple-600'}`}>
                        {result.deMinimisApplies
                          ? `Si importas menos de ${massThreshold} toneladas anuales de este sector, puedes estar exento (certificado Y137)`
                          : 'La electricidad e hidrogeno no tienen umbral de minimis - siempre aplican obligaciones CBAM'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-bold text-amber-800 mb-2">Obligaciones</h4>
                  <ul className="text-amber-700 text-sm space-y-1">
                    <li>• <strong>Hasta 31/12/2025:</strong> Presentar informes trimestrales (sin pago)</li>
                    <li>• <strong>Desde 01/01/2026:</strong> Comprar certificados CBAM segun emisiones</li>
                    <li>• Solicitar datos de emisiones al fabricante/exportador</li>
                    <li>• Registrarse como declarante CBAM autorizado</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-3xl">✅</span>
                <div>
                  <h3 className="text-xl font-bold text-green-700">
                    Producto NO afectado por CBAM
                  </h3>
                  <p className="text-green-600">
                    Este codigo arancelario no esta incluido en el ambito del CBAM
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
