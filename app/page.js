'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation, useLocale } from '@/lib/i18n'
import { landingDict } from '@/lib/i18n/landing'
import LanguageSwitcher from '@/components/LanguageSwitcher'

// ── Animated counter ────────────────────────────────────────
function Counter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0)
  const started = useRef(false)
  const ref = useRef(null)
  const { locale } = useLocale()
  useEffect(() => {
    if (started.current) return
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        obs.unobserve(el)
        let c = 0
        const step = Math.ceil(end / (duration / 16))
        const timer = setInterval(() => {
          c += step
          if (c >= end) { setCount(end); clearInterval(timer) }
          else setCount(c)
        }, 16)
      }
    }, { rootMargin: '100px' })
    obs.observe(el)
    const t = setTimeout(() => { if (!started.current) { started.current = true; setCount(end) } }, 2500)
    return () => { obs.disconnect(); clearTimeout(t) }
  }, [end, duration])
  return <span ref={ref}>{count.toLocaleString(locale === 'en' ? 'en-GB' : 'es-ES')}{suffix}</span>
}

// ── Tool icon components (stable, not translated) ──────────
const TOOL_ICONS = [
  <svg key="calc" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  <svg key="class" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  <svg key="cbam" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  <svg key="oea" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
  <svg key="eudr" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
]

const TOOL_HREFS = ['/calculadora', '/clasificador', '/cbam', '/oea', '/eudr']
const TOOL_ACCENTS = ['#3B82F6', '#A855F7', '#10B981', '#EF4444', '#22C55E']
const TOOL_ACCENT_BGS = ['rgba(59, 130, 246, 0.15)', 'rgba(168, 85, 247, 0.15)', 'rgba(16, 185, 129, 0.15)', 'rgba(239, 68, 68, 0.15)', 'rgba(34, 197, 94, 0.15)']

const RESOURCE_HREFS = ['/incoterms', '/valor-en-aduana', '/glosario', '/tipos-cambio', '/bulk', '/despachos', '/cambios']
const RESOURCE_BADGES = [null, null, null, null, null, 'BETA', 'NEW']
const RESOURCE_ICONS = [
  <svg key="inc" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  <svg key="val" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>,
  <svg key="glo" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  <svg key="fx" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  <svg key="bulk" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
  <svg key="desp" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  <svg key="changes" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>,
]

const ROLE_ICONS = [
  <svg key="imp" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  <svg key="agent" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  <svg key="cons" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
]

const STAT_VALUES = [390735, 49700, 573, 195]
const STAT_SUFFIXES = ['', '+', '', '']

const FOOTER_TOOL_HREFS = ['/calculadora', '/clasificador', '/cbam', '/comparador', '/bulk', '/despachos']
const FOOTER_RESOURCE_HREFS = ['/incoterms', '/valor-en-aduana', '/glosario', '/tipos-cambio', '/eudr', '/cambios']
const FOOTER_LEGAL_HREFS = ['/politica-privacidad', '/terminos-uso', 'mailto:soporte@lexaduana.es']

const HEADER_LINKS = ['/calculadora', '/incoterms', '/cbam', '/clasificador', '/valor-en-aduana']

// ── Main component ──────────────────────────────────────────
export default function HomePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTool, setActiveTool] = useState(0)
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslation(landingDict)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
      if (user) router.push('/calculadora')
    }
    checkUser()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060d16] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#F4C542] border-t-transparent" />
      </div>
    )
  }

  if (user) return null

  const toolItems = t('tools.items')
  const toolData = Array.isArray(toolItems) ? toolItems : []
  const tool = toolData[activeTool] || {}
  const accent = TOOL_ACCENTS[activeTool]
  const accentBg = TOOL_ACCENT_BGS[activeTool]

  const headerLabels = [t('header.calculator'), t('header.incoterms'), t('header.cbam'), t('header.classifier'), t('header.customsValue')]
  const statItems = t('stats.items')
  const resourceItems = t('resources.items')
  const roles = t('audience.roles')

  return (
    <div className="min-h-screen bg-[#060d16] text-white" style={{ scrollBehavior: 'smooth' }}>

      <style jsx global>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(244,197,66,0.15); } 50% { box-shadow: 0 0 40px rgba(244,197,66,0.3); } }
      `}</style>

      {/* ═══ HEADER ═══════════════════════════════════════════ */}
      <header className="fixed top-0 w-full z-50 bg-[#060d16]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="LexAduana" className="h-8 w-8 rounded-lg bg-white p-0.5" />
            <span className="text-lg font-bold tracking-tight">LexAduana</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {HEADER_LINKS.map((href, i) => (
              <Link key={href} href={href}
                className="px-3.5 py-2 text-[13px] text-white/40 hover:text-white rounded-lg transition-colors duration-200">
                {headerLabels[i]}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Link href="/auth/login"
              className="hidden sm:inline-flex px-4 py-2 text-sm text-white/50 hover:text-white font-medium transition-colors">
              {t('header.login')}
            </Link>
            <Link href="/auth/register"
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#F4C542] hover:bg-[#f0b922] text-[#0A3D5C] text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 shadow-sm">
              {t('header.cta')}
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ HERO ═════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-[#060d16] via-[#0A1D2E] to-[#060d16]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#0A3D5C]/30 rounded-full blur-[150px]" />
        <div className="absolute top-1/4 -right-40 w-[400px] h-[400px] bg-[#F4C542]/8 rounded-full blur-[120px]" />

        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }} />

        <div className="relative max-w-5xl mx-auto px-6 text-center animate-[fadeUp_1s_ease-out_both]">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full mb-10">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm text-white/70 font-medium">{t('hero.badge')}</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight mb-8">
            {t('hero.titleLine1')}
            <br />
            {t('hero.titleLine2') && <>{t('hero.titleLine2')}{' '}</>}
            <span className="bg-gradient-to-r from-[#F4C542] via-[#f0d060] to-[#F4C542] bg-clip-text text-transparent">
              {t('hero.titleHighlight')}
            </span>
          </h1>

          <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register"
              className="group px-10 py-4 bg-[#F4C542] hover:bg-[#f0b922] text-[#0A3D5C] font-bold rounded-xl transition-all duration-300 shadow-lg shadow-[#F4C542]/20 hover:shadow-xl hover:shadow-[#F4C542]/30 text-sm tracking-wide"
              style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}>
              {t('hero.cta')}
              <svg className="inline-block w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <a href="#herramientas"
              className="px-10 py-4 text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 text-sm font-medium cursor-pointer hover:bg-white/5">
              {t('hero.ctaSecondary')}
            </a>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[10px] text-white/20 uppercase tracking-[3px]">{t('hero.scroll')}</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </section>

      {/* ═══ HERRAMIENTAS — Showcase ══════════════════════════ */}
      <section id="herramientas" className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 transition-colors duration-700"
          style={{ background: `radial-gradient(ellipse 60% 50% at 70% 50%, ${accentBg}, transparent)` }} />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="mb-20">
            <p className="text-xs font-semibold tracking-[4px] uppercase mb-4" style={{ color: accent }}>
              {t('tools.sectionLabel')}
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              {t('tools.titleLine1')}
              <br />
              <span className="text-white/30">{t('tools.titleLine2')}</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-5 space-y-2">
              {toolData.map((ti, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTool(i)}
                  className={`w-full text-left px-5 py-4 rounded-xl transition-all duration-300 cursor-pointer group ${
                    activeTool === i
                      ? 'bg-white/10 border border-white/10'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300"
                      style={{
                        backgroundColor: activeTool === i ? TOOL_ACCENT_BGS[i] : 'rgba(255,255,255,0.05)',
                        color: activeTool === i ? TOOL_ACCENTS[i] : 'rgba(255,255,255,0.3)',
                      }}>
                      {TOOL_ICONS[i]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold transition-colors duration-300 ${activeTool === i ? 'text-white' : 'text-white/50 group-hover:text-white/70'}`}>
                        {ti.title}
                      </h3>
                      <p className={`text-sm transition-colors duration-300 ${activeTool === i ? 'text-white/40' : 'text-white/20'}`}>
                        {ti.headline}
                      </p>
                    </div>
                    {activeTool === i && (
                      <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: TOOL_ACCENTS[i] }} />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-7" key={activeTool}>
              <div className="animate-[slideIn_0.4s_ease-out_both]">
                <h3 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight" style={{ color: accent }}>
                  {tool.headline}
                </h3>
                <p className="text-white/50 text-lg leading-relaxed mb-8 max-w-lg">
                  {tool.description}
                </p>

                <div className="flex flex-wrap gap-3 mb-10">
                  {Array.isArray(tool.features) && tool.features.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-300"
                      style={{
                        borderColor: `${accent}30`,
                        backgroundColor: `${accent}10`,
                        color: accent,
                      }}>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </span>
                  ))}
                </div>

                <Link href={TOOL_HREFS[activeTool]}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: accent, color: '#000' }}>
                  {tool.cta}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ IMPACTO — Big numbers ════════════════════════════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#060d16] via-[#0A1D2E] to-[#060d16]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F4C542]/5 rounded-full blur-[150px]" />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <p className="text-[#F4C542] text-xs font-semibold tracking-[4px] uppercase mb-4">{t('stats.sectionLabel')}</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              {t('stats.titleLine1')}<br /><span className="text-white/20">{t('stats.titleLine2')}</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {Array.isArray(statItems) && statItems.map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all duration-300">
                <p className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#F4C542] tracking-tight tabular-nums mb-2">
                  <Counter end={STAT_VALUES[i]} suffix={STAT_SUFFIXES[i]} />
                </p>
                <p className="text-white/60 text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-white/25 text-xs">{stat.sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ RECURSOS — Glassmorphism grid ════════════════════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#F4C542]/5 rounded-full blur-[120px]" />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <p className="text-blue-400 text-xs font-semibold tracking-[4px] uppercase mb-4">{t('resources.sectionLabel')}</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              {t('resources.titleLine1')}
              <br /><span className="text-white/20">{t('resources.titleLine2')}</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(resourceItems) && resourceItems.map((res, i) => (
              <Link key={i} href={RESOURCE_HREFS[i]} className="group">
                <div className="h-full p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-white/15 hover:bg-white/[0.07] transition-all duration-300">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-white/40 group-hover:text-white/70 transition-colors duration-300">
                      {RESOURCE_ICONS[i]}
                    </div>
                    <div className="flex items-center gap-2">
                      {RESOURCE_BADGES[i] && (
                        <span className="px-2 py-0.5 bg-[#F4C542]/10 text-[#F4C542] text-[10px] font-bold rounded-md border border-[#F4C542]/20">
                          {RESOURCE_BADGES[i]}
                        </span>
                      )}
                      <svg className="w-4 h-4 text-white/15 group-hover:text-white/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 17L17 7M17 7H7M17 7v10" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-semibold text-white/80 group-hover:text-white mb-2 transition-colors duration-200">{res.title}</h3>
                  <p className="text-sm text-white/30 group-hover:text-white/40 leading-relaxed transition-colors duration-200">{res.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PARA QUIÉN + COMPLIANCE — Cinematic split ════════ */}
      <section className="relative py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[#060d16] via-[#0c1a28] to-[#060d16]" />

        <div className="relative max-w-6xl mx-auto px-6">
          {/* Para quién */}
          <div className="mb-32">
            <div className="text-center mb-16">
              <p className="text-emerald-400 text-xs font-semibold tracking-[4px] uppercase mb-4">{t('audience.sectionLabel')}</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                {t('audience.title')}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {Array.isArray(roles) && roles.map((role, i) => (
                <div key={i} className="text-center p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all duration-300 group">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.06] group-hover:bg-white/[0.1] flex items-center justify-center mx-auto mb-6 text-white/40 group-hover:text-white/70 transition-all duration-300">
                    {ROLE_ICONS[i]}
                  </div>
                  <h3 className="text-lg font-semibold text-white/90 mb-3">{role.title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed">{role.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance */}
          <div>
            <div className="text-center mb-16">
              <p className="text-amber-400 text-xs font-semibold tracking-[4px] uppercase mb-4">{t('compliance.sectionLabel')}</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                {t('compliance.title')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* CBAM */}
              <div className="relative p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-amber-500/30 transition-all duration-300 overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">CBAM</h3>
                    <p className="text-xs text-amber-400 font-medium">{t('compliance.cbam.subtitle')}</p>
                  </div>
                </div>
                <p className="text-sm text-white/40 leading-relaxed mb-6">{t('compliance.cbam.desc')}</p>
                <Link href="/cbam/assessment"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors group/link">
                  {t('compliance.cbam.cta')}
                  <svg className="w-4 h-4 transition-transform duration-200 group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>

              {/* EUDR */}
              <div className="relative p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-green-500/30 transition-all duration-300 overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">EUDR</h3>
                    <p className="text-xs text-green-400 font-medium">{t('compliance.eudr.subtitle')}</p>
                  </div>
                </div>
                <p className="text-sm text-white/40 leading-relaxed mb-6">{t('compliance.eudr.desc')}</p>
                <Link href="/eudr"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-green-400 hover:text-green-300 transition-colors group/link">
                  {t('compliance.eudr.cta')}
                  <svg className="w-4 h-4 transition-transform duration-200 group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>

              {/* OEA */}
              <div className="relative p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-red-500/30 transition-all duration-300 overflow-hidden group md:col-span-2 lg:col-span-1">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">OEA</h3>
                    <p className="text-xs text-red-400 font-medium">{t('compliance.oea.subtitle')}</p>
                  </div>
                </div>
                <p className="text-sm text-white/40 leading-relaxed mb-6">{t('compliance.oea.desc')}</p>
                <Link href="/oea"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors group/link">
                  {t('compliance.oea.cta')}
                  <svg className="w-4 h-4 transition-transform duration-200 group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ════════════════════════════════════════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#060d16] to-[#0c1a28]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#F4C542]/8 rounded-full blur-[150px]" />

        <div className="relative max-w-3xl mx-auto text-center px-6">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            {t('finalCta.title')}
          </h2>
          <p className="text-white/35 text-lg mb-12 leading-relaxed max-w-xl mx-auto">
            {t('finalCta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register"
              className="group px-10 py-4 bg-[#F4C542] hover:bg-[#f0b922] text-[#0A3D5C] font-bold rounded-xl transition-all duration-300 shadow-lg shadow-[#F4C542]/20 hover:shadow-xl text-sm">
              {t('finalCta.cta')}
              <svg className="inline-block w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link href="/calculadora"
              className="px-10 py-4 text-white/60 hover:text-white border border-white/10 hover:border-white/20 font-medium rounded-xl transition-all duration-300 text-sm hover:bg-white/5">
              {t('finalCta.ctaSecondary')}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══════════════════════════════════════════ */}
      <footer className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-12 gap-12">
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-5">
                <img src="/logo.png" alt="LexAduana" className="h-9 w-9 rounded-lg bg-white p-0.5" />
                <div>
                  <h3 className="text-lg font-bold tracking-tight">LexAduana</h3>
                  <p className="text-white/20 text-xs">{t('footer.tagline')}</p>
                </div>
              </div>
              <p className="text-white/20 text-sm leading-relaxed mb-6 max-w-sm">
                {t('footer.desc')}
              </p>
              <div className="flex gap-4 text-sm">
                <Link href="https://lexaduana.es" className="text-[#F4C542]/60 hover:text-[#F4C542] transition-colors">lexaduana.es</Link>
                <span className="text-white/10">|</span>
                <Link href="https://lexaduana.eu" className="text-[#F4C542]/60 hover:text-[#F4C542] transition-colors">lexaduana.eu</Link>
              </div>
            </div>

            <div className="md:col-span-3">
              <h4 className="text-sm font-semibold mb-5 text-white/50">{t('footer.toolsTitle')}</h4>
              <ul className="space-y-3">
                {Array.isArray(t('footer.toolsLinks')) && t('footer.toolsLinks').map((label, i) => (
                  <li key={i}><Link href={FOOTER_TOOL_HREFS[i]} className="text-sm text-white/20 hover:text-white/60 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-sm font-semibold mb-5 text-white/50">{t('footer.resourcesTitle')}</h4>
              <ul className="space-y-3">
                {Array.isArray(t('footer.resourcesLinks')) && t('footer.resourcesLinks').map((label, i) => (
                  <li key={i}><Link href={FOOTER_RESOURCE_HREFS[i]} className="text-sm text-white/20 hover:text-white/60 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-sm font-semibold mb-5 text-white/50">{t('footer.legalTitle')}</h4>
              <ul className="space-y-3">
                {Array.isArray(t('footer.legalLinks')) && t('footer.legalLinks').map((label, i) => (
                  <li key={i}><Link href={FOOTER_LEGAL_HREFS[i]} className="text-sm text-white/20 hover:text-white/60 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5">
          <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/15 text-xs">{t('footer.copyright')}</p>
            <p className="text-white/10 text-xs">{t('footer.dataSource')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
