import { getAllCountries } from '@/lib/cbamService'
import CBAMSelfAssessment from '@/components/cbam/CBAMSelfAssessment'


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
