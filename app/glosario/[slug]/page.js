import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getGlossaryTermBySlug, listGlossarySlugs } from '@/lib/glossary'
import GlossaryBreadcrumb from '@/components/glossary/GlossaryBreadcrumb'
import GlossaryRelatedTerms from '@/components/glossary/GlossaryRelatedTerms'
import GlossaryLegalBasis from '@/components/glossary/GlossaryLegalBasis'
import GlossaryFAQ from '@/components/glossary/GlossaryFAQ'
import GlossaryInternalLinks from '@/components/glossary/GlossaryInternalLinks'
import GlossaryDefinitionMarkdown from '@/components/glossary/GlossaryDefinitionMarkdown'

export const revalidate = 86400

export async function generateStaticParams() {
  const slugs = await listGlossarySlugs()
  return slugs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const term = await getGlossaryTermBySlug(slug)
  if (!term) return { title: 'Término no encontrado | LexAduana' }

  const title =
    term.seo_title_es || `${term.term_es}: definición y normativa | LexAduana`
  const description = term.seo_meta_description_es || term.short_definition_es
  const canonical = `https://lexaduana.es/glosario/${term.slug}`

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
      type: 'article'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    },
    robots: term.seo_ready
      ? { index: true, follow: true }
      : { index: false, follow: true }
  }
}

export default async function GlossaryTermPage({ params }) {
  const { slug } = await params
  const term = await getGlossaryTermBySlug(slug)
  if (!term) notFound()

  const definedTermJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    '@id': `https://lexaduana.es/glosario/${term.slug}#term`,
    name: term.term_es,
    alternateName: term.acronym_for || undefined,
    description: term.short_definition_es,
    url: `https://lexaduana.es/glosario/${term.slug}`,
    termCode: term.slug,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      '@id': 'https://lexaduana.es/glosario#set',
      name: 'Glosario aduanero de LexAduana',
      url: 'https://lexaduana.es/glosario'
    },
    inLanguage: 'es'
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://lexaduana.es/' },
      { '@type': 'ListItem', position: 2, name: 'Glosario', item: 'https://lexaduana.es/glosario' },
      {
        '@type': 'ListItem',
        position: 3,
        name: term.category.name_es,
        item: `https://lexaduana.es/glosario?cat=${term.category.slug}`
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: term.term_es,
        item: `https://lexaduana.es/glosario/${term.slug}`
      }
    ]
  }

  const faqs = term.faqs || []
  const faqJsonLd =
    faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.question_es,
            acceptedAnswer: { '@type': 'Answer', text: f.answer_es }
          }))
        }
      : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <article className="max-w-4xl mx-auto px-4 py-12">
        <GlossaryBreadcrumb category={term.category} term={term} />

        <header className="mb-8">
          <p className="text-sm font-medium text-[#0A3D5C] uppercase tracking-wide mb-2">
            {term.category.name_es}
          </p>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            {term.term_es}
            {term.acronym_for && (
              <span className="block text-base font-normal text-slate-500 mt-1">
                ({term.acronym_for})
              </span>
            )}
          </h1>
          <p className="text-lg text-slate-700">{term.short_definition_es}</p>
        </header>

        <section className="prose prose-slate max-w-none mb-12">
          <GlossaryDefinitionMarkdown content={term.definition_es} />
        </section>

        {term.example_es && (
          <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-12">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Ejemplo práctico
            </h2>
            <GlossaryDefinitionMarkdown content={term.example_es} />
          </section>
        )}

        {term.legal_basis?.length > 0 && <GlossaryLegalBasis items={term.legal_basis} />}

        {faqs.length > 0 && <GlossaryFAQ items={faqs} />}

        {term.internal_links?.length > 0 && (
          <GlossaryInternalLinks items={term.internal_links} />
        )}

        {term.related?.length > 0 && <GlossaryRelatedTerms items={term.related} />}

        <div className="mt-12 pt-8 border-t border-slate-200">
          <Link
            href="/glosario"
            className="inline-flex items-center text-[#0A3D5C] hover:text-[#C49B38] font-medium"
          >
            ← Volver al glosario
          </Link>
        </div>
      </article>
    </>
  )
}
