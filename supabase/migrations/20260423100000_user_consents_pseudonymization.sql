-- Correcciones RGPD sobre user_consents:
-- 1. ON DELETE CASCADE → ON DELETE SET NULL (conservar evidencia tras baja de cuenta)
-- 2. Añadir user_id_hash para pseudonimización ante reclamaciones
-- 3. Bloquear updates sobre registros anonimizados

-- Añadir columna de hash pseudonimizado
ALTER TABLE public.user_consents
    ADD COLUMN IF NOT EXISTS user_id_hash TEXT;

-- Cambiar FK de CASCADE a SET NULL
ALTER TABLE public.user_consents
    DROP CONSTRAINT IF EXISTS user_consents_user_id_fkey;

ALTER TABLE public.user_consents
    ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.user_consents
    ADD CONSTRAINT user_consents_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Índice para búsquedas por hash en caso de reclamación
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id_hash
    ON public.user_consents(user_id_hash)
    WHERE user_id_hash IS NOT NULL;

-- Actualizar política UPDATE: registros anonimizados (user_id NULL) son inmutables
DROP POLICY IF EXISTS "Users can update their own consents (for revocation)" ON public.user_consents;

CREATE POLICY "Users can update their own consents (for revocation)"
    ON public.user_consents FOR UPDATE
    USING (auth.uid() = user_id AND user_id IS NOT NULL)
    WITH CHECK (auth.uid() = user_id);

-- Comentario actualizado
COMMENT ON TABLE public.user_consents IS
    'Registro de consentimientos RGPD (art. 7). Al borrar cuenta de usuario, user_id pasa a NULL '
    'y user_id_hash conserva pseudonimización para defensa ante reclamaciones durante 3 años. '
    'Tras 3 años, registros con user_id IS NULL se eliminan por cron (Fase 8).';

COMMENT ON COLUMN public.user_consents.user_id_hash IS
    'Hash pseudonimizado (email+salt) rellenado antes del borrado de cuenta. '
    'Permite validar ante reclamación sin conservar datos personales identificables.';
