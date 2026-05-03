import { Inter } from "next/font/google";
import "./globals.css";
import Script from 'next/script'
import AppShell from '@/components/layout/AppShell'
import PlausibleAnalytics from '@/components/analytics/PlausibleAnalytics'

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL("https://lexaduana.es"),
  title: "LexAduana | Suite Profesional de Comercio Exterior",
  description: "Plataforma de herramientas aduaneras para importaciones a la UE. Calculadora TARIC, clasificador con IA y modulo CBAM. Datos oficiales EUR-Lex actualizados mensualmente.",
  keywords: "aduanas, TARIC, aranceles, importaciones, CBAM, clasificacion arancelaria, comercio exterior, UE, calculadora aduanera, codigos HS, IVA importacion",
  authors: [{ name: "LexAduana" }],
  creator: "LexAduana",
  publisher: "LexAduana",

  openGraph: {
    title: "LexAduana | Suite Profesional de Comercio Exterior",
    description: "Calcula aranceles, clasifica productos con IA y gestiona el CBAM. Datos oficiales EUR-Lex actualizados mensualmente.",
    url: "https://lexaduana.es",
    siteName: "LexAduana",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LexAduana - Suite Profesional de Comercio Exterior",
      }
    ],
    locale: "es_ES",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "LexAduana | Suite Profesional de Comercio Exterior",
    description: "Calcula aranceles, clasifica productos con IA y gestiona el CBAM. 390K+ registros EUR-Lex oficiales.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Plausible Analytics — privacy-friendly, EU (Frankfurt), sin cookies */}
        <PlausibleAnalytics />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        
        {/* Schema.org Organization — global */}
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "LexAduana",
              url: "https://lexaduana.es",
              description: "Suite profesional de comercio exterior para importadores en España y la Unión Europea",
              logo: "https://lexaduana.es/logo.png",
              sameAs: [],
              offers: {
                "@type": "Offer",
                description: "Herramientas gratuitas de cálculo arancelario, clasificación IA y compliance CBAM"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
