import Link from 'next/link'
import { formatLegalDate } from '@/lib/legal-versions'

/**
 * Layout estándar para páginas legales públicas.
 * Sin estado, sin librerías UI externas. Tipografía Tailwind con
 * paleta navy (#0A3D5C) + gold (#F4C542) coherente con el resto del proyecto.
 */
export default function LegalPageLayout({
  title,
  version,
  contactEmail = 'privacidad@lexaduana.es',
  children,
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero compacto */}
      <header className="bg-[#0A3D5C] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#F4C542] mb-2">
            Documentación legal
          </p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            {title}
          </h1>
          {version && (
            <p className="mt-3 text-sm text-slate-300">
              Última actualización: <strong className="text-white">{formatLegalDate(version)}</strong>
              {' · '}
              <span className="font-mono text-xs">v{version}</span>
            </p>
          )}
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <article
          className="
            bg-white border border-slate-200 rounded-2xl shadow-sm
            px-6 py-8 md:px-10 md:py-12
            prose prose-slate max-w-none
            prose-headings:text-slate-900
            prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-2xl prose-h2:font-bold prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2
            prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-lg prose-h3:font-semibold
            prose-p:leading-relaxed
            prose-a:text-[#0A3D5C] prose-a:font-medium hover:prose-a:underline
            prose-strong:text-slate-900
            prose-table:text-sm
            prose-th:bg-slate-100 prose-th:text-slate-900 prose-th:font-semibold
            prose-td:align-top
            prose-blockquote:border-l-4 prose-blockquote:border-[#F4C542] prose-blockquote:bg-amber-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:text-slate-700
            prose-li:leading-relaxed
          "
        >
          {children}
        </article>

        {/* Pie de contacto */}
        <div className="mt-8 bg-white border border-slate-200 rounded-2xl px-6 py-6 md:px-8 md:py-7 shadow-sm">
          <p className="text-sm text-slate-700">
            ¿Tienes dudas? Escríbenos a{' '}
            <a
              href={`mailto:${contactEmail}`}
              className="font-semibold text-[#0A3D5C] hover:underline"
            >
              {contactEmail}
            </a>
            .
          </p>
        </div>

        {/* Navegación entre páginas legales */}
        <nav className="mt-8 flex flex-wrap gap-3 text-sm" aria-label="Otras páginas legales">
          <Link href="/privacidad" className="text-slate-600 hover:text-[#0A3D5C] hover:underline">
            Privacidad
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/aviso-legal" className="text-slate-600 hover:text-[#0A3D5C] hover:underline">
            Aviso legal
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/cookies" className="text-slate-600 hover:text-[#0A3D5C] hover:underline">
            Cookies
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/terminos" className="text-slate-600 hover:text-[#0A3D5C] hover:underline">
            Términos
          </Link>
        </nav>
      </main>
    </div>
  )
}
