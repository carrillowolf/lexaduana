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

<!-- TANDA 4 INCOMPLETA: faltan cbam_advisory_reports, cbam_advisory_report_downloads, cbam_calculator_saves, cbam_monitoring_subscriptions y la sección "Hallazgos de la Tanda 4" -->
