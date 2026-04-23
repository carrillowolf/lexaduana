# Inventario — Dominio Usuarios / Auth / RGPD

**Tanda**: 1 / 8
**Fecha**: 2026-04-23
**Schema**: `public`
**Tablas**: `user_profiles`, `user_calculations`, `user_favorites`, `user_alert_subscriptions`, `user_consents`

> Fuente: `information_schema` + `pg_catalog` de Supabase project `jsmvaeseyzbyryzwgyxc` (lexaduana, eu-west-3) + grep del repo.

---

## user_profiles

**Filas**: 274

**Propósito inferido del código**: Extensión de `auth.users` con datos de facturación y cuotas del plan. Se consulta en `app/monitor/page.js:55` y `app/monitor/dashboard/page.js:40` para leer `plan_type` y `max_monitors` del usuario autenticado antes de mostrar el panel de monitorización TARIC. No se encontró ningún endpoint de la app que la escriba explícitamente — la fila se crea probablemente por trigger en `auth.users` (no presente en el repo, ver "Versionada en repo").

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | — |
| email | varchar | NO | — |
| company_name | varchar | SÍ | — |
| plan_type | varchar | SÍ | `'free'` |
| max_monitors | int4 | SÍ | `5` |
| created_at | timestamp | SÍ | `now()` |
| updated_at | timestamp | SÍ | `now()` |

**Datos personales (PII)**: **Sí** — `email` (identificador directo), `company_name` (puede ser dato de autónomo = PII si es nombre propio).

**Datos comerciales del usuario**: No directamente. Indica plan contratado (`plan_type`) pero no incluye importes ni mercancías.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Users can manage own profile | ALL | `auth.uid() = id` | — |
| Users can view own profile | SELECT | `auth.uid() = id` | — |
| Users can update own profile | UPDATE | `auth.uid() = id` | — |
| Users update own | UPDATE | `auth.uid() = id` | — |

> ⚠️ Hay 4 políticas, dos de ellas (`Users can update own profile` y `Users update own`) son **duplicadas** sobre UPDATE con la misma expresión. Además la política `Users can manage own profile` (ALL) ya cubre SELECT y UPDATE, haciendo redundantes las otras tres. Sin impacto de seguridad (todas filtran por `auth.uid() = id`), pero es ruido de configuración.

**Foreign keys**:
| Columna | Referencia |
|---|---|
| id | `auth.users(id)` (sin ON DELETE — ver Observaciones) |

**Índices**:
- `user_profiles_email_key` — UNIQUE sobre `(email)`

**Triggers**: Ninguno en `public`. (Posible trigger en `auth.users` que crea la fila, fuera del schema `public` y no inspeccionado en esta tanda.)

**Versionada en repo**: **No**. No existe directorio `supabase/migrations/`. Ningún `CREATE TABLE` para `user_profiles` en `scripts/*.sql`. La tabla solo se consulta desde código de app; su definición vive únicamente en Supabase.

**Retención sugerida**: Vida de la cuenta. Borrar o anonimizar (p.ej. email → `borrado@anon.local`) al cerrar cuenta; conservar `id` y `plan_type` si hay obligaciones de facturación (hasta 4 años post-cierre por normativa fiscal española).

**Observaciones**:
- FK a `auth.users(id)` **sin `ON DELETE CASCADE`**. Si Carlos borra un usuario desde Supabase Auth, la fila de `user_profiles` se queda huérfana (o falla el delete por restricción NO ACTION por defecto). Contrasta con las otras 4 tablas del dominio, que sí cascadean.
- Políticas RLS redundantes (ver tabla arriba).
- Solo índice único sobre `email` y el pkey sobre `id` — suficiente para los patrones de consulta actuales.

---

## user_calculations

**Filas**: 255

**Propósito inferido del código**: Persistencia del historial de cálculos que el usuario guarda desde la calculadora TARIC (Nivel 2 freemium). Endpoints:

- `app/api/calculations/save/route.js:40` — INSERT al guardar un cálculo individual.
- `app/api/calculations/history/route.js:26` — SELECT paginado para el listado histórico del usuario.
- `app/api/bulk-calculate/route.js:149` — INSERT masivo cuando el usuario sube un Excel de múltiples partidas (usa `is_bulk`, `bulk_batch_id`, `bulk_batch_name`).

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| user_id | uuid | SÍ | — |
| hs_code | varchar | NO | — |
| cif_value | numeric | NO | — |
| country_code | varchar | NO | — |
| country_name | varchar | SÍ | — |
| duty_rate | numeric | SÍ | — |
| duty_amount | numeric | SÍ | — |
| vat_rate | numeric | SÍ | — |
| vat_type | varchar | SÍ | — |
| vat_amount | numeric | SÍ | — |
| total_amount | numeric | SÍ | — |
| description | text | SÍ | — |
| tags | text[] | SÍ | — |
| notes | text | SÍ | — |
| created_at | timestamp | SÍ | `now()` |
| updated_at | timestamp | SÍ | `now()` |
| is_bulk | boolean | SÍ | `false` |
| bulk_batch_id | uuid | SÍ | — |
| bulk_batch_name | varchar | SÍ | — |

**Datos personales (PII)**: No (los datos son de operaciones, no identifican a la persona salvo por el `user_id`).

**Datos comerciales del usuario**: **Sí** — `cif_value` (valor en aduana), `hs_code` (partida arancelaria), `country_code` (país de origen), `duty_amount`/`vat_amount`/`total_amount` (importes calculados), `description`, `notes`, `bulk_batch_name`. Es un conjunto sensible: revela proveedores y volúmenes de importación del usuario.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Users can view own calculations | SELECT | `auth.uid() = user_id` | — |
| Users can insert own calculations | INSERT | — | `auth.uid() = user_id` |
| Users can update own calculations | UPDATE | `auth.uid() = user_id` | — |
| Users can delete own calculations | DELETE | `auth.uid() = user_id` | — |

> Políticas explícitas por comando, restringidas a rol `authenticated` (no `public`). Configuración correcta y sin duplicados.

**Foreign keys**:
| Columna | Referencia |
|---|---|
| user_id | `auth.users(id) ON DELETE CASCADE` |

**Índices**:
- `idx_user_calculations_user` — btree `(user_id)`
- `idx_user_calculations_hs` — btree `(hs_code)`
- `idx_user_calculations_date` — btree `(created_at DESC)`
- `idx_user_calculations_bulk_batch` — btree `(bulk_batch_id) WHERE bulk_batch_id IS NOT NULL` (parcial)

**Triggers**: Ninguno. `updated_at` no se actualiza automáticamente (sólo el default `now()` en INSERT).

**Versionada en repo**: **No**. Buscado `CREATE TABLE ... user_calculations` en `scripts/*.sql` — sin resultados. El único fichero con nombre relacionado es `scripts/cbam-user-calculations-deprecated-drop.sql`, que referencia una tabla CBAM diferente ya deprecada, no esta.

**Retención sugerida**: Vida de cuenta. El usuario puede borrar sus cálculos con la política DELETE. Al cerrar cuenta, el `ON DELETE CASCADE` limpia automáticamente. Si se quiere anonimizar en lugar de borrar (para estadísticas agregadas), sustituir `user_id` por NULL y mantener el resto; pero actualmente `user_id` es nullable, lo que permite filas huérfanas — ver Observaciones.

**Observaciones**:
- **`user_id` es nullable** pese a tener FK con `ON DELETE CASCADE`. Permite insertar cálculos sin usuario. Probablemente vestigio; revisar si alguna ruta inserta sin `user_id`.
- `updated_at` no tiene trigger `BEFORE UPDATE`; se quedará con el valor de creación salvo que el endpoint lo setee manualmente.
- `description` y `notes` son `text` libre: el usuario puede escribir ahí cualquier cosa, potencialmente datos de terceros (nombre de proveedor, referencias a facturas). A efectos RGPD tratar como potencial PII de terceros.

---

## user_favorites

**Filas**: 0

**Propósito inferido del código**: Guardar combinaciones HS + país + CIF favoritas del usuario para acceso rápido desde la calculadora TARIC. Único endpoint: `app/api/favorites/route.js` — línea 28 (GET), línea 71 (POST), línea 124 (DELETE).

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | `uuid_generate_v4()` |
| user_id | uuid | SÍ | — |
| hs_code | varchar | NO | — |
| country_code | varchar | SÍ | — |
| cif_value | numeric | SÍ | — |
| nickname | varchar | SÍ | — |
| notes | text | SÍ | — |
| created_at | timestamp | SÍ | `now()` |
| updated_at | timestamp | SÍ | `now()` |

**Datos personales (PII)**: No directamente.

**Datos comerciales del usuario**: **Sí** — `hs_code`, `country_code`, `cif_value` y especialmente `nickname`/`notes` libres. Revela intereses de importación del usuario.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Users can view own favorites | SELECT | `auth.uid() = user_id` | — |
| Users can insert own favorites | INSERT | — | `auth.uid() = user_id` |
| Users can update own favorites | UPDATE | `auth.uid() = user_id` | — |
| Users can delete own favorites | DELETE | `auth.uid() = user_id` | — |

**Foreign keys**:
| Columna | Referencia |
|---|---|
| user_id | `auth.users(id) ON DELETE CASCADE` |

**Índices**:
- `idx_user_favorites_user_id` — btree `(user_id)`
- `idx_user_favorites_hs_code` — btree `(hs_code)`
- `user_favorites_user_id_hs_code_country_code_key` — UNIQUE `(user_id, hs_code, country_code)` (evita duplicados)

**Triggers**: Ninguno.

**Versionada en repo**: **No**. No hay `CREATE TABLE user_favorites` en `scripts/*.sql`.

**Retención sugerida**: Vida de cuenta. `ON DELETE CASCADE` limpia al cerrar cuenta. Alternativa (poco útil aquí) mantener anónimos: no aporta valor estadístico, mejor borrar.

**Observaciones**:
- `user_id` nullable con FK CASCADE — mismo patrón que `user_calculations`. Permite filas huérfanas si se inserta sin `user_id` (tabla vacía hoy, 0 filas, así que es hipotético).
- Usa `uuid_generate_v4()` mientras que `user_calculations`/`user_consents` usan `gen_random_uuid()`. Requiere extensión `uuid-ossp`; inconsistencia menor de estilo pero funcional.

---

## user_alert_subscriptions

**Filas**: 0

**Propósito inferido del código**: Sistema de suscripciones a alertas de cambios en medidas TARIC por combinación HS + país. **No se encontró ningún uso en el código de la app** (`app/`, `components/`, `lib/`) — tabla huérfana a fecha de hoy. Relacionada por nombre con `alert_notifications` y `measure_alerts` (otro dominio, no inventariadas en esta tanda), pero el flujo end-to-end desde UI no está implementado.

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | int4 | NO | `nextval('user_alert_subscriptions_id_seq')` |
| user_id | uuid | SÍ | — |
| subscription_type | varchar | NO | — |
| hs_code | varchar | SÍ | — |
| country_code | varchar | SÍ | — |
| active | boolean | SÍ | `true` |
| created_at | timestamp | SÍ | `now()` |

**Datos personales (PII)**: No.

**Datos comerciales del usuario**: Parcialmente — las combinaciones HS/país revelan intereses de monitorización.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Users see own subscriptions | ALL | `auth.uid() = user_id` | — |

> Una sola política ALL. No hay `WITH CHECK` explícito; PostgreSQL deriva el `WITH CHECK` del `USING` para INSERT/UPDATE, así que es correcto, pero explicitar `WITH CHECK (auth.uid() = user_id)` es más claro.

**Foreign keys**:
| Columna | Referencia |
|---|---|
| user_id | `auth.users(id) ON DELETE CASCADE` |

**Índices**:
- `idx_user_subs_user` — btree `(user_id)`
- `idx_user_subs_hs` — btree `(hs_code)`
- `user_alert_subscriptions_user_id_subscription_type_hs_code__key` — UNIQUE `(user_id, subscription_type, hs_code, country_code)`

**Triggers**: Ninguno.

**Versionada en repo**: **No**.

**Retención sugerida**: Vida de cuenta. Si la feature queda definitivamente descartada, valorar DROP antes de entrar en producción (la tabla nunca se ha escrito: 0 filas).

**Observaciones**:
- **Tabla sin código cliente** — ni endpoints ni componentes la tocan. Candidata a eliminar o a documentar como "reservada para futura feature de alertas por suscripción". Decisión pendiente (ver Hallazgos).
- Usa `int4` + `sequence` como pkey, a diferencia del resto del dominio que usa `uuid`. Inconsistencia de estilo.
- `subscription_type` es `varchar` libre sin CHECK constraint ni enum — sin código cliente no sabemos qué valores se esperan.

---

## user_consents

**Filas**: 0

**Propósito inferido del código**: Registro de consentimientos RGPD (política de privacidad, cookies, etc.) con trazabilidad — qué versión aceptó cada usuario, cuándo, desde qué IP y con qué user-agent, y cuándo lo revocó. **No se encontró ningún uso en el código de la app** (`app/`, `components/`, `lib/`). Según el contexto del proyecto, la tabla se creó en la "Fase 1.1" pero la integración (endpoint de aceptación y flow de UI) aún no está implementada.

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| user_id | uuid | NO | — |
| consent_type | text | NO | — |
| policy_version | text | NO | — |
| accepted | boolean | NO | — |
| accepted_at | timestamptz | NO | `now()` |
| ip_address | inet | SÍ | — |
| user_agent | text | SÍ | — |
| revoked_at | timestamptz | SÍ | — |

**Datos personales (PII)**: **Sí** — `ip_address` (dato personal según RGPD incluso cuando es IP pública), `user_agent` (cuasi-identificador por fingerprint).

**Datos comerciales del usuario**: No.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Users can view their own consents | SELECT | `auth.uid() = user_id` | — |
| Users can insert their own consents | INSERT | — | `auth.uid() = user_id` |
| Users can update their own consents (for revocation) | UPDATE | `auth.uid() = user_id` | `auth.uid() = user_id` |

> Sin política DELETE — correcto por diseño: el usuario no puede borrar su histórico de consentimientos, solo revocarlo (seteando `revoked_at`). Requisito típico RGPD para demostrabilidad del consentimiento.

**Foreign keys**:
| Columna | Referencia |
|---|---|
| user_id | `auth.users(id) ON DELETE CASCADE` |

**Índices**:
- `idx_user_consents_user_id` — btree `(user_id)`
- `idx_user_consents_type_version` — btree `(consent_type, policy_version)`
- `unique_active_consent` — UNIQUE `(user_id, consent_type, policy_version, revoked_at) NULLS NOT DISTINCT` — impide tener dos consentimientos activos (revoked_at NULL) sobre la misma política.

**Triggers**: Ninguno.

**Versionada en repo**: **No**. La tabla existe en Supabase (creada en Fase 1.1) pero no hay archivo SQL que la defina en el repo.

**Retención sugerida**: **Vida de cuenta + 3 años tras baja** (coincide con el comentario que Carlos apuntó en `cbam_monitoring_subscriptions` y es el plazo habitual para demostrar el consentimiento ante una reclamación AEPD). El `ON DELETE CASCADE` borraría la evidencia al eliminar el usuario → considerar cambiar a `ON DELETE SET NULL` o promover el borrado a anonimización (ver Hallazgos).

**Observaciones**:
- **`ON DELETE CASCADE` vs. necesidad de evidencia**: si se borra el `auth.users`, se borran los consentimientos, lo cual contradice la retención de 3 años post-baja. Considerar migrar a `ON DELETE SET NULL` + anonimización del `user_id` conservando la fila.
- **Sin integración en código** — la tabla está lista pero nadie escribe en ella todavía. Fase 1.1 creó el esquema; falta Fase 1.2 (endpoint + modal de aceptación).
- Índice `unique_active_consent` con `NULLS NOT DISTINCT` es Postgres 15+. Correcto y necesario para que el UNIQUE funcione con `revoked_at = NULL`.
- `consent_type` es `text` libre. Recomendable añadir CHECK constraint o enum (`'privacy_policy'`, `'cookies_analytics'`, `'marketing'`, etc.) cuando se implemente la Fase 1.2.

---

## Hallazgos de la tanda

### 🚨 Crítico (requieren decisión antes de tanda 2)

Ninguno. Las 5 tablas tienen RLS habilitada y las políticas filtran correctamente por `auth.uid()`. No hay fugas evidentes de PII ni de datos comerciales entre usuarios.

### ⚠️ Alto — revisar pronto

1. **`user_consents` con `ON DELETE CASCADE` contradice la retención RGPD de 3 años post-baja**. Al borrar el usuario desde `auth.users` se pierde la evidencia del consentimiento. Opciones: (a) cambiar FK a `ON DELETE SET NULL` y anonimizar; (b) no borrar nunca `auth.users`, solo desactivar. **Decisión tuya.**
2. **`user_profiles.id` FK sin `ON DELETE` explícito** — es `NO ACTION` por defecto, lo que impide borrar `auth.users` si hay perfil. Inconsistente con las otras 4 tablas (todas CASCADE). O bien ponemos CASCADE para mantener coherencia, o aceptamos que el perfil es la pieza que bloquea el borrado y hay que limpiarla a mano.
3. **`user_consents` y `user_alert_subscriptions` no tienen código cliente**. `user_consents` es esperable (Fase 1.2 pendiente). `user_alert_subscriptions` tiene 0 filas y nadie la toca → decidir si se deja reservada o se elimina.

### 🟡 Medio

4. **Ninguna de las 5 tablas está versionada en el repo**. No existe `supabase/migrations/`. Los `scripts/*.sql` cubren otros dominios (bloque1/2/3, CBAM) pero no el dominio Usuarios. Sugerencia: crear `scripts/users-schema.sql` con los `CREATE TABLE` actuales y las políticas, para poder reconstruir el dominio en un entorno nuevo.
5. **`user_id` nullable en `user_calculations`, `user_favorites`, `user_alert_subscriptions`** pese a FK CASCADE. Permite huérfanos. Recomendación: `ALTER COLUMN user_id SET NOT NULL` tras verificar que no hay filas con `user_id IS NULL`.
6. **Políticas RLS redundantes en `user_profiles`** (4 políticas, de las cuales 3 son redundantes con la `ALL`). Limpiar para reducir ruido.

### 🟢 Bajo — cosméticos

7. Inconsistencia de generador UUID: `user_favorites` usa `uuid_generate_v4()` (requiere extensión `uuid-ossp`) mientras que el resto usa `gen_random_uuid()` (nativo pgcrypto desde PG13).
8. `user_alert_subscriptions` usa `int4 + sequence` como pkey, único caso en el dominio.
9. `user_calculations.updated_at` sin trigger `BEFORE UPDATE` — no se refresca en UPDATEs salvo que el endpoint lo setee.
10. `consent_type` y `subscription_type` son `text`/`varchar` libres sin CHECK ni enum.

### Datos para la política de privacidad (resumen PII por tabla)

| Tabla | PII directa | PII indirecta / datos comerciales | Retención sugerida |
|---|---|---|---|
| `user_profiles` | `email`, `company_name` | `plan_type` | Vida cuenta; conservar facturación 4 años |
| `user_calculations` | — | `cif_value`, `hs_code`, `country_code`, notas libres | Vida cuenta; borrado en cascada |
| `user_favorites` | — | `hs_code`, `country_code`, `cif_value`, `nickname`, notas | Vida cuenta; borrado en cascada |
| `user_alert_subscriptions` | — | `hs_code`, `country_code` | Vida cuenta; borrado en cascada |
| `user_consents` | `ip_address`, `user_agent` | — | **Vida cuenta + 3 años** (evidencia RGPD) |
