-- ============================================================
-- CBAM Module - Supabase Schema
-- LexAduana v5.0
-- ============================================================
-- Ejecutar en Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- Este script crea todas las tablas necesarias para el módulo CBAM
-- con Row Level Security configurado.
-- ============================================================

-- 1. SECTORES CBAM
CREATE TABLE IF NOT EXISTS cbam_sectors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  gases TEXT[] NOT NULL,
  emissions_type TEXT NOT NULL,
  description TEXT,
  de_minimis_applies BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cbam_sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cbam_sectors_public_read" ON cbam_sectors FOR SELECT USING (true);

-- 2. CÓDIGOS CN AFECTADOS POR CBAM
CREATE TABLE IF NOT EXISTS cbam_cn_codes (
  id SERIAL PRIMARY KEY,
  cn_code TEXT NOT NULL,
  sector_id TEXT NOT NULL REFERENCES cbam_sectors(id),
  description TEXT NOT NULL,
  gas TEXT NOT NULL,
  is_chapter BOOLEAN DEFAULT false,
  excluded_codes TEXT[],
  is_downstream BOOLEAN DEFAULT false,
  effective_from DATE DEFAULT '2026-01-01',
  effective_to DATE,
  regulation_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cn_code, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_cbam_cn_codes_code ON cbam_cn_codes(cn_code);
CREATE INDEX IF NOT EXISTS idx_cbam_cn_codes_sector ON cbam_cn_codes(sector_id);
CREATE INDEX IF NOT EXISTS idx_cbam_cn_codes_active ON cbam_cn_codes(effective_from, effective_to);

ALTER TABLE cbam_cn_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cbam_cn_codes_public_read" ON cbam_cn_codes FOR SELECT USING (true);

-- 3. FACTORES DE EMISIÓN POR DEFECTO
CREATE TABLE IF NOT EXISTS cbam_emission_factors (
  id SERIAL PRIMARY KEY,
  sector_id TEXT NOT NULL REFERENCES cbam_sectors(id),
  product_key TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_name_en TEXT,
  factor_value NUMERIC(10,4) NOT NULL,
  unit TEXT DEFAULT 'tCO2e/t',
  applicable_cn_codes TEXT[],
  regulation_ref TEXT,
  effective_from DATE NOT NULL DEFAULT '2026-01-01',
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cbam_ef_sector ON cbam_emission_factors(sector_id);

ALTER TABLE cbam_emission_factors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cbam_emission_factors_public_read" ON cbam_emission_factors FOR SELECT USING (true);

-- 4. BENCHMARKS UE (TOP 10% EFICIENCIA)
CREATE TABLE IF NOT EXISTS cbam_benchmarks (
  id SERIAL PRIMARY KEY,
  sector_id TEXT NOT NULL REFERENCES cbam_sectors(id),
  benchmark_key TEXT NOT NULL,
  description TEXT NOT NULL,
  value NUMERIC(10,4) NOT NULL,
  unit TEXT DEFAULT 'tCO2e/t',
  is_default BOOLEAN DEFAULT false,
  year_from INTEGER NOT NULL DEFAULT 2026,
  year_to INTEGER,
  regulation_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cbam_benchmarks_sector ON cbam_benchmarks(sector_id);

ALTER TABLE cbam_benchmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cbam_benchmarks_public_read" ON cbam_benchmarks FOR SELECT USING (true);

-- 5. PAÍSES EXCLUIDOS DEL CBAM
CREATE TABLE IF NOT EXISTS cbam_excluded_countries (
  id SERIAL PRIMARY KEY,
  country_code TEXT NOT NULL UNIQUE,
  country_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  exclusion_type TEXT DEFAULT 'ets',
  effective_from DATE DEFAULT '2026-01-01',
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cbam_excluded_countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cbam_excluded_countries_public_read" ON cbam_excluded_countries FOR SELECT USING (true);

-- 6. CERTIFICADOS CBAM
CREATE TABLE IF NOT EXISTS cbam_certificates (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  is_required BOOLEAN DEFAULT false,
  condition_code TEXT,
  applies_to_sectors TEXT[],
  not_applies_to_sectors TEXT[],
  valid_until DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cbam_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cbam_certificates_public_read" ON cbam_certificates FOR SELECT USING (true);

-- 7. TIMELINE CBAM (FECHAS CLAVE)
CREATE TABLE IF NOT EXISTS cbam_timeline (
  id SERIAL PRIMARY KEY,
  event_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_type TEXT NOT NULL,
  quarter_label TEXT,
  icon TEXT,
  is_new BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cbam_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cbam_timeline_public_read" ON cbam_timeline FOR SELECT USING (true);

-- 8. PRECIOS EU ETS
CREATE TABLE IF NOT EXISTS cbam_ets_prices (
  id SERIAL PRIMARY KEY,
  price NUMERIC(10,2) NOT NULL,
  price_date DATE NOT NULL,
  price_type TEXT DEFAULT 'closing',
  source TEXT NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(price_date, price_type, source)
);

CREATE INDEX IF NOT EXISTS idx_cbam_ets_current ON cbam_ets_prices(is_current) WHERE is_current = true;

ALTER TABLE cbam_ets_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cbam_ets_prices_public_read" ON cbam_ets_prices FOR SELECT USING (true);

-- 9. MARKUP SOBRE VALORES POR DEFECTO
CREATE TABLE IF NOT EXISTS cbam_default_value_markup (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  markup_pct NUMERIC(5,2) NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  regulation_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cbam_default_value_markup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cbam_default_value_markup_public_read" ON cbam_default_value_markup FOR SELECT USING (true);

-- 10. REFERENCIAS A REGLAMENTOS (TRAZABILIDAD)
CREATE TABLE IF NOT EXISTS cbam_regulations (
  id SERIAL PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  regulation_type TEXT,
  status TEXT DEFAULT 'in_force',
  publication_date DATE,
  effective_date DATE,
  summary TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cbam_regulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cbam_regulations_public_read" ON cbam_regulations FOR SELECT USING (true);

-- 11. CONFIGURACIÓN GENERAL CBAM
CREATE TABLE IF NOT EXISTS cbam_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE cbam_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cbam_config_public_read" ON cbam_config FOR SELECT USING (true);

-- 12. CÁLCULOS CBAM DE USUARIOS
CREATE TABLE IF NOT EXISTS cbam_user_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  sector_id TEXT REFERENCES cbam_sectors(id),
  product_key TEXT,
  cn_code TEXT,
  country_code TEXT,
  tonnes NUMERIC(12,2) NOT NULL,
  emission_factor NUMERIC(10,4) NOT NULL,
  emission_source TEXT DEFAULT 'default',
  benchmark_value NUMERIC(10,4),
  co2_price NUMERIC(10,2) NOT NULL,
  total_emissions NUMERIC(12,4),
  total_cost NUMERIC(12,2),
  markup_applied NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cbam_calc_user ON cbam_user_calculations(user_id);

ALTER TABLE cbam_user_calculations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cbam_user_calculations_own_data" ON cbam_user_calculations
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FUNCIÓN: Trigger para updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_cbam_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas con updated_at
CREATE TRIGGER cbam_sectors_updated_at BEFORE UPDATE ON cbam_sectors
  FOR EACH ROW EXECUTE FUNCTION update_cbam_updated_at();

CREATE TRIGGER cbam_cn_codes_updated_at BEFORE UPDATE ON cbam_cn_codes
  FOR EACH ROW EXECUTE FUNCTION update_cbam_updated_at();

CREATE TRIGGER cbam_emission_factors_updated_at BEFORE UPDATE ON cbam_emission_factors
  FOR EACH ROW EXECUTE FUNCTION update_cbam_updated_at();

CREATE TRIGGER cbam_benchmarks_updated_at BEFORE UPDATE ON cbam_benchmarks
  FOR EACH ROW EXECUTE FUNCTION update_cbam_updated_at();

CREATE TRIGGER cbam_timeline_updated_at BEFORE UPDATE ON cbam_timeline
  FOR EACH ROW EXECUTE FUNCTION update_cbam_updated_at();

-- ============================================================
-- LISTO - Ejecutar este script completo en Supabase SQL Editor
-- Después ejecutar: node scripts/seedCBAMData.js
-- ============================================================
