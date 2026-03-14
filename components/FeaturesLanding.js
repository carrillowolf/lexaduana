export default function FeaturesLanding() {
  const features = [
    {
      icon: '🎯',
      title: 'Precisión Oficial',
      description: '49,700 registros TARIC actualizados mensualmente. Cumplimiento garantizado con normativa UE 2447/2015.',
      highlight: 'Datos del BOE'
    },
    {
      icon: '💱',
      title: '30 Monedas Oficiales',
      description: 'Conversión automática con tipos de cambio del Banco Central Europeo. Actualización mensual según BOE.',
      highlight: 'BCE Oficial'
    },
    {
      icon: '📊',
      title: 'Cálculo Masivo',
      description: 'Procesa hasta 100 productos simultáneamente. Sube CSV/Excel y obtén resultados consolidados en segundos.',
      highlight: 'Bulk Processing'
    },
    {
      icon: '⚠️',
      title: 'Alertas TARIC',
      description: '15,281 medidas identificadas automáticamente. Certificados, licencias, sanciones y requisitos especiales.',
      highlight: '15.2K Medidas'
    },
    {
      icon: '🧮',
      title: 'IVA Variable Inteligente',
      description: 'Aplicación automática de 4%, 10% o 21% según producto. Sistema basado en normativa española vigente.',
      highlight: '3 Tipos IVA'
    },
    {
      icon: '📤',
      title: 'Exportación Profesional',
      description: 'Descarga historial completo en Excel. Reportes con totales consolidados listos para contabilidad.',
      highlight: 'Excel Ready'
    }
  ]

  return (
    <div className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0A3D5C] mb-4">
              Más que una calculadora
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Plataforma completa de gestión aduanera con datos oficiales, 
              automatización inteligente y cumplimiento normativo garantizado
            </p>
          </div>

          {/* Grid de features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 bg-gray-50 rounded-xl hover:bg-[#0A3D5C] transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-[#F4C542]"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                
                <div className="mb-2 inline-block px-3 py-1 bg-[#F4C542] text-[#0A3D5C] text-xs font-bold rounded-full group-hover:bg-white">
                  {feature.highlight}
                </div>

                <h3 className="text-xl font-bold text-[#0A3D5C] mb-3 group-hover:text-white">
                  {feature.title}
                </h3>

                <p className="text-gray-600 group-hover:text-gray-200">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA secundario */}
          <div className="mt-16 text-center">
            <div className="inline-block p-8 bg-gradient-to-r from-[#0A3D5C] to-[#0d5279] rounded-xl text-white">
              <h3 className="text-2xl font-bold mb-3">
                ¿Necesitas procesar múltiples importaciones?
              </h3>
              <p className="text-gray-200 mb-6">
                Nuestra calculadora masiva procesa hasta 100 productos simultáneamente
              </p>
              <a 
                href="/bulk"
                className="inline-block px-8 py-4 bg-[#F4C542] text-[#0A3D5C] font-bold rounded-lg hover:bg-[#E5B63A] transition"
              >
                Probar Cálculo Masivo →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
