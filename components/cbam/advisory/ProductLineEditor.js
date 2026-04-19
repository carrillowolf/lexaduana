'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { cbamDict } from '@/lib/i18n/cbam'
import { isCnSupportedByAdvisory } from '@/lib/cbamData'

function useProductionRoutes() {
  const t = useTranslation(cbamDict)
  return {
    ironSteel: [
      { value: 'blast_furnace', label: t('productEditor.blastFurnace') },
      { value: 'electric_arc', label: t('productEditor.electricArc') },
      { value: 'direct_reduction', label: t('productEditor.directReduction') },
    ],
    aluminium: [
      { value: 'primary_smelting', label: t('productEditor.primarySmelting') },
      { value: 'secondary_recycling', label: t('productEditor.secondaryRecycling') },
    ],
    cement: [
      { value: 'dry_process', label: t('productEditor.dryProcess') },
      { value: 'wet_process', label: t('productEditor.wetProcess') },
    ],
    fertilizers: [
      { value: 'haber_bosch', label: t('productEditor.haberBosch') },
      { value: 'nitric_acid', label: t('productEditor.nitricAcid') },
    ],
    hydrogen: [
      { value: 'smr', label: t('productEditor.smr') },
      { value: 'electrolysis', label: t('productEditor.electrolysis') },
    ],
    electricity: [
      { value: 'grid_average', label: t('productEditor.gridAverage') },
    ],
  }
}

function EmptyState({ onAdd, t }) {
  return (
    <div className="text-center py-10 px-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
      <div className="text-4xl mb-3">📦</div>
      <p className="text-gray-600 font-medium mb-1">{t('productEditor.emptyTitle')}</p>
      <p className="text-sm text-gray-500 mb-4">
        {t('productEditor.emptyDesc')}
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A3D5C] text-white rounded-lg text-sm font-medium hover:bg-[#0d5078] transition-colors"
      >
        {t('productEditor.addProduct')}
      </button>
    </div>
  )
}

function ProductForm({ product, index, countries, onChange, onRemove, t, productionRoutes }) {
  const [showEmissions, setShowEmissions] = useState(product.hasRealEmissions || false)

  function handleChange(field, value) {
    onChange(index, { ...product, [field]: value })
  }

  function toggleRealEmissions(checked) {
    setShowEmissions(checked)
    if (checked) {
      onChange(index, { ...product, hasRealEmissions: true })
    } else {
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
        <h4 className="font-medium text-gray-900">{t('productEditor.productN')} {index + 1}</h4>
        <button
          onClick={() => onRemove(index)}
          className="text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          {t('productEditor.remove')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Description */}
        <div className="md:col-span-2">
          <label htmlFor={`advisory-product-${index}-desc`} className="block text-sm font-medium text-gray-700 mb-1">
            {t('productEditor.descLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            id={`advisory-product-${index}-desc`}
            type="text"
            value={product.productDescription || ''}
            onChange={(e) => handleChange('productDescription', e.target.value)}
            placeholder={t('productEditor.descPlaceholder')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
        </div>

        {/* CN Code */}
        <div>
          <label htmlFor={`advisory-product-${index}-cn`} className="block text-sm font-medium text-gray-700 mb-1">
            {t('productEditor.cnLabel')} <span className="text-gray-400 text-xs">{t('productEditor.cnHint')}</span>
          </label>
          <input
            id={`advisory-product-${index}-cn`}
            type="text"
            value={product.cnCode || ''}
            onChange={(e) => handleChange('cnCode', e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="Ej: 72101200"
            maxLength={8}
            className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 outline-none ${
              product.cnCode && !isCnSupportedByAdvisory(product.cnCode).supported
                ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
                : 'border-gray-300 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C]'
            }`}
          />
          {product.cnCode && !isCnSupportedByAdvisory(product.cnCode).supported ? (
            <p className="mt-1 text-xs text-red-600">
              El sector de electricidad (CN 2716) no está incluido en esta estimación automática.
              Contacte con LexAduana para una consultoría especializada.
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">{t('productEditor.cnHelp')}</p>
          )}
        </div>

        {/* Country */}
        <div>
          <label htmlFor={`advisory-product-${index}-country`} className="block text-sm font-medium text-gray-700 mb-1">
            {t('productEditor.countryLabel')} <span className="text-red-500">*</span>
          </label>
          <select
            id={`advisory-product-${index}-country`}
            value={product.countryCode || ''}
            onChange={(e) => {
              const selected = countries.find(c => c.code === e.target.value)
              onChange(index, {
                ...product,
                countryCode: e.target.value,
                countryName: selected ? selected.name : '',
              })
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          >
            <option value="">{t('productEditor.countryPlaceholder')}</option>
            {countries.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Tonnes */}
        <div>
          <label htmlFor={`advisory-product-${index}-tonnes`} className="block text-sm font-medium text-gray-700 mb-1">
            {t('productEditor.tonnesLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            id={`advisory-product-${index}-tonnes`}
            type="number"
            value={product.annualTonnes || ''}
            onChange={(e) => handleChange('annualTonnes', e.target.value ? parseFloat(e.target.value) : '')}
            placeholder="Ej: 500"
            min="0"
            step="0.01"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
        </div>

        {/* Supplier */}
        <div>
          <label htmlFor={`advisory-product-${index}-supplier`} className="block text-sm font-medium text-gray-700 mb-1">
            {t('productEditor.supplierLabel')} <span className="text-gray-400 text-xs">{t('productEditor.supplierHint')}</span>
          </label>
          <input
            id={`advisory-product-${index}-supplier`}
            type="text"
            value={product.supplierName || ''}
            onChange={(e) => handleChange('supplierName', e.target.value)}
            placeholder="Ej: Eregli Iron & Steel"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
        </div>

        {/* Supplier email */}
        <div>
          <label htmlFor={`advisory-product-${index}-supplier-email`} className="block text-sm font-medium text-gray-700 mb-1">
            {t('productEditor.supplierEmailLabel')} <span className="text-gray-400 text-xs">{t('productEditor.supplierEmailHint')}</span>
          </label>
          <input
            id={`advisory-product-${index}-supplier-email`}
            type="email"
            value={product.supplierContactEmail || ''}
            onChange={(e) => handleChange('supplierContactEmail', e.target.value)}
            placeholder="proveedor@empresa.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">{t('productEditor.supplierEmailHelp')}</p>
        </div>
      </div>

      {/* Real emissions toggle */}
      <div className="pt-2 border-t border-gray-100">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showEmissions}
            onChange={(e) => toggleRealEmissions(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#0A3D5C] focus:ring-[#0A3D5C]"
          />
          <span className="text-sm text-gray-700">
            {t('productEditor.hasRealEmissions')}
          </span>
        </label>

        {showEmissions && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
            <div>
              <label htmlFor={`advisory-product-${index}-ef-real`} className="block text-sm font-medium text-gray-700 mb-1">
                {t('productEditor.emissionFactorLabel')}
              </label>
              <input
                id={`advisory-product-${index}-ef-real`}
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
              <label htmlFor={`advisory-product-${index}-route`} className="block text-sm font-medium text-gray-700 mb-1">
                {t('productEditor.productionRouteLabel')}
              </label>
              <select
                id={`advisory-product-${index}-route`}
                value={product.productionRoute || ''}
                onChange={(e) => handleChange('productionRoute', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
              >
                <option value="">{t('productEditor.productionRoutePlaceholder')}</option>
                {Object.entries(productionRoutes).map(([sector, routes]) => (
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
  const t = useTranslation(cbamDict)
  const productionRoutes = useProductionRoutes()

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
    return <EmptyState onAdd={handleAdd} t={t} />
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
          t={t}
          productionRoutes={productionRoutes}
        />
      ))}
      <button
        onClick={handleAdd}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-[#0A3D5C] hover:text-[#0A3D5C] transition-colors font-medium"
      >
        {t('productEditor.addAnother')}
      </button>
    </div>
  )
}
