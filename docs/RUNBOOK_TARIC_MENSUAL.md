# Runbook TARIC mensual — carga desde CIRCABC

Procedimiento operativo para la actualización mensual del snapshot TARIC desde CIRCABC. Se ejecuta una vez al mes, manualmente.

## Qué se actualiza

| Tabla | Filas (orden de magnitud) | Bloque |
|---|---|---|
| `taric_measures` | ~136 K | 2 |
| `measure_conditions` | ~29 K | 2 |
| `measure_exclusions` | ~29 K | 2 |
| `measure_footnotes` | ~122 K | 2 |
| `geographical_areas`, `geographical_areas_composition` | ~3 K total | 1 |
| `descriptions`, `declarable_codes`, `measure_types` | ~52 K total | 1 |
| `footnote_descriptions`, `additional_codes`, `certificate_types`, `legal_bases` | ~18 K total | 3 |
| `taric_changes` | +~18 K nuevas filas/mes | detectChanges (antes de los blocks) |
| `taric_update_runs` | +1 fila (bitácora del run) | detectChanges |

> El sistema activo de divisas (`current_exchange_rates`, `upcoming_exchange_rates`) se actualiza por separado con `scripts/update-rates*.js` — no entra en este flujo.

## Pre-requisitos

1. Tener los **14 Excel CIRCABC** del mes en cuestión, descargados de:
   <https://circabc.europa.eu/ui/group/0e5f18c2-4b2f-42e9-aed4-dfe50ae1263b/library/566dd333-1deb-4235-982a-4fdeaf3657c1>

2. Colocarlos en **`data/nuevo-mes/`** (relativo a la raíz del repo). Es la ruta por defecto que `detectChanges.js` y `loadBlockN.js` esperan (configurable con `--excel-path=/otra/ruta`).

3. Archivos requeridos:

   **Block 1 — master data**:
   - `Geographical areas composition.xlsx`
   - `Geographical areas description.xlsx`
   - `Nomenclature EN.xlsx`
   - `Declarable codes.xlsx`
   - `Box 44 codes of the SAD.xlsx`

   **Block 2 — medidas y derivadas (también requerido por `detectChanges`)**:
   - `Duties Import 01-99.xlsx`
   - `Measure conditions.xlsx`
   - `Measure exclusions.xlsx`
   - `Measure footnotes.xlsx`

   **Block 3 — descripciones y referencias**:
   - `Footnotes descriptions.xlsx`
   - `Additional codes descriptions.xlsx`
   - `CCT Exchange rates.xlsx` *(legacy — ver aviso)*
   - `Legal basis.xlsx`
   - (+ `Certificates.xlsx` u otro fichero de certificados según el mes)

4. `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_KEY` cargados.

## Pasos en orden

⚠️ **Crítico: ejecutar `detectChanges` ANTES de cualquier `loadBlock`.** El detector compara el Excel nuevo contra los datos actuales en Supabase; si los `loadBlock` ya han sobrescrito esos datos, los cambios detectados serán vacíos o incorrectos.

### Paso 1 — Dry-run de detección de cambios (recomendado primero)

```bash
node scripts/detectChanges.js --month=YYYY-MM --dry-run
```

- No escribe nada en `taric_changes` ni en `taric_update_runs`.
- Reporta por consola cuántos cambios se detectarían.
- ✅ **Validar**: el número total debería estar en el rango de ~10 K – ~30 K (media histórica ~18 K). Si el resultado es 0, los Excel probablemente coinciden con la BD — comprobar que los archivos del mes nuevo están en `data/nuevo-mes/` y no son los del mes anterior.

### Paso 2 — Detección de cambios real

```bash
node scripts/detectChanges.js --month=YYYY-MM
```

- Inserta una fila en `taric_update_runs` con `data_month = 'YYYY-MM'`.
- Inserta ~18 K filas en `taric_changes` con `run_id` apuntando a la nueva run.
- ✅ **Validar**: query rápida tras la ejecución (ver "Verificación post-carga").

### Paso 3 — Carga Block 1 (master data)

```bash
node scripts/loadBlock1.js
```

Sobrescribe `geographical_areas`, `geographical_areas_composition`, `descriptions`, `declarable_codes`, `measure_types`.

### Paso 4 — Carga Block 2 (medidas)

```bash
node scripts/loadBlock2.js
```

Sobrescribe `taric_measures`, `measure_conditions`, `measure_exclusions`, `measure_footnotes`. Es el bloque más voluminoso (>290 K filas en total).

### Paso 5 — Carga Block 3 (descripciones y referencias)

```bash
node scripts/loadBlock3.js
```

Sobrescribe `footnote_descriptions`, `additional_codes`, `certificate_types`, `legal_bases`.

⚠️ **Aviso temporal**: `loadBlock3.js:235` también hace `batchInsert('exchange_rates', ...)` sobre la tabla legacy. Cuando esa línea se elimine del script, aplicar la migración pendiente para deprecar `exchange_rates` (ver `BACKLOG_PRIVACIDAD.md` → "De Tanda 7" → "Limpieza pendiente: `exchange_rates` legacy").

### Paso 6 — Verificación visual en `/cambios`

1. Abrir la app web (preview o producción) y navegar a `/cambios`.
2. ✅ El selector de mes (`MonthSelector`) debe mostrar el nuevo mes `YYYY-MM`.
3. ✅ Al seleccionarlo, `ChangesSummary` muestra el total de cambios detectados.
4. ✅ `ChapterTable` distribuye los cambios por capítulo (01–99).
5. ✅ `TopChanges` y `HighlightsSection` muestran los cambios más destacados.

Si algo falla, ver "Rollback" más abajo.

## Verificación post-carga (queries SQL)

Ejecutar en SQL Editor de Supabase tras Paso 5. Sustituir `YYYY-MM` por el mes cargado.

### Conteo de la nueva run

```sql
SELECT id, data_month, run_date, total_changes, status, completed_at
FROM public.taric_update_runs
WHERE data_month = 'YYYY-MM'
ORDER BY run_date DESC
LIMIT 1;
```

Esperado: 1 fila con `status` razonable (`'success'` o similar) y `total_changes` cuadrando con el dry-run.

### Cambios por tipo en este mes

```sql
SELECT change_type, severity, COUNT(*)
FROM public.taric_changes
WHERE data_month = 'YYYY-MM'
GROUP BY change_type, severity
ORDER BY change_type, severity;
```

Esperado: predominio de `'measure'` con severidad `'info'`/`'warning'`. Cualquier `'critical'` debería revisarse manualmente antes de publicar a usuarios.

### Comparación con el mes anterior (sanity check)

```sql
SELECT data_month, COUNT(*) AS total
FROM public.taric_changes
WHERE data_month IN ('YYYY-MM', 'YYYY-MM-anterior')
GROUP BY data_month
ORDER BY data_month;
```

Esperado: dos filas con totales del orden de ~18 K cada uno. Una desviación >50 % respecto al mes anterior justifica investigar antes de publicar.

### Conteos finales de las tablas grandes (post Block 2)

```sql
SELECT 'taric_measures' AS tabla, COUNT(*) FROM public.taric_measures
UNION ALL SELECT 'measure_conditions', COUNT(*) FROM public.measure_conditions
UNION ALL SELECT 'measure_exclusions', COUNT(*) FROM public.measure_exclusions
UNION ALL SELECT 'measure_footnotes', COUNT(*) FROM public.measure_footnotes;
```

Rangos esperados (orden de magnitud, varían ±5 % mes a mes):
- `taric_measures` ~136 K
- `measure_conditions` ~29 K
- `measure_exclusions` ~29 K
- `measure_footnotes` ~122 K

Si alguna se desvía >20 %, posible carga parcial — re-ejecutar el bloque correspondiente.

## Rollback

Si tras la carga se detecta un error grave (números inverosímiles, errores de RLS, etc.):

1. Identificar el `run_id` de la run defectuosa:
   ```sql
   SELECT id FROM public.taric_update_runs WHERE data_month = 'YYYY-MM' ORDER BY run_date DESC LIMIT 1;
   ```
2. Borrar la run (la `FK ON DELETE CASCADE` arrastra todos los `taric_changes` con ese `run_id`):
   ```sql
   DELETE FROM public.taric_update_runs WHERE id = '<uuid>';
   ```
3. Para revertir los Blocks 1/2/3, hace falta restaurar desde un dump previo — los `loadBlock*` hacen overwrite, no append. **Procedimiento recomendado: crear snapshot de Supabase antes del Paso 3** (vía dashboard → Database → Backups).

## Notas operativas

- **Frecuencia**: una vez al mes, idealmente en los primeros días tras la publicación CIRCABC del nuevo snapshot.
- **Duración estimada**: 5–15 minutos para los tres `loadBlock` en serie (depende de la latencia con Supabase y del tamaño del Excel).
- **No automatizado**: hoy no hay cron. Si se quiere automatizar en el futuro, ver "Análisis ETL TARIC" en `BACKLOG_PRIVACIDAD.md` (Tanda 6).
- **Política de purga**: `taric_changes` crece linealmente. A partir de ~24 meses (~430 K filas) considerar purga selectiva por `data_month`. **Crítico**: NO usar `DELETE FROM taric_update_runs` para purgar — la cascada perdería el run completo. Borrar directamente sobre `taric_changes` filtrando por `data_month` antiguo.
