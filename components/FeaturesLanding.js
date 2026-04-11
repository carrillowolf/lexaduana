'use client'

import { useTranslation } from '@/lib/i18n'
import { landingDict } from '@/lib/i18n/landing'

export default function FeaturesLanding() {
  const t = useTranslation(landingDict)

  const features = [
    { icon: '🎯', title: t('features.f1Title'), description: t('features.f1Desc'), highlight: t('features.f1Highlight') },
    { icon: '💱', title: t('features.f2Title'), description: t('features.f2Desc'), highlight: t('features.f2Highlight') },
    { icon: '📊', title: t('features.f3Title'), description: t('features.f3Desc'), highlight: t('features.f3Highlight') },
    { icon: '⚠️', title: t('features.f4Title'), description: t('features.f4Desc'), highlight: t('features.f4Highlight') },
    { icon: '🧮', title: t('features.f5Title'), description: t('features.f5Desc'), highlight: t('features.f5Highlight') },
    { icon: '📤', title: t('features.f6Title'), description: t('features.f6Desc'), highlight: t('features.f6Highlight') },
  ]

  return (
    <div className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0A3D5C] mb-4">
              {t('features.sectionTitle')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('features.sectionSubtitle')}
            </p>
          </div>

          {/* Grid de features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-gray-50 rounded-xl hover:bg-[#0A3D5C] transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-[#F4C542]"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>

                <div className="mb-2 inline-block px-3 py-1 bg-[#F4C542] text-[#0A3D5C] text-xs font-bold rounded-full group-hover:bg-white">
                  {feature.highlight}
                </div>

                <h3 className="text-xl font-bold text-[#0A3D5C] mb-3 group-hover:text-white">
                  {feature.title}
                </h3>

                <p className="text-gray-600 group-hover:text-gray-200">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA secundario */}
          <div className="mt-16 text-center">
            <div className="inline-block p-8 bg-gradient-to-r from-[#0A3D5C] to-[#0d5279] rounded-xl text-white">
              <h3 className="text-2xl font-bold mb-3">
                {t('features.ctaTitle')}
              </h3>
              <p className="text-gray-200 mb-6">
                {t('features.ctaDesc')}
              </p>
              <a
                href="/bulk"
                className="inline-block px-8 py-4 bg-[#F4C542] text-[#0A3D5C] font-bold rounded-lg hover:bg-[#E5B63A] transition"
              >
                {t('features.ctaButton')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
