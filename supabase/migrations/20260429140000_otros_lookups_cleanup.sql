-- Sub-tanda 7C: Limpieza otros/lookups - eliminación de backups v42 + deprecación legacy
-- Fecha: 2026-04-29
-- Verificado: backup measure_exclusions tiene 5811 filas extra, todas exclusiones caducadas legítimas.
--
-- BLOQUE 5 (deprecación de exchange_rates legacy) NO incluido en esta migración.
-- Razón: scripts/loadBlock3.js:235 todavía hace batchInsert('exchange_rates', ...).
-- Carlos debe limpiar ese script antes de proceder con la deprecación de la tabla.

-- BLOQUE 1: DROP backups v42 (sin valor histórico, equivalentes activos cubren)
DROP TABLE IF EXISTS public.tariffs_backup_v42;
DROP TABLE IF EXISTS public.measure_exclusions_backup_v42;
DROP TABLE IF EXISTS public.preferential_tariffs_backup_v42;

-- BLOQUE 2: Deprecación de tariff_history (sin uso, scaffolding antiguo)
ALTER TABLE public.tariff_history RENAME TO _deprecated_tariff_history;
COMMENT ON TABLE public._deprecated_tariff_history IS
  'DEPRECATED 2026-04-29. Sin uso en código (única ref en scripts/updateTariffs.js no ejecutado). '
  'Reemplazada por taric_changes. Revisar 2026-07-29 y eliminar.';

-- BLOQUE 3: Deprecación de tariff_changes (sin uso + riesgo typo con taric_changes)
ALTER TABLE public.tariff_changes RENAME TO _deprecated_tariff_changes;
COMMENT ON TABLE public._deprecated_tariff_changes IS
  'DEPRECATED 2026-04-29. Sin uso en código. Riesgo de typo con taric_changes activa (18K filas). '
  'Revisar 2026-07-29 y eliminar.';

-- BLOQUE 4: Drop índice redundante en countries
DROP INDEX IF EXISTS public.idx_countries_code;
-- Conservado: UNIQUE constraint sobre country_code
