-- Bloque 2 saneamiento motor CBAM: garantizar unicidad de la fila vigente
-- en cbam_ets_prices.
--
-- Antes había un índice parcial NO UNIQUE (CREATE INDEX ... WHERE is_current = true),
-- lo que permitía dos filas con is_current=true simultáneamente. Eso rompería
-- getCurrentETSPrice() en lib/cbamService.js: el .single() del query devuelve
-- error si llegan dos resultados. Convertimos a UNIQUE parcial.
--
-- Precondición: una sola fila con is_current=true (verificado antes de aplicar).

DROP INDEX IF EXISTS idx_cbam_ets_current;
CREATE UNIQUE INDEX idx_cbam_ets_current_unique
  ON public.cbam_ets_prices (is_current)
  WHERE is_current = true;
