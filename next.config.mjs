/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
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
          // a CSP frame-ancestors específico.
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
        ],
      },
    ];
  },
};

export default nextConfig;
