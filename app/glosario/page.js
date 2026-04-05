'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import glossaryData from '@/data/glossary.json'

export default function GlosarioPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTerm, setSelectedTerm] = useState(null)

  // Obtener categorías únicas
  const categories = useMemo(() => {
    const cats = new Set(glossaryData.terms.map(t => t.category))
    return ['all', ...Array.from(cats)]
  }, [])

  // Filtrar términos
  const filteredTerms = useMemo(() => {
    return glossaryData.terms.filter(term => {
      const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           term.definition.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || term.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchTerm, selectedCategory])

  // Agrupar por letra
  const termsByLetter = useMemo(() => {
    const grouped = {}
    filteredTerms.forEach(term => {
      const letter = term.term[0].toUpperCase()
      if (!grouped[letter]) grouped[letter] = []
      grouped[letter].push(term)
    })
    return grouped
  }, [filteredTerms])

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#0A3D5C] py-10 md:py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAyYzguODM3IDAgMTYgNy4xNjMgMTYgMTZzLTcuMTYzIDE2LTE2IDE2LTE2LTcuMTYzLTE2LTE2IDcuMTYzLTE2IDE2LTE2eiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDIiLz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
            Glosario de <span className="text-[#F4C542]">Comercio Exterior</span>
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            Más de {glossaryData.terms.length} términos de aduanas, logística y normativa europea explicados para profesionales.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              {/* Búsqueda */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 Buscar
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ej: arancel, IVA..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D5C] focus:border-transparent"
                />
              </div>

              {/* Categorías */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📂 Categorías
                </label>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        selectedCategory === cat
                          ? 'bg-[#0A3D5C] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat === 'all' ? 'Todos' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alfabeto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔤 Navegar A-Z
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {alphabet.map(letter => {
                    const hasTerms = termsByLetter[letter]?.length > 0
                    return (
                      <button
                        key={letter}
                        onClick={() => {
                          if (hasTerms) {
                            document.getElementById(`letter-${letter}`)?.scrollIntoView({ 
                              behavior: 'smooth',
                              block: 'start'
                            })
                          }
                        }}
                        disabled={!hasTerms}
                        className={`p-2 text-sm rounded transition ${
                          hasTerms
                            ? 'bg-[#0A3D5C]/10 text-[#0A3D5C] hover:bg-[#0A3D5C]/20'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {letter}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 p-4 bg-[#0A3D5C]/5 border border-[#0A3D5C]/10 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total términos</p>
                <p className="text-2xl font-bold text-[#0A3D5C]">{filteredTerms.length}</p>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3">
            {selectedTerm ? (
              // Vista detalle de término
              <div className="bg-white rounded-xl shadow-lg p-8">
                <button
                  onClick={() => setSelectedTerm(null)}
                  className="mb-4 text-[#0A3D5C] hover:text-blue-700 flex items-center"
                >
                  ← Volver al glosario
                </button>

                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-[#0A3D5C]/10 text-[#0A3D5C] text-sm rounded-full mb-2">
                    {selectedTerm.category}
                  </span>
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    {selectedTerm.term}
                  </h2>
                </div>

                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">📖 Definición</h3>
                  <p className="text-gray-700 mb-6">{selectedTerm.definition}</p>

                  <h3 className="text-lg font-semibold text-gray-800 mb-2">💡 Ejemplo práctico</h3>
                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500 mb-6">
                    <p className="text-gray-700">{selectedTerm.example}</p>
                  </div>

                  {selectedTerm.related && selectedTerm.related.length > 0 && (
                    <>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">🔗 Términos relacionados</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedTerm.related.map(relatedId => {
                          const relatedTerm = glossaryData.terms.find(t => t.id === relatedId)
                          return relatedTerm ? (
                            <button
                              key={relatedId}
                              onClick={() => setSelectedTerm(relatedTerm)}
                              className="px-3 py-1 bg-[#0A3D5C]/10 text-[#0A3D5C] rounded-full hover:bg-[#0A3D5C]/20 transition text-sm"
                            >
                              {relatedTerm.term}
                            </button>
                          ) : null
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* CTA Calculadora */}
                <div className="mt-8 p-6 bg-[#0A3D5C]/5 border border-[#0A3D5C]/10 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    🧮 ¿Necesitas calcular aranceles?
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Usa nuestra calculadora profesional para obtener cálculos precisos
                  </p>
                  <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-[#0A3D5C] text-white rounded-lg hover:bg-[#0A3D5C]/90 transition"
                  >
                    Ir a la Calculadora
                  </Link>
                </div>
              </div>
            ) : (
              // Lista de términos
              <div className="space-y-8">
                {Object.keys(termsByLetter).sort().map(letter => (
                  <div key={letter} id={`letter-${letter}`} className="scroll-mt-4">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-[#0A3D5C] text-white rounded-lg flex items-center justify-center text-2xl font-bold mr-4">
                        {letter}
                      </div>
                      <div className="flex-1 h-px bg-gray-300"></div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {termsByLetter[letter].map(term => (
                        <button
                          key={term.id}
                          onClick={() => setSelectedTerm(term)}
                          className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition text-left"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-800">
                              {term.term}
                            </h3>
                            <span className="text-xs px-2 py-1 bg-[#0A3D5C]/10 text-[#0A3D5C] rounded">
                              {term.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {term.definition}
                          </p>
                          <div className="mt-2 text-[#0A3D5C] text-sm flex items-center">
                            Ver más →
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {filteredTerms.length === 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      No se encontraron términos
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Intenta con otra búsqueda o categoría
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedCategory('all')
                      }}
                      className="px-6 py-2 bg-[#0A3D5C] text-white rounded-lg hover:bg-[#0A3D5C]/90 transition"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
