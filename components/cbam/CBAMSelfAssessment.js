'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  runSelfAssessment,
  getSectorDisplay,
  getCBAMApplicableCountries,
  CBAM_CN_CODES_FULL,
} from '@/lib/cbamAssessmentData'
import {
  PRODUCTION_ROUTE_TRANSLATIONS,
  PRECURSOR_TRANSLATIONS,
  AGGREGATED_CATEGORY_TRANSLATIONS,
  translateSector,
  translateAggregatedCategory,
  translateProductionRoute,
  translatePrecursor,
  translateCountry,
  translateSpecialProvisions,
} from '@/lib/cbamTranslations'

// ============================================================
// CONSTANTES
// ============================================================

const IMPORT_TYPES = [
  { value: 'libre_practica', label: 'Despacho a libre práctica' },
  { value: 'devolucion_203', label: 'Devolución (Art. 203 UCC)' },
  { value: 'otro', label: 'Ninguna de las anteriores' },
]

const VALUE_RANGES = [
  { value: 'gt150', label: 'Más de 150 euros' },
  { value: 'lte150', label: '150 euros o menos' },
]

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function CBAMSelfAssessment({ countries: serverCountries = [] }) {
  // Estado del formulario
  const [cnCode, setCnCode] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [importType, setImportType] = useState('libre_practica')
  const [valueRange, setValueRange] = useState('gt150')

  // Estado de resultados
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  // Estado del autocomplete
  const [cnSuggestions, setCnSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Países: usar server-provided o fallback
  const countries = useMemo(() => {
    if (serverCountries.length > 0) return serverCountries
    return getCBAMApplicableCountries()
  }, [serverCountries])

  const cbamCountries = useMemo(() =>
    countries.filter(c => c.cbamApplies).sort((a, b) => {
      const nameA = translateCountry(a.name)
      const nameB = translateCountry(b.name)
      return nameA.localeCompare(nameB, 'es')
    }),
    [countries]
  )

  // ============================================================
  // HANDLERS
  // ============================================================

  function handleCnCodeChange(value) {
    const cleaned = value.replace(/\D/g, '').slice(0, 8)
    setCnCode(cleaned)

    if (cleaned.length >= 4) {
      const matches = CBAM_CN_CODES_FULL
        .filter(c => c.cnCode.startsWith(cleaned))
        .slice(0, 8)
      setCnSuggestions(matches)
      setShowSuggestions(matches.length > 0)
    } else {
      setCnSuggestions([])
      setShowSuggestions(false)
    }
  }

  function selectSuggestion(item) {
    setCnCode(item.cnCode)
    setShowSuggestions(false)
    setCnSuggestions([])
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!cnCode || cnCode.length < 4) return

    setLoading(true)
    // Usar setTimeout para que el UI muestre el loading state
    setTimeout(() => {
      const assessment = runSelfAssessment(cnCode, countryCode, importType, valueRange)
      setResult(assessment)
      setLoading(false)
    }, 300)
  }

  function handleReset() {
    setCnCode('')
    setCountryCode('')
    setImportType('libre_practica')
    setValueRange('gt150')
    setResult(null)
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-8">
      {/* Formulario */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header del formulario */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔍</span>
            <div>
              <h3 className="text-xl font-bold text-white">Verificador CBAM</h3>
              <p className="text-emerald-100 text-sm">573 códigos CN | 246 países | Benchmarks oficiales</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CN Code con autocomplete */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Código CN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cnCode}
                onChange={(e) => handleCnCodeChange(e.target.value)}
                onFocus={() => cnSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Introduce el código CN de 8 dígitos"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-lg font-mono"
                maxLength={8}
                inputMode="numeric"
              />
              <p className="mt-1 text-xs text-gray-400">8 dígitos del código de nomenclatura combinada</p>

              {/* Autocomplete dropdown */}
              {showSuggestions && cnSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {cnSuggestions.map((item) => {
                    const sector = getSectorDisplay(item.mainCategory)
                    return (
                      <button
                        key={item.cnCode}
                        type="button"
                        onMouseDown={() => selectSuggestion(item)}
                        className="w-full px-4 py-3 text-left hover:bg-emerald-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                      >
                        <span className="text-lg">{sector.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-gray-900">{item.cnCode}</span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full truncate">
                              {sector.name}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{item.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* País */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                País de origen <span className="text-red-500">*</span>
              </label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              >
                <option value="">Seleccionar país...</option>
                {cbamCountries.map(c => (
                  <option key={c.code} value={c.code}>
                    {translateCountry(c.name)} ({c.code})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">Países donde el CBAM aplica ({cbamCountries.length} países)</p>
            </div>

            {/* Tipo de importación */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de importación
              </label>
              <select
                value={importType}
                onChange={(e) => setImportType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              >
                {IMPORT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Valor de la mercancía */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Valor de la mercancía
              </label>
              <div className="flex gap-3">
                {VALUE_RANGES.map(v => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setValueRange(v.value)}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                      valueRange === v.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Botón submit */}
          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={!cnCode || cnCode.length < 4 || loading}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analizando...
                </span>
              ) : (
                'Verificar CBAM'
              )}
            </button>
            {result && (
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-4 border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                Nueva consulta
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Resultados */}
      {result && !loading && (
        <AssessmentResult result={result} />
      )}
    </div>
  )
}

// ============================================================
// RESULTADO DEL ASSESSMENT
// ============================================================

function AssessmentResult({ result }) {
  if (!result.cbamApplies) {
    return <ExclusionResult result={result} />
  }
  return <CBAMAppliesResult result={result} />
}

// ============================================================
// RESULTADO: CBAM NO APLICA
// ============================================================

function ExclusionResult({ result }) {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">✅</span>
          <div>
            <h3 className="text-xl font-bold text-white">El CBAM no aplica a esta importación</h3>
            <p className="text-green-100 text-sm">
              {result.exclusionReasons.length} motivo{result.exclusionReasons.length !== 1 ? 's' : ''} de exclusión identificado{result.exclusionReasons.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-4">
        {result.exclusionReasons.map((reason, i) => (
          <div key={i} className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
            <span className="text-green-600 mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </span>
            <div>
              <p className="font-medium text-green-800">{reason.reason}</p>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                {reason.code}
              </span>
            </div>
          </div>
        ))}

        <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>Nota:</strong> Este resultado se basa en la información proporcionada. Si tiene dudas
            sobre la clasificación arancelaria de su producto, consulte con un especialista en aduanas.
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// RESULTADO: CBAM SÍ APLICA
// ============================================================

function CBAMAppliesResult({ result }) {
  const { requirements, benchmarks, country } = result
  const sector = getSectorDisplay(requirements.sector)

  return (
    <div className="space-y-6">
      {/* Header del resultado */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌍</span>
            <div>
              <h3 className="text-xl font-bold text-white">El CBAM aplica a esta importación</h3>
              <p className="text-amber-100 text-sm">
                Informe completo de obligaciones y requisitos
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Identificación del producto */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <InfoCard
              label="Sector"
              value={<BilingualText es={sector.name} en={requirements.sector} />}
              icon={sector.icon}
              accent="emerald"
            />
            <InfoCard
              label="Categoría de producto agregada"
              value={<BilingualText es={AGGREGATED_CATEGORY_TRANSLATIONS[requirements.aggregatedCategory]} en={requirements.aggregatedCategory} />}
              icon="📦"
              accent="blue"
            />
            <InfoCard
              label="Código CN"
              value={requirements.cnCode}
              icon="🏷️"
              accent="purple"
              mono
            />
            <InfoCard
              label="País"
              value={country ? translateCountry(country.name) : '—'}
              icon="🌐"
              accent="teal"
            />
          </div>

          <p className="text-gray-600 bg-gray-50 rounded-xl p-4 text-sm">
            <strong>Descripción:</strong> {requirements.description}
          </p>
        </div>
      </div>

      {/* Provisiones especiales */}
      {requirements.specialProvisions && (
        <div className="bg-amber-50 rounded-2xl shadow-lg border-2 border-amber-200 p-6">
          <h4 className="font-bold text-amber-800 flex items-center gap-2 mb-3">
            <span>⚠️</span> Provisiones especiales
          </h4>
          <p className="text-amber-700 text-sm leading-relaxed">{translateSpecialProvisions(requirements.specialProvisions)}</p>
        </div>
      )}

      {/* Rutas de producción */}
      <SectionCard title="Rutas de producción" icon="🏭" description="Métodos de fabricación aplicables a este producto">
        <div className="flex flex-wrap gap-2 mb-4">
          {requirements.productionRoutes.map((route, i) => {
            const esName = PRODUCTION_ROUTE_TRANSLATIONS[route]
            return (
              <span key={i} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                {esName || route}
                {esName && (
                  <span className="text-blue-500 font-normal ml-1">({route})</span>
                )}
              </span>
            )
          })}
        </div>
        {requirements.productionRoutesDetail && (
          <details className="group">
            <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
              Ver detalle de monitorización por ruta
            </summary>
            <div className="mt-3 p-4 bg-blue-50 rounded-xl text-sm text-blue-800 whitespace-pre-line leading-relaxed">
              {requirements.productionRoutesDetail}
            </div>
          </details>
        )}
      </SectionCard>

      {/* Precursores */}
      <SectionCard title="Precursores a declarar" icon="🔗" description="Materias primas cuyas emisiones deben incluirse en el cálculo">
        {requirements.precursors.length === 0 ? (
          <p className="text-gray-500 text-sm italic">Este producto no tiene precursores — solo se declaran emisiones directas de producción.</p>
        ) : (
          <div className="space-y-3">
            {requirements.precursors.map((p, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${p.conditional ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-200'}`}>
                <span className={`mt-0.5 ${p.conditional ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {p.conditional ? '⚡' : '✓'}
                </span>
                <div>
                  <p className="font-medium text-gray-800">
                    <TranslatedPrecursor name={p.name} />
                  </p>
                  {p.conditional && (
                    <p className="text-xs text-amber-600 mt-1">
                      Condicional: {translateSpecialProvisions(p.condition)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Datos a solicitar al proveedor */}
      <SectionCard title="Datos a solicitar al proveedor" icon="📋" description="Información que necesitas pedir a tu proveedor para cumplir con el CBAM">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Datos de instalación */}
          <DataRequirementCard
            title="Datos de la instalación"
            icon="🏗️"
            content={requirements.installationData}
          />

          {/* Emisiones indirectas */}
          {requirements.indirectEmissionsData && (
            <DataRequirementCard
              title="Emisiones indirectas"
              icon="⚡"
              content={requirements.indirectEmissionsData}
            />
          )}

          {/* Datos extra */}
          {requirements.extraDataRequired && (
            <DataRequirementCard
              title="Datos específicos del producto"
              icon="📐"
              content={requirements.extraDataRequired}
            />
          )}

          {/* Carbon price */}
          {requirements.carbonPriceAbroad && (
            <DataRequirementCard
              title="Precio del carbono pagado en origen"
              icon="💰"
              content="El proveedor debe declarar si ha pagado algún precio de carbono en su país de origen. Esta cantidad puede deducirse del coste CBAM."
            />
          )}
        </div>
      </SectionCard>

      {/* Benchmarks */}
      {benchmarks && (
        <SectionCard title="Valores de referencia (benchmarks)" icon="📊" description="Valores de asignación gratuita (Free Allocation Adjustment) según Reg. (UE) 2025/2620">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="py-3 px-4 text-left text-gray-500 font-medium">Ruta</th>
                  <th className="py-3 px-4 text-right text-gray-500 font-medium">
                    <div>Columna A</div>
                    <div className="text-xs font-normal text-green-600">Emisiones reales</div>
                  </th>
                  <th className="py-3 px-4 text-right text-gray-500 font-medium">
                    <div>Columna B</div>
                    <div className="text-xs font-normal text-amber-600">Valores por defecto</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {benchmarks.benchmarkValues.map((bv, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-gray-600">
                        {bv.columnARoute || bv.columnBRoute || `Ruta ${i + 1}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {bv.columnA > 0 ? (
                        <span className="font-bold text-green-700">{bv.columnA.toFixed(3)}</span>
                      ) : (
                        <span className="text-gray-400">0 (sin FAA)</span>
                      )}
                      <span className="text-xs text-gray-400 ml-1">tCO₂e/t</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {bv.columnB > 0 ? (
                        <span className="font-bold text-amber-700">{bv.columnB.toFixed(3)}</span>
                      ) : (
                        <span className="text-gray-400">0 (sin FAA)</span>
                      )}
                      <span className="text-xs text-gray-400 ml-1">tCO₂e/t</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-xl text-sm text-blue-800 space-y-2">
            <p><strong>Columna A</strong> = Valor de referencia cuando el declarante usa emisiones reales verificadas (asignación gratuita efectiva)</p>
            <p><strong>Columna B</strong> = Valor de referencia cuando el declarante usa valores por defecto (asignación gratuita por defecto)</p>
            {benchmarks.benchmarkValues.some(bv => bv.columnA === 0) && (
              <p className="text-amber-700"><strong>Nota:</strong> Columna A = 0 significa que no hay deducción por asignación gratuita cuando se usan emisiones reales para este producto.</p>
            )}
          </div>
        </SectionCard>
      )}

      {/* Umbral de minimis */}
      <SectionCard title="Umbral de minimis" icon="📏" description="Exención para importaciones de bajo volumen">
        {requirements.deMinimisApplies ? (
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="text-green-800">
              <strong>Aplica:</strong> Si importa menos de <strong>{requirements.deMinimisThreshold} toneladas/año</strong> de
              mercancías CBAM del sector {sector.name}, puede solicitar la exención de minimis (certificado Y137).
            </p>
          </div>
        ) : (
          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <p className="text-red-800">
              <strong>No aplica:</strong> El sector {sector.name} no tiene exención de minimis.
              El CBAM se aplica independientemente del volumen importado.
            </p>
          </div>
        )}
      </SectionCard>

      {/* Próximos pasos */}
      <div className="bg-gradient-to-r from-[#0A3D5C] to-[#083049] rounded-3xl shadow-xl p-8 text-white">
        <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🚀</span> Próximos pasos
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/cbam#email-template"
            className="block p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <span className="text-2xl mb-2 block">📧</span>
            <h5 className="font-bold mb-1">Contactar al proveedor</h5>
            <p className="text-sm text-white/70">Genera un email profesional para solicitar datos de emisiones</p>
          </Link>
          <Link
            href="/cbam#simulator"
            className="block p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <span className="text-2xl mb-2 block">🧮</span>
            <h5 className="font-bold mb-1">Calcular coste CBAM</h5>
            <p className="text-sm text-white/70">Estima el coste de certificados con el simulador</p>
          </Link>
          <Link
            href="/cbam/guia"
            className="block p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <span className="text-2xl mb-2 block">📖</span>
            <h5 className="font-bold mb-1">Guía CBAM</h5>
            <p className="text-sm text-white/70">Aprende todo sobre el CBAM con nuestra guía completa</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// SUB-COMPONENTES
// ============================================================

/** Busca traducción de precursor con coincidencia case-insensitive */
function findPrecursorTranslation(name) {
  if (PRECURSOR_TRANSLATIONS[name]) return PRECURSOR_TRANSLATIONS[name]
  // Case-insensitive fallback
  const key = Object.keys(PRECURSOR_TRANSLATIONS).find(k => k.toLowerCase() === name.toLowerCase())
  return key ? PRECURSOR_TRANSLATIONS[key] : null
}

/** Traduce un nombre de precursor, soportando nombres compuestos como "pig iron, DRI" */
function TranslatedPrecursor({ name }) {
  // Direct match
  const direct = findPrecursorTranslation(name)
  if (direct) {
    return (
      <>
        {direct}
        <span className="text-gray-400 font-normal ml-1 text-sm">({name})</span>
      </>
    )
  }
  // Try splitting compound names (e.g. "pig iron, DRI")
  const parts = name.split(',').map(s => s.trim()).filter(Boolean)
  if (parts.length > 1 && parts.some(p => findPrecursorTranslation(p))) {
    const esParts = parts.map(p => findPrecursorTranslation(p) || p)
    return (
      <>
        {esParts.join(', ')}
        <span className="text-gray-400 font-normal ml-1 text-sm">({name})</span>
      </>
    )
  }
  return <>{name}</>
}

/** Muestra texto bilingüe: español principal + inglés entre paréntesis en gris */
function BilingualText({ es, en }) {
  if (!es || es === en) return <span>{es || en}</span>
  return (
    <span>
      {es}
      {' '}
      <span className="text-gray-400 text-xs font-normal">({en})</span>
    </span>
  )
}

function InfoCard({ label, value, icon, accent = 'gray', mono = false }) {
  const colors = {
    emerald: 'bg-emerald-50 border-emerald-200',
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    teal: 'bg-teal-50 border-teal-200',
    gray: 'bg-gray-50 border-gray-200',
  }

  return (
    <div className={`p-4 rounded-xl border ${colors[accent]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={`font-bold text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

function SectionCard({ title, icon, description, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="px-8 py-5 border-b border-gray-100">
        <h4 className="font-bold text-gray-900 flex items-center gap-2">
          <span>{icon}</span> {title}
        </h4>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="p-8">
        {children}
      </div>
    </div>
  )
}

function DataRequirementCard({ title, icon, content }) {
  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
      <h5 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
        <span>{icon}</span> {title}
      </h5>
      <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{content}</p>
    </div>
  )
}
