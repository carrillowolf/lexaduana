import { supabase } from '../supabase.js'

function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function getAgreementCountries() {
  const { data: ocaRows, error: ocaErr } = await supabase
    .from('origin_country_agreements')
    .select('country_code')

  if (ocaErr) throw ocaErr

  const codes = [...new Set(ocaRows.map((r) => r.country_code))]

  const { data: geoRows, error: geoErr } = await supabase
    .from('geographical_areas')
    .select('area_code, description')
    .in('area_code', codes)
    .eq('is_country', true)
    .is('end_date', null)

  if (geoErr) throw geoErr

  return geoRows
    .map((ga) => ({
      areaCode: ga.area_code,
      name: ga.description,
      slug: slugify(ga.description),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getOriginProfile(slug) {
  const countries = await getAgreementCountries()
  const country = countries.find((c) => c.slug === slug)
  if (!country) return null

  const { data: agreements, error: agErr } = await supabase
    .from('origin_country_agreements')
    .select(`
      display_name, priority, note_es, note_en,
      origin_agreements (
        agreement_code, name_es, name_en, agreement_type, status,
        cumulation_es, cumulation_en, drawback_allowed,
        drawback_note_es, drawback_note_en,
        direct_transport_note_es, direct_transport_note_en,
        rules_of_origin_ref, legal_basis,
        notes_es, notes_en, last_reviewed_at
      )
    `)
    .eq('country_code', country.areaCode)
    .order('priority', { ascending: true })

  if (agErr) throw agErr

  const today = new Date().toISOString().slice(0, 10)
  const hasPreference = agreements.some((row) => {
    const st = row.origin_agreements.status
    return st === 'en_vigor' || st === 'aplicacion_provisional'
  })

  const enriched = await Promise.all(
    agreements.map(async (row) => {
      const oa = row.origin_agreements

      const { data: proofs, error: prErr } = await supabase
        .from('origin_agreement_proofs')
        .select('*')
        .eq('agreement_code', oa.agreement_code)
        .order('is_primary', { ascending: false })
        .order('proof_type', { ascending: true })

      if (prErr) throw prErr

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
        title: row.display_name || oa.name_es,
        titleEn: oa.name_en,
        type: oa.agreement_type,
        status: oa.status,
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
        countryNote: row.note_es,
        countryNoteEn: row.note_en,
        lastReviewed: oa.last_reviewed_at,
        proofsCurrent,
        proofsRetired,
      }
    })
  )

  return {
    country,
    hasPreference,
    agreements: enriched,
  }
}
