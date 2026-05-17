-- =====================================================
-- Añade flag seo_ready a glossary_terms
-- - published: visible en la app
-- - seo_ready: indexable por Google (Schema.org + sin noindex)
-- Los 24 términos seed actuales arrancan con seo_ready=false
-- hasta que se reescriban con la plantilla completa en Fase 3.
-- =====================================================

ALTER TABLE glossary_terms
  ADD COLUMN IF NOT EXISTS seo_ready boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN glossary_terms.seo_ready IS
  'Si false, la página /glosario/[slug] emite noindex,follow. '
  'Se activa manualmente al reescribir el término con definición completa.';

CREATE INDEX IF NOT EXISTS idx_glossary_terms_seo_ready
  ON glossary_terms(seo_ready) WHERE seo_ready = true;
