import { Inter } from "next/font/google";
import "./globals.css";
import Script from 'next/script'

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Lexaduana - Calculadora TARIC Profesional | Aranceles UE 2025",
  description: "Calcula aranceles e IVA para importaciones en la UE. Base de datos actualizada 2025 con +8,600 códigos HS y 70+ acuerdos internacionales. Gratis y profesional.",
  keywords: "TARIC, aranceles, aduanas, importación, UE, calculadora aduanera, códigos HS, IVA importación, comercio internacional",
  authors: [{ name: "Lexaduana" }],
  creator: "Lexaduana",
  publisher: "Lexaduana",
  
  openGraph: {
    title: "Lexaduana - Calculadora TARIC Profesional",
    description: "La calculadora de aranceles más completa para profesionales del comercio internacional. Actualizada 2025.",
    url: "https://lexaduana.es",
    siteName: "Lexaduana",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lexaduana - Calculadora TARIC",
      }
    ],
    locale: "es_ES",
    type: "website",
  },
  
  twitter: {
    card: "summary_large_image",
    title: "Lexaduana - Calculadora TARIC Profesional",
    description: "Calcula aranceles e IVA para importaciones en la UE. +8,600 códigos actualizados.",
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
              name: "Lexaduana",
              description: "Calculadora profesional de aranceles TARIC para importaciones en la UE",
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
