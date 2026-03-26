-- ============================================================
-- CBAM Self-Assessment — Supabase Schema
-- LexAduana — Fase 1 Assessment
-- ============================================================
-- Ejecutar en Supabase SQL Editor DESPUÉS de cbam-schema.sql
-- Estas tablas extienden el módulo CBAM con datos oficiales completos
-- del Self Assessment Tool v1.1 y Reg. (EU) 2025/2620
-- ============================================================

-- 1. CÓDIGOS CN COMPLETOS (573 registros del Self Assessment Tool)
-- Reemplaza/extiende cbam_cn_codes con información detallada de assessment
CREATE TABLE IF NOT EXISTS cbam_cn_codes_full (
  id SERIAL PRIMARY KEY,
  cn_code VARCHAR(8) NOT NULL,
  main_category VARCHAR(50) NOT NULL,
  aggregated_category VARCHAR(100) NOT NULL,
  description TEXT,
  cbam_applies BOOLEAN DEFAULT true,
  indirect_emissions BOOLEAN DEFAULT true,
  quantity_unit TEXT,
  installation_data TEXT,
  special_provisions TEXT,
  production_routes TEXT,
  production_routes_detail TEXT,
  precursors TEXT,
  extra_data_required TEXT,
  indirect_emissions_data TEXT,
  data_quality TEXT,
  carbon_price_abroad BOOLEAN DEFAULT true,
  effective_from DATE DEFAULT '2026-01-01',
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cn_code)
);

CREATE INDEX IF NOT EXISTS idx_cn_codes_full_cn ON cbam_cn_codes_full(cn_code);
CREATE INDEX IF NOT EXISTS idx_cn_codes_full_main_cat ON cbam_cn_codes_full(main_category);
CREATE INDEX IF NOT EXISTS idx_cn_codes_full_agg_cat ON cbam_cn_codes_full(aggregated_category);

ALTER TABLE cbam_cn_codes_full ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cbam_cn_codes_full_public_read" ON cbam_cn_codes_full
  FOR SELECT USING (true);

-- 2. BENCHMARKS OFICIALES (570 CN codes, 661 valores)
-- Column A = emisiones reales, Column B = valores por defecto
-- Múltiples filas por CN code cuando hay distintas rutas de producción
CREATE TABLE IF NOT EXISTS cbam_benchmarks_official (
  id SERIAL PRIMARY KEY,
  cn_code VARCHAR(8) NOT NULL,
  sector VARCHAR(50) NOT NULL,
  description TEXT,
  column_a_value NUMERIC(10,6) DEFAULT 0,
  column_a_route_indicator VARCHAR(10),
  column_b_value NUMERIC(10,6) DEFAULT 0,
  column_b_route_indicator VARCHAR(10),
  regulation_ref VARCHAR(50) DEFAULT '(EU) 2025/2620',
  effective_from DATE DEFAULT '2026-01-01',
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_benchmarks_off_cn ON cbam_benchmarks_official(cn_code);
CREATE INDEX IF NOT EXISTS idx_benchmarks_off_sector ON cbam_benchmarks_official(sector);

ALTER TABLE cbam_benchmarks_official ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cbam_benchmarks_official_public_read" ON cbam_benchmarks_official
  FOR SELECT USING (true);

-- 3. PAÍSES CBAM (246 registros)
-- Extiende cbam_excluded_countries con la lista completa
CREATE TABLE IF NOT EXISTS cbam_countries (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(4) NOT NULL UNIQUE,
  country_name VARCHAR(100) NOT NULL,
  cbam_applies BOOLEAN DEFAULT true,
  is_eu_member BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cbam_countries_code ON cbam_countries(country_code);
CREATE INDEX IF NOT EXISTS idx_cbam_countries_applies ON cbam_countries(cbam_applies);

ALTER TABLE cbam_countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cbam_countries_public_read" ON cbam_countries
  FOR SELECT USING (true);

-- Triggers para updated_at
CREATE TRIGGER cbam_cn_codes_full_updated_at BEFORE UPDATE ON cbam_cn_codes_full
  FOR EACH ROW EXECUTE FUNCTION update_cbam_updated_at();

CREATE TRIGGER cbam_benchmarks_official_updated_at BEFORE UPDATE ON cbam_benchmarks_official
  FOR EACH ROW EXECUTE FUNCTION update_cbam_updated_at();

-- ============================================================
-- LISTO — Ejecutar este script, luego: node scripts/seedCBAMAssessmentData.js
-- ============================================================
