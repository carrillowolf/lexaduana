# Inventario — Dominio CBAM Advisory

**Tanda**: 4 / 8 (parcial — sub-tanda 4A)
**Fecha**: 2026-04-23
**Schema**: `public`
**Tablas esta sub-tanda**: `cbam_advisory_requests`, `cbam_advisory_products`, `cbam_advisory_documents`
**Pendientes (sub-tanda 4B)**: `cbam_advisory_reports`, `cbam_advisory_report_downloads`, `cbam_calculator_saves`, `cbam_monitoring_subscriptions`

> Fuente: `information_schema` + `pg_catalog` + `storage.buckets`/`storage.objects` policies + grep del repo + lectura de `lib/cbamAdvisory*.js`.

> **Nota sobre transferencia a Anthropic**: confirmado por grep exhaustivo (`anthropic|@anthropic-ai|claude-sonnet|claude-opus|claude-haiku` en `app/api/cbam/`, `app/api/admin/cbam/`, `lib/cbam*`, `app/cbam/`). **El módulo CBAM no llama a Anthropic en ningún punto.** Toda la lógica (cálculos, generación de reports, exportación Excel) corre en backend con datos estructurados. No hay riesgo de transferencia a EEUU desde este dominio. Esto también significa que no aplica el `consent_type = 'ai_processing_*'` para CBAM.

---

## cbam_advisory_requests

> ℹ️ **Sub-tanda 4C (2026-04-23)** — la migración
> [`20260423160000_cbam_advisory_fixes.sql`](../../supabase/migrations/20260423160000_cbam_advisory_fixes.sql)
> aplica dos cambios:
> - **Bloque 1**: `user_id` → `NOT NULL` (verificado 0 huérfanos sobre 2 filas).
> - **Bloque 2**: dos CHECK constraints
>   - `status IN ('draft','intake_complete','submitted','paid','delivered')`
>   - `payment_status IN ('unpaid','requested','paid','refunded')`
>     (verificado 0 valores fuera de la lista).
>
> La pseudonimización (FK CASCADE → SET NULL + `user_id_hash`) queda en
> `BACKLOG_PRIVACIDAD.md` para Fase 7.

**Filas**: 2

**Propósito inferido del código**: Núcleo del flujo de asesoría CBAM de pago. Cada fila es una solicitud de un importador para que LexAduana le calcule sus emisiones, costes CBAM esperados y le entregue un informe firmable. Workflow administrado por admin desde `app/api/admin/cbam/asesoria/*`. Estados conocidos: `'draft'`, `'intake_complete'`, `'paid'`, `'delivered'` (más probablemente `'submitted'`, `'in_review'` — ver Observaciones). Consumido por `lib/cbamAdvisoryService.js` (cliente) y `lib/cbamAdvisoryAdminService.js` (admin con `service_role`).

**Columnas** (resumen agrupado — 30 columnas):
| Bloque | Columnas | Tipo | Notas |
|---|---|---|---|
| ID / propietario | `id`, `user_id`, `status` | uuid · uuid · text | `id` `gen_random_uuid()`; `user_id` nullable; `status` default `'draft'` |
| Empresa cliente | `company_name` (NOT NULL), `company_cif`, `company_eori` | text | Razón social, CIF, EORI |
| Contacto | `contact_name` (NN), `contact_email` (NN), `contact_phone` | text | PII directa |
| Volumen | `annual_volume_estimate`, `total_tonnes`, `installations_count` | text · num · int | |
| Declarante | `is_authorized_declarant`, `has_indirect_representative`, `representative_name` | bool · bool · text | |
| Notas | `client_notes`, `internal_notes` | text | text libre |
| Cálculo (denormalizado) | `total_estimated_cost`, `total_emissions`, `exceeds_de_minimis`, `co2_price_used`, `calculation_year` | num · num · bool · num · int (default 2026) | |
| Workflow | `submitted_at`, `completed_at`, `delivered_at`, `report_generated_at`, `report_ref` (UNIQUE) | timestamptz · text | |
| Pago | `payment_status` (default `'unpaid'`), `payment_date`, `invoice_ref`, `advisory_package` | text · timestamptz · text · text | |
| Petición de pago | `payment_request_sent_at`, `payment_request_language` (varchar), `payment_request_amount` (num), `payment_request_reference` | mixto | Bloque para emails de cobro |
| Admin | `admin_checklist` jsonb (NN, default `'{}'`) | jsonb | Estado interno del proceso |
| Auditoría | `created_at`, `updated_at` | timestamptz | default `now()` |

**Datos personales (PII)**: **Sí, alta densidad** — `contact_name`, `contact_email`, `contact_phone`, `company_cif` (CIF/NIF identifica autónomos como personas físicas), `company_eori`, `representative_name`. Más PII de terceros si el campo `client_notes` o `internal_notes` lo contiene.

**Datos comerciales del usuario**: **Sí, alto volumen** — la solicitud completa describe el flujo de importación: volumen anual, productos CBAM, instalaciones, costes esperados, países de origen (vía `cbam_advisory_products` hija). Es el dominio con datos comerciales más sensibles del inventario.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Users can view own requests | SELECT | `auth.uid() = user_id` | — |
| Users can insert own requests | INSERT | — | `auth.uid() = user_id` |
| Users can update own draft requests | UPDATE | `auth.uid() = user_id AND status IN ('draft','intake_complete')` | — |

> **Sin policy DELETE** — el cliente no puede borrar nunca su solicitud. Adecuado para retención CAU/comercial. Sin policy de UPDATE en estados `'paid'`/`'delivered'`/etc — la solicitud queda inmutable desde cliente una vez pagada. Las mutaciones administrativas pasan por `service_role` desde `lib/cbamAdvisoryAdminService.js` (que bypassa RLS).

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| user_id | `auth.users(id)` | **CASCADE** |

**Índices**:
- `idx_advisory_requests_user` — btree `(user_id)`
- `idx_advisory_requests_status` — btree `(status)`
- `cbam_advisory_requests_report_ref_key` — UNIQUE `(report_ref)` (ref interna al PDF generado)

**Triggers**:
- `trg_advisory_requests_updated` — BEFORE UPDATE → `update_advisory_updated_at()` (refresca `updated_at`).

**Versionada en repo**: **Sí** — `scripts/cbam-advisory-schema.sql:10` (definición original). Schema baseline + posibles ampliaciones en `scripts/cbam-advisory-payment-request-schema.sql` y `scripts/cbam-admin-checklist-schema.sql` (los bloques de `payment_request_*` y `admin_checklist` parecen añadidos posteriores).

**Retención sugerida**: **4 años post-cierre** del expediente (art. 51 CAU + obligación mercantil — la solicitud incluye facturación). Una vez `delivered_at`, mantener 4 años, luego anonimizar (`contact_*`, `representative_name`, `client_notes`, `internal_notes`) o eliminar.

**Observaciones**:
- **`user_id` nullable** con FK `CASCADE` — permite huérfanos. La policy INSERT exige `auth.uid() = user_id`, así que de facto no hay nulos. Cambiar a `NOT NULL`.
- **`status` libre `text`** sin CHECK ni enum. Los valores se derivan del código (`'draft'`, `'intake_complete'`, `'paid'`, `'delivered'` aparecen en policies). Añadir CHECK constraint para evitar typos.
- **`payment_status` libre `text`** con default `'unpaid'`. Mismo tratamiento que `status`.
- **Riesgo de borrado en cascada vs. retención CAU**: `ON DELETE CASCADE` borra la solicitud al cerrar `auth.users`. Para conservar 4 años obligatorios, replicar el patrón `user_consents` (Fase 1.3): cambiar a `ON DELETE SET NULL` y rellenar `user_id_hash` antes de borrar la cuenta. Decidir en Fase 7 (al backlog).
- **Sin cron de purga** a 4 años. Como el resto de tablas con retención prometida, queda en Fase 8.
- `contact_email` no tiene CHECK de formato; el endpoint debería validarlo.
- **No hay tabla `organizations`** — `company_*` se almacenan denormalizados en cada request. Coherente con el modelo actual.

---

## cbam_advisory_products

**Filas**: 2

**Propósito inferido del código**: Productos asociados a una solicitud CBAM. Cada fila representa una línea de producto (CN code + país origen + volumen anual + emisiones). Es el detalle desde el que se calcula `total_tonnes`/`total_emissions`/`total_estimated_cost` de la solicitud padre. Endpoints: `app/api/cbam/advisory/[id]/products/route.js` (cliente) + `app/api/admin/cbam/asesoria/[id]/products/route.js` (admin).

**Columnas** (resumen — 23 columnas):
| Bloque | Columnas | Tipo | Notas |
|---|---|---|---|
| ID / FK | `id`, `request_id` (NN), `sort_order` (default 0) | uuid · uuid · int | |
| Producto | `product_description` (NN), `cn_code`, `cn_code_detected`, `sector_id`, `country_code` (NN), `country_name` | text | `cn_code_detected` ≈ sugerido vía heurística sin IA |
| Volumen | `annual_tonnes` (NN) | numeric | |
| Proveedor (PII de terceros) | `supplier_name`, `supplier_contact_email`, `supplier_installation_name`, `supplier_installation_country` | text | Datos de la planta de origen |
| Emisiones | `has_real_emissions` (default false), `emission_factor_real`, `emission_source` (default `'default'`), `production_route`, `emission_factor_applied`, `benchmark_applied`, `emissions_subject_to_cbam`, `total_emissions` | bool/num/text | |
| Coste | `total_cost`, `markup_applied`, `cost_with_real`, `cost_with_default`, `savings_potential` | numeric | |
| Auditoría | `created_at`, `updated_at` | timestamptz | default `now()` |

**Datos personales (PII)**: **Sí, de terceros** — `supplier_contact_email`, `supplier_name`, `supplier_installation_name`. Es información de proveedores extranjeros del cliente. RGPD se aplica a los datos personales de contactos (emails de personas físicas).

**Datos comerciales del usuario**: **Sí** — combinación `cn_code + country_code + annual_tonnes + supplier_*` revela mapping de proveedores y volúmenes por producto. Información altamente sensible competitivamente.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Users can view own products | SELECT | `request_id IN (SELECT id FROM cbam_advisory_requests WHERE user_id = auth.uid())` | — |
| Users can insert own products | INSERT | — | `request_id IN (...)` |
| Users can update own products | UPDATE | idem | — |
| Users can delete own products | DELETE | idem | — |

> Acceso derivado de la solicitud padre. Coherente con `dispatch_*` de Tanda 2. Acceso en cualquier estado de la solicitud (no solo `'draft'`) — diferente del padre. Podría ser intencional (corregir productos mientras admin está en revisión) o un descuido. Confirmar.

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| request_id | `cbam_advisory_requests(id)` | **CASCADE** |

**Índices**:
- `idx_advisory_products_request` — btree `(request_id)`

**Triggers**:
- `trg_advisory_products_updated` — BEFORE UPDATE → `update_advisory_updated_at()`.

**Versionada en repo**: **Sí** — `scripts/cbam-advisory-schema.sql:53`.

**Retención sugerida**: 4 años post-cierre de la solicitud padre. `CASCADE` desde `cbam_advisory_requests` cumple automáticamente.

**Observaciones**:
- **`request_id` NOT NULL** ✓ (bien diseñado, sin nullable).
- **`sector_id` es `text` libre** — no es FK a `cbam_sectors` (otra tabla pública). Posible inconsistencia. Verificar si los valores que entran ahí coinciden con los de `cbam_sectors.id`.
- **Política UPDATE/DELETE accesible en cualquier estado** del request padre — ver nota arriba. Si la intención es que el cliente solo pueda cambiar productos en `draft`/`intake_complete`, alinear con el patrón del request.
- `emission_source` libre `text` con default `'default'` — sin CHECK. Valores esperados (`'default'`, `'real'`, `'mixed'`...) deben enumerarse.
- Datos de proveedores extranjeros (`supplier_*`) son PII de terceros. **Recomendar al cliente que solicite consentimiento** al proveedor antes de meter su email. No es responsabilidad de LexAduana, pero sí debería dejarse claro en la UI / política de privacidad como uso responsable.

---

## cbam_advisory_documents

**Filas**: 0

**Propósito inferido del código**: Metadatos de documentos subidos por el cliente como parte de la solicitud CBAM (Communication Templates oficiales del proveedor, certificados de emisiones, facturas de soporte). El archivo real vive en el bucket Storage `cbam-advisory-docs`. Subida vía `lib/cbamAdvisoryService.js:442 uploadAdvisoryDocument()`. Borrado admin vía `app/api/admin/cbam/asesoria/[id]/documents/[docId]/route.js`.

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| request_id | uuid | **NO** | — |
| file_name | text | NO | — |
| file_type | text | SÍ | — |
| file_path | text | NO | — |
| file_size | int4 | SÍ | — |
| mime_type | text | SÍ | — |
| notes | text | SÍ | — |
| uploaded_at | timestamptz | SÍ | `now()` |

**Datos personales (PII)**: Indirecto en metadatos (`file_name` puede contener nombres). **El contenido de los archivos en Storage sí es PII y datos comerciales** — Communication Templates incluyen nombres de empresas proveedoras y datos de instalación.

**Datos comerciales del usuario**: **Sí** — los documentos son la evidencia del flujo CBAM completo del cliente (facturas, certificados de emisiones, comunicaciones con la planta).

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Users can view own documents | SELECT | `request_id IN (SELECT id FROM cbam_advisory_requests WHERE user_id = auth.uid())` | — |
| Users can insert own documents | INSERT | — | `request_id IN (...)` |

> **Sin UPDATE ni DELETE** desde cliente. Los documentos son inmutables y solo admin (vía `service_role`) puede borrarlos desde el endpoint admin. Coherente con auditoría: el cliente no debería poder retirar evidencias.

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| request_id | `cbam_advisory_requests(id)` | **CASCADE** |

**Índices**:
- `idx_advisory_documents_request` — btree `(request_id)`

**Triggers**: Ninguno.

**Versionada en repo**: **Sí** — `scripts/cbam-advisory-schema.sql:100`.

**Retención sugerida**: 4 años (mismo plazo que la solicitud padre). `CASCADE` limpia la fila al borrar la solicitud, pero **el blob en Storage NO se limpia automáticamente** — requiere un cron que purgue los objetos huérfanos del bucket.

### Bucket asociado: `cbam-advisory-docs`

| Atributo | Valor |
|---|---|
| Public | **`false`** (privado) ✓ |
| Tamaño máximo | 10 MB |
| MIME types permitidos | PDF, JPEG, PNG, XLSX, XLS, CSV |
| Owner | — (gestionado por la app) |

**Políticas de `storage.objects` para este bucket**:

| Nombre | Comando | USING / WITH CHECK |
|---|---|---|
| `policy_cbam_advisory_docs 13bssb1_0` | SELECT | `bucket_id = 'cbam-advisory-docs' AND auth.uid()::text = (storage.foldername(name))[1]` |
| `policy_cbam_advisory_docs 13bssb1_1` | INSERT | `bucket_id = 'cbam-advisory-docs' AND auth.uid()::text = (storage.foldername(name))[1]` |

> ✓ **Aislamiento por carpeta `{user_id}/...`**. La estructura de upload `${userId}/${requestId}/${timestamp}_${filename}` (`lib/cbamAdvisoryService.js:445`) coincide con la regla. Dos usuarios distintos no pueden ver archivos cruzados desde cliente.
>
> ⚠️ Sin policies de UPDATE ni DELETE en `storage.objects` — coherente con la inmutabilidad del cliente (solo `service_role` puede borrar archivos del bucket). Limpieza programada → backlog.

**Observaciones**:
- **`request_id` NOT NULL** ✓.
- **`mime_type` y `file_type` ambos** — duplicidad. `mime_type` (oficial) y `file_type` parece etiqueta libre del usuario (e.g. `'communication_template'`). Documentar la distinción o consolidar.
- **`file_path` no tiene UNIQUE** — dos filas distintas pueden apuntar al mismo blob si por alguna razón se reusa. Considerar UNIQUE o un guard al INSERT.
- Sin cron de limpieza de blobs huérfanos en el bucket. Al borrarse el request padre, las filas se cascadean pero los archivos quedan en Storage. **Hallazgo para Fase 8**.

---

<!-- Sub-tanda 4B completada -->

## cbam_advisory_reports

**Filas**: 0

**Propósito inferido del código**: Reports PDF generados por el admin como entregable al cliente. Cada fila apunta a un PDF en el bucket `cbam-advisory-reports` con su `pdf_path`, captura el snapshot de cálculo en JSONB para auditoría inmutable, y se versiona (`version`, `is_current`). Generación: `app/api/admin/cbam/asesoria/[id]/generate-report/route.js` (con `service_role`, sube vía `lib/cbamAdvisoryAdminService.js:425 uploadReportPdf()`). Liberación al cliente: cambia `cbam_advisory_requests.status` a `'paid'`/`'delivered'`.

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| request_id | uuid | **NO** | — |
| pdf_path | text | NO | — |
| pdf_filename | text | NO | — |
| pdf_size_bytes | int4 | SÍ | — |
| report_ref | text | NO | — |
| report_year | int4 | NO | — |
| calculation_snapshot | jsonb | **NO** | — |
| version | int4 | NO | `1` |
| is_current | bool | NO | `true` |
| generated_at | timestamptz | NO | `now()` |
| generated_by | text | SÍ | — |
| created_at | timestamptz | SÍ | `now()` |

**Datos personales (PII)**: Indirecto vía `calculation_snapshot` (puede contener datos del cliente y proveedores). El PDF en Storage sí contiene PII (datos del cliente, EORI, contacto).

**Datos comerciales del usuario**: **Sí, alto** — el PDF es el entregable final con el cálculo CBAM completo.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Client reads own released reports | SELECT | `request_id IN (SELECT id FROM cbam_advisory_requests WHERE user_id = auth.uid() AND status IN ('paid','delivered'))` | — |

> **Sin INSERT/UPDATE/DELETE para clientes** — solo `service_role` (admin) genera/modifica reports. Cliente solo ve el report **tras pagar**. Diseño correcto.

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| request_id | `cbam_advisory_requests(id)` | **CASCADE** |

**Índices**:
- `idx_advisory_reports_request` — btree `(request_id)`
- `idx_advisory_reports_unique_current` — UNIQUE `(request_id) WHERE is_current = true` — garantiza máximo 1 report "vigente" por solicitud, permitiendo histórico de versiones con `is_current=false`.

**Triggers**: Ninguno.

**Versionada en repo**: **Sí** — `scripts/cbam-advisory-phase3-schema.sql:71`.

**Retención sugerida**: 4 años post-`generated_at` (mismo plazo CAU). `CASCADE` desde request padre limpia la fila; **el PDF en Storage NO se borra automáticamente**.

### Bucket asociado: `cbam-advisory-reports`

| Atributo | Valor |
|---|---|
| Public | **`false`** (privado) ✓ |
| Tamaño máximo | 20 MB |
| MIME types permitidos | PDF únicamente |

**Políticas de `storage.objects` para este bucket**: **NINGUNA**.

> ✓ Esto **es correcto** y deliberado: el bucket solo se accede desde rutas backend usando `service_role` (`supabaseAdmin`). Con RLS activa por defecto en `storage.objects`, ausencia de policies = denegado para `authenticated`/`anon` desde cliente. La descarga al cliente pasa por `app/api/cbam/advisory/[id]/download/route.js`, que valida ownership en BD y devuelve un signed URL con `createSignedUrl` (`lib/cbamAdvisoryAdminService.js:450`). Patrón sólido.

**Observaciones**:
- **`request_id` NOT NULL** ✓.
- **`generated_by` libre `text`** sin FK — debería guardar el `auth.uid()` del admin pero solo guarda email/etiqueta.
- **PDFs en Storage huérfanos al cascade**: cuando se borra el `cbam_advisory_requests`, las filas se cascadean pero los blobs permanecen. Backlog Fase 8.

---

## cbam_advisory_report_downloads

**Filas**: 0

**Propósito inferido del código**: Audit log de descargas del PDF por parte del cliente. Cada vez que el cliente descarga el report (vía signed URL), se registra IP, user-agent y timestamp para trazabilidad.

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| report_id | uuid | NO | — |
| request_id | uuid | NO | — |
| user_id | uuid | SÍ | — |
| downloaded_at | timestamptz | NO | `now()` |
| ip_address | text | SÍ | — |
| user_agent | text | SÍ | — |

**Datos personales (PII)**: **Sí** — `ip_address` (PII según RGPD), `user_agent` (cuasi-identificador). Mismo patrón que `user_consents`.

**Datos comerciales del usuario**: No directamente.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| Client reads own download history | SELECT | `request_id IN (SELECT id FROM cbam_advisory_requests WHERE user_id = auth.uid())` | — |
| Client logs own downloads | INSERT | — | `request_id IN (SELECT id FROM cbam_advisory_requests WHERE user_id = auth.uid() AND status IN ('paid','delivered'))` |

> Sin UPDATE ni DELETE — log inmutable. Audit trail correcto.

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| report_id | `cbam_advisory_reports(id)` | **CASCADE** |
| request_id | `cbam_advisory_requests(id)` | **CASCADE** |
| user_id | `auth.users(id)` | **SET NULL** ✓ |

> ✓ **Único caso del inventario con `ON DELETE SET NULL` correctamente aplicado** sobre `auth.users`. Preserva el audit trail aunque el usuario cierre cuenta. Patrón a replicar en otras tablas con obligación de retención (ver Hallazgos).

**Índices**:
- `idx_advisory_downloads_report` — btree `(report_id)`
- `idx_advisory_downloads_request` — btree `(request_id)`

**Triggers**: Ninguno.

**Versionada en repo**: **Sí** — `scripts/cbam-advisory-phase3-schema.sql:110`.

**Retención sugerida**: 4 años post-`downloaded_at`. Sirve como evidencia de que el cliente recibió el entregable.

**Observaciones**:
- **3 FKs NOT NULL** (`report_id`, `request_id`) + 1 nullable (`user_id`, intencionalmente). Diseño limpio.
- `ip_address` es `text` libre — usar `inet` (como en `user_consents`) sería mejor para validación. No bloqueante.
- **Patrón modelo**: esta tabla aplica correctamente el "preserve audit con `SET NULL`" que el resto del schema debería seguir para retenciones legales.

---

## cbam_calculator_saves

**Filas**: 1

**Propósito inferido del código**: Historial de cálculos guardados de la Calculadora CBAM (free tool, **Nivel 2 freemium** según comentario de la tabla). Diferente del flujo Advisory — esto es el cálculo público sin asesoría humana. Endpoints: `app/api/cbam/calculator/save/route.js` (INSERT), `app/api/cbam/calculator/saves/route.js` (listar), `app/api/cbam/calculator/saves/[id]/route.js` (DELETE).

**Columnas**:
| Columna | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| user_id | uuid | **NO** | — |
| created_at | timestamptz | NO | `now()` |
| calculation_year | int4 | NO | — |
| products | jsonb | NO | — |
| total_cost | numeric | SÍ | — |
| total_certificates | numeric | SÍ | — |
| total_emissions | numeric | SÍ | — |
| result_snapshot | jsonb | SÍ | — |
| source_regulation_version | text | NO | `'v20260204'` |
| notes | text | SÍ | — |

**Datos personales (PII)**: No (solo `user_id`).

**Datos comerciales del usuario**: **Sí** — `products` (jsonb) contiene CN codes, países, toneladas y emisiones que el usuario probó.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| cbam_calculator_saves_select_own | SELECT | `auth.uid() = user_id` | — |
| cbam_calculator_saves_insert_own | INSERT | — | `auth.uid() = user_id` |
| cbam_calculator_saves_delete_own | DELETE | `auth.uid() = user_id` | — |

> Roles `authenticated` (no `public`). Sin UPDATE — saves inmutables.

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| user_id | `auth.users(id)` | **CASCADE** |

**Índices**:
- `idx_calc_saves_user` — btree `(user_id, created_at DESC)` (compuesto, eficiente para listado paginado).

**Triggers**: Ninguno.

**Versionada en repo**: **Sí** — `scripts/cbam-calculator-saves-schema.sql:11`.

**Retención sugerida**: 4 años (proyectado por el usuario). Sin obligación legal estricta (es free tool), pero coherente con el resto del dominio CBAM.

**Observaciones**:
- **`user_id` NOT NULL** ✓ — bien diseñado, sin nullable.
- **Sin UPDATE policy** — el usuario no puede editar un save (consistente con la idea de "snapshot del cálculo en ese momento"). Para corregir hay que borrar e insertar nuevo.
- `source_regulation_version` con default `'v20260204'` (versión hardcoded del CBAM). Cuando cambie la normativa, recordar actualizar.
- Sin cron de purga.

---

## cbam_monitoring_subscriptions

> ℹ️ **Sub-tanda 4C (2026-04-23)** — la migración
> [`20260423160000_cbam_advisory_fixes.sql`](../../supabase/migrations/20260423160000_cbam_advisory_fixes.sql)
> (Bloque 2) añade el CHECK constraint
> `status IN ('submitted','authorized','active','paused','cancelled')`
> (verificado: las 11 filas tienen status `'submitted'`, dentro de la lista).
> La pseudonimización para la retención CAU queda en `BACKLOG_PRIVACIDAD.md`
> para Fase 7.

**Filas**: 11

**Propósito inferido del código**: Suscripciones al servicio premium de **Monitorización CBAM** (199 €/mes según comentario de la tabla). El cliente envía solicitud (`status='submitted'`), admin la autoriza (`authorized_at`), comienza (`started_at`), puede pausarse o cancelarse. Endpoints: `app/api/cbam/monitoring/route.js` (cliente) + `app/api/admin/cbam/suscripciones/*` (admin). Servicio: `lib/cbamMonitoringService.js`.

**Columnas** (resumen — 24 columnas):
| Bloque | Columnas | Tipo | Notas |
|---|---|---|---|
| ID / propietario | `id`, `user_id` (NN), `status` (default `'submitted'`) | uuid · uuid · text | |
| Empresa | `company_name` (NN), `company_cif`, `company_legal_name` | text | |
| Contacto | `contact_name` (NN), `contact_email` (NN), `contact_phone` | text | PII directa |
| Autorización DUA | `dua_authorization_accepted_at`, `dua_authorization_text_version` | timestamptz · text | Trazabilidad de aceptación de la cláusula DUA |
| Catálogo | `main_cbam_products` (text[]), `main_origin_countries` (text[]), `expected_monthly_volume` | array/text | |
| Notas | `client_notes`, `admin_notes` | text | |
| Workflow | `authorized_at`, `started_at`, `paused_at`, `cancelled_at` | timestamptz | Ciclo de vida |
| Admin | `admin_checklist` jsonb (NN, default `'{}'`) | jsonb | |
| Auditoría | `created_at`, `updated_at` | timestamptz NN default `now()` | |

**Datos personales (PII)**: **Sí** — `contact_name`, `contact_email`, `contact_phone`, `company_cif` (PII para autónomos).

**Datos comerciales del usuario**: **Sí** — `main_cbam_products`, `main_origin_countries`, `expected_monthly_volume` revelan estructura comercial del importador.

**RLS habilitada**: Sí

**Políticas RLS**:
| Nombre | Comando | USING | WITH CHECK |
|---|---|---|---|
| cbam_monitoring_select_own | SELECT | `auth.uid() = user_id` | — |
| cbam_monitoring_insert_own | INSERT | — | `auth.uid() = user_id` |
| cbam_monitoring_update_own_client_fields | UPDATE | `auth.uid() = user_id` | `auth.uid() = user_id` |

> Roles `authenticated`. Sin DELETE — el cliente no puede borrar su suscripción (intencional para retención y trazabilidad de cobros). El nombre de la policy UPDATE menciona "client_fields" pero la policy SQL no restringe columnas — es solo el nombre. La restricción de columnas debe enforcer-se en el endpoint backend.

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| user_id | `auth.users(id)` | **CASCADE** |

**Índices**:
- `idx_cbam_monitoring_user` — btree `(user_id, created_at DESC)`
- `idx_cbam_monitoring_status` — btree `(status, created_at DESC)`

**Triggers**:
- `cbam_monitoring_touch_updated_at` — BEFORE UPDATE → `tg_cbam_monitoring_touch_updated_at()` (función específica, distinta del genérico `update_advisory_updated_at`).

**Versionada en repo**: **Sí** — `scripts/sql/cbam-monitoring-subscriptions-schema.sql:18` (única tabla bajo el subdir `scripts/sql/`).

**Retención sugerida**: 4 años post-`cancelled_at` (suscripción cerrada). Sin cron.

**Observaciones**:
- **`user_id` NOT NULL** ✓.
- **`dua_authorization_accepted_at` + `dua_authorization_text_version`** — patrón embedded de "consentimiento operativo" (autorización al despachante para gestionar DUAs). Diferente del `user_consents` general; aquí captura una aceptación específica del servicio. Bien.
- **`status` libre `text`** con default `'submitted'`. Valores esperados (`'submitted'`, `'authorized'`, `'active'`, `'paused'`, `'cancelled'`) sin CHECK. Añadir.
- **`update_own_client_fields`** policy SQL no restringe columnas. Si se quiere bloquear que el cliente cambie `admin_checklist`, `admin_notes`, `authorized_at` etc., hace falta CHECK en `WITH CHECK` o un trigger BEFORE UPDATE. Hoy se confía en el endpoint backend para no exponer esos campos. Aceptable pero anotado.
- Trigger con función propia (`tg_cbam_monitoring_touch_updated_at`) en vez de la genérica `update_advisory_updated_at` o `set_updated_at`. Inconsistencia de nombres entre dominios.

---

## Relaciones del dominio

```
auth.users
    ├── cbam_advisory_requests        (user_id CASCADE)
    │       ├── cbam_advisory_products       (request_id CASCADE)
    │       ├── cbam_advisory_documents      (request_id CASCADE) → bucket cbam-advisory-docs ({user_id}/{request_id}/...)
    │       ├── cbam_advisory_reports        (request_id CASCADE) → bucket cbam-advisory-reports ({request_id}/...)
    │       │       └── cbam_advisory_report_downloads (report_id CASCADE, request_id CASCADE,
    │       │                                            user_id SET NULL ✓)
    │       └── cbam_advisory_report_downloads (request_id CASCADE)
    │
    ├── cbam_calculator_saves         (user_id CASCADE)
    └── cbam_monitoring_subscriptions (user_id CASCADE)

Buckets Storage
    cbam-advisory-docs    (privado, 10 MB, multi-MIME)
        ├── policy SELECT/INSERT por carpeta {user_id}/...
        └── sin UPDATE/DELETE policies (solo service_role)

    cbam-advisory-reports (privado, 20 MB, PDF only)
        └── SIN policies en storage.objects → solo service_role
            (cliente accede vía signed URL desde route handler que valida ownership)

Anthropic API (externo, EEUU)
    ← (ningún endpoint CBAM lo usa)
```

---

## Hallazgos de la Tanda 4

### 🚨 Críticos

Ninguno. **El dominio CBAM Advisory es el más sólido del inventario**:
- Buckets privados con políticas correctas (docs por carpeta de usuario; reports cerrado a service_role).
- RLS bien diseñada en las 7 tablas (acceso a hijas derivado del request padre, reports solo tras `'paid'`/`'delivered'`).
- Sin transferencias a Anthropic (verificado por grep exhaustivo).
- Inmutabilidad bien aplicada (sin UPDATE/DELETE en docs y reports desde cliente; sin DELETE en requests).
- 7/7 tablas versionadas en `scripts/`.
- `cbam_advisory_report_downloads.user_id ON DELETE SET NULL` es **el único caso del inventario que aplica correctamente** el patrón de preservación de audit ante baja de cuenta — modelo a replicar en otras tablas.

### ⚠️ Altos — al backlog / Fase 7

1. **`cbam_advisory_requests.user_id` con FK `CASCADE` incumple retención CAU 4 años** al cerrar cuenta. Mismo problema que `user_consents` resuelto en Fase 1.3. Replicar patrón `ON DELETE SET NULL + user_id_hash` para conservar evidencia de la solicitud y de su facturación. Aplica también a `cbam_advisory_documents` y `cbam_advisory_reports` (cascadean desde requests, así que con corregir requests se hereda).
2. **`cbam_calculator_saves` y `cbam_monitoring_subscriptions` con FK `CASCADE`** — al cerrar cuenta se borran. Para `cbam_monitoring_subscriptions` (servicio de pago, 199 €/mes) hay obligación mercantil de conservar evidencia de cobro. Decidir igual que arriba.

### ⚠️ Altos — Fase 8 (cron)

3. **Sin cron de purga a 4 años** para ninguna de las 7 tablas. Mismo patrón que dominios anteriores.
4. **Sin limpieza de blobs huérfanos** en buckets `cbam-advisory-docs` y `cbam-advisory-reports`. Cuando se borra un `cbam_advisory_requests` (CASCADE), las filas se limpian pero los archivos en Storage permanecen. Necesita worker que escanee blobs sin fila correspondiente y los borre.

### 🟡 Medios — consolidar en Sub-tanda 4C

5. **`cbam_advisory_requests.user_id` nullable** pese a FK `CASCADE`. Endurecer a `NOT NULL` (verificar 0 huérfanos previos sobre 2 filas).
6. **`status` y `payment_status` libres `text`** sin CHECK en `cbam_advisory_requests`. Añadir CHECK con la enumeración real (`'draft'`, `'intake_complete'`, `'paid'`, `'delivered'`, etc.).
7. **`status` libre `text`** en `cbam_monitoring_subscriptions`. Mismo tratamiento.
8. **`cbam_advisory_products` UPDATE/DELETE accesible en cualquier estado** del request padre — desalineado con el bloqueo del request en `'paid'`/`'delivered'`. Decidir si alinear (más restrictivo) o documentar que es deliberado para permitir correcciones del cliente durante la revisión.

### 🟢 Bajos / cosméticos

9. **`mime_type` y `file_type` ambos** en `cbam_advisory_documents` — duplicidad o distinción no documentada.
10. **`generated_by` libre `text`** en `cbam_advisory_reports` — guardar `auth.uid()` del admin sería trazable, hoy se almacena email/etiqueta.
11. **3 nombres de funciones de updated_at distintos** entre dominios: `update_advisory_updated_at`, `set_updated_at`, `tg_cbam_monitoring_touch_updated_at`, más el de invoice_extractions y dispatches. Consolidar en una sola.
12. **`source_regulation_version`** hardcoded en `cbam_calculator_saves` (`'v20260204'`). Recordar actualizar al migrar normativa.
13. **`update_own_client_fields`** en `cbam_monitoring_subscriptions` no restringe columnas en el SQL (la restricción está en el endpoint). Considerar añadir un trigger BEFORE UPDATE que rechace cambios sobre columnas `admin_*`, `authorized_at`, etc. para defense-in-depth.

### Correcciones propuestas para Sub-tanda 4C

Una sola migración `supabase/migrations/YYYYMMDDHHMMSS_cbam_advisory_fixes.sql`:

```sql
-- 1. cbam_advisory_requests.user_id NOT NULL (con DO block de verificación)
DO $$
DECLARE n INT;
BEGIN
  SELECT COUNT(*) INTO n FROM public.cbam_advisory_requests WHERE user_id IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'Huérfanos en cbam_advisory_requests: %', n; END IF;
END $$;
ALTER TABLE public.cbam_advisory_requests ALTER COLUMN user_id SET NOT NULL;

-- 2. CHECK constraints para status y payment_status
ALTER TABLE public.cbam_advisory_requests
  ADD CONSTRAINT cbam_advisory_requests_status_check
  CHECK (status IN ('draft','intake_complete','submitted','in_review','paid','delivered','cancelled'));

ALTER TABLE public.cbam_advisory_requests
  ADD CONSTRAINT cbam_advisory_requests_payment_status_check
  CHECK (payment_status IN ('unpaid','requested','paid','refunded'));
-- (ajustar enums según los valores reales en uso; verificar previo:
--   SELECT DISTINCT status FROM cbam_advisory_requests;
--   SELECT DISTINCT payment_status FROM cbam_advisory_requests;)

-- 3. CHECK para cbam_monitoring_subscriptions.status
ALTER TABLE public.cbam_monitoring_subscriptions
  ADD CONSTRAINT cbam_monitoring_subscriptions_status_check
  CHECK (status IN ('submitted','authorized','active','paused','cancelled'));

-- 4. PENDIENTES (no en esta migración, decisión tuya):
--    - Replicar patrón user_consents (SET NULL + user_id_hash) en cbam_advisory_requests,
--      cbam_calculator_saves, cbam_monitoring_subscriptions. Bloque para Fase 7.
--    - Alinear policies UPDATE/DELETE de cbam_advisory_products con el bloqueo del request.
--    - Crons de purga + limpieza de blobs huérfanos. Fase 8.
```

Checks previos recomendados:

```sql
SELECT DISTINCT status FROM public.cbam_advisory_requests;
SELECT DISTINCT payment_status FROM public.cbam_advisory_requests;
SELECT DISTINCT status FROM public.cbam_monitoring_subscriptions;
SELECT 'cbam_advisory_requests' tbl, COUNT(*) FILTER (WHERE user_id IS NULL) huerfanos
FROM public.cbam_advisory_requests;
```
