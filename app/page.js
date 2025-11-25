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
              <Link href="/despachos" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition">
                📦 Despachos
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
                    <div className="flex-1">
                      <p className="text-white font-semibold">Cálculo Instantáneo</p>
                      <p className="text-blue-200 text-sm">Aranceles + IVA al momento</p>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="w-14 h-14 bg-[#F4C542] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <svg className="w-8 h-8 text-[#0A3D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">Alertas TARIC</p>
                      <p className="text-blue-200 text-sm">Certificados y requisitos</p>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="w-14 h-14 bg-[#F4C542] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <svg className="w-8 h-8 text-[#0A3D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">Comparador</p>
                      <p className="text-blue-200 text-sm">5 países simultáneos</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NUEVA SECCIÓN: Gestión de Despachos */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Sección */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full border border-blue-100 mb-6">
              <span className="text-[#0A3D5C] font-bold mr-2">🆕 NUEVO</span>
              <span className="text-sm font-medium text-gray-700">Sistema de gestión profesional</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Gestión Integral de
              <span className="block text-[#0A3D5C] mt-2">Despachos Aduaneros</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Controla todos tus despachos de importación, exportación y tránsitos desde una única plataforma operativa
            </p>
          </div>

          {/* Grid de características */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-[#0A3D5C] rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#F4C542]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Vista Operativa Excel</h3>
              <p className="text-gray-600 text-sm">
                Tabla compacta con 15+ despachos visibles. Todo editable con 1 click sin entrar al detalle.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-[#0A3D5C] rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#F4C542]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Alertas Automáticas</h3>
              <p className="text-gray-600 text-sm">
                ETA cumplida, 24h sin cambios, reconocimientos próximos. El sistema te avisa automáticamente.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-[#0A3D5C] rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#F4C542]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Paraaduaneros</h3>
              <p className="text-gray-600 text-sm">
                Gestiona ROHS, SOIVRE, VETERINARIO, CITES con número de expediente individual por cada tipo.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-[#0A3D5C] rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#F4C542]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Checklist Dinámico</h3>
              <p className="text-gray-600 text-sm">
                Plantillas automáticas por tipo: Import Marítima (28 items), Aérea (21 items), Export, Tránsitos.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-[#0A3D5C] rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#F4C542]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Estados en Tiempo Real</h3>
              <p className="text-gray-600 text-sm">
                Documentación, Gastos, Sumaria, DUA, MRN, EUR1/ATR, Levante, TDocs. Todo actualizable al instante.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-[#0A3D5C] rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#F4C542]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Notas y Documentos</h3>
              <p className="text-gray-600 text-sm">
                Añade notas libres, sube documentación, mantén timeline de cambios. Todo organizado y accesible.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/despachos"
              className="inline-flex items-center px-8 py-4 bg-[#0A3D5C] hover:bg-[#083049] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Ver Sistema de Despachos
            </Link>
            <p className="mt-4 text-sm text-gray-500">Requiere registro gratuito</p>
          </div>
        </div>
      </div>

      {/* Features Section - Existente mejorado */}
      <div className="py-20 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Herramientas Profesionales
            </h2>
            <p className="text-xl text-gray-600">
              Todo lo que necesitas para gestionar tus operaciones aduaneras
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Calculadora TARIC */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0A3D5C] to-[#0d5078] rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">Calculadora TARIC</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>49K+ aranceles actualizados</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>IVA variable 4%/10%/21%</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Alertas TARIC automáticas</span>
                </li>
              </ul>
            </div>

            {/* Gestión Despachos */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border-2 border-[#F4C542]">
              <div className="w-16 h-16 bg-gradient-to-br from-[#F4C542] to-[#f5d05e] rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg className="w-9 h-9 text-[#0A3D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-center mb-4">
                <span className="inline-block px-3 py-1 bg-[#F4C542] text-[#0A3D5C] text-xs font-bold rounded-full">NUEVO</span>
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">Gestión Despachos</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Control total Import/Export</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Alertas automáticas ETA/ETD</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Paraaduaneros por expediente</span>
                </li>
              </ul>
            </div>

            {/* Comparador */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">Comparador</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>5 países simultáneos</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Detecta mejor opción</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Cálculo de ahorro</span>
                </li>
              </ul>
            </div>

            {/* Tipos de Cambio */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">Tipos de Cambio</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>30 monedas BCE</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Actualización mensual</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Cumplimiento normativo</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Target Audience - Mejorado con Despachos */}
      <div className="py-20 bg-white">
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
                  <span>Compara proveedores de distintos países</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Gestiona tus despachos en tiempo real</span>
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
                  <span>Control operativo de 15+ despachos sin scroll</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Checklist automático por tipo de operación</span>
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
                <li><Link href="/despachos" className="hover:text-white transition flex items-center">
                  Despachos
                  <span className="ml-2 px-2 py-0.5 bg-[#F4C542] text-[#0A3D5C] text-xs font-bold rounded">NUEVO</span>
                </Link></li>
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
