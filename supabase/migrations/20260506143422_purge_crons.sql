-- ============================================================================
-- Phase 8 / Commit 3: Purge crons (data retention enforcement)
-- ============================================================================
-- Activa pg_cron + crea funciones de purga + tabla de auditoría + cron diario
-- a las 03:00 UTC. Implementa el principio de minimización RGPD art. 5.1.e.
--
-- Retenciones aplicadas:
--   - invoice_extractions:  90 días (purga por created_at, ignora deleted_at)
--   - csp_violations:       90 días (datos técnicos pero pueden contener
--                                    document_uri con identificadores)
--   - classification_logs:  12 meses
--   - rrm_requests:         4 años
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Activar pg_cron
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- ----------------------------------------------------------------------------
-- 2) Tabla de auditoría
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purge_audit_log (
  id              bigserial PRIMARY KEY,
  run_at          timestamptz NOT NULL DEFAULT now(),
  table_name      text NOT NULL,
  retention       interval NOT NULL,
  rows_deleted    integer NOT NULL DEFAULT 0,
  duration_ms     integer,
  success         boolean NOT NULL,
  error_message   text
);

CREATE INDEX IF NOT EXISTS idx_purge_audit_log_run_at
  ON public.purge_audit_log (run_at DESC);
CREATE INDEX IF NOT EXISTS idx_purge_audit_log_table
  ON public.purge_audit_log (table_name, run_at DESC);

ALTER TABLE public.purge_audit_log ENABLE ROW LEVEL SECURITY;
-- Sin policies para usuarios normales: solo service_role/postgres pueden
-- leer la auditoría. Si en el futuro se construye un panel admin, se
-- añadirá una policy específica para ese rol.

COMMENT ON TABLE public.purge_audit_log IS
  'Auditoría de ejecuciones de purga RGPD. Cada fila documenta una corrida del cron de retención. Acceso restringido a service_role/postgres.';

-- ----------------------------------------------------------------------------
-- 3) Función genérica de purga
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purge_old_rows(
  p_table_name text,
  p_timestamp_column text,
  p_retention interval
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_rows_deleted integer := 0;
  v_started_at   timestamptz := clock_timestamp();
  v_duration_ms  integer;
  v_sql          text;
  v_error        text;
BEGIN
  v_sql := format(
    'DELETE FROM public.%I WHERE %I < (NOW() - $1)',
    p_table_name,
    p_timestamp_column
  );
  BEGIN
    EXECUTE v_sql USING p_retention;
    GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
    v_duration_ms := EXTRACT(MILLISECOND FROM (clock_timestamp() - v_started_at))::integer;
    INSERT INTO public.purge_audit_log
      (table_name, retention, rows_deleted, duration_ms, success)
    VALUES
      (p_table_name, p_retention, v_rows_deleted, v_duration_ms, true);
    RETURN v_rows_deleted;
  EXCEPTION WHEN OTHERS THEN
    v_error := SQLERRM;
    v_duration_ms := EXTRACT(MILLISECOND FROM (clock_timestamp() - v_started_at))::integer;
    INSERT INTO public.purge_audit_log
      (table_name, retention, rows_deleted, duration_ms, success, error_message)
    VALUES
      (p_table_name, p_retention, 0, v_duration_ms, false, v_error);
    RETURN 0;
  END;
END;
$$;

COMMENT ON FUNCTION public.purge_old_rows IS
  'Purga RGPD: borra filas más antiguas que el intervalo dado y registra el resultado en purge_audit_log. Llamada desde run_daily_gdpr_purge.';

-- ----------------------------------------------------------------------------
-- 4) Función orquestadora
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.run_daily_gdpr_purge()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  PERFORM public.purge_old_rows('invoice_extractions', 'created_at', INTERVAL '90 days');
  PERFORM public.purge_old_rows('csp_violations',      'reported_at', INTERVAL '90 days');
  PERFORM public.purge_old_rows('classification_logs', 'created_at', INTERVAL '12 months');
  PERFORM public.purge_old_rows('rrm_requests',        'created_at', INTERVAL '4 years');
END;
$$;

COMMENT ON FUNCTION public.run_daily_gdpr_purge IS
  'Orquestador de purga RGPD diario. Llamado por pg_cron a las 03:00 UTC.';

-- ----------------------------------------------------------------------------
-- 5) Programar el cron
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'gdpr_daily_purge') THEN
    PERFORM cron.unschedule('gdpr_daily_purge');
  END IF;
  PERFORM cron.schedule(
    'gdpr_daily_purge',
    '0 3 * * *',
    'SELECT public.run_daily_gdpr_purge();'
  );
END $$;

COMMIT;
