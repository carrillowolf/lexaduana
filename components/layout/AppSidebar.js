'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { useSidebar } from './SidebarContext'
import { useTranslation } from '@/lib/i18n'
import { commonDict } from '@/lib/i18n/common'

const STORAGE_KEY = 'lexaduana-sidebar-sections'

// ============================================================
// NAVIGATION STRUCTURE (dynamic labels via i18n)
// ============================================================

function useNavSections() {
  const t = useTranslation(commonDict)
  return {
    sections: [
      {
        key: 'tools',
        label: t('nav.tools'),
        items: [
          { href: '/calculadora', icon: '🧮', label: t('nav.calculator') },
          { href: '/clasificador', icon: '🤖', label: t('nav.classifier') },
          { href: '/factura-ocr', icon: '📄', label: t('nav.invoiceOcr'), badge: 'New' },
          { href: '/comparador', icon: '⚖️', label: t('nav.comparator') },
          { href: '/origen', icon: '🌍', label: t('nav.origin') },
          { href: '/despachos', icon: '📋', label: t('nav.dispatches') },
          { href: '/bulk', icon: '📊', label: t('nav.bulkCalc') },
          { href: '/cambios', icon: '🔄', label: t('nav.changes'), badge: 'New' },
          { href: '/rrm', icon: '📑', label: t('nav.rrm'), badge: 'New' },
        ],
      },
      {
        key: 'regulations',
        label: t('nav.regulations'),
        items: [
          {
            href: '/cbam',
            icon: '🏭',
            label: t('nav.cbam'),
            expandable: true,
            children: [
              { href: '/cbam/assessment', label: t('nav.cbamAssessment') },
              { href: '/cbam/calculadora', label: t('nav.cbamCalculator') },
              { href: '/cbam/asesoria', label: t('nav.cbamAdvisory') },
              { href: '/cbam/asesoria/mis-solicitudes', label: t('nav.cbamMyRequests'), authRequired: true },
              { href: '/cbam/historial', label: t('nav.cbamHistory') },
              { href: '/cbam/guia', label: t('nav.cbamGuide') },
            ],
          },
          { href: '/eudr', icon: '🌳', label: t('nav.eudr') },
          { href: '/oea', icon: '🛡️', label: t('nav.oea') },
        ],
      },
      {
        key: 'resources',
        label: t('nav.resources'),
        items: [
          { href: '/glosario', icon: '📖', label: t('nav.glossary') },
          { href: '/incoterms', icon: '📦', label: t('nav.incoterms') },
          { href: '/valor-en-aduana', icon: '⚖️', label: t('nav.customsValue') },
          { href: '/tipos-cambio', icon: '💱', label: t('nav.exchangeRates') },
        ],
      },
    ],
    authItems: [
      { href: '/dashboard', icon: '📈', label: t('nav.dashboard') },
      { href: '/favoritos', icon: '⭐', label: t('nav.favorites') },
    ],
    loginLabel: t('nav.login'),
    suiteLabel: t('nav.suiteLabel'),
  }
}

// ============================================================
// SECTION COLLAPSE PERSISTENCE
// ============================================================

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSectionState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* noop */ }
}

function useSectionCollapse(sections, isActiveFn) {
  const [expanded, setExpanded] = useState(() => {
    const initial = {}
    for (const s of sections) {
      initial[s.key] = true
    }
    return initial
  })

  useEffect(() => {
    const saved = loadSavedState()
    const next = {}
    for (const s of sections) {
      const sectionHasActive = s.items.some((item) => {
        if (isActiveFn(item.href)) return true
        if (item.children) return item.children.some((c) => isActiveFn(c.href))
        return false
      })
      if (sectionHasActive) {
        next[s.key] = true
      } else if (saved && saved[s.key] !== undefined) {
        next[s.key] = saved[s.key]
      } else {
        next[s.key] = false
      }
    }
    setExpanded(next)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setExpanded((prev) => {
      let changed = false
      const next = { ...prev }
      for (const s of sections) {
        const sectionHasActive = s.items.some((item) => {
          if (isActiveFn(item.href)) return true
          if (item.children) return item.children.some((c) => isActiveFn(c.href))
          return false
        })
        if (sectionHasActive && !prev[s.key]) {
          next[s.key] = true
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [sections, isActiveFn])

  const toggle = useCallback((key) => {
    setExpanded((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      saveSectionState(next)
      return next
    })
  }, [])

  return { expanded, toggle }
}

// ============================================================
// COMPONENTS
// ============================================================

function SectionChevron({ open }) {
  return (
    <svg
      className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}
      fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  )
}

function NavItem({ href, icon, label, badge, isActive, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? 'bg-blue-50 text-[#0A3D5C] font-semibold border-l-[3px] border-[#0A3D5C] -ml-px'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span className="text-base flex-shrink-0 w-5 text-center">{icon}</span>
      <span className="truncate flex-1">{label}</span>
      {badge && (
        <span className="text-[10px] font-bold bg-[#F4C542] text-[#0A3D5C] px-1.5 py-0.5 rounded">
          {badge}
        </span>
      )}
    </Link>
  )
}

function ExpandableNavItem({ item, pathname, onNavigate, user }) {
  const isParentActive = pathname.startsWith(item.href)
  const [expanded, setExpanded] = useState(isParentActive)

  useEffect(() => {
    if (isParentActive) setExpanded(true)
  }, [isParentActive])

  const visibleChildren = item.children.filter(c => !c.authRequired || user)

  const rowClasses = `flex items-center text-sm transition-colors ${
    isParentActive
      ? 'bg-blue-50 text-[#0A3D5C] font-semibold border-l-[3px] border-[#0A3D5C] -ml-px'
      : 'text-gray-700 font-medium hover:bg-gray-100'
  }`

  return (
    <div>
      <div className={`${rowClasses} rounded-lg`}>
        <Link
          href={item.href}
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2 flex-1 min-w-0 rounded-l-lg"
        >
          <span className="text-base flex-shrink-0 w-5 text-center">{item.icon}</span>
          <span className="truncate flex-1 text-left">{item.label}</span>
        </Link>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Colapsar' : 'Expandir'}
          aria-expanded={expanded}
          className="px-2 py-2 flex-shrink-0 rounded-r-lg hover:bg-black/5"
        >
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className={`ml-8 mt-0.5 space-y-0.5 border-l pl-3 rounded-r-md ${
          isParentActive ? 'border-[#0A3D5C]/30 bg-[#0A3D5C]/[0.03]' : 'border-gray-200'
        }`}>
          {visibleChildren.map((child) => {
            const isChildActive = pathname === child.href
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={`block px-2 py-1.5 rounded text-sm transition-colors ${
                  isChildActive
                    ? 'text-[#0A3D5C] font-semibold bg-blue-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {child.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================
// SIDEBAR
// ============================================================

export default function AppSidebar() {
  const pathname = usePathname()
  const { isOpen, isMobile, closeSidebar } = useSidebar()
  const [user, setUser] = useState(null)
  const supabase = createClient()
  const { sections: NAV_SECTIONS, authItems: AUTH_ITEMS, loginLabel, suiteLabel } = useNavSections()

  const isActive = useCallback((href) => {
    if (href === '/cbam') return pathname === '/cbam'
    return pathname === href || pathname.startsWith(href + '/')
  }, [pathname])

  const { expanded: sectionExpanded, toggle: toggleSection } = useSectionCollapse(NAV_SECTIONS, isActive)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  function handleNavigate() {
    if (isMobile) closeSidebar()
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-3" onClick={handleNavigate}>
          <img src="/logo.png" alt="LexAduana" className="h-9 w-9 rounded-lg bg-white p-0.5" />
          <div className="min-w-0">
            <p className="text-base font-bold text-[#0A3D5C] truncate">LexAduana</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{suiteLabel}</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {NAV_SECTIONS.map((section) => {
          const open = sectionExpanded[section.key] !== false
          return (
            <div key={section.key}>
              <button
                type="button"
                onClick={() => toggleSection(section.key)}
                aria-expanded={open}
                className="flex items-center gap-1.5 w-full px-3 mb-1 cursor-pointer group"
              >
                <SectionChevron open={open} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 group-hover:text-gray-500 transition-colors">
                  {section.label}
                </span>
              </button>
              {open && (
                <div className="space-y-0.5">
                  {section.items.map((item) =>
                    item.expandable ? (
                      <ExpandableNavItem
                        key={item.href}
                        item={item}
                        pathname={pathname}
                        onNavigate={handleNavigate}
                        user={user}
                      />
                    ) : (
                      <NavItem
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        label={item.label}
                        badge={item.badge}
                        isActive={isActive(item.href)}
                        onClick={handleNavigate}
                      />
                    )
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-100 px-3 py-3 space-y-0.5">
        {user && AUTH_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={isActive(item.href)}
            onClick={handleNavigate}
          />
        ))}
        {!user && (
          <NavItem
            href="/auth/login"
            icon="👤"
            label={loginLabel}
            isActive={false}
            onClick={handleNavigate}
          />
        )}
      </div>

      {/* Version */}
      <div className="px-4 py-2 border-t border-gray-50">
        <p className="text-[10px] text-gray-300">v5.8.0</p>
      </div>
    </div>
  )

  // Desktop: sidebar fija
  if (!isMobile) {
    return (
      <aside className="hidden md:flex w-[220px] flex-shrink-0 border-r border-gray-200 h-screen sticky top-0 bg-white z-10 shadow-[2px_0_8px_rgba(0,0,0,0.08)]">
        {sidebarContent}
      </aside>
    )
  }

  // Mobile: drawer overlay
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] shadow-xl md:hidden transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
