-- ============================================================================
-- Phase 8 / Commit 2: Helper function for endpoint-driven pseudonymization
-- ============================================================================
-- La función original pseudonymize_user_data_on_delete() está pensada para
-- triggers (lee OLD.id). Como Supabase no permite triggers en auth.users,
-- creamos esta variante que recibe user_id como parámetro y se invoca desde
-- el endpoint /api/account/delete vía supabase.rpc().
-- ============================================================================

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

  -- Mismo hash determinista que el trigger (si algún día se aplica el trigger
  -- en otro entorno, los hashes serán idénticos para el mismo user_id).
  v_hash := encode(extensions.digest(p_user_id::text, 'sha256'), 'hex');

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
END;
$$;

COMMENT ON FUNCTION public.pseudonymize_user_data_on_delete_by_id IS
  'Variante por parámetro de pseudonymize_user_data_on_delete(). Para invocación desde endpoint /api/account/delete vía supabase.rpc().';

-- Permitir que el rol service_role la invoque (es lo que usa el endpoint)
GRANT EXECUTE ON FUNCTION public.pseudonymize_user_data_on_delete_by_id(uuid) TO service_role;
