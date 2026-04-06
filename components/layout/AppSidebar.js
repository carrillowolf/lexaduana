'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { useSidebar } from './SidebarContext'

// ============================================================
// NAVIGATION STRUCTURE
// ============================================================

const NAV_SECTIONS = [
  {
    label: 'HERRAMIENTAS',
    items: [
      { href: '/calculadora', icon: '🧮', label: 'Calculadora' },
      { href: '/clasificador', icon: '🤖', label: 'Clasificador IA' },
      { href: '/comparador', icon: '⚖️', label: 'Comparador' },
      { href: '/despachos', icon: '📋', label: 'Despachos' },
      { href: '/bulk', icon: '📊', label: 'Cálculo masivo' },
    ],
  },
  {
    label: 'REGULACIONES UE',
    items: [
      {
        href: '/cbam',
        icon: '🏭',
        label: 'CBAM',
        expandable: true,
        children: [
          { href: '/cbam', label: 'Hub principal' },
          { href: '/cbam/assessment', label: 'Autoevaluación' },
          { href: '/cbam/guia', label: 'Guía' },
          { href: '/cbam/asesoria', label: 'Asesoría' },
          { href: '/cbam/historial', label: 'Historial' },
        ],
      },
      { href: '/eudr', icon: '🌳', label: 'EUDR' },
      { href: '/oea', icon: '🛡️', label: 'OEA' },
    ],
  },
  {
    label: 'RECURSOS',
    items: [
      { href: '/glosario', icon: '📖', label: 'Glosario' },
      { href: '/incoterms', icon: '📦', label: 'Incoterms 2020' },
      { href: '/valor-en-aduana', icon: '⚖️', label: 'Valor en Aduana' },
      { href: '/tipos-cambio', icon: '💱', label: 'Tipos de cambio' },
    ],
  },
]

const AUTH_ITEMS = [
  { href: '/dashboard', icon: '📈', label: 'Dashboard' },
  { href: '/favoritos', icon: '⭐', label: 'Favoritos' },
]

// ============================================================
// COMPONENTS
// ============================================================

function NavItem({ href, icon, label, isActive, onClick }) {
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
      <span className="truncate">{label}</span>
    </Link>
  )
}

function ExpandableNavItem({ item, pathname, onNavigate }) {
  const isParentActive = pathname.startsWith(item.href)
  const [expanded, setExpanded] = useState(isParentActive)

  // Auto-expand cuando estemos en una subruta
  useEffect(() => {
    if (isParentActive) setExpanded(true)
  }, [isParentActive])

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          isParentActive
            ? 'bg-blue-50 text-[#0A3D5C] font-semibold'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <span className="text-base flex-shrink-0 w-5 text-center">{item.icon}</span>
        <span className="truncate flex-1 text-left">{item.label}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {expanded && (
        <div className="ml-8 mt-0.5 space-y-0.5 border-l border-gray-200 pl-3">
          {item.children.map((child) => {
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

  function isActive(href) {
    if (href === '/cbam') return pathname === '/cbam'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-3" onClick={handleNavigate}>
          <img src="/logo.png" alt="LexAduana" className="h-9 w-9 rounded-lg bg-white p-0.5" />
          <div className="min-w-0">
            <p className="text-base font-bold text-[#0A3D5C] truncate">LexAduana</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Suite de Comercio</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) =>
                item.expandable ? (
                  <ExpandableNavItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onNavigate={handleNavigate}
                  />
                ) : (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive(item.href)}
                    onClick={handleNavigate}
                  />
                )
              )}
            </div>
          </div>
        ))}
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
            label="Iniciar sesión"
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
      <aside className="hidden md:flex w-[220px] flex-shrink-0 border-r border-gray-200 h-screen sticky top-0">
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
