import { listGlossarySlugsForSitemap } from '@/lib/glossary'

export default async function sitemap() {
  const baseUrl = 'https://lexaduana.es'
  const now = new Date()

  const routes = [
    { url: '', priority: 1.0, changeFrequency: 'weekly' },

    { url: '/calculadora', priority: 0.9, changeFrequency: 'weekly' },
    { url: '/clasificador', priority: 0.9, changeFrequency: 'weekly' },
    { url: '/comparador', priority: 0.8, changeFrequency: 'monthly' },
    { url: '/despachos', priority: 0.6, changeFrequency: 'monthly' },
    { url: '/bulk', priority: 0.7, changeFrequency: 'monthly' },

    { url: '/cbam', priority: 0.9, changeFrequency: 'weekly' },
    { url: '/cbam/assessment', priority: 0.9, changeFrequency: 'monthly' },
    { url: '/cbam/guia', priority: 0.8, changeFrequency: 'monthly' },
    { url: '/cbam/asesoria', priority: 0.8, changeFrequency: 'monthly' },

    { url: '/eudr', priority: 0.8, changeFrequency: 'monthly' },

    { url: '/incoterms', priority: 0.9, changeFrequency: 'monthly' },
    { url: '/valor-en-aduana', priority: 0.9, changeFrequency: 'monthly' },
    { url: '/glosario', priority: 0.8, changeFrequency: 'weekly' },
    { url: '/tipos-cambio', priority: 0.6, changeFrequency: 'daily' },

    { url: '/privacidad', priority: 0.3, changeFrequency: 'yearly' },
    { url: '/aviso-legal', priority: 0.3, changeFrequency: 'yearly' },
    { url: '/cookies', priority: 0.3, changeFrequency: 'yearly' },
    { url: '/terminos', priority: 0.3, changeFrequency: 'yearly' }
  ]

  const base = routes.map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }))

  let glossaryUrls = []
  try {
    const glossaryTerms = await listGlossarySlugsForSitemap()
    glossaryUrls = glossaryTerms.map((t) => ({
      url: `${baseUrl}/glosario/${t.slug}`,
      lastModified: t.updated_at ? new Date(t.updated_at) : now,
      changeFrequency: 'monthly',
      priority: t.seo_ready ? 0.6 : 0.3
    }))
  } catch (err) {
    console.error('sitemap: error cargando glosario', err.message)
  }

  return [...base, ...glossaryUrls]
}
