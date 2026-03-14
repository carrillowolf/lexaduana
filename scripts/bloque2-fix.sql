-- ============================================================
-- BLOQUE 2 FIX — Corrige constraints antes de re-cargar
-- ============================================================

-- 1. taric_measures: origin_name y duty_expression desbordan varchar(200)
--    Origin: max 368 chars, Duty: max 609 chars
ALTER TABLE taric_measures ALTER COLUMN origin_name TYPE TEXT;
ALTER TABLE taric_measures ALTER COLUMN duty_expression TYPE TEXT;
ALTER TABLE taric_measures ALTER COLUMN measure_type_name TYPE TEXT;
ALTER TABLE taric_measures ALTER COLUMN legal_base TYPE TEXT;
ALTER TABLE taric_measures ALTER COLUMN duty_specific TYPE TEXT;

-- 2. measure_conditions: permitir start_date NULL (por si acaso)
ALTER TABLE measure_conditions ALTER COLUMN start_date DROP NOT NULL;

-- 3. measure_footnotes: permitir start_date NULL (por si acaso)
ALTER TABLE measure_footnotes ALTER COLUMN start_date DROP NOT NULL;

-- 4. measure_exclusions: ampliar campos text por seguridad
ALTER TABLE measure_exclusions ALTER COLUMN origin_name TYPE TEXT;
ALTER TABLE measure_exclusions ALTER COLUMN measure_type_name TYPE TEXT;
ALTER TABLE measure_exclusions ALTER COLUMN excluded_country_name TYPE TEXT;

-- Verificar que los cambios se aplicaron
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('taric_measures', 'measure_conditions', 'measure_footnotes')
  AND column_name IN ('origin_name', 'duty_expression', 'start_date', 'duty_specific', 'legal_base')
ORDER BY table_name, column_name;
