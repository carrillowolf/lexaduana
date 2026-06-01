import { supabase } from '../supabase.js'

const DERIVED_DEFAULT_PRIORITY = 100

async function getDerivedGroupCodes() {
  const { data, error } = await supabase
    .from('origin_agreements')
    .select('derived_from_group')
    .not('derived_from_group', 'is', null)

  if (error) throw error
  return data.map((r) => r.derived_from_group)
}

async function getCountryGroups(areaCode) {
  const { data, error } = await supabase
    .from('geographical_areas_composition')
    .select('country_group')
    .eq('member_country', areaCode)
    .or('membership_end_date.is.null,membership_end_date.gte.' + new Date().toISOString().slice(0, 10))

  if (error) throw error
  return data.map((r) => r.country_group)
}

async function enrichAgreement(oa, displayName, countryNote, countryNoteEn, priority) {
  const { data: proofs, error: prErr } = await supabase
    .from('origin_agreement_proofs')
    .select('*')
    .eq('agreement_code', oa.agreement_code)
    .order('is_primary', { ascending: false })
    .order('proof_type', { ascending: true })

  if (prErr) throw prErr

  const today = new Date().toISOString().slice(0, 10)
  const proofsCurrent = []
  const proofsRetired = []
  for (const p of proofs) {
    const item = {
      proofType: p.proof_type,
      proofFormat: p.proof_format,
      thresholdEur: p.threshold_eur ? Number(p.threshold_eur) : null,
      requiresAuthorisedExporter: p.requires_authorised_exporter,
      requiresRex: p.requires_rex,
      casilla44Codes: p.casilla44_codes,
      declarationTemplateEs: p.declaration_template_es,
      declarationTemplateEn: p.declaration_template_en,
      isPrimary: p.is_primary,
      validFrom: p.valid_from,
      validTo: p.valid_to,
      noteEs: p.note_es,
      noteEn: p.note_en,
    }
    if (p.valid_to && p.valid_to < today) {
      proofsRetired.push(item)
    } else {
      proofsCurrent.push(item)
    }
  }

  return {
    title: displayName || oa.name_es,
    titleEn: oa.name_en,
    type: oa.agreement_type,
    status: oa.status,
    priority,
    drawbackAllowed: oa.drawback_allowed,
    drawbackNote: oa.drawback_note_es,
    drawbackNoteEn: oa.drawback_note_en,
    transportNote: oa.direct_transport_note_es,
    transportNoteEn: oa.direct_transport_note_en,
    cumulation: oa.cumulation_es,
    cumulationEn: oa.cumulation_en,
    rulesRef: oa.rules_of_origin_ref,
    legalBasis: oa.legal_basis,
    notes: oa.notes_es,
    notesEn: oa.notes_en,
    countryNote: countryNote || null,
    countryNoteEn: countryNoteEn || null,
    lastReviewed: oa.last_reviewed_at,
    proofsCurrent,
    proofsRetired,
  }
}

export async function getAgreementCountries() {
  const [directResult, derivedGroups] = await Promise.all([
    supabase.from('origin_country_agreements').select('country_code'),
    getDerivedGroupCodes(),
  ])

  if (directResult.error) throw directResult.error

  const directCodes = new Set(directResult.data.map((r) => r.country_code))

  let derivedCodes = new Set()
  if (derivedGroups.length > 0) {
    const today = new Date().toISOString().slice(0, 10)
    const { data: members, error: memErr } = await supabase
      .from('geographical_areas_composition')
      .select('member_country')
      .in('country_group', derivedGroups)
      .or(`membership_end_date.is.null,membership_end_date.gte.${today}`)

    if (memErr) throw memErr
    derivedCodes = new Set(members.map((r) => r.member_country))
  }

  const allCodes = [...new Set([...directCodes, ...derivedCodes])]

  const { data: ocRows, error: ocErr } = await supabase
    .from('origin_countries')
    .select('area_code, name_es, name_en, slug')
    .in('area_code', allCodes)
    .order('name_es', { ascending: true })

  if (ocErr) throw ocErr

  const ocByCode = new Map(ocRows.map((r) => [r.area_code, r]))

  const result = []
  for (const code of allCodes) {
    const oc = ocByCode.get(code)
    if (oc) {
      result.push({
        areaCode: oc.area_code,
        nameEs: oc.name_es,
        nameEn: oc.name_en,
        slug: oc.slug,
      })
    } else {
      const { data: ga } = await supabase
        .from('geographical_areas')
        .select('area_code, description')
        .eq('area_code', code)
        .eq('is_country', true)
        .is('end_date', null)
        .single()

      if (ga) {
        result.push({
          areaCode: ga.area_code,
          nameEs: ga.description,
          nameEn: ga.description,
          slug: ga.description.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        })
      }
    }
  }

  result.sort((a, b) => a.nameEs.localeCompare(b.nameEs, 'es'))
  return result
}

export async function getOriginProfile(slug) {
  const { data: oc, error: ocErr } = await supabase
    .from('origin_countries')
    .select('area_code, name_es, name_en')
    .eq('slug', slug)
    .single()

  if (ocErr || !oc) return null

  const country = {
    areaCode: oc.area_code,
    nameEs: oc.name_es,
    nameEn: oc.name_en,
    slug,
  }

  // Trade status (sanctions/suspensions)
  const today = new Date().toISOString().slice(0, 10)
  const { data: tsRows, error: tsErr } = await supabase
    .from('country_trade_status')
    .select('status_type, severity, scope_es, legal_basis, source_url')
    .eq('area_code', country.areaCode)
    .or(`valid_to.is.null,valid_to.gte.${today}`)

  if (tsErr) throw tsErr

  const tradeStatus = tsRows.map((r) => ({
    statusType: r.status_type,
    severity: r.severity,
    scopeEs: r.scope_es,
    legalBasis: r.legal_basis,
    sourceUrl: r.source_url,
  }))

  // (a) Direct agreements
  const { data: directRows, error: agErr } = await supabase
    .from('origin_country_agreements')
    .select(`
      display_name, priority, note_es, note_en,
      origin_agreements (
        agreement_code, name_es, name_en, agreement_type, status,
        cumulation_es, cumulation_en, drawback_allowed,
        drawback_note_es, drawback_note_en,
        direct_transport_note_es, direct_transport_note_en,
        rules_of_origin_ref, legal_basis,
        notes_es, notes_en, last_reviewed_at, derived_from_group
      )
    `)
    .eq('country_code', country.areaCode)
    .order('priority', { ascending: true })

  if (agErr) throw agErr

  const directCodes = new Set(directRows.map((r) => r.origin_agreements.agreement_code))

  // (b) Derived agreements via group membership
  const groups = await getCountryGroups(country.areaCode)

  let derivedAgreements = []
  if (groups.length > 0) {
    const { data: derived, error: derErr } = await supabase
      .from('origin_agreements')
      .select('agreement_code, name_es, name_en, agreement_type, status, cumulation_es, cumulation_en, drawback_allowed, drawback_note_es, drawback_note_en, direct_transport_note_es, direct_transport_note_en, rules_of_origin_ref, legal_basis, notes_es, notes_en, last_reviewed_at, derived_from_group')
      .in('derived_from_group', groups)

    if (derErr) throw derErr
    derivedAgreements = derived.filter((a) => !directCodes.has(a.agreement_code))
  }

  // Enrich both sources
  const enrichedDirect = await Promise.all(
    directRows.map((row) =>
      enrichAgreement(row.origin_agreements, row.display_name, row.note_es, row.note_en, row.priority)
    )
  )

  const enrichedDerived = await Promise.all(
    derivedAgreements.map((oa) =>
      enrichAgreement(oa, null, null, null, DERIVED_DEFAULT_PRIORITY)
    )
  )

  const allAgreements = [...enrichedDirect, ...enrichedDerived]
    .sort((a, b) => a.priority - b.priority)

  if (!allAgreements.length) return null

  const hasPreference = allAgreements.some(
    (a) => a.status === 'en_vigor' || a.status === 'aplicacion_provisional'
  )

  return {
    country,
    hasPreference,
    tradeStatus,
    agreements: allAgreements,
  }
}
