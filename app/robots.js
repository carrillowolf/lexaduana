export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/auth/',
          '/dashboard',
          '/favoritos',
          '/monitor',
          '/cbam/asesoria/solicitud',
          '/cbam/asesoria/mis-solicitudes',
          '/cbam/historial',
        ],
      },
    ],
    sitemap: 'https://lexaduana.es/sitemap.xml',
  }
}
