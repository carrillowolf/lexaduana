import { getAllCountries } from '@/lib/cbamService'
import CBAMSelfAssessment from '@/components/cbam/CBAMSelfAssessment'
import AssessmentHero from '@/components/cbam/AssessmentHero'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata = {
  title: 'Autoevaluación CBAM | LexAduana',
  description: 'Verifica si tu importación está sujeta al CBAM. Informe gratuito e instantáneo con requisitos, benchmarks y datos a solicitar al proveedor.',
}

export default async function CBAMAssessmentPage() {
  let countries = []
  try {
    countries = await getAllCountries()
  } catch {
    countries = []
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Hero - client component for i18n */}
      <AssessmentHero />

      {/* Assessment Component */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <CBAMSelfAssessment countries={countries} />
      </section>
    </div>
  )
}
