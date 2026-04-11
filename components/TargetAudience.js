'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { landingDict } from '@/lib/i18n/landing'

export default function TargetAudience() {
  const t = useTranslation(landingDict)

  const profiles = [
    {
      icon: '🏢',
      title: t('audience.p1Title'),
      subtitle: t('audience.p1Subtitle'),
      benefits: [
        t('audience.p1B1'),
        t('audience.p1B2'),
        t('audience.p1B3'),
        t('audience.p1B4'),
      ],
      cta: t('audience.p1Cta'),
      color: 'blue'
    },
    {
      icon: '🛃',
      title: t('audience.p2Title'),
      subtitle: t('audience.p2Subtitle'),
      benefits: [
        t('audience.p2B1'),
        t('audience.p2B2'),
        t('audience.p2B3'),
        t('audience.p2B4'),
      ],
      cta: t('audience.p2Cta'),
      color: 'yellow'
    },
    {
      icon: '💼',
      title: t('audience.p3Title'),
      subtitle: t('audience.p3Subtitle'),
      benefits: [
        t('audience.p3B1'),
        t('audience.p3B2'),
        t('audience.p3B3'),
        t('audience.p3B4'),
      ],
      cta: t('audience.p3Cta'),
      color: 'green'
    }
  ]

  return (
    <div className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0A3D5C] mb-4">
              {t('audience.sectionTitle')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('audience.sectionSubtitle')}
            </p>
          </div>

          {/* Grid de perfiles */}
          <div className="grid md:grid-cols-3 gap-8">
            {profiles.map((profile, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-shadow"
              >
                <div className="text-6xl mb-4 text-center">{profile.icon}</div>

                <h3 className="text-2xl font-bold text-[#0A3D5C] mb-2 text-center">
                  {profile.title}
                </h3>

                <p className="text-gray-600 text-center mb-6">
                  {profile.subtitle}
                </p>

                <ul className="space-y-3 mb-8">
                  {profile.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-[#F4C542] mr-2 text-xl">✓</span>
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/register"
                  className="block text-center px-6 py-3 bg-[#0A3D5C] text-white font-semibold rounded-lg hover:bg-[#083249] transition"
                >
                  {profile.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
