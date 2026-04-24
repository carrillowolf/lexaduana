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

