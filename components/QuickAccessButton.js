'use client'

import { useState, useEffect } from 'react'

export default function QuickAccessButton() {
  const [isVisible, setIsVisible] = useState(false)
  const [isAtCalculator, setIsAtCalculator] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Mostrar el botón después de hacer scroll 100px
      const scrolled = window.scrollY > 100
      setIsVisible(scrolled)
      
      // Detectar si estamos en la sección de la calculadora
      const calculator = document.getElementById('calculator')
      if (calculator) {
        const rect = calculator.getBoundingClientRect()
        setIsAtCalculator(rect.top <= 100 && rect.bottom >= 100)
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToCalculator = () => {
    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* Botón de calculadora - solo si NO estamos en esa sección */}
      {!isAtCalculator && (
        <button
          onClick={scrollToCalculator}
          className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-2xl transform hover:scale-110 transition-all duration-300"
          aria-label="Ir a calculadora"
        >
          <div className="flex items-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="ml-2 max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
              Calculadora
            </span>
          </div>
        </button>
      )}
      
      {/* Botón scroll to top - siempre visible cuando hay scroll */}
      <button
        onClick={scrollToTop}
        className="bg-gray-800 bg-opacity-70 hover:bg-opacity-100 text-white p-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
        aria-label="Volver arriba"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  )
}
