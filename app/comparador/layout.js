export const metadata = {
  title: 'Comparador Multi-Origen — Aranceles por País | LexAduana',
  description:
    'Compara aranceles de importación según el país de origen. Identifica el origen más favorable para tu producto con datos TARIC oficiales.',
  keywords: [
    'comparador aranceles',
    'aranceles por país',
    'origen preferencial',
    'acuerdos comerciales UE',
  ],
  openGraph: {
    title: 'Comparador Multi-Origen de Aranceles | LexAduana',
    description:
      'Compara aranceles de importación según país de origen con datos TARIC oficiales.',
    url: 'https://lexaduana.es/comparador',
    siteName: 'LexAduana',
    locale: 'es_ES',
    type: 'website',
  },
}

export default function ComparadorLayout({ children }) {
  return children
}
