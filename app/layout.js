import { Inter } from "next/font/google";
import "./globals.css";
import Script from 'next/script'

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
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
        {/* Google Analytics 4 - Reemplaza G-XXXXXXXXXX con tu ID real */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PYT83VPMB7"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PYT83VPMB7');
          `}
        </Script>
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        
        {/* Schema.org para SEO */}
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "LexAduana",
              description: "Suite profesional de herramientas aduaneras: calculadora TARIC, clasificador IA y modulo CBAM para importaciones a la UE",
              url: "https://lexaduana.es",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "EUR"
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "127"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
