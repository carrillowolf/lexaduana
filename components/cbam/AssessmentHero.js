'use client'

import { useTranslation } from '@/lib/i18n'
import { cbamDict } from '@/lib/i18n/cbam'

export default function AssessmentHero() {
  const t = useTranslation(cbamDict)

  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
            {t('assessment.heroBadge')}
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            {t('assessment.heroTitle')}{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              CBAM
            </span>
            {t('assessment.heroTitleEnd')}
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            {t('assessment.heroDesc')}
          </p>
          <p className="text-sm text-gray-400">
            {t('assessment.heroMeta')}
          </p>
        </div>
      </div>
    </section>
  )
}
