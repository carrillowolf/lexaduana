'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useTranslation } from '@/lib/i18n'
import { sharedComponentsDict } from '@/lib/i18n/shared-components'
import { safeLogger } from '@/lib/safe-logger'

export default function DispatchChecklist({ dispatchId, dispatchType }) {
  const [checklist, setChecklist] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newItemText, setNewItemText] = useState('')
  const [showAddItem, setShowAddItem] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  
  const supabase = createClient()
  const t = useTranslation(sharedComponentsDict)

  useEffect(() => {
    if (dispatchId) {
      loadChecklist()
    }
  }, [dispatchId])

  const loadChecklist = async () => {
    try {
      const { data, error } = await supabase
        .from('dispatch_checklist')
        .select('*')
        .eq('dispatch_id', dispatchId)
        .order('order_index', { ascending: true })

      if (error) throw error
      setChecklist(data || [])
    } catch (error) {
      safeLogger.error('Error cargando checklist:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = async (itemId, currentChecked) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('dispatch_checklist')
        .update({ 
          is_checked: !currentChecked,
          checked_at: !currentChecked ? new Date().toISOString() : null
        })
        .eq('id', itemId)

      if (error) throw error

      // Actualizar estado local
      setChecklist(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, is_checked: !currentChecked, checked_at: !currentChecked ? new Date().toISOString() : null }
          : item
      ))
    } catch (error) {
      safeLogger.error('Error actualizando item:', error)
      alert(t('checklist.errorUpdating'))
    } finally {
      setSaving(false)
    }
  }

  const addCustomItem = async () => {
    if (!newItemText.trim() || !selectedCategory) return

    setSaving(true)
    try {
      const maxOrder = Math.max(...checklist.map(i => i.order_index), 0)
      
      const { data, error } = await supabase
        .from('dispatch_checklist')
        .insert({
          dispatch_id: dispatchId,
          category: selectedCategory,
          item_text: newItemText.trim(),
          order_index: maxOrder + 1,
          is_custom: true,
          is_checked: false
        })
        .select()
        .single()

      if (error) throw error

      setChecklist(prev => [...prev, data])
      setNewItemText('')
      setShowAddItem(false)
    } catch (error) {
      safeLogger.error('Error añadiendo item:', error)
      alert(t('checklist.errorAdding'))
    } finally {
      setSaving(false)
    }
  }

  const deleteCustomItem = async (itemId) => {
    if (!confirm(t('checklist.deleteConfirm'))) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('dispatch_checklist')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      setChecklist(prev => prev.filter(item => item.id !== itemId))
    } catch (error) {
      safeLogger.error('Error eliminando item:', error)
      alert(t('checklist.errorDeleting'))
    } finally {
      setSaving(false)
    }
  }

  // Agrupar por categoría
  const groupedChecklist = checklist.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {})

  // Calcular progreso
  const totalItems = checklist.length
  const completedItems = checklist.filter(item => item.is_checked).length
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  // Iconos por categoría
  const getCategoryIcon = (category) => {
    const icons = {
      'recepcion': '📧',
      'documentacion': '📄',
      'gastos': '💰',
      'llegada': '🚢',
      'despacho': '📝',
      'cierre': '📤',
      'salida': '✈️',
      'transito': '🔄'
    }
    return icons[category] || '📋'
  }

  // Nombre categoría traducido
  const getCategoryName = (category) => {
    return t(`checklist.categories.${category}`) || category.toUpperCase()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      {/* Header con progreso */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">
            {t('checklist.title')} {saving && <span className="text-xs text-gray-500 ml-2">{t('checklist.saving')}</span>}
          </h3>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">
              {completedItems}/{totalItems} {t('checklist.completed')}
            </p>
            <p className="text-xs text-gray-500">{progressPercent}%</p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              progressPercent === 100 ? 'bg-green-500' :
              progressPercent >= 70 ? 'bg-blue-500' :
              progressPercent >= 40 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist agrupado por categorías */}
      <div className="space-y-6">
        {Object.entries(groupedChecklist).map(([category, items]) => {
          const categoryCompleted = items.filter(item => item.is_checked).length
          const categoryTotal = items.length
          const categoryPercent = Math.round((categoryCompleted / categoryTotal) * 100)

          return (
            <div key={category} className="border-b border-gray-100 pb-4 last:border-b-0">
              {/* Título categoría */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-700 flex items-center space-x-2">
                  <span className="text-xl">{getCategoryIcon(category)}</span>
                  <span>{getCategoryName(category)}</span>
                  <span className="text-xs text-gray-500">({categoryCompleted}/{categoryTotal})</span>
                </h4>
                {categoryPercent === 100 && (
                  <span className="text-green-500 text-xl">✅</span>
                )}
              </div>

              {/* Items de la categoría */}
              <div className="space-y-2 ml-8">
                {items.map(item => (
                  <div 
                    key={item.id}
                    className={`flex items-start space-x-3 p-2 rounded-lg transition ${
                      item.is_checked ? 'bg-green-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleItem(item.id, item.is_checked)}
                      disabled={saving}
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                        item.is_checked
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 hover:border-[#0A3D5C]'
                      }`}
                    >
                      {item.is_checked && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    {/* Texto */}
                    <div className="flex-1">
                      <p className={`text-sm ${
                        item.is_checked 
                          ? 'text-gray-500 line-through' 
                          : 'text-gray-900'
                      }`}>
                        {item.item_text}
                        {item.is_custom && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {t('checklist.custom')}
                          </span>
                        )}
                      </p>
                      {item.is_checked && item.checked_at && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          ✓ {new Date(item.checked_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>

                    {/* Eliminar (solo custom) */}
                    {item.is_custom && (
                      <button
                        onClick={() => deleteCustomItem(item.id)}
                        className="flex-shrink-0 text-red-500 hover:text-red-700 transition"
                        title={t('checklist.deleteCustomTitle')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Añadir item personalizado */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        {!showAddItem ? (
          <button
            onClick={() => setShowAddItem(true)}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#0A3D5C] hover:text-[#0A3D5C] transition flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">{t('checklist.addCustomItem')}</span>
          </button>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('checklist.category')}</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#0A3D5C] focus:ring-2 focus:ring-[#0A3D5C]/20 outline-none"
              >
                <option value="">{t('checklist.selectCategory')}</option>
                {Object.keys(groupedChecklist).map(category => (
                  <option key={category} value={category}>
                    {getCategoryIcon(category)} {getCategoryName(category)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('checklist.description')}</label>
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder={t('checklist.descPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#0A3D5C] focus:ring-2 focus:ring-[#0A3D5C]/20 outline-none"
                onKeyPress={(e) => e.key === 'Enter' && addCustomItem()}
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={addCustomItem}
                disabled={!newItemText.trim() || !selectedCategory || saving}
                className="flex-1 px-4 py-2 bg-[#0A3D5C] text-white font-medium rounded-lg hover:bg-[#083049] disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {t('checklist.add')}
              </button>
              <button
                onClick={() => {
                  setShowAddItem(false)
                  setNewItemText('')
                  setSelectedCategory('')
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                {t('checklist.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
