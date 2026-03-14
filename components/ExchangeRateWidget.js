'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function ExchangeRateWidget() {
  const [currentRates, setCurrentRates] = useState([])
  const [upcomingRates, setUpcomingRates] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchRates = async () => {
      // Tipos vigentes
      const { data: current } = await supabase
        .from('current_exchange_rates')
        .select('*')
        .in('currency_code', ['USD', 'GBP', 'CNY', 'JPY', 'CHF'])
        .order('currency_code')

      // Tipos próximos
      const { data: upcoming } = await supabase
        .from('upcoming_exchange_rates')
        .select('*')
        .limit(1)

      if (current) setCurrentRates(current)
      if (upcoming) setUpcomingRates(upcoming)
      setLoading(false)
    }

    fetchRates()
  }, [supabase])

  if (loading) return null

  return (
    <div className="mb-6">
      {/* Banner de próximos tipos */}
      {upcomingRates.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Nuevos tipos de cambio desde el {new Date(upcomingRates[0].effective_from).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Widget de tipos actuales */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-700">
            💱 Tipos de Cambio Oficiales (BCE)
          </h3>
          <Link
            href="/tipos-cambio"
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Ver todos →
          </Link>
        </div>
        
        <div className="grid grid-cols-5 gap-2">
          {currentRates.map(rate => (
            <div key={rate.currency_code} className="text-center">
              <div className="text-xs font-semibold text-gray-600">
                {rate.currency_code}
              </div>
              <div className="text-sm font-bold text-gray-900">
                {parseFloat(rate.rate).toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4
                })}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Vigentes desde: {currentRates[0]?.effective_from ? new Date(currentRates[0].effective_from).toLocaleDateString('es-ES') : ''}
        </p>
      </div>
    </div>
  )
}
