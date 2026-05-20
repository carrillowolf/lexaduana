-- Bloque 3 motor CBAM (fix post-merge): totales agregados de certificados
-- por solicitud.
--
-- El wrapper calculateAdvisoryRequest (lib/cbamAdvisoryCalculator.js) hace
-- spread del objeto `totals` sobre updateAdvisoryRequest y, desde el
-- Bloque 3, incluye dos agregados nuevos que no tenían columna en BD:
--
-- total_certificates_physical:      Σ certificatesPhysical por línea
--                                   (decimal, round2 sobre la suma).
-- total_certificates_to_surrender:  Σ certificatesToSurrender por línea
--                                   (entero — suma de ceils por línea,
--                                   NUNCA ceil(suma); ver lib/cbamLineMath.js).
--
-- Bug detectado durante validación manual del PR #17: el endpoint
-- /api/admin/cbam/asesoria/[id]/calculate devolvía 500 con error de
-- Supabase "Could not find the 'totalCertificatesPhysical' column".
-- Doble causa: faltaba la columna AND faltaba el mapping camelCase →
-- snake_case en toSnake (lib/cbamAdvisoryService.js). Ambos arreglados
-- en el mismo commit.
--
-- Nullable a propósito para no romper solicitudes anteriores al Bloque 3.

ALTER TABLE cbam_advisory_requests
  ADD COLUMN IF NOT EXISTS total_certificates_physical NUMERIC,
  ADD COLUMN IF NOT EXISTS total_certificates_to_surrender INTEGER;
