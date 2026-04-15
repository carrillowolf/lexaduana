export const metadata = {
  title: 'Solicitud de Devolución / Condonación de Derechos (RRM) | LexAduana',
  description:
    'Genera el formulario oficial AEAT de Solicitud de Devolución o Condonación de Derechos (REM/REP) en 4 pasos. Sube tu H1, indica el error y descarga el DOCX listo para presentar.',
  keywords: [
    'solicitud devolución derechos',
    'condonación derechos aduaneros',
    'RRM',
    'REM REP AEAT',
    'art 116 117 118 119 120 CAU',
    'devolución arancel',
  ],
  openGraph: {
    title: 'Solicitud RRM — Devolución/Condonación de Derechos | LexAduana',
    description:
      'Wizard de 4 pasos para generar el formulario oficial AEAT de devolución o condonación de derechos. Genera DOCX listo para presentar.',
    url: 'https://lexaduana.es/rrm',
    siteName: 'LexAduana',
    locale: 'es_ES',
    type: 'website',
  },
}

export default function RrmLayout({ children }) {
  return children
}
