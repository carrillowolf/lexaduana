-- Add explicit application_quarter column to cbam_ets_prices.
-- price_date stores the PUBLICATION date (e.g. 2026-04-08 for Q1 2026).
-- Inferring the applicable quarter from price_date is off-by-one (publish
-- date of Q1 falls in Q2 natural). Store the quarter the price applies TO.
ALTER TABLE cbam_ets_prices
  ADD COLUMN IF NOT EXISTS application_quarter text;

ALTER TABLE cbam_ets_prices
  ADD CONSTRAINT cbam_ets_prices_application_quarter_format
  CHECK (application_quarter IS NULL OR application_quarter ~ '^[0-9]{4}-Q[1-4]$');

UPDATE cbam_ets_prices SET application_quarter = '2026-Q1' WHERE price_date = '2026-04-08';
UPDATE cbam_ets_prices SET application_quarter = '2026-Q1' WHERE price_date = '2026-03-13' AND application_quarter IS NULL;

COMMENT ON COLUMN cbam_ets_prices.application_quarter IS
  'Trimestre de aplicación del precio (formato YYYY-QN). El precio publicado el 2026-04-08 aplica a Q1 2026. NO inferir desde price_date.';
