import { notFound } from 'next/navigation'
import { getAgreementCountries, getOriginProfile } from '@/lib/origen/getOriginProfile'
import OriginProfile from '@/components/origen/OriginProfile'

export const revalidate = 86400

export async function generateStaticParams() {
  const countries = await getAgreementCountries()
  return countries.map((c) => ({ pais: c.slug }))
}

export async function generateMetadata({ params }) {
  const { pais } = await params
  const profile = await getOriginProfile(pais)
  if (!profile) return { title: 'País no encontrado | LexAduana' }

  const { country, agreements } = profile
  const agreementName = agreements[0]?.title || ''
  const title = `Origen ${country.nameEsEs} — ${agreementName} | LexAduana`
  const description = `Acuerdo preferencial de ${country.nameEsEs} con la UE: cómo acreditar el origen, documentos necesarios y condiciones.`
  const canonical = `https://lexaduana.es/origen/${country.slug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'LexAduana',
      locale: 'es_ES',
      type: 'article',
    },
    robots: { index: true, follow: true },
  }
}

export default async function OrigenPaisPage({ params }) {
  const { pais } = await params
  const [profile, countries] = await Promise.all([
    getOriginProfile(pais),
    getAgreementCountries(),
  ])
  if (!profile) notFound()

  const { country, agreements } = profile
  const agreementName = agreements[0]?.title || ''

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://lexaduana.es/' },
      { '@type': 'ListItem', position: 2, name: 'Origen', item: 'https://lexaduana.es/origen' },
      {
        '@type': 'ListItem',
        position: 3,
        name: country.nameEs,
        item: `https://lexaduana.es/origen/${country.slug}`,
      },
    ],
  }

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Origen preferencial: ${country.nameEs} — ${agreementName}`,
    description: `Cómo acreditar el origen de mercancías de ${country.nameEs} para beneficiarse de aranceles preferenciales en la UE.`,
    url: `https://lexaduana.es/origen/${country.slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'LexAduana',
      url: 'https://lexaduana.es',
    },
    dateModified: agreements[0]?.lastReviewed || undefined,
    inLanguage: 'es',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <OriginProfile data={profile} countries={countries} />
    </>
  )
}
