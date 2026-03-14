import Link from 'next/link'

export default function TargetAudience() {
  const profiles = [
    {
      icon: '🏢',
      title: 'Importadores',
      subtitle: 'Empresas que importan regularmente',
      benefits: [
        'Control total de costes de importación',
        'Historial completo de cálculos',
        'Exportación a Excel para contabilidad',
        'Conversión automática de monedas'
      ],
      cta: 'Optimiza tus importaciones',
      color: 'blue'
    },
    {
      icon: '🛃',
      title: 'Agentes de Aduanas',
      subtitle: 'Profesionales del despacho',
      benefits: [
        'Cálculos rápidos y precisos',
        'Alertas TARIC automáticas',
        'Procesamiento masivo (bulk)',
        'Datos oficiales actualizados'
      ],
      cta: 'Acelera tus despachos',
      color: 'yellow'
    },
    {
      icon: '💼',
      title: 'Consultores Fiscales',
      subtitle: 'Asesores especializados',
      benefits: [
        'Herramienta profesional para clientes',
        'Cumplimiento normativo garantizado',
        'Reportes exportables',
        'Base de datos completa TARIC'
      ],
      cta: 'Asesora con precisión',
      color: 'green'
    }
  ]

  return (
    <div className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0A3D5C] mb-4">
              ¿Para quién es LexAduana?
            </h2>
            <p className="text-xl text-gray-600">
              Profesionales que necesitan cálculos precisos y cumplimiento garantizado
            </p>
          </div>

          {/* Grid de perfiles */}
          <div className="grid md:grid-cols-3 gap-8">
            {profiles.map((profile, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-shadow"
              >
                <div className="text-6xl mb-4 text-center">{profile.icon}</div>
                
                <h3 className="text-2xl font-bold text-[#0A3D5C] mb-2 text-center">
                  {profile.title}
                </h3>
                
                <p className="text-gray-600 text-center mb-6">
                  {profile.subtitle}
                </p>

                <ul className="space-y-3 mb-8">
                  {profile.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-[#F4C542] mr-2 text-xl">✓</span>
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/register"
                  className="block text-center px-6 py-3 bg-[#0A3D5C] text-white font-semibold rounded-lg hover:bg-[#083249] transition"
                >
                  {profile.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
