'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-[#0A3D5C] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si está logueado, no mostrar nada (ya está redirigiendo)
  if (user) return null

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="LexAduana" className="h-8 w-8" />
            <span className="text-lg font-bold text-[#0A3D5C]">LexAduana</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/calculadora" className="px-3 py-1.5 text-sm text-gray-600 hover:text-[#0A3D5C] rounded-md transition">
              Calculadora
            </Link>
            <Link href="/cbam" className="px-3 py-1.5 text-sm text-gray-600 hover:text-[#0A3D5C] rounded-md transition">
              CBAM
            </Link>
            <Link href="/eudr" className="px-3 py-1.5 text-sm text-gray-600 hover:text-[#0A3D5C] rounded-md transition">
              EUDR
            </Link>
            <Link href="/clasificador" className="px-3 py-1.5 text-sm text-gray-600 hover:text-[#0A3D5C] rounded-md transition">
              Clasificador IA
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] transition"
            >
              Acceder
            </Link>
            <Link
              href="/auth/register"
              className="px-5 py-2 bg-[#0A3D5C] hover:bg-[#083049] text-white text-sm font-semibold rounded-lg transition shadow-sm"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          PANTALLA 1 — Hero
      ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Fondo */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A3D5C] to-[#0c4d72]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDYwIEwgNjAgMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjAuMyIgb3BhY2l0eT0iMC4wNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-40" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 md:py-28 text-center">
          <p className="text-[#F4C542] text-xs font-semibold tracking-[2px] uppercase mb-5">
            Suite Profesional de Comercio Exterior
          </p>

          <h1 className="text-white text-3xl sm:text-4xl md:text-[2.75rem] font-bold leading-tight mb-5">
            Tus importaciones a la UE,
            <br className="hidden sm:block" />
            bajo control total
          </h1>

          <p className="text-blue-100/80 text-base md:text-lg max-w-2xl mx-auto mb-9 leading-relaxed">
            Aranceles TARIC oficiales, clasificación con IA, cumplimiento CBAM y EUDR.
            Todo en una plataforma pensada para profesionales.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link
              href="/auth/register"
              className="px-7 py-3 bg-[#F4C542] hover:bg-[#f0b922] text-[#0A3D5C] font-bold rounded-lg transition-all shadow-lg hover:shadow-xl text-sm"
            >
              Acceder gratis
            </Link>
            <a
              href="#herramientas"
              className="px-7 py-3 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-lg transition-all text-sm font-medium cursor-pointer"
            >
              Ver herramientas ↓
            </a>
          </div>

          {/* Barra de confianza */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-blue-200/70">
            <span>Datos EUR-Lex oficiales</span>
            <span className="hidden sm:inline">·</span>
            <span>390.735 registros</span>
            <span className="hidden sm:inline">·</span>
            <span>Actualización mensual</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PANTALLA 2 — Herramientas (grid compacto 2×3)
      ═══════════════════════════════════════════════════════ */}
      <section id="herramientas" className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Todo lo que necesitas, en un solo lugar
            </h2>
            <p className="text-gray-500">
              Seis herramientas profesionales para comercio exterior
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Calculadora TARIC */}
            <Link href="/calculadora" className="group">
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#0A3D5C]/40 hover:shadow-lg transition-all h-full">
                <div className="w-11 h-11 bg-[#0A3D5C]/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-[#0A3D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">Calculadora TARIC</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Aranceles, IVA, medidas y alertas. 49.700+ códigos con preferencias para 195 países.
                </p>
              </div>
            </Link>

            {/* Clasificador IA */}
            <Link href="/clasificador" className="group">
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all h-full">
                <div className="w-11 h-11 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">Clasificador IA</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Describe tu producto en lenguaje natural y obtén la partida arancelaria sugerida con validación TARIC.
                </p>
              </div>
            </Link>

            {/* CBAM */}
            <Link href="/cbam" className="group">
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all h-full">
                <div className="w-11 h-11 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">Módulo CBAM</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Verificador, simulador de costes, guía y asesoría profesional. Obligatorio desde enero 2026.
                </p>
              </div>
            </Link>

            {/* EUDR */}
            <Link href="/eudr" className="group">
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all h-full">
                <div className="w-11 h-11 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-lg">🌳</span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-bold text-gray-900">EUDR</h3>
                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">NUEVO</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Reglamento de Deforestación de la UE. Verifica si tus importaciones están afectadas.
                </p>
              </div>
            </Link>

            {/* Comparador */}
            <Link href="/comparador" className="group">
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all h-full">
                <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">Comparador Multi-Origen</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Compara aranceles y preferencias entre hasta 5 países de origen simultáneamente.
                </p>
              </div>
            </Link>

            {/* Tipos de cambio */}
            <Link href="/tipos-cambio" className="group">
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-amber-300 hover:shadow-lg transition-all h-full">
                <div className="w-11 h-11 bg-amber-50 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">Tipos de Cambio BCE</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  30 monedas oficiales del Banco Central Europeo con actualización mensual automática.
                </p>
              </div>
            </Link>
          </div>

          {/* Herramientas adicionales inline */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Link href="/despachos" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 transition">
              📋 Gestor de Despachos
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">BETA</span>
            </Link>
            <Link href="/glosario" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 transition">
              📖 Glosario Aduanero
            </Link>
            <Link href="/bulk" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 transition">
              📊 Cálculo Masivo
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PANTALLA 3 — Credibilidad + CTA final
      ═══════════════════════════════════════════════════════ */}

      {/* Números */}
      <section className="py-14 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-[#0A3D5C]">390K+</p>
              <p className="text-sm text-gray-500 mt-1">Registros TARIC</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-[#0A3D5C]">49.700+</p>
              <p className="text-sm text-gray-500 mt-1">Códigos arancelarios</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-[#0A3D5C]">573</p>
              <p className="text-sm text-gray-500 mt-1">Códigos CN CBAM</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-[#0A3D5C]">195</p>
              <p className="text-sm text-gray-500 mt-1">Países con preferencias</p>
            </div>
          </div>
        </div>
      </section>

      {/* Para quién — compacto */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
            Diseñado para profesionales del comercio
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-[#0A3D5C]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#0A3D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Importadores</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Calcula costes antes de comprar, compara proveedores por país y clasifica productos sin conocer el código.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-[#F4C542]/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#0A3D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Agentes Aduaneros</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Verificación rápida de aranceles, alertas de certificados necesarios e IA como segundo criterio de clasificación.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Consultores</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Asesora con datos precisos, compara escenarios múltiples y genera informes profesionales para clientes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Banner CBAM urgencia */}
      <section className="pb-16 md:pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-amber-900 font-semibold text-sm">CBAM obligatorio desde enero 2026</p>
                <p className="text-amber-700 text-sm">Verifica si tus importaciones están afectadas con nuestra autoevaluación gratuita.</p>
              </div>
            </div>
            <Link
              href="/cbam/assessment"
              className="flex-shrink-0 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition whitespace-nowrap"
            >
              Verificar ahora
            </Link>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[#0A3D5C] py-16 md:py-20">
        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Empieza a optimizar tus importaciones
          </h2>
          <p className="text-blue-200 mb-8 leading-relaxed">
            Únete a profesionales que ya usan LexAduana para gestionar sus operaciones de comercio internacional con datos oficiales.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-3.5 bg-[#F4C542] hover:bg-[#f0b922] text-[#0A3D5C] font-bold rounded-lg transition-all shadow-lg text-sm"
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/calculadora"
              className="px-8 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold rounded-lg transition-all text-sm"
            >
              Probar la calculadora
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[#082d45] text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Marca */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="LexAduana" className="h-10 w-10" />
                <div>
                  <h3 className="text-xl font-bold">LexAduana</h3>
                  <p className="text-blue-300 text-xs">Suite Profesional de Comercio Exterior</p>
                </div>
              </div>
              <p className="text-blue-200/70 text-sm leading-relaxed mb-4 max-w-sm">
                Plataforma de herramientas aduaneras para importaciones a la UE.
                Datos oficiales EUR-Lex actualizados mensualmente.
              </p>
              <div className="flex gap-3 text-sm">
                <Link href="https://lexaduana.es" className="text-[#F4C542] hover:text-[#f0b922] transition">
                  lexaduana.es
                </Link>
                <span className="text-blue-400">·</span>
                <Link href="https://lexaduana.eu" className="text-[#F4C542] hover:text-[#f0b922] transition">
                  lexaduana.eu
                </Link>
              </div>
            </div>

            {/* Herramientas */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">Herramientas</h4>
              <ul className="space-y-2 text-blue-200/70 text-sm">
                <li><Link href="/calculadora" className="hover:text-white transition">Calculadora TARIC</Link></li>
                <li><Link href="/clasificador" className="hover:text-white transition">Clasificador IA</Link></li>
                <li><Link href="/cbam" className="hover:text-white transition">Módulo CBAM</Link></li>
                <li><Link href="/eudr" className="hover:text-white transition">EUDR</Link></li>
                <li><Link href="/comparador" className="hover:text-white transition">Comparador</Link></li>
                <li><Link href="/tipos-cambio" className="hover:text-white transition">Tipos de Cambio</Link></li>
                <li><Link href="/glosario" className="hover:text-white transition">Glosario</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-blue-200/70 text-sm">
                <li><Link href="/politica-privacidad" className="hover:text-white transition">Política de Privacidad</Link></li>
                <li><Link href="/terminos-uso" className="hover:text-white transition">Términos de Uso</Link></li>
                <li><Link href="mailto:soporte@lexaduana.es" className="hover:text-white transition">Contacto</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center text-blue-300/50 text-xs">
            <p>&copy; 2024-2026 LexAduana. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
