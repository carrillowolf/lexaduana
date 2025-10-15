'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { exportCalculationsToExcel } from '@/lib/excelExporter'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [calculations, setCalculations] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)
      setLoading(false)

      // Cargar historial
      loadHistory()
    }

    getUser()
  }, [router, supabase])

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch('/api/calculations/history?limit=10')
      const data = await response.json()

      if (data.success) {
        setCalculations(data.data)
      }
    } catch (error) {
      console.error('Error cargando historial:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                📊 Dashboard
              </h1>
              <p className="text-gray-600">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Cerrar Sesión
            </button>
          </div>

          {/* Estadísticas */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Cálculos</p>
                  <p className="text-3xl font-bold text-gray-800">{calculations.length}</p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Último 7 días</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {calculations.filter(c => {
                      const date = new Date(c.created_at)
                      const now = new Date()
                      const diff = now - date
                      return diff < 7 * 24 * 60 * 60 * 1000
                    }).length}
                  </p>
                </div>
                <div className="text-4xl">📈</div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Países consultados</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {new Set(calculations.map(c => c.country_code)).size}
                  </p>
                </div>
                <div className="text-4xl">🌍</div>
              </div>
            </div>
          </div>

          {/* Historial */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Historial de Cálculos
              </h2>
              <button
                onClick={loadHistory}
                className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
              >
                🔄 Actualizar
              </button>
            </div>

            {loadingHistory ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : calculations.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-4">No hay cálculos guardados todavía</p>
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
                >
                  Hacer primer cálculo
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">HS Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">País</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor CIF</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {calculations.map((calc) => (
                      <tr key={calc.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(calc.created_at)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-semibold text-blue-600">
                            {calc.hs_code}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {calc.description?.split('→')[0] || 'Sin descripción'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {calc.country_name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(calc.cif_value)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600 text-right">
                          {formatCurrency(calc.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="pt-6 border-t border-gray-200 flex gap-4">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
            >
              ← Volver a la Calculadora
            </Link>

            {calculations.length > 0 && (
              <button
                onClick={() => exportCalculationsToExcel(calculations, user.email)}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
              >
                📤 Exportar a Excel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}