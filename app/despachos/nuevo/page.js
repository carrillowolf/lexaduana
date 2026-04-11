'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { despachosDict } from '@/lib/i18n/despachos'

export default function NuevoDespacho() {
  const [user, setUser] = useState(null)
  const [step, setStep] = useState(1) // 1: tipo, 2: formulario
  const [operationType, setOperationType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslation(despachosDict)

  // Form data
  const [formData, setFormData] = useState({
    expediente_number: '',
    client_name: '',
    product_description: '',
    hs_code: '',
    incoterm: '',
    transport_reference: '',
    eta: '',
    etd: '',
    container_type: '',
    waiting_deconsolidation: false,
    sumaria_status: 'pendiente',
    expenses_status: 'pendiente',
    cr_received: false,
    internal_notes: ''
  })

  // Verificar usuario
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
      }
    }
    checkUser()
  }, [router, supabase])

  const operationTypes = [
    {
      id: 'import_maritime',
      name: t('nuevo.operationTypes.import_maritime.name'),
      icon: '🚢',
      description: t('nuevo.operationTypes.import_maritime.desc')
    },
    {
      id: 'import_air',
      name: t('nuevo.operationTypes.import_air.name'),
      icon: '✈️',
      description: t('nuevo.operationTypes.import_air.desc')
    },
    {
      id: 'import_road',
      name: t('nuevo.operationTypes.import_road.name'),
      icon: '🚛',
      description: t('nuevo.operationTypes.import_road.desc')
    },
    {
      id: 'export_maritime',
      name: t('nuevo.operationTypes.export_maritime.name'),
      icon: '🚢📤',
      description: t('nuevo.operationTypes.export_maritime.desc')
    },
    {
      id: 'export_air',
      name: t('nuevo.operationTypes.export_air.name'),
      icon: '✈️📤',
      description: t('nuevo.operationTypes.export_air.desc')
    },
    {
      id: 'export_road',
      name: t('nuevo.operationTypes.export_road.name'),
      icon: '🚛📤',
      description: t('nuevo.operationTypes.export_road.desc')
    },
    {
      id: 'transit',
      name: t('nuevo.operationTypes.transit.name'),
      icon: '🔄',
      description: t('nuevo.operationTypes.transit.desc')
    }
  ]

  const handleSelectType = (type) => {
    setOperationType(type)
    setStep(2)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validaciones
    if (!formData.expediente_number) {
      setError('Nº Expediente es obligatorio')
      return
    }
    if (!formData.client_name) {
      setError('Cliente es obligatorio')
      return
    }

    setLoading(true)

    try {
      const { data, error: insertError } = await supabase
        .from('dispatches')
        .insert({
          operation_type: operationType,
          expediente_number: formData.expediente_number,
          client_name: formData.client_name,
          product_description: formData.product_description,
          hs_code: formData.hs_code,
          incoterm: formData.incoterm,
          transport_reference: formData.transport_reference,
          eta: formData.eta || null,
          etd: formData.etd || null,
          container_type: formData.container_type || null,
          waiting_deconsolidation: formData.waiting_deconsolidation,
          sumaria_status: formData.sumaria_status,
          expenses_status: formData.expenses_status,
          cr_received: formData.cr_received,
          internal_notes: formData.internal_notes,
          created_by: user.id,
          assigned_to: user.id,
          status: 'creado',
          // Inicializar stages
          stage_docs: 'pending',
          stage_sumaria: operationType.startsWith('export') ? 'na' : 'pending',
          stage_despacho: 'pending',
          stage_paraaduaneros: 'pending',
          stage_dua: 'pending',
          stage_levante: 'pending',
          stage_closure: 'pending'
        })
        .select()
        .single()

      if (insertError) throw insertError

      // TODO: Crear checklist desde plantilla
      // (lo haremos después)

      // Redirigir al detalle
      router.push(`/despachos/${data.id}`)
    } catch (err) {
      console.error('Error creando despacho:', err)
      if (err.code === '23505') {
        setError('Ya existe un despacho con ese nº de expediente')
      } else {
        setError(err.message || 'Error al crear despacho')
      }
    } finally {
      setLoading(false)
    }
  }

  const isImport = operationType?.startsWith('import')
  const isExport = operationType?.startsWith('export')
  const isMaritimeOrAir = operationType?.includes('maritime') || operationType?.includes('air')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/despachos" className="flex items-center space-x-3">
              <img src="/logo.png" alt="LexAduana" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-[#0A3D5C]">{t('nuevo.title')}</h1>
                <p className="text-xs text-gray-500">{t('nuevo.subtitle')}</p>
              </div>
            </Link>

            <Link
              href="/despachos"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition"
            >
              ← {t('common.cancel')}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step 1: Selector de tipo */}
        {step === 1 && (
          <div>
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">{t('nuevo.step1')}</h2>
              <p className="text-gray-600">{t('nuevo.selectType')}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {operationTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleSelectType(type.id)}
                  className="group relative bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-[#0A3D5C] hover:shadow-xl transition-all text-left"
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-5xl">{type.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-[#0A3D5C] transition">
                        {type.name}
                      </h3>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-[#0A3D5C] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Formulario */}
        {step === 2 && (
          <div>
            {/* Header tipo seleccionado */}
            <div className="mb-6 bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-4xl">
                    {operationTypes.find(t => t.id === operationType)?.icon}
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {operationTypes.find(t => t.id === operationType)?.name}
                    </h2>
                    <p className="text-blue-100">
                      {operationTypes.find(t => t.id === operationType)?.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm font-medium"
                >
                  Cambiar
                </button>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Datos básicos */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('nuevo.clientSection')}</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Nº Expediente */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('nuevo.expedienteNumber')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="expediente_number"
                      value={formData.expediente_number}
                      onChange={handleChange}
                      placeholder={t('nuevo.expedientePlaceholder')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">El número que te dio operativa</p>
                  </div>

                  {/* Cliente */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('nuevo.clientName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="client_name"
                      value={formData.client_name}
                      onChange={handleChange}
                      placeholder={t('nuevo.clientPlaceholder')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition"
                      required
                    />
                  </div>

                  {/* Producto */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('nuevo.productDesc')}
                    </label>
                    <textarea
                      name="product_description"
                      value={formData.product_description}
                      onChange={handleChange}
                      placeholder={t('nuevo.productPlaceholder')}
                      rows={2}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition resize-none"
                    />
                  </div>

                  {/* Código HS */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('nuevo.hsCode')}
                    </label>
                    <input
                      type="text"
                      name="hs_code"
                      value={formData.hs_code}
                      onChange={handleChange}
                      placeholder="8471300000"
                      maxLength={10}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition font-mono"
                    />
                  </div>

                  {/* Incoterm */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('nuevo.incoterm')}
                    </label>
                    <select
                      name="incoterm"
                      value={formData.incoterm}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition"
                    >
                      <option value="">{t('nuevo.selectIncoterm')}</option>
                      <option value="EXW">EXW</option>
                      <option value="FCA">FCA</option>
                      <option value="FOB">FOB</option>
                      <option value="CFR">CFR</option>
                      <option value="CIF">CIF</option>
                      <option value="CPT">CPT</option>
                      <option value="CIP">CIP</option>
                      <option value="DAP">DAP</option>
                      <option value="DDP">DDP</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Transporte */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('nuevo.transportSection')}</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Referencia transporte */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('nuevo.transportRef')}
                    </label>
                    <input
                      type="text"
                      name="transport_reference"
                      value={formData.transport_reference}
                      onChange={handleChange}
                      placeholder={operationType?.includes('maritime') ? t('nuevo.transportPlaceholder.maritime') :
                                   operationType?.includes('air') ? t('nuevo.transportPlaceholder.air') :
                                   operationType === 'transit' ? t('nuevo.transportPlaceholder.transit') :
                                   t('nuevo.transportPlaceholder.road')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition"
                    />
                  </div>

                  {/* ETA/ETD */}
                  {isImport ? (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {t('nuevo.eta')}
                      </label>
                      <input
                        type="date"
                        name="eta"
                        value={formData.eta}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {t('nuevo.etd')}
                      </label>
                      <input
                        type="date"
                        name="etd"
                        value={formData.etd}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition"
                      />
                    </div>
                  )}

                  {/* FCL/LCL (solo marítima import) */}
                  {operationType === 'import_maritime' && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          {t('nuevo.containerType')}
                        </label>
                        <select
                          name="container_type"
                          value={formData.container_type}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition"
                        >
                          <option value="">{t('nuevo.selectIncoterm')}</option>
                          <option value="FCL">FCL (Full Container Load)</option>
                          <option value="LCL">LCL (Less than Container Load)</option>
                        </select>
                      </div>

                      {formData.container_type === 'LCL' && (
                        <div className="md:col-span-2">
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              name="waiting_deconsolidation"
                              checked={formData.waiting_deconsolidation}
                              onChange={handleChange}
                              className="w-5 h-5 text-[#0A3D5C] border-gray-300 rounded focus:ring-[#0A3D5C]"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              Esperando desconsolidación (vaciado)
                            </span>
                          </label>
                        </div>
                      )}
                    </>
                  )}

                  {/* Esperando desconsolidación (aéreo import) */}
                  {operationType === 'import_air' && (
                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          name="waiting_deconsolidation"
                          checked={formData.waiting_deconsolidation}
                          onChange={handleChange}
                          className="w-5 h-5 text-[#0A3D5C] border-gray-300 rounded focus:ring-[#0A3D5C]"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Esperando desconsolidación
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Estado inicial */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('nuevo.initialStatus')}</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Gastos */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('nuevo.expensesStatus')}
                    </label>
                    <select
                      name="expenses_status"
                      value={formData.expenses_status}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="recibidos">Recibidos</option>
                    </select>
                  </div>

                  {/* CR (solo export) */}
                  {isExport && (
                    <div>
                      <label className="flex items-center space-x-3 pt-10">
                        <input
                          type="checkbox"
                          name="cr_received"
                          checked={formData.cr_received}
                          onChange={handleChange}
                          className="w-5 h-5 text-[#0A3D5C] border-gray-300 rounded focus:ring-[#0A3D5C]"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {t('nuevo.crReceived')}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Notas */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('nuevo.notesSection')}</h3>
                <textarea
                  name="internal_notes"
                  value={formData.internal_notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder={t('nuevo.notesPlaceholder')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700 flex items-start">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-end space-x-4">
                <Link
                  href="/despachos"
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition"
                >
                  {t('common.cancel')}
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] hover:from-[#083049] hover:to-[#0A3D5C] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{t('nuevo.creating')}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{t('nuevo.create')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
