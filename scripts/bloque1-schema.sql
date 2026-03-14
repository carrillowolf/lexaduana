-- ============================================================
-- BLOQUE 1 — Tablas nuevas + datos maestros
-- LexAduana v5.1 — Marzo 2026
-- ============================================================
-- Ejecutar en Supabase SQL Editor ANTES de correr loadBlock1.js
--
-- Crea:
--   1. geographical_areas_composition (CRÍTICA)
--   2. geographical_areas (ampliación de countries)
--   3. Recrea descriptions con schema mejorado
--   4. Amplía measure_types a 78 tipos
--   5. declarable_codes (nueva)
-- ============================================================

-- ============================================================
-- 1. GEOGRAPHICAL AREAS COMPOSITION
-- Resuelve: ¿a qué grupos pertenece cada país?
-- Sin esta tabla, la calculadora NO puede resolver que
-- origin_code='2005' incluye a 'CN', 'KE', etc.
-- ============================================================
CREATE TABLE IF NOT EXISTS geographical_areas_composition (
  id SERIAL PRIMARY KEY,
  country_group TEXT NOT NULL,           -- Código del grupo (ej: '1011', '2005')
  group_abbrev TEXT,                     -- Abreviatura (ej: 'ERGA OMNES')
  group_description TEXT,                -- Descripción completa
  member_country TEXT NOT NULL,          -- Código ISO del país miembro (ej: 'CN')
  member_abbrev TEXT,                    -- Abreviatura del miembro
  member_description TEXT,               -- Nombre del país miembro
  membership_start_date DATE,            -- Desde cuándo es miembro
  membership_end_date DATE,              -- Hasta cuándo (NULL = vigente)
  group_start_date DATE,                 -- Fecha inicio del grupo
  group_end_date DATE,                   -- Fecha fin del grupo (NULL = vigente)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para resolución rápida de grupos
CREATE INDEX IF NOT EXISTS idx_gac_member ON geographical_areas_composition(member_country);
CREATE INDEX IF NOT EXISTS idx_gac_group ON geographical_areas_composition(country_group);
CREATE INDEX IF NOT EXISTS idx_gac_member_group ON geographical_areas_composition(member_country, country_group);
CREATE INDEX IF NOT EXISTS idx_gac_membership_dates ON geographical_areas_composition(membership_start_date, membership_end_date);

-- RLS: lectura pública
ALTER TABLE geographical_areas_composition ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gac_public_read" ON geographical_areas_composition FOR SELECT USING (true);

-- ============================================================
-- 2. GEOGRAPHICAL AREAS (descripción de todos los orígenes)
-- Reemplaza/amplía la tabla countries (62 → 311 entradas)
-- Incluye tanto países ISO como grupos numéricos
-- ============================================================
CREATE TABLE IF NOT EXISTS geographical_areas (
  id SERIAL PRIMARY KEY,
  area_code TEXT NOT NULL UNIQUE,        -- '1011', 'CN', 'US', '2005', etc.
  abbrev TEXT,                           -- 'ERGA OMNES', 'CN', etc.
  description TEXT NOT NULL,             -- Nombre completo
  start_date DATE,
  description_start_date DATE,
  end_date DATE,
  is_country BOOLEAN DEFAULT false,      -- true si es país ISO, false si es grupo
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ga_code ON geographical_areas(area_code);
CREATE INDEX IF NOT EXISTS idx_ga_is_country ON geographical_areas(is_country);

ALTER TABLE geographical_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ga_public_read" ON geographical_areas FOR SELECT USING (true);

-- ============================================================
-- 3. DESCRIPTIONS — Recrear con schema mejorado
-- Pasa de 6.775 a 25.691 filas con campos de jerarquía
-- ============================================================

-- Backup de la tabla actual por si acaso
-- CREATE TABLE IF NOT EXISTS descriptions_backup_pre_bloque1 AS SELECT * FROM descriptions;

-- Recrear con nuevo schema
DROP TABLE IF EXISTS descriptions_new;
CREATE TABLE descriptions_new (
  id SERIAL PRIMARY KEY,
  goods_code TEXT NOT NULL,              -- 10 dígitos (para JOINs con taric_measures)
  goods_code_full TEXT,                  -- 13 chars original (ej: '0101210000 80')
  description TEXT NOT NULL,
  hier_pos SMALLINT,                     -- 2=capítulo, 4=partida, 6=subpartida, 8, 10=línea
  indent TEXT,                           -- Guiones de indentación ('- ', '-- ', etc.)
  start_date DATE,
  end_date DATE,
  description_start_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_desc_new_goods_code ON descriptions_new(goods_code);
CREATE INDEX IF NOT EXISTS idx_desc_new_hier ON descriptions_new(hier_pos);
CREATE UNIQUE INDEX IF NOT EXISTS idx_desc_new_unique ON descriptions_new(goods_code, goods_code_full);

ALTER TABLE descriptions_new ENABLE ROW LEVEL SECURITY;
CREATE POLICY "desc_new_public_read" ON descriptions_new FOR SELECT USING (true);

-- ============================================================
-- 4. MEASURE TYPES — Ampliar a 78 tipos
-- Mantiene los campos extra que ya tenía (affects_duty, etc.)
-- ============================================================

-- Backup
-- CREATE TABLE IF NOT EXISTS measure_types_backup_pre_bloque1 AS SELECT * FROM measure_types;

-- Recrear con todos los tipos
DROP TABLE IF EXISTS measure_types_new;
CREATE TABLE measure_types_new (
  id SERIAL PRIMARY KEY,
  type_code SMALLINT NOT NULL UNIQUE,    -- 103, 142, 552, etc.
  type_name TEXT NOT NULL,               -- Nombre en inglés del Excel
  type_name_es TEXT,                     -- Nombre en español (se añade después)
  category TEXT,                         -- 'duty', 'preference', 'quota', 'antidumping', 'control', 'prohibition', 'suspension', 'supplementary', 'safeguard', 'cbam', 'other'
  affects_duty BOOLEAN DEFAULT false,    -- ¿Afecta al cálculo del arancel?
  icon TEXT,                             -- Emoji/icono para la UI
  priority SMALLINT DEFAULT 99,          -- Orden de prioridad en la UI
  measure_count INTEGER DEFAULT 0,       -- Cuántas medidas hay de este tipo en taric_measures
  is_import BOOLEAN DEFAULT true,        -- ¿Es tipo de importación?
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mt_new_code ON measure_types_new(type_code);
CREATE INDEX IF NOT EXISTS idx_mt_new_category ON measure_types_new(category);

ALTER TABLE measure_types_new ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mt_new_public_read" ON measure_types_new FOR SELECT USING (true);

-- ============================================================
-- 5. DECLARABLE CODES — Validación de códigos
-- Permite verificar si un código es declarable (IS_LEAF=1)
-- antes de calcular aranceles
-- ============================================================
CREATE TABLE IF NOT EXISTS declarable_codes (
  id SERIAL PRIMARY KEY,
  goods_code TEXT NOT NULL,              -- 10 dígitos
  goods_code_full TEXT,                  -- 13 chars original
  is_leaf BOOLEAN NOT NULL DEFAULT false,-- true = código declarable
  start_date DATE,
  declaration_start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dc_goods_code ON declarable_codes(goods_code);
CREATE INDEX IF NOT EXISTS idx_dc_is_leaf ON declarable_codes(is_leaf) WHERE is_leaf = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_dc_unique ON declarable_codes(goods_code, goods_code_full);

ALTER TABLE declarable_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dc_public_read" ON declarable_codes FOR SELECT USING (true);

-- ============================================================
-- NOTA: Después de cargar datos con loadBlock1.js:
--
-- 1. Verificar conteos:
--    SELECT 'geographical_areas_composition' as tabla, count(*) FROM geographical_areas_composition
--    UNION ALL SELECT 'geographical_areas', count(*) FROM geographical_areas
--    UNION ALL SELECT 'descriptions_new', count(*) FROM descriptions_new
--    UNION ALL SELECT 'measure_types_new', count(*) FROM measure_types_new
--    UNION ALL SELECT 'declarable_codes', count(*) FROM declarable_codes;
--
-- 2. Si todo OK, reemplazar tablas antiguas:
--    ALTER TABLE descriptions RENAME TO descriptions_old;
--    ALTER TABLE descriptions_new RENAME TO descriptions;
--    ALTER TABLE measure_types RENAME TO measure_types_old;
--    ALTER TABLE measure_types_new RENAME TO measure_types;
--
-- 3. Actualizar calculateTariff.js para usar geographical_areas_composition
-- ============================================================
