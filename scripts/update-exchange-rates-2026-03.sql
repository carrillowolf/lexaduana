-- ============================================================
-- Actualización tipos de cambio BCE - Marzo 2026
-- Ejecutar en Supabase SQL Editor
-- ============================================================
-- Este script:
--   1. Reemplaza las vistas current/upcoming por tablas reales
--      (las vistas tenían target_currency/start_date, pero el
--       código necesita currency_code/currency_name/boe_reference)
--   2. Inserta tipos actuales (BOE-A-2026-3809, marzo 2026)
--   3. Inserta tipos próximos (BOE-A-2026-6470, abril 2026)
-- ============================================================

-- ============================================================
-- PASO 1: Eliminar vistas existentes y crear tablas
-- ============================================================
DROP VIEW IF EXISTS current_exchange_rates CASCADE;
DROP VIEW IF EXISTS upcoming_exchange_rates CASCADE;

-- Por si ya existían como tablas de una ejecución anterior
DROP TABLE IF EXISTS current_exchange_rates CASCADE;
DROP TABLE IF EXISTS upcoming_exchange_rates CASCADE;

CREATE TABLE current_exchange_rates (
  id SERIAL PRIMARY KEY,
  currency_code TEXT NOT NULL,
  currency_name TEXT NOT NULL,
  rate NUMERIC(12,6) NOT NULL,
  effective_from DATE NOT NULL,
  publication_date DATE NOT NULL,
  boe_reference TEXT NOT NULL
);

CREATE TABLE upcoming_exchange_rates (
  id SERIAL PRIMARY KEY,
  currency_code TEXT NOT NULL,
  currency_name TEXT NOT NULL,
  rate NUMERIC(12,6) NOT NULL,
  effective_from DATE NOT NULL,
  publication_date DATE NOT NULL,
  boe_reference TEXT NOT NULL
);

-- RLS: lectura pública
ALTER TABLE current_exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "current_rates_public_read" ON current_exchange_rates
  FOR SELECT USING (true);

CREATE POLICY "upcoming_rates_public_read" ON upcoming_exchange_rates
  FOR SELECT USING (true);

-- ============================================================
-- PASO 2: Tipos ACTUALES - BOE-A-2026-3809 (17 feb 2026)
--         Vigentes desde 1 marzo 2026
-- ============================================================
INSERT INTO current_exchange_rates (currency_code, currency_name, rate, effective_from, publication_date, boe_reference) VALUES
('AUD', 'Dólar australiano',      1.6776,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('BRL', 'Real brasileño',         6.1788,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('CAD', 'Dólar canadiense',       1.6149,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('CHF', 'Franco suizo',           0.9116,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('CNY', 'Yuan renminbi chino',    8.1702,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('CZK', 'Corona checa',          24.276,     '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('DKK', 'Corona danesa',          7.4706,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('GBP', 'Libra esterlina',        0.87330,   '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('HKD', 'Dólar de Hong Kong',     9.2428,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('HUF', 'Forinto húngaro',      378.43,      '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('IDR', 'Rupia indonesia',    19901.98,      '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('ILS', 'Shekel israelí',         3.6720,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('INR', 'Rupia india',          107.2565,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('ISK', 'Corona islandesa',     145.00,      '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('JPY', 'Yen japonés',          181.06,      '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('KRW', 'Won surcoreano',      1709.83,     '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('MXN', 'Peso mexicano',         20.3572,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('MYR', 'Ringgit malasio',        4.6121,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('NOK', 'Corona noruega',        11.2815,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('NZD', 'Dólar neozelandés',      1.9623,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('PHP', 'Peso filipino',         68.395,     '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('PLN', 'Zloty polaco',           4.2138,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('RON', 'Leu rumano',             5.0967,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('SEK', 'Corona sueca',          10.6480,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('SGD', 'Dólar de Singapur',      1.4946,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('THB', 'Baht tailandés',        37.021,     '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('TRY', 'Lira turca',            51.7114,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('USD', 'Dólar USA',              1.1826,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809'),
('ZAR', 'Rand sudafricano',      19.0320,    '2026-03-01', '2026-02-18', 'BOE-A-2026-3809');

-- ============================================================
-- PASO 3: Tipos PRÓXIMOS - BOE-A-2026-6470 (18 mar 2026)
--         Vigentes desde 1 abril 2026
-- ============================================================
INSERT INTO upcoming_exchange_rates (currency_code, currency_name, rate, effective_from, publication_date, boe_reference) VALUES
('AUD', 'Dólar australiano',      1.6305,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('BRL', 'Real brasileño',         6.0079,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('CAD', 'Dólar canadiense',       1.5774,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('CHF', 'Franco suizo',           0.9073,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('CNY', 'Yuan renminbi chino',    7.9214,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('CZK', 'Corona checa',          24.467,     '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('DKK', 'Corona danesa',          7.4720,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('GBP', 'Libra esterlina',        0.86393,   '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('HKD', 'Dólar de Hong Kong',     9.0135,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('HUF', 'Forinto húngaro',      392.83,      '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('IDR', 'Rupia indonesia',    19543.10,      '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('ILS', 'Shekel israelí',         3.5680,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('INR', 'Rupia india',          106.8300,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('ISK', 'Corona islandesa',     143.60,      '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('JPY', 'Yen japonés',          183.49,      '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('KRW', 'Won surcoreano',      1729.08,     '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('MXN', 'Peso mexicano',         20.3942,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('MYR', 'Ringgit malasio',        4.5040,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('NOK', 'Corona noruega',        11.0205,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('NZD', 'Dólar neozelandés',      1.9763,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('PHP', 'Peso filipino',         69.001,     '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('PLN', 'Zloty polaco',           4.2713,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('RON', 'Leu rumano',             5.0938,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('SEK', 'Corona sueca',          10.7778,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('SGD', 'Dólar de Singapur',      1.4734,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('THB', 'Baht tailandés',        37.565,     '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('TRY', 'Lira turca',            50.8539,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('USD', 'Dólar USA',              1.1500,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470'),
('ZAR', 'Rand sudafricano',      19.4174,    '2026-04-01', '2026-03-19', 'BOE-A-2026-6470');

-- ============================================================
-- PASO 4: Verificación
-- ============================================================
SELECT 'current_exchange_rates' AS tabla, COUNT(*) AS registros FROM current_exchange_rates
UNION ALL
SELECT 'upcoming_exchange_rates', COUNT(*) FROM upcoming_exchange_rates;
