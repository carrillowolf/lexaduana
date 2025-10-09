'use client'

import { useState, useEffect, useRef } from 'react'

export default function HSCodeAutocomplete({ value, onChange, onSelect }) {
  const [inputValue, setInputValue] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const debounceTimer = useRef(null)

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Buscar sugerencias cuando cambia el input
  useEffect(() => {
    if (inputValue.length >= 2) {
      // Cancelar búsqueda anterior
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      
      // Debounce de 300ms
      debounceTimer.current = setTimeout(() => {
        searchCodes(inputValue)
      }, 300)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
    
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [inputValue])

  const searchCodes = async (query) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/search-codes?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success && data.results.length > 0) {
        setSuggestions(data.results)
        setShowSuggestions(true)
        setSelectedIndex(-1)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    } catch (error) {
      console.error('Error buscando códigos:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
  }

  const selectSuggestion = (suggestion) => {
    setInputValue(suggestion.code)
    onChange(suggestion.code)
    onSelect && onSelect(suggestion)
    setShowSuggestions(false)
    setSuggestions([])
  }

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  // Guardar búsquedas recientes en localStorage
  const saveRecentSearch = (code, description) => {
    if (typeof window === 'undefined') return
    
    const recent = JSON.parse(localStorage.getItem('recentHSCodes') || '[]')
    const newEntry = {
      code,
      description: description || 'Sin descripción',
      timestamp: new Date().toISOString()
    }
    
    // Eliminar duplicados y mantener máximo 5
    const filtered = recent.filter(r => r.code !== code)
    const updated = [newEntry, ...filtered].slice(0, 5)
    localStorage.setItem('recentHSCodes', JSON.stringify(updated))
  }

  const handleFocus = () => {
    if (inputValue.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true)
    } else if (inputValue.length === 0) {
      // Mostrar búsquedas recientes
      const recent = JSON.parse(localStorage.getItem('recentHSCodes') || '[]')
      if (recent.length > 0) {
        // Aquí podrías cargar las descripciones de los recientes
        // Por ahora solo mostramos los códigos
        setSuggestions(recent.map(code => ({
          code,
          description: 'Búsqueda reciente',
          duty: null,
          recent: true
        })))
        setShowSuggestions(true)
      }
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-10"
          placeholder="ej: 8471, 3926 o 0303"
          required
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        
        {!isLoading && inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue('')
              onChange('')
              setSuggestions([])
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.code}
              type="button"
              onClick={() => {
                selectSuggestion(suggestion)
                if (!suggestion.recent) {
                  saveRecentSearch(suggestion.code, suggestion.description)
                }
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-gray-900">
                      {suggestion.display || suggestion.code}
                    </span>
                    {suggestion.duty !== null && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {suggestion.duty}%
                      </span>
                    )}
                    {suggestion.recent && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        Reciente
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                    {suggestion.description}
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
          
          {suggestions.length >= 10 && (
            <div className="px-4 py-2 bg-gray-50 text-xs text-gray-600 text-center">
              Mostrando los primeros 10 resultados. Sea más específico para mejores resultados.
            </div>
          )}
        </div>
      )}
      
      {showSuggestions && suggestions.length === 0 && !isLoading && inputValue.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">
            No se encontraron códigos que empiecen con &quot;{inputValue}&quot;
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Intente con menos dígitos o verifique el código
          </p>
        </div>
      )}
    </div>
  )
}
