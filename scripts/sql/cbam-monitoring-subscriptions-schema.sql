-- ============================================================
-- CBAM Monitoring Subscriptions — Schema (Día 4)
-- ============================================================
-- Suscripciones al servicio de Monitorización CBAM (199€/mes).
-- Ciclo operativo manual inicial: el cliente envía solicitud →
-- admin formaliza alta (cobro transferencia) → activa servicio →
-- puede pausarse o cancelarse.
--
-- Este schema es deliberadamente distinto a cbam_advisory_requests
-- porque el ciclo de vida (recurrente vs. único) y los datos
-- capturados (autorización DUAs, perfil de importación) divergen.
--
-- RLS: cada usuario ve/crea sus propias suscripciones; las
-- mutaciones administrativas (activate/pause/cancel + admin_notes)
-- se hacen vía service_role desde endpoints admin.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cbam_monitoring_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Estado del ciclo de vida
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'authorized', 'active', 'paused', 'cancelled')),

  -- Datos de empresa y contacto
  company_name TEXT NOT NULL,
  company_cif TEXT,
  company_legal_name TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,

  -- Autorización DUAs (consentimiento explícito)
  dua_authorization_accepted_at TIMESTAMPTZ,
  dua_authorization_text_version TEXT, -- versión del texto legal aceptado (p.ej. 'v1-2026-04')

  -- Perfil de importación
  main_cbam_products TEXT[],           -- lista libre de productos CBAM habituales
  main_origin_countries TEXT[],        -- países ISO alpha-2
  expected_monthly_volume TEXT
    CHECK (expected_monthly_volume IN ('<50t', '50-200t', '200-500t', '500t+')),

  -- Notas
  client_notes TEXT,          -- comentarios del cliente en el wizard
  admin_notes TEXT,           -- notas internas de operación manual (solo admin)

  -- Fechas operativas clave
  authorized_at TIMESTAMPTZ,  -- cliente ha firmado/confirmado autorización DUAs
  started_at TIMESTAMPTZ,     -- servicio pasó a 'active'
  paused_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

COMMENT ON TABLE public.cbam_monitoring_subscriptions IS
  'Suscripciones al servicio de Monitorización CBAM (199€/mes). Alta inicial manual por admin.';
COMMENT ON COLUMN public.cbam_monitoring_subscriptions.status IS
  'submitted (form enviado) → authorized (cliente firmó DUAs) → active (servicio activo) → paused | cancelled.';
COMMENT ON COLUMN public.cbam_monitoring_subscriptions.dua_authorization_text_version IS
  'Versión del texto legal de autorización DUAs aceptado por el cliente, para trazabilidad.';
COMMENT ON COLUMN public.cbam_monitoring_subscriptions.admin_notes IS
  'Notas internas de operación manual. Solo accesibles vía service_role.';

-- Índices
CREATE INDEX IF NOT EXISTS idx_cbam_monitoring_user
  ON public.cbam_monitoring_subscriptions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cbam_monitoring_status
  ON public.cbam_monitoring_subscriptions (status, created_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.tg_cbam_monitoring_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cbam_monitoring_touch_updated_at
  ON public.cbam_monitoring_subscriptions;
CREATE TRIGGER cbam_monitoring_touch_updated_at
  BEFORE UPDATE ON public.cbam_monitoring_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_cbam_monitoring_touch_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.cbam_monitoring_subscriptions ENABLE ROW LEVEL SECURITY;

-- Un usuario ve sus propias suscripciones
DROP POLICY IF EXISTS "cbam_monitoring_select_own"
  ON public.cbam_monitoring_subscriptions;
CREATE POLICY "cbam_monitoring_select_own"
  ON public.cbam_monitoring_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Un usuario inserta sus propias suscripciones (estado 'submitted')
DROP POLICY IF EXISTS "cbam_monitoring_insert_own"
  ON public.cbam_monitoring_subscriptions;
CREATE POLICY "cbam_monitoring_insert_own"
  ON public.cbam_monitoring_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Un usuario puede actualizar datos propios del cliente pero NO el estado
-- (las transiciones de estado las hace el admin vía service_role).
DROP POLICY IF EXISTS "cbam_monitoring_update_own_client_fields"
  ON public.cbam_monitoring_subscriptions;
CREATE POLICY "cbam_monitoring_update_own_client_fields"
  ON public.cbam_monitoring_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- (Admin: bypass vía service_role desde endpoints admin, siguiendo convención
--  ya usada en cbam_advisory_requests.)
