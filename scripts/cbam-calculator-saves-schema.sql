-- ============================================================
-- CBAM Calculator Saves — Schema (Día 3)
-- ============================================================
-- Tabla del historial de cálculos de la Calculadora CBAM (Nivel 2 freemium).
-- Multi-producto por registro (products como JSONB), límite lógico de
-- 10 cálculos por usuario enforced en la API (FIFO).
--
-- RLS: cada usuario solo ve, inserta y borra sus propios cálculos.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cbam_calculator_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Input del cálculo
  calculation_year INTEGER NOT NULL CHECK (calculation_year BETWEEN 2026 AND 2030),
  products JSONB NOT NULL,        -- Array normalizado (CN, país, tn, fuente, FE, ruta, descripción)

  -- Output del cálculo (cache; evita re-computar al ver historial)
  total_cost NUMERIC(14, 2),
  total_certificates NUMERIC(12, 2),
  total_emissions NUMERIC(12, 4),
  result_snapshot JSONB,          -- Lines filtradas (free-tier) + totales

  -- Meta / trazabilidad
  source_regulation_version TEXT DEFAULT 'v20260204' NOT NULL,
  notes TEXT
);

COMMENT ON TABLE public.cbam_calculator_saves IS
  'Historial de cálculos de la Calculadora CBAM (Nivel 2 freemium). Multi-producto JSONB.';
COMMENT ON COLUMN public.cbam_calculator_saves.products IS
  'Array de productos input: [{cnCode, countryCode, annualTonnes, hasRealEmissions, emissionFactorReal, productionRoute, productDescription}]';
COMMENT ON COLUMN public.cbam_calculator_saves.result_snapshot IS
  'Snapshot filtrado free-tier del resultado del motor: lines con campos públicos (coste, certs, emisiones, AGIE) y totales.';

-- Índice para listados por usuario ordenados cronológicamente descendente
CREATE INDEX IF NOT EXISTS idx_calc_saves_user
  ON public.cbam_calculator_saves (user_id, created_at DESC);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.cbam_calculator_saves ENABLE ROW LEVEL SECURITY;

-- Un usuario puede leer sus propios cálculos
DROP POLICY IF EXISTS "cbam_calculator_saves_select_own"
  ON public.cbam_calculator_saves;
CREATE POLICY "cbam_calculator_saves_select_own"
  ON public.cbam_calculator_saves
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Un usuario puede insertar cálculos asociados a su propio user_id
DROP POLICY IF EXISTS "cbam_calculator_saves_insert_own"
  ON public.cbam_calculator_saves;
CREATE POLICY "cbam_calculator_saves_insert_own"
  ON public.cbam_calculator_saves
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Un usuario puede borrar sus propios cálculos
DROP POLICY IF EXISTS "cbam_calculator_saves_delete_own"
  ON public.cbam_calculator_saves;
CREATE POLICY "cbam_calculator_saves_delete_own"
  ON public.cbam_calculator_saves
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- (Admin: omitido en este schema inicial; se añade en una migración aparte
--  cuando haya rol o mecanismo de admin claramente definido en el proyecto.)
