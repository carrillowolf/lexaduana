-- =====================================================================
-- BASELINE RETROACTIVO — Creado el 2026-04-23
-- =====================================================================
-- Esta migración documenta el SQL que ya fue aplicado manualmente en
-- producción el 2026-04-21 (Fase 1.1) para crear la tabla user_consents.
--
-- Propósito: cuando alguien reconstruya la base de datos desde cero con
-- `supabase db reset`, esta migración debe ejecutarse ANTES que
-- 20260423100000_user_consents_pseudonymization.sql para que el orden
-- cronológico sea coherente: primero se crea la tabla con su forma
-- original (CASCADE, user_id NOT NULL, política UPDATE sin guard), y
-- después la migración de pseudonimización modifica la FK y la política.
--
-- Por ello todas las sentencias son idempotentes: si la migración se
-- aplica en un entorno donde la tabla ya existe (como producción hoy),
-- no falla. En un entorno limpio, crea todo desde cero.
-- =====================================================================

-- Tabla de registro de consentimientos
-- Necesaria para demostrar cumplimiento del art. 7 RGPD (consentimiento demostrable)
-- Se conserva vida de la cuenta + 3 años tras baja

CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK (consent_type IN (
        'privacy_policy',
        'terms_of_service',
        'cookies_analytics',
        'ai_processing_classifier',
        'ai_processing_ocr_invoice',
        'marketing_emails'
    )),
    policy_version TEXT NOT NULL,
    accepted BOOLEAN NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    revoked_at TIMESTAMPTZ,
    CONSTRAINT unique_active_consent UNIQUE NULLS NOT DISTINCT (user_id, consent_type, policy_version, revoked_at)
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type_version ON public.user_consents(consent_type, policy_version);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY no soporta IF NOT EXISTS; usamos DROP IF EXISTS previo
-- para que la migración sea idempotente.

DROP POLICY IF EXISTS "Users can view their own consents" ON public.user_consents;
CREATE POLICY "Users can view their own consents"
    ON public.user_consents FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own consents" ON public.user_consents;
CREATE POLICY "Users can insert their own consents"
    ON public.user_consents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own consents (for revocation)" ON public.user_consents;
CREATE POLICY "Users can update their own consents (for revocation)"
    ON public.user_consents FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.user_consents IS 'Registro de consentimientos RGPD. Se conserva vida de cuenta + 3 años tras baja.';
