-- ══════════════════════════════════════════════════════════════
-- SISTEMA DE CAMBIOS TARIC — Schema v1.0
-- Detecta y almacena diferencias entre actualizaciones mensuales
--
-- Ejecutar en Supabase SQL Editor ANTES de usar detectChanges.js
-- ══════════════════════════════════════════════════════════════

-- Tabla principal: registro de cada ejecución de actualización
CREATE TABLE IF NOT EXISTS taric_update_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_date TIMESTAMPTZ DEFAULT NOW(),
  data_month TEXT NOT NULL,              -- 'YYYY-MM' del periodo de datos (ej: '2026-05')
  source_description TEXT,               -- 'CIRCABC EUR-Lex Mayo 2026'
  status TEXT DEFAULT 'pending',         -- pending | running | completed | failed
  total_changes INTEGER DEFAULT 0,
  changes_by_type JSONB DEFAULT '{}',    -- {"added": 45, "removed": 12, "modified": 8}
  tables_processed TEXT[] DEFAULT '{}',  -- {'taric_measures', 'measure_conditions', ...}
  error_log TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de cambios detectados
CREATE TABLE IF NOT EXISTS taric_changes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  run_id UUID REFERENCES taric_update_runs(id) ON DELETE CASCADE,
  data_month TEXT NOT NULL,              -- 'YYYY-MM' para consultas rápidas
  table_name TEXT NOT NULL,              -- 'taric_measures', 'measure_conditions', etc.
  change_type TEXT NOT NULL,             -- 'added' | 'removed' | 'modified'
  goods_code TEXT NOT NULL,              -- Código de mercancía 10 dígitos
  goods_code_short TEXT,                 -- Código corto HS6 (6 dígitos)
  chapter TEXT,                          -- Capítulo (2 dígitos, ej: '72')
  measure_type_code TEXT,                -- Tipo de medida (ej: '103', '142', '775')
  origin_code TEXT,                      -- Código origen (ej: '1011', 'CN', 'TR')

  -- Campos de cambio
  field_changed TEXT,                    -- Nombre del campo que cambió (NULL si added/removed)
  old_value TEXT,                        -- Valor anterior (NULL si added)
  new_value TEXT,                        -- Valor nuevo (NULL si removed)

  -- Datos completos de la medida para contexto
  measure_data JSONB,                    -- Fila completa de la medida nueva/modificada

  -- Metadatos útiles para la UI
  duty_expression TEXT,                  -- Expresión del arancel (ej: '4.70 %')
  start_date DATE,                       -- Fecha inicio vigencia de la medida
  end_date DATE,                         -- Fecha fin vigencia (NULL = indefinida)

  -- Severidad del cambio para priorización en UI
  -- critical: cambio de duty %, nueva medida anti-dumping/CBAM
  -- warning:  nueva condición/certificado, cambio de fecha, exclusión
  -- info:     cambio de footnote, cambio de base legal
  severity TEXT DEFAULT 'info',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- ÍNDICES para consultas frecuentes
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_changes_month ON taric_changes(data_month);
CREATE INDEX IF NOT EXISTS idx_changes_goods ON taric_changes(goods_code);
CREATE INDEX IF NOT EXISTS idx_changes_goods_short ON taric_changes(goods_code_short);
CREATE INDEX IF NOT EXISTS idx_changes_chapter ON taric_changes(chapter);
CREATE INDEX IF NOT EXISTS idx_changes_type ON taric_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_changes_severity ON taric_changes(severity);
CREATE INDEX IF NOT EXISTS idx_changes_table ON taric_changes(table_name);
CREATE INDEX IF NOT EXISTS idx_changes_run ON taric_changes(run_id);
CREATE INDEX IF NOT EXISTS idx_changes_measure_type ON taric_changes(measure_type_code);

-- Índice compuesto para la query más común (página /cambios)
CREATE INDEX IF NOT EXISTS idx_changes_month_severity ON taric_changes(data_month, severity);

-- ══════════════════════════════════════════════════════════════
-- VISTAS — simplificadas, sin LATERAL ni jsonb_object_agg complejo
-- ══════════════════════════════════════════════════════════════

-- Vista resumen por mes (para la página /cambios)
CREATE OR REPLACE VIEW taric_changes_summary AS
SELECT
  data_month,
  COUNT(*) AS total_changes,
  COUNT(*) FILTER (WHERE change_type = 'added') AS added,
  COUNT(*) FILTER (WHERE change_type = 'removed') AS removed,
  COUNT(*) FILTER (WHERE change_type = 'modified') AS modified,
  COUNT(*) FILTER (WHERE severity = 'critical') AS critical_changes,
  COUNT(*) FILTER (WHERE severity = 'warning') AS warning_changes,
  COUNT(DISTINCT goods_code) AS affected_codes,
  COUNT(DISTINCT chapter) AS affected_chapters
FROM taric_changes
GROUP BY data_month
ORDER BY data_month DESC;

-- Vista detalle por capítulo y mes
CREATE OR REPLACE VIEW taric_changes_by_chapter AS
SELECT
  data_month,
  chapter,
  COUNT(*) AS total_changes,
  COUNT(*) FILTER (WHERE change_type = 'added') AS added,
  COUNT(*) FILTER (WHERE change_type = 'removed') AS removed,
  COUNT(*) FILTER (WHERE change_type = 'modified') AS modified,
  COUNT(*) FILTER (WHERE severity = 'critical') AS critical_changes,
  COUNT(DISTINCT goods_code) AS affected_codes,
  array_agg(DISTINCT measure_type_code) FILTER (WHERE measure_type_code IS NOT NULL) AS measure_types_affected
FROM taric_changes
GROUP BY data_month, chapter
ORDER BY data_month DESC, total_changes DESC;

-- ══════════════════════════════════════════════════════════════
-- RLS — lectura pública, escritura solo service_role
-- ══════════════════════════════════════════════════════════════

ALTER TABLE taric_update_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE taric_changes ENABLE ROW LEVEL SECURITY;

-- Lectura pública (los cambios TARIC son datos públicos de EUR-Lex)
CREATE POLICY "taric_changes_public_read" ON taric_changes
  FOR SELECT USING (true);

CREATE POLICY "taric_update_runs_public_read" ON taric_update_runs
  FOR SELECT USING (true);

-- Escritura solo con service_role (scripts de carga)
CREATE POLICY "taric_changes_service_insert" ON taric_changes
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "taric_update_runs_service_insert" ON taric_update_runs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "taric_update_runs_service_update" ON taric_update_runs
  FOR UPDATE USING (auth.role() = 'service_role');

-- ══════════════════════════════════════════════════════════════
-- VERIFICACIÓN — ejecutar después para confirmar
-- ══════════════════════════════════════════════════════════════
-- SELECT tablename FROM pg_tables WHERE tablename IN ('taric_update_runs', 'taric_changes');
-- SELECT viewname FROM pg_views WHERE viewname IN ('taric_changes_summary', 'taric_changes_by_chapter');
