export const metadata = {
  title: 'CBAM — Mecanismo de Ajuste en Frontera por Carbono | LexAduana',
  description:
    'Hub completo del CBAM: autoevaluación, simulador de costes, guía operativa, plazos y asesoría. 573 códigos CN verificados. Todo sobre el mecanismo de ajuste en frontera por carbono de la UE.',
  keywords: [
    'CBAM',
    'mecanismo ajuste frontera carbono',
    'carbon border adjustment',
    'CBAM España',
    'importaciones carbono UE',
    'certificados CBAM',
  ],
  openGraph: {
    title: 'CBAM — Mecanismo de Ajuste en Frontera por Carbono | LexAduana',
    description:
      'Hub completo del CBAM: autoevaluación, simulador de costes, guía operativa y asesoría. 573 códigos CN verificados.',
    url: 'https://lexaduana.es/cbam',
    siteName: 'LexAduana',
    locale: 'es_ES',
    type: 'website',
  },
}

import JsonLd from '@/components/JsonLd'
import Link from 'next/link'
import {
  getNextDeadlineDB,
  getSectors,
  getTimeline,
  getExcludedCountries,
  getCertificates,
  getDefaultValueMarkupSchedule,
  getDownstreamExtension,
  getThreshold,
  getCBAMConfig,
} from '@/lib/cbamService'
import CBAMCostSimulator from '@/components/CBAMCostSimulator'
import CBAMEmailTemplate from '@/components/CBAMEmailTemplate'
import CBAMVerifier from '@/components/cbam/CBAMVerifier'

// Forzar renderizado dinámico (SSR) - los datos vienen de Supabase
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // ISR: revalidar cada hora

export default async function CBAMPage() {
  // Fetch paralelo de todos los datos desde Supabase (con fallback a hardcoded)
  const [
    nextDeadline,
    sectors,
    timeline,
    excludedCountries,
    certificates,
    markupSchedule,
    downstreamExtension,
    threshold,
  ] = await Promise.all([
    getNextDeadlineDB(),
    getSectors(),
    getTimeline(),
    getExcludedCountries(),
    getCertificates(),
    getDefaultValueMarkupSchedule(),
    getDownstreamExtension(),
    getThreshold(),
  ])

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const cbamFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Qué es el CBAM?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El CBAM (Carbon Border Adjustment Mechanism) es el Mecanismo de Ajuste en Frontera por Carbono de la UE. Desde enero de 2026, los importadores de productos intensivos en carbono (acero, aluminio, cemento, fertilizantes, electricidad e hidrógeno) deben comprar certificados CBAM para cubrir las emisiones de CO₂ embebidas en sus importaciones.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué productos están afectados por el CBAM?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El CBAM afecta a 6 sectores: cemento, hierro y acero, aluminio, fertilizantes, electricidad e hidrógeno. En total, 573 códigos CN están cubiertos. Desde 2028, se prevé la extensión a productos downstream (productos fabricados con materiales CBAM).',
        },
      },
      {
        '@type': 'Question',
        name: '¿Hay un umbral mínimo para el CBAM?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí. Los importadores con un volumen anual inferior a 50 toneladas de mercancías CBAM están exentos de las obligaciones del mecanismo (Reglamento UE 2025/2083). Esta exención no aplica a electricidad ni hidrógeno.',
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <JsonLd data={cbamFaqSchema} />
      {/* Botón flotante "CBAM para Dummies" */}
      <Link href="/cbam/guia" className="fixed bottom-6 right-6 z-50 group">
        <div className="bg-[#0A3D5C] text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2 border border-white/10">
          <span className="text-xl">📚</span>
          <span className="font-bold">¿Qué es el CBAM?</span>
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>

      {/* ═══ HERO DARK ═══ */}
      <div className="bg-[#0A3D5C] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAyYzguODM3IDAgMTYgNy4xNjMgMTYgMTZzLTcuMTYzIDE2LTE2IDE2LTE2LTcuMTYzLTE2LTE2IDcuMTYzLTE2IDE2LTE2eiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDIiLz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Hero content */}
            <div className="lg:col-span-2">
              <span className="inline-block px-3 py-1 bg-white/10 border border-white/10 rounded-full text-sm font-medium text-white/80 mb-4">
                Reglamento (UE) 2023/956
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
                CBAM — Carbon Border<br />Adjustment Mechanism
              </h1>
              <p className="text-white/60 text-lg max-w-xl mb-6">
                El Mecanismo de Ajuste en Frontera por Carbono de la UE.
                Verifica si tus importaciones están afectadas y conoce tus obligaciones.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/cbam/assessment" className="inline-flex items-center px-5 py-2.5 bg-[#F4C542] text-[#0A3D5C] font-bold rounded-xl hover:bg-[#F4C542]/90 transition-all gap-2">
                  Autoevaluación CBAM
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                </Link>
                <Link href="/cbam/guia" className="inline-flex items-center px-5 py-2.5 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-all gap-2">
                  Guía CBAM
                </Link>
              </div>
            </div>

            {/* Próximo Deadline */}
            {nextDeadline && (
              <div className={`rounded-2xl p-6 ${
                nextDeadline.isUrgent
                  ? 'bg-red-500/20 border border-red-400/30'
                  : 'bg-white/[0.06] border border-white/[0.1]'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">⏰</span>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider">Próximo Plazo</h3>
                </div>
                <div className={`text-5xl font-bold mb-2 ${nextDeadline.isUrgent ? 'text-red-400' : 'text-[#F4C542]'}`}>
                  {nextDeadline.daysLeft}
                </div>
                <p className="text-white/40 text-sm mb-1">días restantes</p>
                <p className="font-medium text-white/80 mb-1">{nextDeadline.quarter}</p>
                <p className="text-sm text-white/40">
                  Límite: {formatDate(nextDeadline.deadline)}
                </p>
                {nextDeadline.status === 'critical' && (
                  <div className="mt-3 p-2.5 bg-red-500/20 border border-red-400/20 rounded-lg">
                    <p className="text-sm font-medium text-red-300">
                      ¡Comienza la obligación de comprar certificados!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* CTA Self-Assessment */}
        <Link href="/cbam/assessment" className="block group -mt-4">
          <div className="bg-white border-2 border-[#F4C542]/30 rounded-2xl p-6 hover:border-[#F4C542]/60 hover:shadow-lg transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#F4C542]/10 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  🔍
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">Autoevaluación CBAM</h3>
                    <span className="px-2 py-0.5 bg-[#F4C542]/20 text-[#0A3D5C] text-xs font-bold rounded-full">GRATIS</span>
                  </div>
                  <p className="text-gray-500 text-sm">
                    Verifica si tu importación está sujeta al CBAM. Informe con benchmarks, precursores y datos a solicitar al proveedor.
                  </p>
                  <p className="text-[#0A3D5C] text-xs font-medium mt-1">573 códigos CN | 246 países | Benchmarks oficiales Reg. (UE) 2025/2620</p>
                </div>
              </div>
              <svg className="w-6 h-6 text-[#F4C542] group-hover:translate-x-1 transition-transform hidden md:block" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Banner Novedades */}
        <div className="bg-[#0A3D5C] rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F4C542]/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#F4C542]/20 text-[#F4C542] rounded-full text-sm font-bold">
                ACTUALIZACIÓN DIC 2025
              </span>
            </div>
            <h2 className="text-xl font-bold mb-4">Paquete Regulatorio CBAM</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl p-4">
                <h3 className="font-bold mb-1 text-sm">Precios Semanales</h3>
                <p className="text-sm text-white/60">Desde 2027, precio basado en media semanal EU ETS</p>
              </div>
              <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl p-4">
                <h3 className="font-bold mb-1 text-sm">Penalización +30%</h3>
                <p className="text-sm text-white/60">Markup progresivo: 10% → 20% → 30%</p>
              </div>
              <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl p-4">
                <h3 className="font-bold mb-1 text-sm">+180 Códigos CN</h3>
                <p className="text-sm text-white/60">Extensión 2028 a productos downstream</p>
              </div>
            </div>
          </div>
        </div>

        {/* Verificador de Código */}
        <CBAMVerifier threshold={threshold} />

        {/* Simulador de Costes */}
        <CBAMCostSimulator />

        {/* Precio de Certificados CBAM */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-[#0A3D5C] px-8 py-5">
            <h2 className="text-xl font-bold text-white mb-0.5">Precio de Certificados CBAM</h2>
            <p className="text-white/50 text-sm">Según Reglamento de Ejecución C(2025) 8560</p>
          </div>
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="rounded-xl p-6 border-2 border-[#0A3D5C]/20 bg-[#0A3D5C]/[0.02]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-[#0A3D5C] text-white text-sm font-bold rounded-full">2026</span>
                  <span className="text-[#0A3D5C] font-bold">Precio TRIMESTRAL</span>
                </div>
                <div className="space-y-3 text-gray-600 text-sm">
                  <p>Media del trimestre anterior</p>
                  <p><strong>4 precios/año</strong></p>
                  <p>Publicación: 1er día hábil del trimestre</p>
                </div>
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm text-emerald-700"><strong>Más estable:</strong> Menor volatilidad, más predecible</p>
                </div>
              </div>
              <div className="rounded-xl p-6 border-2 border-amber-300 bg-amber-50/50">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-amber-500 text-white text-sm font-bold rounded-full">2027+</span>
                  <span className="text-amber-700 font-bold">Precio SEMANAL</span>
                </div>
                <div className="space-y-3 text-gray-600 text-sm">
                  <p>Media de la semana anterior</p>
                  <p><strong>~52 precios/año</strong></p>
                  <p>Publicación: 1er día hábil de la semana</p>
                </div>
                <div className="mt-4 p-3 bg-amber-100 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800"><strong>Impacto:</strong> Mayor volatilidad, seguimiento frecuente</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h4 className="font-bold text-gray-800 mb-3 text-sm">Metodología de cálculo</h4>
              <ul className="space-y-1.5 text-gray-600 text-sm">
                <li className="flex items-start gap-2"><span className="text-[#0A3D5C] mt-0.5">•</span>Precio = Media ponderada por volumen subastado de precios de subasta EU ETS</li>
                <li className="flex items-start gap-2"><span className="text-[#0A3D5C] mt-0.5">•</span>Unidad: EUR por tonelada de CO2 equivalente (EUR/tCO2e)</li>
                <li className="flex items-start gap-2"><span className="text-[#0A3D5C] mt-0.5">•</span>Precisión: Redondeado a 2 decimales</li>
                <li className="flex items-start gap-2"><span className="text-[#0A3D5C] mt-0.5">•</span>Fuentes: Plataformas de subasta EU ETS (EEX, ICE)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Penalización Valores por Defecto */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-red-600 px-8 py-5">
            <h2 className="text-xl font-bold text-white mb-0.5">Penalización sobre Valores por Defecto</h2>
            <p className="text-red-100/60 text-sm">Markup progresivo según Reglamento C(2025) 8552</p>
          </div>
          <div className="p-8">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-800 text-sm">
                <strong>¿Qué significa?</strong> Si declaras emisiones usando valores por defecto
                (en lugar de emisiones reales verificadas del fabricante), se aplica un recargo
                progresivo para incentivar la obtención de datos reales.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {markupSchedule.map((item) => (
                <div key={item.year} className={`rounded-xl p-6 text-center border-2 ${
                  item.year === 2026 ? 'border-yellow-300 bg-yellow-50' : item.year === 2027 ? 'border-orange-300 bg-orange-50' : 'border-red-300 bg-red-50'
                }`}>
                  <div className={`text-4xl font-bold mb-2 ${
                    item.year === 2026 ? 'text-yellow-600' : item.year === 2027 ? 'text-orange-600' : 'text-red-600'
                  }`}>{item.label}</div>
                  <div className="text-xl font-bold text-gray-800 mb-1">{item.year}</div>
                  <div className="text-sm text-gray-600">{item.description}</div>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <h4 className="font-bold text-gray-800 mb-4 text-sm">Ejemplo práctico: Acero crudo</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Año</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Valor base</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Markup</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Valor ajustado</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Sobrecoste</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="px-4 py-3 font-medium">2026</td><td className="px-4 py-3 font-mono">1.080 tCO2/t</td><td className="px-4 py-3 text-yellow-600 font-bold">+10%</td><td className="px-4 py-3 font-mono font-bold">1.188 tCO2/t</td><td className="px-4 py-3 text-red-600">+0.108 tCO2/t</td></tr>
                    <tr><td className="px-4 py-3 font-medium">2027</td><td className="px-4 py-3 font-mono">1.080 tCO2/t</td><td className="px-4 py-3 text-orange-600 font-bold">+20%</td><td className="px-4 py-3 font-mono font-bold">1.296 tCO2/t</td><td className="px-4 py-3 text-red-600">+0.216 tCO2/t</td></tr>
                    <tr className="bg-red-50"><td className="px-4 py-3 font-medium">2028+</td><td className="px-4 py-3 font-mono">1.080 tCO2/t</td><td className="px-4 py-3 text-red-600 font-bold">+30%</td><td className="px-4 py-3 font-mono font-bold">1.404 tCO2/t</td><td className="px-4 py-3 text-red-600 font-bold">+0.324 tCO2/t</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">✅</span>
                <div>
                  <h4 className="font-bold text-emerald-800 mb-1 text-sm">Excepción: Productos downstream complejos</h4>
                  <p className="text-emerald-700 text-sm">
                    Los productos derivados que combinan múltiples sectores o precursores pueden usar
                    valores por defecto <strong>SIN markup</strong> debido a la dificultad técnica
                    de rastrear emisiones en cadenas de suministro complejas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Extensión Productos Downstream 2028 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-[#0A3D5C] px-8 py-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-0.5">Extensión a Productos Downstream (2028)</h2>
              <p className="text-white/50 text-sm">Propuesta COM(2025) 989 — Aplicación prevista 01/01/2028</p>
            </div>
            <span className="px-3 py-1 bg-[#F4C542]/20 text-[#F4C542] text-xs font-bold rounded-full hidden sm:block">PROPUESTA</span>
          </div>
          <div className="p-8">
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-[#0A3D5C] rounded-xl p-6 text-white text-center">
                <div className="text-4xl font-bold mb-1 text-[#F4C542]">~{downstreamExtension.stats.newCNCodes}</div>
                <div className="text-white/50 text-sm">Nuevos códigos CN</div>
              </div>
              <div className="bg-[#0A3D5C] rounded-xl p-6 text-white text-center">
                <div className="text-4xl font-bold mb-1 text-[#F4C542]">~{(downstreamExtension.stats.newImporters / 1000).toFixed(1)}k</div>
                <div className="text-white/50 text-sm">Nuevos importadores</div>
              </div>
              <div className="bg-[#0A3D5C] rounded-xl p-6 text-white text-center">
                <div className="text-4xl font-bold mb-1 text-[#F4C542]">~{(downstreamExtension.stats.newSMEs / 1000).toFixed(1)}k</div>
                <div className="text-white/50 text-sm">PYMEs afectadas</div>
              </div>
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Sectores incluidos en la extensión</h3>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {downstreamExtension.sectors.map((sector) => (
                <div key={sector.id} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{sector.icon}</span>
                    <h4 className="font-bold text-gray-800">{sector.name}</h4>
                  </div>
                  <ul className="space-y-1">
                    {sector.examples.map((example, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-[#0A3D5C] mt-0.5">•</span><span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="font-bold text-gray-700 mb-2 text-sm">NO incluidos en esta extensión:</h4>
              <div className="flex flex-wrap gap-2">
                {downstreamExtension.notIncluded.map((item, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs">{item}</span>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500">La extensión a productos derivados de cemento, fertilizantes e hidrógeno se evaluará en futuras revisiones.</p>
            </div>
            <div className="mt-6 bg-[#0A3D5C]/5 rounded-xl p-4 border border-[#0A3D5C]/10">
              <h4 className="font-bold text-[#0A3D5C] mb-2 text-sm">Criterios de selección de productos</h4>
              <div className="grid sm:grid-cols-3 gap-3">
                {downstreamExtension.selectionCriteria.map((criterion, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[#0A3D5C]/80">
                    <span className="w-5 h-5 bg-[#0A3D5C] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</span>
                    <span className="text-sm">{criterion}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sectores Afectados */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Sectores Afectados</h2>
          <p className="text-gray-500 text-sm mb-6">Productos sujetos al CBAM por sector industrial</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectors.map((sector) => (
              <div key={sector.id} className={`bg-gradient-to-br ${sector.color} rounded-xl p-6 text-white shadow-sm hover:shadow-md transition-shadow`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{sector.icon}</span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">{sector.emissions}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${sector.deMinimisApplies ? 'bg-blue-400/30' : 'bg-red-400/30'}`}>
                      {sector.deMinimisApplies ? 'De minimis' : 'Sin umbral'}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">{sector.name}</h3>
                <p className="text-white/70 text-sm mb-3">{sector.description}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium">Gases:</span>
                  <span className="px-2 py-0.5 bg-white/20 rounded">{Array.isArray(sector.gases) ? sector.gases.join(', ') : sector.gases}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Países Excluidos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-emerald-600 px-8 py-5">
            <h2 className="text-xl font-bold text-white mb-0.5">Países y Territorios Excluidos del CBAM</h2>
            <p className="text-emerald-100/60 text-sm">Importaciones NO sujetas al CBAM (Anexo III del Reglamento)</p>
          </div>
          <div className="p-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {excludedCountries.map((country) => (
                <div key={country.code} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-[#0A3D5C]">{country.code}</span>
                    <span className="text-gray-700 font-medium text-sm">{country.name}</span>
                  </div>
                  <p className="text-xs text-gray-500">{country.reason}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <strong>Nota:</strong> Si importas desde estos países, puedes declarar la exención
              con el certificado <strong>Y134</strong> (territorios especiales) o simplemente no aplican
              las obligaciones CBAM (países ETS).
            </p>
          </div>
        </div>

        {/* Certificados Necesarios */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-[#0A3D5C] px-8 py-5">
            <h2 className="text-xl font-bold text-white mb-0.5">Certificados CBAM para Declaración Aduanera</h2>
            <p className="text-white/50 text-sm">Códigos a declarar en el DUA desde el 01/01/2026 (medida tipo 775)</p>
          </div>
          <div className="p-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Descripción</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Aplicación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {certificates.map((cert) => (
                    <tr key={cert.code} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <span className="font-mono font-bold text-[#0A3D5C] bg-[#0A3D5C]/5 px-2 py-1 rounded">{cert.code}</span>
                      </td>
                      <td className="px-4 py-4 text-gray-700 text-sm">{cert.description}</td>
                      <td className="px-4 py-4">
                        {cert.required ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Obligatorio</span>
                        ) : cert.appliesTo ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Solo {Array.isArray(cert.appliesTo) ? cert.appliesTo.join(', ') : cert.appliesTo}</span>
                        ) : cert.notAppliesTo ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Excepto {Array.isArray(cert.notAppliesTo) ? cert.notAppliesTo.join(', ') : cert.notAppliesTo}</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Exención</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">
                <strong>Importante:</strong> Sin uno de estos certificados válidos, la importación
                será rechazada (condición Y060 — &quot;None of the conditions above apply&quot;).
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-[#0A3D5C] px-8 py-5">
            <h2 className="text-xl font-bold text-white mb-0.5">Calendario CBAM</h2>
            <p className="text-white/50 text-sm">Fechas clave del período transitorio y fase definitiva — Actualizado Dic 2025</p>
          </div>
          <div className="p-8">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              {timeline.map((event, index) => (
                <div key={index} className="relative pl-12 pb-8 last:pb-0">
                  <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    event.status === 'completed' ? 'bg-emerald-500'
                    : event.status === 'critical' ? 'bg-red-500 animate-pulse'
                    : event.status === 'upcoming' ? 'bg-amber-500'
                    : 'bg-gray-300'
                  }`}>
                    {event.status === 'completed' ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    ) : event.status === 'critical' ? (
                      <span className="text-white text-xs font-bold">!</span>
                    ) : (
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className={`p-4 rounded-lg ${
                    event.status === 'critical' ? 'bg-red-50 border-2 border-red-200'
                    : event.status === 'upcoming' ? 'bg-amber-50 border border-amber-200'
                    : event.isNew ? 'bg-purple-50 border-2 border-purple-300'
                    : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold text-sm ${event.status === 'critical' ? 'text-red-700' : 'text-gray-800'}`}>{event.title}</h3>
                        {event.isNew && <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full">NUEVO</span>}
                      </div>
                      <span className={`text-xs font-medium ${
                        event.status === 'completed' ? 'text-emerald-600' : event.status === 'critical' ? 'text-red-600' : 'text-gray-500'
                      }`}>{formatDate(event.date)}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Umbral de minimis */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#0A3D5C]/10 rounded-xl flex-shrink-0">
              <svg className="w-6 h-6 text-[#0A3D5C]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" /></svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Umbral de Minimis — Exención por volumen</h3>
              <p className="text-gray-600 text-sm mb-4">
                Según el Reglamento (UE) 2025/2083, los importadores con un volumen anual inferior a{' '}
                <strong>{threshold.massThreshold || threshold.mass_threshold || 50} toneladas</strong> de mercancías CBAM
                están exentos de las obligaciones del mecanismo.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="px-3 py-1.5 bg-[#0A3D5C]/10 text-[#0A3D5C] rounded-full font-medium">Umbral: {threshold.massThreshold || threshold.mass_threshold || 50}t/año</span>
                <span className="px-3 py-1.5 bg-[#0A3D5C]/10 text-[#0A3D5C] rounded-full font-medium">Certificado: Y137</span>
                <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full font-medium">No aplica a: Electricidad, Hidrógeno</span>
              </div>
            </div>
          </div>
        </div>

        {/* Plantilla Email Proveedor */}
        <CBAMEmailTemplate />

        {/* Recursos */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Recursos Oficiales</h3>
            <ul className="space-y-3">
              {[
                { href: 'https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_es', label: 'Portal CBAM de la Comisión Europea' },
                { href: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32023R0956', label: 'Reglamento (UE) 2023/956 — EUR-Lex' },
                { href: 'https://cbam.ec.europa.eu/', label: 'Registro Transitorio CBAM' },
                { href: 'https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-legislation-and-guidance_en', label: 'Legislación CBAM — Paquete Dic 2025' },
              ].map((link) => (
                <li key={link.href}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#0A3D5C] hover:text-[#0A3D5C]/70 text-sm transition-colors">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Herramientas LexAduana</h3>
            <ul className="space-y-3">
              {[
                { href: '/calculadora', icon: '🧮', label: 'Calculadora de Aranceles' },
                { href: '/clasificador', icon: '🤖', label: 'Clasificador IA de Productos' },
                { href: '/comparador', icon: '📊', label: 'Comparador Multi-Origen' },
                { href: '/eudr', icon: '🌳', label: 'Regulación Deforestación (EUDR)' },
                { href: '/oea', icon: '🛡️', label: 'OEA — Operador Económico Autorizado' },
                { href: '/cbam/asesoria', icon: '📋', label: 'Asesoría CBAM Profesional' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="flex items-center gap-2 text-[#0A3D5C] hover:text-[#0A3D5C]/70 text-sm transition-colors">
                    <span>{link.icon}</span>{link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA Final */}
        <div className="bg-[#0A3D5C] rounded-2xl p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#F4C542]/5 to-transparent"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-3">¿Necesitas calcular aranceles de productos CBAM?</h2>
            <p className="text-white/50 mb-6 max-w-2xl mx-auto text-sm">
              Usa nuestra calculadora para obtener aranceles, IVA y alertas automáticas de productos afectados por CBAM.
            </p>
            <Link href="/calculadora" className="inline-flex items-center px-6 py-3 bg-[#F4C542] text-[#0A3D5C] font-bold rounded-xl hover:bg-[#F4C542]/90 transition-colors gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              Ir a la Calculadora
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
