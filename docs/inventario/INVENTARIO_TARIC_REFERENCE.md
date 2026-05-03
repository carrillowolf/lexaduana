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

<!-- Sub-tanda 6B: añadidas measure_conditions, measure_exclusions, measure_footnotes, condition_codes, action_codes -->

## measure_conditions

**Filas**: **29 229**

**Propósito inferido del código**: Condiciones que deben cumplirse para que una medida TARIC aplique (típicamente: "presentar certificado X", "valor unitario ≥ Y €/kg", "cantidad mínima Z"). Cada fila enlaza a una medida vía `goods_code + origin_code + measure_type_code + start_date`. Usada en `lib/calculateTariff.js`, `lib/measureInterpreter.js`, `scripts/loadBlock2.js`, `scripts/processMeasures.js`.

**Columnas** (14, agrupadas):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq) | |
| Lookup medida | `goods_code` varchar (NN), `add_code` varchar, `order_no` varchar, `origin_code` varchar, `measure_type_code` int2 (NN), `start_date` date, `end_date` date | claves para enlazar lógicamente con `taric_measures` |
| Condición | `condition_code` bpchar, `condition_sequence` int2, `action_code` varchar | apuntan a `condition_codes` y `action_codes` lógicamente (sin FK) |
| Datos | `certificate_code` varchar, `condition_amount` numeric, `monetary_unit` varchar, `measurement_unit` varchar, `measurement_unit_qual` varchar | umbrales y unidades |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `Allow public read measure_conditions` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: ninguna (`condition_code`, `action_code` y `certificate_code` son denormalización por código TARIC, sin FK estricta a las tablas lookup correspondientes).

**Índices**:
- `idx_mc_goods` — btree `(goods_code)`
- `idx_mc_cert` — btree `(certificate_code)`
- `idx_mc_measure_full` — btree compuesto `(goods_code, origin_code, measure_type_code, start_date)` ← lookup principal con la PK lógica de la medida

**Triggers**: ninguno.

**Versionada en repo**: **No** activa. `scripts/bloque2-schema.sql:38` define `measure_conditions_backup_mar26` (backup); la tabla principal no aparece con `CREATE TABLE` en `scripts/`.

**Retención sugerida**: indefinida (datos públicos UE; carga vía CIRCABC mensual).

**Observaciones**:
- **Sin FK a `condition_codes(code)` ni a `action_codes(code)`** — denormalización deliberada para no requerir join en hot path. Riesgo: una `condition_codes` mal cargada deja a las medidas con códigos huérfanos sin que la BD lo detecte.
- 3 índices secundarios suficientes para los queries típicos del calculador (lookup por medida completa + por mercancía + por certificado).
- Sin CHECK ni enum sobre `condition_code` (1 caracter), `action_code`, `monetary_unit`. Volumen de catálogo conocido (8 + 8 filas) — añadir CHECK en limpieza posterior reduciría errores ETL.
- `start_date` y `end_date` son nullable aquí, mientras que en `taric_measures` `start_date` es NOT NULL. Inconsistencia menor.

---

## measure_exclusions

> ✅ **Sub-tanda 6F (2026-04-29)** — la migración
> [`20260429120000_taric_reference_cleanup.sql`](../../supabase/migrations/20260429120000_taric_reference_cleanup.sql)
> elimina dos índices de esta tabla: `idx_me_excluded` (duplicado idéntico a
> `idx_me_excluded_country`) e `idx_me_goods` (cubierto por el prefijo de
> `idx_me_goods_excluded`). El conjunto de índices restantes mantiene la
> cobertura de queries del calculador. Sin impacto funcional.

**Filas**: **28 975**

**Propósito inferido del código**: Exclusiones por país sobre medidas TARIC (cuando una medida aplica a un grupo de países como "EU + EFTA" pero un país concreto está exento, aparece aquí). Cada fila tiene `goods_code + measure_type_code + start_date` y un `excluded_country_code`. Usada en `lib/calculateTariff.js`, `lib/measureInterpreter.js`, `scripts/processExclusions.js`.

**Columnas** (10):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq, secuencia `measure_exclusions_id_seq1`) | sufijo `1` delata drop+create previo |
| Lookup medida | `goods_code` varchar (NN), `add_code` varchar, `order_no` varchar, `origin_code` varchar, `start_date` date (NN), `end_date` date | |
| Tipo medida | `measure_type_code` int2 (NN), `measure_type_name` text | denormalizado |
| Exclusión | `excluded_country_code` varchar, `excluded_country_name` text | el país exento |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `Allow public read measure_exclusions` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: ninguna.

**Índices** (6 — incluye dos duplicados):
- `idx_me_goods` — btree `(goods_code)`
- `idx_me_excluded` — btree `(excluded_country_code)` ← **duplicado** con `idx_me_excluded_country`
- `idx_me_excluded_country` — btree `(excluded_country_code)` ← **idéntico al anterior**
- `idx_me_goods_excluded` — btree `(goods_code, excluded_country_code)` ← cubre `idx_me_goods` como prefijo
- `idx_me_measure` — btree `(measure_type_code)`
- `idx_me_measure_full` — btree compuesto `(goods_code, origin_code, measure_type_code, start_date)`

> ⚠️ **Dos índices `idx_me_excluded` y `idx_me_excluded_country` son funcionalmente idénticos**. Eliminar uno en sub-tanda 6F.

**Triggers**: ninguno.

**Versionada en repo**: **No** activa. `scripts/bloque2-schema.sql:52` define `measure_exclusions_backup_mar26`.

**Retención sugerida**: indefinida.

**Observaciones**:
- **Sequence `measure_exclusions_id_seq1` y pkey `measure_exclusions_pkey1`** con sufijo `1` — vestigio de drop+create previo (la primera versión dejó la secuencia y se creó una nueva). Mismo patrón que `measure_types_new_*` (Tanda 6A). Sin impacto funcional.
- `excluded_country_code` denormaliza el país excluido — sin FK a `geographical_areas` (que se inventaría en 6C/6D).
- El índice compuesto `idx_me_goods_excluded` hace redundante a `idx_me_goods` (PostgreSQL puede usar el prefijo `goods_code` del compuesto). Considerar eliminar `idx_me_goods` también.

---

## measure_footnotes

> ✅ **Sub-tanda 6F (2026-04-29)** — la migración
> [`20260429120000_taric_reference_cleanup.sql`](../../supabase/migrations/20260429120000_taric_reference_cleanup.sql)
> elimina la policy duplicada `Allow public read measure_footnotes` (conserva
> `mf_public_read`) y el índice duplicado `idx_mf_goods` (conserva
> `idx_mf_goods_code`). Con 122K filas, era la tabla con mayor coste real
> de mantener ambos índices. Sin impacto funcional.

**Filas**: **121 938** (la 2ª tabla más grande del schema, tras `taric_measures`)

**Propósito inferido del código**: Notas a pie aplicables a una medida concreta (informativas, requisitos especiales, referencias regulatorias). Cada fila enlaza una medida con un `footnote_code`; el texto del footnote vive en `footnote_descriptions` (sub-tanda 6C). Usada por `measureInterpreter.js` para humanizar las medidas con sus notas.

**Columnas** (12):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq) | |
| Lookup medida | `goods_code` text (NN), `add_code` text, `order_no` text, `origin_code` text, `origin_name` text, `start_date` date, `end_date` date | toda la PK lógica de la medida |
| Tipo medida | `measure_type_code` int2 (NN), `measure_type_name` text | denormalizado |
| Footnote | `footnote_code` text (NN) | enlaza lógicamente con `footnote_descriptions.code` |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí, **2 policies idénticas**:
| Nombre | Comando | USING |
|---|---|---|
| `Allow public read measure_footnotes` | SELECT | `true` |
| `mf_public_read` | SELECT | `true` |

> ⚠️ **Duplicación de policy** — ambas con role `{public}` y predicado `true`. Funcionalmente equivalentes; la segunda parece añadida en una iteración posterior sin eliminar la original. Eliminar una en sub-tanda 6F.

**Foreign keys**: **ninguna**. **No hay FK de `measure_footnotes.footnote_code` a `footnote_descriptions.code`** — denormalización deliberada (mismo patrón que `measure_conditions.condition_code` y `measure_alerts.measure_code`). El precio: un footnote_code mal cargado puede no tener descripción correspondiente y la app debe tolerar el caso.

**Índices** (4 — incluye dos duplicados):
- `idx_mf_goods` — btree `(goods_code)` ← **duplicado** con `idx_mf_goods_code`
- `idx_mf_goods_code` — btree `(goods_code)` ← **idéntico al anterior**
- `idx_mf_footnote` — btree `(footnote_code)`
- `idx_mf_measure_full` — btree compuesto `(goods_code, origin_code, measure_type_code, start_date)`

> ⚠️ **`idx_mf_goods` e `idx_mf_goods_code` son funcionalmente idénticos**. Eliminar uno en sub-tanda 6F.

**Triggers**: ninguno.

**Versionada en repo**: **Sí** — `scripts/bloque2-schema.sql:70`. Única tabla activa del lote 6B con `CREATE TABLE` actual en `scripts/`.

**Retención sugerida**: indefinida (datos públicos UE).

**Observaciones**:
- **122K filas con dos índices duplicados** — coste real de espacio y de mantenimiento (cada UPDATE/INSERT actualiza ambos). Eliminar el redundante reduce tamaño y acelera escrituras.
- **`measure_footnotes.footnote_code` sin FK** a `footnote_descriptions` — el user específicamente preguntó por esta relación: respuesta confirmada **sin FK estricta**. Si en el futuro se quiere integridad, el orden de carga importa (descriptions antes que measure_footnotes).
- Tipos: aquí `goods_code text` mientras que en `taric_measures` y `measure_conditions` es `varchar`. Inconsistencia menor que no afecta queries (Postgres trata `text` y `varchar` casi igual) pero ensucia el esquema.

---

## condition_codes

**Filas**: **8**

**Propósito inferido**: Catálogo de los 8 códigos de condición TARIC (A, B, C, ...). Cada uno indica un tipo de condición ("se presentan documentos", "se cumple X requisito"). Lookup pequeño y estático. Probablemente cargado vía `scripts/loadBlock1.js` y reutilizable como i18n en la UI (descripciones en EN + ES).

**Columnas** (3):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `code` bpchar (**PK**, sin longitud especificada → `character(1)` por defecto) | 1 letra |
| i18n | `description_en` varchar, `description_es` varchar | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `Allow public read condition_codes` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: ninguna.

**Índices**: solo pkey UNIQUE sobre `(code)`.

**Triggers**: ninguno.

**Versionada en repo**: **No** — sin `CREATE TABLE` en `scripts/`.

**Retención sugerida**: indefinida.

**Observaciones**:
- **`code` `bpchar` sin longitud declarada** = `character(1)` por defecto. Es decir, padding con espacios si se intenta meter más de 1 carácter (truncación en realidad). Asume códigos de exactamente 1 letra. Documentar la asunción.
- 8 filas — coincide con la cobertura conocida de la spec TARIC (A-H aproximadamente). Carlos puede confirmar si la cobertura es completa contra la spec actual de DG TAXUD.
- Sin FK reverse desde `measure_conditions.condition_code` — denormalización aceptada para hot path.
- PK textual coherente con `cbam_sectors`, `cbam_certificates`, `cbam_config` (Tanda 5). Patrón establecido.

---

## action_codes

**Filas**: **8**

**Propósito inferido**: Catálogo de los 8 códigos de acción TARIC (qué efecto tiene una condición cuando se cumple/no cumple: aplicar la medida, exonerar derecho, exigir certificado, etc.). Lookup pequeño paralelo a `condition_codes`. Cargado por `scripts/loadBlock1.js` (probable).

**Columnas** (3):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `code` varchar (**PK**, sin longitud) | |
| i18n | `description_en` varchar, `description_es` varchar | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `Allow public read action_codes` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: ninguna.

**Índices**: solo pkey UNIQUE sobre `(code)`.

**Triggers**: ninguno.

**Versionada en repo**: **No** — sin `CREATE TABLE` en `scripts/`.

**Retención sugerida**: indefinida.

**Observaciones**:
- **`code` `varchar` sin longitud** vs `condition_codes.code` `bpchar` (`character(1)`). Inconsistencia: dos lookups paralelos del mismo dominio TARIC con tipos de PK distintos. Acordar uno (probablemente `varchar(2)` o `varchar(3)` según los códigos reales) en limpieza posterior.
- Mismo patrón de denormalización: `measure_conditions.action_code` no tiene FK a esta tabla.
- Sin trigger ni `created_at` — coherente con tabla de catálogo estático.

---

<!-- Sub-tanda 6C: añadidas declarable_codes, descriptions, additional_codes, footnote_descriptions -->

## declarable_codes

**Filas**: **25 697**

**Propósito inferido del código**: Catálogo de códigos de mercancía declarables (CN8 / TARIC10) — qué códigos puede declararse en una DUA. La columna `is_leaf` indica si el código es terminal (declarable) o intermedio en la jerarquía. Se distingue `goods_code` (8 dígitos sin add_code) y `goods_code_full` (incluyendo add_code de 2 dígitos extra cuando aplica). Usado en `app/api/search-codes/route.js`, `app/api/classify-product/route.js`, `lib/calculateTariff.js` y cargado por `scripts/loadBlock1.js`.

**Columnas** (8):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq) | |
| Código | `goods_code` text (NN), `goods_code_full` text | 8 dígitos vs completo (10) |
| Tipo | `is_leaf` bool (NN, def false) | flag declarable terminal |
| Vigencia | `start_date` date, `declaration_start_date` date, `end_date` date | dos fechas de inicio (declaración del código vs vigencia general) |
| Auditoría | `created_at` timestamptz (def `now()`) | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `dc_public_read` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: ninguna.

**Índices**:
- `idx_dc_goods_code` — btree `(goods_code)`
- `idx_dc_unique` — UNIQUE compuesto `(goods_code, goods_code_full)` ← evita duplicados por combinación CN+full
- `idx_dc_is_leaf` — btree parcial `(is_leaf) WHERE is_leaf = true` ← optimiza el query típico "solo códigos declarables"

**Triggers**: ninguno.

**Versionada en repo**: **Sí** — `scripts/bloque1-schema.sql:134`.

**Retención sugerida**: indefinida (datos públicos UE).

**Observaciones**:
- Diseño con índice UNIQUE compuesto `(goods_code, goods_code_full)` — permite que un mismo `goods_code` (CN8) aparezca varias veces si tiene distintos `goods_code_full` (add_codes). Coherente con la nomenclatura TARIC.
- Índice parcial sobre `is_leaf = true` es buen patrón — evita escanear filas no declarables (intermedias) cuando se buscan terminales.
- **Dos fechas de inicio** (`start_date` y `declaration_start_date`) — la primera para vigencia general del código, la segunda para fecha desde la que se puede declarar. Distinción importante: un código puede existir en TARIC antes de ser declarable.
- Sin CHECK ni constraint que garantice `start_date <= declaration_start_date <= end_date`.

---

## descriptions

**Filas**: **25 691**

**Propósito inferido del código**: Texto descriptivo (en un único idioma) para cada código de mercancía + posición jerárquica. Cobertura prácticamente 1:1 con `declarable_codes` (25 691 vs 25 697). Usado en autocompletes y mostrar el nombre humano del código junto a las medidas. Cargado por `scripts/loadBlock1.js` desde el Excel oficial `Nomenclature EN.xlsx` (según `CLAUDE.md`).

**Columnas** (9):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq, sequence `descriptions_new_id_seq`) | sufijo `_new` delata renombrado desde Bloque 1 |
| Código | `goods_code` text (NN), `goods_code_full` text | |
| Texto | `description` text (NN), `hier_pos` int2, `indent` text | jerarquía visual |
| Vigencia | `start_date` date, `description_start_date` date, `end_date` date | |
| Auditoría | `created_at` timestamptz (def `now()`) | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `desc_new_public_read` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: ninguna.

**Índices**:
- `descriptions_new_pkey` — UNIQUE sobre `(id)` (nombre con sufijo `_new`)
- `idx_desc_new_goods_code` — btree `(goods_code)`
- `idx_desc_new_unique` — UNIQUE compuesto `(goods_code, goods_code_full)` ← mismo patrón que declarable_codes
- `idx_desc_new_hier` — btree `(hier_pos)`

**Triggers**: ninguno.

**Versionada en repo**: **Sí** — `scripts/bloque1-schema.sql:79` define `descriptions_new`; la tabla actual fue renombrada desde ahí (los nombres de pkey/seq/policy/UNIQUE conservan el sufijo `_new`).

**Retención sugerida**: indefinida.

**Observaciones**:
- ⚠️ **Sin columna `language`** — a diferencia de `additional_codes` y `footnote_descriptions` que sí la tienen. Las descripciones del catálogo TARIC están en un único idioma a nivel de schema. La fuente de carga (`Nomenclature EN.xlsx`) confirma que es inglés. Si se quiere ofrecer descripciones en español en la UI, habría que añadir `language bpchar` y cargar también `Nomenclature ES.xlsx`. Inconsistencia de patrón con las otras dos tablas de descripciones del dominio.
- **Sufijos `_new`** en pkey, sequence, policy y UNIQUE — vestigio de la migración Bloque 1 (igual que `measure_types_new_*`). Sin impacto funcional.
- Tres columnas de fecha (`start_date`, `description_start_date`, `end_date`) — `description_start_date` permite que un mismo `goods_code` tenga descripción reescrita sin tocar la vigencia base del código. Diseño correcto para versionar texto.
- 25 691 filas vs 25 697 en `declarable_codes` → **6 códigos sin descripción**. Posible carga incompleta o códigos recientes sin description en el Excel del mes. Reportable a Carlos para confirmar.

---

## additional_codes

**Filas**: **6 506**

**Propósito inferido del código**: Catálogo de "additional codes" TARIC (los 4 dígitos extra que se añaden tras el CN10 cuando una medida lo exige, e.g. códigos antidumping específicos del exportador). Cada combinación (`add_code`, `language`) es única — la tabla **es multilingüe**. Cargado por `scripts/loadBlock3.js`.

**Columnas** (8):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq) | |
| Código | `add_code` text (NN), `language` bpchar (NN, def `'EN'`) | clave compuesta lógica |
| Texto | `description` text | |
| Vigencia | `start_date` date, `description_start_date` date, `end_date` date | |
| Auditoría | `created_at` timestamptz (def `now()`) | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `ac_public_read` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: ninguna.

**Índices**:
- `idx_ac_code` — btree `(add_code)`
- `idx_ac_code_lang` — UNIQUE compuesto `(add_code, language)` ← clave de negocio
- `idx_ac_lang` — btree `(language)`

**Triggers**: ninguno.

**Versionada en repo**: **Sí** — `scripts/bloque3-schema.sql:66`.

**Retención sugerida**: indefinida.

**Observaciones**:
- **`language` es `bpchar` sin longitud explícita** — equivale a `character` variable en la práctica de PostgreSQL (acepta `'EN'`, `'ES'`...). No hay CHECK que limite los valores; valores esperables: `'EN'`, `'ES'`, `'FR'`... Considerar `varchar(2)` o un enum para tipado explícito.
- Multilingüe: el UNIQUE `(add_code, language)` permite tener el mismo código en varios idiomas. Bien diseñado.
- 6 506 filas / si en BD están solo en EN ⇒ ~6.5K códigos diferentes. Si se cargara también ES, esperaríamos ~13K filas.
- Sin FK `measure_conditions.add_code` ni `measure_exclusions.add_code` ni `measure_footnotes.add_code` apuntan aquí — los add_codes de medidas son strings denormalizados (consistente con todo el dominio TARIC).

---

## footnote_descriptions

**Filas**: **5 280**

**Propósito inferido del código**: Textos de las notas a pie referenciadas desde `measure_footnotes` (sub-tanda 6B). Tabla **multilingüe** con clave de negocio `(footnote_code, language)`. Cargada por `scripts/loadBlock3.js`. Es el destino lógico del campo `measure_footnotes.footnote_code` (sin FK estricta — confirmado en 6B).

**Columnas** (8):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq) | |
| Código | `footnote_code` text (NN), `language` bpchar (NN, def `'EN'`) | clave compuesta |
| Texto | `description` text | |
| Vigencia | `start_date` date, `description_start_date` date, `end_date` date | |
| Auditoría | `created_at` timestamptz (def `now()`) | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `fd_public_read` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: ninguna.

**Índices**:
- `footnote_descriptions_pkey1` — UNIQUE sobre `(id)` (nombre con sufijo `1`)
- `idx_fd_code` — btree `(footnote_code)`
- `idx_fd_code_lang` — UNIQUE compuesto `(footnote_code, language)` ← clave de negocio
- `idx_fd_lang` — btree `(language)`

**Triggers**: ninguno.

**Versionada en repo**: **Sí** — `scripts/bloque3-schema.sql:45`.

**Retención sugerida**: indefinida.

### Relación con `measure_footnotes` (sub-tanda 6B)

**Sí existe relación lógica, sin FK estricta**:

- `measure_footnotes.footnote_code` (text, NN, 121 938 filas) — **denormalización**.
- `footnote_descriptions.footnote_code` (text, NN, 5 280 filas) — **descripción del footnote**.

Para resolver el texto de un footnote en una medida, la app debe hacer JOIN sobre `footnote_code` filtrando además por `language`:

```sql
SELECT mf.*, fd.description
FROM measure_footnotes mf
LEFT JOIN footnote_descriptions fd
  ON fd.footnote_code = mf.footnote_code
  AND fd.language = 'EN'
WHERE mf.goods_code = '7208510000';
```

Cardinalidad: 5 280 descripciones × idiomas vs 121 938 referencias = ~23 referencias por descripción promedio (los footnotes se reutilizan masivamente entre medidas). Sin FK significa que si una carga ETL introduce un `footnote_code` no presente en `footnote_descriptions`, la BD no lo detecta — la app debe tolerar el LEFT JOIN sin match.

**Observaciones**:
- **`footnote_descriptions_pkey1` con sufijo `1`** — vestigio de drop+create previo (mismo patrón que `measure_exclusions_pkey1` en 6B). Sin impacto funcional.
- Multilingüe — el UNIQUE `(footnote_code, language)` permite traducciones. Mismo diseño que `additional_codes`.
- Sin CHECK sobre `language`. Valores esperables: `'EN'`, `'ES'`...
- 5 280 filas — si todo está en EN, son ~5K footnotes únicos. Si se cargara también ES, esperaríamos ~10K.

---

<!-- Sub-tanda 6D: añadidas certificate_types, legal_bases, geographical_areas, geographical_areas_composition -->

## certificate_types

**Filas**: **1 766**

**Propósito inferido del código**: Catálogo de tipos de certificado TARIC (`Y007`, `C064`, `Y900`, etc.) con descripción multilingüe. El código de certificado se referencia desde `measure_conditions.certificate_code` (sin FK estricta — patrón TARIC habitual). Cargado por `scripts/loadBlock3.js`.

**Columnas** (8):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq) | |
| Código | `certificate_code` text (NN), `language` bpchar (NN, def `'EN'`) | clave compuesta `(code, lang)` |
| Texto | `description` text | |
| Vigencia | `start_date` date, `description_start_date` date, `end_date` date | doble fecha (vigencia + texto) |
| Auditoría | `created_at` timestamptz (def `now()`) | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `ct_public_read` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: ninguna.

**Índices**:
- `certificate_types_pkey1` — UNIQUE sobre `(id)` ← **sufijo `1`** (vestigio drop+create)
- `idx_ct_code` — btree `(certificate_code)`
- `idx_ct_code_lang` — UNIQUE compuesto `(certificate_code, language)` ← clave de negocio
- `idx_ct_lang` — btree `(language)`

**Triggers**: ninguno.

**Versionada en repo**: **Sí** — `scripts/bloque3-schema.sql:21`.

**Retención sugerida**: indefinida.

**Observaciones**:
- 1 766 filas — si solo en EN ⇒ ~1.7K certificados únicos. Si se cargara también ES, ~3.5K filas. Cobertura coherente con el dominio TARIC oficial.
- Mismo patrón multilingüe que `additional_codes` y `footnote_descriptions` (Tanda 6C). Patrón establecido y consistente.
- **`certificate_types_pkey1` con sufijo `1`** — vestigio drop+create previo (igual que `measure_exclusions_pkey1` en 6B y `footnote_descriptions_pkey1` en 6C). Sin impacto funcional.
- Sin FK reverse desde `measure_conditions.certificate_code` ni desde `measure_alerts.certificate` — denormalización aceptada en hot path.

---

## legal_bases

**Filas**: **4 399**

**Propósito inferido del código**: Catálogo de bases legales (Reglamentos, Decisiones) que sustentan las medidas TARIC. Cada fila es un instrumento legal con su referencia DOUE, página y fecha de publicación. Referenciada lógicamente desde `taric_measures.legal_base` (text libre, sin FK). Cargada por `scripts/loadBlock3.js`.

**Columnas** (6):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq) | |
| Identificador | `legal_base` text (NN, **UNIQUE**) | e.g. `'R1825/2025'`, `'D1234/2024'` |
| Publicación | `official_journal` text, `page` int2, `publication_date` date | DOUE + página + fecha |
| Auditoría | `created_at` timestamptz (def `now()`) | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `lb_public_read` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: ninguna.

**Índices**: pkey + `idx_lb_base` UNIQUE sobre `(legal_base)`.

**Triggers**: ninguno.

**Versionada en repo**: **Sí** — `scripts/bloque3-schema.sql:110`.

**Retención sugerida**: indefinida (registro normativo histórico).

**Observaciones**:
- **No tiene relación FK con `measure_types`** (la pregunta del briefing). Tampoco la tiene con `taric_measures` — `taric_measures.legal_base` (text libre, ver 6A) apunta lógicamente a `legal_bases.legal_base` pero sin FK estricta. Mismo patrón TARIC: lookup denormalizado.
- **Sin columna `language`** — la base legal es identificación normativa, no texto traducible. Solo `official_journal` puede variar por idioma del DOUE pero no se modela aquí.
- 4 399 filas vs 136 009 medidas en `taric_measures` ⇒ promedio ~31 medidas por base legal (las medidas de un mismo Reglamento se reutilizan para muchos productos).
- Sin CHECK ni patrón regex sobre `legal_base` — depende de la consistencia de la carga ETL.

---

## geographical_areas

> ✅ **Sub-tanda 6F (2026-04-29)** — la migración
> [`20260429120000_taric_reference_cleanup.sql`](../../supabase/migrations/20260429120000_taric_reference_cleanup.sql)
> elimina el índice redundante `idx_ga_code` (cubierto por el UNIQUE
> `geographical_areas_area_code_key`). Sin impacto funcional.

**Filas**: **311**

**Propósito inferido del código**: Catálogo TARIC oficial de áreas geográficas — incluye **países individuales** y **grupos** (UE, EFTA, ACP, GSP, etc.). El flag `is_country` discrimina ambos casos: `true` para países individuales, `false` para grupos/uniones. Las 311 filas cubren todas las jurisdicciones reconocidas por la nomenclatura TARIC. Cargada por `scripts/loadBlock1.js`.

**Columnas** (9):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq), `area_code` text (NN, **UNIQUE**) | e.g. `'CN'`, `'EU'`, `'1011'` |
| Texto | `abbrev` text, `description` text (NN) | |
| Tipo | `is_country` bool (def false) | flag país vs grupo |
| Vigencia | `start_date` date, `description_start_date` date, `end_date` date | |
| Auditoría | `created_at` timestamptz (def `now()`) | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `ga_public_read` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: ninguna saliente. Es la fuente lógica de los códigos `origin_code` denormalizados en `taric_measures`, `measure_conditions`, `measure_exclusions`, `measure_footnotes` (sin FK estricta, patrón consistente).

**Índices**:
- `geographical_areas_area_code_key` — UNIQUE `(area_code)`
- `idx_ga_code` — btree `(area_code)` ← **redundante con el UNIQUE**
- `idx_ga_is_country` — btree `(is_country)` ← útil para filtrar países vs grupos

**Triggers**: ninguno.

**Versionada en repo**: **Sí** — `scripts/bloque1-schema.sql:51`.

**Retención sugerida**: indefinida.

**Observaciones**:
- ⚠️ **Índice `idx_ga_code` redundante** con el UNIQUE `geographical_areas_area_code_key` — mismo patrón ya identificado en `measure_types` (6A) y `cbam_countries` (5C). Eliminar en sub-tanda 6F.
- **Sin lengua** — `description` está en un único idioma (inglés según la fuente CIRCABC). Si se quisiera soporte multilingüe, requeriría reformatear como `additional_codes/footnote_descriptions` (con UNIQUE compuesto sobre `(area_code, language)`).
- 311 filas: cobertura completa de la nomenclatura TARIC. Cardinalidad esperada (~250 países + grupos UE/EFTA/ACP/GSP/SPGL/etc.).

### Relación con `public.countries` y `cbam_excluded_countries`

| Tabla | Filas | Propósito | Estado |
|---|---|---|---|
| `geographical_areas` | 311 | Catálogo TARIC oficial (países + grupos) | activa, fuente principal del dominio TARIC |
| `public.countries` | 62 | Lookup ligero para selectores de UI (TARIC) | activa (Tanda 0, fuera de este inventario) |
| `cbam_excluded_countries` | 7 | Específico CBAM: países con ETS equivalente | activa (Tanda 5A) |
| `_deprecated_cbam_countries` | 0 | Catálogo CBAM duplicado huérfano | deprecada en sub-tanda 5C |

**Conclusión**: las tres tablas activas tienen propósitos distintos y **no se reemplazan entre sí**. `geographical_areas` es el catálogo TARIC oficial (incluye grupos como `'EU'`, `'1011'`, `'2200'`). `public.countries` es probablemente un subset de países individuales con metadata mínima para selectores. `cbam_excluded_countries` lista los 7 países que tienen ETS equivalente al europeo y están exentos de CBAM. Coexistencia coherente con el dominio funcional de cada una.

---

## geographical_areas_composition

**Filas**: **2 621**

**Propósito inferido del código**: Tabla M:N de **composición de grupos geográficos**: qué países forman parte de cada grupo TARIC (e.g. `'EU' → ['DE', 'FR', 'ES', ...]`, `'EFTA' → ['CH', 'NO', 'IS', 'LI']`). Crítica para resolver medidas que aplican a un grupo cuando el origen real es uno de sus miembros. Cargada por `scripts/loadBlock1.js`.

**Columnas** (11):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq) | |
| Grupo | `country_group` text (NN), `group_abbrev` text, `group_description` text | denormalizado de `geographical_areas` |
| Miembro | `member_country` text (NN), `member_abbrev` text, `member_description` text | denormalizado igualmente |
| Vigencia membresía | `membership_start_date` date, `membership_end_date` date | versiona cambios (e.g. salida UK de UE en 2020) |
| Vigencia grupo | `group_start_date` date, `group_end_date` date | el grupo en sí también versiona |
| Auditoría | `created_at` timestamptz (def `now()`) | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `gac_public_read` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: **ninguna**. Pese a ser una tabla de relación M:N con dos claves naturales (`country_group`, `member_country`) que apuntan lógicamente a `geographical_areas.area_code`, **no se ha definido FK** — denormalización deliberada (incluye `group_description` y `member_description` para evitar joins en hot path).

**Índices**:
- `idx_gac_group` — btree `(country_group)`
- `idx_gac_member` — btree `(member_country)`
- `idx_gac_member_group` — btree compuesto `(member_country, country_group)` ← lookup invertido típico ("¿a qué grupos pertenece DE?")
- `idx_gac_membership_dates` — btree `(membership_start_date, membership_end_date)` ← optimiza filtros de vigencia

**Triggers**: ninguno.

**Versionada en repo**: **Sí** — `scripts/bloque1-schema.sql:21`.

**Retención sugerida**: indefinida (registro histórico de membresías).

**Observaciones**:
- **Doble denormalización** — `group_description` y `member_description` se replican aquí en lugar de hacer JOIN a `geographical_areas`. Coste: si se actualiza una descripción en `geographical_areas`, hay que regenerar (o sincronizar) `geographical_areas_composition`. Beneficio: consultas de membresía sin JOIN. Aceptable en hot path.
- **Sin UNIQUE** sobre `(country_group, member_country, membership_start_date)` — permite duplicados accidentales por carga ETL repetida. Considerar añadirlo en limpieza posterior.
- **Cuatro fechas** (membership_start/end + group_start/end) — el modelo permite que una membresía empiece después de la creación del grupo y termine antes (cambios históricos). Diseño correcto.
- 2 621 filas vs 311 áreas / si asumimos que ~50 son grupos y ~250 países ⇒ promedio ~50 países por grupo (algunos grupos como `'1011'` agrupan toda la UE; otros más pequeños).

---

## Catálogos paralelos de países en LexAduana

Tres catálogos coexisten activos con propósitos distintos. **No son duplicados**: cada uno cubre un caso de uso diferente.

| Tabla | Filas | Dominio | Propósito | Distintivo |
|---|---|---|---|---|
| `geographical_areas` | 311 | TARIC | Catálogo oficial completo importado de CIRCABC | Incluye **países y grupos** (UE, EFTA, ACP, GSP...) — flag `is_country` distingue |
| `public.countries` | 62 | General | Lookup ligero para selectores de UI | Solo países, metadata mínima (TARIC selectors, calculadora, despachos) |
| `cbam_excluded_countries` | 7 | CBAM | Países con ETS equivalente al europeo, exentos de CBAM | Específico del flujo CBAM (Islandia, Noruega, Suiza, Liechtenstein…) |

### Notas de relación

- **`geographical_areas_composition`** (2 621 filas, sub-tanda 6D) **complementa** a `geographical_areas` aportando la relación M:N grupo → miembros (e.g. `'1011' → ['DE','FR','ES',...]`). Doble denormalización: replica `group_description` y `member_description` para evitar joins en hot path.
- **`_deprecated_cbam_countries`** (sub-tanda 5C, 2026-04-29) fue un cuarto catálogo vacío que solapaba con `public.countries` y `cbam_excluded_countries`; renombrada para revisión 2026-07-29 y posterior `DROP`.
- Los tres catálogos activos **no comparten claves primarias**: `geographical_areas.area_code` (TARIC), `public.countries.country_code` (ISO 3166-1) y `cbam_excluded_countries.country_code` (ISO 3166-1) son nominalmente compatibles para países (`'DE'`, `'CN'`, `'US'`...) pero los grupos de `geographical_areas` (`'1011'`, `'EU'`, `'EFTA'`) no existen en las otras dos.

---

## Hallazgos de la Tanda 6

### 🚨 Críticos

**Ninguno.** Las 18 tablas del dominio TARIC reference data:

- Tienen RLS habilitada con policy SELECT exclusivamente.
- Sin policies de mutación abiertas (`ALL`/INSERT/UPDATE/DELETE para `public` o `authenticated`).
- Mutación reservada a `service_role` (cargas ETL desde scripts CIRCABC).
- Sin reproducción del problema de `checklist_templates` (Tanda 2) ni del de `classification_examples` (Tanda 3).

### ⚡ Performance (entrarán en sub-tanda 6F)

Cinco redundancias de policies/índices con impacto real de espacio y mantenimiento, sobre todo en las tablas grandes:

1. **Policy duplicada en `measure_footnotes`** (122K filas) — `Allow public read measure_footnotes` y `mf_public_read` con el mismo predicado SELECT public USING true. Eliminar una.
2. **Índice duplicado en `measure_footnotes`** — `idx_mf_goods` e `idx_mf_goods_code` ambos sobre `(goods_code)`. Con 122K filas, mantener ambos cuesta espacio y ralentiza escrituras. Eliminar uno.
3. **Índice duplicado en `measure_exclusions`** (29K filas) — `idx_me_excluded` e `idx_me_excluded_country` ambos sobre `(excluded_country_code)`. Eliminar uno.
4. **Índice redundante en `geographical_areas`** — `idx_ga_code` (btree sobre `area_code`) cubierto por el UNIQUE `geographical_areas_area_code_key`. Eliminar.
5. **Índice cubierto por compuesto en `measure_exclusions`** — `idx_me_goods` (sobre `goods_code`) cubierto por el prefijo de `idx_me_goods_excluded` (sobre `(goods_code, excluded_country_code)`). Eliminar.

### 🛠️ Mantenimiento (al backlog, fuera de 6F)

Hallazgos cosméticos o de baja prioridad que conviene recordar:

a) **Vestigios de migraciones previas** en nombres de pkey/sequence/policy/UNIQUE — funcionan correctamente, solo afecta legibilidad:
   - `measure_types_new_*` (Tanda 6A) — sufijo `_new` en pkey, sequence, policy, UNIQUE.
   - `measure_exclusions_id_seq1` / `measure_exclusions_pkey1` (6B) — sufijo `1`.
   - `descriptions_new_*` (6C) — sufijo `_new`.
   - `footnote_descriptions_pkey1` (6C) — sufijo `1`.
   - `certificate_types_pkey1` (6D) — sufijo `1`.

b) **`descriptions` sin columna `language`** — inconsistencia con `additional_codes`, `footnote_descriptions` y `certificate_types` (todas multilingües). Limita la posibilidad de ofrecer descripciones de mercancía en español sin reformatear el schema (añadir `language bpchar` + UNIQUE compuesto + recargar `Nomenclature ES.xlsx`).

c) **6 códigos en `declarable_codes` sin descripción correspondiente** — 25 697 filas en `declarable_codes` vs 25 691 en `descriptions`. Posible carga incompleta o códigos recientes sin texto en el Excel del mes. Reportable a Carlos para reconciliación.

d) **Inconsistencia de tipo** — `condition_codes.code` (`bpchar`/`character(1)`) vs `action_codes.code` (`varchar` sin longitud). Lookups paralelos del mismo dominio TARIC con tipos distintos. Homogeneizar a `varchar(2)` o similar.

e) **`language` sin longitud ni CHECK** en `additional_codes`, `footnote_descriptions`, `certificate_types` — tipo `bpchar` sin longitud explícita. Valores reales `'EN'`, `'ES'`... Considerar `varchar(2)` o enum.

f) **Sin UNIQUE compuesto en `geographical_areas_composition`** — falta `(country_group, member_country, membership_start_date)`. Permite duplicados accidentales por carga ETL repetida.

g) **Falta versionado en `scripts/` para tablas grandes**:
   - `measure_conditions` (29K filas) — solo `_backup_mar26` en `bloque2-schema.sql`.
   - `measure_exclusions` (29K filas) — solo `_backup_mar26`.
   - `taric_measures` (136K filas) — sin `CREATE TABLE` activo.
   - `condition_codes` y `action_codes` — sin `CREATE TABLE` activo.
   Cuando se aplique 6F y se cierre la limpieza, considerar baseline retroactivo similar al de `user_consents` (Fase 1.3).

h) **`measure_alerts` con role `anon` y marcada legacy** — revisar el fallback en `lib/calculateTariff.js:973-985` antes de deprecar. Si el sistema principal cubre todos los casos, RENAME a `_deprecated_measure_alerts` en una iteración futura.

### 📊 Análisis ETL TARIC

- **Frecuencia mensual manual** según `CLAUDE.md`. No hay cron automático: Carlos coloca los 14 Excel CIRCABC y ejecuta `detectChanges.js` + `loadBlock1/2/3.js` a mano.
- **Solo 1 ejecución registrada** en `taric_update_runs` (`2026-04-13`, `data_month = '2026-04'`). Las cargas anteriores no quedaron auditadas (la bitácora se introdujo después de las primeras cargas históricas).
- **Crecimiento esperado de `taric_changes`** — ~18 064 cambios/mes ⇒ proyección ~217K en 12 meses, ~434K en 24 meses. Considerar política de purga a **24 meses** o partición por `data_month` en Fase 8.
- **`taric_changes.run_id` con FK ON DELETE CASCADE** — borrar un run elimina TODO su histórico de cambios. Si en el futuro se quiere purgar selectivamente, **NO usar la cascada por `run_id`**: aplicar `DELETE FROM taric_changes WHERE data_month < ...` directamente, preservando el run en `taric_update_runs` como bitácora histórica.

---

## Correcciones propuestas para Sub-tanda 6F

Migración única con drops de policy + índices duplicados/redundantes. Todos idempotentes (`IF EXISTS`):

```sql
-- 1. Drop policy duplicada en measure_footnotes
-- (Verificar nombre exacto de la duplicada antes de aplicar; conservar mf_public_read o
-- Allow public read measure_footnotes según convenga)
DROP POLICY IF EXISTS "Allow public read measure_footnotes" ON public.measure_footnotes;

-- 2. Drop índice duplicado en measure_footnotes
DROP INDEX IF EXISTS public.idx_mf_goods;
-- conservar idx_mf_goods_code

-- 3. Drop índice duplicado en measure_exclusions
DROP INDEX IF EXISTS public.idx_me_excluded;
-- conservar idx_me_excluded_country

-- 4. Drop índice redundante en geographical_areas
DROP INDEX IF EXISTS public.idx_ga_code;
-- cubierto por UNIQUE geographical_areas_area_code_key

-- 5. Drop índice cubierto por compuesto en measure_exclusions
DROP INDEX IF EXISTS public.idx_me_goods;
-- cubierto por prefijo de idx_me_goods_excluded
```

Tras aplicar:
- Las 18 tablas conservan funcionalidad y RLS intactas.
- Espacio liberado: principalmente del par duplicado en `measure_footnotes` (122K filas × 2 índices).
- Resto de hallazgos (vestigios `_new`/`_pkey1`, `descriptions` sin lengua, faltante `taric_measures` en scripts, etc.) quedan en `BACKLOG_PRIVACIDAD.md` para iteración futura no-bloqueante.
