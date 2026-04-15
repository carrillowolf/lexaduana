'use client'

import { useTranslation } from '@/lib/i18n'
import { rrmDict } from '@/lib/i18n/rrm'

export default function RRMProgressBar({ current }) {
  const t = useTranslation(rrmDict)
  const steps = [
    { id: 1, label: t('steps.step1') },
    { id: 2, label: t('steps.step2') },
    { id: 3, label: t('steps.step3') },
    { id: 4, label: t('steps.step4') },
  ]

  return (
    <div className="w-full mb-8">
      <div className="flex items-center gap-2">
        {steps.map((s, idx) => {
          const done = current > s.id
          const active = current === s.id
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={[
                    'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border',
                    done && 'bg-[#F4C542] text-black border-[#F4C542]',
                    active && 'bg-[#0A3D5C] text-white border-[#F4C542]',
                    !done && !active && 'bg-[#0a1628] text-gray-500 border-[#1a2d4a]',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {done ? '✓' : s.id}
                </div>
                <div
                  className={[
                    'text-xs sm:text-sm hidden sm:block',
                    active ? 'text-white font-semibold' : done ? 'text-[#F4C542]' : 'text-gray-500',
                  ].join(' ')}
                >
                  {s.label}
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={[
                    'h-px flex-1 mx-2',
                    done ? 'bg-[#F4C542]' : 'bg-[#1a2d4a]',
                  ].join(' ')}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
