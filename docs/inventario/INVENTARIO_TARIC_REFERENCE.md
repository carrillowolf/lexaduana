# Inventario — Dominio TARIC Reference Data

**Tanda**: 6 / 8 (parcial — sub-tanda 6A)
**Fecha**: 2026-04-29
**Schema**: `public`
**Tablas esta sub-tanda**: `taric_measures`, `taric_changes`, `taric_update_runs`, `measure_types`, `measure_alerts`
**Pendientes**: 6B (conditions/exclusions/footnotes — 5 tablas), 6C (master data + lookups — 4 tablas), 6D (resto + duplicidades — 4 tablas), 6E (hallazgos + propuestas).

> Fuente: `information_schema` + `pg_catalog` + grep del repo + lectura de `lib/calculateTariff.js` y `scripts/changes-schema.sql`. **Reference data público de la UE**: sin PII, sin datos comerciales del usuario en ninguna de las 5 tablas. Mutación reservada a `service_role` (cron ETL mensual desde CIRCABC documentado en `CLAUDE.md`).
>
> **Patrón RLS**: 4/5 con role `{public}` USING `true`. La excepción es `measure_alerts` con role `{anon}` USING `true` — funcionalmente equivalente para reference data (anon = sesión sin login) pero rompe el patrón uniforme; ver Hallazgos. `taric_changes` y `taric_update_runs` añaden policies INSERT/UPDATE explícitas restringidas a `auth.role() = 'service_role'` — **redundantes** (service_role bypassa RLS) pero útiles como documentación de intención.
>
> **Sin CHECK constraints** (`pg_constraint contype='c'` para estas 5 tablas → `[]`). Mismo patrón que CBAM reference (Tanda 5).

---

## taric_measures

**Filas**: **136 009** (la tabla más grande del schema `public`)

**Propósito inferido del código**: Núcleo del calculador TARIC — todas las medidas arancelarias activas e históricas por código de mercancía y país de origen. Cada fila combina `goods_code + origin_code + measure_type_code + start_date/end_date + duty_*`. Usada en `lib/calculateTariff.js` (motor principal del calculador) y `lib/measureInterpreter.js` (texto humanizado de medidas). Se carga vía `scripts/loadBlock2.js` y se procesa con `scripts/processMeasures.js`.

**Columnas** (17, agrupadas):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq) | |
| Mercancía | `goods_code` varchar (NN), `add_code` varchar, `order_no` varchar | `order_no` = referencia de contingente arancelario |
| Vigencia | `start_date` date (NN), `end_date` date | medidas activas: `end_date IS NULL OR end_date >= today` |
| Origen | `origin_code` varchar (NN), `origin_name` text | |
| Tipo | `measure_type_code` int2 (NN), `measure_type_name` text | denormalizado de `measure_types` |
| Base legal | `legal_base` text | referencia al Reglamento o Decisión |
| Arancel | `duty_expression` text, `duty_percentage` numeric, `duty_specific` text | expresión cruda + valor parseado |
| Flags | `red_ind` int2, `is_conditional` bool (def false), `is_prohibition` bool (def false) | `red_ind` ≈ indicador de reducción |
| Auditoría | `created_at`, `updated_at` (timestamptz, def `now()`) | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `Allow public read taric_measures` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: ninguna (medidas no enlazan a `measure_types` por FK explícita; el `measure_type_code` es valor denormalizado).

**Índices** (6 además del pkey, todos críticos para performance del calculador):
- `idx_tm_goods_code` — btree `(goods_code)` ← lookup principal
- `idx_tm_goods_origin` — btree `(goods_code, origin_code)` ← lookup compuesto típico
- `idx_tm_origin` — btree `(origin_code)`
- `idx_tm_measure_type` — btree `(measure_type_code)`
- `idx_tm_validity` — btree `(start_date, end_date)`
- `idx_tm_quota` — btree `(order_no) WHERE order_no IS NOT NULL` (parcial, optimiza queries de contingentes)

**Triggers**: ninguno (no hay refresco automático de `updated_at` — la app debe setearlo en UPDATEs manuales si quiere reflejar cambios).

**Versionada en repo**: **Parcialmente**. No hay `CREATE TABLE taric_measures` activo en `scripts/`; sólo `taric_measures_backup_mar26` en `scripts/bloque2-schema.sql:21`. La definición original probablemente venga de iteraciones anteriores del proyecto y se ha mantenido viva.

**Retención sugerida**: indefinida — datos públicos UE; medidas históricas conservadas para reproducir cálculos retrospectivos.

**Observaciones**:
- 136K filas y 7 índices — bien dimensionada para los queries del calculador. El índice compuesto `(goods_code, origin_code)` cubre el caso 80%+ de uso.
- **`measure_type_code` sin FK** a `measure_types(type_code)` — denormalización deliberada (incluye `measure_type_name`) para evitar joins en el hot path. El precio es que un nuevo `type_code` en `measure_types` no aparece automáticamente en `measure_type_name` de medidas existentes hasta una recarga.
- `duty_expression` (texto) vs `duty_percentage` (parseado) — coexistencia para mantener el original. Útil para auditoría.
- Sin trigger `updated_at` ni columna `effective_to` (usan `end_date`). Consistente con dominio TARIC.

---

## taric_changes

**Filas**: 18 064

**Propósito inferido del código**: Diff mensual de cambios detectados al recargar el snapshot de TARIC desde CIRCABC. Cada fila es un cambio individual (insert/update/delete sobre alguna tabla TARIC) detectado por `scripts/detectChanges.js`. Se muestra al usuario en `app/cambios/` (consultado vía `app/api/changes/route.js`). Permite responder "qué ha cambiado este mes en mi código TARIC".

**Columnas** (16, agrupadas):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int8 sin default) | bigint sin secuencia — los IDs vienen del proceso ETL |
| FK al run | `run_id` uuid (FK → `taric_update_runs(id)` ON DELETE CASCADE) | |
| Contexto | `data_month` text (NN, e.g. `'2026-04'`), `table_name` text (NN), `change_type` text (NN) | qué tabla y tipo |
| Mercancía | `goods_code` text (NN), `goods_code_short` text, `chapter` text | claves de búsqueda |
| Tipo medida | `measure_type_code` text, `origin_code` text | si aplica |
| Diff | `field_changed` text, `old_value` text, `new_value` text | |
| Datos completos | `measure_data` jsonb, `duty_expression` text | snapshot del registro nuevo |
| Vigencia | `start_date` date, `end_date` date | de la medida afectada |
| Severidad UI | `severity` text (def `'info'`) | `'info'`, `'warning'`, `'critical'` (probables) |
| Auditoría | `created_at` (timestamptz, def `now()`) | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí, **2 policies**:
| Nombre | Comando | USING / WITH CHECK |
|---|---|---|
| `taric_changes_public_read` | SELECT | USING `true` |
| `taric_changes_service_insert` | INSERT | WITH CHECK `auth.role() = 'service_role'` |

> La INSERT con guard sobre `service_role` es **redundante** (`service_role` bypassa RLS) pero documenta la intención: solo el ETL puede escribir.

**Foreign keys**:
| Columna | Referencia | ON DELETE |
|---|---|---|
| run_id | `taric_update_runs(id)` | **CASCADE** |

**Índices** (8 además del pkey):
- `idx_changes_goods` — `(goods_code)`
- `idx_changes_goods_short` — `(goods_code_short)`
- `idx_changes_chapter` — `(chapter)`
- `idx_changes_measure_type` — `(measure_type_code)`
- `idx_changes_month` — `(data_month)`
- `idx_changes_month_severity` — `(data_month, severity)` ← compuesto típico para dashboard
- `idx_changes_run` — `(run_id)`
- `idx_changes_severity` — `(severity)`
- `idx_changes_table` — `(table_name)`
- `idx_changes_type` — `(change_type)`

**Triggers**: ninguno.

**Versionada en repo**: **Sí** — `scripts/changes-schema.sql:24`.

**Retención sugerida**: indefinida en BD activa, pero con 18K filas en una sola ejecución mensual la tabla crece linealmente. Sin política de purga: tras 12 meses serán ~217K filas, tras 24 meses ~434K. Considerar purga a **24 meses** (o partición por `data_month`) cuando la cardinalidad lo justifique. Al backlog 6E.

**Observaciones**:
- `id int8 sin default` — los IDs son asignados desde el proceso ETL (probablemente para que sean estables entre re-procesos). Verificable en `scripts/detectChanges.js`.
- 9 índices secundarios — agresivo pero coherente con que la UI ofrece muchos filtros (mes, capítulo, severidad, tipo).
- `measure_data jsonb` permite snapshots completos sin alterar el esquema cada vez que se añade un campo TARIC. Bien.
- `severity` libre `text` con default `'info'`. Sin CHECK; los valores reales aparecen sólo en código (`scripts/detectChanges.js`). Mismo patrón que `cbam_advisory_requests.status` (corregido en Tanda 4) — futuro CHECK al backlog.

---

## taric_update_runs

**Filas**: **1** (única ejecución registrada hasta hoy: `2026-04-13`)

**Propósito inferido del código**: Bitácora de ejecuciones del ETL mensual TARIC. Cada fila representa un run completo (cargar Excel CIRCABC → detectar diff → poblar `taric_changes`). Permite trazar qué versión de los Excel produjo qué set de cambios. Padre de `taric_changes` vía `run_id`.

**Columnas** (10):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` uuid PK (def `gen_random_uuid()`) | UUID v4 random |
| Snapshot | `data_month` text (NN, e.g. `'2026-04'`) | mes funcional del snapshot |
| Ejecución | `run_date` timestamptz (def `now()`), `created_at` (def `now()`), `completed_at` timestamptz | |
| Estado | `status` text (def `'pending'`), `error_log` text | flujo asíncrono |
| Origen | `source_description` text | descripción del lote (e.g. URLs CIRCABC) |
| Estadísticas | `total_changes` int (def 0), `changes_by_type` jsonb (def `'{}'`), `tables_processed` text[] (def `'{}'`) | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí, **3 policies**:
| Nombre | Comando | USING / WITH CHECK |
|---|---|---|
| `taric_update_runs_public_read` | SELECT | USING `true` |
| `taric_update_runs_service_insert` | INSERT | WITH CHECK `auth.role() = 'service_role'` |
| `taric_update_runs_service_update` | UPDATE | USING `auth.role() = 'service_role'` |

> Ambas restricciones a `service_role` son redundantes (bypassa RLS) — documentación.

**Foreign keys**: ninguna saliente. Es referenciada por `taric_changes.run_id` con ON DELETE CASCADE: borrar un run elimina todos sus changes.

**Índices**: solo pkey.

**Triggers**: ninguno.

**Versionada en repo**: **Sí** — `scripts/changes-schema.sql:9`.

**Retención sugerida**: indefinida (es la bitácora maestra, conserva trazabilidad histórica). El CASCADE arrastraría el histórico de `taric_changes` si se purgara; si se aplica purga en `taric_changes` debería ser por `data_month` y NO por `run_id`.

**Observaciones**:
- **Solo 1 fila** — confirma que el ETL **no se ha ejecutado mensualmente desde su instauración**. La instrucción del `CLAUDE.md` describe el procedimiento como manual (Carlos coloca los 14 Excel y ejecuta los scripts a mano). No hay cron automático. Eso explica que solo haya 1 run.
- `status` libre con default `'pending'`. Valores esperables: `'pending'`, `'running'`, `'success'`, `'failed'`. CHECK al backlog.
- `tables_processed text[]` permite trazar qué tablas se procesaron en el run — útil cuando el ETL es parcial.
- Sin `updated_at` — el `completed_at` cumple esa función para el flujo `pending → success/failed`.

---

## measure_types

**Filas**: 78

**Propósito inferido del código**: Catálogo de tipos de medida TARIC (códigos 103, 142, 143, 442, etc.) con descripción, categoría e icono para UI. Lookup pequeño pero crítico: `taric_measures.measure_type_code` apunta lógicamente aquí (sin FK estricta — denormalizado). Probablemente se carga desde `scripts/loadBlock1.js`.

**Columnas** (11):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq, sequence `measure_types_new_id_seq`), `type_code` int2 (NN, **UNIQUE**) | nombre de secuencia delata renombrado desde `measure_types_new` |
| Descripción | `type_name` text (NN), `type_name_es` text, `category` text, `icon` text | i18n + categoría |
| Comportamiento | `affects_duty` bool (def false), `priority` int2 (def 99), `measure_count` int (def 0), `is_import` bool (def true) | flags + denormalización del nº de medidas |
| Auditoría | `created_at` timestamptz (def `now()`) | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `mt_new_public_read` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: ninguna.

**Índices**:
- UNIQUE `(type_code)` (`measure_types_new_type_code_key`)
- btree `(type_code)` (`idx_mt_new_code`) — redundante con el UNIQUE
- btree `(category)`

**Triggers**: ninguno.

**Versionada en repo**: **Sí, parcialmente** — `scripts/bloque1-schema.sql:109` define `measure_types_new`; la tabla actual fue renombrada desde ahí (los nombres de pkey/seq/policies/UNIQUE conservan el sufijo `_new`).

**Retención sugerida**: indefinida.

**Observaciones**:
- **Sufijos `_new`** en pkey, sequence, policy y UNIQUE — vestigio de la migración Bloque 1. Sin impacto funcional pero confunde. Renombrar en limpieza posterior (no urgente).
- **Índice `idx_mt_new_code` redundante** con el UNIQUE constraint sobre `(type_code)` — mismo patrón corregido en sub-tanda 2C (`idx_dispatches_expediente`) y propuesto en backlog (`idx_cbam_countries_code`). Al backlog 6E.
- `measure_count` denormalizado del recuento real de filas en `taric_measures` con ese `type_code` — debe regenerarse periódicamente (probablemente lo hace `scripts/processMeasures.js`). Documentar dependencia.
- Sin CHECK sobre `category` ni sobre `priority` (rango).

---

## measure_alerts

**Filas**: **15 281**

**Propósito inferido del código**: Texto humanizado de alertas vinculadas a combinaciones `goods_code + measure_code + origin_code + certificate`. **Marcada explícitamente como legacy fallback** en `lib/calculateTariff.js:973-975`:
> ```js
> // Alertas legacy (tabla measure_alerts) — fallback
> .from('measure_alerts')
> ```
> El sistema principal de generación de alertas es otro (probablemente `measureInterpreter.js` que renderiza desde la propia `taric_measures` + `measure_conditions/footnotes`). `measure_alerts` se conserva como respaldo cuando la generación dinámica no devuelve nada.

**Columnas** (10):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq) | |
| Lookup | `goods_code` varchar (NN), `measure_code` varchar, `origin_code` varchar, `certificate` varchar | claves de búsqueda |
| Tipo | `alert_type` varchar | libre |
| Texto | `short_text` varchar, `full_text` text | mensajes humanizados |
| Display | `priority` int (def 3) | |
| Auditoría | `created_at` (timestamp sin tz, def `now()`) | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `Allow public read access` — **role `{anon}`** (no `{public}` como las otras 4) USING `true`

> ⚠️ **Inconsistencia de patrón**: única tabla del lote con role `{anon}`. Funcionalmente equivalente para SELECT público (`anon` aplica al usuario no autenticado de PostgREST; `public` cubre tanto `anon` como `authenticated`), pero rompe la uniformidad. Al backlog 6E.

**Foreign keys**: ninguna.

**Índices**:
- `idx_alerts_goods` — btree `(goods_code)`
- `idx_alerts_measure` — btree `(measure_code)`
- `idx_alerts_priority` — btree `(priority)`

**Triggers**: ninguno.

**Versionada en repo**: **No** — sin `CREATE TABLE` en `scripts/`. Probablemente creada en una iteración anterior del proyecto.

**Retención sugerida**: vinculada a la decisión de deprecar la tabla (ver Observaciones).

**Observaciones**:
- 🔍 **Candidata fuerte a deprecación** una vez se confirme que el sistema "principal" (no fallback) cubre todos los casos. Decisión a tomar **después de revisar** `lib/calculateTariff.js:970-985` para entender exactamente cuándo cae en el fallback. Si se confirma cobertura total, RENAME a `_deprecated_measure_alerts` en sub-tanda 6F.
- 15 281 filas — no es trivial, pero al ser referencia (no datos de usuario) la migración no requiere conversión.
- `created_at` es `timestamp` sin tz — inconsistente con el resto del lote que usa `timestamptz`. Detalle menor.
- `alert_type` libre — sin CHECK.

---

<!-- TANDA 6 INCOMPLETA: faltan sub-tandas 6B (conditions/exclusions/footnotes), 6C (master data + lookups), 6D (resto + duplicidades) y 6E (hallazgos + propuestas). -->
