'use client'

import Image from 'next/image'

export default function HeroSection({ onScrollToCalculator }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 overflow-hidden">
      {/* Patrón de fondo */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]" />
      
      {/* Círculos decorativos animados */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl opacity-20 animate-pulse animation-delay-2000" />
      
      <div className="relative z-10 container mx-auto px-4 py-20">
        {/* Header */}
        <header className="flex justify-between items-center mb-20">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg shadow-lg">
              <Image src="/logo.png" alt="Lex Aduana" width={48} height={48} className="h-12 w-auto" />
            </div>
            <span className="text-white text-2xl font-bold">LEXADUANA</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-white/80 hover:text-white transition">Características</a>
            <a href="#calculator" className="text-white/80 hover:text-white transition">Calculadora</a>
            <a 
              href="https://www.linkedin.com/in/tu-perfil" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white transition"
            >
              LinkedIn
            </a>
          </nav>
        </header>
        
        {/* Hero Content */}
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto mt-20">
          <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 backdrop-blur border border-blue-400/30 rounded-full mb-8">
            <span className="text-green-400 mr-2">●</span>
            <span className="text-blue-100 text-sm">Base de datos actualizada 2025</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Calcula aranceles
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              en segundos
            </span>
          </h1>
          
          <p className="text-xl text-blue-100 mb-12 max-w-3xl">
            La calculadora TARIC más completa y actualizada para profesionales del comercio internacional. 
            Con más de 8,600 códigos y 70+ acuerdos internacionales.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onScrollToCalculator}
              className="px-8 py-4 bg-white text-blue-900 font-semibold rounded-lg hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-xl"
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Usar Calculadora
              </span>
            </button>
            
            <button
              disabled
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg opacity-90 cursor-not-allowed relative overflow-hidden group"
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Monitor de Aranceles
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs">Próximamente</span>
              </span>
            </button>
          </div>
          
          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 w-full max-w-4xl">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">8,600+</div>
              <div className="text-blue-200 text-sm">Códigos HS</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">70+</div>
              <div className="text-blue-200 text-sm">Países</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">100%</div>
              <div className="text-blue-200 text-sm">Actualizado</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">0€</div>
              <div className="text-blue-200 text-sm">Gratis</div>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </div>
  )
}
