-- =====================================================================
-- Sub-tanda 2C — Correcciones del dominio Dispatch
-- Creado: 2026-04-23
-- =====================================================================
-- Agrupa las correcciones detectadas en el inventario de la Tanda 2
-- (docs/inventario/INVENTARIO_DISPATCH.md):
--
--   Bloque 1: cerrar la política ALL de checklist_templates (CRÍTICO).
--   Bloque 2: dispatch_id SET NOT NULL en dispatch_checklist y
--             dispatch_timeline, con verificación previa de huérfanos.
--   Bloque 3: eliminar índice redundante idx_dispatches_expediente.
--   Bloque 4: deprecar dispatch_documents (RENAME).
--   Bloque 5: comentario de pendiente sobre dispatch_timeline.created_by.
--
-- NO APLICADA EN PRODUCCIÓN. Pendiente de que Carlos la ejecute desde el
-- SQL Editor de Supabase tras revisar.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Bloque 1 — checklist_templates: cerrar mutación pública (CRÍTICO)
-- ---------------------------------------------------------------------
-- La política actual "Anyone authenticated can modify templates" (cmd=ALL,
-- role=public) permite que cualquier usuario autenticado modifique las 113
-- plantillas globales, afectando a todos los despachos futuros de todos
-- los usuarios vía el trigger copy_checklist_template. Se elimina.
-- La mutación queda reservada a service_role (administración desde backend
-- o SQL Editor); la lectura se garantiza para cualquier authenticated.

DROP POLICY IF EXISTS "Anyone authenticated can modify templates" ON public.checklist_templates;

-- Garantiza una política SELECT para el rol authenticated (idempotente).
-- Nota: la política existente "Anyone authenticated can read templates"
-- está asignada al rol public con guard (auth.uid() IS NOT NULL), que es
-- funcionalmente equivalente pero no aparece bajo el rol authenticated,
-- por lo que este DO crea una política adicional explícita.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'checklist_templates'
      AND cmd = 'SELECT' AND roles::text[] && ARRAY['authenticated']
  ) THEN
    EXECUTE 'CREATE POLICY "authenticated_can_read_templates" ON public.checklist_templates FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

COMMENT ON TABLE public.checklist_templates IS
  'Plantillas globales de checklist. Mutación solo vía service_role desde backend. '
  'Lectura: cualquier usuario autenticado. Modificada en sub-tanda 2C (2026-04-23).';


-- ---------------------------------------------------------------------
-- Bloque 2 — dispatch_id SET NOT NULL en tablas hijas
-- ---------------------------------------------------------------------
-- dispatch_checklist.dispatch_id y dispatch_timeline.dispatch_id son
-- actualmente nullable pese a tener FK con ON DELETE CASCADE. Se endurecen
-- a NOT NULL tras verificar que no existen huérfanos. Si los hay, se
-- aborta la migración completa (transaccional).

DO $$
DECLARE
  huerfanos_checklist INT;
  huerfanos_timeline INT;
BEGIN
  SELECT COUNT(*) INTO huerfanos_checklist FROM public.dispatch_checklist WHERE dispatch_id IS NULL;
  SELECT COUNT(*) INTO huerfanos_timeline  FROM public.dispatch_timeline  WHERE dispatch_id IS NULL;

  IF huerfanos_checklist > 0 OR huerfanos_timeline > 0 THEN
    RAISE EXCEPTION
      'Huérfanos detectados: dispatch_checklist=%, dispatch_timeline=%. Abortando migración. Resolver huérfanos antes de aplicar SET NOT NULL.',
      huerfanos_checklist, huerfanos_timeline;
  END IF;
END $$;

ALTER TABLE public.dispatch_checklist ALTER COLUMN dispatch_id SET NOT NULL;
ALTER TABLE public.dispatch_timeline  ALTER COLUMN dispatch_id SET NOT NULL;


-- ---------------------------------------------------------------------
-- Bloque 3 — eliminar índice redundante en dispatches
-- ---------------------------------------------------------------------
-- idx_dispatches_expediente duplica el índice implícito del UNIQUE
-- constraint dispatches_expediente_number_key. Se elimina para liberar
-- espacio y reducir coste de escritura.

DROP INDEX IF EXISTS public.idx_dispatches_expediente;


-- ---------------------------------------------------------------------
-- Bloque 4 — deprecar dispatch_documents
-- ---------------------------------------------------------------------
-- Tabla inerte: 0 filas, 0 referencias en código de la app, sin bucket
-- de Storage asociado (storage.buckets solo contiene cbam-advisory-docs
-- y cbam-advisory-reports). Se renombra para congelar su uso durante 90
-- días. Revisión: 2026-07-23.

ALTER TABLE public.dispatch_documents
  RENAME TO _deprecated_dispatch_documents;

COMMENT ON TABLE public._deprecated_dispatch_documents IS
  'DEPRECATED 2026-04-23. Tabla inerte sin uso en código ni bucket Storage asociado. '
  'Revisar en 90 días (2026-07-23) y eliminar si la feature de adjuntos no se ha retomado.';


-- ---------------------------------------------------------------------
-- Bloque 5 — pendiente (NO migrar en esta tanda)
-- ---------------------------------------------------------------------
-- PENDIENTE: dispatch_timeline.created_by SET NOT NULL.
-- Investigar si existen filas con created_by NULL por eventos automáticos
-- del sistema. Si sí, añadir CHECK (event_type = 'system' OR created_by IS NOT NULL)
-- en lugar de SET NOT NULL directo. Ver BACKLOG_PRIVACIDAD.md.
