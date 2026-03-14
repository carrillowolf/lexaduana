'use client'

import { useState, useEffect } from 'react'
import { CBAM_SECTORS, calculateCBAMCost } from '@/lib/cbamData'
import { createClient } from '@/lib/supabase-browser'

// Valores por defecto de emisiones (tCO2e por tonelada de producto)
const DEFAULT_EMISSION_FACTORS = {
  cement: {
    name: 'Cemento',
    products: [
      { id: 'clinker', name: 'Clínker', factor: 0.951, codes: ['25231000'] },
      { id: 'portland', name: 'Cemento Portland', factor: 0.693, codes: ['25232100', '25232900'] },
      { id: 'aluminous', name: 'Cemento Aluminoso', factor: 1.124, codes: ['25233000'] },
      { id: 'other_cement', name: 'Otros cementos hidráulicos', factor: 0.693, codes: ['25239000'] },
    ]
  },
  ironSteel: {
    name: 'Hierro y Acero',
    products: [
      { id: 'pig_iron', name: 'Arrabio / Fundición en bruto', factor: 1.600, codes: ['7201'] },
      { id: 'crude_steel', name: 'Acero bruto', factor: 1.080, codes: ['7206', '7207'] },
      { id: 'iron_products', name: 'Productos de hierro/acero', factor: 1.210, codes: ['7208', '7209', '7210', '7301', '7302', '7304', '7305', '7306', '7307', '7308', '7309', '7310', '7311', '7318', '7326'] },
    ]
  },
  aluminium: {
    name: 'Aluminio',
    products: [
      { id: 'unwrought', name: 'Aluminio en bruto', factor: 6.600, codes: ['7601'] },
      { id: 'alu_products', name: 'Productos de aluminio', factor: 7.100, codes: ['7603', '7604', '7605', '7606', '7607', '7608', '7609', '7610', '7611', '7612', '7613', '7614', '7616'] },
    ]
  },
  fertilizers: {
    name: 'Fertilizantes',
    products: [
      { id: 'ammonia', name: 'Amoniaco', factor: 2.126, codes: ['2814'] },
      { id: 'nitric_acid', name: 'Ácido nítrico', factor: 2.840, codes: ['28080000'] },
      { id: 'urea', name: 'Urea / Fertilizantes nitrogenados', factor: 1.570, codes: ['3102', '3105'] },
    ]
  },
  hydrogen: {
    name: 'Hidrógeno',
    products: [
      { id: 'hydrogen', name: 'Hidrógeno', factor: 9.000, codes: ['28041000'] },
    ]
  }
}

// Markup por año según C(2025) 8552
const MARKUP_SCHEDULE = {
  2026: { pct: 0.10, label: '+10%' },
  2027: { pct: 0.20, label: '+20%' },
  2028: { pct: 0.30, label: '+30%' },
}

// Precio EU ETS fallback
const EU_ETS_PRICE_FALLBACK = {
  price: 68.50,
  date: '2024-12-01',
  source: 'fallback (hardcoded)'
}

export default function CBAMCostSimulator() {
  const [selectedSector, setSelectedSector] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [tonnes, setTonnes] = useState('')
  const [emissionSource, setEmissionSource] = useState('default') // 'default' | 'real'
  const [customEmission, setCustomEmission] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [result, setResult] = useState(null)
  const [etsPrice, setEtsPrice] = useState(EU_ETS_PRICE_FALLBACK)
  const [etsPriceLoading, setEtsPriceLoading] = useState(true)

  // Auth + save state
  const [user, setUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)
  const [notes, setNotes] = useState('')

  // Cargar precio EU ETS + check auth
  useEffect(() => {
    async function init() {
      // Fetch ETS price
      try {
        const res = await fetch('/api/cbam/ets-price')
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data?.current) {
            setEtsPrice(json.data.current)
          }
        }
      } catch (err) {
        console.warn('No se pudo obtener precio ETS:', err.message)
      } finally {
        setEtsPriceLoading(false)
      }

      // Check auth
      try {
        const supabase = createClient()
        const { data: { user: u } } = await supabase.auth.getUser()
        setUser(u)
      } catch {
        // No logged in, fine
      }
    }
    init()
  }, [])

  const getSelectedProductData = () => {
    if (!selectedSector || !selectedProduct) return null
    const sector = DEFAULT_EMISSION_FACTORS[selectedSector]
    return sector?.products.find(p => p.id === selectedProduct)
  }

  const getEffectiveEmission = () => {
    if (emissionSource === 'real' && customEmission && parseFloat(customEmission) > 0) {
      return parseFloat(customEmission)
    }
    const product = getSelectedProductData()
    return product?.factor || 0
  }

  const getMarkup = () => {
    if (emissionSource === 'real') return { pct: 0, label: 'Sin markup' }
    const year = Math.min(Math.max(selectedYear, 2026), 2028)
    return MARKUP_SCHEDULE[year] || MARKUP_SCHEDULE[2028]
  }

  const calculateCost = () => {
    const product = getSelectedProductData()
    if (!product || !tonnes || parseFloat(tonnes) <= 0) return

    const tonnesNum = parseFloat(tonnes)
    const effectiveEmission = getEffectiveEmission()
    const markup = getMarkup()

    // Aplicar markup si usa valores por defecto
    const emissionWithMarkup = emissionSource === 'default'
      ? effectiveEmission * (1 + markup.pct)
      : effectiveEmission

    const calculation = calculateCBAMCost(
      tonnesNum,
      emissionWithMarkup,
      etsPrice.price,
      selectedSector
    )

    setResult({
      product: product.name,
      sector: DEFAULT_EMISSION_FACTORS[selectedSector].name,
      sectorId: selectedSector,
      productKey: selectedProduct,
      tonnes: calculation.tonnes,
      emissionFactor: effectiveEmission,
      emissionFactorWithMarkup: emissionWithMarkup,
      emissionSource,
      markup,
      benchmark: calculation.benchmark,
      emissionsSubjectToCBAM: calculation.emissionsSubjectToCBAM,
      totalEmissions: calculation.totalEmissions,
      pricePerTonne: calculation.co2Price,
      totalCost: calculation.totalCost,
      // Coste sin markup para comparación
      costWithoutMarkup: emissionSource === 'default'
        ? (() => {
            const calcNoMarkup = calculateCBAMCost(tonnesNum, effectiveEmission, etsPrice.price, selectedSector)
            return calcNoMarkup.totalCost
          })()
        : null,
    })

    setSaveMessage(null)
  }

  const handleSave = async () => {
    if (!result || !user) return

    setSaving(true)
    setSaveMessage(null)

    try {
      const res = await fetch('/api/cbam/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectorId: result.sectorId,
          productKey: result.productKey,
          tonnes: result.tonnes,
          emissionFactor: result.emissionFactorWithMarkup,
          emissionSource: result.emissionSource,
          benchmark: result.benchmark,
          co2Price: result.pricePerTonne,
          totalEmissions: result.totalEmissions,
          totalCost: result.totalCost,
          markupApplied: result.markup.pct * 100,
          notes: notes || `${result.sector} - ${result.product}`,
        })
      })

      const json = await res.json()
      if (json.success) {
        setSaveMessage({ type: 'success', text: 'Cálculo guardado en tu historial' })
      } else {
        setSaveMessage({ type: 'error', text: json.error || 'Error al guardar' })
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Error de conexión al guardar' })
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)
  }

  const formatNumber = (value, decimals = 2) => {
    return new Intl.NumberFormat('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-white/20 rounded text-xs font-bold text-white">🇪🇸 España</span>
              <span className="px-2 py-1 bg-amber-400/30 rounded text-xs font-bold text-amber-100">CALCULADORA</span>
            </div>
            <h2 className="text-2xl font-bold text-white">💰 Calculadora CBAM</h2>
            <p className="text-emerald-100 mt-1">Calcula el coste de certificados con emisiones reales o valores por defecto</p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-emerald-200 text-sm">Precio EU ETS actual</p>
            <p className="text-3xl font-bold text-white">
              {etsPriceLoading ? '...' : formatCurrency(etsPrice.price)}
            </p>
            <p className="text-emerald-200 text-xs">por tCO₂</p>
            {!etsPriceLoading && etsPrice.date && (
              <p className="text-emerald-300 text-xs mt-1">
                Actualizado: {new Date(etsPrice.date).toLocaleDateString('es-ES')}
                {etsPrice.source && etsPrice.source !== 'fallback (hardcoded)' && etsPrice.source !== 'fallback (error)' && (
                  <span className="ml-1">({etsPrice.source})</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Row 1: Sector, Producto, Toneladas */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sector CBAM</label>
            <select
              value={selectedSector}
              onChange={(e) => { setSelectedSector(e.target.value); setSelectedProduct(''); setResult(null) }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            >
              <option value="">Selecciona sector...</option>
              {Object.entries(DEFAULT_EMISSION_FACTORS).map(([key, sector]) => (
                <option key={key} value={key}>{CBAM_SECTORS[key]?.icon} {sector.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de producto</label>
            <select
              value={selectedProduct}
              onChange={(e) => { setSelectedProduct(e.target.value); setResult(null) }}
              disabled={!selectedSector}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 disabled:bg-gray-100"
            >
              <option value="">Selecciona producto...</option>
              {selectedSector && DEFAULT_EMISSION_FACTORS[selectedSector]?.products.map((product) => (
                <option key={product.id} value={product.id}>{product.name} ({product.factor} tCO₂/t)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Toneladas a importar</label>
            <input
              type="number"
              value={tonnes}
              onChange={(e) => { setTonnes(e.target.value); setResult(null) }}
              placeholder="Ej: 100"
              min="0"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Row 2: Fuente de emisiones + Año */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Fuente de emisiones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fuente de emisiones</label>
            <div className="flex gap-3">
              <button
                onClick={() => { setEmissionSource('default'); setResult(null) }}
                className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  emissionSource === 'default'
                    ? 'border-amber-400 bg-amber-50 text-amber-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>📊</span>
                  <span>Valores por defecto UE</span>
                </div>
                {emissionSource === 'default' && selectedYear >= 2026 && (
                  <div className="text-xs mt-1 text-amber-600">
                    Markup {getMarkup().label} aplicado
                  </div>
                )}
              </button>
              <button
                onClick={() => { setEmissionSource('real'); setResult(null) }}
                className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  emissionSource === 'real'
                    ? 'border-green-400 bg-green-50 text-green-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>✅</span>
                  <span>Emisiones reales verificadas</span>
                </div>
                {emissionSource === 'real' && (
                  <div className="text-xs mt-1 text-green-600">
                    Sin penalización
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Año / Emisión real */}
          <div>
            {emissionSource === 'real' ? (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emisiones reales (tCO₂/t producto)
                </label>
                <input
                  type="number"
                  value={customEmission}
                  onChange={(e) => { setCustomEmission(e.target.value); setResult(null) }}
                  placeholder="Ej: 0.85"
                  min="0"
                  step="0.001"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dato del fabricante/exportador según verificador acreditado
                </p>
              </>
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-2">Año de cálculo</label>
                <select
                  value={selectedYear}
                  onChange={(e) => { setSelectedYear(parseInt(e.target.value)); setResult(null) }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500"
                >
                  <option value={2026}>2026 — Markup +10%</option>
                  <option value={2027}>2027 — Markup +20%</option>
                  <option value={2028}>2028+ — Markup +30% (permanente)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Penalización C(2025) 8552 por usar valores por defecto
                </p>
              </>
            )}
          </div>
        </div>

        <button
          onClick={calculateCost}
          disabled={!selectedProduct || !tonnes || parseFloat(tonnes) <= 0 || (emissionSource === 'real' && (!customEmission || parseFloat(customEmission) <= 0))}
          className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition-all"
        >
          Calcular coste CBAM
        </button>

        {result && (
          <div className="mt-8 space-y-6">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Resultado del cálculo</h3>

              <div className="grid sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Cantidad</p>
                  <p className="text-2xl font-bold text-gray-800">{formatNumber(result.tonnes, 0)} <span className="text-sm font-normal">t</span></p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">
                    Emisiones {emissionSource === 'real' ? '(reales)' : '(defecto)'}
                  </p>
                  <p className="text-xl font-bold text-gray-600">
                    {formatNumber(result.emissionFactor, 3)} <span className="text-sm font-normal">tCO₂/t</span>
                  </p>
                  {emissionSource === 'default' && result.markup.pct > 0 && (
                    <p className="text-xs text-amber-600 font-medium mt-1">
                      → {formatNumber(result.emissionFactorWithMarkup, 3)} con markup {result.markup.label}
                    </p>
                  )}
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Benchmark UE</p>
                  <p className="text-xl font-bold text-blue-600">-{formatNumber(result.benchmark, 3)} <span className="text-sm font-normal">tCO₂/t</span></p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Emisiones CBAM</p>
                  <p className="text-xl font-bold text-emerald-600">{formatNumber(result.emissionsSubjectToCBAM, 3)} <span className="text-sm font-normal">tCO₂/t</span></p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-center mb-4">
                <p className="text-purple-100 mb-1">Coste estimado certificados CBAM</p>
                <p className="text-5xl font-bold text-white">{formatCurrency(result.totalCost)}</p>
                <p className="text-purple-200 text-sm mt-2">
                  {formatNumber(result.totalEmissions, 2)} tCO₂ × {formatCurrency(result.pricePerTonne)}/tCO₂
                </p>
              </div>

              {/* Comparación markup */}
              {emissionSource === 'default' && result.costWithoutMarkup != null && result.markup.pct > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚠️</span>
                      <span className="text-sm font-medium text-amber-800">
                        Sobrecoste por usar valores por defecto ({result.markup.label}):
                      </span>
                    </div>
                    <span className="font-bold text-amber-700">
                      +{formatCurrency(result.totalCost - result.costWithoutMarkup)}
                    </span>
                  </div>
                  <p className="text-xs text-amber-600 mt-2">
                    💡 Si obtienes emisiones reales verificadas del fabricante, podrías ahorrar esta penalización.
                  </p>
                </div>
              )}

              {/* Detalle */}
              <div className="bg-white rounded-lg p-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Sector:</span><span className="font-medium">{result.sector}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Producto:</span><span className="font-medium">{result.product}</span></div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fuente emisiones:</span>
                  <span className={`font-medium ${emissionSource === 'real' ? 'text-green-600' : 'text-amber-600'}`}>
                    {emissionSource === 'real' ? '✅ Verificadas' : '📊 Valores por defecto UE'}
                  </span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-600">Emisiones base:</span>
                  <span className="font-medium">{formatNumber(result.emissionFactor, 3)} tCO₂/t</span>
                </div>
                {emissionSource === 'default' && result.markup.pct > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Markup {result.markup.label}:</span>
                    <span className="font-medium">→ {formatNumber(result.emissionFactorWithMarkup, 3)} tCO₂/t</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Benchmark UE:</span>
                  <span className="font-medium text-blue-600">- {formatNumber(result.benchmark, 3)} tCO₂/t</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-800 font-bold">Emisiones sujetas a CBAM:</span>
                  <span className="font-bold text-emerald-600">{formatNumber(result.emissionsSubjectToCBAM, 3)} tCO₂/t</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-600">Precio EU ETS:</span>
                  <span className="font-medium">{formatCurrency(result.pricePerTonne)}/tCO₂</span>
                </div>
                <div className="flex justify-between text-base border-t pt-2">
                  <span className="text-gray-800 font-medium">Fórmula:</span>
                  <span className="font-mono text-gray-600 text-xs">
                    {formatNumber(result.tonnes)}t × ({formatNumber(result.emissionFactorWithMarkup, 3)} - {formatNumber(result.benchmark, 3)}) × {formatCurrency(result.pricePerTonne)}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-2">
                  <span className="text-xl">ℹ️</span>
                  <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">¿Por qué se resta el benchmark?</p>
                    <p>Las fábricas europeas ya pagan por el benchmark ({formatNumber(result.benchmark, 3)} tCO₂/t) en el EU ETS. El CBAM solo cobra por las emisiones que <strong>exceden</strong> ese nivel de eficiencia.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Guardar cálculo */}
            {user && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💾</span>
                    <h4 className="font-bold text-indigo-900">Guardar en tu historial</h4>
                  </div>
                  <a href="/cbam/historial" className="text-sm text-indigo-600 hover:underline">
                    Ver historial →
                  </a>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Nota opcional (ej: Proveedor X, pedido #123)"
                    className="flex-1 px-4 py-2 border border-indigo-200 rounded-lg text-sm placeholder:text-gray-400 focus:border-indigo-400"
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
                {saveMessage && (
                  <p className={`text-sm mt-2 ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {saveMessage.type === 'success' ? '✅' : '❌'} {saveMessage.text}
                  </p>
                )}
              </div>
            )}

            {/* Disclaimer FAA */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <h4 className="font-bold text-blue-900 mb-2">
                    Sobre el ajuste por asignación gratuita (2026-2033)
                  </h4>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p>
                      <strong>Este cálculo muestra el coste base</strong> usando la fórmula:
                      <span className="block font-mono text-xs bg-blue-100 p-2 rounded mt-1">
                        (Emisiones{emissionSource === 'default' ? ' + Markup' : ''} - Benchmark UE) × Precio CO₂
                      </span>
                    </p>
                    <p>
                      <strong>Durante 2026-2033 habrá una reducción progresiva</strong> en el
                      número de certificados a entregar (Free Allocation Adjustment - FAA).
                    </p>
                    <p className="text-blue-900 font-medium">
                      💡 Este cálculo representa el <strong>coste máximo</strong> (100% aplicable
                      desde 2034). En años anteriores pagarás menos.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div className="text-sm text-amber-800">
                  <p className="font-bold mb-1">Aviso importante</p>
                  <ul className="space-y-1 text-amber-700">
                    <li>• Esta es una <strong>estimación orientativa</strong></li>
                    <li>• Las emisiones reales dependen del proceso productivo de cada instalación</li>
                    <li>• El precio EU ETS fluctúa diariamente</li>
                    <li>• No incluye el ajuste por asignación gratuita (FAA) aplicable 2026-2033</li>
                    <li>• Consulte con un asesor especializado para cálculos definitivos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-500">
          <p>
            <strong>Fuentes:</strong> Valores por defecto según Reg. (UE) 2023/1773. Markup según C(2025) 8552.
            {' '}Precio EU ETS: €{etsPrice.price}/tCO₂
            {etsPrice.date && ` (${new Date(etsPrice.date).toLocaleDateString('es-ES')})`}
            {etsPrice.source && etsPrice.source !== 'fallback (hardcoded)' && etsPrice.source !== 'fallback (error)'
              ? ` - Fuente: ${etsPrice.source}`
              : ' - Precio de referencia'
            }.
          </p>
        </div>
      </div>
    </div>
  )
}
