'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { calculadoraCbamDict } from '@/lib/i18n/calculadora-cbam'
import { isCnSupportedByAdvisory } from '@/lib/cbamData'

/**
 * CalculatorProductLine — editor por producto para la Calculadora (Nivel 2).
 *
 * Variante simplificada del ProductLineEditor de Advisory: sin campos de
 * proveedor ni de documentación. Mismos helpers que Advisory:
 * `isCnSupportedByAdvisory` para bloqueo de electricidad, lista de rutas
 * de producción por sector.
 */

function useProductionRoutes() {
  const t = useTranslation(calculadoraCbamDict)
  return {
    ironSteel: [
      { value: 'blast_furnace', label: t('line.routes.blastFurnace') },
      { value: 'electric_arc', label: t('line.routes.electricArc') },
      { value: 'direct_reduction', label: t('line.routes.directReduction') },
    ],
    aluminium: [
      { value: 'primary_smelting', label: t('line.routes.primarySmelting') },
      { value: 'secondary_recycling', label: t('line.routes.secondaryRecycling') },
    ],
    cement: [
      { value: 'dry_process', label: t('line.routes.dryProcess') },
      { value: 'wet_process', label: t('line.routes.wetProcess') },
    ],
    fertilizers: [
      { value: 'haber_bosch', label: t('line.routes.haberBosch') },
      { value: 'nitric_acid', label: t('line.routes.nitricAcid') },
    ],
    hydrogen: [
      { value: 'smr', label: t('line.routes.smr') },
      { value: 'electrolysis', label: t('line.routes.electrolysis') },
    ],
  }
}

export default function CalculatorProductLine({ product, index, countries, onChange, onRemove }) {
  const t = useTranslation(calculadoraCbamDict)
  const productionRoutes = useProductionRoutes()
  const [showReal, setShowReal] = useState(product.hasRealEmissions || false)

  function handleField(field, value) {
    onChange(index, { ...product, [field]: value })
  }

  function toggleRealEmissions(checked) {
    setShowReal(checked)
    if (!checked) {
      onChange(index, {
        ...product,
        hasRealEmissions: false,
        emissionFactorReal: null,
        productionRoute: null,
      })
    } else {
      handleField('hasRealEmissions', true)
    }
  }

  const cnCheck = product.cnCode ? isCnSupportedByAdvisory(product.cnCode) : null
  const cnBlocked = cnCheck && !cnCheck.supported

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">
          {t('line.productN')} {index + 1}
        </h4>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          {t('line.remove')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Descripción libre (opcional pero útil para el historial) */}
        <div className="md:col-span-2">
          <label htmlFor={`calculadora-product-${index}-desc`} className="block text-sm font-medium text-gray-700 mb-1">
            {t('line.descriptionLabel')} <span className="text-gray-400 text-xs">{t('line.optional')}</span>
          </label>
          <input
            id={`calculadora-product-${index}-desc`}
            type="text"
            value={product.productDescription || ''}
            onChange={(e) => handleField('productDescription', e.target.value)}
            placeholder={t('line.descriptionPlaceholder')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
        </div>

        {/* CN Code */}
        <div>
          <label htmlFor={`calculadora-product-${index}-cn`} className="block text-sm font-medium text-gray-700 mb-1">
            {t('line.cnLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            id={`calculadora-product-${index}-cn`}
            type="text"
            value={product.cnCode || ''}
            onChange={(e) => handleField('cnCode', e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="72101220"
            maxLength={8}
            className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 outline-none ${
              cnBlocked
                ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
                : 'border-gray-300 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C]'
            }`}
          />
          {cnBlocked ? (
            <p className="mt-1 text-xs text-red-600">{t('line.electricityBlocked')}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">{t('line.cnHelp')}</p>
          )}
        </div>

        {/* Country */}
        <div>
          <label htmlFor={`calculadora-product-${index}-country`} className="block text-sm font-medium text-gray-700 mb-1">
            {t('line.countryLabel')} <span className="text-red-500">*</span>
          </label>
          <select
            id={`calculadora-product-${index}-country`}
            value={product.countryCode || ''}
            onChange={(e) => {
              const selected = countries.find(c => c.code === e.target.value)
              // Un solo update atómico: dos handleField seguidos sobre el
              // mismo `product` del closure se pisan entre sí.
              onChange(index, {
                ...product,
                countryCode: e.target.value,
                countryName: selected ? selected.name : '',
              })
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          >
            <option value="">{t('line.countryPlaceholder')}</option>
            {countries.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Tonnes */}
        <div>
          <label htmlFor={`calculadora-product-${index}-tonnes`} className="block text-sm font-medium text-gray-700 mb-1">
            {t('line.tonnesLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            id={`calculadora-product-${index}-tonnes`}
            type="number"
            value={product.annualTonnes || ''}
            onChange={(e) => handleField('annualTonnes', e.target.value ? parseFloat(e.target.value) : '')}
            placeholder="500"
            min="0"
            step="0.01"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
        </div>

        {/* Emissions source radio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('line.emissionsSourceLabel')}
          </label>
          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`emissions-${index}`}
                checked={!showReal}
                onChange={() => toggleRealEmissions(false)}
                className="text-[#0A3D5C] focus:ring-[#0A3D5C]"
              />
              <span className="text-sm text-gray-700">{t('line.emissionsDefault')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`emissions-${index}`}
                checked={showReal}
                onChange={() => toggleRealEmissions(true)}
                className="text-[#0A3D5C] focus:ring-[#0A3D5C]"
              />
              <span className="text-sm text-gray-700">{t('line.emissionsReal')}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Sección condicional: FE real + ruta */}
      {showReal && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <label htmlFor={`calculadora-product-${index}-ef-real`} className="block text-sm font-medium text-gray-700 mb-1">
              {t('line.emissionFactorLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              id={`calculadora-product-${index}-ef-real`}
              type="number"
              value={product.emissionFactorReal ?? ''}
              onChange={(e) => handleField('emissionFactorReal', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="1.85"
              min="0"
              step="0.0001"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">{t('line.emissionFactorHelp')}</p>
          </div>

          <div>
            <label htmlFor={`calculadora-product-${index}-route`} className="block text-sm font-medium text-gray-700 mb-1">
              {t('line.productionRouteLabel')} <span className="text-gray-400 text-xs">{t('line.optional')}</span>
            </label>
            <select
              id={`calculadora-product-${index}-route`}
              value={product.productionRoute || ''}
              onChange={(e) => handleField('productionRoute', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
            >
              <option value="">{t('line.productionRoutePlaceholder')}</option>
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
  )
}
