export const metadata = {
  title: 'Calculadora de Aranceles TARIC | LexAduana',
  description:
    'Calcula aranceles, IVA y derechos de importación con datos EUR-Lex oficiales. 390.735 registros TARIC actualizados. Alertas CBAM automáticas.',
  keywords: [
    'calculadora aranceles',
    'TARIC',
    'aranceles importación España',
    'IVA importación',
    'derechos aduaneros',
    'código HS',
  ],
  openGraph: {
    title: 'Calculadora de Aranceles TARIC | LexAduana',
    description:
      'Calcula aranceles e IVA de importación con datos EUR-Lex oficiales. 390.735 registros TARIC.',
    url: 'https://lexaduana.es/calculadora',
    siteName: 'LexAduana',
    locale: 'es_ES',
    type: 'website',
  },
}

import { Suspense } from 'react'
import JsonLd from '@/components/JsonLd'

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Calculadora de Aranceles TARIC',
  url: 'https://lexaduana.es/calculadora',
  description:
    'Calculadora de aranceles, IVA y derechos de importación con 390.735 registros TARIC oficiales EUR-Lex',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
  },
  provider: {
    '@type': 'Organization',
    name: 'LexAduana',
  },
}

export default function CalculadoraLayout({ children }) {
  return (
    <>
      <JsonLd data={webAppSchema} />
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </>
  )
}
