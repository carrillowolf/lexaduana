-- Sub-tanda 5C: Deprecación de tablas CBAM reference vacías sin uso
-- Fecha: 2026-04-29

ALTER TABLE public.cbam_cn_codes_full RENAME TO _deprecated_cbam_cn_codes_full;

COMMENT ON TABLE public._deprecated_cbam_cn_codes_full IS
  'DEPRECATED 2026-04-29. Vacía, sin uso en código, sin versionado por fecha. '
  'Revisar 2026-07-29 y eliminar si no se ha retomado.';

ALTER TABLE public.cbam_countries RENAME TO _deprecated_cbam_countries;

COMMENT ON TABLE public._deprecated_cbam_countries IS
  'DEPRECATED 2026-04-29. Vacía. Solapamiento con public.countries y cbam_excluded_countries. '
  'Revisar 2026-07-29 y eliminar.';
