'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function ExchangeRateBanner() {
  const [upcomingRates, setUpcomingRates] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkUpcomingRates = async () => {
      try {
        // Obtener tipos próximos
        const { data: upcoming, error } = await supabase
          .from('upcoming_exchange_rates')
          .select('effective_from, publication_date, boe_reference')
          .limit(1)
          .single()

        if (error || !upcoming) {
          setShowBanner(false)
          return
        }

        // Verificar si estamos cerca de la fecha de cambio
        const effectiveDate = new Date(upcoming.effective_from)
        const today = new Date()
        const daysUntilChange = Math.ceil((effectiveDate - today) / (1000 * 60 * 60 * 24))

        // Mostrar banner si faltan 7 días o menos
        if (daysUntilChange >= 0 && daysUntilChange <= 7) {
          setUpcomingRates({
            ...upcoming,
            daysUntilChange
          })
          setShowBanner(true)
        }
      } catch (error) {
        console.error('Error verificando tipos próximos:', error)
      }
    }

    checkUpcomingRates()
  }, [supabase])

  if (!showBanner || !upcomingRates) return null

  const effectiveDate = new Date(upcomingRates.effective_from).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const publicationDate = new Date(upcomingRates.publication_date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long'
  })

  return (
    <div className="relative">
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base">
                🔔 Nuevos tipos de cambio próximos
              </p>
              <p className="text-xs sm:text-sm text-amber-50">
                Publicados el {publicationDate} ({upcomingRates.boe_reference}) • 
                Vigentes desde <strong>{effectiveDate}</strong>
                {upcomingRates.daysUntilChange === 0 && ' (¡HOY!)'}
                {upcomingRates.daysUntilChange === 1 && ' (¡MAÑANA!)'}
                {upcomingRates.daysUntilChange > 1 && ` (en ${upcomingRates.daysUntilChange} días)`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              href="/tipos-cambio"
              className="px-4 py-2 bg-white text-amber-600 font-bold text-sm rounded-lg hover:bg-amber-50 transition-all shadow-md"
            >
              Ver tipos nuevos →
            </Link>
            <button
              onClick={() => setShowBanner(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
