-- =====================================================================
-- Sub-tanda 3C — Correcciones del dominio Clasificación + OCR + Alertas
-- Creado: 2026-04-23
-- =====================================================================
-- Agrupa correcciones detectadas en INVENTARIO_CLASIFICACION_OCR_ALERTAS.md:
--
--   Bloque 1: user_id SET NOT NULL en classification_logs, rrm_requests
--             y monitored_codes, con verificación previa de huérfanos
--             (RAISE EXCEPTION aborta la migración entera si los hay).
--   Bloque 2: DROP policy duplicada "Users can view own monitors" en
--             monitored_codes (la policy ALL "Users can manage own
--             monitors" ya cubre SELECT).
--   Bloque 3: deprecar alert_notifications (RENAME, revisión 2026-07-23).
--
-- NO APLICADA EN PRODUCCIÓN. Pendiente de que Carlos la ejecute desde el
-- SQL Editor de Supabase tras revisar.
--
-- Check previo recomendado antes de aplicar:
--   SELECT 'classification_logs' tbl, COUNT(*) filas,
--          COUNT(*) FILTER (WHERE user_id IS NULL) huerfanos
--   FROM public.classification_logs
--   UNION ALL
--   SELECT 'rrm_requests', COUNT(*), COUNT(*) FILTER (WHERE user_id IS NULL)
--   FROM public.rrm_requests
--   UNION ALL
--   SELECT 'monitored_codes', COUNT(*), COUNT(*) FILTER (WHERE user_id IS NULL)
--   FROM public.monitored_codes;
-- =====================================================================


-- ---------------------------------------------------------------------
-- Bloque 1 — user_id SET NOT NULL con verificación de huérfanos
-- ---------------------------------------------------------------------
-- Endurece a NOT NULL las tres columnas user_id que hoy son nullable
-- pese a tener FK con ON DELETE CASCADE. El DO block aborta la migración
-- completa con RAISE EXCEPTION si encuentra huérfanos, dejando la
-- transacción rollback.

DO $$
DECLARE
  h_classif INT;
  h_rrm INT;
  h_monitored INT;
BEGIN
  SELECT COUNT(*) INTO h_classif   FROM public.classification_logs WHERE user_id IS NULL;
  SELECT COUNT(*) INTO h_rrm       FROM public.rrm_requests        WHERE user_id IS NULL;
  SELECT COUNT(*) INTO h_monitored FROM public.monitored_codes     WHERE user_id IS NULL;

  IF h_classif > 0 OR h_rrm > 0 OR h_monitored > 0 THEN
    RAISE EXCEPTION
      'Huérfanos detectados. classification_logs=%, rrm_requests=%, monitored_codes=%. Abortando.',
      h_classif, h_rrm, h_monitored;
  END IF;
END $$;

ALTER TABLE public.classification_logs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.rrm_requests        ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.monitored_codes     ALTER COLUMN user_id SET NOT NULL;


-- ---------------------------------------------------------------------
-- Bloque 2 — DROP policy duplicada en monitored_codes
-- ---------------------------------------------------------------------
-- "Users can manage own monitors" (ALL) y "Users can view own monitors"
-- (también ALL) tienen la misma expresión USING. La policy ALL ya cubre
-- SELECT, así que la segunda es ruido.

DROP POLICY IF EXISTS "Users can view own monitors" ON public.monitored_codes;


-- ---------------------------------------------------------------------
-- Bloque 3 — Deprecar alert_notifications
-- ---------------------------------------------------------------------
-- Tabla huérfana: 0 filas, 0 referencias en código de la app y sin
-- worker que la popule. Se renombra para congelarla durante 90 días.
-- Revisión: 2026-07-23.

ALTER TABLE public.alert_notifications
  RENAME TO _deprecated_alert_notifications;

COMMENT ON TABLE public._deprecated_alert_notifications IS
  'DEPRECATED 2026-04-23. Tabla sin código cliente ni worker que la popule. '
  'Revisar en 90 días (2026-07-23) y eliminar si la feature no se ha retomado.';
