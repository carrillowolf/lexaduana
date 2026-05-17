import { listGlossaryTerms, listGlossaryCategories } from '@/lib/glossary'
import GlossarySearchableIndex from '@/components/glossary/GlossarySearchableIndex'

export const revalidate = 86400

export const metadata = {
  title: 'Glosario aduanero | LexAduana',
  description:
    'Glosario especializado de comercio exterior y derecho aduanero: TARIC, CBAM, IVA importación, Incoterms y más términos clave para profesionales.',
  alternates: { canonical: 'https://lexaduana.es/glosario' },
  openGraph: {
    title: 'Glosario aduanero | LexAduana',
    description:
      'Términos clave de comercio exterior explicados con base legal y ejemplos prácticos.',
    url: 'https://lexaduana.es/glosario',
    siteName: 'LexAduana',
    locale: 'es_ES',
    type: 'website'
  }
}

export default async function GlossaryIndexPage() {
  const [terms, categories] = await Promise.all([
    listGlossaryTerms(),
    listGlossaryCategories()
  ])

  const setJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': 'https://lexaduana.es/glosario#set',
    name: 'Glosario aduanero de LexAduana',
    description: 'Términos de comercio exterior y derecho aduanero.',
    url: 'https://lexaduana.es/glosario',
    hasDefinedTerm: terms.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.term_es,
      url: `https://lexaduana.es/glosario/${t.slug}`,
      termCode: t.slug
    })),
    inLanguage: 'es'
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(setJsonLd) }}
      />

      <section className="bg-[#0A3D5C] text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Glosario aduanero</h1>
          <p className="text-lg text-white/80 max-w-2xl">
            {terms.length} términos de comercio exterior y derecho aduanero, con base legal y
            ejemplos prácticos.
          </p>
        </div>
      </section>

      <GlossarySearchableIndex terms={terms} categories={categories} />
    </>
  )
}
