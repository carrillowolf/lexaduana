-- Tabla de captura de violaciones CSP en modo Report-Only
-- Sin PII. Solo metadata de bloqueos (URL violada, directiva, archivo origen).
-- Purga automática a 30 días vía cron (Fase 8).

CREATE TABLE public.csp_violations (
  id bigserial PRIMARY KEY,
  reported_at timestamptz NOT NULL DEFAULT now(),
  document_uri text,
  referrer text,
  violated_directive text,
  effective_directive text,
  blocked_uri text,
  source_file text,
  line_number integer,
  column_number integer,
  status_code integer,
  raw_report jsonb NOT NULL
);

CREATE INDEX idx_csp_violations_reported_at ON public.csp_violations (reported_at DESC);
CREATE INDEX idx_csp_violations_directive ON public.csp_violations (violated_directive);
CREATE INDEX idx_csp_violations_blocked_uri ON public.csp_violations (blocked_uri);

ALTER TABLE public.csp_violations ENABLE ROW LEVEL SECURITY;

-- Sin policies SELECT públicas. Solo service_role accede.
-- Las consultas del análisis se harán desde scripts/análisis con la service_role key.

COMMENT ON TABLE public.csp_violations IS
  'Captura de violaciones CSP en modo Report-Only durante el periodo de validación. '
  'Purga a 30 días vía cron en Fase 8. RLS sin policies públicas: solo service_role.';
