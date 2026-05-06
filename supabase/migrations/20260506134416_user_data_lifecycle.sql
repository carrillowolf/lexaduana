-- ============================================================================
-- Phase 8 / Commit 1: User data lifecycle (structural migration)
-- ============================================================================
-- Cambia el comportamiento de las 3 tablas con datos personales para que,
-- cuando un usuario se dé de baja, los datos queden pseudonimizados en lugar
-- de borrarse en cascada. Esto permite cumplir RGPD art. 17.3.b/e (retener
-- para defensa de reclamaciones) y al mismo tiempo el principio de
-- minimización: el dato deja de identificar al usuario, pero conserva su
-- valor probatorio durante el periodo de retención (gestionado por el
-- cron del Commit 2).
--
-- IMPORTANTE: esta migración NO purga datos. Solo cambia la estructura.
-- El primer borrado de filas viejas ocurrirá cuando se aplique el Commit 2
-- y el cron se ejecute por primera vez.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Cambiar FK de CASCADE a SET NULL en las 3 tablas con datos personales
-- ----------------------------------------------------------------------------
-- Confirmado con check de huérfanos previo (no debería haberlos):
DO $$
DECLARE
  orphan_count integer;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM classification_logs cl
  WHERE cl.user_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = cl.user_id);
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'classification_logs has % orphan rows. Aborting.', orphan_count;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM invoice_extractions ie
  WHERE ie.user_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = ie.user_id);
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'invoice_extractions has % orphan rows. Aborting.', orphan_count;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM rrm_requests rr
  WHERE rr.user_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = rr.user_id);
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'rrm_requests has % orphan rows. Aborting.', orphan_count;
  END IF;
END $$;

ALTER TABLE classification_logs
  DROP CONSTRAINT IF EXISTS classification_logs_user_id_fkey,
  ADD CONSTRAINT classification_logs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE invoice_extractions
  DROP CONSTRAINT IF EXISTS invoice_extractions_user_id_fkey,
  ADD CONSTRAINT invoice_extractions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE rrm_requests
  DROP CONSTRAINT IF EXISTS rrm_requests_user_id_fkey,
  ADD CONSTRAINT rrm_requests_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 2) Hacer user_id nullable (SET NULL solo es coherente si la columna lo es)
-- ----------------------------------------------------------------------------
ALTER TABLE classification_logs ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE invoice_extractions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE rrm_requests        ALTER COLUMN user_id DROP NOT NULL;

-- ----------------------------------------------------------------------------
-- 3) Añadir user_id_hash a las 3 tablas (mismo patrón que user_consents)
-- ----------------------------------------------------------------------------
ALTER TABLE classification_logs ADD COLUMN IF NOT EXISTS user_id_hash text;
ALTER TABLE invoice_extractions ADD COLUMN IF NOT EXISTS user_id_hash text;
ALTER TABLE rrm_requests        ADD COLUMN IF NOT EXISTS user_id_hash text;

COMMENT ON COLUMN classification_logs.user_id_hash IS
  'SHA-256 del user_id original. Se rellena en BEFORE DELETE de auth.users para preservar trazabilidad pseudonimizada hasta el periodo de retención (12 meses).';
COMMENT ON COLUMN invoice_extractions.user_id_hash IS
  'SHA-256 del user_id original. Se rellena en BEFORE DELETE de auth.users para preservar trazabilidad pseudonimizada hasta el periodo de retención (90 días).';
COMMENT ON COLUMN rrm_requests.user_id_hash IS
  'SHA-256 del user_id original. Se rellena en BEFORE DELETE de auth.users para preservar trazabilidad pseudonimizada hasta el periodo de retención (4 años).';

-- ----------------------------------------------------------------------------
-- 4) Índices para el user_id_hash (consultas de defensa legal post-baja)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_classification_logs_user_id_hash
  ON classification_logs (user_id_hash) WHERE user_id_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_extractions_user_id_hash
  ON invoice_extractions (user_id_hash) WHERE user_id_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rrm_requests_user_id_hash
  ON rrm_requests (user_id_hash) WHERE user_id_hash IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 5) Habilitar pgcrypto si no está (necesario para digest())
-- ----------------------------------------------------------------------------
-- En Supabase pgcrypto vive en el schema 'extensions', por eso la función
-- de pseudonimización referencia digest() como extensions.digest(...).
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ----------------------------------------------------------------------------
-- 6) Función de pseudonimización ejecutada por trigger en auth.users
-- ----------------------------------------------------------------------------
-- Ejecuta en BEFORE DELETE de auth.users: rellena user_id_hash en TODAS las
-- tablas con datos del usuario antes de que el FK SET NULL elimine la
-- referencia. También cubre user_consents (que ya tenía la columna desde su
-- creación) por consistencia.
--
-- Usa SHA-256 del user_id original como pseudonimo. Determinista (mismo
-- input → mismo hash), reversible solo con el user_id original (que
-- después de la baja ya no existe), y suficientemente largo para evitar
-- colisiones en el universo realista de usuarios.
CREATE OR REPLACE FUNCTION public.pseudonymize_user_data_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_hash text;
BEGIN
  -- digest() se cualifica con el schema 'extensions' explícitamente porque
  -- pgcrypto no está en el search_path mínimo (public, pg_catalog) usado
  -- en SECURITY DEFINER por seguridad.
  v_hash := encode(extensions.digest(OLD.id::text, 'sha256'), 'hex');

  UPDATE public.user_consents
     SET user_id_hash = v_hash
   WHERE user_id = OLD.id AND user_id_hash IS NULL;

  UPDATE public.classification_logs
     SET user_id_hash = v_hash
   WHERE user_id = OLD.id AND user_id_hash IS NULL;

  UPDATE public.invoice_extractions
     SET user_id_hash = v_hash
   WHERE user_id = OLD.id AND user_id_hash IS NULL;

  UPDATE public.rrm_requests
     SET user_id_hash = v_hash
   WHERE user_id = OLD.id AND user_id_hash IS NULL;

  RETURN OLD;
END;
$$;

COMMENT ON FUNCTION public.pseudonymize_user_data_on_delete() IS
  'Pseudonimiza datos personales asociados al user_id antes de su baja. RGPD art. 17.3.b/e: permite conservar evidencia para defensa de reclamaciones y obligaciones legales sin identificar al sujeto.';

-- ----------------------------------------------------------------------------
-- 7) Trigger BEFORE DELETE en auth.users
-- ----------------------------------------------------------------------------
-- El trigger debe estar en auth.users (no en public). Esto requiere
-- privilegios elevados (rol postgres) — Supabase los concede al ejecutar
-- migraciones desde el CLI.
DROP TRIGGER IF EXISTS trg_pseudonymize_user_data ON auth.users;
CREATE TRIGGER trg_pseudonymize_user_data
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.pseudonymize_user_data_on_delete();

COMMENT ON TRIGGER trg_pseudonymize_user_data ON auth.users IS
  'RGPD: pseudonimiza datos del usuario en tablas relacionadas antes de su baja.';

COMMIT;
