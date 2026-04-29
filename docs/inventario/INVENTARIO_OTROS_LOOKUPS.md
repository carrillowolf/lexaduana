# Inventario — Dominio Otros / Lookups

**Tanda**: 7 / 8 (parcial — sub-tanda 7A)
**Fecha**: 2026-04-29
**Schema**: `public`
**Tablas esta sub-tanda**: `countries`, `vat_rates`, `subscription_plans`, `tariff_history`, `tariff_changes`
**Pendientes (sub-tanda 7B)**: `current_exchange_rates`, `upcoming_exchange_rates`, `exchange_rates`, `tariffs_backup_v42`, `measure_exclusions_backup_v42`, `preferential_tariffs_backup_v42` (+ hallazgos finales).

> Fuente: `information_schema` + `pg_catalog` + grep del repo. **Mezcla heterogénea**: lookups públicos UI, datos comerciales del producto y dos tablas legacy (`tariff_history` y `tariff_changes` con 0 filas, sin uso activo).

---

## countries

**Filas**: 62

**Propósito inferido del código**: Lookup ligero de países para selectores UI (TARIC y despachos). Distinta finalidad que `geographical_areas` (311 filas, catálogo TARIC con grupos) y `cbam_excluded_countries` (7 filas, exclusiones CBAM); ver tabla comparativa al final del archivo de TARIC reference (Tanda 6E). Usada en `app/clasificador/page.js` y `lib/calculateTariff.js`. **Cubre la funcionalidad que pretendía `_deprecated_cbam_countries`** (deprecada en sub-tanda 5C).

**Columnas** (7):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq), `country_code` varchar (NN, **UNIQUE**), `country_name` varchar (NN) | |
| Acuerdos | `agreement_type` varchar, `reduction_rate` numeric (def 0) | datos preferenciales |
| Estado | `notes` text, `active` bool (def true) | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `Allow public read countries` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: ninguna.

**Índices**:
- `countries_country_code_key` — UNIQUE `(country_code)`
- `idx_countries_code` — btree `(country_code)` ← **redundante con el UNIQUE**
- `idx_countries_active` — btree `(active)`

**Triggers**: ninguno.

**Versionada en repo**: **No** (sin `CREATE TABLE` activo en `scripts/`).

**Retención sugerida**: indefinida (catálogo).

**Observaciones**:
- ⚠️ **`idx_countries_code` redundante** con el UNIQUE — mismo patrón ya identificado en `measure_types` (6A), `cbam_countries` (5B-2) y `geographical_areas` (6D, ya en 6F). Eliminar en una iteración cosmética posterior.
- `agreement_type` libre `text` — valores esperables (`'EU'`, `'EFTA'`, `'GSP'`, `'CETA'`, `'EUR1'`...). Sin CHECK ni FK a un catálogo de acuerdos.
- `reduction_rate` con default 0 — coherente con que la mayoría de países no tienen acuerdo preferencial.
- `notes` text libre — sin uso aparente en código (decoración admin).

---

## vat_rates

**Filas**: 31

**Propósito inferido del código**: Tipos de IVA español por código de mercancía TARIC. Usada en `lib/calculateTariff.js` para calcular el IVA aplicable al valor en aduana + arancel. **Solo cubre España** (no tiene `country_code`) y los 4 tipos español: 4 %, 10 %, 21 % + exenciones. Las 31 filas mapean rangos/listas de `goods_code` a uno de esos tipos.

**Columnas** (6):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq) | |
| Mercancía | `goods_code` varchar (NN) | rango/prefijo CN |
| Tipo | `vat_rate` numeric (NN), `vat_type` varchar (NN), `description` text | tasa + label (`'reducido'`, `'general'`, `'súper-reducido'`...) |
| Auditoría | `created_at` (timestamp sin tz, def `now()`) | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `Allow public read access` — **role `{anon}`** (única excepción del lote, igual que `measure_alerts` en 6A) USING `true`

> ⚠️ **Inconsistencia de role**: `{anon}` en lugar de `{public}`. Funcionalmente equivalente para SELECT público sin login pero rompe el patrón uniforme. Al backlog de Tanda 7E (final de inventario).

**Foreign keys**: ninguna.

**Índices**:
- `idx_vat_goods` — btree `(goods_code)`

**Triggers**: ninguno.

**Versionada en repo**: **No**.

**Retención sugerida**: indefinida.

**Observaciones**:
- **Sin `country_code`** — la tabla asume implícitamente que LexAduana opera con importadores españoles aplicando IVA español. Si se internacionaliza la calculadora a otros estados miembros, requiere ALTER TABLE para añadir `country_code` y multiplicar las filas (cada producto × país).
- Sin CHECK sobre `vat_rate` (rango razonable [0, 30]) ni sobre `vat_type`. Valores esperables: `'súper-reducido'` (4 %), `'reducido'` (10 %), `'general'` (21 %), `'exento'` (0 %).
- `created_at` sin timezone — inconsistente con el resto del dominio que usa `timestamptz`. Cosmético.
- ¿Cómo se actualiza si España cambia un IVA? No hay versionado por fecha (`effective_from/to`). Una modificación reescribiría la fila vigente; histórico se perdería. Aceptable porque los IVA cambian raramente, pero documentar.

---

## subscription_plans

**Filas**: 3

**Propósito inferido del código**: Catálogo de planes de suscripción (probablemente `'free'`, `'basic'`, `'pro'`) con precio mensual y features. Referenciada lógicamente desde `user_profiles.plan_type` (text libre, sin FK). Las 3 filas corresponden a los planes públicos del producto. Sin grep matches directos en código → la lectura puede estar en componentes de pricing/landing que no toqué en esta sesión, o el catálogo se hardcodea en el front.

**Columnas** (5):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq) | |
| Plan | `plan_name` varchar | nullable (extraño para identificador de plan) |
| Capacidades | `max_monitors` int, `features` jsonb | features = lista de bullet points |
| Precio | `price_monthly` numeric | en EUR (asumido) |

**PII**: No · **Datos comerciales del producto**: **Sí** — `price_monthly` es información comercial pública (los precios se muestran en la landing).

**RLS**: Sí · `Allow public read subscription_plans` (SELECT, role `{public}`, USING `true`)

> ✅ **RLS adecuada** — los precios y features se exponen deliberadamente para que la página de pricing los lea sin autenticación. No es PII ni dato sensible interno (los precios son públicos en la landing).

**Foreign keys**: ninguna.

**Índices**: solo pkey.

**Triggers**: ninguno.

**Versionada en repo**: **No**.

**Retención sugerida**: indefinida.

**Observaciones**:
- **Sin FK a `auth.users`** ni a `user_profiles` — la tabla es un catálogo independiente. La asociación usuario→plan se hace vía `user_profiles.plan_type` (text libre con default `'free'`, ver Tanda 1) que apunta lógicamente a `subscription_plans.plan_name` pero sin FK estricta.
- **`plan_name` nullable** — extraño para identificador de plan. Probable error de diseño (debería ser `NOT NULL` o incluso `UNIQUE`). Al backlog.
- **Sin Stripe ni datos de pago** en esta tabla — solo el catálogo. La pasarela de pago debe estar en otro sistema (Stripe externo, no inventariado aquí). El campo `cbam_advisory_requests.payment_status` (Tanda 4) sugiere que CBAM advisory tiene su propio flujo de pago manual, no automatizado vía Stripe.
- **NO está conectada con CBAM advisory de pago** — `cbam_advisory_requests` y `cbam_monitoring_subscriptions` son flujos de pago independientes (asesoría CBAM 199 €/mes, sin suscripción mensual via Stripe). `subscription_plans` parece ser para suscripciones mensuales del producto principal (calculadora + monitor de cambios).
- **Sin `is_active`** ni vigencia — un plan deprecado se eliminaría físicamente (con riesgo de invalidar `user_profiles.plan_type` de usuarios existentes). Considerar añadir `active bool default true`.

---

## tariff_history

**Filas**: **0**

**Propósito inferido del código**: Histórico de cambios de aranceles por código de mercancía. Pretendía registrar qué `goods_code` cambió de `old_duty` a `new_duty` y cuándo. **Vacía hoy**. Solo aparece en código en `scripts/updateTariffs.js:102` (`.from('tariff_history').insert(changes)`) — un script de carga que parece **nunca haberse ejecutado** (0 filas confirma). **Reemplazada en la práctica por `taric_changes`** (Tanda 6A, 18 064 filas, sí usada por `app/cambios/`).

**Columnas** (6):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq) | |
| Cambio | `goods_code` varchar (NN), `old_duty` numeric, `new_duty` numeric | |
| Origen | `change_detected` date (def `CURRENT_DATE`), `data_source` varchar | |
| Auditoría | `created_at` (timestamp sin tz, def `now()`) | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `Allow public read tariff_history` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: ninguna.

**Índices**:
- `idx_history_code` — btree `(goods_code)`
- `idx_history_date` — btree `(change_detected)`

**Triggers**: ninguno.

**Versionada en repo**: **No**.

**Retención sugerida**: N/A (vacía, candidata a deprecación).

**Observaciones**:
- 🔍 **Tabla legacy** — 0 filas, esquema más simple que el sistema activo `taric_changes` (que tiene 16 columnas vs estas 6, snapshots jsonb, FK a runs, severidad). Carlos puede confirmar que `scripts/updateTariffs.js` está obsoleto y `scripts/detectChanges.js` lo reemplazó.
- Candidata a deprecación en una sub-tanda futura (RENAME a `_deprecated_tariff_history` con revisión 90 días, mismo patrón que las deprecaciones de Tanda 5C).

---

## tariff_changes

**Filas**: **0**

**Propósito inferido del código**: Tabla legacy con esquema "intermedio" entre `tariff_history` y `taric_changes`. Comentario en BD: `'Histórico público de cambios TARIC mensuales'` — pero está vacía y sin uso en código. **No aparece en ningún archivo del repo** (ni grep en `app/`, `components/`, `lib/`, `scripts/`). El sistema activo es `taric_changes` (de Tanda 6A, 18 064 filas).

> ⚠️ **Confusión de nombres**: `tariff_changes` (esta tabla, vacía, legacy) vs `taric_changes` (Tanda 6A, activa con 18K filas). La diferencia es solo `tariff` vs `taric` — fácil error de tipeo. Cualquier desarrollador nuevo podría confundirlas.

**Columnas** (10):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq) | |
| Cambio | `change_date` date (NN), `goods_code` varchar (NN), `country_code` varchar, `change_type` varchar (NN) | |
| Diff | `old_duty` numeric, `new_duty` numeric, `difference` numeric | preserva la diferencia denormalizada |
| Análisis | `impact` varchar, `notes` text | |
| Auditoría | `created_at` (timestamp sin tz, def `now()`) | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `Allow public read tariff_changes` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: ninguna.

**Índices**:
- `idx_tariff_changes_country` — btree `(country_code)`
- `idx_tariff_changes_date` — btree `(change_date)`
- `idx_tariff_changes_goods` — btree `(goods_code)`

**Triggers**: ninguno.

**Versionada en repo**: **No**.

**Retención sugerida**: N/A (vacía, candidata a deprecación).

**Observaciones**:
- 🔍 **Tabla legacy con confusión de nombres respecto a `taric_changes`** — vacía y sin uso. Candidata a deprecación con prioridad alta para evitar futuros errores de tipeo (un desarrollador podría leer/escribir aquí pensando que es la activa). Renombrar a `_deprecated_tariff_changes`.
- Comentario en pg_catalog (`'Histórico público de cambios TARIC mensuales'`) sugiere que era el primer intento de la página `/cambios` antes de migrar al esquema más rico de `taric_changes`. Histórico de iteración de diseño.

---

<!-- Sub-tanda 7B: añadidas exchange_rates, current_exchange_rates, upcoming_exchange_rates, tariffs_backup_v42, measure_exclusions_backup_v42, preferential_tariffs_backup_v42 -->

## exchange_rates

**Filas**: 2 235 (15 monedas, rango `start_date` 2007-01-01 → 2026-03-01)

**Propósito inferido del código**: Histórico completo de tipos de cambio EUR → otras monedas, modelado con `(base_currency, target_currency, start_date, end_date)`. Esquema **legacy**: el sistema actual usa `current_exchange_rates` y `upcoming_exchange_rates` (29 monedas, con `boe_reference`). El histórico se quedó congelado el 2026-03-01 — ya no se actualiza.

**Columnas** (7):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq, sequence `exchange_rates_id_seq1`) | sufijo `1` — vestigio drop+create |
| Cambio | `base_currency` text (NN, def `'EUR'`), `target_currency` text (NN), `rate` numeric (NN) | |
| Vigencia | `start_date` date (NN), `end_date` date | |
| Auditoría | `created_at` timestamptz (def `now()`) | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `er_public_read` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: ninguna.

**Índices**:
- `exchange_rates_pkey1` — UNIQUE sobre `(id)` ← **sufijo `1`** (vestigio drop+create)
- `idx_er_currency` — btree `(target_currency)`
- `idx_er_dates` — btree `(start_date, end_date)`

**Triggers**: ninguno.

**Versionada en repo**: **Sí** — `scripts/bloque3-schema.sql:91`.

**Retención sugerida**: indefinida (histórico de tipos BCE).

**Observaciones**:
- **Esquema legacy frente a `current/upcoming_exchange_rates`** — diferencias clave:
  - 15 monedas vs 29 en el sistema actual.
  - Sin `boe_reference` ni `publication_date` — solo `start_date`/`end_date` y la propia tarifa.
  - Última `start_date` = 2026-03-01: las cargas mensuales nuevas (abril 2026 BOE-A-2026-6470) ya no llegan aquí.
- **Posible deprecación** si se confirma que ningún endpoint actual lo lee como fuente principal. Las páginas `app/tipos-cambio/page.js` y los componentes `ExchangeRateBanner/Widget` probablemente usan `current/upcoming_exchange_rates` (el grep no distingue exactamente). Reportar a Carlos para validar antes de proponer RENAME.
- **`exchange_rates_pkey1` con sufijo `1`** — patrón ya documentado (`measure_exclusions_pkey1`, `footnote_descriptions_pkey1`, `certificate_types_pkey1`, etc.).

---

## current_exchange_rates

**Filas**: 29 (29 monedas, vigentes desde **2026-04-01**, `boe_reference = 'BOE-A-2026-6470'`)

**Propósito inferido del código**: Tipos de cambio **vigentes** este mes, publicados en BOE para uso aduanero. Una fila por moneda. Rotan al primero de cada mes desde `upcoming_exchange_rates`. Lectura desde `app/api/exchange-rates/route.js`, `app/tipos-cambio/page.js`, `components/ExchangeRateBanner.js`, `ExchangeRateWidget.js`. Carga vía `scripts/update-rates.js` o `scripts/update-rates-2026-05.js` (ciclo mensual manual).

**Columnas** (7):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq) | |
| Moneda | `currency_code` text (NN), `currency_name` text (NN), `rate` numeric (NN) | |
| Vigencia | `effective_from` date (NN) | inicio del mes |
| Trazabilidad BOE | `publication_date` date (NN), `boe_reference` text (NN) | identifica el BOE |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `current_rates_public_read` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: ninguna.

**Índices**: solo pkey.

**Triggers**: ninguno.

**Versionada en repo**: **Sí** — `scripts/update-exchange-rates-2026-03.sql:23`.

**Retención sugerida**: 1 fila por moneda en cada momento (29 actualmente). En la rotación mensual, las filas anteriores se sobrescriben — no hay histórico aquí.

**Observaciones**:
- Diseño **mucho más rico que `exchange_rates`** (legacy): añade trazabilidad BOE explícita.
- **No hay índice sobre `currency_code`** ni sobre `effective_from` — innecesario con 29 filas. La mayoría de queries leen toda la tabla y filtran en aplicación.
- Sin `created_at`/`updated_at` ni vigencia `end_date` — la tabla mantiene solo el snapshot actual; las versiones anteriores no se conservan aquí.
- 29 monedas coincide con la lista BOE estándar de divisas usadas en aduanas.

---

## upcoming_exchange_rates

**Filas**: 29 (29 monedas, vigentes desde **2026-05-01**, `boe_reference = 'BOE-A-2026-8938'`)

**Propósito inferido del código**: Tipos de cambio del **mes siguiente** ya publicados en BOE pero aún no vigentes. Permite a la app mostrar "el próximo mes el USD pasa a X" como aviso preventivo. **Mismo esquema que `current_exchange_rates`** (7 cols idénticas). Rotan al primero del mes siguiente: el cron/script copia upcoming → current y carga el nuevo upcoming.

**Columnas**: idénticas a `current_exchange_rates` (7 cols).

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `upcoming_rates_public_read` (SELECT, role `{public}`, USING `true`)

**Foreign keys**: ninguna.

**Índices**: solo pkey.

**Triggers**: ninguno.

**Versionada en repo**: **Sí** — `scripts/update-exchange-rates-2026-03.sql:33`.

**Retención sugerida**: 1 fila por moneda. Se sobrescribe mensualmente al pasar a `current_exchange_rates`.

**Observaciones**:
- **Patrón "current/upcoming" deliberado** — separar en dos tablas evita querys complicadas con filtro temporal y permite mostrar la próxima rotación con cardinalidad pequeña.
- BOE de mayo 2026 ya cargado (`'BOE-A-2026-8938'`, effective_from `2026-05-01`).
- **Mejora pendiente**: la rotación mensual current → archivo histórico (e.g. tabla `exchange_rates_archive` o las propias `current_exchange_rates`) no parece automatizada. Tras pasar mayo a current, los datos de abril desaparecen. Si se necesita auditoría histórica completa, considerar archivar antes de sobrescribir.

---

## tariffs_backup_v42

**Filas**: 8 373

**Propósito inferido del código**: Backup de la antigua tabla `tariffs` (esquema v42), reemplazada por `taric_measures` (Tanda 6A, 136 009 filas, esquema mucho más rico). Conserva snapshots de aranceles base con `goods_code + origin + measure_type + legal_base + duty`. **No hay grep que la consulte activamente** — los nombres de sequence/pkey originales (`tariffs_id_seq`, `tariffs_pkey`) confirman que era la tabla `tariffs` original antes del rename.

**Columnas** (6):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq, sequence `tariffs_id_seq`) | secuencia con nombre original |
| Lookup | `goods_code` varchar (NN), `origin` varchar (def `'ERGA OMNES'`), `measure_type` varchar | |
| Arancel | `duty` numeric (NN), `legal_base` varchar | |

> ⚠️ **Sin `created_at` ni columnas de fecha** — no se puede saber cuándo se cargó originalmente ni cuál era la versión TARIC. El sufijo `_backup_v42` es el único marcador.

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `Allow public read tariffs` (SELECT, role `{public}`, USING `true`) — nombre de policy con sufijo `tariffs` (sin el `_backup_v42`), confirma rename de la original.

**Foreign keys**: ninguna.

**Índices**:
- `tariffs_pkey` — UNIQUE sobre `(id)` (nombre original, sin `_backup_v42`)
- `tariffs_goods_code_origin_key` — UNIQUE `(goods_code, origin)` (nombre original)
- `idx_tariffs_code` — btree `(goods_code)`
- `idx_tariffs_code_pattern` — btree `(goods_code text_pattern_ops)` ← optimiza `LIKE 'prefix%'` queries

**Triggers**: ninguno.

**Versionada en repo**: **No**.

**Retención sugerida**: N/A — candidata a `DROP`.

**Observaciones**:
- ⚠️ **No hay tabla activa equivalente con el mismo esquema simple** — los aranceles base actuales están integrados en `taric_measures` con un modelo mucho más rico (vigencia, conditions, footnotes...). El backup conserva un snapshot histórico simplificado.
- **Riesgo de eliminación**: bajo. `taric_measures` cubre los aranceles activos vigentes. El backup era de un sistema anterior (v42) ya migrado.
- **Recomendación**: `DROP` directo (sin rename a `_deprecated_*` porque ya tiene sufijo `_backup_v42` que la marca como histórica). Decisión final en sub-tanda 7C.

---

## measure_exclusions_backup_v42

**Filas**: **34 370** · última `created_at` = **2025-10-13**

**Propósito inferido del código**: Backup de `measure_exclusions` antes de la migración v44 (la activa, Tanda 6B, 28 975 filas). **Tiene MÁS filas que la activa** (34 370 vs 28 975). Sin grep matches en código actual.

**Columnas** (8):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq, sequence `measure_exclusions_id_seq`) | secuencia con nombre original |
| Lookup | `goods_code` varchar (NN), `measure_type_code` varchar (NN) | |
| Tipo medida | `measure_description` text | |
| Exclusión | `excluded_country_code` varchar (NN), `excluded_country_name` varchar | |
| Origen | `origin_scope` varchar | extra que la activa no tiene |
| Auditoría | `created_at` (timestamp sin tz, def `now()`) | últimas filas: 2025-10-13 |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `Allow public read access` — **role `{anon}`** USING `true`

> ⚠️ **Inconsistencia de role**: `{anon}` en lugar de `{public}` (mismo patrón que `measure_alerts` en 6A y `vat_rates` en 7A).

**Foreign keys**: ninguna.

**Índices** (5):
- `measure_exclusions_pkey` — UNIQUE sobre `(id)` (nombre original, sin `_backup_v42`)
- `idx_exclusions_country` — btree `(excluded_country_code)`
- `idx_exclusions_goods` — btree `(goods_code)`
- `idx_exclusions_goods_country` — btree `(goods_code, excluded_country_code)`
- `idx_exclusions_measure` — btree `(measure_type_code)`

**Triggers**: ninguno.

**Versionada en repo**: **No**.

**Retención sugerida**: **🚨 DECISIÓN PENDIENTE** — ver Observaciones.

**Observaciones**:
- 🚨 **HALLAZGO IMPORTANTE — diferencia de filas con la activa**: `measure_exclusions_backup_v42` tiene **34 370 filas**, mientras que `measure_exclusions` activa tiene **28 975**. Diferencia: **+5 395 filas en el backup**.
  - **Hipótesis 1 (más probable)**: el backup conservó exclusiones **caducadas** (con `end_date` < 2025-10-13) que la migración v44 limpió porque ya no aplicaban.
  - **Hipótesis 2 (a descartar)**: la migración v42 → v44 **perdió datos** que sí deberían estar en la activa.
- **Antes de proponer DROP**, Carlos debe ejecutar una query de comparación para descartar la hipótesis 2:
  ```sql
  -- Filas en backup que NO están en la activa (por clave funcional aprox)
  SELECT COUNT(*) FROM public.measure_exclusions_backup_v42 b
  WHERE NOT EXISTS (
    SELECT 1 FROM public.measure_exclusions a
    WHERE a.goods_code = b.goods_code
      AND a.excluded_country_code = b.excluded_country_code
      AND a.measure_type_code::text = b.measure_type_code
  );
  ```
- **Esquema diferente**: el backup tiene `measure_description` y `origin_scope` que la activa no tiene. Si esos campos resultan útiles en el futuro, se podrían reincorporar al schema activo.
- **No proponer DROP en sub-tanda 7C** sin confirmación.

---

## preferential_tariffs_backup_v42

**Filas**: 34 407 · última `created_at` = **2025-10-20**

**Propósito inferido del código**: Backup de la antigua tabla `preferential_tariffs` (aranceles preferenciales por origen, esquema v42). Sin tabla activa equivalente — los aranceles preferenciales en v44 están integrados en `taric_measures` (con tipos de medida específicos como `142`, `143`, etc.) y enriquecidos con `measure_conditions` y `geographical_areas`. Sin grep matches en código actual.

**Columnas** (9):
| Bloque | Columnas | Notas |
|---|---|---|
| ID | `id` (int4 seq, sequence `preferential_tariffs_id_seq`) | secuencia con nombre original |
| Lookup | `goods_code` varchar (NN), `country_code` varchar (NN), `country_name` varchar | |
| Arancel | `preferential_duty` numeric (NN), `measure_type` varchar, `legal_base` varchar | |
| Vigencia | `start_date` varchar, `end_date` varchar | **almacenadas como `varchar`** — no como `date` |
| Auditoría | `created_at` (timestamp sin tz, def `now()`) | |

**PII**: No · **Datos comerciales del usuario**: No

**RLS**: Sí · `Allow public read preferential_tariffs` (SELECT, role `{public}`, USING `true`) — nombre policy con sufijo `preferential_tariffs` (sin `_backup_v42`), confirma rename.

**Foreign keys**: ninguna.

**Índices**:
- `preferential_tariffs_pkey` — UNIQUE sobre `(id)` (nombre original)
- `preferential_tariffs_goods_code_country_code_key` — UNIQUE `(goods_code, country_code)`
- `idx_pref_country_code` — btree `(country_code)`
- `idx_pref_goods_code` — btree `(goods_code)`
- `idx_pref_goods_country` — btree `(goods_code, country_code)` ← compuesto

**Triggers**: ninguno.

**Versionada en repo**: **No**.

**Retención sugerida**: N/A — candidata a `DROP` (no hay tabla activa equivalente; los preferenciales están en `taric_measures`).

**Observaciones**:
- **Sin tabla activa equivalente con el mismo esquema simple**. Los aranceles preferenciales en el sistema actual viven dentro de `taric_measures` con su `measure_type_code` específico — el modelo es ortogonal al backup. No procede comparar filas como en `measure_exclusions_backup_v42`.
- ⚠️ **`start_date` y `end_date` como `varchar`** — es decir, fechas almacenadas como cadenas de texto. Cargar/comparar requiere parseo. El esquema v44 ya usa tipos `date` correctamente.
- 34 407 filas con 5 índices — coste de espacio no trivial para una tabla sin uso.
- **Recomendación**: `DROP` directo en sub-tanda 7C (sin rename a `_deprecated_*`).

---

<!-- TANDA 7 INCOMPLETA: pendiente sub-tanda 7C (hallazgos consolidados + propuesta de migración). -->
