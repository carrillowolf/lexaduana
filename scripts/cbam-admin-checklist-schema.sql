-- ============================================================
-- CBAM DAY 5 · PIEZA 2: CHECKLIST PRE-ENTREGA (stepper)
-- ============================================================
-- Añade columna admin_checklist (JSONB) a ambas tablas para persistir los
-- pasos manuales del stepper. Los pasos automáticos se derivan del status
-- y no se guardan aquí.
--
-- Estructura del JSON:
--   {
--     "datos_revisados": { "completed": true, "at": "2026-04-19T14:30:00Z", "by": "carlos@lexaduana.es" },
--     "informe_revisado": { "completed": false }
--   }
-- ============================================================

ALTER TABLE cbam_advisory_requests
  ADD COLUMN IF NOT EXISTS admin_checklist JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE cbam_monitoring_subscriptions
  ADD COLUMN IF NOT EXISTS admin_checklist JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN cbam_advisory_requests.admin_checklist IS
  'Día 5: pasos manuales del checklist pre-entrega. Los automáticos se derivan del status.';
COMMENT ON COLUMN cbam_monitoring_subscriptions.admin_checklist IS
  'Día 5: pasos manuales del checklist pre-entrega. Los automáticos se derivan del status.';
