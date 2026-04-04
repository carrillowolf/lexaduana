'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CBAMGuiaPage() {
  const [activeQuestion, setActiveQuestion] = useState(null)

  const toggleQuestion = (index) => {
    setActiveQuestion(activeQuestion === index ? null : index)
  }

  const faqs = [
    {
      question: '¿Me afecta si importo poco?',
      answer: 'Si importas menos de 50 toneladas al año de productos CBAM (excepto electricidad e hidrógeno), estás exento. Pero ojo: son 50 toneladas sumando TODOS los productos CBAM que importes, no por cada tipo.'
    },
    {
      question: '¿Qué pasa si no cumplo?',
      answer: 'Sin el certificado de declarante autorizado CBAM, tu importación será rechazada en la aduana. Literalmente no podrás despachar la mercancía. Además, hay sanciones económicas por incumplimiento.'
    },
    {
      question: '¿Cuánto me va a costar?',
      answer: 'Depende de las emisiones de CO2 de tu producto y del precio del carbono en Europa (actualmente ~65-70€/tonelada de CO2). Por ejemplo: importar 100 toneladas de acero con emisiones de 1.5 tCO2/t te costaría aproximadamente 100 × 1.5 × 70€ = 10.500€ en certificados.'
    },
    {
      question: '¿Puedo evitar el CBAM?',
      answer: 'Legalmente, solo si: (1) importas desde países exentos (Noruega, Suiza, Islandia, Liechtenstein), (2) el producto tiene origen UE, (3) estás bajo el umbral de 50 toneladas, o (4) es para uso militar. No hay "trucos" - la UE está reforzando controles anti-elusión.'
    },
    {
      question: '¿Qué datos necesito del fabricante?',
      answer: 'Las emisiones reales de CO2 por tonelada de producto. Si no las tienes, puedes usar valores por defecto de la UE, pero desde 2026 tendrán una penalización del 10-30% extra. Conviene pedir los datos reales al proveedor.'
    },
    {
      question: '¿Es lo mismo que el arancel normal?',
      answer: 'No. El arancel es un impuesto a la importación basado en el valor o cantidad. El CBAM es un "ajuste por carbono" basado en las emisiones de CO2 del producto. Se pagan AMBOS, son cosas diferentes.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Hero */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
            📚 Guía para principiantes
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            CBAM explicado<br />
            <span className="text-emerald-600">en 5 minutos</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sin jerga técnica. Sin rodeos. Todo lo que necesitas saber sobre 
            el nuevo &quot;impuesto al carbono&quot; de la UE para importaciones.
          </p>
        </div>

        {/* ¿Qué es? - La analogía */}
        <section className="mb-16">
          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">🤔</span>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">¿Qué es el CBAM?</h2>
            </div>
            
            <div className="prose prose-lg max-w-none text-gray-600">
              <p className="text-xl leading-relaxed">
                Imagina que en Europa las fábricas pagan un &quot;impuesto por contaminar&quot; 
                (el EU ETS). Pero las fábricas de China, India o Turquía no lo pagan.
              </p>
              
              <div className="my-8 p-6 bg-amber-50 rounded-2xl border-2 border-amber-200">
                <p className="text-amber-800 font-medium text-lg mb-0">
                  💡 <strong>El problema:</strong> Es más barato fabricar fuera de Europa 
                  (porque no pagas por contaminar) y luego importar el producto.
                </p>
              </div>
              
              <p className="text-xl leading-relaxed">
                El <strong>CBAM</strong> (Mecanismo de Ajuste en Frontera por Carbono) 
                es la solución de la UE: <em>&quot;Si importas productos contaminantes, 
                pagas lo mismo que pagaría una fábrica europea&quot;</em>.
              </p>
            </div>

            {/* Analogía visual */}
            <div className="mt-10 grid md:grid-cols-2 gap-6">
              <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                <div className="text-3xl mb-3">❌</div>
                <h3 className="font-bold text-red-800 mb-2">Antes (sin CBAM)</h3>
                <p className="text-red-700">
                  Fábrica en China: 0€ por contaminar<br />
                  Fábrica en España: 70€/tonelada CO2<br />
                  <span className="font-bold">→ Ventaja desleal para importaciones</span>
                </p>
              </div>
              
              <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                <div className="text-3xl mb-3">✅</div>
                <h3 className="font-bold text-green-800 mb-2">Ahora (con CBAM)</h3>
                <p className="text-green-700">
                  Fábrica en China: 0€ (allí)<br />
                  + CBAM al importar: ~70€/tCO2<br />
                  <span className="font-bold">→ Mismo coste para todos</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ¿A quién afecta? */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl p-8 lg:p-12 text-white">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">🎯</span>
              <h2 className="text-2xl lg:text-3xl font-bold">¿Me afecta a mí?</h2>
            </div>
            
            <p className="text-xl text-blue-100 mb-8">
              Te afecta si importas CUALQUIERA de estos productos desde fuera de la UE:
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: '🏗️', name: 'Cemento', examples: 'Clínker, cementos Portland...' },
                { icon: '🔩', name: 'Hierro y Acero', examples: 'Perfiles, tubos, tornillos...' },
                { icon: '🥫', name: 'Aluminio', examples: 'Lingotes, chapas, cables...' },
                { icon: '🌱', name: 'Fertilizantes', examples: 'Urea, nitratos, amoniaco...' },
                { icon: '⚡', name: 'Electricidad', examples: 'Importación eléctrica' },
                { icon: '💨', name: 'Hidrógeno', examples: 'H2 importado' },
              ].map((sector, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="text-2xl mb-2">{sector.icon}</div>
                  <h3 className="font-bold text-white">{sector.name}</h3>
                  <p className="text-sm text-blue-200">{sector.examples}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-white/10 rounded-xl">
              <p className="text-blue-100">
                <strong className="text-white">📦 Excepción:</strong> Si importas menos de 
                50 toneladas/año de estos productos (excepto electricidad e hidrógeno), 
                estás exento.
              </p>
            </div>
          </div>
        </section>

        {/* Timeline simplificado */}
        <section className="mb-16">
          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12 border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-4xl">📅</span>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">¿Cuándo empieza?</h2>
            </div>

            <div className="space-y-6">
              {/* Fase actual */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    ✓
                  </div>
                  <div className="w-1 h-full bg-gray-200 mt-2"></div>
                </div>
                <div className="pb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">Oct 2023 - Dic 2025</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">AHORA</span>
                  </div>
                  <h3 className="text-lg font-bold text-green-700 mb-2">Período de prueba</h3>
                  <p className="text-gray-600">
                    Solo tienes que <strong>informar</strong> de tus importaciones cada trimestre. 
                    No pagas nada todavía. Es para que empresas y aduanas se preparen.
                  </p>
                </div>
              </div>

              {/* Fase crítica */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold animate-pulse">
                    !
                  </div>
                  <div className="w-1 h-full bg-gray-200 mt-2"></div>
                </div>
                <div className="pb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">1 Enero 2026</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">CRÍTICO</span>
                  </div>
                  <h3 className="text-lg font-bold text-red-700 mb-2">¡Empieza de verdad!</h3>
                  <p className="text-gray-600">
                    A partir de aquí <strong>tienes que pagar</strong>. Necesitas ser 
                    &quot;declarante autorizado CBAM&quot; para poder importar. Sin eso, 
                    tu mercancía no pasa la aduana.
                  </p>
                </div>
              </div>

              {/* Fase futura */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold">
                    →
                  </div>
                </div>
                <div>
                  <span className="font-bold text-gray-900">2028 y después</span>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">Más productos</h3>
                  <p className="text-gray-600">
                    La UE añadirá más productos a la lista (manufacturas de acero y aluminio). 
                    El sistema se irá endureciendo progresivamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cómo funciona - 4 pasos */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
              ¿Cómo funciona en la práctica?
            </h2>
            <p className="text-gray-600">4 pasos para cumplir con el CBAM</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                step: 1,
                icon: '📝',
                title: 'Regístrate',
                description: 'Date de alta como "declarante autorizado CBAM" en el registro de tu país (en España, a través de la AEAT).',
                color: 'from-blue-500 to-blue-600'
              },
              {
                step: 2,
                icon: '📊',
                title: 'Consigue los datos',
                description: 'Pide a tu proveedor/fabricante las emisiones de CO2 por tonelada de producto. Si no las tiene, usa valores por defecto (con penalización).',
                color: 'from-purple-500 to-purple-600'
              },
              {
                step: 3,
                icon: '🎫',
                title: 'Compra certificados',
                description: 'Según las emisiones declaradas, compra los certificados CBAM necesarios. El precio varía según el mercado de carbono europeo.',
                color: 'from-emerald-500 to-emerald-600'
              },
              {
                step: 4,
                icon: '📤',
                title: 'Entrega anual',
                description: 'Cada año (antes del 31 de mayo) presenta tu declaración y entrega los certificados correspondientes a las importaciones del año anterior.',
                color: 'from-orange-500 to-orange-600'
              }
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className={`bg-gradient-to-r ${item.color} p-4 flex items-center gap-3`}>
                  <span className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
                    {item.step}
                  </span>
                  <span className="text-2xl">{item.icon}</span>
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                </div>
                <div className="p-5">
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="mb-16">
          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12 border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-4xl">❓</span>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Preguntas frecuentes</h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div 
                  key={idx}
                  className={`border-2 rounded-xl overflow-hidden transition-all ${
                    activeQuestion === idx ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'
                  }`}
                >
                  <button
                    onClick={() => toggleQuestion(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4"
                  >
                    <span className="font-bold text-gray-900">{faq.question}</span>
                    <svg 
                      className={`w-5 h-5 text-gray-500 transition-transform ${activeQuestion === idx ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {activeQuestion === idx && (
                    <div className="px-5 pb-5">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section>
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl shadow-xl p-8 lg:p-12 text-white text-center">
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              ¿Listo para comprobar si te afecta?
            </h2>
            <p className="text-emerald-100 text-lg mb-8 max-w-xl mx-auto">
              Usa nuestras herramientas gratuitas para verificar tus códigos arancelarios 
              y calcular el coste estimado de certificados CBAM.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/cbam"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors"
              >
                <span className="mr-2">🔍</span>
                Verificar mi código
              </Link>
              <Link
                href="/calculadora"
                className="inline-flex items-center justify-center px-8 py-4 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-colors border-2 border-emerald-500"
              >
                <span className="mr-2">🧮</span>
                Calculadora de aranceles
              </Link>
            </div>
          </div>
        </section>

        {/* Créditos */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>
            Esta guía es una simplificación divulgativa. Para información oficial, 
            consulta el{' '}
            <a 
              href="https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_es"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              portal CBAM de la Comisión Europea
            </a>
            .
          </p>
        </div>
      </main>

    </div>
  )
}
