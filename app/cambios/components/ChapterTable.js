'use client'

import { useState } from 'react'

export default function ChapterTable({ chapters, onSelectChapter }) {
  const [showAll, setShowAll] = useState(false)
  const [sortBy, setSortBy] = useState('chapter') // chapter | measures | critical

  if (!chapters || chapters.length === 0) return null

  // Separar capítulos con cambios reales de los que solo tienen footnotes
  const withMeasures = chapters.filter(ch => ch.measures > 0 || ch.conditions > 0 || ch.exclusions > 0)
  const footnotesOnly = chapters.filter(ch => ch.measures === 0 && ch.conditions === 0 && ch.exclusions === 0)

  // Ordenar
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
        className={`text-xs px-2 py-0.5 rounded transition-colors ${active ? 'bg-[#C49B38]/20 text-[#C49B38]' : 'text-[#8B95A5] hover:text-[#E8E8E8]'}`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="bg-[#141B2D] border border-[#1E2A3A] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1E2A3A] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#E8E8E8]">
            Capítulos con cambios reales
            <span className="text-[#8B95A5] font-normal ml-2">({withMeasures.length})</span>
          </h3>
        </div>
        <div className="flex gap-1">
          <SortButton field="chapter" label="Cap." />
          <SortButton field="measures" label="Medidas" />
          <SortButton field="critical" label="Críticos" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#8B95A5] text-xs uppercase tracking-wider border-b border-[#1E2A3A]">
              <th className="text-left px-4 py-2">Cap.</th>
              <th className="text-left px-4 py-2">Descripción</th>
              <th className="text-right px-4 py-2">Medidas</th>
              <th className="text-right px-4 py-2 hidden sm:table-cell">Nuevas</th>
              <th className="text-right px-4 py-2 hidden sm:table-cell">Eliminadas</th>
              <th className="text-right px-4 py-2 hidden md:table-cell">Condiciones</th>
              <th className="text-right px-4 py-2">Críticos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E2A3A]/50">
            {sorted.map((ch) => {
              const totalReal = ch.measures + ch.conditions + ch.exclusions
              return (
                <tr
                  key={ch.chapter}
                  onClick={() => onSelectChapter?.(ch.chapter)}
                  className="hover:bg-[#1E2A3A]/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-2 text-[#C49B38] font-mono font-semibold">{ch.chapter}</td>
                  <td className="px-4 py-2 text-[#E8E8E8] truncate max-w-[200px]">{ch.name}</td>
                  <td className="px-4 py-2 text-right text-[#E8E8E8] font-medium">
                    {ch.measures.toLocaleString('es-ES')}
                  </td>
                  <td className="px-4 py-2 text-right text-green-400 hidden sm:table-cell">
                    {ch.measures_added > 0 ? `+${ch.measures_added}` : '—'}
                  </td>
                  <td className="px-4 py-2 text-right text-red-400 hidden sm:table-cell">
                    {ch.measures_removed > 0 ? `-${ch.measures_removed}` : '—'}
                  </td>
                  <td className="px-4 py-2 text-right text-blue-400 hidden md:table-cell">
                    {ch.conditions > 0 ? ch.conditions : '—'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {ch.critical > 0
                      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">{ch.critical}</span>
                      : <span className="text-[#8B95A5]">—</span>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footnotes-only chapters (collapsed) */}
      {footnotesOnly.length > 0 && (
        <div className="border-t border-[#1E2A3A]">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-[#8B95A5] hover:bg-[#1E2A3A]/30 transition-colors"
          >
            <span>
              {footnotesOnly.length} capítulos con solo cambios de footnotes (sin impacto arancelario)
            </span>
            <svg className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showAll && (
            <div className="px-4 pb-3">
              <div className="flex flex-wrap gap-2">
                {footnotesOnly.map(ch => (
                  <button
                    key={ch.chapter}
                    onClick={() => onSelectChapter?.(ch.chapter)}
                    className="text-xs px-2 py-1 rounded bg-[#1E2A3A]/50 text-[#8B95A5] hover:text-[#E8E8E8] transition-colors border border-[#1E2A3A]"
                    title={`${ch.name}: ${ch.footnotes} footnotes`}
                  >
                    Cap. {ch.chapter} <span className="opacity-60">({ch.footnotes})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
