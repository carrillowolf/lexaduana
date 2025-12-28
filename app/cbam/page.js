'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  checkCBAM, 
  CBAM_SECTORS, 
  CBAM_TIMELINE, 
  getNextDeadline,
  CBAM_THRESHOLD,
  getCBAMStats,
  CBAM_EXCLUDED_COUNTRIES,
  CBAM_CERTIFICATES,
  CBAM_CERTIFICATE_PRICING,
  CBAM_DEFAULT_VALUE_MARKUP,
  CBAM_DOWNSTREAM_EXTENSION,
  getDefaultValueMarkup
} from '@/lib/cbamData'
import CBAMCostSimulator from '@/components/CBAMCostSimulator'
import CBAMEmailTemplate from '@/components/CBAMEmailTemplate'

export default function CBAMPage() {
  const [hsCode, setHsCode] = useState('')
  const [result, setResult] = useState(null)
  const [checking, setChecking] = useState(false)
  const [nextDeadline, setNextDeadline] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    setNextDeadline(getNextDeadline())
    setStats(getCBAMStats())
  }, [])

  const handleCheck = () => {
    if (!hsCode.trim()) return
    
    setChecking(true)
    
    // Simular pequeña espera para UX
    setTimeout(() => {
      const cbamResult = checkCBAM(hsCode)
      setResult(cbamResult)
      setChecking(false)
    }, 300)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCheck()
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <img src="/logo.png" alt="LexAduana" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-[#0A3D5C]">CBAM</h1>
                <p className="text-xs text-gray-500">Mecanismo de Ajuste en Frontera</p>
              </div>
            </Link>

            <div className="flex items-center space-x-3">
              <Link
                href="/calculadora"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition"
              >
                Calculadora
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-[#0A3D5C] hover:bg-[#083049] text-white text-sm font-medium rounded-lg transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Hero + Alerta Deadline */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Hero */}
          <div className="lg:col-span-2 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
                  🇪🇺 Reglamento (UE) 2023/956
                </span>
                <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                  CBAM - Carbon Border<br />Adjustment Mechanism
                </h1>
                <p className="text-emerald-100 text-lg max-w-xl">
                  El Mecanismo de Ajuste en Frontera por Carbono de la UE. 
                  Verifica si tus importaciones están afectadas y conoce tus obligaciones.
                </p>
              </div>
              <div className="hidden lg:block text-8xl opacity-20">
                🌍
              </div>
            </div>
          </div>

          {/* Próximo Deadline */}
          {nextDeadline && (
            <div className={`rounded-2xl shadow-xl p-6 ${
              nextDeadline.isUrgent 
                ? 'bg-gradient-to-br from-red-500 to-orange-600 text-white' 
                : 'bg-white border border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⏰</span>
                <h3 className={`font-bold ${nextDeadline.isUrgent ? 'text-white' : 'text-gray-800'}`}>
                  Próximo Plazo
                </h3>
              </div>
              
              <div className={`text-4xl font-bold mb-2 ${nextDeadline.isUrgent ? 'text-white' : 'text-[#0A3D5C]'}`}>
                {nextDeadline.daysLeft} días
              </div>
              
              <p className={`font-medium mb-1 ${nextDeadline.isUrgent ? 'text-white/90' : 'text-gray-700'}`}>
                {nextDeadline.quarter}
              </p>
              
              <p className={`text-sm ${nextDeadline.isUrgent ? 'text-white/80' : 'text-gray-500'}`}>
                Fecha límite: {formatDate(nextDeadline.deadline)}
              </p>

              {nextDeadline.status === 'critical' && (
                <div className="mt-4 p-3 bg-white/20 rounded-lg">
                  <p className="text-sm font-medium">
                    🚨 ¡Comienza la obligación de comprar certificados!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* NUEVO: Banner Novedades Diciembre 2025 */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-bold animate-pulse">
                🆕 ACTUALIZACIÓN DIC 2025
              </span>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">
              Paquete Regulatorio CBAM - Diciembre 2025
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl mb-2">📈</div>
                <h3 className="font-bold mb-1">Precios Semanales</h3>
                <p className="text-sm text-white/80">
                  Desde 2027, precio de certificados basado en media semanal EU ETS
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl mb-2">⚠️</div>
                <h3 className="font-bold mb-1">Penalización +30%</h3>
                <p className="text-sm text-white/80">
                  Markup progresivo sobre valores por defecto: 10% → 20% → 30%
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl mb-2">🏭</div>
                <h3 className="font-bold mb-1">+180 Códigos CN</h3>
                <p className="text-sm text-white/80">
                  Extensión 2028 a productos downstream de acero y aluminio
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Verificador de Código */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              🔍 Verificador CBAM
            </h2>
            <p className="text-gray-600">
              Comprueba si tu código arancelario está afectado por el CBAM
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
                  placeholder="Introduce código HS/CN (ej: 7601, 2523, 72101100)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-lg font-mono"
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
                          ⚠️ Producto AFECTADO por CBAM
                        </h3>
                        <p className="text-red-600">
                          Este código está sujeto al Mecanismo de Ajuste en Frontera por Carbono
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
                        <p className="text-sm text-gray-500 mb-1">Descripción</p>
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
                              ? `Exención de minimis APLICABLE (< ${CBAM_THRESHOLD.massThreshold}t/año)`
                              : 'Exención de minimis NO APLICABLE'
                            }
                          </p>
                          <p className={`text-sm ${result.deMinimisApplies ? 'text-blue-600' : 'text-purple-600'}`}>
                            {result.deMinimisApplies 
                              ? 'Si importas menos de 50 toneladas anuales de este sector, puedes estar exento (certificado Y137)'
                              : 'La electricidad e hidrógeno no tienen umbral de minimis - siempre aplican obligaciones CBAM'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h4 className="font-bold text-amber-800 mb-2">📋 Obligaciones</h4>
                      <ul className="text-amber-700 text-sm space-y-1">
                        <li>• <strong>Hasta 31/12/2025:</strong> Presentar informes trimestrales (sin pago)</li>
                        <li>• <strong>Desde 01/01/2026:</strong> Comprar certificados CBAM según emisiones</li>
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
                        Este código arancelario no está incluido en el ámbito del CBAM
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>


        {/* Simulador de Coste */}
        <CBAMCostSimulator />

        {/* NUEVO: Precios de Certificados CBAM */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-8 py-6 border-b border-amber-200">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💰</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Precio de Certificados CBAM
                </h2>
                <p className="text-gray-600">
                  Metodología según Reglamento C(2025) 8560
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* 2026 - Trimestral */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-full">2026</span>
                  <span className="text-blue-800 font-bold">Precio TRIMESTRAL</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    <span className="text-gray-700">Media del trimestre anterior</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    <span className="text-gray-700"><strong>4 precios/año</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📢</span>
                    <span className="text-gray-700">Publicación: 1er día hábil del trimestre</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-sm text-blue-800">
                    ✅ <strong>Ventaja:</strong> Mayor previsibilidad para planificación de costes
                  </p>
                </div>
              </div>

              {/* 2027+ - Semanal */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-orange-600 text-white text-sm font-bold rounded-full">2027+</span>
                  <span className="text-orange-800 font-bold">Precio SEMANAL</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    <span className="text-gray-700">Media de la semana anterior</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    <span className="text-gray-700"><strong>~52 precios/año</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📢</span>
                    <span className="text-gray-700">Publicación: 1er día hábil de la semana</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                  <p className="text-sm text-orange-800">
                    ⚠️ <strong>Impacto:</strong> Mayor volatilidad, seguimiento más frecuente necesario
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h4 className="font-bold text-gray-800 mb-3">📐 Metodología de cálculo</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>Precio = Media ponderada por volumen subastado de precios de subasta EU ETS</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>Unidad: EUR por tonelada de CO2 equivalente (EUR/tCO2e)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>Precisión: Redondeado a 2 decimales</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>Fuentes: Plataformas de subasta EU ETS (EEX, ICE)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* NUEVO: Penalización Valores por Defecto */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 px-8 py-6 border-b border-red-200">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Penalización sobre Valores por Defecto
                </h2>
                <p className="text-gray-600">
                  Markup progresivo según Reglamento C(2025) 8552
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-800">
                <strong>💡 ¿Qué significa?</strong> Si declaras emisiones usando valores por defecto 
                (en lugar de emisiones reales verificadas del fabricante), se aplica un recargo 
                progresivo para incentivar la obtención de datos reales.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {CBAM_DEFAULT_VALUE_MARKUP.schedule.map((item) => (
                <div 
                  key={item.year}
                  className={`rounded-xl p-6 text-center border-2 ${
                    item.year === 2026 
                      ? 'bg-yellow-50 border-yellow-300' 
                      : item.year === 2027 
                        ? 'bg-orange-50 border-orange-300'
                        : 'bg-red-50 border-red-300'
                  }`}
                >
                  <div className={`text-4xl font-bold mb-2 ${
                    item.year === 2026 
                      ? 'text-yellow-600' 
                      : item.year === 2027 
                        ? 'text-orange-600'
                        : 'text-red-600'
                  }`}>
                    {item.label}
                  </div>
                  <div className="text-xl font-bold text-gray-800 mb-1">{item.year}</div>
                  <div className="text-sm text-gray-600">{item.description}</div>
                </div>
              ))}
            </div>

            {/* Ejemplo práctico */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <h4 className="font-bold text-gray-800 mb-4">📊 Ejemplo práctico: Acero crudo</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="px-4 py-2 text-left">Año</th>
                      <th className="px-4 py-2 text-left">Valor base</th>
                      <th className="px-4 py-2 text-left">Markup</th>
                      <th className="px-4 py-2 text-left">Valor ajustado</th>
                      <th className="px-4 py-2 text-left">Sobrecoste</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="px-4 py-3 font-medium">2026</td>
                      <td className="px-4 py-3 font-mono">1.080 tCO2/t</td>
                      <td className="px-4 py-3 text-yellow-600 font-bold">+10%</td>
                      <td className="px-4 py-3 font-mono font-bold">1.188 tCO2/t</td>
                      <td className="px-4 py-3 text-red-600">+0.108 tCO2/t</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">2027</td>
                      <td className="px-4 py-3 font-mono">1.080 tCO2/t</td>
                      <td className="px-4 py-3 text-orange-600 font-bold">+20%</td>
                      <td className="px-4 py-3 font-mono font-bold">1.296 tCO2/t</td>
                      <td className="px-4 py-3 text-red-600">+0.216 tCO2/t</td>
                    </tr>
                    <tr className="bg-red-50">
                      <td className="px-4 py-3 font-medium">2028+</td>
                      <td className="px-4 py-3 font-mono">1.080 tCO2/t</td>
                      <td className="px-4 py-3 text-red-600 font-bold">+30%</td>
                      <td className="px-4 py-3 font-mono font-bold">1.404 tCO2/t</td>
                      <td className="px-4 py-3 text-red-600 font-bold">+0.324 tCO2/t</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Excepción */}
            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h4 className="font-bold text-green-800 mb-1">Excepción: Productos downstream complejos</h4>
                  <p className="text-green-700 text-sm">
                    Los productos derivados que combinan múltiples sectores o precursores pueden usar 
                    valores por defecto <strong>SIN markup</strong> debido a la dificultad técnica 
                    de rastrear emisiones en cadenas de suministro complejas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NUEVO: Extensión Productos Downstream 2028 */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-8 py-6 border-b border-indigo-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏭</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Extensión a Productos Downstream (2028)
                  </h2>
                  <p className="text-gray-600">
                    Propuesta COM(2025) 989 - Aplicación prevista 01/01/2028
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-bold rounded-full">
                PROPUESTA
              </span>
            </div>
          </div>

          <div className="p-8">
            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white text-center">
                <div className="text-4xl font-bold mb-1">~{CBAM_DOWNSTREAM_EXTENSION.stats.newCNCodes}</div>
                <div className="text-indigo-100">Nuevos códigos CN</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white text-center">
                <div className="text-4xl font-bold mb-1">~{(CBAM_DOWNSTREAM_EXTENSION.stats.newImporters / 1000).toFixed(1)}k</div>
                <div className="text-blue-100">Nuevos importadores</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white text-center">
                <div className="text-4xl font-bold mb-1">~{(CBAM_DOWNSTREAM_EXTENSION.stats.newSMEs / 1000).toFixed(1)}k</div>
                <div className="text-purple-100">PYMEs afectadas</div>
              </div>
            </div>

            {/* Sectores afectados */}
            <h3 className="text-lg font-bold text-gray-800 mb-4">Sectores incluidos en la extensión</h3>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {CBAM_DOWNSTREAM_EXTENSION.sectors.map((sector) => (
                <div key={sector.id} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{sector.icon}</span>
                    <h4 className="font-bold text-gray-800">{sector.name}</h4>
                  </div>
                  <ul className="space-y-1">
                    {sector.examples.map((example, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5">•</span>
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* No incluidos */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="font-bold text-gray-700 mb-2">❌ NO incluidos en esta extensión:</h4>
              <div className="flex flex-wrap gap-2">
                {CBAM_DOWNSTREAM_EXTENSION.notIncluded.map((item, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm text-gray-500">
                La extensión a productos derivados de cemento, fertilizantes e hidrógeno se evaluará en futuras revisiones.
              </p>
            </div>

            {/* Criterios de selección */}
            <div className="mt-6 bg-indigo-50 rounded-xl p-4 border border-indigo-200">
              <h4 className="font-bold text-indigo-800 mb-2">📋 Criterios de selección de productos</h4>
              <div className="grid sm:grid-cols-3 gap-3">
                {CBAM_DOWNSTREAM_EXTENSION.selectionCriteria.map((criterion, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-indigo-700">
                    <span className="text-lg">{idx + 1}️⃣</span>
                    <span className="text-sm">{criterion}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sectores Afectados */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📦 Sectores Afectados
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(CBAM_SECTORS).map((sector) => (
              <div 
                key={sector.id}
                className={`bg-gradient-to-br ${sector.color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{sector.icon}</span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                      {sector.emissions}
                    </span>
                    {/* Badge de minimis */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sector.deMinimisApplies 
                        ? 'bg-blue-400/30 text-blue-100' 
                        : 'bg-red-400/30 text-red-100'
                    }`}>
                      {sector.deMinimisApplies ? '📦 De minimis' : '⚡ Sin umbral'}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{sector.name}</h3>
                <p className="text-white/80 text-sm mb-3">{sector.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Gases:</span>
                  <span className="px-2 py-0.5 bg-white/20 rounded">{sector.gases.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Países Excluidos */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-green-100 rounded-xl">
              <span className="text-3xl">🌍</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-900 mb-2">
                Países y Territorios Excluidos del CBAM
              </h3>
              <p className="text-green-700">
                Las importaciones desde estos orígenes NO están sujetas al CBAM porque participan 
                en el EU ETS o tienen acuerdos equivalentes (Anexo III del Reglamento).
              </p>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CBAM_EXCLUDED_COUNTRIES.map((country) => (
              <div key={country.code} className="bg-white/80 p-4 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-green-800">{country.code}</span>
                  <span className="text-green-700 font-medium">{country.name}</span>
                </div>
                <p className="text-sm text-green-600">{country.reason}</p>
              </div>
            ))}
          </div>
          
          <p className="mt-4 text-sm text-green-600 bg-green-100 p-3 rounded-lg">
            💡 <strong>Nota:</strong> Si importas desde estos países, puedes declarar la exención 
            con el certificado <strong>Y134</strong> (territorios especiales) o simplemente no aplican 
            las obligaciones CBAM (países ETS).
          </p>
        </div>

        {/* Certificados Necesarios */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              📜 Certificados CBAM para Declaración Aduanera
            </h2>
            <p className="text-gray-600">
              Códigos a declarar en el DUA desde el 01/01/2026 (medida tipo 775)
            </p>
          </div>

          <div className="p-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Descripción</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Aplicación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.values(CBAM_CERTIFICATES).map((cert) => (
                    <tr key={cert.code} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          {cert.code}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        {cert.description}
                      </td>
                      <td className="px-4 py-4">
                        {cert.required ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            Obligatorio
                          </span>
                        ) : cert.appliesTo ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            Solo {cert.appliesTo.join(', ')}
                          </span>
                        ) : cert.notAppliesTo ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            Excepto {cert.notAppliesTo.join(', ')}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            Exención
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">
                <strong>⚠️ Importante:</strong> Sin uno de estos certificados válidos, la importación 
                será rechazada (condición Y060 - &quot;None of the conditions above apply&quot;).
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              📅 Calendario CBAM
            </h2>
            <p className="text-gray-600">
              Fechas clave del período transitorio y fase definitiva - Actualizado Dic 2025
            </p>
          </div>

          <div className="p-8">
            <div className="relative">
              {/* Línea vertical */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {CBAM_TIMELINE.map((event, index) => (
                <div key={index} className="relative pl-12 pb-8 last:pb-0">
                  {/* Punto */}
                  <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    event.status === 'completed' 
                      ? 'bg-green-500' 
                      : event.status === 'critical'
                        ? 'bg-red-500 animate-pulse'
                        : event.status === 'upcoming'
                          ? 'bg-amber-500'
                          : 'bg-gray-300'
                  }`}>
                    {event.status === 'completed' ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : event.status === 'critical' ? (
                      <span className="text-white text-sm">🚨</span>
                    ) : (
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className={`p-4 rounded-lg ${
                    event.status === 'critical' 
                      ? 'bg-red-50 border-2 border-red-200' 
                      : event.status === 'upcoming'
                        ? 'bg-amber-50 border border-amber-200'
                        : event.isNew
                          ? 'bg-purple-50 border-2 border-purple-300'
                          : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold ${
                          event.status === 'critical' ? 'text-red-700' : 'text-gray-800'
                        }`}>
                          {event.title}
                        </h3>
                        {event.isNew && (
                          <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full">
                            NUEVO
                          </span>
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        event.status === 'completed' 
                          ? 'text-green-600' 
                          : event.status === 'critical'
                            ? 'text-red-600'
                            : 'text-gray-500'
                      }`}>
                        {formatDate(event.date)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Umbral de minimis */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <span className="text-3xl">⚖️</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">
                Umbral de Minimis - Exención por volumen
              </h3>
              <p className="text-blue-700 mb-4">
                Según el Reglamento (UE) 2025/2083, los importadores con un volumen anual inferior a{' '}
                <strong>{CBAM_THRESHOLD.massThreshold} toneladas</strong> de mercancías CBAM 
                están exentos de las obligaciones del mecanismo.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                  Umbral: {CBAM_THRESHOLD.massThreshold}t/año
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                  Certificado: Y137
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                  ⚡ No aplica a: Electricidad, Hidrógeno
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Plantilla Email Proveedor */}
        <CBAMEmailTemplate />

        {/* Recursos */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📚 Recursos Oficiales</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_es" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Portal CBAM de la Comisión Europea
                </a>
              </li>
              <li>
                <a 
                  href="https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32023R0956" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Reglamento (UE) 2023/956 - EUR-Lex
                </a>
              </li>
              <li>
                <a 
                  href="https://cbam.ec.europa.eu/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Registro Transitorio CBAM
                </a>
              </li>
              <li>
                <a 
                  href="https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-legislation-and-guidance_en" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Legislación CBAM - Paquete Dic 2025
                </a>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🛠️ Herramientas LexAduana</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/calculadora"
                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800"
                >
                  <span>🧮</span>
                  Calculadora de Aranceles
                </Link>
              </li>
              <li>
                <Link 
                  href="/clasificador"
                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800"
                >
                  <span>🤖</span>
                  Clasificador IA de Productos
                </Link>
              </li>
              <li>
                <Link 
                  href="/comparador"
                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800"
                >
                  <span>📊</span>
                  Comparador Multi-Origen
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Final */}
        <div className="bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] rounded-2xl shadow-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">
            ¿Necesitas calcular aranceles de productos CBAM?
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Usa nuestra calculadora gratuita para obtener aranceles, IVA y alertas 
            automáticas de productos afectados por CBAM.
          </p>
          <Link
            href="/calculadora"
            className="inline-flex items-center px-8 py-3 bg-white text-[#0A3D5C] font-bold rounded-xl hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Ir a la Calculadora
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} LexAduana. Información basada en la legislación vigente de la UE.
          </p>
          <p className="text-xs mt-2">
            Esta herramienta es informativa. Consulte siempre la legislación oficial y asesores especializados.
          </p>
          <p className="text-xs mt-1 text-gray-500">
            Última actualización: Diciembre 2025 (Paquete regulatorio C(2025) 8552, C(2025) 8560, COM(2025) 989)
          </p>
        </div>
      </footer>
    </div>
  )
}
