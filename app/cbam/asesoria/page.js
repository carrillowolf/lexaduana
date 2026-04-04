import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata = {
  title: 'Asesoría CBAM Profesional | LexAduana',
  description: 'Servicio profesional de asesoría CBAM. Analizamos tus importaciones, calculamos tu exposición y te entregamos un informe con tus obligaciones y costes estimados.',
}

export default function AdvisoryLandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0A3D5C] mb-4">
            Servicio de Asesoría CBAM Profesional
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Analizamos tus importaciones, calculamos tu exposición al CBAM, y te entregamos un
            informe profesional con tus obligaciones y costes estimados.
          </p>
        </div>

        {/* Cómo funciona */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-8">¿Cómo funciona?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-[#0A3D5C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-[#0A3D5C]">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Nos envías tus datos</h3>
              <p className="text-sm text-gray-600">
                Rellena el formulario con los datos de tu empresa, productos importados y proveedores.
                Sube tus DUAs si los tienes.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-[#0A3D5C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-[#0A3D5C]">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Analizamos tu exposición</h3>
              <p className="text-sm text-gray-600">
                Nuestro equipo clasifica tus productos, identifica qué sectores CBAM te afectan,
                y contacta a tus proveedores para obtener datos reales de emisiones.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-[#0A3D5C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-[#0A3D5C]">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Recibes tu informe</h3>
              <p className="text-sm text-gray-600">
                Un informe profesional con tu análisis de exposición, cálculo de emisiones,
                estimación de costes en certificados CBAM, y recomendaciones de acción.
              </p>
            </div>
          </div>
        </div>

        {/* Por qué datos reales */}
        <div className="mb-16 bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">¿Por qué necesitas datos reales de emisiones?</h2>

          <div className="space-y-4 text-gray-700">
            <p>
              Si no aportas datos reales de emisiones de tu proveedor, el coste CBAM se calcula con los{' '}
              <strong>valores por defecto de la UE</strong>, que incluyen un recargo progresivo
              (+10% en 2026, +20% en 2027, +30% en 2028) que encarece significativamente tu factura.
            </p>
            <p>
              Nosotros te ayudamos a conseguir esos datos de tus proveedores para{' '}
              <strong>reducir tu coste CBAM real</strong>.
            </p>
          </div>

          {/* Ejemplo visual */}
          <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
              Ejemplo: Importación de 500t de acero desde Turquía
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs text-red-600 font-medium mb-1">Con valores por defecto</p>
                <p className="text-2xl font-bold text-red-700">~32.500 &euro;</p>
                <p className="text-xs text-red-500 mt-1">al año (con markup 2026)</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs text-green-600 font-medium mb-1">Con datos reales</p>
                <p className="text-2xl font-bold text-green-700">~18.700 &euro;</p>
                <p className="text-xs text-green-500 mt-1">al año (EAF, proveedor eficiente)</p>
              </div>
              <div className="text-center p-4 bg-[#0A3D5C]/5 rounded-lg border border-[#0A3D5C]/10">
                <p className="text-xs text-[#0A3D5C] font-medium mb-1">Ahorro potencial</p>
                <p className="text-2xl font-bold text-[#0A3D5C]">~13.800 &euro;</p>
                <p className="text-xs text-[#0A3D5C]/70 mt-1">42% menos al año</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/cbam/asesoria/solicitud"
            className="inline-block px-8 py-4 bg-[#0A3D5C] text-white rounded-xl text-lg font-semibold hover:bg-[#0d5078] transition-colors shadow-lg shadow-[#0A3D5C]/20"
          >
            Solicitar asesoría CBAM
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            ¿Primero quieres saber si estás afectado?{' '}
            <Link href="/cbam/assessment" className="text-[#0A3D5C] hover:underline font-medium">
              Haz la autoevaluación gratuita
            </Link>
          </p>
        </div>
      </main>

    </div>
  )
}
