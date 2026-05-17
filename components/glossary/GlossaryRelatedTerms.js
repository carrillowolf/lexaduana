import Link from 'next/link'
import { Link2 } from 'lucide-react'

export default function GlossaryRelatedTerms({ items }) {
  return (
    <section className="border border-slate-200 rounded-2xl p-6 mb-12 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-5 h-5 text-[#0A3D5C]" />
        <h2 className="text-lg font-semibold text-slate-900">Términos relacionados</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((rel) => {
          const t = rel.related_term
          if (!t) return null
          return (
            <Link key={t.slug} href={`/glosario/${t.slug}`}
              className="block p-4 border border-slate-200 rounded-2xl hover:border-[#C49B38] hover:bg-slate-50 transition">
              <div className="font-medium text-slate-900 mb-1">{t.term_es}</div>
              <div className="text-sm text-slate-600 line-clamp-2">{t.short_definition_es}</div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
