/** @type {import('next').NextConfig} */
const nextConfig = {
  // lib/cbamReportGenerator.jsx lee las TTF de Roboto desde public/fonts/
  // en tiempo de ejecución para registrarlas en @react-pdf/renderer. Next.js
  // traza dependencias estáticas, pero `path.join(process.cwd(), ...)` no se
  // detecta — hay que declarar explícitamente las rutas a incluir en el
  // bundle del route handler. Sin esto, el PDF falla en Vercel con
  // ENOENT al registrar la fuente.
  outputFileTracingIncludes: {
    '/api/admin/cbam/asesoria/[id]/generate-report': ['./public/fonts/roboto/*.ttf'],
  },
  async headers() {
    // CSP en modo bloqueante tras periodo de observación 5-6 mayo 2026.
    // Producción quedó limpia (cero violaciones reales); el único ruido eran
    // 12 reports del widget de comments de Vercel en deployments preview.
    // Las violaciones se siguen reportando a /api/csp-report y se persisten
    // en la tabla csp_violations para detectar rupturas futuras.
    //
    // Relajación condicional para preview de Vercel: en VERCEL_ENV=preview se
    // añade vercel.live a frame-src y script-src para que el widget de
    // comments funcione. Producción y desarrollo local mantienen CSP estricta.
    //
    // Ajustes respecto al draft original tras grep del repo (Fase 6 Bloque B):
    // - Eliminado va.vercel-scripts.com: @vercel/speed-insights no instalado.
    // - Eliminado fonts.googleapis.com / fonts.gstatic.com: next/font/google
    //   self-hostea Inter en build, sin tráfico runtime a esos dominios.
    // - Mantenido api.anthropic.com (server-only hoy; protege futuro SDK
    //   cliente sin revisitar la CSP).
    const isPreview = process.env.VERCEL_ENV === 'preview'
    const scriptSrc = isPreview
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io https://vercel.live"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io"
    const frameSrc = isPreview
      ? "frame-src 'self' https://vercel.live"
      : "frame-src 'self'"

    const cspBlocking = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://plausible.io https://api.anthropic.com",
      frameSrc,
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      'report-uri /api/csp-report',
      'report-to csp-endpoint',
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          // 2 años + includeSubDomains. NO añadir a la lista preload de Chrome
          // sin decisión explícita (afecta a todos los subdominios irrevocablemente).
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Bloquea todo embed en iframes. Si en el futuro hay caso de uso
          // (embed de calculadora en sitio partner), cambiar a SAMEORIGIN o
          // a CSP frame-ancestors específico (Bloque B ya lo cubre).
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Deniega APIs sensibles del navegador no usadas por LexAduana.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()',
          },
          // CSP bloqueante: el navegador rechaza recursos que violen la
          // política. Se mantiene report-uri/report-to para captar rupturas.
          {
            key: 'Content-Security-Policy',
            value: cspBlocking,
          },
          // Reporting API moderna (Chrome 96+): mismo destino que report-uri.
          {
            key: 'Reporting-Endpoints',
            value: 'csp-endpoint="/api/csp-report"',
          },
        ],
      },
    ]
  },
}

export default nextConfig
