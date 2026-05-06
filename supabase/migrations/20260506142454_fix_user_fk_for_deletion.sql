-- ============================================================================
-- Phase 8 / Commit 2.1: Fix FKs bloqueantes en baja de usuario
-- ============================================================================
-- Detectado durante test end-to-end del Commit 2: 8 FKs en tablas public con
-- ON DELETE NO ACTION bloquean el delete del usuario. Este commit:
--
-- 1. Cambia 6 FKs operativas a SET NULL y añade user_id_hash a esas tablas
--    (mismo patrón que Commit 1 para classification_logs/etc).
-- 2. Cambia user_profiles.id a CASCADE (modelo "perfil ligado al user").
-- 3. Cambia _deprecated_dispatch_documents y cbam_config a CASCADE/SET NULL
--    según corresponda.
-- 4. Actualiza la función pseudonymize_user_data_on_delete_by_id para
--    incluir las nuevas tablas.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Verificación previa de huérfanos (aborta si los hay)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_count integer;
  v_total integer := 0;
  v_msg text := '';
BEGIN
  SELECT COUNT(*) INTO v_count FROM dispatches d
    WHERE d.created_by IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = d.created_by);
  IF v_count > 0 THEN v_total := v_total + v_count; v_msg := v_msg || format('dispatches.created_by: %s; ', v_count); END IF;

  SELECT COUNT(*) INTO v_count FROM dispatches d
    WHERE d.assigned_to IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = d.assigned_to);
  IF v_count > 0 THEN v_total := v_total + v_count; v_msg := v_msg || format('dispatches.assigned_to: %s; ', v_count); END IF;

  SELECT COUNT(*) INTO v_count FROM dispatch_checklist d
    WHERE d.checked_by IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = d.checked_by);
  IF v_count > 0 THEN v_total := v_total + v_count; v_msg := v_msg || format('dispatch_checklist.checked_by: %s; ', v_count); END IF;

  SELECT COUNT(*) INTO v_count FROM dispatch_comments d
    WHERE d.user_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = d.user_id);
  IF v_count > 0 THEN v_total := v_total + v_count; v_msg := v_msg || format('dispatch_comments.user_id: %s; ', v_count); END IF;

  SELECT COUNT(*) INTO v_count FROM dispatch_timeline d
    WHERE d.created_by IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = d.created_by);
  IF v_count > 0 THEN v_total := v_total + v_count; v_msg := v_msg || format('dispatch_timeline.created_by: %s; ', v_count); END IF;

  SELECT COUNT(*) INTO v_count FROM cbam_advisory_requests d
    WHERE d.user_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = d.user_id);
  IF v_count > 0 THEN v_total := v_total + v_count; v_msg := v_msg || format('cbam_advisory_requests.user_id: %s; ', v_count); END IF;

  SELECT COUNT(*) INTO v_count FROM cbam_calculator_saves d
    WHERE d.user_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = d.user_id);
  IF v_count > 0 THEN v_total := v_total + v_count; v_msg := v_msg || format('cbam_calculator_saves.user_id: %s; ', v_count); END IF;

  IF v_total > 0 THEN
    RAISE EXCEPTION 'Found % orphan rows. Aborting. Details: %', v_total, v_msg;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2) Tablas operativas → SET NULL + user_id_hash
-- ----------------------------------------------------------------------------

-- dispatches: dos columnas distintas (created_by, assigned_to) → dos hashes
ALTER TABLE public.dispatches
  DROP CONSTRAINT IF EXISTS dispatches_created_by_fkey,
  ADD CONSTRAINT dispatches_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.dispatches
  DROP CONSTRAINT IF EXISTS dispatches_assigned_to_fkey,
  ADD CONSTRAINT dispatches_assigned_to_fkey
    FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.dispatches ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.dispatches ALTER COLUMN assigned_to DROP NOT NULL;
ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS created_by_hash text;
ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS assigned_to_hash text;
CREATE INDEX IF NOT EXISTS idx_dispatches_created_by_hash
  ON public.dispatches (created_by_hash) WHERE created_by_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dispatches_assigned_to_hash
  ON public.dispatches (assigned_to_hash) WHERE assigned_to_hash IS NOT NULL;

-- dispatch_checklist
ALTER TABLE public.dispatch_checklist
  DROP CONSTRAINT IF EXISTS dispatch_checklist_checked_by_fkey,
  ADD CONSTRAINT dispatch_checklist_checked_by_fkey
    FOREIGN KEY (checked_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.dispatch_checklist ALTER COLUMN checked_by DROP NOT NULL;
ALTER TABLE public.dispatch_checklist ADD COLUMN IF NOT EXISTS checked_by_hash text;
CREATE INDEX IF NOT EXISTS idx_dispatch_checklist_checked_by_hash
  ON public.dispatch_checklist (checked_by_hash) WHERE checked_by_hash IS NOT NULL;

-- dispatch_comments
ALTER TABLE public.dispatch_comments
  DROP CONSTRAINT IF EXISTS dispatch_comments_user_id_fkey,
  ADD CONSTRAINT dispatch_comments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.dispatch_comments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.dispatch_comments ADD COLUMN IF NOT EXISTS user_id_hash text;
CREATE INDEX IF NOT EXISTS idx_dispatch_comments_user_id_hash
  ON public.dispatch_comments (user_id_hash) WHERE user_id_hash IS NOT NULL;

-- dispatch_timeline
ALTER TABLE public.dispatch_timeline
  DROP CONSTRAINT IF EXISTS dispatch_timeline_created_by_fkey,
  ADD CONSTRAINT dispatch_timeline_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.dispatch_timeline ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.dispatch_timeline ADD COLUMN IF NOT EXISTS created_by_hash text;
CREATE INDEX IF NOT EXISTS idx_dispatch_timeline_created_by_hash
  ON public.dispatch_timeline (created_by_hash) WHERE created_by_hash IS NOT NULL;

-- cbam_advisory_requests
ALTER TABLE public.cbam_advisory_requests
  DROP CONSTRAINT IF EXISTS cbam_advisory_requests_user_id_fkey,
  ADD CONSTRAINT cbam_advisory_requests_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.cbam_advisory_requests ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.cbam_advisory_requests ADD COLUMN IF NOT EXISTS user_id_hash text;
CREATE INDEX IF NOT EXISTS idx_cbam_advisory_requests_user_id_hash
  ON public.cbam_advisory_requests (user_id_hash) WHERE user_id_hash IS NOT NULL;

-- cbam_calculator_saves
ALTER TABLE public.cbam_calculator_saves
  DROP CONSTRAINT IF EXISTS cbam_calculator_saves_user_id_fkey,
  ADD CONSTRAINT cbam_calculator_saves_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.cbam_calculator_saves ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.cbam_calculator_saves ADD COLUMN IF NOT EXISTS user_id_hash text;
CREATE INDEX IF NOT EXISTS idx_cbam_calculator_saves_user_id_hash
  ON public.cbam_calculator_saves (user_id_hash) WHERE user_id_hash IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 3) cbam_config → SET NULL sin hash (metadato admin, no dato del usuario)
-- ----------------------------------------------------------------------------
ALTER TABLE public.cbam_config
  DROP CONSTRAINT IF EXISTS cbam_config_updated_by_fkey,
  ADD CONSTRAINT cbam_config_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.cbam_config ALTER COLUMN updated_by DROP NOT NULL;

-- ----------------------------------------------------------------------------
-- 4) user_profiles.id → CASCADE
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_id_fkey,
  ADD CONSTRAINT user_profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ----------------------------------------------------------------------------
-- 5) _deprecated_dispatch_documents → CASCADE (limpieza)
-- ----------------------------------------------------------------------------
ALTER TABLE public._deprecated_dispatch_documents
  DROP CONSTRAINT IF EXISTS dispatch_documents_uploaded_by_fkey,
  ADD CONSTRAINT dispatch_documents_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ----------------------------------------------------------------------------
-- 6) Actualizar la función de pseudonimización para incluir las nuevas tablas
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pseudonymize_user_data_on_delete_by_id(
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_hash text;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;

  v_hash := encode(extensions.digest(p_user_id::text, 'sha256'), 'hex');

  -- Tablas del Commit 1
  UPDATE public.user_consents
     SET user_id_hash = v_hash
   WHERE user_id = p_user_id AND user_id_hash IS NULL;

  UPDATE public.classification_logs
     SET user_id_hash = v_hash
   WHERE user_id = p_user_id AND user_id_hash IS NULL;

  UPDATE public.invoice_extractions
     SET user_id_hash = v_hash
   WHERE user_id = p_user_id AND user_id_hash IS NULL;

  UPDATE public.rrm_requests
     SET user_id_hash = v_hash
   WHERE user_id = p_user_id AND user_id_hash IS NULL;

  -- Tablas nuevas del Commit 2.1
  UPDATE public.dispatches
     SET created_by_hash = v_hash
   WHERE created_by = p_user_id AND created_by_hash IS NULL;

  UPDATE public.dispatches
     SET assigned_to_hash = v_hash
   WHERE assigned_to = p_user_id AND assigned_to_hash IS NULL;

  UPDATE public.dispatch_checklist
     SET checked_by_hash = v_hash
   WHERE checked_by = p_user_id AND checked_by_hash IS NULL;

  UPDATE public.dispatch_comments
     SET user_id_hash = v_hash
   WHERE user_id = p_user_id AND user_id_hash IS NULL;

  UPDATE public.dispatch_timeline
     SET created_by_hash = v_hash
   WHERE created_by = p_user_id AND created_by_hash IS NULL;

  UPDATE public.cbam_advisory_requests
     SET user_id_hash = v_hash
   WHERE user_id = p_user_id AND user_id_hash IS NULL;

  UPDATE public.cbam_calculator_saves
     SET user_id_hash = v_hash
   WHERE user_id = p_user_id AND user_id_hash IS NULL;

  -- cbam_config NO se pseudonimiza (es metadato admin, no dato del usuario)
END;
$$;

GRANT EXECUTE ON FUNCTION public.pseudonymize_user_data_on_delete_by_id(uuid) TO service_role;

COMMIT;
