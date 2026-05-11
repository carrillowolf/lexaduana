'use client'
import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search } from 'lucide-react'

function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function IndexInner({ terms, categories }) {
  const searchParams = useSearchParams()
  const initialCat = searchParams.get('cat') || 'all'
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState(initialCat)

  const filtered = useMemo(() => {
    const q = normalize(search.trim())
    return terms.filter((t) => {
      const matchCat = activeCat === 'all' || t.category?.slug === activeCat
      if (!matchCat) return false
      if (!q) return true
      return normalize(t.term_es).includes(q) ||
             normalize(t.short_definition_es).includes(q)
    })
  }, [terms, search, activeCat])

  const grouped = useMemo(() => {
    const g = {}
    filtered.forEach((t) => {
      const letter = t.term_es.charAt(0).toUpperCase()
      ;(g[letter] = g[letter] || []).push(t)
    })
    return g
  }, [filtered])

  const letters = Object.keys(grouped).sort()

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 grid lg:grid-cols-4 gap-8">
      <aside className="lg:col-span-1 space-y-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar término..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-2xl focus:outline-none focus:border-[#0A3D5C]"
          />
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Categorías
          </h3>
          <ul className="space-y-1">
            <li>
              <button onClick={() => setActiveCat('all')}
                className={`w-full text-left px-3 py-2 rounded-2xl text-sm ${activeCat === 'all' ? 'bg-[#0A3D5C] text-white' : 'hover:bg-slate-100 text-slate-700'}`}>
                Todas ({terms.length})
              </button>
            </li>
            {categories.map((c) => {
              const count = terms.filter((t) => t.category?.slug === c.slug).length
              if (count === 0) return null
              return (
                <li key={c.id}>
                  <button onClick={() => setActiveCat(c.slug)}
                    className={`w-full text-left px-3 py-2 rounded-2xl text-sm ${activeCat === c.slug ? 'bg-[#0A3D5C] text-white' : 'hover:bg-slate-100 text-slate-700'}`}>
                    {c.name_es} ({count})
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </aside>

      <div className="lg:col-span-3 space-y-10">
        {letters.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No se han encontrado términos.
          </div>
        )}
        {letters.map((letter) => (
          <section key={letter}>
            <h2 className="text-2xl font-bold text-[#0A3D5C] mb-4 border-b border-slate-200 pb-2">
              {letter}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {grouped[letter].map((t) => (
                <Link key={t.slug} href={`/glosario/${t.slug}`}
                  className="block p-4 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-[#C49B38] hover:shadow-md transition">
                  <div className="font-semibold text-slate-900 mb-1">{t.term_es}</div>
                  <div className="text-sm text-slate-600 line-clamp-2">{t.short_definition_es}</div>
                  {t.category && (
                    <div className="text-xs text-slate-500 mt-2">{t.category.name_es}</div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default function GlossarySearchableIndex({ terms, categories }) {
  return (
    <Suspense fallback={null}>
      <IndexInner terms={terms} categories={categories} />
    </Suspense>
  )
}
