export const metadata = {
  title: 'Cálculo Masivo de Aranceles — Importación por Lotes | LexAduana',
  description:
    'Calcula aranceles e IVA de importación para múltiples productos a la vez. Carga masiva con datos TARIC oficiales y exportación de resultados.',
  keywords: [
    'cálculo masivo aranceles',
    'importación por lotes',
    'aranceles múltiples productos',
    'TARIC bulk',
  ],
  openGraph: {
    title: 'Cálculo Masivo de Aranceles | LexAduana',
    description:
      'Calcula aranceles e IVA para múltiples productos a la vez con datos TARIC oficiales.',
    url: 'https://lexaduana.es/bulk',
    siteName: 'LexAduana',
    locale: 'es_ES',
    type: 'website',
  },
}

export default function BulkLayout({ children }) {
  return children
}
