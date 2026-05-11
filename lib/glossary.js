import { supabase } from './supabase.js'

/**
 * @typedef {Object} GlossaryCategoryEmbed
 * @property {string} slug
 * @property {string} name_es
 * @property {string|null} name_en
 *
 * @typedef {Object} GlossaryTermSummary
 * @property {string} id
 * @property {string} slug
 * @property {string} term_es
 * @property {string|null} term_en
 * @property {string|null} acronym_for
 * @property {string} short_definition_es
 * @property {string|null} short_definition_en
 * @property {GlossaryCategoryEmbed} category
 *
 * @typedef {Object} GlossaryTermFull
 * @property {string} id
 * @property {string} slug
 * @property {string} term_es
 * @property {string|null} term_en
 * @property {string|null} acronym_for
 * @property {string} short_definition_es
 * @property {string|null} short_definition_en
 * @property {string} definition_es
 * @property {string|null} definition_en
 * @property {string|null} example_es
 * @property {string|null} example_en
 * @property {string|null} seo_title_es
 * @property {string|null} seo_title_en
 * @property {string|null} seo_meta_description_es
 * @property {string|null} seo_meta_description_en
 * @property {string} updated_at
 * @property {string|null} published_at
 * @property {GlossaryCategoryEmbed} category
 * @property {Array<{related_term: GlossaryTermSummary}>} related
 * @property {Array<Object>} legal_basis
 * @property {Array<Object>} faqs
 * @property {Array<Object>} internal_links
 *
 * @typedef {Object} GlossarySearchHit
 * @property {string} slug
 * @property {string} term
 * @property {string} short_definition
 * @property {string} category_slug
 * @property {number} rank
 */

const TERM_SUMMARY_COLUMNS = `
  id, slug, term_es, term_en, acronym_for,
  short_definition_es, short_definition_en,
  category:glossary_categories(slug, name_es, name_en)
`

/**
 * Lista todos los términos publicados, ordenados por term_es.
 * Para el índice del glosario (Server Component).
 * @returns {Promise<GlossaryTermSummary[]>}
 */
export async function listGlossaryTerms() {
  const { data, error } = await supabase
    .from('glossary_terms')
    .select(TERM_SUMMARY_COLUMNS)
    .eq('published', true)
    .order('term_es', { ascending: true })

  if (error) throw new Error(`listGlossaryTerms: ${error.message}`)
  return data || []
}

/**
 * Devuelve un término completo por slug con relaciones, base legal,
 * FAQ e internal links. Para la página de detalle `/glosario/[slug]`.
 * @param {string} slug
 * @returns {Promise<GlossaryTermFull|null>}
 */
export async function getGlossaryTermBySlug(slug) {
  const { data, error } = await supabase
    .from('glossary_terms')
    .select(`
      id, slug, term_es, term_en, acronym_for,
      short_definition_es, short_definition_en,
      definition_es, definition_en,
      example_es, example_en,
      seo_title_es, seo_title_en,
      seo_meta_description_es, seo_meta_description_en,
      updated_at, published_at,
      category:glossary_categories(slug, name_es, name_en),
      related:glossary_term_related!glossary_term_related_term_id_fkey(
        display_order,
        related_term:glossary_terms!glossary_term_related_related_term_id_fkey(
          ${TERM_SUMMARY_COLUMNS}
        )
      ),
      legal_basis:glossary_term_legal_basis(*),
      faqs:glossary_term_faq(*),
      internal_links:glossary_term_internal_links(*)
    `)
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (error) throw new Error(`getGlossaryTermBySlug(${slug}): ${error.message}`)
  return data
}

/**
 * Devuelve todos los slugs publicados (para `generateStaticParams`).
 * @returns {Promise<Array<{slug: string, updated_at: string}>>}
 */
export async function listGlossarySlugs() {
  const { data, error } = await supabase
    .from('glossary_terms')
    .select('slug, updated_at')
    .eq('published', true)

  if (error) throw new Error(`listGlossarySlugs: ${error.message}`)
  return data || []
}

/**
 * Búsqueda full-text vía RPC. Locale 'es' usa unaccent.
 * @param {string} query
 * @param {'es'|'en'} [locale='es']
 * @param {number} [limit=20]
 * @returns {Promise<GlossarySearchHit[]>}
 */
export async function searchGlossaryTerms(query, locale = 'es', limit = 20) {
  if (!query || query.trim().length < 2) return []

  const { data, error } = await supabase.rpc('glossary_search', {
    query_text: query.trim(),
    locale,
    result_limit: limit
  })

  if (error) throw new Error(`searchGlossaryTerms: ${error.message}`)
  return data || []
}

/**
 * Lista de categorías ordenadas por `display_order`. Para sidebar.
 * @returns {Promise<Array<{id: string, slug: string, name_es: string, name_en: string|null, description_es: string|null, description_en: string|null, icon: string|null, display_order: number}>>}
 */
export async function listGlossaryCategories() {
  const { data, error } = await supabase
    .from('glossary_categories')
    .select('*')
    .order('display_order')

  if (error) throw new Error(`listGlossaryCategories: ${error.message}`)
  return data || []
}
