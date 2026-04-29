-- Sub-tanda 6F: Limpieza TARIC reference - duplicados de policy + índices redundantes
-- Fecha: 2026-04-29
-- Sin impacto funcional. Reduce coste mantenimiento principalmente en measure_footnotes (122K filas).

-- 1. Drop policy duplicada en measure_footnotes
DROP POLICY IF EXISTS "Allow public read measure_footnotes" ON public.measure_footnotes;
-- Conservada: mf_public_read

-- 2. Drop índice duplicado en measure_footnotes (122K filas)
DROP INDEX IF EXISTS public.idx_mf_goods;
-- Conservado: idx_mf_goods_code

-- 3. Drop índice duplicado en measure_exclusions (29K filas)
DROP INDEX IF EXISTS public.idx_me_excluded;
-- Conservado: idx_me_excluded_country

-- 4. Drop índice redundante en geographical_areas (cubierto por UNIQUE)
DROP INDEX IF EXISTS public.idx_ga_code;
-- Conservado: geographical_areas_area_code_key (UNIQUE constraint)

-- 5. Drop índice cubierto por compuesto en measure_exclusions
DROP INDEX IF EXISTS public.idx_me_goods;
-- Conservado: idx_me_goods_excluded (cubre por prefijo)
