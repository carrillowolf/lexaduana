import { getAgreementCountries } from '@/lib/origen/getOriginProfile'
import OrigenIndex from '@/components/origen/OrigenIndex'

export const revalidate = 86400

export const metadata = {
  title: 'Ficha de origen | LexAduana',
  description:
    'Consulta si un país tiene acuerdo preferencial con la UE y cómo acreditar el origen de la mercancía: EUR.1, declaración en factura y más.',
  alternates: { canonical: 'https://lexaduana.es/origen' },
  openGraph: {
    title: 'Ficha de origen | LexAduana',
    description:
      'Verifica acuerdos preferenciales de origen con la UE por país.',
    url: 'https://lexaduana.es/origen',
    siteName: 'LexAduana',
    locale: 'es_ES',
    type: 'website',
  },
}

export default async function OrigenIndexPage() {
  const countries = await getAgreementCountries()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://lexaduana.es/origen#page',
    name: 'Ficha de origen — LexAduana',
    description: metadata.description,
    url: 'https://lexaduana.es/origen',
    isPartOf: {
      '@type': 'WebSite',
      name: 'LexAduana',
      url: 'https://lexaduana.es',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <OrigenIndex countries={countries} countryCount={countries.length} />
    </>
  )
}
