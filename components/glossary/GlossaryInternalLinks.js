import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function GlossaryInternalLinks({ items }) {
  return (
    <section className="border border-[#C49B38]/30 bg-[#FFF8EC] rounded-2xl p-6 mb-12 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Herramientas relacionadas</h2>
      <ul className="space-y-2">
        {items.map((link) => (
          <li key={link.id}>
            <Link href={link.url}
              className="inline-flex items-center gap-2 text-[#0A3D5C] hover:text-[#C49B38] font-medium">
              {link.label_es}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
