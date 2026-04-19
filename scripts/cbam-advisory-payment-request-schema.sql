-- ============================================
-- CBAM DAY 5 · PIEZA 1: SOLICITUD DE PAGO PROFESIONAL
-- ============================================
-- Columnas para trazabilidad del email de solicitud de pago (pre-factura)
-- enviado desde el panel admin. Carlos aún no es autónomo, así que NO es
-- factura legal: es una "solicitud de pago" con aviso explícito al cliente.
--
-- Evolución futura (dejar nota — NO implementar en Día 5):
--   - Cuando Carlos sea autónomo, añadir `invoice_number` con secuencia anual
--     (p.ej. 2026-001) y separar solicitud-de-pago vs factura-oficial.
--   - Integración con software de facturación externo (Holded, Quaderno).
--   - Plantilla adicional "Recordatorio de pago" si pasan X días sin cobro.
-- ============================================

ALTER TABLE cbam_advisory_requests
  ADD COLUMN IF NOT EXISTS payment_request_sent_at TIMESTAMPTZ;

ALTER TABLE cbam_advisory_requests
  ADD COLUMN IF NOT EXISTS payment_request_language VARCHAR(2)
    CHECK (payment_request_language IN ('es', 'en'));

ALTER TABLE cbam_advisory_requests
  ADD COLUMN IF NOT EXISTS payment_request_amount NUMERIC(12,2);

ALTER TABLE cbam_advisory_requests
  ADD COLUMN IF NOT EXISTS payment_request_reference TEXT;
