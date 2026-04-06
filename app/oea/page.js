import JsonLd from '@/components/JsonLd'
import Link from 'next/link'

export const dynamic = 'force-static'

export const metadata = {
  title: 'OEA — Operador Económico Autorizado | Guía Completa España 2026 | LexAduana',
  description: 'Guía completa del Operador Económico Autorizado (OEA/AEO) en España. Requisitos, modalidades OEAC/OEAS/OEAF, procedimiento de solicitud AEAT, beneficios, reconocimiento mutuo y preparación para Trust & Check.',
  keywords: ['OEA', 'operador económico autorizado', 'AEO', 'OEAC', 'OEAS', 'OEAF', 'aduanas España', 'AEAT', 'certificación aduanera', 'simplificaciones aduaneras', 'seguridad cadena suministro', 'reconocimiento mutuo', 'Trust and Check'],
  openGraph: {
    title: 'OEA — Operador Económico Autorizado | LexAduana',
    description: 'Todo sobre el OEA en España: requisitos, modalidades, beneficios y procedimiento ante la AEAT.',
    url: 'https://lexaduana.es/oea',
    siteName: 'LexAduana',
    locale: 'es_ES',
    type: 'article',
  },
}

/* ── Datos estáticos ─────────────────────────────────────── */

const MODALIDADES = [
  {
    id: 'oeac',
    nombre: 'OEAC',
    titulo: 'Simplificaciones Aduaneras',
    icon: '📋',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    cardBorder: 'border-blue-200 hover:border-blue-400',
    criterios: ['a) Cumplimiento', 'b) Registros', 'c) Solvencia', 'd) Competencia profesional'],
    beneficios: ['Despacho centralizado', 'Inscripción en registros del declarante', 'Autoevaluación', 'Garantía global reducida', 'Menos controles aduaneros'],
    quien: 'Importadores, exportadores, agentes de aduanas',
    stat: '48%',
    statLabel: 'de las autorizaciones en la UE',
  },
  {
    id: 'oeas',
    nombre: 'OEAS',
    titulo: 'Seguridad y Protección',
    icon: '🔒',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
    cardBorder: 'border-amber-200 hover:border-amber-400',
    criterios: ['a) Cumplimiento', 'b) Registros', 'c) Solvencia', 'e) Normas de seguridad'],
    beneficios: ['Menos controles de seguridad', 'Notificación previa de llegadas', 'Datos reducidos ENS/EXS', 'Reconocimiento mutuo internacional'],
    quien: 'Transportistas, transitarios, operadores logísticos',
    stat: '4%',
    statLabel: 'de las autorizaciones',
  },
  {
    id: 'oeaf',
    nombre: 'OEAF',
    titulo: 'Combinado (Full)',
    icon: '🛡️',
    badgeColor: 'bg-red-100 text-red-700 border-red-200',
    cardBorder: 'border-red-200 hover:border-red-400',
    criterios: ['a) Cumplimiento', 'b) Registros', 'c) Solvencia', 'd) Competencia', 'e) Seguridad'],
    beneficios: ['Todos los beneficios OEAC', 'Todos los beneficios OEAS', 'Autorización única combinada'],
    quien: 'Operadores integrales, fabricantes que importan y exportan',
    stat: '48%',
    statLabel: 'de las autorizaciones — recomendado',
  },
]

const CRITERIOS = [
  {
    num: 1,
    titulo: 'Cumplimiento aduanero y fiscal',
    baseLegal: 'Art. 39.a) CAU → Art. 24 RECAU',
    aplica: 'OEAC y OEAS',
    descripcion: 'Inexistencia de infracciones graves o reiteradas de la legislación aduanera y fiscal en los tres últimos años. Se verifican el solicitante, los administradores y el responsable de asuntos aduaneros.',
    detalles: [
      'Infracciones de escasa importancia no impiden la concesión si fueron aisladas y se corrigieron',
      'Infracciones reiteradas revelan deficiencias estructurales en controles internos',
      'Infracciones graves: contrabando, fraude en clasificación/valoración/origen, evasión fiscal',
      'Las infracciones de terceros (agente de aduanas) también se tienen en cuenta',
      'Revocación previa en últimos 3 años impide nueva solicitud',
    ],
  },
  {
    num: 2,
    titulo: 'Sistema de gestión de registros',
    baseLegal: 'Art. 39.b) CAU → Art. 25 RECAU',
    aplica: 'OEAC y OEAS (con variaciones)',
    descripcion: 'Alto nivel de control de operaciones y flujo de mercancías. El artículo 25.1 RECAU establece 11 subcondiciones que cubren desde la pista de auditoría hasta la seguridad informática.',
    detalles: [
      'Pista de auditoría completa: rastrear actividades desde entrada hasta salida',
      'Integración de registros aduaneros con sistema contable',
      'Acceso físico y electrónico a sistemas y registros',
      'Sistema logístico UE/no-UE (OEAS exento de esta condición)',
      'Controles internos para prevenir, detectar y corregir errores',
      'Seguridad informática: contraseñas, cortafuegos, cifrado, acceso controlado',
    ],
  },
  {
    num: 3,
    titulo: 'Solvencia financiera',
    baseLegal: 'Art. 39.c) CAU → Art. 26 RECAU',
    aplica: 'OEAC y OEAS',
    descripcion: 'Capacidad financiera suficiente para cumplir compromisos, evaluada sobre los últimos 3 ejercicios económicos.',
    detalles: [
      'No estar incurso en procedimiento concursal',
      'Pagos de derechos aduaneros, IVA e impuestos especiales al día en los 3 últimos años',
      'Activos netos no negativos (salvo cobertura por garantías de sociedad matriz)',
      'Empresas con menos de 3 años: se aceptan previsiones de tesorería',
    ],
  },
  {
    num: 4,
    titulo: 'Competencia profesional',
    baseLegal: 'Art. 39.d) CAU → Art. 27 RECAU',
    aplica: 'Solo OEAC',
    soloTag: 'OEAC',
    descripcion: 'Demostrar conocimiento y experiencia en materia aduanera. Se cumple si el solicitante o la persona encargada de asuntos aduaneros satisface cualquiera de las opciones disponibles.',
    detalles: [
      'Opción 1: Experiencia práctica probada de mínimo 3 años en materia aduanera',
      'Opción 2: Norma de calidad en materia aduanera (aún no desarrollada a nivel UE)',
      'Opción 3: Formación acreditada por autoridad aduanera, centro educativo o asociación profesional reconocida',
      'Si se externaliza a agente de aduanas OEAC, el criterio se considera cumplido',
    ],
  },
  {
    num: 5,
    titulo: 'Normas de seguridad y protección',
    baseLegal: 'Art. 39.e) CAU → Art. 28 RECAU',
    aplica: 'Solo OEAS',
    soloTag: 'OEAS',
    descripcion: 'El criterio más extenso. Se examina en todas las instalaciones relacionadas con actividades aduaneras. Siempre requiere comprobaciones sobre el terreno — no puede evaluarse solo documentalmente.',
    detalles: [
      'Seguridad de edificios: protección frente a intrusión ilegal',
      'Controles de acceso: evitar acceso no autorizado a oficinas, muelles y zonas de carga',
      'Seguridad de la carga: integridad de unidades, precintos, inspección de 7 puntos',
      'Socios comerciales: disposiciones contractuales que garanticen seguridad',
      'Seguridad del personal: análisis de seguridad de empleados en puestos sensibles',
      'Programas de sensibilización en seguridad y persona de contacto designada',
      'Certificaciones que facilitan: AA/EC (aviación), ISO 28000, TAPA, PBIP',
    ],
  },
]

const BENEFICIOS_TABLA = [
  { beneficio: 'Despacho centralizado', oeac: true, oeas: false },
  { beneficio: 'Inscripción registros declarante', oeac: true, oeas: false },
  { beneficio: 'Autoevaluación', oeac: true, oeas: false },
  { beneficio: 'Garantía global reducida', oeac: true, oeas: false },
  { beneficio: 'Facilidades declaraciones previas salida', oeac: false, oeas: true },
  { beneficio: 'Menos controles aduaneros', oeac: true, oeas: false },
  { beneficio: 'Menos controles de seguridad', oeac: false, oeas: true },
  { beneficio: 'Notificación previa (aduanero)', oeac: true, oeas: false },
  { beneficio: 'Notificación previa (seguridad)', oeac: false, oeas: true },
  { beneficio: 'Tratamiento prioritario', oeac: true, oeas: true },
  { beneficio: 'Elección lugar inspección', oeac: true, oeas: true },
  { beneficio: 'Reconocimiento mutuo internacional', oeac: false, oeas: true },
]

const PASOS = [
  {
    num: 1,
    titulo: 'Preparación',
    tiempo: '3-6 meses',
    color: 'bg-red-100 text-red-700',
    items: [
      'Contactar con la AEAT en fase temprana (oea@correo.aeat.es)',
      'Decidir modalidad: OEAC, OEAS o OEAF',
      'Cumplimentar el Cuestionario de Autoevaluación (CAE)',
      'Involucrar a todos los departamentos: aduanas, finanzas, IT, RRHH, logística, dirección',
      'Designar persona de contacto competente para la solicitud',
    ],
  },
  {
    num: 2,
    titulo: 'Presentación',
    tiempo: 'Sede Electrónica AEAT',
    color: 'bg-orange-100 text-orange-700',
    items: [
      'Acceso mediante certificado electrónico, DNI-e o Cl@ve — Procedimiento DC02',
      'Formulario de solicitud + Cuestionario de Autoevaluación (CAE)',
      'Declaración de Seguridad OEA + Consentimiento certificados penales',
      'Consentimiento para intercambio de datos (si se desea reconocimiento mutuo)',
    ],
  },
  {
    num: 3,
    titulo: 'Evaluación',
    tiempo: '120 días + prórrogas',
    color: 'bg-amber-100 text-amber-700',
    items: [
      '30 días para verificar admisibilidad de la solicitud',
      'Auditoría documental + visita presencial obligatoria',
      'Consulta con otros Estados miembros si aplica (80 días adicionales)',
      'Realidad en España: proceso total de 6 a 12 meses',
    ],
  },
  {
    num: 4,
    titulo: 'Concesión',
    tiempo: 'Sin caducidad',
    color: 'bg-green-100 text-green-700',
    items: [
      'Autorización sin fecha de caducidad — vigencia indefinida',
      'Efectiva al 5º día desde la adopción de la decisión',
      'Obligación de mantenimiento continuo y notificación de cambios',
      'Supervisión periódica por las autoridades aduaneras',
    ],
  },
]

const ARM_PAISES = [
  { bandera: '🇨🇭🇳🇴', pais: 'Suiza y Noruega', anio: 2009 },
  { bandera: '🇯🇵', pais: 'Japón', anio: 2011 },
  { bandera: '🇺🇸', pais: 'Estados Unidos (C-TPAT)', anio: 2012 },
  { bandera: '🇨🇳', pais: 'China', anio: 2014 },
  { bandera: '🇬🇧', pais: 'Reino Unido', anio: 2021 },
  { bandera: '🇲🇩', pais: 'Moldavia', anio: 2022 },
  { bandera: '🇨🇦', pais: 'Canadá', anio: 2025 },
  { bandera: '🇦🇩', pais: 'Andorra', anio: null },
]

export default function OEAPage() {
  const oeaFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Qué es el OEA (Operador Económico Autorizado)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El OEA es un operador económico que cumple criterios de cumplimiento, registros, solvencia, competencia y seguridad, y es reconocido como fiable en todo el territorio aduanero de la UE. Basado en el Marco SAFE de la OMA, concede ventajas como menos controles, garantías reducidas y reconocimiento internacional.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuántas modalidades de OEA existen?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Existen tres modalidades: OEAC (Simplificaciones Aduaneras), OEAS (Seguridad y Protección) y OEAF (Combinado), que acumula todos los beneficios de ambas. En la UE, el 48% son OEAC, el 48% OEAF y el 4% OEAS.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo se solicita el OEA en España?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Se solicita ante la AEAT a través de la Sede Electrónica (procedimiento DC02) con certificado electrónico o Cl@ve. Requiere formulario, Cuestionario de Autoevaluación (CAE), Declaración de Seguridad y consentimiento para certificados penales. El proceso dura entre 6 y 12 meses.',
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30">
      <JsonLd data={oeaFaqSchema} />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-800 via-red-900 to-red-950 py-16 md:py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-[200px] leading-none">🛡️</div>
          <div className="absolute bottom-10 right-10 text-[150px] leading-none">🏛️</div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Hero principal */}
            <div className="lg:col-span-2">
              <span className="inline-block px-4 py-2 bg-white/15 backdrop-blur-sm text-red-100 rounded-full text-sm font-medium mb-6 border border-white/20">
                🇪🇺 Artículos 38-41 del Código Aduanero de la Unión
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                OEA — Operador Económico{' '}
                <span className="text-red-300">Autorizado</span>
              </h1>
              <p className="text-lg text-red-100 max-w-xl mb-8 leading-relaxed">
                La certificación de confianza que transforma tu relación con las aduanas. Menos controles, más agilidad, reconocimiento internacional.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="#modalidades" className="px-7 py-3 bg-white text-red-800 font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl text-sm hover:bg-red-50">
                  Ver modalidades
                </a>
                <a href="#procedimiento" className="px-7 py-3 bg-transparent border border-white/30 hover:border-white/50 text-white rounded-lg transition-all text-sm">
                  Cómo solicitarlo
                </a>
              </div>
            </div>

            {/* Card estadística */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 flex flex-col justify-center">
              <div className="text-center">
                <span className="text-6xl font-bold text-white">18.437</span>
                <p className="text-red-200 text-sm mt-2 mb-4">autorizaciones OEA activas en la UE (dic. 2024)</p>
                <div className="h-px bg-white/20 my-4" />
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold text-red-300">~900</span>
                  <span className="text-red-200 text-sm">en España</span>
                </div>
                <p className="text-red-300/60 text-xs mt-3">
                  Los titulares OEA gestionan más del 70% de importaciones/exportaciones de la UE
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">

        {/* ═══ 1. ¿Qué es el OEA? ═══ */}
        <section>
          <div className="bg-white rounded-2xl shadow-lg border-l-4 border-red-600 p-8 md:p-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">¿Qué es el OEA?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              El OEA es un operador económico que, en el contexto de sus operaciones aduaneras, cumple criterios de cumplimiento normativo, gestión de registros, solvencia financiera, competencia profesional y seguridad, y es reconocido como <strong>fiable en todo el territorio aduanero de la Unión Europea</strong>.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Basado en el Marco SAFE de la Organización Mundial de Aduanas (OMA), el programa es <strong>voluntario</strong> y está abierto a todos los operadores económicos establecidos en la UE, incluidas las PYMEs, independientemente de su función en la cadena de suministro.
            </p>

            {/* Cita legal */}
            <div className="bg-gray-50 border-l-4 border-gray-300 rounded-r-lg p-5">
              <p className="text-sm text-gray-600 italic leading-relaxed">
                «Todo operador económico establecido en el territorio aduanero de la Unión que cumpla los criterios establecidos en el artículo 39 podrá solicitar el estatuto de operador económico autorizado.»
              </p>
              <p className="text-xs text-gray-400 mt-2 font-medium">— Artículo 38.1 del Código Aduanero de la Unión (Reg. UE 952/2013)</p>
            </div>
          </div>
        </section>

        {/* ═══ 2. Tres Modalidades ═══ */}
        <section id="modalidades">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Tres Modalidades de Autorización</h2>
            <p className="text-gray-600">Elige la que mejor se adapte a tu perfil como operador económico</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {MODALIDADES.map((m) => (
              <div key={m.id} className={`bg-white rounded-2xl shadow-lg border-2 ${m.cardBorder} p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{m.icon}</span>
                  <div>
                    <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${m.badgeColor}`}>
                      {m.nombre}
                    </span>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{m.titulo}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Criterios exigidos</p>
                  <div className="flex flex-wrap gap-1">
                    {m.criterios.map((c) => (
                      <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{c}</span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Beneficios clave</p>
                  <ul className="space-y-1">
                    {m.beneficios.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-red-500 mt-0.5 flex-shrink-0">✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Quién debería solicitarlo</p>
                  <p className="text-sm text-gray-600">{m.quien}</p>
                </div>

                <div className="pt-4 border-t border-gray-100 text-center">
                  <span className="text-3xl font-bold text-gray-900">{m.stat}</span>
                  <p className="text-xs text-gray-500 mt-1">{m.statLabel}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">
            Base legal: Art. 38.2-3 CAU. Estadísticas: Comisión Europea, diciembre 2024.
          </p>
        </section>

        {/* ═══ 3. Los 5 Criterios ═══ */}
        <section id="criterios">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Los 5 Criterios de Concesión</h2>
            <p className="text-gray-600">Requisitos que debe cumplir el operador económico para obtener el estatuto OEA</p>
          </div>

          <div className="bg-red-50/30 rounded-3xl p-6 md:p-8 space-y-6">
            {CRITERIOS.map((c) => (
              <div key={c.num} className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                    {c.num}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{c.titulo}</h3>
                      {c.soloTag && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.soloTag === 'OEAC' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                          ⚡ Solo {c.soloTag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-medium">{c.baseLegal}</p>
                    <p className="text-xs text-red-600 font-medium">Aplica a: {c.aplica}</p>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed mb-4">{c.descripcion}</p>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Aspectos clave que evalúan las aduanas</p>
                  <ul className="space-y-2">
                    {c.detalles.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-red-400 mt-1 flex-shrink-0">•</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 4. Tabla de Beneficios ═══ */}
        <section id="beneficios">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Comparativa de Beneficios</h2>
            <p className="text-gray-600">Qué ventajas corresponden a cada modalidad</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="py-4 px-6 text-left text-gray-500 font-medium">Beneficio</th>
                    <th className="py-4 px-6 text-center text-blue-700 font-bold">
                      <span className="flex items-center justify-center gap-1">📋 OEAC</span>
                    </th>
                    <th className="py-4 px-6 text-center text-amber-700 font-bold">
                      <span className="flex items-center justify-center gap-1">🔒 OEAS</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {BENEFICIOS_TABLA.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-red-50/30 transition-colors`}>
                      <td className="py-3.5 px-6 font-medium text-gray-700">{row.beneficio}</td>
                      <td className="py-3.5 px-6 text-center">
                        {row.oeac
                          ? <span className="inline-flex items-center justify-center w-7 h-7 bg-green-100 text-green-600 rounded-full text-base">✓</span>
                          : <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-100 text-gray-300 rounded-full text-base">✗</span>
                        }
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        {row.oeas
                          ? <span className="inline-flex items-center justify-center w-7 h-7 bg-green-100 text-green-600 rounded-full text-base">✓</span>
                          : <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-100 text-gray-300 rounded-full text-base">✗</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-red-50 border-t border-red-100">
              <p className="text-xs text-red-700 font-medium text-center">
                🛡️ El OEAF (combinado) acumula todos los beneficios de ambas modalidades.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ 5. Procedimiento en España ═══ */}
        <section id="procedimiento">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Procedimiento en España</h2>
            <p className="text-gray-600">Cuatro fases desde la preparación hasta la concesión</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PASOS.map((paso) => (
              <div key={paso.num} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-400" />
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 ${paso.color} rounded-full flex items-center justify-center font-bold text-lg`}>
                    {paso.num}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{paso.titulo}</h3>
                    <p className="text-xs text-gray-500">{paso.tiempo}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {paso.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-red-500 mt-0.5 flex-shrink-0">▸</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Tabla de plazos legales */}
          <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <span>⏱️</span> Plazos legales del procedimiento
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-6 text-left text-gray-500 font-medium">Fase</th>
                    <th className="py-3 px-6 text-left text-gray-500 font-medium">Plazo</th>
                    <th className="py-3 px-6 text-left text-gray-500 font-medium">Base legal</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { fase: 'Verificación de admisibilidad', plazo: '30 días naturales', base: 'Art. 22.2 CAU' },
                    { fase: 'Decisión desde aceptación', plazo: '120 días naturales', base: 'Art. 22.3 CAU' },
                    { fase: 'Prórroga por la autoridad', plazo: 'Hasta 60 días adicionales', base: 'Art. 28.1 RDCAU' },
                    { fase: 'Consulta con otros Estados miembros', plazo: '80 días', base: 'Art. 31.3 RECAU' },
                    { fase: 'Prórroga por investigaciones', plazo: 'Hasta 9 meses', base: 'Art. 13.4 RDCAU' },
                    { fase: 'Efecto de la autorización', plazo: '5º día desde adopción', base: 'Art. 29 RDCAU' },
                  ].map((row, i) => (
                    <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="py-3 px-6 text-gray-700 font-medium">{row.fase}</td>
                      <td className="py-3 px-6 text-gray-900 font-semibold">{row.plazo}</td>
                      <td className="py-3 px-6 text-gray-400 text-xs">{row.base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ═══ 6. Reconocimiento Mutuo ═══ */}
        <section id="reconocimiento">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Reconocimiento Mutuo Internacional</h2>
            <p className="text-gray-600">Acuerdos de reconocimiento mutuo (ARM) operativos de la UE</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ARM_PAISES.map((p) => (
                <div key={p.pais} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all">
                  <span className="text-2xl">{p.bandera}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{p.pais}</p>
                    {p.anio && <p className="text-xs text-gray-500">Desde {p.anio}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                <strong>Importante:</strong> Solo se benefician del reconocimiento mutuo los titulares de autorización <strong>OEAS o OEAF</strong>. Es necesario haber facilitado el consentimiento escrito para el intercambio de datos con países socios.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ 7. PYMEs ═══ */}
        <section>
          <div className="bg-amber-50 rounded-2xl shadow-lg border-2 border-amber-200 p-8 md:p-10">
            <div className="flex items-start gap-4 mb-6">
              <span className="text-4xl">🏢</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">¿Eres una PYME? El OEA también es para ti</h2>
                <p className="text-amber-700 text-sm font-medium">Art. 29.4 RECAU — Las autoridades tendrán en cuenta las características específicas de las PYMEs</p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              La legislación obliga expresamente a las autoridades aduaneras a tener en cuenta las características específicas de las pequeñas y medianas empresas. Los criterios son los mismos, pero la forma de cumplirlos se adapta:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: '📄', text: 'Registros en papel pueden bastar si permiten auditoría aduanera' },
                { icon: '🔐', text: 'Cerraduras y alambrada pueden sustituir a CCTV sofisticado' },
                { icon: '🗣️', text: 'Formación oral documentada es aceptable' },
                { icon: '📏', text: 'No hay umbrales mínimos de tamaño, personal o facturación' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-amber-100">
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <p className="text-sm text-gray-700">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 8. Mirando al Futuro — Trust & Check ═══ */}
        <section>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl p-8 md:p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-[100px]" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🔮</span>
                <span className="text-xs font-bold text-red-400 bg-red-500/20 px-3 py-1 rounded-full uppercase tracking-wide">Próximamente</span>
              </div>
              <h2 className="text-2xl font-bold mb-4">Mirando al Futuro — Trust & Check Trader</h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                La reforma aduanera de la UE (acuerdo político de marzo 2026) introduce el estatus «Trust & Check» como evolución del OEA. Los operadores que obtengan el OEA ahora estarán mejor posicionados para la transición.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { titulo: 'OEA como trampolín', desc: 'El OEA actual es la base para acceder al futuro estatus Trust & Check' },
                  { titulo: 'Acceso voluntario T&C', desc: 'Solicitudes abiertas desde 2032; obligatoriedad a partir de 2038' },
                  { titulo: 'OEAS se mantiene', desc: 'El componente de seguridad pervive por los ARM internacionales existentes' },
                  { titulo: 'EUCA en Lille', desc: 'Nueva Autoridad Aduanera de la UE operativa desde enero 2028' },
                ].map((item) => (
                  <div key={item.titulo} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <h4 className="font-semibold text-white text-sm mb-1">{item.titulo}</h4>
                    <p className="text-slate-400 text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 9. Conexión con CBAM y EUDR ═══ */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-emerald-200 p-6 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🏭</span>
                <h3 className="font-bold text-gray-900">OEA y CBAM</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Si importas productos sujetos al CBAM, el estatus OEA no es requisito pero sí una ventaja competitiva. Los criterios de cumplimiento y controles internos del OEA se solapan significativamente con los requisitos para ser declarante autorizado CBAM.
              </p>
              <Link href="/cbam" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors">
                Consultar módulo CBAM
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🌳</span>
                <h3 className="font-bold text-gray-900">OEA y EUDR</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                El Reglamento de Deforestación exige sistemas de diligencia debida que comparten principios con el OEA: trazabilidad, controles internos y gestión de riesgos en la cadena de suministro.
              </p>
              <Link href="/eudr" className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-900 transition-colors">
                Consultar guía EUDR
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ 10. Recursos Oficiales ═══ */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Recursos y Enlaces</h2>
            <p className="text-gray-600">Documentación oficial y herramientas disponibles</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🇪🇺</span> Recursos oficiales
              </h3>
              <ul className="space-y-3">
                {[
                  { href: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32013R0952', label: 'Código Aduanero de la Unión (EUR-Lex)' },
                  { href: 'https://taxation-customs.ec.europa.eu/customs-4/aeo-authorised-economic-operator_en', label: 'Programa OEA — Comisión Europea (DG TAXUD)' },
                  { href: 'https://sede.agenciatributaria.gob.es/', label: 'Sede Electrónica AEAT — Procedimiento DC02' },
                  { href: 'https://taxation-customs.ec.europa.eu/customs-4/aeo-authorised-economic-operator/aeo-guidelines_en', label: 'Orientaciones AEO 2016 (DG TAXUD)' },
                  { href: 'https://ec.europa.eu/taxation_customs/dds2/eos/aeo_consultation.jsp', label: 'Base de datos OEA autorizados (Comisión Europea)' },
                  { href: 'https://taxation-customs.ec.europa.eu/customs-4/aeo-authorised-economic-operator/mutual-recognition_en', label: 'Reconocimiento mutuo (DG TAXUD)' },
                ].map((link) => (
                  <li key={link.href}>
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm text-red-700 hover:text-red-900 underline underline-offset-2">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🛠️</span> Herramientas LexAduana
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/calculadora" className="flex items-center gap-2 text-red-700 hover:text-red-900 text-sm">
                    <span>🧮</span> Calculadora de Aranceles
                  </Link>
                </li>
                <li>
                  <Link href="/clasificador" className="flex items-center gap-2 text-red-700 hover:text-red-900 text-sm">
                    <span>🤖</span> Clasificador IA de Productos
                  </Link>
                </li>
                <li>
                  <Link href="/cbam" className="flex items-center gap-2 text-red-700 hover:text-red-900 text-sm">
                    <span>🏭</span> Panel CBAM
                  </Link>
                </li>
                <li>
                  <Link href="/eudr" className="flex items-center gap-2 text-red-700 hover:text-red-900 text-sm">
                    <span>🌳</span> Guía EUDR
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ═══ Footer legal ═══ */}
        <section>
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-center">
            <p className="text-xs text-gray-500 leading-relaxed mb-2">
              Información basada en la legislación vigente de la UE: Reglamento (UE) 952/2013, Reglamento Delegado (UE) 2015/2446, Reglamento de Ejecución (UE) 2015/2447.
            </p>
            <p className="text-xs text-gray-400">
              Esta guía es informativa. Consulte siempre la legislación oficial y asesores especializados. Última actualización: abril 2026.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
