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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                📚 Glosario Aduanero
              </h1>
              <p className="text-gray-600">
                Términos clave del comercio internacional y aduanas
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                ← Calculadora
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          ? 'bg-blue-600 text-white'
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
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
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
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total términos</p>
                <p className="text-2xl font-bold text-blue-600">{filteredTerms.length}</p>
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
                  className="mb-4 text-blue-600 hover:text-blue-700 flex items-center"
                >
                  ← Volver al glosario
                </button>

                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full mb-2">
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
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition text-sm"
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
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    🧮 ¿Necesitas calcular aranceles?
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Usa nuestra calculadora profesional para obtener cálculos precisos
                  </p>
                  <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
                      <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center text-2xl font-bold mr-4">
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
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {term.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {term.definition}
                          </p>
                          <div className="mt-2 text-blue-600 text-sm flex items-center">
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
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
