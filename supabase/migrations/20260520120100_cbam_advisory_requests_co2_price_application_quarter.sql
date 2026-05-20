-- Persist the application quarter of the CBAM certificate price captured
-- at calculation time on the advisory request, so historical reports stay
-- consistent with the price that was actually applied (the price published
-- on 2026-04-08 applies to Q1 2026; storing only the publication date forces
-- inference, which is off-by-one).
ALTER TABLE cbam_advisory_requests
  ADD COLUMN IF NOT EXISTS co2_price_application_quarter text;

ALTER TABLE cbam_advisory_requests
  ADD CONSTRAINT cbam_advisory_requests_co2_price_app_quarter_format
  CHECK (co2_price_application_quarter IS NULL OR co2_price_application_quarter ~ '^[0-9]{4}-Q[1-4]$');

COMMENT ON COLUMN cbam_advisory_requests.co2_price_application_quarter IS
  'Trimestre de aplicación del precio CBAM persistido (formato YYYY-QN). Snapshot del valor de cbam_ets_prices.application_quarter en el momento del cálculo.';
