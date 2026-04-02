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

  const scrollToTools = () => {
    document.getElementById('herramientas')?.scrollIntoView({ behavior: 'smooth' })
  }

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
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition">
              <img src="/logo.png" alt="LexAduana" className="h-10 w-10" />
              <span className="text-xl font-bold text-[#0A3D5C]">LexAduana</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/calculadora" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition">
                Calculadora
              </Link>
              <Link href="/clasificador" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition">
                Clasificador IA
              </Link>
              <Link href="/cbam" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition">
                CBAM
              </Link>
              <Link href="/eudr" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition">
                EUDR
              </Link>
              <Link href="/comparador" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition">
                Comparador
              </Link>
              <Link href="/tipos-cambio" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition">
                Tipos de Cambio
              </Link>
              <Link href="/glosario" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition">
                Glosario
              </Link>
            </nav>

            <div className="flex items-center space-x-3">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition"
              >
                Iniciar Sesion
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
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0A3D5C] to-[#0d4a6e] py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <p className="text-[#F4C542] text-xs font-semibold tracking-[1.5px] mb-4 uppercase">
            Suite Profesional de Comercio Exterior
          </p>

          <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight mb-4">
            Tus importaciones a la UE,<br />bajo control
          </h1>

          <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Calcula aranceles, clasifica productos con IA y gestiona el CBAM.
            Datos oficiales EUR-Lex actualizados mensualmente.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/register"
              className="px-7 py-3 bg-[#F4C542] hover:bg-[#f0b922] text-[#0A3D5C] font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl text-sm"
            >
              Empezar gratis
            </Link>
            <button
              onClick={scrollToTools}
              className="px-7 py-3 bg-transparent border border-white/30 hover:border-white/50 text-white rounded-lg transition-all text-sm cursor-pointer"
            >
              Ver herramientas
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20 max-w-lg mx-auto">
            <div>
              <p className="text-2xl font-bold text-[#F4C542]">49K+</p>
              <p className="text-xs text-blue-200">Codigos TARIC</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F4C542]">195+</p>
              <p className="text-xs text-blue-200">Paises</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F4C542]">390K+</p>
              <p className="text-xs text-blue-200">Registros EUR-Lex</p>
            </div>
          </div>
        </div>
      </section>

      {/* Herramientas Principales - 3 tarjetas iguales */}
      <section id="herramientas" className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Herramientas Principales
            </h2>
            <p className="text-lg text-gray-600">
              Tres pilares para gestionar tus importaciones
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Calculadora TARIC */}
            <Link href="/calculadora" className="group">
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-100 h-full group-hover:border-[#0A3D5C]/30">
                <div className="w-14 h-14 bg-gradient-to-br from-[#0A3D5C] to-[#0d5078] rounded-xl flex items-center justify-center mb-5">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Calculadora TARIC</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Aranceles, IVA, medidas y alertas. 390K+ registros oficiales EUR-Lex.
                </p>
                <ul className="space-y-1 text-sm text-gray-500">
                  <li>&#10003; 49.700+ codigos TARIC</li>
                  <li>&#10003; IVA variable automatico</li>
                  <li>&#10003; Alertas de certificados</li>
                  <li>&#10003; 195 paises con preferencias</li>
                </ul>
              </div>
            </Link>

            {/* Clasificador IA */}
            <Link href="/clasificador" className="group">
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-100 h-full group-hover:border-[#0A3D5C]/30">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center mb-5">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Clasificador IA</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Describe tu producto y obtén la partida arancelaria sugerida con validación TARIC.
                </p>
                <ul className="space-y-1 text-sm text-gray-500">
                  <li>&#10003; Lenguaje natural</li>
                  <li>&#10003; Validación contra base TARIC</li>
                  <li>&#10003; Codigos alternativos</li>
                  <li>&#10003; Calculo integrado</li>
                </ul>
              </div>
            </Link>

            {/* Modulo CBAM */}
            <Link href="/cbam" className="group">
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-100 h-full group-hover:border-[#0A3D5C]/30">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-5">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Modulo CBAM</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Verificador, simulador de costes y guía paso a paso. Obligatorio desde enero 2026.
                </p>
                <ul className="space-y-1 text-sm text-gray-500">
                  <li>&#10003; 40+ codigos CN afectados</li>
                  <li>&#10003; Simulador de certificados</li>
                  <li>&#10003; Guía para principiantes</li>
                  <li>&#10003; Proyección 2026-2034</li>
                </ul>
              </div>
            </Link>
          </div>

          {/* EUDR Card */}
          <Link href="/eudr" className="group block mb-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-green-400 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🌳</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">EUDR — Deforestación</h3>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">NUEVO</span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Verifica si tus importaciones de café, cacao, madera, soja, caucho, palma o ganado están afectadas.
                  </p>
                  <p className="text-green-600 text-xs font-medium mt-1">Aplicación desde diciembre 2026 — Reglamento (UE) 2023/1115</p>
                </div>
              </div>
              <svg className="w-6 h-6 text-green-600 group-hover:translate-x-1 transition-transform hidden sm:block flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>

          {/* Herramientas secundarias - 3 tarjetas compactas */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <Link href="/comparador" className="group flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-200 hover:border-[#0A3D5C]/30 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Comparador multi-origen</h4>
                <p className="text-gray-500 text-xs">Compara hasta 5 paises simultaneamente</p>
              </div>
            </Link>

            <Link href="/despachos" className="group flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-200 hover:border-[#0A3D5C]/30 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Gestor de despachos</h4>
                  <p className="text-gray-500 text-xs">Control operativo de importaciones</p>
                </div>
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded">BETA</span>
              </div>
            </Link>

            <Link href="/tipos-cambio" className="group flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-200 hover:border-[#0A3D5C]/30 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Tipos de cambio BCE</h4>
                <p className="text-gray-500 text-xs">30 monedas oficiales, actualizacion mensual</p>
              </div>
            </Link>
          </div>

          {/* Barra de confianza */}
          <div className="text-center text-sm text-gray-500 mb-12">
            Datos EUR-Lex oficiales &middot; Actualizacion mensual &middot; 100+ profesionales registrados
          </div>

          {/* Banner CBAM urgencia */}
          <Link href="/cbam" className="block">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-amber-800 font-medium text-sm">
                  <strong>CBAM obligatorio desde enero 2026</strong> — Verifica si tus importaciones estan afectadas
                </p>
              </div>
              <span className="text-amber-700 font-semibold text-sm whitespace-nowrap flex items-center gap-1">
                Verificar ahora
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Para quién */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Diseñado para profesionales
            </h2>
            <p className="text-lg text-gray-600">
              Del importador al agente de aduanas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-[#0A3D5C] to-[#0d5078] rounded-xl flex items-center justify-center mb-5 mx-auto">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-3">Importadores</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Calcula costes antes de comprar
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Compara proveedores por pais
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Clasifica productos sin conocer el código
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-[#F4C542] to-[#f5d05e] rounded-xl flex items-center justify-center mb-5 mx-auto">
                <svg className="w-7 h-7 text-[#0A3D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-3">Agentes Aduaneros</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Verificacion rapida de aranceles
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Alertas de certificados necesarios
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  IA como segundo criterio de clasificacion
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mb-5 mx-auto">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-3">Consultores</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Asesora con datos precisos
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Compara escenarios multiples
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Genera informes profesionales
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Empieza a optimizar tus importaciones
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Unete a profesionales que ya usan LexAduana para sus operaciones de comercio internacional
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-[#F4C542] hover:bg-[#f0b922] text-[#0A3D5C] font-bold rounded-xl transition-all shadow-xl hover:shadow-2xl"
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/calculadora"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/20"
            >
              Ir a Calculadora
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A3D5C] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img src="/logo.png" alt="LexAduana" className="h-12 w-12" />
                <div>
                  <h3 className="text-2xl font-bold">LexAduana</h3>
                  <p className="text-blue-200 text-sm">Suite Profesional de Comercio Exterior</p>
                </div>
              </div>
              <p className="text-blue-100 text-sm leading-relaxed mb-4">
                Plataforma de herramientas aduaneras para importaciones a la UE.
                Calculadora TARIC, clasificador con IA y modulo CBAM. Datos oficiales EUR-Lex.
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

            <div>
              <h4 className="font-bold text-lg mb-4">Herramientas</h4>
              <ul className="space-y-2 text-blue-100 text-sm">
                <li><Link href="/calculadora" className="hover:text-white transition">Calculadora TARIC</Link></li>
                <li><Link href="/clasificador" className="hover:text-white transition">Clasificador IA</Link></li>
                <li><Link href="/cbam" className="hover:text-white transition">Modulo CBAM</Link></li>
                <li><Link href="/eudr" className="hover:text-white transition">EUDR Deforestación</Link></li>
                <li><Link href="/comparador" className="hover:text-white transition">Comparador</Link></li>
                <li><Link href="/tipos-cambio" className="hover:text-white transition">Tipos de Cambio</Link></li>
                <li><Link href="/despachos" className="hover:text-white transition">Despachos</Link></li>
                <li><Link href="/glosario" className="hover:text-white transition">Glosario</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Legal</h4>
              <ul className="space-y-2 text-blue-100 text-sm">
                <li><Link href="/politica-privacidad" className="hover:text-white transition">Politica de Privacidad</Link></li>
                <li><Link href="/terminos-uso" className="hover:text-white transition">Terminos de Uso</Link></li>
                <li><Link href="/cookies" className="hover:text-white transition">Politica de Cookies</Link></li>
                <li><Link href="mailto:soporte@lexaduana.es" className="hover:text-white transition">Contacto</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-blue-800 mt-8 pt-8 text-center text-blue-200 text-sm">
            <p>&copy; 2024-2026 LexAduana. Todos los derechos reservados.</p>
            <p className="mt-2">
              Datos TARIC actualizados &middot; Tipos de cambio BCE oficiales &middot; Clasificacion con IA
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
