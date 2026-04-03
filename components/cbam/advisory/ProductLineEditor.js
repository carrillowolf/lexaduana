'use client'

import { useState } from 'react'

const PRODUCTION_ROUTES = {
  ironSteel: [
    { value: 'blast_furnace', label: 'Alto horno (BF-BOF)' },
    { value: 'electric_arc', label: 'Horno de arco eléctrico (EAF)' },
    { value: 'direct_reduction', label: 'Reducción directa (DRI)' },
  ],
  aluminium: [
    { value: 'primary_smelting', label: 'Fundición primaria' },
    { value: 'secondary_recycling', label: 'Reciclaje secundario' },
  ],
  cement: [
    { value: 'dry_process', label: 'Proceso seco' },
    { value: 'wet_process', label: 'Proceso húmedo' },
  ],
  fertilizers: [
    { value: 'haber_bosch', label: 'Proceso Haber-Bosch' },
    { value: 'nitric_acid', label: 'Ácido nítrico' },
  ],
  hydrogen: [
    { value: 'smr', label: 'Reformado de metano (SMR)' },
    { value: 'electrolysis', label: 'Electrólisis' },
  ],
  electricity: [
    { value: 'grid_average', label: 'Media de red' },
  ],
}

function EmptyState({ onAdd }) {
  return (
    <div className="text-center py-10 px-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
      <div className="text-4xl mb-3">📦</div>
      <p className="text-gray-600 font-medium mb-1">No hay productos todavía</p>
      <p className="text-sm text-gray-500 mb-4">
        Añade los productos que importas para que podamos analizar tu exposición CBAM.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A3D5C] text-white rounded-lg text-sm font-medium hover:bg-[#0d5078] transition-colors"
      >
        + Añadir producto
      </button>
    </div>
  )
}

function ProductForm({ product, index, countries, onChange, onRemove }) {
  const [showEmissions, setShowEmissions] = useState(product.hasRealEmissions || false)

  function handleChange(field, value) {
    onChange(index, { ...product, [field]: value })
  }

  function toggleRealEmissions(checked) {
    setShowEmissions(checked)
    handleChange('hasRealEmissions', checked)
    if (!checked) {
      onChange(index, {
        ...product,
        hasRealEmissions: false,
        emissionFactorReal: null,
        productionRoute: null,
      })
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Producto {index + 1}</h4>
        <button
          onClick={() => onRemove(index)}
          className="text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          Eliminar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Descripción */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción del producto <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={product.productDescription || ''}
            onChange={(e) => handleChange('productDescription', e.target.value)}
            placeholder="Ej: Bobinas de acero laminado en frío"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
        </div>

        {/* Código CN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código CN <span className="text-gray-400 text-xs">(8 dígitos, opcional)</span>
          </label>
          <input
            type="text"
            value={product.cnCode || ''}
            onChange={(e) => handleChange('cnCode', e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="Ej: 72101200"
            maxLength={8}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">Si no lo conoces, lo identificaremos nosotros.</p>
        </div>

        {/* País de origen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            País de origen <span className="text-red-500">*</span>
          </label>
          <select
            value={product.countryCode || ''}
            onChange={(e) => {
              const selected = countries.find(c => c.code === e.target.value)
              handleChange('countryCode', e.target.value)
              if (selected) handleChange('countryName', selected.name)
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          >
            <option value="">Selecciona un país</option>
            {countries.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Toneladas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Toneladas anuales estimadas <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={product.annualTonnes || ''}
            onChange={(e) => handleChange('annualTonnes', e.target.value ? parseFloat(e.target.value) : '')}
            placeholder="Ej: 500"
            min="0"
            step="0.01"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
        </div>

        {/* Proveedor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del proveedor <span className="text-gray-400 text-xs">(opcional)</span>
          </label>
          <input
            type="text"
            value={product.supplierName || ''}
            onChange={(e) => handleChange('supplierName', e.target.value)}
            placeholder="Ej: Eregli Iron & Steel"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
        </div>

        {/* Email proveedor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email del proveedor <span className="text-gray-400 text-xs">(opcional)</span>
          </label>
          <input
            type="email"
            value={product.supplierContactEmail || ''}
            onChange={(e) => handleChange('supplierContactEmail', e.target.value)}
            placeholder="proveedor@empresa.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">Para solicitar datos reales de emisiones.</p>
        </div>
      </div>

      {/* Toggle emisiones reales */}
      <div className="pt-2 border-t border-gray-100">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showEmissions}
            onChange={(e) => toggleRealEmissions(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#0A3D5C] focus:ring-[#0A3D5C]"
          />
          <span className="text-sm text-gray-700">
            Dispongo de datos de emisiones reales del proveedor
          </span>
        </label>

        {showEmissions && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Factor de emisión declarado (tCO2e/t)
              </label>
              <input
                type="number"
                value={product.emissionFactorReal || ''}
                onChange={(e) => handleChange('emissionFactorReal', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Ej: 1.85"
                min="0"
                step="0.0001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ruta de producción
              </label>
              <select
                value={product.productionRoute || ''}
                onChange={(e) => handleChange('productionRoute', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
              >
                <option value="">Seleccionar ruta</option>
                {Object.entries(PRODUCTION_ROUTES).map(([sector, routes]) => (
                  <optgroup key={sector} label={sector}>
                    {routes.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProductLineEditor({ products, countries, onChange }) {
  function handleProductChange(index, updated) {
    const next = [...products]
    next[index] = updated
    onChange(next)
  }

  function handleAdd() {
    onChange([
      ...products,
      {
        productDescription: '',
        cnCode: '',
        countryCode: '',
        countryName: '',
        annualTonnes: '',
        supplierName: '',
        supplierContactEmail: '',
        hasRealEmissions: false,
        emissionFactorReal: null,
        productionRoute: null,
      },
    ])
  }

  function handleRemove(index) {
    onChange(products.filter((_, i) => i !== index))
  }

  if (products.length === 0) {
    return <EmptyState onAdd={handleAdd} />
  }

  return (
    <div className="space-y-4">
      {products.map((product, i) => (
        <ProductForm
          key={i}
          product={product}
          index={i}
          countries={countries}
          onChange={handleProductChange}
          onRemove={handleRemove}
        />
      ))}
      <button
        onClick={handleAdd}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-[#0A3D5C] hover:text-[#0A3D5C] transition-colors font-medium"
      >
        + Añadir otro producto
      </button>
    </div>
  )
}
