import Link from 'next/link'

export const metadata = {
  title: 'Término no encontrado | Glosario LexAduana',
  robots: { index: false, follow: true }
}

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Término no encontrado</h1>
      <p className="text-slate-600 mb-8">
        El término que buscas no existe en nuestro glosario o ha sido movido.
      </p>
      <Link
        href="/glosario"
        className="inline-flex items-center px-6 py-3 bg-[#0A3D5C] text-white rounded-2xl font-medium hover:bg-[#0a2e44]"
      >
        Ir al glosario
      </Link>
    </div>
  )
}
