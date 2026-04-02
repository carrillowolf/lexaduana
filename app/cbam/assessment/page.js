import { getAllCountries } from '@/lib/cbamService'
import CBAMSelfAssessment from '@/components/cbam/CBAMSelfAssessment'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata = {
  title: 'Autoevaluación CBAM | LexAduana',
  description: 'Verifica si tu importación está sujeta al CBAM. Informe gratuito e instantáneo con requisitos, benchmarks y datos a solicitar al proveedor.',
}

export default async function CBAMAssessmentPage() {
  // Cargar países desde Supabase (server-side)
  let countries = []
  try {
    countries = await getAllCountries()
  } catch {
    // Fallback se maneja dentro del componente client
    countries = []
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/cbam" className="text-gray-500 hover:text-gray-700 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <div>
              <h1 className="font-bold text-gray-900">Autoevaluación CBAM</h1>
              <p className="text-xs text-gray-500">Verificador gratuito de obligaciones CBAM</p>
            </div>
          </div>
          <Link
            href="/cbam"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] transition-colors"
          >
            Hub CBAM
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
              Herramienta gratuita
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              ¿Tu importación está sujeta al{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                CBAM
              </span>
              ?
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              Introduce el código CN, el país de origen y obtén un informe instantáneo con todos los
              requisitos, benchmarks y datos que necesitas pedir a tu proveedor.
            </p>
            <p className="text-sm text-gray-400">
              Basado en 573 códigos CN del Self Assessment Tool oficial de la Comisión Europea (v1.1, marzo 2025)
              y benchmarks del Reg. (UE) 2025/2620
            </p>
          </div>
        </div>
      </section>

      {/* Assessment Component */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <CBAMSelfAssessment countries={countries} />
      </section>
    </div>
  )
}
