'use client'

import { usePathname } from 'next/navigation'
import UserMenu from '@/components/UserMenu'
import { useSidebar } from './SidebarContext'

// Mapa de rutas a títulos de página
const PAGE_TITLES = {
  '/calculadora': 'Calculadora TARIC',
  '/clasificador': 'Clasificador IA',
  '/comparador': 'Comparador Multi-Origen',
  '/despachos': 'Gestor de Despachos',
  '/bulk': 'Cálculo Masivo',
  '/cbam': 'CBAM',
  '/cbam/assessment': 'Autoevaluación CBAM',
  '/cbam/guia': 'Guía CBAM',
  '/cbam/asesoria': 'Asesoría CBAM',
  '/cbam/asesoria/solicitud': 'Nueva Solicitud',
  '/cbam/asesoria/mis-solicitudes': 'Mis Solicitudes',
  '/cbam/historial': 'Historial CBAM',
  '/eudr': 'EUDR - Deforestación',
  '/glosario': 'Glosario',
  '/tipos-cambio': 'Tipos de Cambio',
  '/dashboard': 'Dashboard',
  '/favoritos': 'Favoritos',
  '/monitor': 'Monitor',
  '/admin/cbam': 'Admin CBAM',
  '/admin/clasificaciones': 'Admin Clasificaciones',
}

function getPageTitle(pathname) {
  // Match exacto primero
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]

  // Match por prefijo (para subrutas de despachos, etc.)
  const sorted = Object.keys(PAGE_TITLES).sort((a, b) => b.length - a.length)
  for (const route of sorted) {
    if (pathname.startsWith(route)) return PAGE_TITLES[route]
  }

  return 'LexAduana'
}

export default function AppTopbar() {
  const pathname = usePathname()
  const { toggleSidebar, isMobile } = useSidebar()
  const title = getPageTitle(pathname)

  return (
    <header className="h-14 flex-shrink-0 sticky top-0 z-30 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
      {/* Hamburger - solo móvil */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors md:hidden"
          aria-label="Abrir menú"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      )}

      {/* Título de página */}
      <h1 className="text-sm font-semibold text-gray-800 truncate flex-1">
        {title}
      </h1>

      {/* UserMenu */}
      <div className="flex-shrink-0">
        <UserMenu />
      </div>
    </header>
  )
}
