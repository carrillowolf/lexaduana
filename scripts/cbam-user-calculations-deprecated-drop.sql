-- ============================================================
-- DROP TABLE cbam_user_calculations — Legacy (NO EJECUTAR TODAVÍA)
-- ============================================================
-- Esta tabla + el endpoint /api/cbam/calculations + cualquier código que la
-- use se reemplazan por cbam_calculator_saves (multi-producto) + la nueva
-- /api/cbam/calculator/*.
--
-- Ejecutar SOLO cuando:
--   1. La Calculadora nueva esté verificada end-to-end.
--   2. /cbam/historial lea de cbam_calculator_saves (no de la vieja).
--   3. No quede código referenciando cbam_user_calculations ni
--      /api/cbam/calculations.
--
-- Motivo del cleanup: el simulador viejo (CBAMCostSimulator) tenía datos
-- hardcoded y bugs. Los registros guardados en esta tabla no tienen valor
-- de negocio y el schema single-product-per-row no es extensible.
--
-- Uso:
--   psql $DATABASE_URL -f scripts/cbam-user-calculations-deprecated-drop.sql
--   -- o --
--   aplicar vía Supabase MCP en commit separado post-cleanup.
-- ============================================================

-- Revocar policies antes de drop por higiene
DROP POLICY IF EXISTS "cbam_user_calculations_select_own"    ON public.cbam_user_calculations;
DROP POLICY IF EXISTS "cbam_user_calculations_insert_own"    ON public.cbam_user_calculations;
DROP POLICY IF EXISTS "cbam_user_calculations_update_own"    ON public.cbam_user_calculations;
DROP POLICY IF EXISTS "cbam_user_calculations_delete_own"    ON public.cbam_user_calculations;

-- Drop de la tabla (CASCADE para eliminar índices y triggers dependientes)
DROP TABLE IF EXISTS public.cbam_user_calculations CASCADE;
