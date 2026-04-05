'use client'

import IncotermsTable from '@/components/incoterms/IncotermsTable'
import IncotermsCustomsValue from '@/components/incoterms/IncotermsCustomsValue'
import IncotermsWizard from '@/components/incoterms/IncotermsWizard'
import IncotermsSEO from '@/components/incoterms/IncotermsSEO'

export default function IncotermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A3D5C] via-[#0D5A8A] to-[#1A6FA0] py-16 md:py-20">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 text-[200px] leading-none">📦</div>
          <div className="absolute bottom-10 right-10 text-[150px] leading-none">🚢</div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <span className="inline-block px-4 py-2 bg-white/15 backdrop-blur-sm text-blue-100 rounded-full text-sm font-medium mb-6 border border-white/20">
            Reglas ICC — Vigentes desde el 1 de enero de 2020
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Incoterms 2020:{' '}
            <span className="text-blue-200">Guía Completa</span>
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8 leading-relaxed">
            Los 11 términos comerciales internacionales explicados con tabla interactiva,
            ejemplos prácticos y su impacto en el valor en aduana.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#tabla-incoterms"
              className="px-7 py-3 bg-white text-[#0A3D5C] font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl text-sm hover:bg-blue-50"
            >
              Ver tabla interactiva
            </a>
            <a
              href="#wizard-incoterms"
              className="px-7 py-3 bg-transparent border border-white/30 hover:border-white/50 text-white rounded-lg transition-all text-sm"
            >
              ¿Qué Incoterm necesito?
            </a>
          </div>
        </div>
      </section>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Bloque 1 — Tabla interactiva */}
        <IncotermsTable />

        {/* Bloque 2 — Valor en aduana */}
        <IncotermsCustomsValue />

        {/* Bloque 3 — Wizard de decisión */}
        <IncotermsWizard />

        {/* Bloque 4 — Contenido SEO */}
        <IncotermsSEO />
      </div>
    </div>
  )
}
