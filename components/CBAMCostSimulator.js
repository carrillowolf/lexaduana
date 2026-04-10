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

// Phase-in CBAM (Reg. UE 2023/956 + Directiva EU ETS revisada)
// Porcentaje del coste CBAM que recae sobre el importador cada año
const CBAM_PHASE_IN_RATES = {
  2026: 0.025,
  2027: 0.050,
  2028: 0.100,
  2029: 0.225,
  2030: 0.485,
  2031: 0.610,
  2032: 0.735,
  2033: 0.860,
  2034: 1.000,
}

// Precios oficiales trimestrales de certificados CBAM 2026
// Media trimestral de los precios de subasta del EU ETS
// Fuente: Comisión Europea — actualizar manualmente cuando se publiquen
// Para actualizar: cambiar null por el precio en €/tCO₂ y el panel se actualizará solo
const CBAM_QUARTERLY_PRICES_2026 = {
  Q1: 75.36, // Publicado 8 abril 2026 — media trimestral EU ETS Q1 2026
  Q2: null,  // Se publica 6 julio 2026
  Q3: null,  // Se publica 5 octubre 2026
  Q4: null,  // Se publica 4 enero 2027
}

const CBAM_QUARTERLY_PUBLISH_DATES = {
  Q1: '7 de abril de 2026',
  Q2: '6 de julio de 2026',
  Q3: '5 de octubre de 2026',
  Q4: '4 de enero de 2027',
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
  const [selectedYear, setSelectedYear] = useState(Math.min(2034, Math.max(2026, new Date().getFullYear())))
  const [result, setResult] = useState(null)
  const [showProjection, setShowProjection] = useState(false)
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
    if (selectedYear <= 2026) return MARKUP_SCHEDULE[2026]
    if (selectedYear <= 2027) return MARKUP_SCHEDULE[2027]
    return MARKUP_SCHEDULE[2028] // 2028+ permanente
  }

  const getPhaseInRate = (year) => {
    return CBAM_PHASE_IN_RATES[year] || 1.0
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

    const phaseInRate = getPhaseInRate(selectedYear)
    const grossCost = calculation.totalCost
    const effectiveCost = grossCost * phaseInRate

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
      totalCost: grossCost,
      // FAA
      phaseInYear: selectedYear,
      phaseInRate,
      effectiveCost,
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
          effectiveCost: result.effectiveCost,
          phaseInYear: result.phaseInYear,
          phaseInRate: result.phaseInRate,
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

        {/* Row 2: Fuente de emisiones + Emisión real (si aplica) */}
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

          {/* Emisión real (solo si es fuente real) O Año de importación */}
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
              <div className="h-full flex items-end">
                <p className="text-xs text-gray-500 pb-1">
                  El markup C(2025) 8552 se aplica automáticamente según el año seleccionado
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Año de importación (siempre visible) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Año de importación</label>
          <div className="grid grid-cols-9 gap-1">
            {Object.entries(CBAM_PHASE_IN_RATES).map(([year, rate]) => {
              const y = parseInt(year)
              const isSelected = selectedYear === y
              const markupInfo = emissionSource === 'default'
                ? (y <= 2026 ? '+10%' : y <= 2027 ? '+20%' : '+30%')
                : null
              return (
                <button
                  key={year}
                  onClick={() => { setSelectedYear(y); setResult(null) }}
                  className={`px-2 py-3 rounded-xl border-2 text-center transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-md'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-bold">{year}</div>
                  <div className={`text-xs font-medium ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {(rate * 100).toFixed(1)}%
                  </div>
                  {markupInfo && (
                    <div className={`text-[10px] ${isSelected ? 'text-amber-600' : 'text-gray-400'}`}>
                      mk {markupInfo}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Porcentaje CBAM aplicable (phase-in). En {selectedYear}, el importador paga el <strong>{(getPhaseInRate(selectedYear) * 100).toFixed(1)}%</strong> del coste bruto.
            {emissionSource === 'default' && (
              <span className="text-amber-600"> Markup por valores por defecto: {getMarkup().label}.</span>
            )}
          </p>
        </div>

        {/* Panel de precios oficiales trimestrales CBAM 2026 — solo visible si año = 2026 */}
        {selectedYear === 2026 && (
          <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📊</span>
              <h4 className="font-bold text-blue-900">Precios oficiales de certificados CBAM 2026</h4>
            </div>
            <p className="text-xs text-blue-700 mb-4">
              La Comisión Europea publica trimestralmente el precio de los certificados CBAM, calculado como la media de los precios de subasta del EU ETS.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(CBAM_QUARTERLY_PRICES_2026).map(([quarter, price]) => {
                const hasPrice = price !== null && price !== undefined
                return (
                  <div
                    key={quarter}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      hasPrice
                        ? 'bg-white border-emerald-300 shadow-sm'
                        : 'bg-white/60 border-blue-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${hasPrice ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <span className="text-sm font-bold text-gray-800">{quarter} 2026</span>
                      </div>
                      {hasPrice ? (
                        <p className="text-lg font-bold text-emerald-700 ml-4 mt-1">
                          {formatNumber(price)} €/tCO₂
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 ml-4 mt-1">
                          Pendiente — se publica el {CBAM_QUARTERLY_PUBLISH_DATES[quarter]}
                        </p>
                      )}
                    </div>
                    {hasPrice && (
                      <button
                        onClick={() => setEtsPrice({ price: price, date: new Date().toISOString(), source: `Precio oficial CBAM ${quarter} 2026` })}
                        className="ml-3 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                        title={`Usar ${formatNumber(price)} €/tCO₂ como precio EUA en la calculadora`}
                      >
                        Usar este precio
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {Object.values(CBAM_QUARTERLY_PRICES_2026).some(p => p !== null) && (
              <p className="text-xs text-blue-600 mt-3">
                💡 Pulsa &quot;Usar este precio&quot; para aplicar el precio oficial del trimestre a tu cálculo.
              </p>
            )}
            {Object.values(CBAM_QUARTERLY_PRICES_2026).every(p => p === null) && (
              <p className="text-xs text-blue-600 mt-3">
                🕐 Aún no se ha publicado ningún precio oficial. El primer precio se espera el 7 de abril de 2026.
              </p>
            )}
          </div>
        )}

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

              {/* Coste efectivo (con FAA) - prominente */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-center mb-4">
                <p className="text-emerald-100 mb-1">Coste CBAM efectivo en {result.phaseInYear}</p>
                <p className="text-5xl font-bold text-white">{formatCurrency(result.effectiveCost)}</p>
                <p className="text-emerald-200 text-sm mt-2">
                  Phase-in {result.phaseInYear}: {(result.phaseInRate * 100).toFixed(1)}% del coste bruto
                </p>
              </div>

              {/* Desglose FAA */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Coste CBAM bruto (sin FAA):</span>
                    <span className="font-bold text-gray-800">{formatCurrency(result.totalCost)}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700">
                    <span>Ajuste asignación gratuita (FAA):</span>
                    <span className="font-bold">
                      -{((1 - result.phaseInRate) * 100).toFixed(1)}% (año {result.phaseInYear})
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center text-base">
                    <span className="font-bold text-gray-800">Coste CBAM efectivo:</span>
                    <span className="font-bold text-emerald-700 text-lg">{formatCurrency(result.effectiveCost)}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  {formatNumber(result.totalEmissions, 2)} tCO₂ × {formatCurrency(result.pricePerTonne)}/tCO₂ × {(result.phaseInRate * 100).toFixed(1)}%
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

            {/* Proyección 2026-2034 */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowProjection(!showProjection)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">📈</span>
                  <span className="font-bold text-gray-800">Ver proyección 2026-2034</span>
                </div>
                <span className={`text-gray-400 transition-transform ${showProjection ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {showProjection && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mt-3 mb-4">
                    Proyección con el mismo volumen ({formatNumber(result.tonnes, 0)} t) e intensidad de emisiones
                  </p>
                  <div className="space-y-2">
                    {Object.entries(CBAM_PHASE_IN_RATES).map(([year, rate]) => {
                      const projectedCost = result.totalCost * rate
                      const barWidth = Math.max(2, rate * 100)
                      const isCurrentYear = parseInt(year) === result.phaseInYear
                      return (
                        <div key={year} className={`flex items-center gap-3 p-2 rounded-lg ${isCurrentYear ? 'bg-emerald-50 border border-emerald-200' : ''}`}>
                          <span className={`text-sm font-mono w-10 shrink-0 ${isCurrentYear ? 'font-bold text-emerald-700' : 'text-gray-600'}`}>
                            {year}
                          </span>
                          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isCurrentYear ? 'bg-emerald-500' : 'bg-gradient-to-r from-purple-400 to-pink-400'}`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className={`text-sm w-28 text-right shrink-0 ${isCurrentYear ? 'font-bold text-emerald-700' : 'font-medium text-gray-700'}`}>
                            {formatCurrency(projectedCost)}
                          </span>
                          <span className={`text-xs w-14 text-right shrink-0 ${isCurrentYear ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>
                            ({(rate * 100).toFixed(1)}%)
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-xs text-purple-800">
                      <strong>En 2034</strong> se paga el 100% — de {formatCurrency(result.effectiveCost)} hoy a {formatCurrency(result.totalCost)} en 2034.
                      La diferencia es <strong>{formatCurrency(result.totalCost - result.effectiveCost)}</strong> de exposición creciente.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Info FAA */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div className="text-sm text-blue-800 space-y-2">
                  <h4 className="font-bold text-blue-900">Ajuste por Asignación Gratuita (FAA)</h4>
                  <p>
                    Durante 2026-2034, el coste CBAM se introduce progresivamente. En 2026, solo el 2,5%
                    del coste recae sobre el importador, aumentando gradualmente hasta el 100% en 2034.
                    Esto refleja la eliminación progresiva de las asignaciones gratuitas del EU ETS para sectores CBAM.
                  </p>
                  <p className="text-blue-900 font-medium">
                    Este cálculo ya incluye el ajuste FAA para el año {result.phaseInYear} ({(result.phaseInRate * 100).toFixed(1)}%).
                  </p>
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
                    <li>• El ajuste FAA aplicado es una aproximación basada en el phase-in oficial</li>
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
