# Inventario — Dominio Clasificación IA + OCR + Alertas

**Tanda**: 3 / 8 (parcial — sub-tanda 3A)
**Fecha**: 2026-04-23
**Schema**: `public`
**Tablas esta sub-tanda**: `classification_logs`, `classification_examples`, `invoice_extractions`, `rrm_requests`
**Pendientes (sub-tanda 3B)**: `monitored_codes`, `alert_notifications`

> Fuente: `information_schema` + `pg_catalog` + `storage.buckets` + grep del repo + lectura de endpoints relevantes.

---

## classification_logs

**Filas**: 732

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

<!-- TANDA 3 INCOMPLETA: faltan monitored_codes, alert_notifications y sección "Hallazgos de la Tanda 3" -->
