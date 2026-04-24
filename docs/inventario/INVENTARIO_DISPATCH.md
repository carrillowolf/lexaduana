# Inventario — Dominio Dispatch (Despachos)

**Tanda**: 2 / 8 (parcial — sub-tanda 2A)
**Fecha**: 2026-04-23
**Schema**: `public`
**Tablas esta sub-tanda**: `dispatches`, `dispatch_documents`
**Pendientes**: `dispatch_checklist`, `dispatch_timeline`, `dispatch_comments`, `checklist_templates`

> Fuente: `information_schema` + `pg_catalog` + `storage.buckets` + `storage.objects` policies del project `jsmvaeseyzbyryzwgyxc` + grep del repo.

---

## dispatches

**Filas**: 7

**Propósito inferido del código**: Tabla principal del módulo despachos aduaneros. Almacena el expediente completo: cliente, operación (import/export), partida arancelaria, transporte, fechas ETA/ETD, estado de cada etapa (docs, sumaria, despacho, paraaduaneros, DUA, levante, cierre, gastos), DUA emitido, inspección, etc. Endpoints: `app/despachos/page.js` (listado), `app/despachos/[id]/page.js` (detalle), `app/despachos/nuevo/page.js` (creación). Sin API REST custom — todo vía cliente Supabase.

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | `uuid_generate_v4()` |
| expediente_number | varchar | NO | — |
| operation_type | varchar | NO | — |
| client_name | varchar | NO | — |
| product_description | text | SÍ | — |
| hs_code | varchar | SÍ | — |
| incoterm | varchar | SÍ | — |
| transport_reference | varchar | SÍ | — |
| eta / etd | date | SÍ | — |
| arrival_date / departure_date | date | SÍ | — |
| status | varchar | NO | `'creado'` |
| stage_docs / stage_sumaria / stage_despacho / stage_paraaduaneros / stage_dua / stage_levante / stage_closure / stage_gastos | varchar | SÍ | `'pending'` |
| container_type | varchar | SÍ | — |
| waiting_deconsolidation | bool | SÍ | `false` |
| deconsolidation_date | date | SÍ | — |
| sumaria_status / sumaria_date | varchar / date | SÍ | — |
| has_predeclaration | bool | SÍ | `false` |
| mrn_number | varchar | SÍ | — |
| predeclaration_date | date | SÍ | — |
| paraaduaneros | jsonb | SÍ | `'[]'::jsonb` |
| has_paraaduaneros | bool | SÍ | `false` |
| paraaduaneros_types | text | SÍ | — |
| dua_circuit / dua_presented_date / dua_number / dua_status | varchar / date / varchar / varchar | SÍ | `dua_status='pendiente'` |
| inspection_type / inspection_date / inspection_notes | varchar / timestamp / text | SÍ | — |
| cr_received / cr_received_date / cr_type | bool / date / varchar | SÍ | `cr_received=false` |
| expenses_status / expenses_received_date | varchar / date | SÍ | `expenses_status='pendiente'` |
| levante_date / levante_number | date / varchar | SÍ | — |
| authorization_date / docs_sent_date / completed_at | date / date / timestamp | SÍ | — |
| eur1_required / eur1_emitted | bool | SÍ | `false` |
| assigned_to | uuid | SÍ | — |
| created_by | uuid | **NO** | — |
| organization_id | uuid | SÍ | — |
| internal_notes / notes | text | SÍ | — |
| created_at / updated_at | timestamp | SÍ | `now()` |

**Datos personales (PII)**: **Sí** — `client_name` (identificador del cliente, típicamente razón social o autónomo; RGPD cuando es persona física). `internal_notes` y `notes` (text libre) pueden contener nombres, teléfonos, emails de contacto.

**Datos comerciales del usuario**: **Sí** — expediente completo: `expediente_number`, `operation_type`, `hs_code`, `incoterm`, `transport_reference`, `mrn_number`, `dua_number`, `levante_number`, `paraaduaneros` (jsonb), `product_description`, fechas de todas las etapas. Sensible: revela flujos de importación/exportación, clientes y volúmenes.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Users can view own or assigned dispatches | SELECT | `auth.uid() = created_by OR auth.uid() = assigned_to` | — |
| Users can insert own dispatches | INSERT | — | `auth.uid() = created_by` |
| Users can update own or assigned dispatches | UPDATE | `auth.uid() = created_by OR auth.uid() = assigned_to` | — |
| Users can delete own dispatches | DELETE | `auth.uid() = created_by` | — |

> Modelo de propiedad compartida: el creador y el asignado pueden ver/editar; solo el creador puede borrar. Razonable.

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| created_by | `auth.users(id)` | **NO ACTION** (default) |
| assigned_to | `auth.users(id)` | **NO ACTION** (default) |

**Índices**:
- `dispatches_expediente_number_key` — UNIQUE `(expediente_number)`
- `idx_dispatches_assigned` — btree `(assigned_to)`
- `idx_dispatches_created_by` — btree `(created_by)`
- `idx_dispatches_eta` — btree `(eta)`
- `idx_dispatches_expediente` — btree `(expediente_number)` (redundante con el UNIQUE anterior)
- `idx_dispatches_operation` — btree `(operation_type)`
- `idx_dispatches_status` — btree `(status)`

**Triggers**:
- `trigger_copy_checklist` — AFTER INSERT → `copy_checklist_template()` inserta en `dispatch_checklist` todos los ítems activos de `checklist_templates` para el `operation_type` del nuevo despacho.
- `update_dispatches_updated_at` — BEFORE UPDATE → `update_updated_at_column()` refresca `updated_at = now()`.

**Versionada en repo**: **No**. Sin `CREATE TABLE dispatches` en `scripts/*.sql` ni en `supabase/migrations/*.sql`.

**Retención sugerida**: **4 años post-cierre del despacho** (art. 51 CAU — obligación de conservar documentación aduanera durante 3 años naturales tras el fin del año de admisión, redondeado a 4 por prudencia). Tras ese plazo, borrar o anonimizar `client_name` y campos libres (`notes`, `internal_notes`, `inspection_notes`, `product_description`) manteniendo identificadores agregados si se desea conservar estadística.

**Observaciones**:
- **`organization_id`** existe como columna pero **no hay tabla `organizations`** ni FK. Posible vestigio de un diseño multi-tenant no implementado. Ninguna política RLS la usa. Candidata a eliminar o a documentar como reservada.
- **`created_by` y `assigned_to` con FK `NO ACTION`** — impide borrar un `auth.users` si tiene despachos. Inconsistente con las tablas hijas (todas `CASCADE` sobre `dispatch_id`). Decisión: o bien cambiar a `SET NULL` (conserva el despacho aún tras baja del usuario, coherente con obligación legal de 4 años; requiere hacer ambas FK nullable — `created_by` hoy es `NOT NULL`), o mantener NO ACTION forzando la reasignación previa.
- **Índice redundante**: `idx_dispatches_expediente` duplica al UNIQUE `dispatches_expediente_number_key`. Eliminar.
- **`paraaduaneros` (jsonb) + `has_paraaduaneros` (bool) + `paraaduaneros_types` (text) + `stage_paraaduaneros` (varchar)** — 4 columnas sobre el mismo concepto. Probable evolución de diseño. Sin impacto de seguridad; nota para limpieza futura.
- `status` y los `stage_*` son `varchar` libres sin CHECK ni enum. Sin impacto inmediato, pero permite valores arbitrarios.
- `updated_at` sí se refresca por trigger (bien).
- `client_name` es `NOT NULL` — el dato del cliente entra siempre, incluso antes de tener HS o MRN. Obligación de tratarlo como PII desde la creación.

---

## dispatch_documents

**Filas**: 0

**Propósito inferido del código**: Metadatos de archivos asociados a un despacho (nombre, URL, tamaño, MIME, tipo de documento, subido por). Diseñado para guardar DUAs, facturas, certificados, etc. **No se encontró ningún uso en código** (`app/`, `components/`, `lib/`): ni SELECT, ni INSERT, ni UI de upload. **No existe bucket de Storage para despachos** (`storage.buckets` solo contiene `cbam-advisory-docs` y `cbam-advisory-reports`). Tabla actualmente inerte.

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | `uuid_generate_v4()` |
| dispatch_id | uuid | SÍ | — |
| file_name | varchar | NO | — |
| file_url | varchar | NO | — |
| file_size | int4 | SÍ | — |
| mime_type | varchar | SÍ | — |
| document_type | varchar | SÍ | — |
| uploaded_at | timestamp | SÍ | `now()` |
| uploaded_by | uuid | SÍ | — |

**Datos personales (PII)**: En el esquema, no directamente. En la práctica, **los archivos reales a subir (DUAs, facturas, certificados) contienen PII** (nombre de cliente, razón social, firma, importes). El esquema solo guarda metadatos; el contenido vive (o viviría) en Storage.

**Datos comerciales del usuario**: **Sí, inferidos del caso de uso** — los archivos típicos de un despacho son comercialmente sensibles. Hoy la tabla está vacía, pero el modelo de datos está pensado para este contenido.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Users can view documents of accessible dispatches | SELECT | `dispatch_id IN (SELECT id FROM dispatches WHERE auth.uid() = created_by OR auth.uid() = assigned_to)` | — |
| Users can upload documents to accessible dispatches | INSERT | — | `dispatch_id IN (...) AND auth.uid() = uploaded_by` |

> Sin políticas UPDATE ni DELETE — una vez subido un documento, nadie puede modificarlo ni borrarlo vía cliente (inmutabilidad, coherente con obligación de retención CAU). En la práctica, sin Storage conectado, la tabla no recibe inserts.

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| dispatch_id | `dispatches(id)` | **CASCADE** |
| uploaded_by | `auth.users(id)` | **NO ACTION** (default) |

**Índices**:
- `idx_dispatch_documents_dispatch` — btree `(dispatch_id)`

**Triggers**: Ninguno.

**Versionada en repo**: **No**.

**Retención sugerida**: **4 años post-cierre del despacho** (art. 51 CAU). Mismo plazo que `dispatches`. Al borrar el despacho padre, `CASCADE` limpia los metadatos; **los archivos en Storage (cuando existan) NO se limpian automáticamente** — requieren un cron o edge function que borre los blobs huérfanos.

**Observaciones**:
- 🚨 **Tabla completamente inerte**: 0 filas, 0 referencias en código, **sin bucket de Storage correspondiente**. Feature esquemáticamente diseñada pero nunca implementada. Antes de producción: (a) implementar la subida (crear bucket `dispatch-documents` con RLS paralela a la tabla), (b) renombrar a `_deprecated_dispatch_documents` mientras se decide, o (c) eliminar.
- `dispatch_id` **nullable** pese a FK `CASCADE` — permite filas huérfanas (sin despacho). Si se implementa la feature, cambiar a `NOT NULL`.
- `file_url` es `varchar` sin validación. Si se conecta a Storage de Supabase, típicamente se guarda la ruta relativa (`dispatch-documents/{dispatch_id}/{uuid}.pdf`) y se genera la URL firmada on-demand; si se guarda URL absoluta, cuidado con URLs públicas permanentes.
- `uploaded_by` nullable — con la política INSERT actual (`auth.uid() = uploaded_by`) sería `NOT NULL` de facto; la nullabilidad es inconsistente. Cambiar a `NOT NULL` al implementar.
- Sin política DELETE en la tabla, pero `CASCADE` desde `dispatches` sí borra. Asimetría aceptable (el usuario borra el despacho completo, no documentos sueltos).
- **`document_type`** es `varchar` libre sin CHECK ni enum. Al implementar, añadir restricción (`'dua'`, `'factura'`, `'bl'`, `'certificado_origen'`, `'eur1'`, `'otro'`).

---

<!-- Sub-tanda 2B completada -->

## dispatch_checklist

**Filas**: 155

**Propósito inferido del código**: Instancia de checklist por despacho. Se poblada automáticamente vía el trigger `trigger_copy_checklist` al crear un despacho (ver `checklist_templates`). El usuario marca ítems como `is_checked`, añade `notes` y puede añadir ítems personalizados (`is_custom = true`). Código: `components/DispatchChecklist.js` (líneas 28 SELECT, 46 INSERT, 77 UPDATE, 108 DELETE).

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | `uuid_generate_v4()` |
| dispatch_id | uuid | SÍ | — |
| category | varchar | NO | — |
| item_text | varchar | NO | — |
| order_index | int4 | NO | — |
| is_checked | bool | SÍ | `false` |
| checked_at | timestamp | SÍ | — |
| checked_by | uuid | SÍ | — |
| is_custom | bool | SÍ | `false` |
| is_critical | bool | SÍ | `false` |
| notes | text | SÍ | — |
| created_at | timestamp | SÍ | `now()` |

**Datos personales (PII)**: No directamente. `notes` (text libre) podría contener menciones a personas.

**Datos comerciales del usuario**: Sí (indirecto) — `item_text` copiado de la plantilla es genérico, pero `notes` libre y los ítems `is_custom` añadidos por el usuario revelan detalles operativos del despacho.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Users can view checklist of accessible dispatches | SELECT | `dispatch_id IN (SELECT id FROM dispatches WHERE created_by = auth.uid() OR assigned_to = auth.uid())` | — |
| Users can modify checklist of accessible dispatches | ALL | idem | — |

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| dispatch_id | `dispatches(id)` | **CASCADE** |
| checked_by | `auth.users(id)` | **NO ACTION** |

**Índices**:
- `idx_dispatch_checklist_dispatch` — btree `(dispatch_id)`
- `idx_dispatch_checklist_category` — btree `(category)`

**Triggers**: Ninguno en esta tabla. Es tabla **receptora** del trigger `trigger_copy_checklist` definido en `dispatches`.

**Versionada en repo**: **No**.

**Retención sugerida**: 4 años post-cierre del despacho (art. 51 CAU). `CASCADE` desde `dispatches` limpia automáticamente.

**Observaciones**:
- `dispatch_id` **nullable** pese a FK `CASCADE`. Permite huérfanos (155 filas hoy, riesgo de que alguna tenga `dispatch_id IS NULL`). Cambiar a `NOT NULL`.
- `checked_by` FK `NO ACTION` — borrar al usuario que marcó un ítem queda bloqueado. Inconsistente con la semántica del historial operativo. Candidato a `SET NULL`.
- Trigger de poblado: cuando se inserta en `dispatches`, `copy_checklist_template()` mete en esta tabla todos los ítems de `checklist_templates` cuyo `operation_type = NEW.operation_type` y `is_active = true`. Por eso 155 filas con 7 despachos (media de 22 ítems por despacho).

---

## checklist_templates

**Filas**: 113

**Propósito inferido del código**: Plantillas **globales** de checklist organizadas por `operation_type` + `category` + `order_index`. **No se consulta directamente desde el código de la app** — la tabla solo es leída por el trigger `copy_checklist_template()` (función plpgsql en `public`) al INSERT de un nuevo despacho, para poblar `dispatch_checklist` con los ítems correspondientes. No hay UI de edición de plantillas en la app.

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | `uuid_generate_v4()` |
| operation_type | varchar | NO | — |
| category | varchar | NO | — |
| item_text | varchar | NO | — |
| order_index | int4 | NO | — |
| is_active | bool | SÍ | `true` |
| is_critical | bool | SÍ | `false` |
| created_at | timestamp | SÍ | `now()` |

**Datos personales (PII)**: No.

**Datos comerciales del usuario**: No — son plantillas genéricas de flujo aduanero, compartidas entre todos los usuarios.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Anyone authenticated can read templates | SELECT | `auth.uid() IS NOT NULL` | — |
| Anyone authenticated can modify templates | **ALL** | `auth.uid() IS NOT NULL` | — |

> 🚨 **Crítico**: la política `ALL` autoriza a **cualquier usuario autenticado** a INSERT, UPDATE y DELETE sobre las 113 plantillas globales. Un usuario cualquiera puede borrar o alterar las plantillas, afectando a TODOS los despachos futuros de todos los usuarios (vía el trigger de poblado). Ver Hallazgos.

**Foreign keys**: Ninguna.

**Índices**:
- `idx_checklist_templates_operation` — btree `(operation_type)`
- `idx_checklist_templates_active` — btree `(is_active)`

**Triggers**: Ninguno en esta tabla. Es tabla **fuente** del trigger definido en `dispatches` (ver abajo).

**Trigger relacionado (definido en `dispatches`)**:
- **Nombre**: `trigger_copy_checklist`
- **Evento**: AFTER INSERT ON `dispatches`
- **Función**: `public.copy_checklist_template()`
- **Lenguaje**: plpgsql
- **Seguridad**: **SECURITY INVOKER** (no lleva `SECURITY DEFINER`). Se ejecuta con los permisos del usuario que hizo el INSERT en `dispatches`.
- **Qué hace**:
  ```sql
  INSERT INTO dispatch_checklist (dispatch_id, category, item_text, order_index, is_custom, created_at)
  SELECT NEW.id, category, item_text, order_index, false, NOW()
  FROM checklist_templates
  WHERE operation_type = NEW.operation_type AND is_active = true
  ORDER BY order_index;
  ```
- **Riesgo de escalada de privilegios**: Bajo. Al ser `SECURITY INVOKER`, la función corre con las policies del usuario: SELECT sobre `checklist_templates` (permitido a todo authenticated) + INSERT sobre `dispatch_checklist` (permitido si el despacho recién creado le pertenece, que es el caso). No hay salto de privilegios.
- **Riesgo real**: la política ALL sobre `checklist_templates` (documentada arriba) permite a cualquier user modificar la fuente de la que se alimenta el trigger. No es escalada; es exposición.

**Versionada en repo**: **No**.

**Retención sugerida**: Indefinida — son datos maestros de configuración, no PII ni comerciales.

**Observaciones**:
- 🚨 **Política `ALL` demasiado permisiva** — ver Hallazgos críticos. Propuesta: conservar `SELECT` para `authenticated`, restringir mutación a `service_role` o a un rol `admin` con función Edge para administrar plantillas.
- Plantillas **globales**: no hay `user_id` ni `organization_id`. Todos los 274 usuarios comparten estas 113 filas.
- Sin UI para editarlas en la app → la administración actual pasa por el SQL Editor de Supabase. Si se quiere mantener así, el rol `service_role` ya basta y se puede eliminar la política ALL para usuarios.
- `operation_type` y `category` son `varchar` libres sin CHECK. Los valores usados dependen de los `operation_type` válidos en `dispatches`.
- `is_active = false` permite deprecar una plantilla sin borrarla, manteniendo referencia histórica. Bien diseñado.

---

## dispatch_timeline

**Filas**: 1

**Propósito inferido del código**: **Log automático** de cambios en campos del despacho. La aplicación llama a `logActivity()` (`lib/dispatchActivity.js:62`) cada vez que un campo cambia, insertando un evento con `event_type = <nombre del campo>`, `old_value`, `new_value` y `description` (etiqueta humana). Es fire-and-forget (errores se swallowean con `console.warn`). Se lee en `app/despachos/page.js:62` (para calcular alertas), `app/despachos/[id]/page.js:68` (detalle) y `components/despachos/ActivityTimeline.js:19` (pintar la línea temporal). **No son comentarios del usuario** — es un audit log automático.

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | `uuid_generate_v4()` |
| dispatch_id | uuid | SÍ | — |
| event_type | varchar | NO | — |
| old_value | text | SÍ | — |
| new_value | text | SÍ | — |
| description | text | SÍ | — |
| created_at | timestamp | SÍ | `now()` |
| created_by | uuid | SÍ | — |

**Datos personales (PII)**: No directamente. `old_value`/`new_value` pueden contener `client_name` si se edita esa columna (se almacena como `text`, así que queda histórico de nombres).

**Datos comerciales del usuario**: Sí (histórico) — cualquier edición de campos comerciales (`hs_code`, `dua_number`, `mrn_number`, fechas, etc.) deja rastro en `old_value`/`new_value`.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Users can view timeline of accessible dispatches | SELECT | `dispatch_id IN (SELECT id FROM dispatches WHERE created_by = auth.uid() OR assigned_to = auth.uid())` | — |
| Users can add timeline events to accessible dispatches | INSERT | — | `dispatch_id IN (...) AND auth.uid() = created_by` |

> Sin UPDATE ni DELETE — log **inmutable** por diseño, coherente con un audit trail.

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| dispatch_id | `dispatches(id)` | **CASCADE** |
| created_by | `auth.users(id)` | **NO ACTION** |

**Índices**:
- `idx_dispatch_timeline_dispatch` — btree `(dispatch_id)`
- `idx_dispatch_timeline_date` — btree `(created_at DESC)`

**Triggers**: Ninguno.

**Versionada en repo**: **No**.

**Retención sugerida**: 4 años post-cierre del despacho (mismo plazo CAU que `dispatches`). `CASCADE` desde `dispatches` limpia automáticamente.

**Observaciones**:
- `dispatch_id` **nullable** pese a FK `CASCADE` — cambiar a `NOT NULL`.
- `created_by` **nullable** pese a la política INSERT que exige `auth.uid() = created_by` — inconsistencia. Cambiar a `NOT NULL`.
- Fire-and-forget en `logActivity`: si la inserción falla silenciosamente (RLS, red), la edición del despacho se guarda igual pero se pierde el rastro. Compromiso deliberado para no bloquear la UI; aceptable para un audit log "best effort".
- `event_type` es `varchar` libre — recibe nombres de campo directos (`stage_docs`, `mrn_number`, etc.). No hay CHECK. Si se añade un campo nuevo al modelo, el timeline lo registra sin tocar nada, pero tampoco avisa si se escribe un `event_type` con typo.

---

## dispatch_comments

**Filas**: 1

**Propósito inferido del código**: Hilo de comentarios **manuales** del usuario sobre un despacho. Distinto del `dispatch_timeline` (que es log automático de campos). Código: `components/despachos/CommentThread.js` — línea 26 SELECT, 48 INSERT, 64 DELETE. También se consulta en `app/despachos/page.js:83` (probablemente para contadores). No hay UPDATE en el código ni en las políticas → contenido inmutable pero borrable por el autor.

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| dispatch_id | uuid | **NO** | — |
| user_id | uuid | **NO** | — |
| content | text | NO | — |
| created_at | timestamptz | SÍ | `now()` |

**Datos personales (PII)**: Indirecto — `content` es texto libre donde el usuario puede escribir nombres, emails, teléfonos de terceros.

**Datos comerciales del usuario**: Sí (posible) — detalles operativos del despacho que el usuario decida anotar.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Users can view comments on accessible dispatches | SELECT | `dispatch_id IN (SELECT id FROM dispatches WHERE created_by = auth.uid() OR assigned_to = auth.uid())` | — |
| Users can insert comments on accessible dispatches | INSERT | — | `user_id = auth.uid() AND dispatch_id IN (...)` |
| Users can delete own comments | DELETE | `user_id = auth.uid()` | — |

> Sin UPDATE — contenido inmutable. Con DELETE own — el autor puede retirar su comentario.

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| dispatch_id | `dispatches(id)` | **CASCADE** |
| user_id | `auth.users(id)` | **NO ACTION** |

**Índices**:
- `idx_dispatch_comments_dispatch_id` — btree `(dispatch_id)`
- `idx_dispatch_comments_created_at` — btree `(created_at DESC)`

**Triggers**: Ninguno.

**Versionada en repo**: **No**.

**Retención sugerida**: 4 años post-cierre del despacho. `CASCADE` desde `dispatches` limpia automáticamente.

**Observaciones**:
- Única tabla del dominio con `dispatch_id` y `user_id` ambos `NOT NULL` desde el diseño. Bien.
- **Asimetría de política**: sin UPDATE pero con DELETE. El autor no puede corregir un typo pero sí borrar el comentario entero y escribir otro. Elección razonable (preserva integridad de lo que queda), pero documentarlo explícitamente en la UI (que hoy sí ofrece "Eliminar").
- `user_id` FK `NO ACTION` — si se borra el `auth.users`, queda bloqueado mientras existan comentarios suyos. Para RGPD, al cerrar cuenta habría que borrar comentarios previamente o cambiar la FK a `SET NULL` y anonimizar el autor.
- `content` es `text` libre sin longitud máxima. En producción considerar un CHECK (`length(content) BETWEEN 1 AND 5000`).

---

## Relaciones del dominio dispatch

```
auth.users
    │
    ├── dispatches            (created_by NO ACTION, assigned_to NO ACTION)
    │       │
    │       ├── dispatch_checklist  (dispatch_id CASCADE,  checked_by   NO ACTION)
    │       ├── dispatch_timeline   (dispatch_id CASCADE,  created_by   NO ACTION)
    │       ├── dispatch_comments   (dispatch_id CASCADE,  user_id      NO ACTION)
    │       └── dispatch_documents  (dispatch_id CASCADE,  uploaded_by  NO ACTION)   ← inerte (2A)
    │
    └── [sin FK directa desde auth.users a checklist_templates]

checklist_templates (global, 113 filas, sin FK)
    ↓  (leída por trigger)
trigger_copy_checklist [AFTER INSERT ON dispatches] → copy_checklist_template() [SECURITY INVOKER]
    ↓
dispatch_checklist   (poblado automático al crear despacho)
```

**Coherencia de `ON DELETE`**: las 4 hijas de `dispatches` cascadean **de forma consistente** sobre `dispatch_id`. Al borrar un despacho se limpian checklist, timeline, comments y documents (los metadatos; los archivos en Storage, cuando existan, no). En cambio, todas las FKs a `auth.users` son `NO ACTION`, lo que bloquea el borrado de un usuario mientras existan registros suyos.

---

## Hallazgos de la Tanda 2

### 🚨 Críticos

1. **`checklist_templates` — política `ALL` permite a cualquier authenticated mutar las plantillas globales** (detectado en 2B). Un usuario cualquiera puede borrar, insertar o modificar las 113 filas maestras, afectando a todos los despachos futuros de todos los 274 usuarios vía el trigger `copy_checklist_template`. **Decisión requerida antes de Tanda 3**: reducir a `SELECT` para `authenticated` y mover mutaciones a `service_role` (administración por SQL Editor) o a un rol `admin` específico.
2. **`dispatch_documents` — tabla inerte sin bucket de Storage** (detectado en 2A). 0 filas, 0 referencias en código, ningún bucket `dispatch-documents` en `storage.buckets`. Decisión: (a) deprecar (RENAME a `_deprecated_dispatch_documents` con revisión 2026-07-23, análogo a `user_alert_subscriptions`), (b) implementar la feature completa (bucket + UI + políticas `storage.objects`), o (c) eliminar.

### ⚠️ Altos — al backlog / Fase 7

3. **`dispatches.created_by` y `assigned_to` con FK `NO ACTION`** (2A). Inconsistente con el patrón CASCADE de las hijas. Decisión pendiente: `SET NULL` (con `created_by` pasando a nullable, conserva despacho para obligación de 4 años) o mantener bloqueo (borrado de usuario siempre manual, reasignando despachos primero).
4. **`dispatches.organization_id` sin tabla `organizations` ni FK** (2A). Vestigio de diseño multi-tenant. Eliminar columna o crear la tabla y migrar.
5. **FKs de las hijas a `auth.users` en `NO ACTION`** (`dispatch_checklist.checked_by`, `dispatch_timeline.created_by`, `dispatch_comments.user_id`, `dispatch_documents.uploaded_by`). Inconsistente: borrar un usuario queda bloqueado si tiene cualquier actividad registrada. Para cerrar una cuenta según RGPD sería necesario borrar previamente comentarios/marcas/eventos o cambiar a `SET NULL`. Preferible `SET NULL` para conservar el despacho (4 años CAU) y que se vea como "autor desconocido".

### 🟡 Medios — a consolidar en Sub-tanda 2C

6. **`dispatch_id` nullable con FK CASCADE** en 3 tablas hijas (`dispatch_checklist`, `dispatch_timeline`, `dispatch_documents`). `dispatch_comments` ya lo tiene `NOT NULL` (bien). Uniformar a `NOT NULL`.
7. **`dispatch_timeline.created_by` nullable** pese a política INSERT que exige `auth.uid() = created_by`. Cambiar a `NOT NULL`.
8. **Índice `idx_dispatches_expediente` duplica al UNIQUE** `dispatches_expediente_number_key` (2A). Eliminar el `idx_`.
9. **Redundancia de columnas paraaduaneros en `dispatches`** (2A): `paraaduaneros` (jsonb) + `has_paraaduaneros` (bool) + `paraaduaneros_types` (text) + `stage_paraaduaneros` (varchar). Consolidar.
10. **Ninguna de las 6 tablas versionada** en `scripts/` ni en `supabase/migrations/`. Crear un baseline retroactivo similar al de `user_consents` (Fase 1.3) cuando se decidan los cambios.

### 🟢 Bajos / cosméticos

11. `dispatches`, `dispatch_checklist`, `dispatch_documents`, `dispatch_timeline`, `checklist_templates` usan `uuid_generate_v4()` (requiere `uuid-ossp`). `dispatch_comments` usa `gen_random_uuid()` (nativo). Unificar.
12. `status`, `stage_*`, `document_type`, `event_type`, `operation_type`, `category` son `varchar`/`text` libres sin CHECK ni enum.
13. `dispatch_comments.content` sin longitud máxima — considerar CHECK.
14. Asimetría de política en `dispatch_comments` (sin UPDATE, con DELETE own) — documentar en UI.

### Correcciones propuestas para Sub-tanda 2C

Agrupables en **una única migración** `supabase/migrations/YYYYMMDDHHMMSS_dispatch_rgpd_fixes.sql`:

```sql
-- 1. checklist_templates: restringir mutación
DROP POLICY IF EXISTS "Anyone authenticated can modify templates" ON public.checklist_templates;
-- (las mutaciones quedan solo para service_role; la política SELECT se mantiene)

-- 2. Columnas NOT NULL tras verificación previa de que no hay huérfanos
ALTER TABLE public.dispatch_checklist  ALTER COLUMN dispatch_id  SET NOT NULL;
ALTER TABLE public.dispatch_timeline   ALTER COLUMN dispatch_id  SET NOT NULL;
ALTER TABLE public.dispatch_timeline   ALTER COLUMN created_by   SET NOT NULL;
-- dispatch_documents.dispatch_id y uploaded_by: NO aplicar todavía (decisión pendiente).

-- 3. Eliminar índice redundante
DROP INDEX IF EXISTS public.idx_dispatches_expediente;

-- 4. FK a auth.users → SET NULL en hijas (comentado, decisión pendiente)
-- ALTER TABLE public.dispatch_checklist  DROP CONSTRAINT dispatch_checklist_checked_by_fkey,
--   ADD CONSTRAINT dispatch_checklist_checked_by_fkey FOREIGN KEY (checked_by) REFERENCES auth.users(id) ON DELETE SET NULL;
-- (idem dispatch_timeline.created_by, dispatch_comments.user_id, dispatch_documents.uploaded_by)

-- 5. Decisión dispatch_documents (separar en migración propia si se deprecia)
-- 6. Decisión dispatches.organization_id (DROP COLUMN si se confirma no usar)
```

Checks previos recomendados antes de 2C:

```sql
-- Verificar que no hay huérfanos de dispatch_id / created_by
SELECT 'dispatch_checklist' tbl, count(*) FROM dispatch_checklist WHERE dispatch_id IS NULL
UNION ALL SELECT 'dispatch_timeline', count(*) FROM dispatch_timeline WHERE dispatch_id IS NULL
UNION ALL SELECT 'dispatch_timeline.created_by NULL', count(*) FROM dispatch_timeline WHERE created_by IS NULL;
```
