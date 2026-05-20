-- Bloque 3 motor CBAM: número de certificados a entregar por línea, en
-- unidades enteras (cada certificado representa 1 tCO2e exacto).
--
-- Art. 20 Reg. (UE) 2023/956: la entrega se hace en unidades. Se aplica
-- Math.ceil() por línea sobre el valor crudo en tCO2e
-- (max(0, Tn*FE − AGIE)). NUNCA ceil() sobre el total — cada línea es
-- una entrega independiente (en el futuro con su precio trimestral propio).
--
-- Nullable a propósito: filas previas al Bloque 3 quedan con NULL y el
-- snapshot + PDF detectan la ausencia para mostrar solo la magnitud
-- física en tCO2e con nota "[Informe v3.0 pre-redondeo]".

ALTER TABLE cbam_advisory_products
  ADD COLUMN IF NOT EXISTS certificates_to_surrender INTEGER;
