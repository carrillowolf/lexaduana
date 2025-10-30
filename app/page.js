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
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="LexAduana" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-[#0A3D5C]">LexAduana</h1>
                <p className="text-xs text-gray-500">Calculadora TARIC</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/" className="px-4 py-2 text-sm font-medium text-[#0A3D5C] bg-blue-50 rounded-lg transition">
                Inicio
              </Link>
              <Link href="/calculadora" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition">
                Calculadora
              </Link>
              <Link href="/comparador" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition">
                Comparador
              </Link>
              <Link href="/tipos-cambio" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition">
                Tipos de Cambio
              </Link>
              <Link href="/glosario" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition">
                📚 Glosario
              </Link>
            </nav>

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
        {/* Efecto de gradiente animado */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F4C542]/10 via-transparent to-[#F4C542]/10 animate-pulse"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <div className="text-white space-y-8">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <span className="text-[#F4C542] font-bold mr-2">🤖 IA</span>
                <span className="text-sm font-medium">Tecnología de última generación</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Calcula Aranceles
                <span className="block text-[#F4C542] mt-2">con Inteligencia</span>
              </h1>

              <p className="text-xl text-blue-100 leading-relaxed">
                La calculadora TARIC más avanzada de España. Procesa importaciones con precisión profesional y asistencia de IA.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/calculadora"
                  className="px-8 py-4 bg-[#F4C542] hover:bg-[#f0b922] text-[#0A3D5C] font-bold rounded-xl transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  Empezar Gratis
                </Link>
                <Link
                  href="/auth/register"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/20"
                >
                  Crear Cuenta
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
                <div>
                  <p className="text-3xl font-bold text-[#F4C542]">49K+</p>
                  <p className="text-sm text-blue-200">Aranceles TARIC</p>
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

            {/* Visual mejorado */}
            <div className="hidden lg:block relative">
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border-2 border-white/30 p-8 shadow-2xl">
                <div className="space-y-4">
                  {/* Item 1 */}
                  <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="w-14 h-14 bg-[#F4C542] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <svg className="w-8 h-8 text-[#0A3D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-white/30 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-white/20 rounded w-1/2"></div>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="w-14 h-14 bg-emerald-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-white/30 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-white/20 rounded w-1/3"></div>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="w-14 h-14 bg-blue-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-white/30 rounded w-4/5 mb-2"></div>
                      <div className="h-3 bg-white/20 rounded w-2/5"></div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Elementos decorativos */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#F4C542] rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-blue-400 rounded-full opacity-20 blur-3xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Clasificador IA Banner - SOLO para usuarios logueados */}
      {user && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 mb-16">
          <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-3xl shadow-2xl overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>

            <div className="relative px-8 py-12 md:px-12 md:py-16">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 text-white">
                  <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                    <span className="text-xs font-bold uppercase tracking-wide">✨ Nuevo</span>
                    <span className="text-xs">•</span>
                    <span className="text-xs">Powered by Claude Sonnet 4.5</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    🤖 Clasificador Inteligente
                  </h2>
                  <p className="text-lg text-purple-100 mb-6 max-w-xl">
                    Describe tu producto en lenguaje natural y obtén la clasificación TARIC
                    con razonamiento detallado. De descripción a código HS en segundos.
                  </p>
                  <ul className="space-y-2 mb-8 text-purple-100">
                    <li className="flex items-center">
                      <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Validado contra base EUR-Lex actualizada
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Códigos alternativos con nivel de confianza
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Integración directa con calculadora de aranceles
                    </li>
                  </ul>
                  <Link
                    href="/clasificador"
                    className="inline-flex items-center space-x-3 px-8 py-4 bg-white text-purple-600 font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                  >
                    <span>Probar Clasificador IA</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>

                <div className="hidden md:block flex-shrink-0">
                  <div className="relative">
                    <div className="w-64 h-64 bg-white/10 backdrop-blur-sm rounded-3xl p-8 transform rotate-3 hover:rotate-6 transition-transform">
                      <svg className="w-full h-full text-white/80" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="absolute -top-4 -right-4 bg-pink-400 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg animate-bounce">
                      ¡Pruébalo!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas para importar
            </h2>
            <p className="text-xl text-gray-600">
              Tecnología avanzada al servicio del comercio internacional
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-[#0A3D5C] rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Cálculo Instantáneo</h3>
              <p className="text-gray-600">
                Resultados precisos en menos de 1 segundo. 49,000+ aranceles TARIC actualizados.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8 border border-emerald-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">195+ Países</h3>
              <p className="text-gray-600">
                Acuerdos comerciales actualizados. Detecta automáticamente aranceles preferenciales.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-8 border border-amber-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-[#F4C542] rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[#0A3D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">30 Monedas</h3>
              <p className="text-gray-600">
                Tipos de cambio oficiales BCE. Conversión automática en tiempo real.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Comparador Multi-Origen</h3>
              <p className="text-gray-600">
                Compara hasta 5 países simultáneamente. Encuentra el origen más económico.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 border border-red-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Alertas TARIC</h3>
              <p className="text-gray-600">
                15,000+ alertas de certificados, licencias y requisitos. Nunca olvides documentación.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 border border-cyan-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-cyan-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">IVA Inteligente</h3>
              <p className="text-gray-600">
                Aplica automáticamente 4%, 10% o 21% según producto. Precisión garantizada.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Target Audience */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">Importadores</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Calcula costes totales antes de importar</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Identifica documentación necesaria</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Optimiza tu margen comercial</span>
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
                  <span>Verifica cálculos al instante</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Procesamiento masivo de operaciones</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Mejora productividad del equipo</span>
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
                  <span>Asesora clientes con datos precisos</span>
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

      {/* CTA Final */}
      <div className="bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            ¿Listo para empezar?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Únete a cientos de profesionales que ya confían en LexAduana
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/calculadora"
              className="px-8 py-4 bg-[#F4C542] hover:bg-[#f0b922] text-[#0A3D5C] font-bold rounded-xl transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Probar Calculadora
            </Link>
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/20"
            >
              Crear Cuenta Gratis
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
                Tecnología de IA al servicio del comercio internacional.
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
                <li><Link href="/comparador" className="hover:text-white transition">Comparador</Link></li>
                <li><Link href="/tipos-cambio" className="hover:text-white transition">Tipos de Cambio</Link></li>
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
              Desarrollado con tecnología de IA para profesionales del comercio internacional
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}