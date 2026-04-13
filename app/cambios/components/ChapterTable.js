'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/i18n'
import { CHAPTER_NAMES_I18N } from '@/lib/i18n/cambios'

export default function ChapterTable({ chapters, onSelectChapter, t }) {
  const { locale } = useLocale()
  const chapterNames = CHAPTER_NAMES_I18N[locale] || CHAPTER_NAMES_I18N.es
  const [showAll, setShowAll] = useState(false)
  const [sortBy, setSortBy] = useState('chapter')

  if (!chapters || chapters.length === 0) return null

  const withMeasures = chapters.filter(ch => ch.measures > 0 || ch.conditions > 0 || ch.exclusions > 0)
  const footnotesOnly = chapters.filter(ch => ch.measures === 0 && ch.conditions === 0 && ch.exclusions === 0)

  const sorted = [...withMeasures].sort((a, b) => {
    if (sortBy === 'measures') return (b.measures + b.conditions + b.exclusions) - (a.measures + a.conditions + a.exclusions)
    if (sortBy === 'critical') return b.critical - a.critical
    return a.chapter.localeCompare(b.chapter)
  })

  function SortButton({ field, label }) {
    const active = sortBy === field
    return (
      <button
        onClick={() => setSortBy(field)}
        className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${active ? 'bg-[#C49B38]/20 text-[#C49B38] font-semibold' : 'text-gray-400 hover:text-white'}`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="bg-[#0F1A2E] rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-bold text-white">
            {t('chapters.title')}
            <span className="text-gray-500 font-normal text-sm ml-2">({withMeasures.length} {t('chapters.of97')})</span>
          </h3>
          <div className="flex gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/10">
            <SortButton field="chapter" label={t('chapters.sortChapter')} />
            <SortButton field="measures" label={t('chapters.sortMeasures')} />
            <SortButton field="critical" label={t('chapters.sortCritical')} />
          </div>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          {t('chapters.legend')}
          <span className="text-emerald-400"> {t('chapters.legendColors')}</span> {t('chapters.legendColorsAnd')} <span className="text-red-400">{t('chapters.legendColors2')}</span> {t('chapters.legendColors3')}
        </p>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wider border-t border-white/10">
              <th className="text-left px-5 py-2.5 font-semibold">{t('chapters.colChapter')}</th>
              <th className="text-left px-4 py-2.5 font-semibold">{t('chapters.colDescription')}</th>
              <th className="text-right px-4 py-2.5 font-semibold">{t('chapters.colMeasures')}</th>
              <th className="text-right px-4 py-2.5 font-semibold hidden sm:table-cell">{t('chapters.colNew')}</th>
              <th className="text-right px-4 py-2.5 font-semibold hidden sm:table-cell">{t('chapters.colRemoved')}</th>
              <th className="text-right px-4 py-2.5 font-semibold hidden md:table-cell">{t('chapters.colConditions')}</th>
              <th className="text-right px-5 py-2.5 font-semibold">{t('chapters.colCritical')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((ch, i) => (
              <tr
                key={ch.chapter}
                onClick={() => onSelectChapter?.(ch.chapter)}
                className={`cursor-pointer transition-colors hover:bg-white/[0.06] border-t border-white/[0.04] ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
              >
                <td className="px-5 py-2.5 text-[#C49B38] font-mono font-bold">{ch.chapter}</td>
                <td className="px-4 py-2.5 text-gray-300 truncate max-w-[200px]">{chapterNames[ch.chapter] || ch.name}</td>
                <td className="px-4 py-2.5 text-right text-white font-semibold">
                  {ch.measures.toLocaleString('es-ES')}
                </td>
                <td className="px-4 py-2.5 text-right text-emerald-400 hidden sm:table-cell">
                  {ch.measures_added > 0 ? `+${ch.measures_added}` : <span className="text-gray-600">—</span>}
                </td>
                <td className="px-4 py-2.5 text-right text-red-400 hidden sm:table-cell">
                  {ch.measures_removed > 0 ? `-${ch.measures_removed}` : <span className="text-gray-600">—</span>}
                </td>
                <td className="px-4 py-2.5 text-right text-blue-400 hidden md:table-cell">
                  {ch.conditions > 0 ? ch.conditions : <span className="text-gray-600">—</span>}
                </td>
                <td className="px-5 py-2.5 text-right">
                  {ch.critical > 0
                    ? <span className="inline-flex items-center justify-center min-w-[26px] px-1.5 py-0.5 rounded-md text-xs font-bold bg-red-500/20 text-red-400 ring-1 ring-red-500/30">{ch.critical}</span>
                    : <span className="text-gray-600">—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footnotes-only collapsed */}
      {footnotesOnly.length > 0 && (
        <div className="border-t border-white/[0.06]">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full px-5 py-2.5 flex items-center justify-between text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <span>+ {footnotesOnly.length} {t('chapters.footnotesOnly')}</span>
            <svg className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showAll && (
            <div className="px-5 pb-4 flex flex-wrap gap-2">
              {footnotesOnly.map(ch => (
                <button
                  key={ch.chapter}
                  onClick={() => onSelectChapter?.(ch.chapter)}
                  className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
                  title={`${ch.name}: ${ch.footnotes} footnotes`}
                >
                  {t('chapters.colChapter')} {ch.chapter} <span className="opacity-50">({ch.footnotes})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
