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

<!-- TANDA 2 INCOMPLETA: faltan dispatch_checklist, dispatch_timeline, dispatch_comments, checklist_templates -->
