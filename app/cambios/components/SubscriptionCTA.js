'use client'

export default function SubscriptionCTA({ t }) {
  return (
    <div className="bg-[#0A3D5C] rounded-xl p-6 text-center">
      <h3 className="text-lg font-semibold text-white mb-2">
        {t('cta.title')}
      </h3>
      <p className="text-sm text-white/60 mb-4 max-w-md mx-auto">
        {t('cta.description')}
      </p>
      <span className="inline-flex items-center px-4 py-2 bg-white/10 text-white/80 rounded-lg text-sm font-medium border border-white/20">
        {t('cta.soon')}
      </span>
    </div>
  )
}
