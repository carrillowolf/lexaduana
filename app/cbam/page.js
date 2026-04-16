export const metadata = {
  title: 'CBAM — Mecanismo de Ajuste en Frontera por Carbono | LexAduana',
  description:
    'Hub completo del CBAM: autoevaluación, simulador de costes, guía operativa, plazos y asesoría. 573 códigos CN verificados. Todo sobre el mecanismo de ajuste en frontera por carbono de la UE.',
  keywords: [
    'CBAM',
    'mecanismo ajuste frontera carbono',
    'carbon border adjustment',
    'CBAM España',
    'importaciones carbono UE',
    'certificados CBAM',
  ],
  openGraph: {
    title: 'CBAM — Mecanismo de Ajuste en Frontera por Carbono | LexAduana',
    description:
      'Hub completo del CBAM: autoevaluación, simulador de costes, guía operativa y asesoría. 573 códigos CN verificados.',
    url: 'https://lexaduana.es/cbam',
    siteName: 'LexAduana',
    locale: 'es_ES',
    type: 'website',
  },
}

import JsonLd from '@/components/JsonLd'
import {
  getNextDeadlineDB,
  getSectors,
  getTimeline,
  getExcludedCountries,
  getCertificates,
  getDefaultValueMarkupSchedule,
  getDownstreamExtension,
  getThreshold,
} from '@/lib/cbamService'
import CBAMHubContent from '@/components/cbam/CBAMHubContent'
import CbamBreadcrumb from '@/components/cbam/CbamBreadcrumb'

// Forzar renderizado dinámico (SSR) - los datos vienen de Supabase
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // ISR: revalidar cada hora

export default async function CBAMPage() {
  // Fetch paralelo de todos los datos desde Supabase (con fallback a hardcoded)
  const [
    nextDeadline,
    sectors,
    timeline,
    excludedCountries,
    certificates,
    markupSchedule,
    downstreamExtension,
    threshold,
  ] = await Promise.all([
    getNextDeadlineDB(),
    getSectors(),
    getTimeline(),
    getExcludedCountries(),
    getCertificates(),
    getDefaultValueMarkupSchedule(),
    getDownstreamExtension(),
    getThreshold(),
  ])

  const cbamFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Qué es el CBAM?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El CBAM (Carbon Border Adjustment Mechanism) es el Mecanismo de Ajuste en Frontera por Carbono de la UE. Desde enero de 2026, los importadores de productos intensivos en carbono (acero, aluminio, cemento, fertilizantes, electricidad e hidrógeno) deben comprar certificados CBAM para cubrir las emisiones de CO₂ embebidas en sus importaciones.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué productos están afectados por el CBAM?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El CBAM afecta a 6 sectores: cemento, hierro y acero, aluminio, fertilizantes, electricidad e hidrógeno. En total, 573 códigos CN están cubiertos. Desde 2028, se prevé la extensión a productos downstream (productos fabricados con materiales CBAM).',
        },
      },
      {
        '@type': 'Question',
        name: '¿Hay un umbral mínimo para el CBAM?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí. Los importadores con un volumen anual inferior a 50 toneladas de mercancías CBAM están exentos de las obligaciones del mecanismo (Reglamento UE 2025/2083). Esta exención no aplica a electricidad ni hidrógeno.',
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <JsonLd data={cbamFaqSchema} />
      <CbamBreadcrumb />
      <CBAMHubContent
        nextDeadline={nextDeadline}
        sectors={sectors}
        timeline={timeline}
        excludedCountries={excludedCountries}
        certificates={certificates}
        markupSchedule={markupSchedule}
        downstreamExtension={downstreamExtension}
        threshold={threshold}
      />
    </div>
  )
}
