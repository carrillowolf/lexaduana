-- ============================================================
-- BLOQUE 3 — Lookup tables (Marzo 2026)
-- LexAduana v5.1
-- ============================================================
-- Ejecutar en Supabase SQL Editor ANTES de correr loadBlock3.js
--
-- Crea/recrea:
--   1. certificate_types     (883 EN + 883 ES = 1766)
--   2. footnote_descriptions (2640 EN + 2640 ES = 5280)
--   3. additional_codes      (3253 EN + 3253 ES = 6506)
--   4. exchange_rates        (2235)
--   5. legal_bases           (4460)
-- ============================================================

-- ============================================================
-- 1. CERTIFICATE TYPES (Box 44 codes)
-- ============================================================
DROP TABLE IF EXISTS certificate_types_old;
ALTER TABLE IF EXISTS certificate_types RENAME TO certificate_types_old;

CREATE TABLE certificate_types (
  id SERIAL PRIMARY KEY,
  certificate_code TEXT NOT NULL,
  language CHAR(2) NOT NULL DEFAULT 'EN',
  description TEXT,
  start_date DATE,
  description_start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ct_code ON certificate_types(certificate_code);
CREATE INDEX idx_ct_lang ON certificate_types(language);
CREATE UNIQUE INDEX idx_ct_code_lang ON certificate_types(certificate_code, language);

ALTER TABLE certificate_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ct_public_read" ON certificate_types FOR SELECT USING (true);

-- ============================================================
-- 2. FOOTNOTE DESCRIPTIONS
-- ============================================================
DROP TABLE IF EXISTS footnote_descriptions_old;
ALTER TABLE IF EXISTS footnote_descriptions RENAME TO footnote_descriptions_old;

CREATE TABLE footnote_descriptions (
  id SERIAL PRIMARY KEY,
  footnote_code TEXT NOT NULL,
  language CHAR(2) NOT NULL DEFAULT 'EN',
  description TEXT,
  start_date DATE,
  description_start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fd_code ON footnote_descriptions(footnote_code);
CREATE INDEX idx_fd_lang ON footnote_descriptions(language);
CREATE UNIQUE INDEX idx_fd_code_lang ON footnote_descriptions(footnote_code, language);

ALTER TABLE footnote_descriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fd_public_read" ON footnote_descriptions FOR SELECT USING (true);

-- ============================================================
-- 3. ADDITIONAL CODES DESCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS additional_codes (
  id SERIAL PRIMARY KEY,
  add_code TEXT NOT NULL,
  language CHAR(2) NOT NULL DEFAULT 'EN',
  description TEXT,
  start_date DATE,
  description_start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ac_code ON additional_codes(add_code);
CREATE INDEX IF NOT EXISTS idx_ac_lang ON additional_codes(language);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ac_code_lang ON additional_codes(add_code, language);

ALTER TABLE additional_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ac_public_read" ON additional_codes;
CREATE POLICY "ac_public_read" ON additional_codes FOR SELECT USING (true);

-- ============================================================
-- 4. EXCHANGE RATES
-- ============================================================
DROP TABLE IF EXISTS exchange_rates_old;
ALTER TABLE IF EXISTS exchange_rates RENAME TO exchange_rates_old;

CREATE TABLE exchange_rates (
  id SERIAL PRIMARY KEY,
  base_currency TEXT NOT NULL DEFAULT 'EUR',
  target_currency TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  rate NUMERIC(12,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_er_currency ON exchange_rates(target_currency);
CREATE INDEX idx_er_dates ON exchange_rates(start_date, end_date);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "er_public_read" ON exchange_rates FOR SELECT USING (true);

-- ============================================================
-- 5. LEGAL BASES
-- ============================================================
CREATE TABLE IF NOT EXISTS legal_bases (
  id SERIAL PRIMARY KEY,
  legal_base TEXT NOT NULL,
  official_journal TEXT,
  page SMALLINT,
  publication_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lb_base ON legal_bases(legal_base);

ALTER TABLE legal_bases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lb_public_read" ON legal_bases;
CREATE POLICY "lb_public_read" ON legal_bases FOR SELECT USING (true);

-- ============================================================
-- DESPUÉS de loadBlock3.js, verificar:
--
-- SELECT 'certificate_types' as tabla, count(*) FROM certificate_types
-- UNION ALL SELECT 'footnote_descriptions', count(*) FROM footnote_descriptions
-- UNION ALL SELECT 'additional_codes', count(*) FROM additional_codes
-- UNION ALL SELECT 'exchange_rates', count(*) FROM exchange_rates
-- UNION ALL SELECT 'legal_bases', count(*) FROM legal_bases;
--
-- Esperado: 1766, 5280, 6506, 2235, 4460
--
-- Si todo OK, eliminar las tablas _old:
-- DROP TABLE IF EXISTS certificate_types_old;
-- DROP TABLE IF EXISTS footnote_descriptions_old;
-- DROP TABLE IF EXISTS exchange_rates_old;
-- ============================================================
