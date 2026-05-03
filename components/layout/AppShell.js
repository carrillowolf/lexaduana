'use client'

import { usePathname } from 'next/navigation'
import { SidebarProvider } from './SidebarContext'
import { LocaleProvider } from '@/lib/i18n'
import AppSidebar from './AppSidebar'
import AppTopbar from './AppTopbar'

// Rutas que NO llevan sidebar (marketing, auth, legal)
const BARE_ROUTES = [
  '/',
  '/auth',
  '/privacidad',
  '/aviso-legal',
  '/cookies',
  '/terminos',
  // Legacy redirects (308 → URL canónica)
  '/politica-privacidad',
  '/terminos-uso',
]

function shouldShowShell(pathname) {
  return !BARE_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )
}

export default function AppShell({ children }) {
  const pathname = usePathname()

  // Páginas sin sidebar: render directo
  if (!shouldShowShell(pathname)) {
    return <LocaleProvider>{children}</LocaleProvider>
  }

  // Páginas con sidebar: app-like layout
  return (
    <LocaleProvider>
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <AppTopbar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden md:pl-4">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
    </LocaleProvider>
  )
}
