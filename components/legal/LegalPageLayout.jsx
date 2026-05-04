import Link from 'next/link'
import { formatLegalDate } from '@/lib/legal-versions'

/**
 * Layout estándar para páginas legales públicas.
 * Tipografía aplicada vía selectores arbitrarios de Tailwind v4
 * (sin @tailwindcss/typography, sin librerías UI externas).
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
        <div className="max-w-3xl mx-auto px-6 md:px-8 py-10 md:py-14">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#F4C542] mb-2">
            Documentación legal
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
            {title}
          </h1>
          {version && (
            <p className="mt-3 text-sm text-slate-300">
              Última actualización: <strong className="text-white font-semibold">{formatLegalDate(version)}</strong>
              {' · '}
              <span className="font-mono text-xs">v{version}</span>
            </p>
          )}
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-3xl mx-auto px-6 md:px-8 py-10">
        <article
          className="
            bg-white border border-slate-200 rounded-2xl shadow-sm
            px-6 md:px-8 py-10

            [&>*:first-child]:mt-0

            [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-slate-900
            [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-slate-200

            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-800
            [&_h3]:mt-8 [&_h3]:mb-3

            [&_p]:text-slate-700 [&_p]:leading-7 [&_p]:mb-4

            [&_ul]:list-disc [&_ul]:list-outside [&_ul]:ml-6 [&_ul]:space-y-2 [&_ul]:mb-4
            [&_ol]:list-decimal [&_ol]:list-outside [&_ol]:ml-6 [&_ol]:space-y-2 [&_ol]:mb-4
            [&_li]:text-slate-700 [&_li]:leading-7 [&_li]:pl-2 [&_li]:marker:text-slate-400

            [&_table]:w-full [&_table]:my-6 [&_table]:border-collapse [&_table]:text-sm
            [&_th]:bg-slate-50 [&_th]:text-left [&_th]:font-semibold [&_th]:text-slate-900
            [&_th]:px-4 [&_th]:py-3 [&_th]:border [&_th]:border-slate-200
            [&_td]:px-4 [&_td]:py-3 [&_td]:border [&_td]:border-slate-200
            [&_td]:text-slate-700 [&_td]:align-top

            [&_strong]:font-semibold [&_strong]:text-slate-900

            [&_a]:text-[#0A3D5C] [&_a]:underline [&_a]:underline-offset-2
            hover:[&_a]:text-[#082c44]

            [&_blockquote]:border-l-4 [&_blockquote]:border-[#F4C542]
            [&_blockquote]:bg-amber-50 [&_blockquote]:px-5 [&_blockquote]:py-3
            [&_blockquote]:my-6 [&_blockquote]:text-slate-700 [&_blockquote]:italic

            [&_code]:bg-slate-100 [&_code]:text-slate-800
            [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[0.875em]
            [&_code]:font-mono
          "
        >
          {children}
        </article>

        {/* Pie de contacto */}
        <div className="mt-8 bg-white border border-slate-200 rounded-2xl px-6 py-6 md:px-8 md:py-7 shadow-sm">
          <p className="text-sm text-slate-700 leading-7">
            ¿Tienes dudas? Escríbenos a{' '}
            <a
              href={`mailto:${contactEmail}`}
              className="font-semibold text-[#0A3D5C] underline underline-offset-2 hover:text-[#082c44]"
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
