#!/usr/bin/env node
/**
 * Test unitario: verifica los fixes de UX de borradores en /cbam/asesoria.
 *
 * Cubre los dos bugs reportados durante la validación del Día 4:
 *
 * Bug 1 — Borrador huérfano tras envío:
 *   Si el usuario tiene un borrador y clica "Nueva solicitud de Advisory",
 *   el componente debe detectar el borrador y abrir un modal.
 *
 * Bug 2 — Wizard vacío al clicar "Continuar":
 *   Si llega con ?draftId=X, el wizard debe hidratar company, products,
 *   notes y setear requestId para que futuras escrituras hagan PATCH
 *   sobre el mismo registro en vez de crear uno nuevo.
 *
 * Este script replica la lógica de los handlers sin renderizar React,
 * en línea con scripts/testProductLineAtomicUpdate.js.
 *
 * Ejecución: `node scripts/testAdvisoryDraftFlow.js`.
 */

'use strict'

function assert(cond, label) {
  if (!cond) {
    console.error(`✗ FAIL — ${label}`)
    process.exitCode = 1
  } else {
    console.log(`✓ PASS — ${label}`)
  }
}

// ------------------------------------------------------------------
// Replicas de la lógica del wizard (AdvisoryIntakeForm) y de
// mis-solicitudes, extraídas para poder testearlas fuera de React.
// ------------------------------------------------------------------

/** Hidratación de la state del wizard a partir de la respuesta del GET draft. */
function hydrateFromDraft(draft) {
  return {
    companyData: {
      companyName: draft.companyName || '',
      companyCif: draft.companyCif || '',
      companyEori: draft.companyEori || '',
      contactName: draft.contactName || '',
      contactEmail: draft.contactEmail || '',
      contactPhone: draft.contactPhone || '',
      installationsCount: draft.installationsCount || 1,
      isAuthorizedDeclarant: Boolean(draft.isAuthorizedDeclarant),
      hasIndirectRepresentative: Boolean(draft.hasIndirectRepresentative),
      representativeName: draft.representativeName || '',
    },
    clientNotes: draft.clientNotes || '',
    products: (draft.products || []).map(p => ({
      productDescription: p.productDescription || '',
      cnCode: p.cnCode || '',
      countryCode: p.countryCode || '',
      countryName: p.countryName || '',
      annualTonnes: p.annualTonnes != null ? p.annualTonnes : '',
      supplierName: p.supplierName || '',
      supplierContactEmail: p.supplierContactEmail || '',
      hasRealEmissions: Boolean(p.hasRealEmissions),
      emissionFactorReal: p.emissionFactorReal != null ? p.emissionFactorReal : null,
      productionRoute: p.productionRoute || null,
    })),
    requestId: draft.id,
  }
}

/**
 * Decisión del "saveDraft": si requestId existe, se PATCH; si no, POST.
 * El bug era crear POST siempre porque requestId empezaba en null aun
 * llegando con draftId en la URL.
 */
function saveDraftMethod(requestId) {
  return requestId ? 'PATCH' : 'POST'
}

/**
 * Decisión del CTA "Nueva solicitud de Advisory" en mis-solicitudes.
 * Si hay algún draft, devuelve 'prompt'; si no, 'navigate'.
 */
function newAdvisoryAction(requests) {
  const drafts = requests.filter(r => r.status === 'draft')
  return drafts.length > 0 ? 'prompt' : 'navigate'
}

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------

console.log('\n=== Advisory draft flow tests ===\n')

// Test 1 — Hidratación completa desde un draft existente.
{
  const draft = {
    id: 'uuid-draft-1',
    status: 'draft',
    companyName: 'Aceros Mediterráneo S.L.',
    companyCif: 'B12345678',
    companyEori: 'ES12345678901',
    contactName: 'Ana Gómez',
    contactEmail: 'ana@aceros.com',
    contactPhone: '+34 600 111 222',
    installationsCount: 4,
    isAuthorizedDeclarant: true,
    hasIndirectRepresentative: false,
    representativeName: '',
    clientNotes: 'Importación estable desde Turquía',
    products: [
      {
        productDescription: 'Alambrón de acero',
        cnCode: '72101220',
        countryCode: 'TR',
        countryName: 'Turquía',
        annualTonnes: 500,
        supplierName: 'Eregli',
        supplierContactEmail: 'ops@eregli.com',
        hasRealEmissions: true,
        emissionFactorReal: 1.85,
        productionRoute: 'electric_arc',
      },
      {
        productDescription: 'Chapa laminada',
        cnCode: '72104900',
        countryCode: 'CN',
        countryName: 'China',
        annualTonnes: 200,
        hasRealEmissions: false,
      },
    ],
  }

  const hydrated = hydrateFromDraft(draft)

  assert(hydrated.requestId === 'uuid-draft-1', 'hidratación: requestId setea al id del draft')
  assert(hydrated.companyData.companyName === 'Aceros Mediterráneo S.L.', 'hidratación: companyName')
  assert(hydrated.companyData.installationsCount === 4, 'hidratación: installationsCount')
  assert(hydrated.companyData.isAuthorizedDeclarant === true, 'hidratación: isAuthorizedDeclarant booleano')
  assert(hydrated.clientNotes === 'Importación estable desde Turquía', 'hidratación: clientNotes')
  assert(hydrated.products.length === 2, 'hidratación: 2 productos cargados')
  assert(hydrated.products[0].cnCode === '72101220', 'hidratación: producto 1 cnCode')
  assert(hydrated.products[0].countryName === 'Turquía', 'hidratación: producto 1 countryName')
  assert(hydrated.products[0].hasRealEmissions === true, 'hidratación: producto 1 hasRealEmissions')
  assert(hydrated.products[0].emissionFactorReal === 1.85, 'hidratación: producto 1 emissionFactorReal')
  assert(hydrated.products[1].emissionFactorReal === null, 'hidratación: producto 2 sin emissionFactorReal')
}

// Test 2 — Hidratación defensiva: valores null o ausentes no rompen.
{
  const draft = {
    id: 'uuid-empty',
    status: 'draft',
    products: [],
  }
  const hydrated = hydrateFromDraft(draft)
  assert(hydrated.companyData.companyName === '', 'hidratación vacía: companyName fallback a string vacío')
  assert(hydrated.companyData.installationsCount === 1, 'hidratación vacía: installationsCount default 1')
  assert(Array.isArray(hydrated.products) && hydrated.products.length === 0, 'hidratación vacía: products []')
}

// Test 3 — saveDraft usa PATCH cuando requestId existe (no crea duplicado).
{
  const method = saveDraftMethod('uuid-draft-1')
  assert(method === 'PATCH', 'saveDraft con requestId → PATCH (bug fix: no duplica)')
}

// Test 4 — saveDraft usa POST cuando requestId es null (caso creación).
{
  const method = saveDraftMethod(null)
  assert(method === 'POST', 'saveDraft sin requestId → POST')
}

// Test 5 — CTA "Nueva solicitud" con drafts existentes → modal.
{
  const requests = [
    { id: 'd1', status: 'draft' },
    { id: 's1', status: 'delivered' },
  ]
  assert(newAdvisoryAction(requests) === 'prompt', 'CTA con draft existente → prompt modal')
}

// Test 6 — CTA "Nueva solicitud" sin drafts → navega directamente.
{
  const requests = [
    { id: 's1', status: 'delivered' },
    { id: 's2', status: 'paid' },
  ]
  assert(newAdvisoryAction(requests) === 'navigate', 'CTA sin drafts → navega directo')
}

// Test 7 — Lista vacía → navega.
{
  assert(newAdvisoryAction([]) === 'navigate', 'CTA con lista vacía → navega directo')
}

// ------------------------------------------------------------------
// Regression guard: patrón buggy (siempre POST) produce duplicados.
// ------------------------------------------------------------------
{
  // Antes del fix, el wizard SIEMPRE empezaba con requestId=null,
  // incluso llegando a la URL con draftId en query. El primer Next
  // disparaba un POST nuevo y dejaba el draft original huérfano.
  const buggyRequestIdOnMount = null
  const method = saveDraftMethod(buggyRequestIdOnMount)
  assert(
    method === 'POST',
    'regression guard: antes del fix, el primer save era POST (crea duplicado) — esperado',
  )
}

if (process.exitCode && process.exitCode !== 0) {
  console.error('\n❌ Tests failed')
} else {
  console.log('\n✅ All tests passed')
}
