-- =====================================================
-- Migration: glossary tables
-- File: supabase/migrations/20260511120000_glossary.sql
-- =====================================================

-- 0. EXTENSIONS (CAMBIO: añadido unaccent para búsqueda sin tildes)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 0.1 Wrapper IMMUTABLE de unaccent (requerido por columnas GENERATED).
-- public.unaccent es STABLE por defecto porque depende de un diccionario,
-- así que envolvemos la versión 2-args en una función IMMUTABLE pura.
CREATE OR REPLACE FUNCTION public.f_unaccent(text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$$ SELECT public.unaccent('public.unaccent', $1) $$;

-- 1. ENUMS
DO $$ BEGIN
  CREATE TYPE glossary_search_volume AS ENUM ('high', 'medium', 'low');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS glossary_categories (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text NOT NULL UNIQUE,
  name_es      text NOT NULL,
  name_en      text,
  description_es text,
  description_en text,
  icon         text,
  display_order integer NOT NULL DEFAULT 100,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE glossary_categories IS 'Taxonomía del glosario. 8 categorías base.';

-- 3. TERMS
CREATE TABLE IF NOT EXISTS glossary_terms (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                     text NOT NULL UNIQUE,
  category_id              uuid NOT NULL REFERENCES glossary_categories(id) ON DELETE RESTRICT,

  term_es                  text NOT NULL,
  term_en                  text,
  acronym_for              text,

  short_definition_es      text NOT NULL CHECK (char_length(short_definition_es) <= 200),
  short_definition_en      text CHECK (char_length(short_definition_en) <= 200),
  definition_es            text NOT NULL,
  definition_en            text,
  example_es               text,
  example_en               text,

  seo_title_es             text,
  seo_title_en             text,
  seo_meta_description_es  text CHECK (char_length(seo_meta_description_es) <= 160),
  seo_meta_description_en  text CHECK (char_length(seo_meta_description_en) <= 160),

  search_volume_target     glossary_search_volume DEFAULT 'medium',
  published                boolean NOT NULL DEFAULT false,  -- CAMBIO: default false
  published_at             timestamptz,                      -- CAMBIO: null hasta que se publique
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),

  -- CAMBIO: tsvector con unaccent (configuración custom 'spanish_unaccent' la creamos abajo)
  search_vector_es         tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', public.f_unaccent(coalesce(term_es,''))), 'A') ||
    setweight(to_tsvector('spanish', public.f_unaccent(coalesce(short_definition_es,''))), 'B') ||
    setweight(to_tsvector('spanish', public.f_unaccent(coalesce(definition_es,''))), 'C')
  ) STORED,

  search_vector_en         tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(term_en,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(short_definition_en,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(definition_en,'')), 'C')
  ) STORED
);

COMMENT ON TABLE glossary_terms IS 'Términos del glosario. Definitions en Markdown (GFM). EN nullable.';
COMMENT ON COLUMN glossary_terms.slug IS 'URL slug, ej: "taric" → /glosario/taric. Inmutable una vez publicado.';
COMMENT ON COLUMN glossary_terms.published IS 'Default false: insertar → revisar → UPDATE published=true explícito.';

CREATE INDEX IF NOT EXISTS idx_glossary_terms_slug ON glossary_terms(slug);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_category ON glossary_terms(category_id);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_published ON glossary_terms(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_glossary_terms_search_es ON glossary_terms USING gin(search_vector_es);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_search_en ON glossary_terms USING gin(search_vector_en);

-- 4. RELATED (direccional)
CREATE TABLE IF NOT EXISTS glossary_term_related (
  term_id          uuid NOT NULL REFERENCES glossary_terms(id) ON DELETE CASCADE,
  related_term_id  uuid NOT NULL REFERENCES glossary_terms(id) ON DELETE CASCADE,
  display_order    integer NOT NULL DEFAULT 100,
  created_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (term_id, related_term_id),
  CHECK (term_id <> related_term_id)
);

COMMENT ON TABLE glossary_term_related IS 'Relaciones direccionales entre términos. FK garantiza que no haya enlaces rotos.';

CREATE INDEX IF NOT EXISTS idx_glossary_related_term ON glossary_term_related(term_id);

-- 5. LEGAL BASIS
CREATE TABLE IF NOT EXISTS glossary_term_legal_basis (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id       uuid NOT NULL REFERENCES glossary_terms(id) ON DELETE CASCADE,
  name_es       text NOT NULL,
  name_en       text,
  article       text,
  url           text,
  note_es       text,
  note_en       text,
  display_order integer NOT NULL DEFAULT 100,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_glossary_legal_term ON glossary_term_legal_basis(term_id);

-- 6. FAQ
CREATE TABLE IF NOT EXISTS glossary_term_faq (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id       uuid NOT NULL REFERENCES glossary_terms(id) ON DELETE CASCADE,
  question_es   text NOT NULL,
  question_en   text,
  answer_es     text NOT NULL,
  answer_en     text,
  display_order integer NOT NULL DEFAULT 100,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE glossary_term_faq IS 'FAQs por término. Se renderizan como FAQ Schema (rich snippets).';

CREATE INDEX IF NOT EXISTS idx_glossary_faq_term ON glossary_term_faq(term_id);

-- 7. INTERNAL LINKS
CREATE TABLE IF NOT EXISTS glossary_term_internal_links (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id       uuid NOT NULL REFERENCES glossary_terms(id) ON DELETE CASCADE,
  label_es      text NOT NULL,
  label_en      text,
  url           text NOT NULL,
  display_order integer NOT NULL DEFAULT 100,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (url LIKE '/%' OR url LIKE 'https://%')
);

CREATE INDEX IF NOT EXISTS idx_glossary_links_term ON glossary_term_internal_links(term_id);

-- 8. TRIGGERS
CREATE OR REPLACE FUNCTION glossary_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_glossary_terms_updated_at ON glossary_terms;
CREATE TRIGGER trg_glossary_terms_updated_at
  BEFORE UPDATE ON glossary_terms
  FOR EACH ROW EXECUTE FUNCTION glossary_set_updated_at();

DROP TRIGGER IF EXISTS trg_glossary_categories_updated_at ON glossary_categories;
CREATE TRIGGER trg_glossary_categories_updated_at
  BEFORE UPDATE ON glossary_categories
  FOR EACH ROW EXECUTE FUNCTION glossary_set_updated_at();

-- CAMBIO: trigger para auto-rellenar published_at cuando published pasa a true
CREATE OR REPLACE FUNCTION glossary_set_published_at()
RETURNS trigger AS $$
BEGIN
  IF NEW.published = true AND (OLD.published = false OR OLD.published IS NULL) AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_glossary_terms_published_at ON glossary_terms;
CREATE TRIGGER trg_glossary_terms_published_at
  BEFORE UPDATE ON glossary_terms
  FOR EACH ROW EXECUTE FUNCTION glossary_set_published_at();

-- 9. FUNCTION RPC para búsqueda full-text (CAMBIO: nueva)
CREATE OR REPLACE FUNCTION glossary_search(
  query_text text,
  locale text DEFAULT 'es',
  result_limit integer DEFAULT 20
)
RETURNS TABLE (
  slug text,
  term text,
  short_definition text,
  category_slug text,
  rank real
)
LANGUAGE sql STABLE
AS $$
  WITH q AS (
    SELECT CASE
      WHEN locale = 'en' THEN plainto_tsquery('english', query_text)
      ELSE plainto_tsquery('spanish', public.f_unaccent(query_text))
    END AS query
  )
  SELECT
    t.slug,
    CASE WHEN locale = 'en' THEN COALESCE(t.term_en, t.term_es) ELSE t.term_es END AS term,
    CASE WHEN locale = 'en' THEN COALESCE(t.short_definition_en, t.short_definition_es) ELSE t.short_definition_es END AS short_definition,
    c.slug AS category_slug,
    ts_rank(CASE WHEN locale = 'en' THEN t.search_vector_en ELSE t.search_vector_es END, q.query) AS rank
  FROM glossary_terms t
  JOIN glossary_categories c ON c.id = t.category_id
  CROSS JOIN q
  WHERE t.published = true
    AND (CASE WHEN locale = 'en' THEN t.search_vector_en ELSE t.search_vector_es END) @@ q.query
  ORDER BY rank DESC, t.term_es ASC
  LIMIT result_limit;
$$;

COMMENT ON FUNCTION glossary_search IS 'Búsqueda full-text en glosario. Locale: "es" (con unaccent) o "en". Devuelve slug, term, short_definition, category y rank.';

-- 10. RLS POLICIES
ALTER TABLE glossary_categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary_terms                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary_term_related          ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary_term_legal_basis      ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary_term_faq              ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary_term_internal_links   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "glossary_categories_select_public" ON glossary_categories;
CREATE POLICY "glossary_categories_select_public"
  ON glossary_categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "glossary_terms_select_public" ON glossary_terms;
CREATE POLICY "glossary_terms_select_public"
  ON glossary_terms FOR SELECT TO anon, authenticated
  USING (published = true);

DROP POLICY IF EXISTS "glossary_term_related_select_public" ON glossary_term_related;
CREATE POLICY "glossary_term_related_select_public"
  ON glossary_term_related FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "glossary_term_legal_basis_select_public" ON glossary_term_legal_basis;
CREATE POLICY "glossary_term_legal_basis_select_public"
  ON glossary_term_legal_basis FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "glossary_term_faq_select_public" ON glossary_term_faq;
CREATE POLICY "glossary_term_faq_select_public"
  ON glossary_term_faq FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "glossary_term_internal_links_select_public" ON glossary_term_internal_links;
CREATE POLICY "glossary_term_internal_links_select_public"
  ON glossary_term_internal_links FOR SELECT TO anon, authenticated USING (true);

-- 11. SEED de categorías base
INSERT INTO glossary_categories (slug, name_es, name_en, description_es, description_en, display_order)
VALUES
  ('clasificacion',  'Clasificación arancelaria', 'Tariff classification',
   'TARIC, HS, NC, IAV/BTI, notas explicativas.',
   'TARIC, HS, CN, BTI, explanatory notes.', 10),
  ('origen',         'Origen',                   'Origin',
   'Origen preferencial y no preferencial, EUR.1, REX, ATR, reglas de origen.',
   'Preferential and non-preferential origin, EUR.1, REX, ATR, rules of origin.', 20),
  ('valoracion',     'Valoración en aduana',     'Customs valuation',
   'CIF, FOB, valor de transacción, ajustes art. 71, métodos secundarios.',
   'CIF, FOB, transaction value, Art. 71 adjustments, secondary methods.', 30),
  ('regimenes',      'Regímenes y procedimientos','Customs procedures',
   'Importación, exportación, tránsito, perfeccionamiento, depósito, despacho centralizado.',
   'Import, export, transit, processing, warehousing, centralised clearance.', 40),
  ('tributacion',    'Tributación',              'Taxation',
   'Arancel, IVA importación, IIEE, antidumping, salvaguardia, contingentes.',
   'Tariff, import VAT, excise, anti-dumping, safeguard, quotas.', 50),
  ('documentos',     'Documentos y declaraciones','Documents and declarations',
   'DUA, H1/H7, ENS, certificados, EUR.1, ATA.',
   'SAD, H1/H7, ENS, certificates, EUR.1, ATA.', 60),
  ('operadores',     'Operadores y autorizaciones','Operators and authorisations',
   'OEA/AEO, representante aduanero, EORI, declarante registrado.',
   'AEO, customs representative, EORI, registered declarant.', 70),
  ('cumplimiento',   'Cumplimiento y normativa', 'Compliance and regulation',
   'CBAM, doble uso, CITES, ICS2, sanciones, recursos.',
   'CBAM, dual use, CITES, ICS2, sanctions, appeals.', 80)
ON CONFLICT (slug) DO NOTHING;
