'use client'

import AdvisoryStatusBadge from './AdvisoryStatusBadge'

function formatCurrency(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatNumber(value, decimals = 2) {
  if (value == null) return '—'
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export default function AdvisorySummary({ request }) {
  if (!request) return null

  const hasResults = request.totalEstimatedCost != null

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{request.companyName}</h3>
          <p className="text-sm text-gray-500">{request.contactName} &middot; {request.contactEmail}</p>
        </div>
        <AdvisoryStatusBadge status={request.status} />
      </div>

      {/* Resumen de costes */}
      {hasResults && (
        <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Coste CBAM estimado</p>
            <p className="text-xl font-bold text-[#0A3D5C]">{formatCurrency(request.totalEstimatedCost)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Toneladas totales</p>
            <p className="text-xl font-bold text-gray-900">{formatNumber(request.totalTonnes)} t</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Emisiones totales</p>
            <p className="text-xl font-bold text-gray-900">{formatNumber(request.totalEmissions, 4)} tCO2e</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Precio CO2 usado</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(request.co2PriceUsed)}/tCO2</p>
          </div>
        </div>
      )}

      {/* De minimis */}
      {hasResults && request.exceedsDeMinisMis != null && (
        <div className={`mx-6 mb-4 p-3 rounded-lg text-sm ${
          request.exceedsDeMinisMis
            ? 'bg-amber-50 text-amber-800 border border-amber-200'
            : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {request.exceedsDeMinisMis
            ? `Supera el umbral de minimis (${formatNumber(request.totalTonnes)} t >= 50 t). Obligaciones CBAM aplicables.`
            : `Por debajo del umbral de minimis (${formatNumber(request.totalTonnes)} t < 50 t). Posible exención.`
          }
        </div>
      )}

      {/* Productos */}
      {request.products?.length > 0 && (
        <div className="px-6 pb-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">
            {request.products.length} producto{request.products.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {request.products.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <span className="font-medium text-gray-900">{p.productDescription}</span>
                  {p.cnCode && (
                    <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                      {p.cnCode}
                    </span>
                  )}
                  <span className="ml-2 text-gray-500">{p.countryName || p.countryCode}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-700">{formatNumber(p.annualTonnes)} t</span>
                  {p.totalCost != null && (
                    <span className="ml-3 font-medium text-[#0A3D5C]">{formatCurrency(p.totalCost)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadatos */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>Creada: {new Date(request.createdAt).toLocaleDateString('es-ES')}</span>
        {request.submittedAt && (
          <span>Enviada: {new Date(request.submittedAt).toLocaleDateString('es-ES')}</span>
        )}
      </div>
    </div>
  )
}
