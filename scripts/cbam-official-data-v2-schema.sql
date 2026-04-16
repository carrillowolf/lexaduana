-- ============================================================
-- CBAM OFFICIAL DATA V2 — Schema para datos regulatorios completos
-- ============================================================
-- Ejecutar DESPUES de cbam-assessment-schema.sql
--
-- Cambios:
--   1. Añade source_version/source_date a cbam_benchmarks_official
--   2. Crea tabla cbam_default_values_official (120 países × CN × ruta)
--   3. Limpia datos anteriores de cbam_benchmarks_official (661 → 1804 filas)
-- ============================================================

-- 1. Añadir columnas de trazabilidad a benchmarks (si no existen)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cbam_benchmarks_official' AND column_name = 'source_version'
  ) THEN
    ALTER TABLE cbam_benchmarks_official ADD COLUMN source_version VARCHAR(50);
    ALTER TABLE cbam_benchmarks_official ADD COLUMN source_date DATE;
  END IF;
END $$;

-- 2. Limpiar benchmarks anteriores (se recargan completos)
TRUNCATE TABLE cbam_benchmarks_official;

-- 3. Nueva tabla: Default Values oficiales por país × CN × ruta
CREATE TABLE IF NOT EXISTS cbam_default_values_official (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(4) NOT NULL,
  country_name VARCHAR(100),
  cn_code VARCHAR(8) NOT NULL,
  description TEXT,
  sector VARCHAR(50),

  -- Emisiones desglosadas (tCO₂e/t de producto)
  direct_emissions NUMERIC(10,6),
  indirect_emissions NUMERIC(10,6),
  total_emissions NUMERIC(10,6),

  -- Valores con markup pre-calculado por la CE
  with_markup_2026 NUMERIC(10,6),
  with_markup_2027 NUMERIC(10,6),
  with_markup_2028 NUMERIC(10,6),

  -- Ruta de producción determinante del benchmark CBAM
  production_route VARCHAR(10),

  -- Trazabilidad
  regulation_ref VARCHAR(50) DEFAULT '(EU) 2025/2621',
  source_version VARCHAR(50),
  source_date DATE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas del calculator
CREATE INDEX IF NOT EXISTS idx_dv_off_country_cn
  ON cbam_default_values_official(country_code, cn_code);
CREATE INDEX IF NOT EXISTS idx_dv_off_cn
  ON cbam_default_values_official(cn_code);
CREATE INDEX IF NOT EXISTS idx_dv_off_sector
  ON cbam_default_values_official(sector);
CREATE INDEX IF NOT EXISTS idx_dv_off_country
  ON cbam_default_values_official(country_code);

-- RLS: lectura pública
ALTER TABLE cbam_default_values_official ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cbam_dv_official_public_read" ON cbam_default_values_official
  FOR SELECT USING (true);

-- Trigger updated_at
CREATE TRIGGER cbam_dv_official_updated_at BEFORE UPDATE ON cbam_default_values_official
  FOR EACH ROW EXECUTE FUNCTION update_cbam_updated_at();

-- ============================================================
-- LISTO — Ejecutar este script, luego: node scripts/seedCBAMOfficialData.js
-- ============================================================
