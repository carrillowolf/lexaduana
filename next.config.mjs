/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // CSP en modo Report-Only durante el periodo de validación.
    // Las violaciones se reportan a /api/csp-report y se persisten en
    // la tabla csp_violations para análisis. Tras 24-48h sin falsos
    // positivos, conmutar a Content-Security-Policy bloqueante.
    //
    // Ajustes respecto al draft original tras grep del repo (Fase 6 Bloque B):
    // - Eliminado va.vercel-scripts.com: @vercel/speed-insights no instalado.
    // - Eliminado fonts.googleapis.com / fonts.gstatic.com: next/font/google
    //   self-hostea Inter en build, sin tráfico runtime a esos dominios.
    // - Mantenido api.anthropic.com (server-only hoy; protege futuro SDK
    //   cliente sin revisitar la CSP).
    const cspReportOnly = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://plausible.io https://api.anthropic.com",
      "frame-src 'self'",
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
          // CSP en modo Report-Only: el navegador NO bloquea recursos,
          // solo reporta violaciones a /api/csp-report.
          {
            key: 'Content-Security-Policy-Report-Only',
            value: cspReportOnly,
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
