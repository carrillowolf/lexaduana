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

<!-- TANDA 7 INCOMPLETA: faltan sub-tanda 7B (exchange rates + backups v42) y 7E (hallazgos + propuestas). -->
