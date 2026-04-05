'use client'

import IncotermsTable from '@/components/incoterms/IncotermsTable'
import IncotermsCustomsValue from '@/components/incoterms/IncotermsCustomsValue'
import IncotermsWizard from '@/components/incoterms/IncotermsWizard'
import IncotermsSEO from '@/components/incoterms/IncotermsSEO'

export default function IncotermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0A3D5C] py-14 md:py-18">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAyYzguODM3IDAgMTYgNy4xNjMgMTYgMTZzLTcuMTYzIDE2LTE2IDE2LTE2LTcuMTYzLTE2LTE2IDcuMTYzLTE2IDE2LTE2eiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDIiLz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-block px-4 py-1.5 bg-white/10 border border-white/10 text-white/70 rounded-full text-sm font-medium mb-5">
            Reglas ICC — Vigentes desde el 1 de enero de 2020
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
            Incoterms 2020:{' '}
            <span className="text-[#F4C542]">Guía Completa</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8 leading-relaxed">
            Los 11 términos comerciales internacionales explicados con tabla interactiva,
            ejemplos prácticos y su impacto en el valor en aduana.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#tabla-incoterms"
              className="px-7 py-3 bg-[#F4C542] text-[#0A3D5C] font-bold rounded-xl transition-all hover:bg-[#F4C542]/90 text-sm"
            >
              Ver tabla interactiva
            </a>
            <a
              href="#wizard-incoterms"
              className="px-7 py-3 bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-xl transition-all text-sm"
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
