import Link from 'next/link'
import { getAllCountries, getCBAMApplicableCountries } from '@/lib/cbamAssessmentData'

import AdvisoryIntakeForm from '@/components/cbam/advisory/AdvisoryIntakeForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Solicitar Asesoría CBAM | LexAduana',
  description: 'Formulario de solicitud de asesoría CBAM profesional. Envíanos tus datos de empresa, productos y proveedores.',
}

export default async function SolicitudPage() {
  // Cargar países desde los datos de assessment (mismo patrón que Phase 1)
  let countries = []
  try {
    const allCountries = getCBAMApplicableCountries()
    countries = allCountries.map(c => ({
      code: c.code,
      name: c.name,
    }))
  } catch (err) {
    console.error('Error cargando países:', err)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/cbam/asesoria" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Asesoría CBAM
          </Link>
          <Link href="/" className="text-sm font-medium text-[#0A3D5C]">LexAduana</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0A3D5C]">Solicitud de Asesoría CBAM</h1>
          <p className="text-sm text-gray-600 mt-1">
            Completa los siguientes pasos para que nuestro equipo pueda analizar tu exposición al CBAM.
          </p>
        </div>

        <AdvisoryIntakeForm countries={countries} />
      </main>
    </div>
  )
}
