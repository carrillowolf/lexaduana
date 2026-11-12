# LexAduana — Notas para Claude Code

## Fuente de datos TARIC: API de Omnesia (prioritaria)

Para cualquier consulta de datos TARIC (aranceles, medidas aplicables a un
código y origen, suspensiones, antidumping, condiciones y certificados de la
casilla 44, nomenclatura, zonas geográficas, tipos de cambio BCE del art. 146)
usar **siempre primero la API de Omnesia**. No consultar las tablas TARIC de
Supabase ni los Excel de CIRCABC para responder dudas de datos; solo se tocan
para la carga mensual (ver más abajo) o si el usuario lo pide.

- Mapa completo de endpoints, parámetros y campos: `docs/OMNESIA_API.md`.
- Base: `https://api-pre.omnesia.tech/taric/v1`. En sesiones cloud el proxy añade la cabecera `x-api-key` sola (secreto de red del entorno); los scripts que piden `OMNESIA_API_KEY` aceptan `proxy-injected`.
- Tipo de cambio del BCE para valor en aduana (art. 146): `GET /customs-exchange-rates?month=YYYY-MM&currency=USD`, `euros = importe / units_per_euro`.
- Última versión TARIC: `GET /sync-logs?limit=1`.
- Consulta típica: `GET /duties-import/applicable?taric_version=…&goods_code=…&origin_code=…&reference_date=YYYY-MM-DD`.
- No escribir la clave en el repositorio (es público).

## Actualización mensual de datos TARIC

Cada mes, cuando lleguen los nuevos Excel de CIRCABC/EUR-Lex, ejecutar en este orden:

```bash
# 1. El usuario deja los 14 Excel en data/nuevo-mes/

# 2. Detectar cambios ANTES de cargar datos nuevos (dry-run primero)
node scripts/detectChanges.js --month=YYYY-MM --dry-run
node scripts/detectChanges.js --month=YYYY-MM

# 3. Cargar los datos nuevos
node scripts/loadBlock1.js
node scripts/loadBlock2.js
node scripts/loadBlock3.js
```

### Archivos necesarios de CIRCABC (14 Excel)

**Block 2 (requeridos para detectChanges):**
- Duties Import 01-99.xlsx
- Measure conditions.xlsx
- Measure exclusions.xlsx
- Measure footnotes.xlsx

**Block 1 (master data):**
- Geographical areas composition.xlsx / description.xlsx
- Nomenclature EN.xlsx, Declarable codes.xlsx, Box 44 codes of the SAD.xlsx

**Block 3 (lookup tables):**
- Footnotes descriptions.xlsx, Additional codes descriptions.xlsx
- CCT Exchange rates.xlsx, Legal basis.xlsx

### Orden importante

detectChanges compara Excel nuevo vs datos actuales en Supabase,
así que debe ejecutarse ANTES de que loadBlock sobreescriba los datos.

Los cambios detectados se muestran en `/cambios` automáticamente.

### Fuente de descarga CIRCABC

Los Excel se descargan de:
https://circabc.europa.eu/ui/group/0e5f18c2-4b2f-42e9-aed4-dfe50ae1263b/library/566dd333-1deb-4235-982a-4fdeaf3657c1

---

## Pull Requests — auto-suscripción

Tras crear un PR con `mcp__github__create_pull_request`, suscríbete siempre
inmediatamente con `mcp__github__subscribe_pr_activity` al mismo PR — sin
preguntar. Así se reciben eventos de CI y review comments durante toda la
sesión y puedo reaccionar (fix pequeño, pregunta si es ambiguo, skip si no
aplica) sin tener que pedirme que active el watcher cada vez.

## Tipos de cambio de la web (BOE)

`current_exchange_rates` / `upcoming_exchange_rates` (página `/tipos-cambio` y
banner) usan los cambios del euro del BCE del penúltimo miércoles del mes
anterior, publicados por el Banco de España en el BOE. No confundir con
`exchange_rates` (tipos CCT del TARIC, se cargan con loadBlock3).

```bash
node scripts/updateRatesFromBoe.js --current=BOE-A-... --upcoming=BOE-A-... --dry-run
node scripts/updateRatesFromBoe.js --current=BOE-A-... --upcoming=BOE-A-...
```
