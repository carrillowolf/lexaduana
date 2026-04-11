'use client'

import { usePathname } from 'next/navigation'
import UserMenu from '@/components/UserMenu'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useSidebar } from './SidebarContext'
import { useTranslation } from '@/lib/i18n'
import { commonDict } from '@/lib/i18n/common'

function getPageTitle(pathname, t) {
  // Try exact match first
  const exact = t(`topbar.${pathname}`)
  if (exact && !exact.startsWith('topbar.')) return exact

  // Match by prefix (for dispatch sub-routes, etc.)
  const routes = Object.keys(commonDict.es.topbar).sort((a, b) => b.length - a.length)
  for (const route of routes) {
    if (pathname.startsWith(route)) {
      const val = t(`topbar.${route}`)
      if (val && !val.startsWith('topbar.')) return val
    }
  }

  return 'LexAduana'
}

export default function AppTopbar() {
  const pathname = usePathname()
  const { toggleSidebar, isMobile } = useSidebar()
  const t = useTranslation(commonDict)
  const title = getPageTitle(pathname, t)

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

      {/* Language Switcher */}
      <div className="flex-shrink-0">
        <LanguageSwitcher />
      </div>

      {/* UserMenu */}
      <div className="flex-shrink-0">
        <UserMenu />
      </div>
    </header>
  )
}
