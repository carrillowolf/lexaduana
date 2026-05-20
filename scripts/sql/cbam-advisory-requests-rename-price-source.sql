-- Rename de la columna co2_price_source -> co2_price_lookup_source
-- añadida en la migración cbam-advisory-requests-price-source-date.sql.
--
-- "lookup_source" deja claro que el valor describe de dónde se LEYÓ el
-- precio en runtime ('database' o 'fallback'), no qué reglamento lo
-- establece. La referencia regulatoria (Reg. Ejec. 2025/2548) vive en el
-- snapshot JSONB como certificatePriceRegulatoryRef.
--
-- Seguro: aplicado en la misma sesión que la migración original, sin
-- datos en producción (verificado: 0 filas con valor no NULL).

ALTER TABLE cbam_advisory_requests
  RENAME COLUMN co2_price_source TO co2_price_lookup_source;
