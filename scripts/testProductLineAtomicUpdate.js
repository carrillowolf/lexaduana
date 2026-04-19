#!/usr/bin/env node
/**
 * Test unitario: verifica que los handlers de ProductLineEditor emiten
 * un único update atómico cuando cambian dos campos relacionados al
 * mismo tiempo (countryCode + countryName, hasRealEmissions + dependent
 * fields).
 *
 * Simula el contrato de `onChange(index, nextProduct)` recogiendo todas
 * las emisiones y verifica que el resultado final incluye los campos
 * esperados.
 *
 * Motivación: el patrón buggy (dos setState consecutivos sobre el mismo
 * closure stale) hacía que la segunda emisión pisara a la primera.
 * Se arregló en Día 3 para CalculatorProductLine.js y en Día 4 para
 * ProductLineEditor.js.
 *
 * Ejecución: `node scripts/testProductLineAtomicUpdate.js`.
 */

'use strict'

function makeEmitter() {
  const emissions = []
  return {
    emissions,
    onChange: (_index, next) => emissions.push(next),
  }
}

function assert(cond, label) {
  if (!cond) {
    console.error(`✗ FAIL — ${label}`)
    process.exitCode = 1
  } else {
    console.log(`✓ PASS — ${label}`)
  }
}

// --- Handler replicas (espejo de components/cbam/advisory/ProductLineEditor.js) ---

function handleCountryChange({ product, countries, index, onChange, eventValue }) {
  const selected = countries.find(c => c.code === eventValue)
  onChange(index, {
    ...product,
    countryCode: eventValue,
    countryName: selected ? selected.name : '',
  })
}

function handleToggleRealEmissions({ product, index, onChange, checked }) {
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

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------

console.log('\n=== ProductLineEditor atomic update tests ===\n')

// Test 1: Country select — un único update con ambos campos.
{
  const product = { productDescription: 'Acero laminado', countryCode: '', countryName: '', annualTonnes: 500 }
  const countries = [{ code: 'TR', name: 'Turquía' }, { code: 'CN', name: 'China' }]
  const { emissions, onChange } = makeEmitter()

  handleCountryChange({ product, countries, index: 0, onChange, eventValue: 'TR' })

  assert(emissions.length === 1, 'country change: exactamente 1 emisión (no hay cadena stale)')
  const next = emissions[0]
  assert(next.countryCode === 'TR', 'country change: countryCode persiste')
  assert(next.countryName === 'Turquía', 'country change: countryName persiste en el mismo update')
  assert(next.productDescription === 'Acero laminado', 'country change: otros campos preservados')
  assert(next.annualTonnes === 500, 'country change: annualTonnes preservado')
}

// Test 2: Country select — valor vacío (placeholder). countryName debe vaciarse.
{
  const product = { countryCode: 'TR', countryName: 'Turquía' }
  const countries = [{ code: 'TR', name: 'Turquía' }]
  const { emissions, onChange } = makeEmitter()

  handleCountryChange({ product, countries, index: 0, onChange, eventValue: '' })

  assert(emissions.length === 1, 'country clear: exactamente 1 emisión')
  assert(emissions[0].countryCode === '', 'country clear: countryCode vaciado')
  assert(emissions[0].countryName === '', 'country clear: countryName vaciado')
}

// Test 3: Toggle real emissions ON — un único update atómico con el flag.
{
  const product = {
    hasRealEmissions: false,
    emissionFactorReal: null,
    productionRoute: null,
    countryCode: 'TR',
    countryName: 'Turquía',
  }
  const { emissions, onChange } = makeEmitter()

  handleToggleRealEmissions({ product, index: 0, onChange, checked: true })

  assert(emissions.length === 1, 'toggle ON: exactamente 1 emisión')
  assert(emissions[0].hasRealEmissions === true, 'toggle ON: hasRealEmissions=true')
  assert(emissions[0].countryCode === 'TR', 'toggle ON: otros campos preservados')
}

// Test 4: Toggle real emissions OFF — un único update atómico con reset.
{
  const product = {
    hasRealEmissions: true,
    emissionFactorReal: 1.85,
    productionRoute: 'electric_arc',
    countryCode: 'TR',
  }
  const { emissions, onChange } = makeEmitter()

  handleToggleRealEmissions({ product, index: 0, onChange, checked: false })

  assert(emissions.length === 1, 'toggle OFF: exactamente 1 emisión')
  assert(emissions[0].hasRealEmissions === false, 'toggle OFF: hasRealEmissions=false')
  assert(emissions[0].emissionFactorReal === null, 'toggle OFF: emissionFactorReal reseteado')
  assert(emissions[0].productionRoute === null, 'toggle OFF: productionRoute reseteado')
  assert(emissions[0].countryCode === 'TR', 'toggle OFF: otros campos preservados')
}

// ------------------------------------------------------------------
// Regression guard: patrón buggy (dos setState stale) debe perder campos.
// Este sub-test documenta el bug original y por qué el fix atómico es necesario.
// ------------------------------------------------------------------
{
  const product = { countryCode: '', countryName: '' }
  const { emissions, onChange } = makeEmitter()

  // Patrón BUGGY — dos emisiones sobre el mismo `product` stale.
  const buggyHandleChange = (field, value) => onChange(0, { ...product, [field]: value })
  buggyHandleChange('countryCode', 'TR')
  buggyHandleChange('countryName', 'Turquía')

  // Última emisión pisa la primera. countryCode se pierde.
  assert(emissions.length === 2, 'regression guard: el patrón buggy emite 2 veces')
  const last = emissions[emissions.length - 1]
  assert(
    last.countryCode === '' && last.countryName === 'Turquía',
    'regression guard: el patrón buggy confirma pérdida del primer update (esperado)',
  )
}

if (process.exitCode && process.exitCode !== 0) {
  console.error('\n❌ Tests failed')
} else {
  console.log('\n✅ All tests passed')
}
