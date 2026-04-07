export const metadata = {
  title: 'Valor en Aduana: Guía Operativa para Despachantes | LexAduana',
  description:
    'Cómo calcular el valor en aduana en la UE: 6 métodos de valoración (CAU), ajustes por Incoterm, diferencia base arancel vs IVA, casillas DUA y H1, DV1, y casos problemáticos reales (DDP, royalties, vinculación). Guía práctica con ejemplos.',
  keywords: [
    'valor en aduana',
    'valor aduanero',
    'casilla 42',
    'casilla 45',
    'DV1',
    'base imponible IVA importación',
    'ajustes valor aduana',
    'art 71 CAU',
    'art 72 CAU',
    'DUA H1',
    'despacho aduanero',
    'métodos valoración aduanera',
    'valoración aduanera',
    'código aduanero unión',
  ],
  openGraph: {
    title: 'Valor en Aduana: Guía Operativa Completa | LexAduana',
    description:
      'Guía práctica de valoración aduanera para despachantes: 6 métodos, ajustes por Incoterm, casillas DUA/H1, DV1, y casos problemáticos reales.',
    url: 'https://lexaduana.es/valor-en-aduana',
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
      name: '¿Qué es el valor en aduana?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El valor en aduana es la base sobre la que se calculan los aranceles de importación en la UE. Se determina conforme al Código Aduanero de la Unión (Reglamento UE 952/2013) y equivale al precio CIF (Coste, Seguro y Flete) de las mercancías en el punto de entrada al territorio aduanero de la Unión.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Es lo mismo la base del arancel que la base del IVA de importación?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. La base del arancel es el valor en aduana (precio CIF frontera UE). La base del IVA de importación es mayor: incluye el valor en aduana más los propios aranceles, derechos antidumping, impuestos especiales y los gastos accesorios hasta el primer lugar de destino interior en la UE (art. 83 Ley 37/1992 del IVA).',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cómo afecta el Incoterm al valor en aduana?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El Incoterm determina qué conceptos están incluidos en el precio facturado. Para llegar al valor en aduana (CIF frontera UE), hay que sumar o restar gastos según el Incoterm. Por ejemplo, en EXW hay que sumar todos los gastos hasta frontera; en CIF no hay ajustes; en DDP hay que restar aranceles, IVA y transporte post-frontera.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué es el formulario DV1?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La Declaración de Valor (DV1) es un formulario complementario obligatorio cuando el valor de las mercancías importadas excede de 20.000 EUR por envío. Su Sección B recoge los elementos a añadir al precio y la Sección C los elementos a deducir para determinar el valor en aduana.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué pasa si declaro mal el valor en aduana?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Si el valor declarado es incorrecto, la aduana puede rechazarlo y aplicar métodos secundarios de valoración (art. 74 CAU). Las consecuencias pueden incluir liquidaciones complementarias con recargo, intereses de demora, y en casos graves, sanciones. Si has pagado de más, puedes solicitar la devolución mediante el procedimiento RRM dentro del plazo de 3 años.',
      },
    },
  ],
}

export default function ValorEnAduanaLayout({ children }) {
  return (
    <>
      <JsonLd data={faqSchema} />
      {children}
    </>
  )
}
