'use client'

import { useState } from 'react'

export default function ChangesSearch({ onSearch }) {
  const [query, setQuery] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const cleaned = query.replace(/[\s.]/g, '').trim()
    if (cleaned.length >= 2) {
      onSearch(cleaned)
    }
  }

  function handleClear() {
    setQuery('')
    onSearch(null)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por código de mercancía (ej: 7208, 720851...)"
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0A3D5C] focus:ring-1 focus:ring-[#0A3D5C]/20 transition-all shadow-sm"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <button
        type="submit"
        className="bg-[#0A3D5C] hover:bg-[#0C4A6E] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 shadow-sm"
      >
        Buscar
      </button>
    </form>
  )
}
