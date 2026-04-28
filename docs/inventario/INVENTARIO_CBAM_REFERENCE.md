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

<!-- TANDA 5 INCOMPLETA: faltan cbam_cn_codes_full, cbam_benchmarks_official, cbam_default_value_markup, cbam_default_values_official, cbam_certificates, cbam_timeline, cbam_ets_prices, cbam_regulations, cbam_config, cbam_countries y la sección "Hallazgos de la Tanda 5" -->
