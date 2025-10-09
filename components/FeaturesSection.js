'use client'

export default function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Cálculo instantáneo",
      description: "Obtén aranceles e IVA en segundos con nuestra calculadora optimizada"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "70+ Acuerdos internacionales",
      description: "Base de datos completa con todos los acuerdos comerciales de la UE"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      title: "Autocompletado inteligente",
      description: "Encuentra códigos HS rápidamente con nuestro sistema de búsqueda predictiva"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: "Exportación a PDF",
      description: "Genera documentos profesionales con todos los cálculos detallados"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Historial de búsquedas",
      description: "Accede rápidamente a tus consultas recientes para mayor productividad"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      title: "Actualización mensual",
      description: "Base de datos sincronizada con EUR-Lex para máxima precisión"
    }
  ]

  return (
    <div id="features" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Todo lo que necesitas para calcular aranceles
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Herramientas profesionales diseñadas para agilizar tu trabajo en comercio internacional
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        
        {/* CTA Section */}
        <div className="mt-20 text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-4">
            ¿Listo para optimizar tus cálculos aduaneros?
          </h3>
          <p className="text-xl mb-8 text-blue-100">
            Únete a cientos de profesionales que ya confían en Lexaduana
          </p>
          <button
            onClick={() => document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transform hover:scale-105 transition-all duration-200"
          >
            Empezar ahora - Es gratis
          </button>
        </div>
      </div>
    </div>
  )
}
