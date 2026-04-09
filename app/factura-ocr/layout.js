export const metadata = {
  title: 'Extractor de Facturas Comerciales con IA | LexAduana',
  description:
    'Sube tu factura comercial en PDF, PNG o JPG y obtén automáticamente: datos de proveedor, líneas de producto, clasificación arancelaria TARIC y cálculo de aranceles e IVA. Procesado con Claude Vision, sin almacenar el archivo.',
  keywords: [
    'factura comercial',
    'OCR factura',
    'extractor factura',
    'clasificación arancelaria automática',
    'importación',
    'commercial invoice',
    'TARIC',
    'IA aduanas',
    'lectura factura PDF',
  ],
  openGraph: {
    title: 'Extractor de Facturas Comerciales con IA | LexAduana',
    description:
      'Sube una factura comercial PDF y obtén datos extraídos, código TARIC y cálculo de aranceles automáticamente.',
    url: 'https://lexaduana.es/factura-ocr',
    siteName: 'LexAduana',
    locale: 'es_ES',
    type: 'website',
  },
}

export default function FacturaOcrLayout({ children }) {
  return children
}
