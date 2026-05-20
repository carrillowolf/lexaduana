-- Bloque 2 saneamiento motor CBAM: registrar de dónde sale el precio del
-- certificado aplicado y a qué fecha corresponde, para que cada informe
-- sea auditable.
--
-- co2_price_lookup_source:
--   'database' (cbam_ets_prices.is_current) o 'fallback' (constante
--   CBAM_CERTIFICATE_PRICE_FALLBACK en lib/cbamRegulatoryParams.js).
--   NO confundir con la referencia regulatoria del precio (Reg. Ejec.
--   2025/2548) que vive en el snapshot JSONB como
--   certificatePriceRegulatoryRef.
-- co2_price_date:
--   trimestre o fecha exacta del precio aplicado. Ejemplos: '2026-Q1'
--   (fallback) o '2026-04-08' (fila vigente en BD).
--
-- Nullables a propósito para no romper solicitudes anteriores al refactor.
--
-- Nota histórica: la columna nació como co2_price_source y se renombró en
-- el mismo PR para evitar confusión semántica. Si reproduces desde cero,
-- usa este script. Si vienes de una BD que ya tiene co2_price_source,
-- aplica también scripts/sql/cbam-advisory-requests-rename-price-source.sql.

ALTER TABLE cbam_advisory_requests
  ADD COLUMN IF NOT EXISTS co2_price_lookup_source TEXT,
  ADD COLUMN IF NOT EXISTS co2_price_date TEXT;
