import { Scale, ExternalLink } from 'lucide-react'

export default function GlossaryLegalBasis({ items }) {
  return (
    <section className="border border-slate-200 rounded-2xl p-6 mb-12 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Scale className="w-5 h-5 text-[#0A3D5C]" />
        <h2 className="text-lg font-semibold text-slate-900">Base legal</h2>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <div className="flex-1">
              <div className="font-medium text-slate-900">
                {item.name_es}
                {item.article && <span className="text-slate-600 font-normal"> · {item.article}</span>}
              </div>
              {item.note_es && (
                <p className="text-sm text-slate-600 mt-1">{item.note_es}</p>
              )}
            </div>
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="text-[#0A3D5C] hover:text-[#C49B38] shrink-0"
                aria-label={`Abrir ${item.name_es} en fuente oficial`}>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
