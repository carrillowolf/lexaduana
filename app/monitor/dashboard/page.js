'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import { monitorDict } from '@/lib/i18n/monitor'

export default function MonitorDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [monitors, setMonitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [addingCode, setAddingCode] = useState(false)
  const t = useTranslation(monitorDict)

  useEffect(() => {
    checkUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/monitor')
        return
      }
      
      setUser(user)
      
      // Obtener perfil
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(profile)
      
      // Obtener monitores
      await loadMonitors(user.id)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMonitors = async (userId) => {
    const { data, error } = await supabase
      .from('monitored_codes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (data) setMonitors(data)
  }

  const addMonitor = async () => {
    if (!newCode || newCode.length < 2) return
    
    setAddingCode(true)
    
    try {
      // Buscar el arancel actual
      const { data: tariff } = await supabase
        .from('tariffs')
        .select('duty')
        .eq('goods_code', newCode.padEnd(10, '0'))
        .eq('origin', 'ERGA OMNES')
        .single()
      
      const { error } = await supabase
        .from('monitored_codes')
        .insert({
          user_id: user.id,
          goods_code: newCode.padEnd(10, '0'),
          product_description: newDescription,
          last_known_duty: tariff?.duty || 0,
          last_checked: new Date().toISOString().split('T')[0]
        })
      
      if (error) throw error
      
      // Recargar lista
      await loadMonitors(user.id)
      
      // Limpiar y cerrar modal
      setNewCode('')
      setNewDescription('')
      setShowAddModal(false)
      
    } catch (error) {
      if (error.message?.includes('monitor limit')) {
        alert(t('dashboard.limitReached'))
      } else if (error.code === '23505') {
        alert(t('dashboard.alreadyMonitoring'))
      } else {
        alert(t('dashboard.addError') + error.message)
      }
    } finally {
      setAddingCode(false)
    }
  }

  const removeMonitor = async (id) => {
    if (!confirm(t('dashboard.deleteConfirm'))) return
    
    try {
      const { error } = await supabase
        .from('monitored_codes')
        .delete()
        .eq('id', id)
      
      if (!error) {
        await loadMonitors(user.id)
      }
    } catch (error) {
      alert(t('dashboard.deleteError') + error.message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <p className="mt-4 text-gray-600">{t('dashboard.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Image src="/logo.png" alt="Lex Aduana" width={40} height={40} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t('dashboard.title')}</h1>
                <p className="text-sm text-gray-600">{profile?.company_name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">{user?.email}</p>
                <p className="text-xs text-gray-500">
                  {t('dashboard.plan')}: <span className="font-semibold capitalize">{profile?.plan_type}</span>
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                {t('dashboard.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600">{monitors.length}</div>
            <div className="text-gray-600">{t('dashboard.monitoredCodes')}</div>
            <div className="text-xs text-gray-500 mt-1">
              {t('dashboard.limit')}: {monitors.length}/{profile?.max_monitors || 5}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600">0</div>
            <div className="text-gray-600">{t('dashboard.changesThisMonth')}</div>
            <div className="text-xs text-gray-500 mt-1">{t('dashboard.lastCheck')}: {new Date().toLocaleDateString('es-ES')}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600">
              {profile?.plan_type === 'free' ? t('dashboard.free') : t('dashboard.pro')}
            </div>
            <div className="text-gray-600">{t('dashboard.yourPlan')}</div>
            {profile?.plan_type === 'free' && (
              <button className="text-xs text-blue-600 hover:underline mt-1">
                {t('dashboard.upgradePlan')}
              </button>
            )}
          </div>
        </div>

        {/* Códigos monitorizados */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('dashboard.hsCodesTitle')}
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={monitors.length >= (profile?.max_monitors || 5)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('dashboard.addCode')}
            </button>
          </div>
          
          <div className="p-6">
            {monitors.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 mb-4">{t('dashboard.noCodesTitle')}</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-blue-600 hover:underline"
                >
                  {t('dashboard.addFirstCode')}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600 border-b">
                      <th className="pb-3">{t('dashboard.colHsCode')}</th>
                      <th className="pb-3">{t('dashboard.colDescription')}</th>
                      <th className="pb-3">{t('dashboard.colCurrentDuty')}</th>
                      <th className="pb-3">{t('dashboard.colLastCheck')}</th>
                      <th className="pb-3">{t('dashboard.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monitors.map(monitor => (
                      <tr key={monitor.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 font-mono font-semibold">{monitor.goods_code}</td>
                        <td className="py-4 text-gray-600">
                          {monitor.product_description || t('dashboard.noDescription')}
                        </td>
                        <td className="py-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                            {monitor.last_known_duty}%
                          </span>
                        </td>
                        <td className="py-4 text-sm text-gray-500">
                          {new Date(monitor.last_checked).toLocaleDateString('es-ES')}
                        </td>
                        <td className="py-4">
                          <button
                            onClick={() => removeMonitor(monitor.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            {t('dashboard.delete')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Info adicional */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            {t('dashboard.howItWorks')}
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>{t('dashboard.how1')}</li>
            <li>{t('dashboard.how2')}</li>
            <li>{t('dashboard.how3')}</li>
            <li>{t('dashboard.how4')}</li>
          </ul>
        </div>
      </div>

      {/* Modal añadir código */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">{t('dashboard.modalTitle')}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('dashboard.modalHsCode')}
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={t('dashboard.modalHsPlaceholder')}
                  maxLength={10}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('dashboard.modalDesc')}
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={t('dashboard.modalDescPlaceholder')}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {t('dashboard.cancel')}
              </button>
              <button
                onClick={addMonitor}
                disabled={addingCode || !newCode}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {addingCode ? t('dashboard.adding') : t('dashboard.add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}