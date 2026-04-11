'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { landingDict } from '@/lib/i18n/landing'

export default function HeroLanding() {
  const t = useTranslation(landingDict)

  return (
    <div className="relative bg-[#0A3D5C] text-white overflow-hidden">
      {/* Patrón de fondo sutil */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Logo + Nav */}
          <div className="flex justify-between items-center mb-16">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="LexAduana"
                width={60}
                height={60}
                className="drop-shadow-lg"
              />
              <div>
                <h1 className="text-2xl font-bold">LEXADUANA</h1>
                <p className="text-sm text-[#F4C542]">{t('hero.tagline')}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Link href="/auth/login" className="px-4 py-2 text-white hover:text-[#F4C542] transition">
                {t('hero.login')}
              </Link>
              <Link href="/auth/register" className="px-6 py-2 bg-[#F4C542] text-[#0A3D5C] font-semibold rounded-lg hover:bg-[#E5B63A] transition">
                {t('hero.register')}
              </Link>
            </div>
          </div>

          {/* Hero principal */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Izquierda: Claim */}
            <div>
              <h2 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {t('hero.title')}
                <span className="block text-[#F4C542]">{t('hero.titleHighlightAlt')}</span>
              </h2>

              <p className="text-xl mb-8 text-gray-300">
                {t('hero.subtitleAlt')}
              </p>

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <div className="text-3xl font-bold text-[#F4C542]">49.7K</div>
                  <div className="text-sm text-gray-300">{t('hero.statTaric')}</div>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <div className="text-3xl font-bold text-[#F4C542]">195</div>
                  <div className="text-sm text-gray-300">{t('hero.statCountries')}</div>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <div className="text-3xl font-bold text-[#F4C542]">30</div>
                  <div className="text-sm text-gray-300">{t('hero.statCurrencies')}</div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex gap-4">
                <a
                  href="#calculator"
                  className="px-8 py-4 bg-[#F4C542] text-[#0A3D5C] font-bold rounded-lg hover:bg-[#E5B63A] transition text-lg"
                >
                  {t('hero.ctaPrimary')}
                </a>
                <Link
                  href="/bulk"
                  className="px-8 py-4 border-2 border-[#F4C542] text-[#F4C542] font-semibold rounded-lg hover:bg-[#F4C542] hover:text-[#0A3D5C] transition text-lg"
                >
                  {t('hero.ctaSecondaryAlt')}
                </Link>
              </div>

              <p className="text-sm text-gray-400 mt-4">
                {t('hero.trust')}
              </p>
            </div>

            {/* Derecha: Visual impactante */}
            <div className="relative">
              {/* Box principal */}
              <div className="bg-white rounded-xl shadow-2xl p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {t('hero.exampleTitle')}
                  </h3>
                  <p className="text-gray-600">
                    {t('hero.exampleRoute')}
                  </p>
                </div>

                {/* Simulación de cálculo */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-700">{t('hero.hsCode')}</span>
                    <span className="font-mono font-bold text-[#0A3D5C]">8471300000</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-700">{t('hero.cifValue')}</span>
                    <span className="font-bold text-gray-900">1,000.00 €</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-700">{t('hero.country')}</span>
                    <span className="font-semibold text-gray-900">🇨🇳 China</span>
                  </div>

                  <div className="border-t-2 border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">{t('hero.duty')}</span>
                      <span className="font-semibold text-gray-900">35.00 €</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">{t('hero.vat')}</span>
                      <span className="font-semibold text-gray-900">217.35 €</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#F4C542]/20 rounded-lg">
                      <span className="font-bold text-[#0A3D5C]">TOTAL:</span>
                      <span className="text-2xl font-bold text-[#0A3D5C]">1,252.35 €</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    {t('hero.validated')}
                  </p>
                </div>
              </div>

              {/* Badge flotante */}
              <div className="absolute -top-4 -right-4 bg-[#F4C542] text-[#0A3D5C] px-4 py-2 rounded-full font-bold shadow-lg">
                {t('hero.updatedBadge')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ola inferior */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
        </svg>
      </div>
    </div>
  )
}
