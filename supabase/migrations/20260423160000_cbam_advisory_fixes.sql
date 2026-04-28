-- ============================================================
-- Sub-tanda 4C: Correcciones CBAM advisory (versión corregida)
-- Fecha: 2026-04-23
--
-- Solo aplica los cambios que NO existían ya en producción:
-- 1. user_id NOT NULL en cbam_advisory_requests
-- 2. Ampliar payment_status CHECK con 'refunded'
--
-- NO tocar:
-- - status (CHECK ya existente con 11 valores del workflow real)
-- - cbam_monitoring_subscriptions.status (CHECK ya existente)
-- ============================================================

-- BLOQUE 1: user_id NOT NULL con verificación huérfanos
DO $$
DECLARE
  h INT;
BEGIN
  SELECT COUNT(*) INTO h FROM public.cbam_advisory_requests WHERE user_id IS NULL;
  IF h > 0 THEN
    RAISE EXCEPTION 'cbam_advisory_requests tiene % filas con user_id NULL.', h;
  END IF;
END $$;

ALTER TABLE public.cbam_advisory_requests ALTER COLUMN user_id SET NOT NULL;

-- BLOQUE 2: Ampliar payment_status CHECK con 'refunded'
ALTER TABLE public.cbam_advisory_requests
  DROP CONSTRAINT IF EXISTS cbam_advisory_requests_payment_status_check;

ALTER TABLE public.cbam_advisory_requests
  ADD CONSTRAINT cbam_advisory_requests_payment_status_check
  CHECK (payment_status IN ('unpaid','invoiced','paid','refunded'));
