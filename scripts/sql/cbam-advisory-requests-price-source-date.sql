-- Bloque 2 saneamiento motor CBAM: registrar de dónde sale el precio del
-- certificado aplicado y a qué fecha corresponde, para que cada informe
-- sea auditable.
--
-- co2_price_source: 'database' (cbam_ets_prices.is_current) o 'fallback'
--   (constante CBAM_CERTIFICATE_PRICE_FALLBACK en lib/cbamRegulatoryParams.js).
-- co2_price_date:   trimestre o fecha exacta del precio aplicado.
--   Ejemplos: '2026-Q1' (fallback) o '2026-04-08' (fila vigente en BD).
--
-- Nullables a propósito para no romper solicitudes anteriores al refactor.

ALTER TABLE cbam_advisory_requests
  ADD COLUMN IF NOT EXISTS co2_price_source TEXT,
  ADD COLUMN IF NOT EXISTS co2_price_date TEXT;
