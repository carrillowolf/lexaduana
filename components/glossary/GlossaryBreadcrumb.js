import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default function GlossaryBreadcrumb({ category, term }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm">
      <ol className="flex flex-wrap items-center gap-2 text-slate-600">
        <li><Link href="/" className="hover:text-[#0A3D5C]">Inicio</Link></li>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <li><Link href="/glosario" className="hover:text-[#0A3D5C]">Glosario</Link></li>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <li>
          <Link href={`/glosario?cat=${category.slug}`} className="hover:text-[#0A3D5C]">
            {category.name_es}
          </Link>
        </li>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <li className="text-slate-900 font-medium" aria-current="page">{term.term_es}</li>
      </ol>
    </nav>
  )
}
