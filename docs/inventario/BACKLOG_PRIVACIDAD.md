# Backlog de mejoras de privacidad / RGPD

Hallazgos detectados durante el inventario de tablas que no bloquean el cumplimiento
inmediato pero conviene resolver en una siguiente iteración.

## De Tanda 1 (usuarios)

### user_profiles — políticas RLS redundantes

La tabla tiene **4 políticas** donde bastaría con **1 o 2**:

| Política actual | Comando | USING |
|---|---|---|
| `Users can manage own profile` | **ALL** | `auth.uid() = id` |
| `Users can view own profile` | SELECT | `auth.uid() = id` |
| `Users can update own profile` | UPDATE | `auth.uid() = id` |
| `Users update own` | UPDATE | `auth.uid() = id` |

**Por qué son redundantes**:
- La política `Users can manage own profile` con comando `ALL` ya cubre SELECT, INSERT, UPDATE y DELETE, haciendo innecesarias `Users can view own profile` y las dos de UPDATE.
- Las dos políticas sobre UPDATE (`Users can update own profile` y `Users update own`) son funcionalmente idénticas — misma expresión USING, mismo rol. Es pura duplicación.

**Propuesta (no aplicar aún)**:

Opción A — minimalista, una sola política ALL:

```sql
DROP POLICY "Users can view own profile" ON public.user_profiles;
DROP POLICY "Users can update own profile" ON public.user_profiles;
DROP POLICY "Users update own" ON public.user_profiles;
-- Mantener solo: "Users can manage own profile" (ALL)
```

Opción B — explícita por comando (más legible, alinea con el estilo de `user_calculations` y `user_favorites`):

```sql
DROP POLICY "Users can manage own profile" ON public.user_profiles;
DROP POLICY "Users update own" ON public.user_profiles;
-- Mantener: "Users can view own profile" (SELECT) y "Users can update own profile" (UPDATE)
-- Añadir explícitamente WITH CHECK en UPDATE.
```

Recomendación: **Opción B**, alinea con el resto del dominio y deja claro qué comandos están permitidos.

---

### user_profiles — FK sin ON DELETE explícito

La constraint `user_profiles_id_fkey` está definida como:

```
FOREIGN KEY (id) REFERENCES auth.users(id)
```

Sin cláusula `ON DELETE`, lo que equivale a **`NO ACTION`** (rechaza el borrado de `auth.users` si existe un perfil). Inconsistente con las otras 4 tablas del dominio, todas con `ON DELETE CASCADE`.

**Consecuencia práctica**: al intentar eliminar un usuario desde el panel de Supabase Auth, la operación falla con error de FK mientras exista su perfil. Obliga a un paso manual (`DELETE FROM user_profiles WHERE id = ...`) antes de poder borrar el auth.user.

**Propuesta (no aplicar aún)**:

```sql
ALTER TABLE public.user_profiles
    DROP CONSTRAINT user_profiles_id_fkey;

ALTER TABLE public.user_profiles
    ADD CONSTRAINT user_profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

Alternativa: `ON DELETE SET NULL` no aplica aquí porque `user_profiles.id` es `NOT NULL` y además es la PK.

**Decisión pendiente**: confirmar que cascadear es el comportamiento deseado (la mayoría de apps SaaS lo hacen así) o mantener el bloqueo actual como medida de seguridad contra borrados accidentales.

---

### user_id nullable con FK CASCADE en varias tablas

Tres tablas del dominio tienen `user_id` declarado como `nullable` pese a que la FK está configurada con `ON DELETE CASCADE`:

- `user_calculations.user_id` — nullable, FK CASCADE
- `user_favorites.user_id` — nullable, FK CASCADE
- `user_alert_subscriptions.user_id` (ahora `_deprecated_user_alert_subscriptions`) — nullable, FK CASCADE

**Por qué importa**: permite insertar filas sin usuario (huérfanas desde el día cero). Además, la política RLS `auth.uid() = user_id` deja estas filas inaccesibles por cualquier usuario autenticado — quedarían como "filas zombie" sólo visibles con `service_role`.

**Verificación previa al cambio**:

```sql
SELECT 'user_calculations' AS tabla, count(*) AS orphans FROM user_calculations WHERE user_id IS NULL
UNION ALL
SELECT 'user_favorites', count(*) FROM user_favorites WHERE user_id IS NULL
UNION ALL
SELECT 'user_alert_subs', count(*) FROM public._deprecated_user_alert_subscriptions WHERE user_id IS NULL;
```

Si las tres salen con 0 huérfanos, aplicar:

```sql
ALTER TABLE public.user_calculations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_favorites   ALTER COLUMN user_id SET NOT NULL;
-- _deprecated_user_alert_subscriptions: no tocar (está en deprecación).
```

Si hay huérfanos, borrarlos previamente (previa revisión con Carlos).

**Nota**: `user_consents.user_id` es un caso aparte — pasa a nullable **intencionalmente** por la migración `20260423100000_user_consents_pseudonymization.sql` para permitir anonimización. Ese cambio no entra en este backlog.

---

### Inconsistencias cosméticas de estilo SQL

Sin impacto de seguridad ni cumplimiento, se anotan para cuando se toque el esquema:

- `user_favorites.id` usa `uuid_generate_v4()` (requiere extensión `uuid-ossp`). El resto del dominio usa `gen_random_uuid()` (nativo pgcrypto desde PG13). Unificar.
- `user_alert_subscriptions.id` (deprecada) usa `int4 + sequence`, única excepción al patrón `uuid`.
- `user_calculations.updated_at` no se refresca en UPDATEs porque no hay trigger `BEFORE UPDATE`. Si se quiere que refleje la última modificación, añadir el trigger típico `moddatetime` o equivalente.
- `consent_type` (en `user_consents`) y `subscription_type` (en tabla deprecada) son `text`/`varchar` libres sin CHECK ni enum. Añadir restricción explícita al integrar Fase 1.2.

---

## Revisión futura

### _deprecated_user_alert_subscriptions (2026-07-21)

Eliminar si la feature de suscripciones de alerta personalizadas no se ha retomado. Migración de drop sugerida:

```sql
DROP TABLE IF EXISTS public._deprecated_user_alert_subscriptions;
```

### user_consents — Fase 8 (cron de limpieza a 3 años)

Tras aplicar la migración de pseudonimización, los registros con `user_id IS NULL` deben eliminarse automáticamente cuando `accepted_at < now() - interval '3 years'`. Implementación pendiente en la Fase 8.

```sql
-- Ejemplo de cron job (pg_cron o edge function):
DELETE FROM public.user_consents
WHERE user_id IS NULL
  AND accepted_at < now() - interval '3 years';
```

### user_consents — endpoint de integración (Fase 1.2)

La tabla está creada y la migración de pseudonimización pendiente, pero falta el endpoint que:

1. Registre la aceptación de la política al onboarding (INSERT con `ip_address`, `user_agent`, `policy_version`).
2. Permita al usuario revocar (UPDATE `revoked_at = now()`).
3. Rellene `user_id_hash` en el flujo de borrado de cuenta antes de lanzar el delete en `auth.users`.

Sin este endpoint, la infraestructura queda inerte.

## De Tanda 2 (dispatch)

### dispatch_timeline.created_by — decidir NOT NULL vs CHECK condicional

Investigar en código qué eventos escriben `created_by NULL`. Si hay eventos "system",
usar `CHECK (event_type='system' OR created_by IS NOT NULL)`. Si no, `SET NOT NULL` directo.

```sql
-- Verificación previa:
SELECT event_type, count(*) AS n_null
FROM public.dispatch_timeline
WHERE created_by IS NULL
GROUP BY event_type
ORDER BY n_null DESC;
```

### FKs dispatch_* a auth.users

Las FKs hacia `auth.users` en `dispatches.created_by`, `dispatches.assigned_to`,
`dispatch_checklist.checked_by`, `dispatch_timeline.created_by`, `dispatch_comments.user_id`
y `_deprecated_dispatch_documents.uploaded_by` están todas como `NO ACTION` (default).
Esto bloquea el borrado de un usuario mientras exista cualquier registro suyo en el
dominio dispatch, lo que choca con el flujo RGPD de baja de cuenta.

Revisar en **Fase 7 (baja de cuenta)**. Decidir para cada una: `CASCADE` (elimina el
rastro del usuario, pero incumple la obligación CAU de 4 años sobre el despacho),
`SET NULL` (anonimiza el autor conservando el despacho — preferible, requiere hacer
la columna nullable en `dispatches.created_by` que hoy es NOT NULL), o mantener NO
ACTION (baja de cuenta siempre reasigna manualmente).

### dispatches.organization_id huérfano

No existe tabla `organizations` ni FK. Columna vestigial de un diseño multi-tenant
no implementado. Ninguna política RLS la usa. Decidir en una próxima iteración:
eliminar columna (`ALTER TABLE ... DROP COLUMN organization_id`) o implementar la
tabla `organizations` y migrar los despachos existentes.

### Redundancia paraaduaneros en dispatches

Cuatro columnas sobre el mismo concepto: `paraaduaneros` (jsonb), `has_paraaduaneros`
(bool), `paraaduaneros_types` (text) y `stage_paraaduaneros` (varchar). Probable
evolución de diseño. Consolidar en una iteración de refactor — sin impacto de
seguridad, sí de mantenibilidad.

### _deprecated_dispatch_documents (revisión 2026-07-23)

Eliminar tabla si la feature de adjuntos no se ha retomado. Migración de drop
sugerida:

```sql
DROP TABLE IF EXISTS public._deprecated_dispatch_documents;
```

Si se retoma la feature: crear bucket `dispatch-documents` en Supabase Storage
con RLS paralela a la tabla (acceso por `auth.uid() = created_by OR assigned_to`
del despacho padre), renombrar la tabla de vuelta a `dispatch_documents` y cambiar
`dispatch_id` a `NOT NULL`.

## De Tanda 3 (clasificación + OCR + alertas)

### classification_examples — admin UI rota

Mover mutaciones a API route con `service_role`. Carlos usa la UI rara vez.
No es urgente (no es exposición, solo funcionalidad rota).

### classification_logs — transferencia a Anthropic sin consentimiento

Resuelto parcialmente en Fase 2.5 (checkbox temporal).
Solución definitiva en Fase 4 con componente `<AIProcessingConsent />`
y registro en `user_consents` (`consent_type = 'ai_processing_classifier'`).

### invoice_extractions — transferencia a Anthropic sin consentimiento

Igual que `classification_logs`. Parche temporal en Fase 2.5.
Definitivo en Fase 4 con `consent_type = 'ai_processing_ocr_invoice'`.

### rrm_requests — sin cron de purga a 4 años

Implementar cron en Fase 8.

### monitored_codes — FK a user_profiles en lugar de auth.users

Revisar en Fase 7 (baja de cuenta) junto con resto de FKs.
Decidir si se unifica al patrón general (FK a `auth.users`) o se documenta
el porqué del desvío.

### invoice_extractions, classification_logs — crons de purga

Implementar en Fase 8:
- `invoice_extractions`: 90 días (más limpieza de soft-delete tras 7 días).
- `classification_logs`: 12 meses.
- `rrm_requests`: 4 años.

```sql
-- Ejemplo de cron (pg_cron o edge function):
DELETE FROM public.classification_logs WHERE created_at < now() - interval '12 months';
DELETE FROM public.invoice_extractions
  WHERE created_at < now() - interval '90 days'
     OR (deleted_at IS NOT NULL AND deleted_at < now() - interval '7 days');
DELETE FROM public.rrm_requests WHERE created_at < now() - interval '4 years';
```

### _deprecated_alert_notifications (revisión 2026-07-23)

Eliminar si la feature de notificaciones por cambios TARIC no se ha retomado.
Migración de drop sugerida:

```sql
DROP TABLE IF EXISTS public._deprecated_alert_notifications;
```

Si se retoma: implementar el worker (cron o edge function) que compare
`monitored_codes` contra `tariff_changes` e inserte aquí + envíe email,
renombrar de vuelta a `alert_notifications` y resolver `change_id` ON DELETE.

## De Tanda 4 (CBAM advisory)

### Pseudonimización en tablas con retención CAU/comercial 4 años

Replicar patrón de `user_consents` (`SET NULL` + `user_id_hash` + trigger anonymize) en:

- `cbam_advisory_requests` (FK CASCADE actual incumple retención CAU 4 años)
- `cbam_calculator_saves` (FK CASCADE; contiene cálculos guardados con datos comerciales)
- `cbam_monitoring_subscriptions` (FK CASCADE; suscripciones de pago, retención por obligación mercantil)

Implementar en **Fase 7** (panel de baja de cuenta). El patrón:

```sql
-- Por cada tabla:
-- 1. Cambiar FK user_id de ON DELETE CASCADE → ON DELETE SET NULL.
-- 2. Hacer user_id nullable (si no lo es ya).
-- 3. Añadir columna user_id_hash TEXT.
-- 4. Bloquear UPDATE sobre filas anonimizadas (user_id IS NULL) en RLS.
-- 5. Cron Fase 8 elimina filas con user_id IS NULL tras N años (4 aquí).
```

Nota: `cbam_advisory_report_downloads.user_id` ya usa `ON DELETE SET NULL` —
**es el patrón correcto y debe usarse como referencia** al replicarlo en las
otras 3 tablas.

### cbam_advisory_products UPDATE/DELETE en cualquier estado

Las policies `UPDATE`/`DELETE` permiten mutación mientras el `request_id`
pertenezca al usuario, sin filtrar por `status` del request padre. En
contraste, `cbam_advisory_requests.update_own_draft` solo permite UPDATE
si el status está en `('draft','intake_complete')`.

Decidir según UX deseada: ¿el cliente puede modificar productos después
de pagar? Si no, alinear las policies de productos con el bloqueo del
padre (subselect adicional sobre `cbam_advisory_requests.status`).

### CBAM advisory — granularidad de status

Los CHECK añadidos en sub-tanda 4C son una mejora pero siguen siendo
listas planas. Si el flujo crece, considerar:

- Tabla `cbam_advisory_status_transitions` que define transiciones válidas.
- O un enum tipado en lugar de `text + CHECK`.

No es urgente — el CHECK actual evita typos.

### Crons CBAM en Fase 8

- Purga de blobs huérfanos en buckets `cbam-advisory-docs` y
  `cbam-advisory-reports` (cuando se borra un request CASCADE limpia las
  filas pero los archivos quedan en Storage).
- Sincronización de Storage con BD: detectar objetos en bucket sin fila
  correspondiente en `cbam_advisory_documents` o `cbam_advisory_reports`.
- Retención 4 años post `cbam_advisory_requests.delivered_at`:
  ```sql
  -- Una vez aplicada la pseudonimización (Fase 7):
  DELETE FROM public.cbam_advisory_requests
  WHERE user_id IS NULL
    AND delivered_at < now() - interval '4 years';
  ```

### `mime_type` vs `file_type` en cbam_advisory_documents

Duplicidad. `mime_type` es el oficial, `file_type` parece ser una etiqueta
libre del usuario. Documentar la distinción en un CHECK o consolidar en
una sola columna en una refactorización futura.

### Aprendizaje del proceso de inventario

El grep de literales en código no captura mutaciones realizadas vía `service_role`
sin literal explícito (admin assigns programáticamente o vía form values dinámicos).
Para futuras tandas: cuando una tabla tenga workflow con admin, listar también los
CHECK constraints existentes en BD antes de proponer nuevos.

```sql
-- Patrón de pre-flight para tablas con workflow:
SELECT conrelid::regclass AS tabla, conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE contype = 'c'
  AND conrelid::regclass::text IN ('public.<tabla1>','public.<tabla2>',...);
```

Detectado en sub-tanda 4C tras intentar añadir un `status_check` con 5 valores
inferidos del código cuando producción ya tenía uno con 11 valores reales del
workflow (`'analyzing'`, `'pending_supplier_data'`, `'calculating'`, `'reviewing'`,
`'report_ready'`, `'pending_payment'`, etc.). También un `payment_status_check`
con `'requested'` cuando el real es `'invoiced'`. Ver INVENTARIO_CBAM_ADVISORY.md
sección "Aprendizaje del proceso (incidencia 4C)".



