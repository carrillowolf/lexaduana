-- Limpieza de baseline: las 12 filas existentes son ruido del periodo
-- de observación (parser antiguo + widget vercel.live en previews).
-- Tras la conmutación a CSP bloqueante y el parser nuevo, partimos de cero.
DELETE FROM public.csp_violations;
