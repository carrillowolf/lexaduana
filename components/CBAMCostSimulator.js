'use client'

import { useState, useEffect } from 'react'
import { checkCBAM, CBAM_SECTORS } from '@/lib/cbamData'

// Valores por defecto de emisiones (tCO2e por tonelada de producto)
// Fuente: Comisión Europea - Valores por defecto período transitorio CBAM
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

// Precio EU ETS aproximado
const EU_ETS_PRICE = {
  price: 68.50,
  lastUpdate: '2024-12-01',
  source: 'EU ETS / SENDECO2'
}

export default function CBAMCostSimulator() {
  const [selectedSector, setSelectedSector] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [tonnes, setTonnes] = useState('')
  const [result, setResult] = useState(null)

  const getSelectedProductData = () => {
    if (!selectedSector || !selectedProduct) return null
    const sector = DEFAULT_EMISSION_FACTORS[selectedSector]
    return sector?.products.find(p => p.id === selectedProduct)
  }

  const calculateCost = () => {
    const product = getSelectedProductData()
    if (!product || !tonnes || parseFloat(tonnes) <= 0) return

    const tonnesNum = parseFloat(tonnes)
    const emissions = tonnesNum * product.factor
    const cost = emissions * EU_ETS_PRICE.price

    setResult({
      product: product.name,
      sector: DEFAULT_EMISSION_FACTORS[selectedSector].name,
      tonnes: tonnesNum,
      emissionFactor: product.factor,
      totalEmissions: emissions,
      pricePerTonne: EU_ETS_PRICE.price,
      totalCost: cost
    })
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
              <span className="px-2 py-1 bg-amber-400/30 rounded text-xs font-bold text-amber-100">ESTIMACIÓN</span>
            </div>
            <h2 className="text-2xl font-bold text-white">💰 Simulador de Coste de Certificados CBAM</h2>
            <p className="text-emerald-100 mt-1">Calcula el coste estimado de certificados según el precio EU ETS</p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-emerald-200 text-sm">Precio EU ETS actual</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(EU_ETS_PRICE.price)}</p>
            <p className="text-emerald-200 text-xs">por tCO₂</p>
          </div>
        </div>
      </div>

      <div className="p-8">
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
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500"
            />
          </div>
        </div>

        <button
          onClick={calculateCost}
          disabled={!selectedProduct || !tonnes || parseFloat(tonnes) <= 0}
          className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition-all"
        >
          Calcular coste estimado
        </button>

        {result && (
          <div className="mt-8 space-y-6">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Resultado de la simulación</h3>
              
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Cantidad</p>
                  <p className="text-2xl font-bold text-gray-800">{formatNumber(result.tonnes, 0)} <span className="text-sm font-normal">t</span></p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Emisiones estimadas</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatNumber(result.totalEmissions)} <span className="text-sm font-normal">tCO₂</span></p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Coste certificados</p>
                  <p className="text-2xl font-bold text-[#0A3D5C]">{formatCurrency(result.totalCost)}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Sector:</span><span className="font-medium">{result.sector}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Producto:</span><span className="font-medium">{result.product}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Factor de emisión:</span><span className="font-medium">{result.emissionFactor} tCO₂/t</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Precio EU ETS:</span><span className="font-medium">{formatCurrency(result.pricePerTonne)}/tCO₂</span></div>
                <hr className="my-2" />
                <div className="flex justify-between text-base">
                  <span className="text-gray-800 font-medium">Cálculo:</span>
                  <span className="font-mono text-gray-600">{formatNumber(result.tonnes)}t × {result.emissionFactor} × {formatCurrency(result.pricePerTonne)}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div className="text-sm text-amber-800">
                  <p className="font-bold mb-1">Aviso importante</p>
                  <ul className="space-y-1 text-amber-700">
                    <li>• Esta es una <strong>estimación orientativa</strong> basada en valores por defecto de la UE</li>
                    <li>• Las emisiones reales dependen del proceso productivo de cada instalación</li>
                    <li>• El precio EU ETS fluctúa diariamente</li>
                    <li>• Hasta 31/12/2025 no hay obligación de compra (período transitorio)</li>
                    <li>• Consulte con un asesor especializado para cálculos definitivos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-500">
          <p><strong>Fuentes:</strong> Valores por defecto según Reglamento de Ejecución (UE) 2023/1773. Precio EU ETS de referencia actualizado a {EU_ETS_PRICE.lastUpdate}.</p>
        </div>
      </div>
    </div>
  )
}
