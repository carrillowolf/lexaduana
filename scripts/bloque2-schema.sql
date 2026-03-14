-- ============================================================
-- BLOQUE 2 — Recarga de datos core (Marzo 2026)
-- LexAduana v5.1
-- ============================================================
-- Ejecutar en Supabase SQL Editor ANTES de correr loadBlock2.js
--
-- Prepara:
--   1. taric_measures — limpieza para recarga
--   2. measure_conditions — limpieza para recarga
--   3. measure_exclusions — limpieza para recarga
--   4. measure_footnotes — ya existe pero vacía (0 filas)
-- ============================================================

-- ============================================================
-- 1. TARIC MEASURES — Preparar para recarga
-- Actualmente: 141.291 filas (datos viejos de Diciembre + posibles duplicados)
-- Nuevo: 136.009 filas (Marzo 2026, solo Import)
-- ============================================================

-- Backup por seguridad
CREATE TABLE IF NOT EXISTS taric_measures_backup_mar26 AS
SELECT * FROM taric_measures;

-- NOTA: No hacer DROP ni TRUNCATE aquí — lo hace el script.
-- El script hace DELETE + INSERT en batches.

-- Añadir UNIQUE constraint (tras la recarga limpia)
-- Se ejecutará DESPUÉS de cargar, no antes:
-- ALTER TABLE taric_measures ADD CONSTRAINT uq_measure_key
-- UNIQUE (goods_code, COALESCE(add_code,''), COALESCE(order_no,''), start_date, origin_code, measure_type_code);

-- ============================================================
-- 2. MEASURE CONDITIONS — Preparar para recarga
-- Actualmente: 30.968 filas
-- Nuevo: 29.229 filas (Marzo 2026)
-- ============================================================

CREATE TABLE IF NOT EXISTS measure_conditions_backup_mar26 AS
SELECT * FROM measure_conditions;

-- Mejorar índice para JOINs eficientes
DROP INDEX IF EXISTS idx_mc_measure;
CREATE INDEX IF NOT EXISTS idx_mc_measure_full
ON measure_conditions (goods_code, origin_code, measure_type_code, start_date);

-- ============================================================
-- 3. MEASURE EXCLUSIONS — Preparar para recarga
-- Actualmente: 35.510 filas (mix import+export)
-- Nuevo: ~28.975 filas (solo Import)
-- ============================================================

CREATE TABLE IF NOT EXISTS measure_exclusions_backup_mar26 AS
SELECT * FROM measure_exclusions;

-- Añadir índice compuesto para JOINs
CREATE INDEX IF NOT EXISTS idx_me_measure_full
ON measure_exclusions (goods_code, origin_code, measure_type_code, start_date);

-- Índice para búsqueda por país excluido
CREATE INDEX IF NOT EXISTS idx_me_excluded_country
ON measure_exclusions (excluded_country_code);

-- ============================================================
-- 4. MEASURE FOOTNOTES — Ya existe, está vacía
-- Nuevo: 121.938 filas
-- ============================================================

-- Verificar que la tabla existe y tiene la estructura correcta
-- Si no existe, crearla:
CREATE TABLE IF NOT EXISTS measure_footnotes (
  id SERIAL PRIMARY KEY,
  goods_code TEXT NOT NULL,
  add_code TEXT,
  order_no TEXT,
  origin_code TEXT,
  start_date DATE,
  end_date DATE,
  measure_type_code SMALLINT,
  origin_name TEXT,
  measure_type_name TEXT,
  footnote_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mf_goods_code ON measure_footnotes(goods_code);
CREATE INDEX IF NOT EXISTS idx_mf_footnote ON measure_footnotes(footnote_code);
CREATE INDEX IF NOT EXISTS idx_mf_measure_full
ON measure_footnotes (goods_code, origin_code, measure_type_code, start_date);

ALTER TABLE measure_footnotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mf_public_read" ON measure_footnotes;
CREATE POLICY "mf_public_read" ON measure_footnotes FOR SELECT USING (true);

-- ============================================================
-- DESPUÉS de loadBlock2.js, verificar:
--
-- SELECT 'taric_measures' as tabla, count(*) FROM taric_measures
-- UNION ALL SELECT 'measure_conditions', count(*) FROM measure_conditions
-- UNION ALL SELECT 'measure_exclusions', count(*) FROM measure_exclusions
-- UNION ALL SELECT 'measure_footnotes', count(*) FROM measure_footnotes;
--
-- Esperado: 136009, 29229, ~28975, 121938
--
-- Si todo OK, se pueden borrar los backups:
-- DROP TABLE IF EXISTS taric_measures_backup_mar26;
-- DROP TABLE IF EXISTS measure_conditions_backup_mar26;
-- DROP TABLE IF EXISTS measure_exclusions_backup_mar26;
-- ============================================================
