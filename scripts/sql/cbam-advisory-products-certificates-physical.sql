-- Bloque 1 saneamiento motor CBAM
--
-- El calculator pasa a ser la única fuente de verdad del cálculo de
-- certificados y AGIE. Persistimos los dos valores para que el snapshot
-- del informe los lea en vez de recalcularlos (eliminando la duplicación
-- calculator ↔ snapshot).
--
-- certificates_physical    = max(0, tonnes*FE - tonnes*F_CBAM*FCI*BM)
--   Magnitud física en tCO2e (decimal, antes de redondeo a unidades enteras).
-- free_allocation_implicit = tonnes * F_CBAM * FCI * BM   (AGIE)
--   Asignación gratuita implícita por línea (Art. 36 Reg. 2023/956).
--
-- Nullable a propósito: filas anteriores al refactor quedan con NULL y el
-- snapshot mantiene un fallback al recálculo en memoria para no romper
-- informes antiguos.

ALTER TABLE cbam_advisory_products
  ADD COLUMN IF NOT EXISTS certificates_physical NUMERIC,
  ADD COLUMN IF NOT EXISTS free_allocation_implicit NUMERIC;
