import { permanentRedirect } from 'next/navigation'

export const dynamic = 'force-static'

// Mantenido por compatibilidad: la URL canónica desde 2026-05-03 es /privacidad.
// Redirect 308 (permanent) preserva SEO y el método HTTP original.
export default function LegacyPoliticaPrivacidadPage() {
  permanentRedirect('/privacidad')
}
