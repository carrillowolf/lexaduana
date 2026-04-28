# Inventario — Dominio CBAM Reference Data

**Tanda**: 5 / 8 (parcial — sub-tanda 5A)
**Fecha**: 2026-04-23
**Schema**: `public`
**Tablas esta sub-tanda**: `cbam_sectors`, `cbam_cn_codes`, `cbam_emission_factors`, `cbam_benchmarks`, `cbam_excluded_countries`
**Pendientes (sub-tanda 5B)**: `cbam_cn_codes_full`, `cbam_benchmarks_official`, `cbam_default_value_markup`, `cbam_default_values_official`, `cbam_certificates`, `cbam_timeline`, `cbam_ets_prices`, `cbam_regulations`, `cbam_config`, `cbam_countries`

> Fuente: `information_schema` + `pg_catalog` + grep del repo. Reference data — sin PII y sin datos comerciales del usuario en ninguna de las 15 tablas. Mutación reservada a `service_role` (admin manual o scripts ETL).
>
> **Patrón RLS uniforme** detectado por consulta a `pg_policies`: las 15 tablas tienen **una única policy** `<tabla>_public_read` con `cmd=SELECT, role=public, USING true`. Ninguna tiene `ALL`/INSERT/UPDATE/DELETE para usuarios — exposición sólo de lectura. **No se reproduce el problema de `checklist_templates`** (Tanda 2). Verificación reportada en Hallazgos finales (sub-tanda 5B).
>
> **Sin CHECK constraints**: `pg_constraint contype='c'` para tablas `cbam_*` reference data devuelve `[]`. Ninguna restricción documental sobre valores de `sector_id`, `gas`, `regulation_type`, etc. Propuesta consolidada en sub-tanda 5B.

---

## cbam_sectors

**Filas**: 6

**Propósito**: Catálogo maestro de sectores CBAM (cemento, hierro/acero, aluminio, fertilizantes, electricidad, hidrógeno). Es el **dimensión raíz** del dominio: `cbam_cn_codes`, `cbam_emission_factors` y `cbam_benchmarks` tienen FK a `cbam_sectors(id)`. Pkey **`text`** (e.g. `'cement'`, `'steel'`) — diseño de slug en vez de uuid/int. Usado en `lib/cbamAssessmentData.js` y `lib/cbamService.js`.

**Columnas** (13):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (text PK) | slug del sector |
| Display | `name`, `name_en`, `icon`, `color` | i18n + tema visual |
| Reglas | `gases` (text[]), `emissions_type`, `de_minimis_applies` (bool default true) | aplicación CBAM |
| Estado | `is_active` (bool default true), `sort_order` | orden y deprecación lógica |
| Auditoría | `description`, `created_at`, `updated_at` | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · Policy única `cbam_sectors_public_read` (SELECT, role=`public`, USING `true`)

**Foreign keys**: ninguna saliente. Es referenciada por 3 tablas hijas (cn_codes, emission_factors, benchmarks).

**Índices**: solo pkey sobre `(id)`.

**Triggers**: `cbam_sectors_updated_at` BEFORE UPDATE.

**Versionada en repo**: **Sí** — `scripts/cbam-schema.sql:12`.

**Retención sugerida**: indefinida (datos maestros normativos).

**Observaciones**:
- `id` como `text` slug — patrón coherente con datos categóricos del dominio. La FK desde `cbam_advisory_products.sector_id` (Tanda 4) **es text libre, sin FK** explícita a esta tabla. Documentar esa inconsistencia ya queda recogida en Tanda 4.
- `is_active = false` permite deprecar un sector sin borrarlo. Bueno.
- Sin CHECK sobre `emissions_type` (libre `text`). Valores esperables: `'direct'`, `'direct_indirect'`, `'aggregated'`. Considerar enum cuando se haga la limpieza.
- Sin índice sobre `is_active` — irrelevante con 6 filas.

---

## cbam_cn_codes

**Filas**: 42

**Propósito**: Códigos CN (Combined Nomenclature, NC8) que están dentro del scope CBAM. Cada fila enlaza un CN code con un sector + gas + flag downstream + ventana de vigencia. Útil para detectar si un producto importado está sujeto a CBAM. Usado en `lib/cbamService.js` y `app/admin/cbam/page.js`. **El par "duplicado" `cbam_cn_codes_full` (sub-tanda 5B) tiene 0 filas y diferente esquema** — ver sección comparativa al final.

**Columnas** (13):
| Bloque | Columnas | Notas |
|---|---|---|
| ID + FK | `id` (int4 seq), `sector_id` text (FK → `cbam_sectors`) | |
| CN | `cn_code` text (NN), `description` text (NN), `gas` text (NN) | |
| Flags | `is_chapter` bool (def false), `is_downstream` bool (def false), `excluded_codes` text[] | |
| Vigencia | `effective_from` date (def `'2026-01-01'`), `effective_to` date | versionado por fecha |
| Trazabilidad | `regulation_ref` text, `created_at`, `updated_at` | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `cbam_cn_codes_public_read` (SELECT, public, true)

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| sector_id | `cbam_sectors(id)` | NO ACTION (default) |

**Índices**:
- `cbam_cn_codes_cn_code_effective_from_key` — UNIQUE `(cn_code, effective_from)` (versionado por fecha)
- `idx_cbam_cn_codes_code` — btree `(cn_code)`
- `idx_cbam_cn_codes_sector` — btree `(sector_id)`
- `idx_cbam_cn_codes_active` — btree `(effective_from, effective_to)`

**Triggers**: `cbam_cn_codes_updated_at` BEFORE UPDATE.

**Versionada en repo**: **Sí** — `scripts/cbam-schema.sql:32`.

**Retención sugerida**: indefinida; las filas obsoletas se marcan con `effective_to` en lugar de borrarse.

**Observaciones**:
- Diseño **versionado temporal** (`effective_from/to`) — patrón correcto para reglas que cambian por reglamento. UNIQUE `(cn_code, effective_from)` permite tener múltiples versiones del mismo CN code.
- `gas` libre `text` sin CHECK. Valores esperables: `'CO2'`, `'N2O'`, `'PFC'`, `'CO2 + N2O'`, etc. Añadir enum reduciría errores de carga.
- `excluded_codes` es `text[]` — semántica: subcódigos del propio `cn_code` que NO aplican aunque sean parte del capítulo. Solo tiene sentido cuando `is_chapter = true`.

---

## cbam_emission_factors

**Filas**: 13

**Propósito**: Factores de emisión por defecto por producto/sector (kg CO2e por tonelada). Usado en cálculos cuando el importador NO tiene datos reales del proveedor. Campos en español + inglés (i18n). FK a `cbam_sectors`.

**Columnas** (12):
| Bloque | Columnas | Notas |
|---|---|---|
| ID + FK | `id` (int4 seq), `sector_id` text (NN, FK) | |
| Producto | `product_key` text (NN), `product_name` text (NN), `product_name_en` text | |
| Factor | `factor_value` numeric (NN), `unit` text (def `'tCO2e/t'`) | |
| Aplicabilidad | `applicable_cn_codes` text[] | qué CN codes aplican este factor |
| Vigencia | `effective_from` date (NN, def `'2026-01-01'`), `effective_to` date | |
| Trazabilidad | `regulation_ref`, `created_at`, `updated_at` | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `cbam_emission_factors_public_read` (SELECT, public, true)

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| sector_id | `cbam_sectors(id)` | NO ACTION |

**Índices**:
- `idx_cbam_ef_sector` — btree `(sector_id)`

**Triggers**: `cbam_emission_factors_updated_at` BEFORE UPDATE.

**Versionada en repo**: **Sí** — `scripts/cbam-schema.sql:57`.

**Retención sugerida**: indefinida.

**Observaciones**:
- `applicable_cn_codes text[]` es un anti-pattern relacional (debería ser tabla de unión `cbam_emission_factor_cn_codes`). Acceptable para volumen pequeño (13 filas) pero limita queries del tipo "qué factor aplica al CN code X".
- Sin índice sobre `effective_from/to` ni sobre `product_key`. Volumen bajo, irrelevante.
- `unit` libre con default `'tCO2e/t'`. Si se introducen otras unidades (kg, m³), conviene CHECK/enum.

---

## cbam_benchmarks

**Filas**: 24

**Propósito**: Valores benchmark (referencias regulatorias) por sector. Usados como comparativa visual y para cálculos derivados. Diseño "v1" sencillo: `sector_id + benchmark_key + value + unit`. **El par "duplicado" `cbam_benchmarks_official` (sub-tanda 5B) tiene 1804 filas y un esquema mucho más detallado por CN code y ruta de producción** — ver sección comparativa al final.

**Columnas** (12):
| Bloque | Columnas | Notas |
|---|---|---|
| ID + FK | `id` (int4 seq), `sector_id` text (NN, FK) | |
| Identificador | `benchmark_key` text (NN), `description` text (NN) | |
| Valor | `value` numeric (NN), `unit` text (def `'tCO2e/t'`), `is_default` bool (def false) | |
| Vigencia | `year_from` int (NN, def 2026), `year_to` int | resolución anual, no por fecha |
| Trazabilidad | `regulation_ref`, `created_at`, `updated_at` | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `cbam_benchmarks_public_read` (SELECT, public, true)

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| sector_id | `cbam_sectors(id)` | NO ACTION |

**Índices**:
- `idx_cbam_benchmarks_sector` — btree `(sector_id)`

**Triggers**: `cbam_benchmarks_updated_at` BEFORE UPDATE.

**Versionada en repo**: **Sí** — `scripts/cbam-schema.sql:79`.

**Retención sugerida**: indefinida.

**Observaciones**:
- Conteo de uso en grep: **5 referencias en código** (más que `_official`, que tiene 3). Sigue siendo la fuente activa pese a tener menos filas.
- Versionado por **año** (`year_from/to int`) en lugar de fecha — más groseramente granulado que `cbam_cn_codes` (`effective_from/to date`). Aceptable porque los benchmarks regulatorios suelen ser anuales.
- `benchmark_key` libre — sin CHECK ni UNIQUE. Recomendable UNIQUE compuesto `(sector_id, benchmark_key, year_from)` para evitar duplicados por error.

---

## cbam_excluded_countries

**Filas**: 7

**Propósito**: Países excluidos del CBAM por tener un sistema ETS equivalente al europeo (Islandia, Noruega, Suiza, Liechtenstein y similares). Si un importador trae mercancía desde uno de estos países, no se aplica CBAM. Usado en cálculos del simulador y de la asesoría.

**Columnas** (8):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq), `country_code` text (NN, UNIQUE), `country_name` text (NN) | |
| Motivo | `reason` text (NN), `exclusion_type` text (def `'ets'`) | razón regulatoria |
| Vigencia | `effective_from` date (def `'2026-01-01'`), `effective_to` date | |
| Auditoría | `created_at` | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `cbam_excluded_countries_public_read` (SELECT, public, true)

**Foreign keys**: ninguna.

**Índices**:
- `cbam_excluded_countries_country_code_key` — UNIQUE `(country_code)`

**Triggers**: ninguno.

**Versionada en repo**: **Sí** — `scripts/cbam-schema.sql:100`.

**Retención sugerida**: indefinida (catálogo regulatorio).

**Observaciones**:
- Único caso del bloque con UNIQUE sobre `country_code` (las otras tablas con `country_code` no tienen). Es el caso correcto: la tabla actúa como lista de inclusión binaria.
- `exclusion_type` libre con default `'ets'`. Si en el futuro se añade `'bilateral_agreement'` u otros, considerar CHECK.
- Sin trigger `updated_at` — pero la tabla tampoco tiene columna `updated_at`. Coherente.
- Comparte propósito conceptual con `cbam_countries` (sub-tanda 5B, 0 filas) — ver análisis de duplicidades en hallazgos finales.

---

<!-- Sub-tanda 5B-1: añadidas cbam_cn_codes_full, cbam_benchmarks_official, cbam_default_value_markup, cbam_default_values_official, cbam_certificates -->

## cbam_cn_codes_full

**Filas**: **0**

**Propósito inferido**: Tabla de CN codes "enriquecida" con metadatos extensos de la asesoría CBAM (rutas de producción, precursores, datos extra requeridos, calidad del dato, indicador de carbon price abroad). Diseñada para reemplazar/complementar `cbam_cn_codes` con un esquema mucho más detallado (19 columnas vs 13). **No tiene filas hoy** — la carga prevista nunca se ha completado. Referenciada 3 veces en grep de código (probablemente en scripts ETL o admin de carga, no en la app activa).

**Columnas** (19, agrupadas):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq), `cn_code` varchar (NN, UNIQUE) | UNIQUE simple, no versionado por fecha |
| Categorización | `main_category` varchar (NN), `aggregated_category` varchar (NN), `description` | Más granular que `cbam_cn_codes` |
| Aplicabilidad | `cbam_applies` bool (def true), `indirect_emissions` bool (def true), `carbon_price_abroad` bool (def true) | |
| Datos técnicos | `quantity_unit`, `installation_data`, `special_provisions`, `production_routes`, `production_routes_detail`, `precursors`, `extra_data_required`, `indirect_emissions_data`, `data_quality` | todos `text` |
| Vigencia | `effective_from` date (def `'2026-01-01'`), `effective_to` date | |
| Auditoría | `created_at`, `updated_at` | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `cbam_cn_codes_full_public_read` (SELECT, public, true)

**Foreign keys**: ninguna.

**Índices**: pkey, UNIQUE `(cn_code)`, btree `(cn_code)`, btree `(main_category)`, btree `(aggregated_category)`.

**Triggers**: `cbam_cn_codes_full_updated_at` BEFORE UPDATE.

**Versionada en repo**: **Sí** — `scripts/cbam-assessment-schema.sql:12`.

**Retención sugerida**: indefinida.

**Observaciones**:
- **0 filas + esquema más completo que `cbam_cn_codes`** = candidata clara a "feature a medio implementar". Decidir en sub-tanda 5C: cargar (sustituir o complementar a `cbam_cn_codes`) vs deprecar (RENAME a `_deprecated_cbam_cn_codes_full`, revisión 90 días).
- UNIQUE sobre `cn_code` (sin `effective_from`) — distinto del patrón versionado temporal de `cbam_cn_codes`. Si se cargara, no permitiría tener varias versiones del mismo CN code en simultáneo.
- Casi todos los campos técnicos son `text` libres sin CHECK (`production_routes`, `data_quality`, `quantity_unit`...). Si se carga en serio, conviene enums.
- La columna `indirect_emissions` (bool) y `indirect_emissions_data` (text) coexisten — la primera flag, la segunda descripción. Coherente.

---

## cbam_benchmarks_official

**Filas**: 1804

**Propósito inferido**: Tabla v2 de benchmarks oficiales del Reglamento (EU) 2025/2620 (referencia regulatoria). Por CN code + sector con dos columnas (A y B) cada una con valor + indicador de ruta de producción. Mucho más detallada que `cbam_benchmarks` (1804 vs 24 filas). Usada en cálculos detallados según el grep (3 referencias en código). Convive con `cbam_benchmarks` (5 referencias) — coexistencia, no duplicación. Ver análisis de pares al final del archivo.

**Columnas** (14, agrupadas):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq), `cn_code` varchar (NN), `sector` varchar (NN), `description` text | sector como `varchar` libre, **no FK** a `cbam_sectors` |
| Valores | `column_a_value` num (def 0), `column_a_route_indicator` varchar, `column_b_value` num (def 0), `column_b_route_indicator` varchar | dos rutas de producción comparables |
| Trazabilidad | `regulation_ref` varchar (def `'(EU) 2025/2620'`), `effective_from` date (def `'2026-01-01'`), `effective_to` date | |
| Origen del dato | `source_version` varchar, `source_date` date | versión del fichero oficial cargado |
| Auditoría | `created_at`, `updated_at` | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `cbam_benchmarks_official_public_read` (SELECT, public, true)

**Foreign keys**: ninguna.

**Índices**:
- `idx_benchmarks_off_cn` — btree `(cn_code)`
- `idx_benchmarks_off_sector` — btree `(sector)`

**Triggers**: `cbam_benchmarks_official_updated_at` BEFORE UPDATE.

**Versionada en repo**: **Sí** — `scripts/cbam-assessment-schema.sql:48`.

**Retención sugerida**: indefinida (datos regulatorios).

**Observaciones**:
- **`sector` es `varchar` libre, sin FK** a `cbam_sectors(id)` — inconsistente con `cbam_cn_codes.sector_id text` (FK). Probablemente porque la carga viene del Excel oficial y los nombres no coinciden 1:1 con los slugs de `cbam_sectors`. Documentar el mapping en código.
- **Sin UNIQUE** sobre `(cn_code, ...)` — permite varias filas para el mismo CN code (esperable: una por ruta de producción A/B y por versión). Pero también permite duplicados accidentales en cargas ETL. Considerar UNIQUE compuesto `(cn_code, sector, source_version)` cuando se decida.
- 1804 filas con 2 índices — adecuado para los queries por CN code o sector.

---

## cbam_default_value_markup

**Filas**: 3

**Propósito inferido**: Porcentaje de markup (incremento) que se aplica a los valores de emisión por defecto cada año. Tabla auxiliar pequeña — 1 fila por año (probablemente 2026, 2027, 2028 con porcentajes crecientes 20%/30%/50% según evolución regulatoria). Usada por la calculadora CBAM. **No es un par duplicado de `cbam_default_values_official`**, sino su complemento (proporciona los multiplicadores que `cbam_default_values_official.with_markup_2026/2027/2028` ya aplican y materializan).

**Columnas** (7):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq), `year` int (NN, **UNIQUE**) | una fila por año |
| Markup | `markup_pct` numeric (NN), `label` text (NN) | ej. `25%`, `'Markup transición'` |
| Trazabilidad | `description`, `regulation_ref`, `created_at` | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `cbam_default_value_markup_public_read` (SELECT, public, true)

**Foreign keys**: ninguna.

**Índices**: pkey + UNIQUE `(year)`.

**Triggers**: ninguno (sin columna `updated_at`).

**Versionada en repo**: **Sí** — `scripts/cbam-schema.sql:166`.

**Retención sugerida**: indefinida.

**Observaciones**:
- UNIQUE sobre `year` correctamente impide tener dos markups distintos para el mismo año.
- Sin trigger updated_at + sin columna `updated_at` — coherente. Si en el futuro hay correcciones de markup tras publicar reglamento, sería útil registrar `updated_at`.
- `label` libre — valores esperables: `'Transitional 2026'`, `'Transitional 2027'`, `'Definitive'`. Sin CHECK.

---

## cbam_default_values_official

**Filas**: 11805

**Propósito inferido**: Valores oficiales por defecto de emisión por país × CN code, según Reglamento (EU) 2025/2621. Es la **tabla más grande del dominio reference data**. Cada fila es la combinación (país de origen, CN code) con direct/indirect/total emissions y los pre-calculados con markup para 2026/2027/2028. Usada cuando el importador no tiene datos reales del proveedor.

**Columnas** (16, agrupadas):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq), `country_code` varchar (NN), `country_name` varchar, `cn_code` varchar (NN) | sin UNIQUE compuesto |
| Producto | `description` text, `sector` varchar, `production_route` varchar | sector libre (mismo patrón que `cbam_benchmarks_official`) |
| Emisiones base | `direct_emissions` num, `indirect_emissions` num, `total_emissions` num | tCO2e/t |
| Pre-cálculo con markup | `with_markup_2026` num, `with_markup_2027` num, `with_markup_2028` num | aplican el `cbam_default_value_markup.markup_pct` |
| Trazabilidad | `regulation_ref` varchar (def `'(EU) 2025/2621'`), `source_version` varchar, `source_date` date | |
| Auditoría | `created_at`, `updated_at` | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `cbam_dv_official_public_read` (SELECT, public, true) — **nombre de policy distinto al patrón** (`cbam_dv_off...` vs `cbam_default_values_official_public_read`). No afecta funcionalidad.

**Foreign keys**: ninguna.

**Índices** (4):
- `idx_dv_off_cn` — btree `(cn_code)`
- `idx_dv_off_country` — btree `(country_code)`
- `idx_dv_off_country_cn` — btree `(country_code, cn_code)` (compuesto, optimiza el query típico)
- `idx_dv_off_sector` — btree `(sector)`

**Triggers**: `cbam_dv_official_updated_at` BEFORE UPDATE.

**Versionada en repo**: **Sí** — `scripts/cbam-official-data-v2-schema.sql:28`.

**Retención sugerida**: indefinida (catálogo regulatorio).

**Observaciones**:
- **Sin UNIQUE** sobre `(country_code, cn_code, source_version)` — permite duplicados por carga ETL repetida. La siguiente carga del Excel oficial debería hacer un upsert idempotente o limpiar antes; documentar el procedimiento.
- 11805 filas y 4 índices: bien dimensionado para los queries del dominio.
- `country_name` denormalizado del `country_code` — potencialmente inconsistente con `cbam_countries` (que está vacía). Mientras `cbam_countries` no se cargue, `country_name` aquí es la fuente de verdad por país.
- `sector` libre — mismo problema que `cbam_benchmarks_official`. Mapping a `cbam_sectors.id` no garantizado.

---

## cbam_certificates

**Filas**: 7

**Propósito inferido**: Certificados aduaneros relacionados con CBAM (códigos de certificación, condicionalidad, validez por sector). Tabla pequeña con configuración de qué certificados son requeridos/opcionales y a qué sectores aplican o NO aplican. Usada por la lógica de checklists CBAM o de productos importados.

**Columnas** (9):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `code` text (**PK**), `description` text (NN) | PK textual, sin id numérico |
| Reglas | `is_required` bool (def false), `condition_code` text, `applies_to_sectors` text[], `not_applies_to_sectors` text[] | |
| Vigencia | `valid_until` date, `sort_order` int (def 0) | sin `effective_from` |
| Auditoría | `created_at` | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `cbam_certificates_public_read` (SELECT, public, true)

**Foreign keys**: ninguna.

**Índices**: pkey UNIQUE sobre `(code)`. Sin más índices.

**Triggers**: ninguno (sin columna `updated_at`).

**Versionada en repo**: **Sí** — `scripts/cbam-schema.sql:115`.

**Retención sugerida**: indefinida.

**Observaciones**:
- PK textual `code` — coherente con `cbam_sectors` (slug) y `cbam_config` (key). Patrón tripartito en reference data.
- **`applies_to_sectors text[]` + `not_applies_to_sectors text[]`** — semántica antiintuitiva (lista positiva + lista negativa coexisten). Probablemente para cubrir el caso "aplica a todos excepto X". Documentar la lógica de prioridad cuando ambas estén llenas.
- Sin `updated_at` — los cambios regulatorios no quedan trazados. En 5C podría añadirse si se considera relevante para audit.
- `valid_until` sin `effective_from` — asume que el certificado está vigente desde siempre hasta `valid_until`. Para certificados que cambian, se necesitaría versionado por fecha como `cbam_cn_codes`.

---

<!-- Sub-tanda 5B-2: añadidas cbam_timeline, cbam_ets_prices, cbam_regulations, cbam_config, cbam_countries -->

## cbam_timeline

**Filas**: 12

**Propósito inferido**: Línea temporal de hitos regulatorios CBAM (transición 2026, definitivo 2026, paquetes Omnibus, etc.) para mostrar en la UI de la web (página informativa CBAM). Cada fila es un evento con fecha, título, descripción y tipo. Incluye flag `is_new` y `sort_order` para destacar/ordenar visualmente.

**Columnas** (11):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq) | |
| Evento | `event_date` date (NN), `title` text (NN), `description` text (NN), `event_type` text (NN) | tipo libre |
| Display | `quarter_label`, `icon`, `is_new` bool (def false), `sort_order` int (def 0) | |
| Auditoría | `created_at`, `updated_at` | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `cbam_timeline_public_read` (SELECT, public, true)

**Foreign keys**: ninguna.

**Índices**: solo pkey.

**Triggers**: `cbam_timeline_updated_at` BEFORE UPDATE.

**Versionada en repo**: **Sí** — `scripts/cbam-schema.sql:131`.

**Retención sugerida**: indefinida.

**Observaciones**:
- `event_type` libre (`text`). Valores esperables: `'milestone'`, `'regulation'`, `'omnibus'`, `'transition'`. Sin CHECK.
- Sin índice sobre `event_date` ni `sort_order` — innecesario con 12 filas, pero si crece conviene `(sort_order, event_date)`.
- `quarter_label` (e.g. `'Q1 2026'`) denormalizado de `event_date` — para etiquetar visualmente sin recalcular.

---

## cbam_ets_prices

**Filas**: 2

**Propósito inferido**: Precios del mercado ETS (EU Allowance) usados en cálculos CBAM (€/tCO2). Solo una fila debería tener `is_current = true` en cada momento (precio vigente); el resto es histórico. UNIQUE compuesto evita duplicados por origen y fecha.

**Columnas** (7):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq) | |
| Precio | `price` numeric (NN), `price_date` date (NN), `price_type` text (def `'closing'`), `source` text (NN) | |
| Estado | `is_current` bool (def false) | |
| Auditoría | `created_at` | sin updated_at |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `cbam_ets_prices_public_read` (SELECT, public, true)

**Foreign keys**: ninguna.

**Índices**:
- `cbam_ets_prices_price_date_price_type_source_key` — UNIQUE `(price_date, price_type, source)`
- `idx_cbam_ets_current` — btree `(is_current) WHERE is_current = true` (parcial, solo la fila vigente)

**Triggers**: ninguno (sin columna `updated_at`).

**Versionada en repo**: **Sí** — `scripts/cbam-schema.sql:149`.

**Retención sugerida**: histórico indefinido (datos de mercado, útiles para auditoría y comparativas).

**Observaciones**:
- **Sin garantía de unicidad de `is_current = true`** — el índice parcial no impide tener varias filas con `is_current = true`. Sería más seguro un UNIQUE parcial: `CREATE UNIQUE INDEX ... ON (is_current) WHERE is_current = true`. Riesgo bajo (cargas controladas vía service_role) pero documentar.
- `price_type` libre con default `'closing'`. Valores esperables: `'closing'`, `'opening'`, `'avg'`. Sin CHECK.
- `source` libre. Valores esperables: `'EEX'`, `'ICE'`. Sin CHECK.
- Sin `updated_at` → si se corrige un precio cargado, no queda traza. Aceptable porque típicamente se inserta nuevo y se voltea `is_current`.

---

## cbam_regulations

**Filas**: 7

**Propósito inferido**: Catálogo de reglamentos europeos CBAM (referencias, títulos, fechas de publicación/entrada en vigor, URL al texto oficial). Sirve para mostrar en la UI un índice navegable de la legislación aplicable y como FK lógica desde otras tablas vía `regulation_ref` (texto, no FK real).

**Columnas** (10):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq), `reference` text (NN, **UNIQUE**) | e.g. `'(EU) 2025/2620'` |
| Metadata | `title` text (NN), `regulation_type` text, `status` text (def `'in_force'`) | tipo y estado libres |
| Fechas | `publication_date` date, `effective_date` date | |
| Contenido | `summary` text, `url` text | enlace a EUR-Lex |
| Auditoría | `created_at` | sin updated_at |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `cbam_regulations_public_read` (SELECT, public, true)

**Foreign keys**: ninguna saliente. Es referenciada **lógicamente** (no por FK SQL) desde `regulation_ref` en `cbam_cn_codes`, `cbam_emission_factors`, `cbam_benchmarks`, `cbam_benchmarks_official`, `cbam_default_value_markup`, `cbam_default_values_official`, `cbam_excluded_countries`.

**Índices**: pkey + UNIQUE `(reference)`.

**Triggers**: ninguno (sin columna `updated_at`).

**Versionada en repo**: **Sí** — `scripts/cbam-schema.sql:180`.

**Retención sugerida**: indefinida.

**Observaciones**:
- `reference` UNIQUE — diseño correcto. Evita duplicar el mismo Reglamento.
- `regulation_type` libre. Valores esperables: `'implementing'`, `'delegated'`, `'omnibus'`, `'main'`. Sin CHECK.
- `status` libre con default `'in_force'`. Valores esperables: `'in_force'`, `'repealed'`, `'pending'`. Sin CHECK.
- **Las columnas `regulation_ref`** en otras tablas son `text`/`varchar` libres y no FK reales a esta tabla. Si se quisiera integridad estricta, habría que añadir FKs (con el coste de invalidar cargas que mencionen un reglamento aún no insertado en `cbam_regulations`).
- Sin `updated_at` ni trigger — los reglamentos pocas veces se editan.

---

## cbam_config

**Filas**: 3

**Propósito inferido**: Tabla de configuración key-value para parámetros runtime del módulo CBAM (probablemente cosas como precio CO2 fallback, año fiscal por defecto, flags de feature). Valor en `jsonb` para flexibilidad. Único caso del dominio reference data con FK a `auth.users` (auditoría de quién editó).

**Columnas** (5):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `key` text (**PK**) | clave de config |
| Valor | `value` jsonb (NN), `description` text | |
| Auditoría | `updated_at` timestamptz, `updated_by` uuid | quién editó |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `cbam_config_public_read` (SELECT, public, true)

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| updated_by | `auth.users(id)` | NO ACTION (default) |

**Índices**: pkey UNIQUE sobre `(key)`.

**Triggers**: ninguno (pese a tener columna `updated_at` — la app debe setearla manualmente al hacer UPDATE).

**Versionada en repo**: **Sí** — `scripts/cbam-schema.sql:197`.

**Retención sugerida**: indefinida.

**Observaciones**:
- **`updated_by` FK `NO ACTION`** — al borrar el `auth.users` que editó la última vez, queda bloqueado el borrado del usuario. Recomendación: cambiar a `ON DELETE SET NULL` (mantiene la fila de config, solo pierde la trazabilidad del editor concreto). Mismo patrón que `cbam_advisory_report_downloads.user_id SET NULL` (Tanda 4).
- Sin trigger `updated_at` aunque la columna existe — incoherente con otras 8 tablas del dominio que sí tienen el trigger. Añadir el trigger para garantizar la trazabilidad temporal automáticamente.
- PK textual (`key`) — coherente con `cbam_sectors` y `cbam_certificates`.
- `value` jsonb sin CHECK estructural — flexibilidad total. Riesgo: una mala carga puede romper el módulo si la app espera un shape concreto. Documentar en código (validador en `lib/cbamService.js`).

---

## cbam_countries

**Filas**: **0**

**Propósito inferido**: Catálogo maestro de países con flags `cbam_applies` y `is_eu_member`. Diseñada como tabla de referencia genérica para clasificar países en el módulo CBAM. **Vacía** — no se ha cargado. Referenciada 3 veces en grep de código (probablemente scripts ETL o admin de carga). Solapa parcialmente con `cbam_excluded_countries` (sub-tanda 5A) en el caso `cbam_applies = false`.

**Columnas** (6):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq), `country_code` varchar (NN, **UNIQUE**), `country_name` varchar (NN) | |
| Flags | `cbam_applies` bool (def true), `is_eu_member` bool (def false) | |
| Auditoría | `created_at` | sin updated_at |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `cbam_countries_public_read` (SELECT, public, true)

**Foreign keys**: ninguna.

**Índices**:
- `cbam_countries_country_code_key` — UNIQUE `(country_code)`
- `idx_cbam_countries_code` — btree `(country_code)` (redundante con el UNIQUE anterior)
- `idx_cbam_countries_applies` — btree `(cbam_applies)`

**Triggers**: ninguno.

**Versionada en repo**: **Sí** — `scripts/cbam-assessment-schema.sql:73`.

**Retención sugerida**: indefinida.

**Observaciones**:
- **0 filas** — tabla huérfana similar a `cbam_cn_codes_full`. Decidir en sub-tanda 5C: cargar (lista de países ISO 3166-1 con sus flags) o deprecar (RENAME a `_deprecated_cbam_countries`).
- **Índice `idx_cbam_countries_code` redundante** con el UNIQUE constraint sobre `(country_code)` (mismo patrón que `dispatches.idx_dispatches_expediente` resuelto en sub-tanda 2C).
- Sin `updated_at` ni trigger.
- Si se carga, considerar UNIQUE compuesto que incluya `effective_from` para versionar (los países cambian de status raramente pero ocurre — ej. salida de Reino Unido del UE).

---

## Análisis de duplicidades aparentes

Cuatro pares de tablas con nombres sospechosos de redundancia. Tras la inspección de esquema, contenido y uso real en código, ninguno es una duplicación pura.

### Par 1 — `cbam_cn_codes` (5A) vs `cbam_cn_codes_full` (5B-1)

| Dimensión | `cbam_cn_codes` | `cbam_cn_codes_full` |
|---|---|---|
| Filas | **42** | **0** |
| Columnas | 13 | 19 |
| Granularidad | sector_id + gas + flags básicos | + production_routes/precursors/extra_data/data_quality |
| Vigencia | versionado por fecha (`effective_from/to`) | UNIQUE simple sobre `cn_code` (sin versionado) |
| Refs en código | 2 | 3 |

**Naturaleza**: la `_full` es un esquema enriquecido **pensado para reemplazar o complementar** al simple, nunca cargado. No es la misma fuente con distinta granularidad: las columnas extra describen rutas de producción y precursores que `cbam_cn_codes` no contempla.

**Uso en código**: la app activa lee `cbam_cn_codes` (42 filas, datos vivos). Las 3 referencias a `_full` son probablemente scripts ETL o admin de carga sin completar.

**Recomendación**: **deprecar `cbam_cn_codes_full`** (RENAME a `_deprecated_cbam_cn_codes_full`, revisión 2026-07-23). Si en el futuro se decide enriquecer el catálogo, rediseñar partiendo del esquema actual de `cbam_cn_codes` (que sí tiene versionado por fecha, valor que `_full` perdió). No mantener una tabla vacía indefinidamente.

---

### Par 2 — `cbam_benchmarks` (5A) vs `cbam_benchmarks_official` (5B-1)

| Dimensión | `cbam_benchmarks` | `cbam_benchmarks_official` |
|---|---|---|
| Filas | **24** | **1804** |
| Columnas | 12 | 14 |
| Granularidad | por sector (`sector_id` slug + `benchmark_key`) | por CN code + ruta A/B (datos crudos del Reglamento) |
| FK a sectors | Sí (`sector_id text` FK) | No (`sector varchar` libre) |
| Vigencia | anual (`year_from/to int`) | por fecha (`effective_from/to date`) |
| Refs en código | 5 | 3 |

**Naturaleza**: **complementarias por nivel de detalle**. `cbam_benchmarks` es la vista resumida por sector (un benchmark "representativo" por sector) para UI rápida y dashboards. `cbam_benchmarks_official` son los datos crudos del Reglamento (EU) 2025/2620 por CN code y ruta de producción, usados en cálculos detallados de la asesoría.

**Uso en código**: ambas activas. `cbam_benchmarks` aparece más veces (5 refs, presumiblemente UI y vistas resumen); `_official` en cálculos profundos (3 refs, probablemente `lib/cbamAssessmentData.js`).

**Recomendación**: **mantener ambas**. Documentar el contrato en `lib/cbamService.js` o equivalente: `cbam_benchmarks` para UI/dashboards, `cbam_benchmarks_official` para cálculos por CN code. Como mejora futura (no urgente), considerar regenerar `cbam_benchmarks` como vista materializada agrupando `cbam_benchmarks_official` por sector — requiere primero mapear el `sector` libre del oficial al `sector_id` slug.

---

### Par 3 — `cbam_default_value_markup` (5B-2) vs `cbam_default_values_official` (5B-1)

| Dimensión | `cbam_default_value_markup` | `cbam_default_values_official` |
|---|---|---|
| Filas | **3** | **11805** |
| Columnas | 7 | 16 |
| Contenido | porcentajes de markup por año | valores de emisión por país × CN code |
| Materialización | define el factor (e.g. 25 %) | aplica el factor en columnas `with_markup_2026/2027/2028` |
| Refs en código | 2 | 2 |

**Naturaleza**: **NO son un par duplicado — son complementarias**. La consulta del briefing las agrupó por similitud de nombre, pero contienen datos distintos en niveles distintos del modelo. `cbam_default_value_markup` aporta los multiplicadores anuales; `cbam_default_values_official` materializa los resultados por país × CN code aplicando esos multiplicadores en columnas dedicadas (lectura sin JOIN).

**Uso en código**: ambas activas y necesarias. La calculadora CBAM lee directamente las columnas `with_markup_*` de `cbam_default_values_official` para mostrar coste estimado; `cbam_default_value_markup` se consulta para mostrar al usuario el porcentaje aplicado y trazar el origen normativo.

**Recomendación**: **mantener ambas, sin consolidar**. La denormalización en columnas `with_markup_2026/2027/2028` es deliberada por performance y simplicidad de lectura. Coste: si la regulación añade un año (2029), requiere `ALTER TABLE` + recálculo. Aceptable porque la cadencia es anual y predecible. Documentar la dependencia: cualquier UPDATE en `cbam_default_value_markup` debe disparar un recálculo manual de las columnas materializadas en `cbam_default_values_official`.

---

### Par 4 — `cbam_countries` (5B-2) vs `cbam_excluded_countries` (5A)

| Dimensión | `cbam_countries` | `cbam_excluded_countries` |
|---|---|---|
| Filas | **0** | **7** |
| Columnas | 6 | 8 |
| Modelo | catálogo maestro con flags `cbam_applies`, `is_eu_member` | lista solo de excluidos por ETS equivalente |
| Vigencia | sin `effective_from/to` | sí (`effective_from/to date`) |
| Refs en código | 3 | 2 |

**Naturaleza**: solapamiento parcial. Si `cbam_countries.cbam_applies = false`, ese país conceptualmente sería "excluido" — equivalente a estar en `cbam_excluded_countries`. Pero `cbam_countries` está **vacía** y nunca se cargó; `cbam_excluded_countries` está activa con los 7 países con ETS reconocido (Islandia, Noruega, Suiza, Liechtenstein, etc.). Además, ya existe `public.countries` (catálogo TARIC, 62 filas) que cubre la función de "lista maestra de países".

**Uso en código**: `cbam_excluded_countries` se usa en cálculos (verificar si una importación está exenta de CBAM por país de origen). Las 3 referencias a `cbam_countries` son lecturas defensivas o admin de carga sin completar.

**Recomendación**: **deprecar `cbam_countries`** (RENAME a `_deprecated_cbam_countries`, revisión 2026-07-23). Si en el futuro se necesita un catálogo CBAM-específico de países más allá de los excluidos, **reutilizar `public.countries`** (ya disponible para TARIC) y añadir las columnas CBAM-específicas (`cbam_applies`, `is_eu_member`) ahí, en lugar de mantener un catálogo paralelo vacío.

---

## Hallazgos de la Tanda 5

### 🚨 Críticos

**Ninguno.** El dominio CBAM reference data presenta un patrón muy sólido:

- RLS habilitada uniformemente en las 15 tablas, con **una única policy** por tabla (`<tabla>_public_read`, `cmd=SELECT`, `role=public`, `USING true`).
- **Ninguna policy de mutación pública** (no hay `ALL`/INSERT/UPDATE/DELETE para `public` o `authenticated`). Las cargas se hacen desde `service_role` vía scripts ETL — **no se reproduce el problema de `checklist_templates`** detectado en Tanda 2.
- **0 CHECK constraints** en las 15 tablas (`pg_constraint contype='c'` → `[]`). No hay CHECKs problemáticos preexistentes que invaliden propuestas (problema detectado en Tanda 4 con `cbam_advisory_requests.status_check`).
- **15/15 tablas versionadas** en el repo (`scripts/cbam-schema.sql`, `scripts/cbam-assessment-schema.sql`, `scripts/cbam-official-data-v2-schema.sql`). Único dominio del inventario completamente versionado junto con CBAM Advisory.

### ⚠️ Tablas a deprecar

1. **`cbam_cn_codes_full`** — 0 filas, esquema enriquecido pero sin versionado por fecha (regresión respecto a `cbam_cn_codes`), referenciada en código solo desde scripts ETL inactivos. Decisión: RENAME a `_deprecated_cbam_cn_codes_full` con revisión 90 días (2026-07-29). Si en el futuro se necesita enriquecer el catálogo, partir de `cbam_cn_codes` y conservar el versionado.
2. **`cbam_countries`** — 0 filas, solapa funcionalmente con `public.countries` (catálogo TARIC, 62 filas, ya en uso) y con `cbam_excluded_countries` (7 filas, activa). Decisión: RENAME a `_deprecated_cbam_countries` con revisión 90 días (2026-07-29). Si crece la necesidad CBAM-específica de catálogo de países, ampliar `public.countries` con columnas adicionales en lugar de mantener un catálogo paralelo vacío.

### 🟡 Mejoras menores (al backlog, fuera de 5C)

3. **`cbam_config.updated_by` FK con `NO ACTION`** — al borrar el `auth.users` que editó la última vez, queda bloqueado el borrado del usuario (mismo patrón a corregir que en Fase 7 para `dispatches`/`cbam_advisory_requests`). Cambiar a `ON DELETE SET NULL` (preserva la fila de config; pierde solo la trazabilidad del editor concreto). Patrón ya aplicado correctamente en `cbam_advisory_report_downloads.user_id`.
4. **`cbam_config` sin trigger `update_updated_at_column`** pese a tener columna `updated_at`. Las 8 tablas del dominio con columna `updated_at` tienen el trigger; `cbam_config` es la excepción incoherente. Añadir el trigger para que la app no tenga que setear `updated_at` manualmente.
5. **`cbam_ets_prices.idx_cbam_ets_current`** es un índice parcial `WHERE is_current = true` sobre la columna `(is_current)`, **no un UNIQUE**. La intención de "solo una fila vigente" no se garantiza a nivel de BD. Convertir en `CREATE UNIQUE INDEX ... ON cbam_ets_prices (is_current) WHERE is_current = true` (o equivalente con DROP+CREATE) cuando se haga limpieza.
6. **`cbam_timeline.event_type` y `cbam_regulations.regulation_type` libres** sin CHECK. Valores esperables identificados (timeline: `'milestone'`, `'regulation'`, `'omnibus'`, `'transition'`; regulations: `'implementing'`, `'delegated'`, `'omnibus'`, `'main'`). Añadir CHECKs en una iteración cosmética cuando se confirmen los valores reales con Carlos. Mismo tratamiento para `cbam_regulations.status` (default `'in_force'`).
7. **`regulation_ref` referenciado lógicamente** desde `cbam_cn_codes`, `cbam_emission_factors`, `cbam_benchmarks`, `cbam_benchmarks_official`, `cbam_default_value_markup`, `cbam_default_values_official` y `cbam_excluded_countries`, **sin FK estricta** a `cbam_regulations.reference`. Riesgo: typos en cargas ETL no se detectan. Si se quiere integridad, añadir FK con el coste de invalidar cargas que mencionen un Reglamento aún no insertado en `cbam_regulations` (orden de carga importa).

### 📚 Documentación de relaciones (no DDL)

8. **`cbam_benchmarks` es la vista resumen por sector** de `cbam_benchmarks_official` (datos crudos por CN code). Documentar el contrato en `lib/cbamService.js` o equivalente: **UI/dashboards → `cbam_benchmarks`; cálculos detallados → `cbam_benchmarks_official`**. A largo plazo, considerar regenerar la primera como vista materializada de la segunda agrupando por sector (requiere antes mapear el `sector` libre del oficial al `sector_id` slug).
9. **`cbam_default_values_official.with_markup_2026/2027/2028` se materializan a partir de `cbam_default_value_markup.markup_pct`**. Documentar la dependencia: cualquier UPDATE en `cbam_default_value_markup` exige un recálculo manual de las columnas `with_markup_*` en `cbam_default_values_official` (o un job que lo dispare). Hoy esa dependencia es invisible para quien edite `markup_pct` sin saberlo.

---

## Correcciones propuestas para Sub-tanda 5C

Migración única con dos bloques de RENAME para deprecar las dos tablas vacías. **No** se tocan `cbam_config`, `cbam_ets_prices`, `cbam_timeline`, `cbam_regulations` ni los `regulation_ref`: van al backlog para iteración futura no-bloqueante.

```sql
-- Bloque 1: Deprecar cbam_cn_codes_full
ALTER TABLE public.cbam_cn_codes_full RENAME TO _deprecated_cbam_cn_codes_full;
COMMENT ON TABLE public._deprecated_cbam_cn_codes_full IS
  'DEPRECATED 2026-04-29. Vacía, sin uso en código.
   Revisar 2026-07-29 y eliminar.';

-- Bloque 2: Deprecar cbam_countries
ALTER TABLE public.cbam_countries RENAME TO _deprecated_cbam_countries;
COMMENT ON TABLE public._deprecated_cbam_countries IS
  'DEPRECATED 2026-04-29. Vacía. Solapamiento con public.countries y cbam_excluded_countries.
   Revisar 2026-07-29 y eliminar.';
```

Tras aplicar:
- Las dos tablas conservan filas (cero, en este caso) y políticas RLS heredadas; solo cambia el nombre.
- Los 3 + 3 archivos en `scripts/` que las definen quedan desincronizados; se aceptará como "estado deprecado" hasta el DROP definitivo en 2026-07-29.
