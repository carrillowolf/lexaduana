import { permanentRedirect } from 'next/navigation'

export const dynamic = 'force-static'

// Mantenido por compatibilidad: la URL canónica desde 2026-05-03 es /terminos.
// Redirect 308 (permanent) preserva SEO y el método HTTP original.
export default function LegacyTerminosUsoPage() {
  permanentRedirect('/terminos')
}
