-- =====================================================================
-- Sub-tanda 4C — Correcciones del dominio CBAM Advisory
-- Creado: 2026-04-23
-- =====================================================================
-- Agrupa correcciones detectadas en INVENTARIO_CBAM_ADVISORY.md:
--
--   Bloque 1: cbam_advisory_requests.user_id SET NOT NULL, con
--             verificación previa de huérfanos (RAISE EXCEPTION aborta
--             la migración entera si los hay).
--   Bloque 2: 3 CHECK constraints sobre columnas de estado:
--             - cbam_advisory_requests.status
--             - cbam_advisory_requests.payment_status
--             - cbam_monitoring_subscriptions.status
--             Los valores válidos están confirmados con Carlos tras
--             revisión de DISTINCT en BD + grep de literales en código.
--
-- Checks previos ejecutados antes de aplicar:
--   - 0 filas con user_id NULL en cbam_advisory_requests.
--   - 0 filas con payment_status fuera de la lista permitida.
--   - DISTINCT de status (cbam_advisory_requests, cbam_monitoring_subscriptions)
--     enteramente cubierto por las listas del CHECK.
--
-- NO APLICADA EN PRODUCCIÓN. Pendiente de que Carlos la ejecute desde
-- el SQL Editor de Supabase tras revisar.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Bloque 1 — cbam_advisory_requests.user_id SET NOT NULL
-- ---------------------------------------------------------------------
-- La columna es nullable en el schema actual pese a que la policy INSERT
-- exige auth.uid() = user_id. El DO block actúa como red de seguridad
-- transaccional: aborta si reaparecen huérfanos entre el check previo
-- y el momento de aplicación.

DO $$
DECLARE
  h INT;
BEGIN
  SELECT COUNT(*) INTO h FROM public.cbam_advisory_requests WHERE user_id IS NULL;
  IF h > 0 THEN
    RAISE EXCEPTION 'cbam_advisory_requests tiene % filas con user_id NULL. Resolver antes.', h;
  END IF;
END $$;

ALTER TABLE public.cbam_advisory_requests
  ALTER COLUMN user_id SET NOT NULL;


-- ---------------------------------------------------------------------
-- Bloque 2 — CHECK constraints en columnas de estado
-- ---------------------------------------------------------------------
-- Restringe los valores de las columnas libres `status` y `payment_status`
-- a los conjuntos confirmados con Carlos. Si en el futuro se añade un
-- nuevo estado al workflow, esta constraint hay que actualizarla.

ALTER TABLE public.cbam_advisory_requests
  ADD CONSTRAINT cbam_advisory_requests_status_check
  CHECK (status IN ('draft','intake_complete','submitted','paid','delivered'));

ALTER TABLE public.cbam_advisory_requests
  ADD CONSTRAINT cbam_advisory_requests_payment_status_check
  CHECK (payment_status IN ('unpaid','requested','paid','refunded'));

ALTER TABLE public.cbam_monitoring_subscriptions
  ADD CONSTRAINT cbam_monitoring_subscriptions_status_check
  CHECK (status IN ('submitted','authorized','active','paused','cancelled'));
