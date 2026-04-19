'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import { commonDict } from '@/lib/i18n/common'

/**
 * Breadcrumb funcional para páginas CBAM.
 * Formato: CBAM / [sección] [/ subsección]
 * Se deriva del pathname. Cada nivel clicable excepto el último.
 * Sobrio, sin iconos, separador " / ".
 */
export default function CbamBreadcrumb() {
  const pathname = usePathname()
  const t = useTranslation(commonDict)

  const crumbs = buildCrumbs(pathname, t)
  if (crumbs.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2"
    >
      <ol className="flex items-center flex-wrap gap-x-1.5 text-xs text-gray-500">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <li key={`${crumb.href || 'leaf'}-${i}`} className="flex items-center gap-x-1.5">
              {i > 0 && <span className="text-gray-300" aria-hidden="true">/</span>}
              {isLast || !crumb.href ? (
                <span className="text-gray-700 font-medium">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-[#0A3D5C] hover:underline transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function buildCrumbs(pathname, t) {
  if (!pathname || !pathname.startsWith('/cbam')) return []

  // Raíz siempre
  const crumbs = [{ label: t('cbamBreadcrumb.root'), href: '/cbam' }]

  // Mapa pathname → nivel. Orden específico para rutas anidadas.
  const routeMap = [
    { match: /^\/cbam\/assessment(\/|$)/, add: [{ label: t('cbamBreadcrumb.assessment'), href: '/cbam/assessment' }] },
    { match: /^\/cbam\/calculadora(\/|$)/, add: [{ label: t('cbamBreadcrumb.calculator'), href: '/cbam/calculadora' }] },
    { match: /^\/cbam\/asesoria\/solicitud\/monitorizacion(\/|$)/, add: [
      { label: t('cbamBreadcrumb.advisory'), href: '/cbam/asesoria' },
      { label: t('cbamBreadcrumb.monitoringRequest'), href: '/cbam/asesoria/solicitud/monitorizacion' },
    ]},
    { match: /^\/cbam\/asesoria\/solicitud(\/|$)/, add: [
      { label: t('cbamBreadcrumb.advisory'), href: '/cbam/asesoria' },
      { label: t('cbamBreadcrumb.advisoryRequest'), href: '/cbam/asesoria/solicitud' },
    ]},
    { match: /^\/cbam\/asesoria\/mis-solicitudes(\/|$)/, add: [
      { label: t('cbamBreadcrumb.advisory'), href: '/cbam/asesoria' },
      { label: t('cbamBreadcrumb.myRequests'), href: '/cbam/asesoria/mis-solicitudes' },
    ]},
    { match: /^\/cbam\/asesoria(\/|$)/, add: [{ label: t('cbamBreadcrumb.advisory'), href: '/cbam/asesoria' }] },
    { match: /^\/cbam\/historial(\/|$)/, add: [{ label: t('cbamBreadcrumb.history'), href: '/cbam/historial' }] },
    { match: /^\/cbam\/guia(\/|$)/, add: [{ label: t('cbamBreadcrumb.guide'), href: '/cbam/guia' }] },
  ]

  for (const { match, add } of routeMap) {
    if (match.test(pathname)) {
      crumbs.push(...add)
      break
    }
  }

  // Si estamos exactamente en /cbam, el único crumb es la raíz sin link.
  if (pathname === '/cbam') {
    return [{ label: t('cbamBreadcrumb.root') }]
  }

  return crumbs
}
