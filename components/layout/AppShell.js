'use client'

import { usePathname } from 'next/navigation'
import { SidebarProvider } from './SidebarContext'
import AppSidebar from './AppSidebar'
import AppTopbar from './AppTopbar'

// Rutas que NO llevan sidebar (marketing, auth, legal)
const BARE_ROUTES = [
  '/',
  '/auth',
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
    return <>{children}</>
  }

  // Páginas con sidebar: app-like layout
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <AppTopbar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
