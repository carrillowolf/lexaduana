'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import ExchangeRateBanner from '../components/ExchangeRateBanner'
import Link from 'next/link'

export default function HomePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)

      // Si está logueado, redirigir a /calculadora
      if (user) {
        router.push('/calculadora')
      }
    }
    checkUser()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0A3D5C] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si está logueado, no mostrar nada (ya está redirigiendo)
  if (user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - clickable a inicio */}
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition">
              <img src="/logo.png" alt="LexAduana" className="h-10 w-10" />
              <span className="text-xl font-bold text-[#0A3D5C]">LexAduana</span>
            </Link>

            {/* Nav principal - solo lo esencial */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/calculadora" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition">
                Calculadora
              </Link>
              <Link href="/clasificador" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition flex items-center">
                <span className="mr-1">🤖</span> Clasificador IA
              </Link>
              <Link href="/comparador" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition">
                Comparador
              </Link>
              <Link href="/despachos" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition flex items-center">
                Despachos
                <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded">β</span>
              </Link>
            </nav>

            {/* Auth buttons */}
            <div className="flex items-center space-x-3">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/auth/register"
                className="px-6 py-2 bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] hover:from-[#083049] hover:to-[#0A3D5C] text-white text-sm font-bold rounded-lg transition-all shadow-lg"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </header>
      <ExchangeRateBanner />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A3D5C] via-[#0d5078] to-[#0A3D5C] py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-[#F4C542]/10 via-transparent to-[#F4C542]/10 animate-pulse"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <div className="text-white space-y-8">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <span className="text-[#F4C542] font-bold mr-2">🤖 NUEVO</span>
                <span className="text-sm font-medium">Clasificador IA con validación TARIC</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Describe tu producto,
                <span className="block text-[#F4C542] mt-2">obtén el código TARIC</span>
              </h1>

              <p className="text-xl text-blue-100 leading-relaxed">
                La única calculadora TARIC con inteligencia artificial que clasifica productos en lenguaje natural y valida contra la base de datos oficial EUR-Lex.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/clasificador"
                  className="px-8 py-4 bg-[#F4C542] hover:bg-[#f0b922] text-[#0A3D5C] font-bold rounded-xl transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center"
                >
                  <span className="mr-2">🤖</span>
                  Probar Clasificador IA
                </Link>
                <Link
                  href="/calculadora"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/20"
                >
                  Calculadora Clásica
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
                <div>
                  <p className="text-3xl font-bold text-[#F4C542]">49K+</p>
                  <p className="text-sm text-blue-200">Códigos TARIC</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#F4C542]">195+</p>
                  <p className="text-sm text-blue-200">Países</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#F4C542]">30</p>
                  <p className="text-sm text-blue-200">Monedas BCE</p>
                </div>
              </div>
            </div>

            {/* Visual - Demo del Clasificador */}
            <div className="hidden lg:block relative">
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border-2 border-white/30 p-8 shadow-2xl">
                <div className="space-y-4">
                  {/* Input simulado */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <p className="text-blue-200 text-xs mb-2">Descripción del producto</p>
                    <p className="text-white font-medium">"Tablets con teclado desmontable, pantalla 10 pulgadas, uso industrial"</p>
                  </div>

                  {/* Flecha */}
                  <div className="flex justify-center">
                    <div className="w-10 h-10 bg-[#F4C542] rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#0A3D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>

                  {/* Resultado */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[#F4C542] font-bold text-lg">8471.30.00.00</span>
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full">92% confianza</span>
                    </div>
                    <p className="text-blue-200 text-sm">Máquinas automáticas para tratamiento de datos, portátiles</p>
                    <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
                      <span className="text-white/60 text-xs">Arancel: 0%</span>
                      <span className="text-emerald-400 text-xs font-medium">✓ Validado en TARIC</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN CLASIFICADOR IA - PROTAGONISTA */}
      <div className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 rounded-full border border-purple-200 mb-6">
              <span className="text-purple-700 font-bold mr-2">🤖</span>
              <span className="text-sm font-medium text-purple-800">Inteligencia Artificial + Datos Oficiales</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Clasificador IA
              <span className="block text-[#0A3D5C] mt-2">Tu asistente de clasificación arancelaria</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Describe tu producto en lenguaje natural. La IA analiza, clasifica y valida contra la base TARIC oficial.
            </p>
          </div>

          {/* Cómo funciona - 3 pasos */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Paso 1 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#0A3D5C] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">1</div>
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-[#0A3D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Describe tu producto</h3>
                <p className="text-gray-600">
                  Escribe en lenguaje natural: materiales, función, uso previsto. Como se lo explicarías a un colega.
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#0A3D5C] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">2</div>
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">La IA clasifica</h3>
                <p className="text-gray-600">
                  Aplica las Reglas Generales de Interpretación del Sistema Armonizado y busca en +49.000 códigos.
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#0A3D5C] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">3</div>
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full">
                <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Validado + Cálculo</h3>
                <p className="text-gray-600">
                  Verifica que el código existe en TARIC, muestra el arancel y calcula los costes de importación.
                </p>
              </div>
            </div>
          </div>

          {/* Diferenciadores */}
          <div className="bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
                  ¿Por qué no usar ChatGPT directamente?
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start text-blue-100">
                    <svg className="w-6 h-6 text-[#F4C542] mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong className="text-white">Datos actualizados:</strong> Base TARIC de EUR-Lex, no conocimiento genérico desactualizado</span>
                  </li>
                  <li className="flex items-start text-blue-100">
                    <svg className="w-6 h-6 text-[#F4C542] mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong className="text-white">Validación real:</strong> Verifica que el código existe y obtiene el arancel oficial</span>
                  </li>
                  <li className="flex items-start text-blue-100">
                    <svg className="w-6 h-6 text-[#F4C542] mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong className="text-white">Integración directa:</strong> Del código al cálculo en un click, sin copiar/pegar</span>
                  </li>
                  <li className="flex items-start text-blue-100">
                    <svg className="w-6 h-6 text-[#F4C542] mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong className="text-white">Códigos alternativos:</strong> Sugiere opciones con nivel de confianza por si hay duda</span>
                  </li>
                </ul>
              </div>
              <div className="text-center">
                <Link
                  href="/clasificador"
                  className="inline-flex items-center px-10 py-5 bg-[#F4C542] hover:bg-[#f0b922] text-[#0A3D5C] font-bold text-lg rounded-xl transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  <span className="mr-3 text-2xl">🤖</span>
                  Probar Clasificador IA
                </Link>
                <p className="text-blue-200 mt-4 text-sm">Sin registro • Resultados en segundos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HERRAMIENTAS - Grid compacto */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Herramientas Profesionales
            </h2>
            <p className="text-xl text-gray-600">
              Todo lo que necesitas para calcular costes de importación
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Calculadora */}
            <Link href="/calculadora" className="group">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-100 h-full group-hover:border-[#0A3D5C]/30">
                <div className="w-14 h-14 bg-gradient-to-br from-[#0A3D5C] to-[#0d5078] rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Calculadora</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Introduce código HS, país y valor CIF. Obtén arancel, IVA y coste total al instante.
                </p>
                <ul className="space-y-1 text-sm text-gray-500">
                  <li>✓ 49.700+ códigos TARIC</li>
                  <li>✓ IVA variable automático</li>
                  <li>✓ Alertas de certificados</li>
                </ul>
              </div>
            </Link>

            {/* Comparador */}
            <Link href="/comparador" className="group">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-100 h-full group-hover:border-[#0A3D5C]/30">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Comparador</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Compara hasta 5 países de origen simultáneamente. Detecta la mejor opción.
                </p>
                <ul className="space-y-1 text-sm text-gray-500">
                  <li>✓ 5 países a la vez</li>
                  <li>✓ Detecta ahorros</li>
                  <li>✓ Preferencias EUR.1</li>
                </ul>
              </div>
            </Link>

            {/* Tipos de Cambio */}
            <Link href="/tipos-cambio" className="group">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-100 h-full group-hover:border-[#0A3D5C]/30">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Tipos de Cambio</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Tipos oficiales BCE para despachos aduaneros. Actualización mensual.
                </p>
                <ul className="space-y-1 text-sm text-gray-500">
                  <li>✓ 30 monedas BCE</li>
                  <li>✓ Vigencia automática</li>
                  <li>✓ Reglamento UE 2447/2015</li>
                </ul>
              </div>
            </Link>

            {/* Glosario */}
            <Link href="/glosario" className="group">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-100 h-full group-hover:border-[#0A3D5C]/30">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Glosario</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Términos aduaneros explicados de forma clara. Referencia rápida.
                </p>
                <ul className="space-y-1 text-sm text-gray-500">
                  <li>✓ 25+ términos</li>
                  <li>✓ Ejemplos prácticos</li>
                  <li>✓ Búsqueda rápida</li>
                </ul>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* PARA QUIÉN */}
      <div className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Para quién es LexAduana?
            </h2>
            <p className="text-xl text-gray-600">
              Diseñado para profesionales del comercio internacional
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Importadores */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0A3D5C] to-[#0d5078] rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">Importadores</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Calcula costes antes de comprar</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Compara proveedores por país</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Clasifica productos sin conocer el código</span>
                </li>
              </ul>
            </div>

            {/* Agentes de Aduanas */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-[#F4C542] to-[#f5d05e] rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg className="w-9 h-9 text-[#0A3D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">Agentes Aduaneros</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Verificación rápida de aranceles</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Alertas de certificados necesarios</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>IA como segundo criterio clasificación</span>
                </li>
              </ul>
            </div>

            {/* Consultores */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">Consultores</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Asesora con datos precisos</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Compara escenarios múltiples</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Genera informes profesionales</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* DESPACHOS - Versión compacta BETA */}
      <div className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-8 md:p-10 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📦</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-bold text-gray-900">Gestión de Despachos</h3>
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">BETA</span>
                    </div>
                    <p className="text-gray-500 text-sm">Sistema de gestión operativa para agencias</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Control visual de importaciones, exportaciones y tránsitos. Vista tipo Excel, alertas automáticas, checklist por operación y gestión de paraaduaneros.
                </p>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 text-emerald-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Vista operativa
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 text-emerald-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Alertas ETA/ETD
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 text-emerald-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Checklist dinámico
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex-shrink-0">
                <Link
                  href="/despachos"
                  className="inline-flex items-center px-6 py-3 bg-[#0A3D5C] hover:bg-[#083049] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  Explorar Beta
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            ¿Listo para calcular mejor?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Únete a profesionales que ya usan LexAduana para sus operaciones de comercio internacional
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/clasificador"
              className="px-8 py-4 bg-[#F4C542] hover:bg-[#f0b922] text-[#0A3D5C] font-bold rounded-xl transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center"
            >
              <span className="mr-2">🤖</span>
              Probar Clasificador IA
            </Link>
            <Link
              href="/calculadora"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/20"
            >
              Ir a Calculadora
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0A3D5C] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Logo y descripción */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img src="/logo.png" alt="LexAduana" className="h-12 w-12" />
                <div>
                  <h3 className="text-2xl font-bold">LexAduana</h3>
                  <p className="text-blue-200 text-sm">Calculadora TARIC Profesional</p>
                </div>
              </div>
              <p className="text-blue-100 text-sm leading-relaxed mb-4">
                La plataforma más avanzada de España para el cálculo de aranceles e IVA en importaciones.
                Clasificador IA con validación contra datos oficiales EUR-Lex.
              </p>
              <div className="flex space-x-4">
                <Link href="https://lexaduana.es" className="text-[#F4C542] hover:text-[#f0b922] transition">
                  lexaduana.es
                </Link>
                <span className="text-blue-300">|</span>
                <Link href="https://lexaduana.eu" className="text-[#F4C542] hover:text-[#f0b922] transition">
                  lexaduana.eu
                </Link>
              </div>
            </div>

            {/* Enlaces Producto */}
            <div>
              <h4 className="font-bold text-lg mb-4">Producto</h4>
              <ul className="space-y-2 text-blue-100 text-sm">
                <li><Link href="/calculadora" className="hover:text-white transition">Calculadora</Link></li>
                <li><Link href="/clasificador" className="hover:text-white transition flex items-center">
                  🤖 Clasificador IA
                </Link></li>
                <li><Link href="/comparador" className="hover:text-white transition">Comparador</Link></li>
                <li><Link href="/tipos-cambio" className="hover:text-white transition">Tipos de Cambio</Link></li>
                <li><Link href="/despachos" className="hover:text-white transition flex items-center">
                  Despachos
                  <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-bold rounded">β</span>
                </Link></li>
                <li><Link href="/glosario" className="hover:text-white transition">Glosario</Link></li>
              </ul>
            </div>

            {/* Enlaces Legales */}
            <div>
              <h4 className="font-bold text-lg mb-4">Legal</h4>
              <ul className="space-y-2 text-blue-100 text-sm">
                <li><Link href="/politica-privacidad" className="hover:text-white transition">Política de Privacidad</Link></li>
                <li><Link href="/terminos-uso" className="hover:text-white transition">Términos de Uso</Link></li>
                <li><Link href="/cookies" className="hover:text-white transition">Política de Cookies</Link></li>
                <li><Link href="mailto:soporte@lexaduana.es" className="hover:text-white transition">Contacto</Link></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-blue-800 mt-8 pt-8 text-center text-blue-200 text-sm">
            <p>© 2024-2025 LexAduana. Todos los derechos reservados.</p>
            <p className="mt-2">
              Datos TARIC actualizados • Tipos de cambio BCE oficiales • Clasificación con IA
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
