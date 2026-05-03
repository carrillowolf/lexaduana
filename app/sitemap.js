export default function sitemap() {
  const baseUrl = 'https://lexaduana.es'

  const routes = [
    // Landing
    { url: '', priority: 1.0, changeFrequency: 'weekly' },

    // Herramientas principales
    { url: '/calculadora', priority: 0.9, changeFrequency: 'weekly' },
    { url: '/clasificador', priority: 0.9, changeFrequency: 'weekly' },
    { url: '/comparador', priority: 0.8, changeFrequency: 'monthly' },
    { url: '/despachos', priority: 0.6, changeFrequency: 'monthly' },
    { url: '/bulk', priority: 0.7, changeFrequency: 'monthly' },

    // CBAM
    { url: '/cbam', priority: 0.9, changeFrequency: 'weekly' },
    { url: '/cbam/assessment', priority: 0.9, changeFrequency: 'monthly' },
    { url: '/cbam/guia', priority: 0.8, changeFrequency: 'monthly' },
    { url: '/cbam/asesoria', priority: 0.8, changeFrequency: 'monthly' },

    // EUDR
    { url: '/eudr', priority: 0.8, changeFrequency: 'monthly' },

    // Recursos / Contenido SEO
    { url: '/incoterms', priority: 0.9, changeFrequency: 'monthly' },
    { url: '/valor-en-aduana', priority: 0.9, changeFrequency: 'monthly' },
    { url: '/glosario', priority: 0.8, changeFrequency: 'monthly' },
    { url: '/tipos-cambio', priority: 0.6, changeFrequency: 'daily' },

    // Legal (URLs canónicas; las antiguas /politica-privacidad y /terminos-uso
    // sirven 308 redirect y no se indexan)
    { url: '/privacidad', priority: 0.3, changeFrequency: 'yearly' },
    { url: '/aviso-legal', priority: 0.3, changeFrequency: 'yearly' },
    { url: '/cookies', priority: 0.3, changeFrequency: 'yearly' },
    { url: '/terminos', priority: 0.3, changeFrequency: 'yearly' },
  ]

  return routes.map(route => ({
    url: `${baseUrl}${route.url}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
