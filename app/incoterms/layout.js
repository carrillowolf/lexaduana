export const metadata = {
  title: 'Incoterms 2020: Guía Completa con Tabla, Valor en Aduana y Ejemplos | LexAduana',
  description:
    'Los 11 Incoterms 2020 explicados: tabla interactiva, ajustes al valor en aduana por Incoterm, diferencia base arancel vs IVA, casillas DUA/H1, ejemplos prácticos y asistente de decisión.',
  keywords: [
    'incoterms 2020',
    'valor en aduana',
    'incoterms',
    'casilla 42',
    'casilla 45',
    'base imponible IVA importación',
    'CIF',
    'FOB',
    'EXW',
    'DDP',
    'FCA',
    'ajustes valor aduana',
    'DUA H1',
    'despacho aduanero',
    'tabla incoterms',
    'comercio internacional',
    'importación',
  ],
  openGraph: {
    title: 'Incoterms 2020: Guía con Valor en Aduana y Ejemplos | LexAduana',
    description:
      'Tabla interactiva de los 11 Incoterms 2020 con ajustes al valor en aduana, diferencia base arancel vs IVA, casillas DUA/H1, ejemplos numéricos y asistente de decisión.',
    url: 'https://lexaduana.es/incoterms',
    siteName: 'LexAduana',
    locale: 'es_ES',
    type: 'website',
  },
}

import JsonLd from '@/components/JsonLd'

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Qué son los Incoterms 2020?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Los Incoterms 2020 son 11 términos comerciales internacionales publicados por la Cámara de Comercio Internacional (ICC) que definen las responsabilidades entre comprador y vendedor respecto al transporte, seguro, riesgo y costes en una compraventa internacional de mercancías. Están vigentes desde el 1 de enero de 2020.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuántos Incoterms 2020 existen?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Existen 11 Incoterms 2020, divididos en dos grupos: 7 para cualquier modo de transporte (EXW, FCA, CPT, CIP, DAP, DPU, DDP) y 4 exclusivos para transporte marítimo (FAS, FOB, CFR, CIF).',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué Incoterm se usa como base para el valor en aduana?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El valor en aduana en la UE se calcula sobre base CIF (Coste, Seguro y Flete) hasta el punto de entrada en el territorio aduanero. CIF es el Incoterm de referencia donde el precio facturado coincide directamente con el valor en aduana cuando el puerto de destino es el punto de entrada UE.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuál es la diferencia entre FOB y CIF?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'En FOB (Free On Board) el vendedor entrega la mercancía cargada a bordo del buque en origen. El comprador paga flete y seguro. En CIF (Cost, Insurance and Freight) el vendedor paga coste, seguro y flete hasta el puerto de destino. Para el valor en aduana, FOB requiere sumar flete y seguro, mientras que CIF ya incluye todo.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué cambió en los Incoterms 2020 respecto a 2010?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Los cambios principales son: DAT se renombró a DPU (Delivered at Place Unloaded) permitiendo entrega en cualquier lugar y no solo terminales; CIP ahora exige seguro con cobertura máxima ICC-A (antes era mínima ICC-C); y FCA incluye la opción de que el comprador instruya al transportista para emitir un conocimiento de embarque con anotación on board.',
      },
    },
  ],
}

export default function IncotermsLayout({ children }) {
  return (
    <>
      <JsonLd data={faqSchema} />
      {children}
    </>
  )
}
