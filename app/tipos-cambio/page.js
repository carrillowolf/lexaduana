'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useTranslation } from '@/lib/i18n'
import { tiposCambioDict } from '@/lib/i18n/tipos-cambio'

export default function TiposCambioPage() {
  const [currentRates, setCurrentRates] = useState([])
  const [upcomingRates, setUpcomingRates] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const t = useTranslation(tiposCambioDict)

  useEffect(() => {
    const fetchRates = async () => {
      // Tipos vigentes
      const { data: current } = await supabase
        .from('current_exchange_rates')
        .select('*')
        .order('currency_code')

      // Tipos próximos
      const { data: upcoming } = await supabase
        .from('upcoming_exchange_rates')
        .select('*')
        .order('currency_code')

      if (current) setCurrentRates(current)
      if (upcoming) setUpcomingRates(upcoming)
      setLoading(false)
    }

    fetchRates()
  }, [supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Banner próximos tipos */}
        {upcomingRates.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-lg">
            <div className="flex items-start">
              <svg className="h-6 w-6 text-yellow-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  {`⚠️ ${t('upcoming.title')}`}
                </h3>
                <p className="text-yellow-700">
                  {t('upcoming.effectiveFrom')} <strong>{new Date(upcomingRates[0].effective_from).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tipos actuales */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            {`📊 ${t('current.title')}`}
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>{t('current.effectiveLabel')}</strong> {t('current.effectiveFrom')} {new Date(currentRates[0]?.effective_from).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {t('current.boeRef')} {currentRates[0]?.boe_reference}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.code')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.currency')}</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('table.rate')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentRates.map(rate => (
                      <tr key={rate.currency_code} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono font-semibold text-blue-600">
                            {rate.currency_code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {rate.currency_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                          {parseFloat(rate.rate).toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Tipos próximos */}
        {upcomingRates.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              {`📅 ${t('upcoming_section.title')}`}
            </h2>

            <div className="mb-4 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>{t('current.effectiveLabel')}</strong> {t('current.effectiveFrom')} {new Date(upcomingRates[0]?.effective_from).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {t('current.boeRef')} {upcomingRates[0]?.boe_reference}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.code')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.currency')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('table.rate')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {upcomingRates.map(rate => (
                    <tr key={rate.currency_code} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-green-600">
                          {rate.currency_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {rate.currency_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                        {parseFloat(rate.rate).toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info legal */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">{`ℹ️ ${t('legal.title')}`}</h3>
          <p className="text-sm text-gray-600 mb-2" dangerouslySetInnerHTML={{ __html: t('legal.publication') }} />
          <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: t('legal.application') }} />
        </div>
      </div>
    </div>
  )
}
