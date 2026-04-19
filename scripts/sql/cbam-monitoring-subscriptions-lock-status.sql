-- ============================================================
-- CBAM Monitoring Subscriptions — Lock status & operational cols
-- ============================================================
-- Postgres column-level REVOKE no resta al grant table-level.
-- Solución: revocar el UPDATE table-level para authenticated/anon y
-- otorgar explícitamente UPDATE solo de las columnas que el cliente
-- puede modificar. service_role conserva UPDATE completo (y bypassa
-- RLS), por lo que los endpoints admin operan transiciones de estado
-- sin cambios.
--
-- Columnas que siguen siendo modificables por authenticated:
--   company_name, company_cif, company_legal_name,
--   contact_name, contact_email, contact_phone,
--   dua_authorization_accepted_at, dua_authorization_text_version,
--   main_cbam_products, main_origin_countries, expected_monthly_volume,
--   client_notes
--
-- Columnas bloqueadas (sólo service_role):
--   status, authorized_at, started_at, paused_at, cancelled_at, admin_notes
-- ============================================================

REVOKE UPDATE ON public.cbam_monitoring_subscriptions FROM authenticated;
REVOKE UPDATE ON public.cbam_monitoring_subscriptions FROM anon;

GRANT UPDATE (
  company_name,
  company_cif,
  company_legal_name,
  contact_name,
  contact_email,
  contact_phone,
  dua_authorization_accepted_at,
  dua_authorization_text_version,
  main_cbam_products,
  main_origin_countries,
  expected_monthly_volume,
  client_notes
) ON public.cbam_monitoring_subscriptions TO authenticated;
