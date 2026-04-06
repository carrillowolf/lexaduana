import JsonLd from '@/components/JsonLd'
import Link from 'next/link'

export const dynamic = 'force-static'

export const metadata = {
  title: 'EUDR — Reglamento de Deforestación de la UE | LexAduana',
  description: 'Guía completa sobre el Reglamento (UE) 2023/1115 de productos libres de deforestación (EUDR). Verifica si tus importaciones están afectadas. Aplicación desde diciembre 2026.',
  keywords: ['EUDR', 'deforestación', 'reglamento UE', 'importaciones', 'diligencia debida', 'TRACES', 'commodities', 'cacao', 'café', 'palma', 'soja', 'madera', 'caucho', 'ganado'],
  openGraph: {
    title: 'EUDR — Regulación de Deforestación | LexAduana',
    description: 'Verifica si tus importaciones están afectadas por el Reglamento de Deforestación de la UE (EUDR). Guía completa con plazos, obligaciones y sanciones.',
    url: 'https://lexaduana.es/eudr',
    siteName: 'LexAduana',
    locale: 'es_ES',
    type: 'website',
  },
}

// Días restantes calculados en servidor
const DEADLINE_OPERATORS = new Date('2026-12-30')
const DEADLINE_PYMES = new Date('2027-06-30')

function daysUntil(target) {
  return Math.ceil((target - new Date()) / (1000 * 60 * 60 * 24))
}

export default function EUDRPage() {
  const daysToOperators = daysUntil(DEADLINE_OPERATORS)
  const daysToPymes = daysUntil(DEADLINE_PYMES)

  const eudrFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Qué es el EUDR?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El EUDR (Reglamento UE 2023/1115) es el Reglamento de Productos Libres de Deforestación de la UE. Exige que los productos importados no procedan de tierras deforestadas después del 31 de diciembre de 2020 y que se hayan producido legalmente según las leyes del país de origen.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuándo entra en vigor el EUDR?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El EUDR se aplica desde el 30 de diciembre de 2026 para operadores grandes y medianos, y desde el 30 de junio de 2027 para pymes. Fue aplazado por el Reglamento UE 2025/2650.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué productos afecta el EUDR?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El EUDR cubre 7 materias primas y sus derivados: ganado bovino (carne, cuero), cacao (chocolate), café, palma aceitera (aceite de palma), caucho (neumáticos), soja y madera (muebles, papel, celulosa).',
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
      <JsonLd data={eudrFaqSchema} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-800 to-emerald-900 py-16 md:py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-[200px] leading-none">🌳</div>
          <div className="absolute bottom-10 right-10 text-[150px] leading-none">🌿</div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <span className="inline-block px-4 py-2 bg-white/15 backdrop-blur-sm text-green-100 rounded-full text-sm font-medium mb-6 border border-white/20">
            🇪🇺 Reglamento (UE) 2023/1115
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            EUDR — Reglamento de Productos{' '}
            <span className="text-green-300">Libres de Deforestación</span>
          </h2>
          <p className="text-lg text-green-100 max-w-2xl mx-auto mb-8 leading-relaxed">
            La UE exige que los productos importados no contribuyan a la deforestación mundial.
            Verifica si tu actividad está afectada y conoce tus obligaciones.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#materias-primas" className="px-7 py-3 bg-white text-green-800 font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl text-sm hover:bg-green-50">
              Ver productos afectados
            </a>
            <a href="#diligencia-debida" className="px-7 py-3 bg-transparent border border-white/30 hover:border-white/50 text-white rounded-lg transition-all text-sm">
              Proceso de diligencia debida
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* Alerta de Fecha Clave */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-green-200 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-[80px]" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📅</span>
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full uppercase tracking-wide">Operadores grandes y medianos</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">30 de diciembre de 2026</p>
              <p className="text-sm text-gray-500 mb-4">Fecha de aplicación obligatoria</p>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${daysToOperators <= 180 ? 'text-red-600' : 'text-green-700'}`}>
                  {daysToOperators > 0 ? daysToOperators : 0}
                </span>
                <span className="text-sm text-gray-600">días restantes</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-emerald-200 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[80px]" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📅</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full uppercase tracking-wide">Pymes</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">30 de junio de 2027</p>
              <p className="text-sm text-gray-500 mb-4">Fecha de aplicación para pequeñas y medianas empresas</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-emerald-700">
                  {daysToPymes > 0 ? daysToPymes : 0}
                </span>
                <span className="text-sm text-gray-600">días restantes</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center -mt-8">
          Fuente legal: Reglamento (UE) 2023/1115, modificado por Reglamento (UE) 2025/2650
        </p>

        {/* ¿Qué es el EUDR? */}
        <section>
          <div className="bg-gradient-to-br from-green-700 to-emerald-800 rounded-3xl shadow-xl p-8 md:p-10 text-white">
            <h3 className="text-2xl font-bold mb-2">¿Qué es el EUDR?</h3>
            <p className="text-green-200 mb-8 text-sm">Tres pilares fundamentales del reglamento</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <span className="text-3xl mb-4 block">🌲</span>
                <h4 className="text-lg font-bold mb-2">Libre de Deforestación</h4>
                <p className="text-green-100 text-sm leading-relaxed">
                  Los productos deben demostrar que no proceden de tierras deforestadas después del 31/12/2020.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <span className="text-3xl mb-4 block">⚖️</span>
                <h4 className="text-lg font-bold mb-2">Producción Legal</h4>
                <p className="text-green-100 text-sm leading-relaxed">
                  Deben cumplir con todas las leyes vigentes del país de producción, incluyendo derechos de uso del suelo.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <span className="text-3xl mb-4 block">📋</span>
                <h4 className="text-lg font-bold mb-2">Diligencia Debida</h4>
                <p className="text-green-100 text-sm leading-relaxed">
                  Obligación de presentar una Declaración de Diligencia Debida (DDS) con geolocalización de parcelas en el sistema TRACES.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Materias Primas Reguladas */}
        <section id="materias-primas">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Materias Primas Reguladas</h3>
            <p className="text-gray-600">7 productos básicos y sus derivados</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { icon: '🐄', name: 'Ganado bovino', desc: 'Carne, cuero, pieles' },
              { icon: '🍫', name: 'Cacao', desc: 'Chocolate, manteca de cacao' },
              { icon: '☕', name: 'Café', desc: 'Grano, tostado, soluble' },
              { icon: '🌴', name: 'Palma aceitera', desc: 'Aceite de palma, derivados oleoquímicos' },
              { icon: '🌿', name: 'Caucho', desc: 'Caucho natural, neumáticos' },
              { icon: '🌱', name: 'Soja', desc: 'Habas, harina, aceite de soja' },
              { icon: '🪵', name: 'Madera', desc: 'Muebles, papel, celulosa, productos de madera' },
            ].map((item) => (
              <div key={item.name} className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg hover:border-green-200 transition-all">
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h4 className="font-bold text-gray-900 mb-1">{item.name}</h4>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">
            El ámbito exacto se define por códigos CN del Anexo I del Reglamento. No todos los productos de estas categorías están afectados.
          </p>
        </section>

        {/* Proceso de Diligencia Debida */}
        <section id="diligencia-debida">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Proceso de Diligencia Debida</h3>
            <p className="text-gray-600">Tres fases obligatorias para cada operación</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-full">
                <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-lg mb-4">1</div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">Recopilación de información</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#10003;</span>
                    Datos del producto y descripción
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#10003;</span>
                    Geolocalización GPS de todas las parcelas de producción
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#10003;</span>
                    Fechas de producción y cosecha
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#10003;</span>
                    Información completa del proveedor
                  </li>
                </ul>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 text-gray-300 text-2xl">→</div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-full">
                <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-lg mb-4">2</div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">Evaluación de riesgos</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">&#10003;</span>
                    Análisis del riesgo según país de origen
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">&#10003;</span>
                    Complejidad de la cadena de suministro
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">&#10003;</span>
                    Presión de deforestación en la zona
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">&#10003;</span>
                    Historial del proveedor
                  </li>
                </ul>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 text-gray-300 text-2xl">→</div>
            </div>

            <div>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-full">
                <div className="w-10 h-10 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold text-lg mb-4">3</div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">Mitigación de riesgos</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">&#10003;</span>
                    Auditorías independientes si el riesgo no es negligible
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">&#10003;</span>
                    Verificación satelital de parcelas
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">&#10003;</span>
                    Evidencia adicional de proveedores
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">&#10003;</span>
                    Documentación para sistema TRACES
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Sistema de Clasificación de Países */}
        <section>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🌍</span> Sistema de Clasificación de Países
              </h3>
              <p className="text-sm text-gray-500 mt-1">Tres niveles de riesgo que determinan el nivel de diligencia debida</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="font-bold text-green-800">Riesgo bajo</span>
                  </div>
                  <p className="text-sm text-green-700 mb-2">Diligencia debida simplificada</p>
                  <p className="text-xs text-green-600">Inspección del 1% de operadores</p>
                </div>
                <div className="p-5 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 bg-amber-500 rounded-full" />
                    <span className="font-bold text-amber-800">Riesgo estándar</span>
                  </div>
                  <p className="text-sm text-amber-700 mb-2">Diligencia debida completa</p>
                  <p className="text-xs text-amber-600">Inspección del 3% de operadores</p>
                </div>
                <div className="p-5 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="font-bold text-red-800">Riesgo alto</span>
                  </div>
                  <p className="text-sm text-red-700 mb-2">Diligencia debida reforzada</p>
                  <p className="text-xs text-red-600">Inspección del 9% de operadores</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                La Comisión Europea publicó la clasificación de riesgo por países en mayo de 2025.
              </p>
            </div>
          </div>
        </section>

        {/* Sanciones */}
        <section>
          <div className="bg-red-50 rounded-2xl shadow-lg border-2 border-red-200 overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-red-600 to-orange-600">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>⚠️</span> Sanciones por Incumplimiento
              </h3>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-red-100">
                  <span className="text-red-500 text-xl mt-0.5">💰</span>
                  <div>
                    <p className="font-bold text-gray-900">Hasta el 4% de la facturación anual en la UE</p>
                    <p className="text-sm text-gray-500">Multas proporcionales a la gravedad</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-red-100">
                  <span className="text-red-500 text-xl mt-0.5">📦</span>
                  <div>
                    <p className="font-bold text-gray-900">Confiscación de productos e ingresos</p>
                    <p className="text-sm text-gray-500">Decomiso de mercancías no conformes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-red-100">
                  <span className="text-red-500 text-xl mt-0.5">🚫</span>
                  <div>
                    <p className="font-bold text-gray-900">Prohibición temporal de comercializar</p>
                    <p className="text-sm text-gray-500">Suspensión de operaciones con productos regulados</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-red-100">
                  <span className="text-red-500 text-xl mt-0.5">🏛️</span>
                  <div>
                    <p className="font-bold text-gray-900">Exclusión de contratación pública y financiación UE</p>
                    <p className="text-sm text-gray-500">Hasta 12 meses de exclusión</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-white rounded-xl border border-red-100">
                <div className="flex items-start gap-3">
                  <span className="text-red-500 text-xl mt-0.5">📢</span>
                  <div>
                    <p className="font-bold text-gray-900">Publicación del nombre de la empresa en lista de infractores</p>
                    <p className="text-sm text-gray-500">Registro público de la Comisión Europea</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Cada Estado miembro define e implementa sus propias sanciones dentro del marco del Reglamento.
              </p>
            </div>
          </div>
        </section>

        {/* EUDR vs CBAM */}
        <section>
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">EUDR vs CBAM — Comparativa</h3>
            <p className="text-gray-600">Dos regulaciones complementarias para tus importaciones</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="py-4 px-6 text-left text-gray-500 font-medium">Aspecto</th>
                    <th className="py-4 px-6 text-left text-emerald-700 font-bold">
                      <span className="flex items-center gap-2">🌍 CBAM</span>
                    </th>
                    <th className="py-4 px-6 text-left text-green-700 font-bold">
                      <span className="flex items-center gap-2">🌳 EUDR</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { aspect: 'Foco', cbam: 'Emisiones de carbono', eudr: 'Deforestación' },
                    { aspect: 'Productos', cbam: 'Acero, aluminio, cemento, fertilizantes, electricidad, hidrógeno', eudr: 'Ganado, cacao, café, palma, caucho, soja, madera + derivados' },
                    { aspect: 'Datos necesarios', cbam: 'Emisiones CO₂ de instalaciones', eudr: 'Geolocalización GPS de parcelas de producción' },
                    { aspect: 'Sistema declarativo', cbam: 'Registro CBAM (declaración anual)', eudr: 'TRACES (DDS por envío)' },
                    { aspect: 'Fecha de aplicación', cbam: '1 enero 2026 (en vigor)', eudr: '30 diciembre 2026' },
                    { aspect: 'Sanciones', cbam: 'Penalizaciones financieras', eudr: 'Hasta 4% facturación + confiscación' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-700">{row.aspect}</td>
                      <td className="py-4 px-6 text-gray-600">{row.cbam}</td>
                      <td className="py-4 px-6 text-gray-600">{row.eudr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section>
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Cronología de Implementación</h3>
            <p className="text-gray-600">Hitos clave del EUDR</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="space-y-0">
              {[
                { date: 'Junio 2023', title: 'Entrada en vigor del Reglamento (UE) 2023/1115', status: 'done' },
                { date: 'Mayo 2025', title: 'Publicación de la clasificación de riesgo por países', status: 'done' },
                { date: 'Diciembre 2025', title: 'Aplazamiento a 2026 y medidas de simplificación (Reglamento (UE) 2025/2650)', status: 'done' },
                { date: 'Abril 2026', title: 'Paquete de simplificación de la Comisión (revisión obligatoria)', status: 'soon' },
                { date: '30 diciembre 2026', title: 'Aplicación para operadores grandes y medianos', status: 'pending' },
                { date: '30 junio 2027', title: 'Aplicación para pymes', status: 'pending' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                      item.status === 'done' ? 'bg-green-100 text-green-700' :
                      item.status === 'soon' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {item.status === 'done' ? '✅' : item.status === 'soon' ? '🔜' : '⏳'}
                    </span>
                    {i < 5 && <div className="w-0.5 h-8 bg-gray-200 my-1" />}
                  </div>
                  <div className="pb-6">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{item.date}</p>
                    <p className={`font-medium ${item.status === 'pending' ? 'text-gray-900' : 'text-gray-700'}`}>{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recursos Oficiales + Herramientas LexAduana */}
        <section>
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Recursos y Enlaces</h3>
            <p className="text-gray-600">Documentación oficial y herramientas disponibles</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🇪🇺</span> Recursos oficiales
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="https://environment.ec.europa.eu/topics/forests/deforestation/regulation-deforestation-free-products_en" target="_blank" rel="noopener noreferrer" className="text-sm text-green-700 hover:text-green-900 underline underline-offset-2">
                    Portal EUDR de la Comisión Europea
                  </a>
                </li>
                <li>
                  <a href="https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32023R1115" target="_blank" rel="noopener noreferrer" className="text-sm text-green-700 hover:text-green-900 underline underline-offset-2">
                    Reglamento (UE) 2023/1115 en EUR-Lex
                  </a>
                </li>
                <li>
                  <a href="https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32025R2650" target="_blank" rel="noopener noreferrer" className="text-sm text-green-700 hover:text-green-900 underline underline-offset-2">
                    Reglamento (UE) 2025/2650 (aplazamiento)
                  </a>
                </li>
                <li>
                  <a href="https://webgate.ec.europa.eu/tracesnt/" target="_blank" rel="noopener noreferrer" className="text-sm text-green-700 hover:text-green-900 underline underline-offset-2">
                    Sistema TRACES
                  </a>
                </li>
                <li>
                  <a href="https://environment.ec.europa.eu/topics/forests/deforestation/regulation-deforestation-free-products/country-benchmarking_en" target="_blank" rel="noopener noreferrer" className="text-sm text-green-700 hover:text-green-900 underline underline-offset-2">
                    Clasificación de riesgo por países
                  </a>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🛠️</span> Herramientas LexAduana
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/calculadora" className="flex items-center gap-2 text-green-700 hover:text-green-900 text-sm">
                    <span>🧮</span> Calculadora de Aranceles
                  </Link>
                </li>
                <li>
                  <Link href="/clasificador" className="flex items-center gap-2 text-green-700 hover:text-green-900 text-sm">
                    <span>🤖</span> Clasificador IA de Productos
                  </Link>
                </li>
                <li>
                  <Link href="/comparador" className="flex items-center gap-2 text-green-700 hover:text-green-900 text-sm">
                    <span>📊</span> Comparador Multi-Origen
                  </Link>
                </li>
                <li>
                  <Link href="/cbam" className="flex items-center gap-2 text-green-700 hover:text-green-900 text-sm">
                    <span>🏭</span> Panel CBAM
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA → CBAM */}
        <section>
          <div className="bg-gradient-to-r from-[#0A3D5C] to-[#083049] rounded-3xl shadow-xl p-8 md:p-10 text-white text-center">
            <h3 className="text-2xl font-bold mb-3">¿Importas también productos industriales?</h3>
            <p className="text-blue-200 mb-6 max-w-2xl mx-auto">
              El CBAM ya está en vigor desde enero de 2026 para acero, aluminio, cemento, fertilizantes, electricidad e hidrógeno.
              Verifica si tus importaciones están afectadas.
            </p>
            <Link
              href="/cbam"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#0A3D5C] font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg"
            >
              Consultar obligaciones CBAM
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </section>

        {/* CTA → OEA */}
        <section>
          <div className="bg-gradient-to-r from-red-800 to-red-900 rounded-3xl shadow-xl p-8 md:p-10 text-white text-center">
            <h3 className="text-2xl font-bold mb-3">¿Quieres menos controles y más agilidad?</h3>
            <p className="text-red-200 mb-6 max-w-2xl mx-auto">
              El OEA (Operador Económico Autorizado) es la certificación de confianza aduanera de la UE: garantías reducidas, reconocimiento mutuo internacional y tratamiento prioritario.
            </p>
            <Link
              href="/oea"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-red-800 font-bold rounded-xl hover:bg-red-50 transition-all shadow-lg"
            >
              Consultar guía OEA
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </section>
      </div>

    </div>
  )
}
