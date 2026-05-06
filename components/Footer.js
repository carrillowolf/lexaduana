'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { landingDict } from '@/lib/i18n/landing'

const FOOTER_TOOL_HREFS = ['/cbam', '/calculadora', '/clasificador', '/comparador', '/bulk', '/despachos']
const FOOTER_RESOURCE_HREFS = ['/incoterms', '/valor-en-aduana', '/glosario', '/tipos-cambio', '/eudr', '/cambios']
// Orden alineado con landingDict.footer.legalLinks: privacidad, términos, aviso
// legal, cookies, contacto. Los 4 primeros son requisito RGPD/LSSI y deben
// aparecer en TODAS las páginas (LSSI-CE art. 10, AEPD).
const FOOTER_LEGAL_HREFS = ['/privacidad', '/terminos', '/aviso-legal', '/cookies', 'mailto:soporte@lexaduana.es']

export default function Footer() {
  const t = useTranslation(landingDict)

  return (
    <footer className="bg-[#060d16] text-white border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
  )
}
