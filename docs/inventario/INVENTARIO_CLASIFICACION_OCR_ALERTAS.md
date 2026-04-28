# Inventario — Dominio Clasificación IA + OCR + Alertas

**Tanda**: 3 / 8 (parcial — sub-tanda 3A)
**Fecha**: 2026-04-23
**Schema**: `public`
**Tablas esta sub-tanda**: `classification_logs`, `classification_examples`, `invoice_extractions`, `rrm_requests`
**Pendientes (sub-tanda 3B)**: `monitored_codes`, `alert_notifications`

> Fuente: `information_schema` + `pg_catalog` + `storage.buckets` + grep del repo + lectura de endpoints relevantes.

---

## classification_logs

> ℹ️ **Sub-tanda 3C (2026-04-23)** — la migración
> [`20260423140000_classif_ocr_alertas_fixes.sql`](../../supabase/migrations/20260423140000_classif_ocr_alertas_fixes.sql)
> (Bloque 1) cambia `user_id` a `NOT NULL` tras verificar 0 huérfanos
> (752/752 filas con `user_id` válido). La columna `Null` de esta ficha
> refleja el estado previo. La transferencia a Anthropic sin consentimiento
> queda como pendiente en `BACKLOG_PRIVACIDAD.md` (parche en Fase 2.5,
> definitivo en Fase 4).

**Filas**: 732 *(en el momento del inventario; 752 en el check de 3C, ritmo de ~20 nuevas/h)*

**Propósito inferido del código**: Histórico de llamadas al clasificador IA de partidas arancelarias. Cada vez que un usuario pide clasificar un producto en `app/api/classify-product/route.js:361`, la API guarda la descripción enviada (truncada a 500 caracteres), el código HS sugerido por Claude, la confianza y el modelo usado. Sirve para estadística y límites de uso diario. **La descripción del usuario sale hacia Anthropic (EEUU)** antes de guardarse.

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | `uuid_generate_v4()` |
| user_id | uuid | SÍ | — |
| description | text | NO | — |
| suggested_code | varchar | SÍ | — |
| confidence | int4 | SÍ | — |
| model_used | varchar | SÍ | — |
| created_at | timestamp | SÍ | `now()` |

**Datos personales (PII)**: Indirecto — `description` es texto libre escrito por el usuario. Puede contener nombres de producto, marcas, y ocasionalmente datos de terceros si el usuario copia-pega descripciones de facturas o emails.

**Datos comerciales del usuario**: **Sí** — la combinación `description + suggested_code + user_id + created_at` permite reconstruir el patrón de productos que importa cada usuario.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Users can view own classifications | SELECT | `auth.uid() = user_id` | — |
| Users can insert own classifications | INSERT | — | `auth.uid() = user_id` |

> Sin UPDATE ni DELETE para el usuario. El log es inmutable desde el cliente.

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| user_id | `auth.users(id)` | **CASCADE** |

**Índices**:
- `idx_classification_logs_user` — btree `(user_id)`
- `idx_classification_logs_date` — btree `(created_at DESC)`

**Triggers**: Ninguno.

**Versionada en repo**: **No**. Sin `CREATE TABLE` en `scripts/` ni `supabase/migrations/`.

**Retención sugerida**: **12 meses** (según política de privacidad del proyecto). Al cumplir 12 meses, borrar. `CASCADE` limpia al cerrar cuenta. Requiere cron de purga (no implementado — ver Fase 8 en `BACKLOG_PRIVACIDAD.md`).

**Observaciones**:
- **`user_id` nullable** pese a FK `CASCADE`. Permite logs huérfanos. La política INSERT exige `auth.uid() = user_id`, así que de facto no debería haber nulos, pero el esquema lo permite. Cambiar a `NOT NULL`.
- **Transferencia a Anthropic (EEUU)**: la `description` se envía al API de Anthropic antes del INSERT. Requiere consentimiento registrado en `user_consents` con `consent_type = 'ai_processing_classifier'` (ya previsto en el CHECK del baseline retroactivo). **Falta endpoint de aceptación (Fase 1.2)**.
- Sin cron de purga a 12 meses — 732 filas actuales, crece con el uso.
- `description` es `text` sin longitud máxima en el esquema; el endpoint sí trunca a 500. Considerar `CHECK (char_length(description) <= 500)` para ser consistente.
- `model_used` es `varchar` libre — hoy se escribe `'claude-sonnet-4-5'` a pelo (hardcoded). Cuando se migre al siguiente modelo (Claude 4.6/4.7) hay que recordar actualizar el string en `classify-product/route.js:367`.

---

## classification_examples

**Filas**: 1

**Propósito inferido del código**: **Training data / few-shot global** para el clasificador IA. Filas tipo `keywords → correct_code` + `incorrect_codes[]` + `explanation`, que `app/api/classify-product/route.js:167` inyecta en el prompt de Claude para mejorar la precisión. Gestionable desde `app/admin/clasificaciones/page.js` (SELECT/INSERT/UPDATE/DELETE). No hay relación con usuarios — son ejemplos globales compartidos.

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | int4 | NO | `nextval('...')` |
| keywords | text | NO | — |
| correct_code | varchar | NO | — |
| correct_description | text | SÍ | — |
| incorrect_codes | text[] | SÍ | — |
| explanation | text | SÍ | — |
| created_by | text | SÍ | `'admin'` |
| created_at | timestamp | SÍ | `now()` |
| active | bool | SÍ | `true` |

**Datos personales (PII)**: No.

**Datos comerciales del usuario**: No — son ejemplos curados por admin, no datos de usuarios.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Allow public read classification_examples | SELECT | `true` | — |

> 🚨 **Inconsistencia crítica**: solo existe política `SELECT`. La UI `app/admin/clasificaciones/page.js` es un componente cliente que intenta INSERT/UPDATE/DELETE sobre esta tabla usando `createClientComponentClient()` (sesión de usuario authenticated). Con RLS habilitada **sin policies de escritura, esos intentos fallan silenciosamente o con error desde el cliente**. La única fila existente debe haberse insertado manualmente desde el SQL Editor con `service_role`. La UI de admin está de facto **rota para mutaciones**.

**Foreign keys**: Ninguna.

**Índices**: Solo pkey.

**Triggers**: Ninguno.

**Versionada en repo**: **No**.

**Retención sugerida**: Indefinida — son datos maestros de configuración del clasificador. No PII.

**Observaciones**:
- 🚨 UI de admin sin vía de escritura válida (ver RLS arriba). Opciones: (a) mover la gestión a un route handler en `app/api/admin/examples/route.ts` que use `service_role`; (b) añadir policies de mutación restringidas a emails admin (más complejo en Postgres puro, suele requerir una función `is_admin(uid)`); (c) asumir que solo se gestiona desde SQL Editor y eliminar la UI.
- `created_by` es `text` con default `'admin'` — no es FK a `auth.users`. Los admins actuales (`ccarrillodelolmo@gmail.com` según `app/admin/clasificaciones/page.js:9`) no quedan registrados con su `uid`.
- `active = false` permite deprecar ejemplos sin borrarlos. Bien.
- Sin índice sobre `active` — no es problemático con 1 fila, pero si crece conviene añadir `idx_classification_examples_active WHERE active = true`.

---

## invoice_extractions

**Filas**: 6

**Propósito inferido del código**: Histórico de extracciones OCR+IA de facturas comerciales. `app/api/extract-invoice/route.js:300` recibe un PDF/imagen, lo envía a Claude para extraer datos estructurados (invoice_number, supplier, lines, importes), **no persiste el archivo original**, y guarda únicamente el JSON parseado + issues de validación. Endpoints auxiliares: `app/api/extract-invoice/history/route.js` (listado). Soft-delete vía `deleted_at`.

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| user_id | uuid | **NO** | — |
| file_name | text | SÍ | — |
| file_mime | text | SÍ | — |
| invoice_number | text | SÍ | — |
| supplier_name | text | SÍ | — |
| supplier_country | text | SÍ | — |
| currency | text | SÍ | — |
| incoterm | text | SÍ | — |
| total_amount | numeric | SÍ | — |
| lines_count | int4 | SÍ | `0` |
| extracted_data | jsonb | **NO** | — |
| validation_issues | jsonb | SÍ | `'[]'::jsonb` |
| calculation_results | jsonb | SÍ | — |
| tokens_used | int4 | SÍ | `0` |
| deleted_at | timestamptz | SÍ | — |
| created_at | timestamptz | SÍ | `now()` |
| updated_at | timestamptz | SÍ | `now()` |

**Datos personales (PII)**: **Sí, indirectamente masivo** — `extracted_data` (jsonb) contiene el JSON completo parseado por la IA: nombre de proveedor, dirección, número de factura, líneas con descripción de productos, importes. Es una copia estructurada del contenido comercial de la factura, incluyendo nombres/razones sociales de terceros proveedores.

**Datos comerciales del usuario**: **Sí, alto volumen** — facturas comerciales completas (solo parseadas, no el PDF).

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| invoice_extractions_select_own | SELECT | `user_id = auth.uid() AND deleted_at IS NULL` | — |
| invoice_extractions_insert_own | INSERT | — | `user_id = auth.uid()` |
| invoice_extractions_update_own | UPDATE | `user_id = auth.uid()` | `user_id = auth.uid()` |
| invoice_extractions_delete_own | DELETE | `user_id = auth.uid()` | — |

> Separación limpia de SELECT/INSERT/UPDATE/DELETE para permitir el soft-delete (UPDATE que pone `deleted_at`) sin que el predicado del SELECT lo impida. Correcto.

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| user_id | `auth.users(id)` | **CASCADE** |

**Índices**:
- `idx_invoice_extractions_user` — btree `(user_id) WHERE deleted_at IS NULL` (parcial, solo filas activas)
- `idx_invoice_extractions_created` — btree `(created_at DESC)`

**Triggers**:
- `trg_invoice_extractions_updated_at` — BEFORE UPDATE → `set_invoice_extractions_updated_at()` (refresca `updated_at`).

**Versionada en repo**: **Sí** — `scripts/invoice-extractions-schema.sql` (109 líneas). **Única tabla del dominio 3 versionada en el repo.** Contiene definición, índices, RLS, policies, trigger y función.

**Retención sugerida**: **90 días** (según la cabecera del propio schema: "Limpieza automática recomendada a 90 días"). El soft-delete (`deleted_at`) no es hard-delete — el usuario ve "borrado" pero la fila persiste. **Falta cron que:**
1. Limpie filas con `deleted_at < now() - interval '7 days'` (grace period tras el soft-delete).
2. Limpie filas con `created_at < now() - interval '90 days'`.

**Observaciones**:
- **Archivo original NO persistido** — ni en la tabla ni en Storage. Confirma la política de minimización: el PDF sale hacia Anthropic, se parsea, y se olvida. Muy correcto desde RGPD.
- **Transferencia a Anthropic (EEUU)** del contenido del PDF (en base64 según la librería). Requiere consentimiento con `consent_type = 'ai_processing_ocr_invoice'` (ya previsto en el CHECK). Falta integración Fase 1.2.
- `extracted_data` (jsonb) contiene datos del proveedor que **no son del usuario** (son terceros). Retención 90 días es coherente con esta posición.
- **No hay cron de purga** — proyectado pero no implementado. **Crítico para cumplir los 90 días prometidos** en la política.
- `file_mime` y `file_name` se guardan truncados a 200 chars desde el código — sin CHECK en DB, mismo patrón que `classification_logs.description`.
- El handler hace `INSERT ... try/catch` silencioso ("Si no existe la tabla aún, no romper el flujo", `app/api/extract-invoice/route.js:322`). Con la tabla ya creada desde hace tiempo, este `catch` es defensivo y no debería dispararse.
- Política de SELECT filtra `deleted_at IS NULL` — el endpoint `history` no necesita añadir ese filtro explícitamente. Coincidencia buena entre RLS y lógica.

---

## rrm_requests

> ℹ️ **Sub-tanda 3C (2026-04-23)** — la migración
> [`20260423140000_classif_ocr_alertas_fixes.sql`](../../supabase/migrations/20260423140000_classif_ocr_alertas_fixes.sql)
> (Bloque 1) cambia `user_id` a `NOT NULL` tras verificar 0 huérfanos
> (1/1 fila con `user_id` válido). La columna `Null` de esta ficha
> refleja el estado previo. El cron de purga a 4 años queda en
> `BACKLOG_PRIVACIDAD.md` (Fase 8).

**Filas**: 1

**Propósito inferido del código**: Histórico de solicitudes RRM (Request for Reimbursement — solicitud de rectificación o devolución de aranceles). El endpoint `app/api/rrm/generate-docx/route.js` genera un DOCX al vuelo con los datos de la fila. **No se guarda XML crudo ni el DOCX** — la fila contiene solo datos estructurados parseados/capturados vía formulario.

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| user_id | uuid | SÍ | — |
| request_type | text | NO | — |
| case_type | text | NO | — |
| legal_basis | text | NO | — |
| mrn | text | SÍ | — |
| customs_office | text | SÍ | — |
| importer_eori | text | SÍ | — |
| importer_name | text | SÍ | — |
| representative_eori | text | SÍ | — |
| representative_name | text | SÍ | — |
| customs_value | numeric | SÍ | — |
| commodity_code | text | SÍ | — |
| goods_description | text | SÍ | — |
| country_of_origin | text | SÍ | — |
| preference_declared | text | SÍ | — |
| corrected_data | jsonb | NO | `'{}'::jsonb` |
| duties_declared | jsonb | SÍ | — |
| duties_corrected | jsonb | SÍ | — |
| amount_to_recover | numeric | SÍ | — |
| motivos_text | text | SÍ | — |
| status | text | NO | `'draft'` |
| generated_at | timestamptz | SÍ | — |
| created_at | timestamptz | NO | `now()` |
| updated_at | timestamptz | NO | `now()` |

**Datos personales (PII)**: **Sí** — `importer_name`, `importer_eori`, `representative_name`, `representative_eori` son identificadores directos de operadores económicos (típicamente empresas, pero autónomos también). EORI es un identificador fiscal comunitario asociado a NIF/CIF.

**Datos comerciales del usuario**: **Sí, alto** — expediente RRM completo: MRN (referencia de DUA), valor aduanero, partida arancelaria, origen, importes declarados vs. corregidos, motivos textuales. Muy sensible.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| rrm_requests_owner_all | ALL | `auth.uid() = user_id` | `auth.uid() = user_id` |

> Una única política ALL — compacta y correcta.

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| user_id | `auth.users(id)` | **CASCADE** |

**Índices**:
- `idx_rrm_requests_user_id` — btree `(user_id)`
- `idx_rrm_requests_created_at` — btree `(created_at DESC)`
- `idx_rrm_requests_mrn` — btree `(mrn)`

**Triggers**:
- `trg_rrm_requests_updated_at` — BEFORE UPDATE → `set_updated_at()` (función genérica compartida con otras tablas).

**Versionada en repo**: **No**.

**Retención sugerida**: **4 años post-presentación** (coherente con obligaciones aduaneras CAU y con el ciclo de reclamación ante AEAT). El `CASCADE` limpia al cerrar cuenta; si se quiere conservar defensivamente evidencia de la solicitud, valorar `ON DELETE SET NULL + user_id_hash` (patrón `user_consents`).

**Observaciones**:
- **`user_id` nullable** pese a FK `CASCADE`. Inconsistente con la política ALL que exige `auth.uid() = user_id`. Cambiar a `NOT NULL`.
- **NO se persiste XML de DUA crudo ni el DOCX generado**. El DOCX se genera al vuelo por `app/api/rrm/generate-docx/route.js` y se envía al cliente. Bien desde minimización.
- **No hay cron de purga** — necesario a los 4 años si se confirma esa retención.
- Campo `status` es `text` libre con default `'draft'`. Otros valores esperados (`'submitted'`, `'approved'`, etc.) no están en CHECK. Añadir enum o CHECK.
- Redundancia: `commodity_code` vs `goods_description` (columnas individuales) + `corrected_data` (jsonb genérico). Revisar si el jsonb cubre todo y los campos individuales son denormalización para filtrado.
- Sin relación con `dispatches` pese a que conceptualmente un RRM se origina desde un DUA ya despachado. Hoy es un flujo standalone; en el futuro podría añadirse `dispatch_id` opcional.

---

<!-- Sub-tanda 3B completada -->

## monitored_codes

> ℹ️ **Sub-tanda 3C (2026-04-23)** — la migración
> [`20260423140000_classif_ocr_alertas_fixes.sql`](../../supabase/migrations/20260423140000_classif_ocr_alertas_fixes.sql)
> aplica dos cambios:
> - **Bloque 1**: `user_id` → `NOT NULL` (verificado 0 huérfanos sobre 0 filas).
> - **Bloque 2**: `DROP POLICY "Users can view own monitors"` (duplicada con
>   `"Users can manage own monitors"` que ya cubre SELECT como ALL).
>
> La FK a `user_profiles` (en lugar de `auth.users`) **se mantiene** —
> decisión movida a `BACKLOG_PRIVACIDAD.md` para Fase 7.

**Filas**: 0 (en el momento del inventario)

**Propósito inferido del código**: Códigos TARIC que el usuario desea monitorizar para recibir alertas cuando cambien. Usada en `app/monitor/dashboard/page.js` (líneas 58 SELECT, 81 INSERT, 118 DELETE — no hay UPDATE). Límite por plan enforced por trigger `enforce_monitor_limit`.

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | int4 | NO | `nextval('...')` |
| user_id | uuid | SÍ | — |
| goods_code | varchar | NO | — |
| product_description | text | SÍ | — |
| last_known_duty | numeric | SÍ | — |
| last_checked | date | SÍ | — |
| notification_enabled | bool | SÍ | `true` |
| created_at | timestamp | SÍ | `now()` |

**Datos personales (PII)**: No directamente.

**Datos comerciales del usuario**: Sí — `goods_code` + `product_description` revela productos de interés del usuario.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Users can manage own monitors | ALL | `auth.uid() = user_id` | — |
| Users can view own monitors | ALL | `auth.uid() = user_id` | — |

> ⚠️ Dos políticas `ALL` idénticas — duplicación. Ninguna incluye `WITH CHECK` explícito (Postgres lo deriva del USING para INSERT/UPDATE, funcionalmente OK).

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| user_id | **`user_profiles(id)`** | **CASCADE** |

> Única tabla del inventario con FK a `user_profiles` en vez de a `auth.users`. Dado que `user_profiles.id = auth.users.id` es 1:1, el efecto de RLS (`auth.uid() = user_id`) es equivalente. La diferencia real: borrar un `auth.users` deja el `user_profiles` intacto (su FK es `NO ACTION` — ver Tanda 1), y por ende los `monitored_codes` no se borran hasta que se borre manualmente `user_profiles`. Inconsistencia de patrón.

**Índices**:
- `idx_monitored_user` — btree `(user_id)`
- `idx_monitored_code` — btree `(goods_code)`
- `monitored_codes_user_id_goods_code_key` — UNIQUE `(user_id, goods_code)` (evita duplicar monitor)

**Triggers**:
- `enforce_monitor_limit` — BEFORE INSERT → `check_monitor_limit()` (SECURITY INVOKER, plpgsql). Cuenta filas actuales del usuario, lee `max_monitors` de `user_profiles` y `RAISE EXCEPTION 'Monitor limit reached for this plan'` si se excede. Útil para cuota por plan (`free` = 5, planes pagos superiores).

**Versionada en repo**: **No**.

**Retención sugerida**: Vida de cuenta. `CASCADE` desde `user_profiles` limpia al cerrar cuenta — en la práctica, al borrar el perfil tras cerrar auth.users.

**Observaciones**:
- **`user_id` nullable** con FK `CASCADE` — permite huérfanos. Cambiar a `NOT NULL`.
- **Políticas ALL duplicadas** — eliminar una (cualquier nombre, idénticas).
- La FK a `user_profiles` en vez de `auth.users` es el único caso del inventario. Si se adopta el patrón general (FK a `auth.users`), cambiarla; si no, documentar por qué este dominio difiere.
- `check_monitor_limit()` es `SECURITY INVOKER` — la función lee `user_profiles` del usuario actual (permitido por la policy SELECT own), sin riesgo de escalada. OK.
- `product_description` es texto libre del usuario — misma consideración que `classification_logs.description` aunque con mucho menos volumen (0 filas actuales, 5 máximo por plan free).

---

## alert_notifications

> ⚠️ **DEPRECATED 2026-04-23** — la migración
> [`20260423140000_classif_ocr_alertas_fixes.sql`](../../supabase/migrations/20260423140000_classif_ocr_alertas_fixes.sql)
> (Bloque 3) renombra la tabla a `_deprecated_alert_notifications`.
> Revisión programada: **2026-07-23**. Si el worker de notificaciones por
> cambios TARIC no se ha implementado para entonces, se elimina. La ficha
> siguiente describe el estado previo.

**Filas**: 0

**Propósito inferido del código**: Registro de notificaciones enviadas a un usuario cuando se detecta un cambio TARIC en un código que tiene monitorizado. **No se encontró ningún uso en código** (`app/`, `components/`, `lib/`) — tabla huérfana a fecha de hoy. La feature end-to-end (cron que compare `monitored_codes` contra `tariff_changes`, inserte aquí y envíe email) **no está implementada**.

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | int4 | NO | `nextval('...')` |
| user_id | uuid | SÍ | — |
| change_id | int4 | SÍ | — |
| sent_at | timestamp | SÍ | `now()` |
| email_sent | bool | SÍ | `false` |

**Datos personales (PII)**: No directamente. Si en el futuro se añade el contenido del email o la dirección destinataria, sí sería PII.

**Datos comerciales del usuario**: Indirecto — la combinación `user_id + change_id` revela qué códigos TARIC le interesan.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Users see own notifications | SELECT | `auth.uid() = user_id` | — |

> Una única política SELECT. Sin INSERT/UPDATE/DELETE — la inserción tendría que venir de un worker con `service_role` (cuando se implemente).

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| user_id | `auth.users(id)` | **CASCADE** |
| change_id | `tariff_changes(id)` | **NO ACTION** (default) |

**Índices**:
- `idx_alert_notif_user` — btree `(user_id)`
- `alert_notifications_user_id_change_id_key` — UNIQUE `(user_id, change_id)` (evita notificar dos veces el mismo cambio al mismo usuario)

**Triggers**: Ninguno.

**Versionada en repo**: **No**.

**Retención sugerida**: **12 meses** tras `sent_at`. Sin contenido del email, el registro solo demuestra "usuario fue notificado de este cambio TARIC el día X". 12 meses es suficiente para histórico de soporte. Purga con cron.

**Observaciones**:
- **Tabla sin código cliente ni worker** — candidata similar a `user_alert_subscriptions` (ya deprecada). Decidir: deprecar (RENAME a `_deprecated_alert_notifications` con revisión en 90 días) o conservar reservada para la implementación de la feature.
- `user_id` y `change_id` nullable — ambas deberían ser `NOT NULL` en el diseño final (no tiene sentido una notificación sin destinatario ni sin cambio).
- `change_id` FK sin `ON DELETE` — si se borra un `tariff_changes`, queda bloqueado hasta limpiar estas filas. Al ser histórico, probablemente mejor `SET NULL` o `CASCADE`.
- Sin columna de "tipo de alerta" — hoy solo existe el concepto "cambio TARIC", pero si se añaden más tipos (CBAM, ETS, etc.) habrá que añadir campo discriminador.
- No hay columna para el contenido del email enviado (bien — minimización). Pero sin ella, no se puede reenviar ante un bug del MTA. Compromiso aceptable.

---

## Relaciones del dominio

```
auth.users
    ├── classification_logs      (user_id CASCADE)
    ├── invoice_extractions      (user_id CASCADE)
    ├── rrm_requests             (user_id CASCADE)
    └── alert_notifications      (user_id CASCADE)

user_profiles  (= auth.users vía id 1:1)
    └── monitored_codes          (user_id CASCADE) ← patrón distinto

classification_examples           (global, sin FK)

tariff_changes (fuera de esta tanda)
    └── alert_notifications.change_id NO ACTION

Anthropic API (externo, EEUU)
    ← classification_logs.description (sale)
    ← invoice_extractions (el PDF sale, solo se guarda el parseado)
```

---

## Hallazgos de la Tanda 3

### 🚨 Críticos

1. **`classification_examples` — UI de admin cliente sin policies de escritura**. `app/admin/clasificaciones/page.js` usa `createClientComponentClient()` para intentar INSERT/UPDATE/DELETE, pero la tabla solo tiene policy `SELECT true`. Las mutaciones desde cliente **fallan** contra RLS. La única fila existente se insertó vía SQL Editor con `service_role`. **Opciones**: (a) mover la gestión a route handler con `service_role`; (b) añadir policies restringidas a admin mediante función `is_admin(auth.uid())`; (c) eliminar la UI si no se va a mantener.

2. **Transferencia a Anthropic (EEUU) sin consentimiento integrado**. Las dos APIs `classify-product` y `extract-invoice` envían contenido a Anthropic (descripción de producto libre, PDF completo de factura) **sin** registro previo en `user_consents` (consent_types `ai_processing_classifier` y `ai_processing_ocr_invoice` ya previstos en el CHECK del baseline retroactivo de Fase 1.1, pero falta endpoint Fase 1.2). Antes de ir a producción pública, añadir:
   - Modal de aceptación en el primer uso.
   - Bloqueo del endpoint si no hay consentimiento válido (`accepted = true AND revoked_at IS NULL`).

### ⚠️ Altos — cron de purga

3. **Sin cron de purga para retenciones prometidas**. Todas las tablas del dominio prometen retenciones cortas:
   - `classification_logs` — 12 meses (732 filas, crece).
   - `invoice_extractions` — 90 días (la propia cabecera del schema lo marca como "recomendado").
   - `alert_notifications` — 12 meses propuestos.
   - `rrm_requests` — 4 años.
   Ninguno está automatizado. Implementar en **Fase 8** un job `pg_cron` o edge function que los limpie. Hasta que exista, **el cumplimiento es aspiracional**, no efectivo.

### ⚠️ Altos — decisiones pendientes

4. **`alert_notifications` huérfana**: 0 filas, 0 código cliente, feature no implementada. Decidir: deprecar (RENAME a `_deprecated_alert_notifications` con revisión 2026-07-23, análogo a `user_alert_subscriptions` y `dispatch_documents`) o conservar reservada. Si se deprecia, cae de la retención automática pendiente.

### 🟡 Medios — consolidar en Sub-tanda 3C

5. **`user_id` nullable con FK CASCADE** en `classification_logs`, `rrm_requests`, `monitored_codes`, `alert_notifications`. Cambiar a `NOT NULL` (previa verificación de ausencia de huérfanos).
6. **Políticas RLS redundantes en `monitored_codes`** — dos `ALL` idénticas. Eliminar una.
7. **`monitored_codes.user_id` FK a `user_profiles` en vez de `auth.users`** — caso único en el inventario. Decidir si se unifica al patrón general (`auth.users` CASCADE) o se documenta el porqué del desvío.
8. **`alert_notifications.change_id` FK sin `ON DELETE` explícito** — NO ACTION bloquea borrado de `tariff_changes`. Cambiar a `CASCADE` (la notificación depende del cambio) o `SET NULL`.
9. **`classification_logs.description`, `invoice_extractions.file_name/file_mime`** sin CHECK de longitud en DB (se truncan en el código). Añadir CHECK coherente.
10. **`rrm_requests.status`** texto libre con default `'draft'`. Añadir enum o CHECK.
11. **`model_used` hardcoded** (`'claude-sonnet-4-5'`) en `classify-product/route.js:367`. Al migrar a nuevo modelo, recordar actualizar.

### 🟢 Bajos / cosméticos

12. **Sólo `invoice_extractions` está versionada** en el repo (`scripts/invoice-extractions-schema.sql`). Las otras 5 no. Alimentar baseline retroactivo cuando toque.
13. Inconsistencia de generadores UUID: `classification_logs` usa `uuid_generate_v4()` (uuid-ossp); `invoice_extractions` y `rrm_requests` usan `gen_random_uuid()`; `classification_examples`, `monitored_codes`, `alert_notifications` usan `int4 + sequence`. Variado estilo sin patrón.
14. `classification_examples.created_by` es `text 'admin'` sin FK a `auth.users`. Si se implementa la vía service_role, guardar `auth.uid()` del admin real.

### Correcciones propuestas para Sub-tanda 3C

Agrupables en una única migración `supabase/migrations/YYYYMMDDHHMMSS_classif_ocr_alertas_fixes.sql`:

```sql
-- 1. classification_examples: mover mutación a service_role
--    (solo documentación — no hay policy que DROP; hoy no hay INSERT/UPDATE/DELETE
--    porque NO existe ninguna. Si se quiere soportar admins sin service_role,
--    implementar función is_admin(uid) + policies. Decisión pendiente.)

-- 2. user_id NOT NULL tras verificación de huérfanos
DO $$
DECLARE n_cl int; n_rr int; n_mc int; n_an int;
BEGIN
  SELECT COUNT(*) INTO n_cl FROM public.classification_logs WHERE user_id IS NULL;
  SELECT COUNT(*) INTO n_rr FROM public.rrm_requests       WHERE user_id IS NULL;
  SELECT COUNT(*) INTO n_mc FROM public.monitored_codes    WHERE user_id IS NULL;
  SELECT COUNT(*) INTO n_an FROM public.alert_notifications WHERE user_id IS NULL;
  IF n_cl+n_rr+n_mc+n_an > 0 THEN
    RAISE EXCEPTION 'Huérfanos: classification_logs=%, rrm_requests=%, monitored_codes=%, alert_notifications=%', n_cl,n_rr,n_mc,n_an;
  END IF;
END $$;

ALTER TABLE public.classification_logs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.rrm_requests        ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.monitored_codes     ALTER COLUMN user_id SET NOT NULL;
-- alert_notifications: si se deprecia, no tocar; si se conserva, SET NOT NULL también.

-- 3. monitored_codes: eliminar política duplicada
DROP POLICY IF EXISTS "Users can view own monitors" ON public.monitored_codes;
-- (conservar "Users can manage own monitors" ALL)

-- 4. alert_notifications: renombrar para deprecar (si Carlos lo confirma)
ALTER TABLE public.alert_notifications
  RENAME TO _deprecated_alert_notifications;
COMMENT ON TABLE public._deprecated_alert_notifications IS
  'DEPRECATED 2026-04-23. Sin código cliente ni worker. Revisar 2026-07-23.';

-- 5. change_id ON DELETE (solo si NO se deprecia la tabla)
-- ALTER TABLE public._deprecated_alert_notifications
--   DROP CONSTRAINT alert_notifications_change_id_fkey,
--   ADD CONSTRAINT alert_notifications_change_id_fkey
--     FOREIGN KEY (change_id) REFERENCES tariff_changes(id) ON DELETE CASCADE;

-- 6. Cron de purga (Fase 8) — fuera de esta migración:
--    DELETE FROM classification_logs WHERE created_at < now() - interval '12 months';
--    DELETE FROM invoice_extractions WHERE created_at < now() - interval '90 days'
--                                       OR (deleted_at IS NOT NULL AND deleted_at < now() - interval '7 days');
--    DELETE FROM _deprecated_alert_notifications WHERE sent_at < now() - interval '12 months';
--    DELETE FROM rrm_requests WHERE created_at < now() - interval '4 years';
```

Checks previos recomendados:

```sql
SELECT 'classification_logs' tbl, count(*) n_null FROM classification_logs WHERE user_id IS NULL
UNION ALL SELECT 'rrm_requests',    count(*) FROM rrm_requests       WHERE user_id IS NULL
UNION ALL SELECT 'monitored_codes', count(*) FROM monitored_codes    WHERE user_id IS NULL
UNION ALL SELECT 'alert_notifications', count(*) FROM alert_notifications WHERE user_id IS NULL;
```
