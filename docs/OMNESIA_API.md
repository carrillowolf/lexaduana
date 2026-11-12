# API TARIC de Omnesia — mapa de referencia

**Fuente prioritaria para cualquier dato TARIC** (aranceles, medidas, condiciones, suspensiones, nomenclatura, áreas geográficas, tipos de cambio). Consultar la API antes que las tablas TARIC de Supabase, los Excel de CIRCABC o cualquier otro documento.

- **Base URL:** `https://api-pre.omnesia.tech/taric/v1` (preproducción; confirmar dominio de producción con Omnesia)
- **Autenticación:** cabecera `x-api-key: $OMNESIA_API_KEY`. Nunca escribir la clave en el repo (es público).
- **OpenAPI vivo:** `GET /openapi.json` (con la misma cabecera). Si algo de este documento no cuadra, manda el OpenAPI.
- **Formato:** todas las respuestas son `{"data": ..., "total": n}`. `total` puede venir `null` (p. ej. `duties-import`).
- **Paginación:** `offset` + `limit`. Máximo `limit=1000`, salvo `duties-import*` (máx. 200, por defecto 32).
- **Fechas:** ISO `YYYY-MM-DD`. Fin abierto = `9999-12-31` (CIRCABC lo deja vacío).
- **Códigos de mercancía:** 10 dígitos en medidas (`8712003000`); 12 en nomenclatura y declarables (10 + sufijo de línea, `871200300080`; `80` = línea declarable).
- **Orígenes:** ISO alfa-2 (`CN`) o código de zona TARIC (`1011` = ERGA OMNES, `5500` = Mercosur, …).

```bash
curl -H "x-api-key: $OMNESIA_API_KEY" "https://api-pre.omnesia.tech/taric/v1/health"
```

## Versión TARIC

Casi todos los endpoints TARIC piden o aceptan `taric_version` (`YYYYMM`, p. ej. `202611`). Obtener la última:

```
GET /sync-logs?limit=1          → data[0].taric_version
GET /sync-logs?taric_version=202611   → filas cargadas por componente (para contrastar descargas)
```

Componentes de sync: `TaricNomenclatureSync`, `TaricDeclarableGoodsSync`, `TaricDutiesImportSync`, `TaricDutiesImportParsedSync`, `TaricDutiesExportSync`, `TaricMeasuresSync`, `TaricCctExchangeRatesSync`, `TaricLegalBaseSync`, `TaricGeographicalAreasSync`, `TaricBox44CertificateSync`, `TaricAdditionalCodesDescriptionsSync`.

## ¿Qué endpoint uso?

| Necesito… | Endpoint |
|---|---|
| Todo lo que aplica a un código + origen (arancel, preferencias, antidumping, suspensiones, controles) | `GET /duties-import/applicable` |
| …solo lo vigente en una fecha de admisión | mismo, con `reference_date=YYYY-MM-DD` |
| Documentos/certificados exigidos (casilla 44) y qué pasa si no se presentan | `GET /measure-conditions/applicable/grouped` |
| Suspensiones arancelarias | `GET /duties-import` con `measure_type_code=112/115/117/119/141` |
| Tipo de cambio para valor en aduana (BCE, art. 146) | `GET /customs-exchange-rates` |
| Buscar un código por texto o prefijo | `GET /nomenclature/search` |
| Validar un código / árbol arancelario | `GET /nomenclature/validate`, `GET /nomenclature/hierarchy` |
| Qué países forman una zona (o en qué zonas está un país) | `GET /geographical-area-compositions` |
| Descripción de un certificado, código adicional, base legal | `box44-certificates`, `additional-codes-descriptions`, `legal-bases` |

## Endpoints

### Medidas de importación

**`GET /duties-import/applicable`** — la consulta principal. Resuelve la jerarquía del código (capítulo, partida… hasta 10 dígitos) y la pertenencia del origen a zonas (SPG, ERGA OMNES, acuerdos).
- Obligatorios: `taric_version`, `goods_code`, `origin_code`.
- Opcionales: `reference_date` (solo medidas y exclusiones vigentes ese día), `measure_type_prefix` (`1` aranceles, `2` prohibiciones, `4` sanitarios, `5` antidumping, `6` derechos adicionales, `7` controles de importación), `structured=true` (añade `duty_structured`), `offset`, `limit` (≤200).
- Campos: `id, taric_version, goods_code, add_code, order_number, start_date, end_date, origin, origin_code, measure_type, measure_type_code, legal_base, duty, duty_structured`.
- Sin `reference_date` devuelve también medidas futuras o ya caducadas: filtrar por fecha si no se pasa.

**`GET /duties-import`** — listado plano, filtros combinables (AND): `taric_version`*, `goods_code` (exacto, 10 dígitos), `origin_code` (exacto), `measure_type_code`, `measure_type_prefix`, `structured`.
- Ordena solo por `goods_code`; el orden entre filas del mismo código **no es estable** entre peticiones. Para descargas masivas ver `scripts/fetchOmnesia.js` (re-pide los códigos que caen en un corte de página).

**`duty_structured`** (con `structured=true`): `advalorem {rate, unit}`, `specific[] {amount, unit, bound, qualifier}`, `agricultural[]`, `conditions[] {certificate, condition_code, duty_code, condition_amount, condition_unit, result_duty, …}`, `entry_price_bands`, `unparsed`, `components[]` (lista plana con `parser_type`: `ad_valorem`, `unit_code_only`, …).

**Tipos de medida frecuentes** (`measure_type_code`):
- `103` derecho de terceros países · `105` derecho no preferencial con fin de uso · `106` derecho de la Unión Aduanera
- `142` preferencia arancelaria · `143` contingente preferencial · `145` preferencia con fin de uso · `146` contingente preferencial con fin de uso · `122/123` contingente no preferencial (sin / con fin de uso)
- **Suspensiones:** `112` suspensión arancelaria autónoma · `115` suspensión autónoma con fin de uso · `117` suspensión para buques y plataformas · `119` suspensión por aeronavegabilidad · `141` suspensión preferencial
- `551/552` antidumping provisional/definitivo · `553/554` antisubvención provisional/definitivo · `555` pendiente de cobro · `570` control antidumping · `695/696` derechos adicionales
- `107` derecho de envíos de bajo valor · `800` tasa de gestión de la Unión · `109/110` unidad suplementaria
- `4xx` controles (`410` veterinario…) · `7xx` controles de importación (`724` gases fluorados, `750` productos ecológicos…) · `775` CBAM · `277` prohibición de importación · `705` prohibición (bienes de tortura y represión)

### Condiciones (casilla 44)

**`GET /measure-conditions/applicable/grouped`** — recomendada. Misma resolución que `duties-import/applicable`. Cada elemento es una regla con sus ramas:
- `goods_code, goods_code_level` (2 capítulo · 4 partida · 6 SA · 8 NC · 10 TARIC), `origin_code, measure_type_code, order_no, add_code, start_date, end_date, measure_condition`
- `branches[] {sequence, certificate, certificate_description, certificate_description_language, measure_action, condition_amount, mon_unit, measure_unit, measure_unit_qual}`. La rama sin certificado indica qué ocurre si **no** se presenta el documento.
- Obligatorios: `taric_version`, `goods_code`, `origin_code`.

**`GET /measure-conditions/applicable`** — igual pero filas sueltas. **`GET /measure-conditions`** — listado plano por `taric_version`, `goods_code`, `certificate` (coincidencia exacta, no resuelve jerarquía ni zonas).

### Exclusiones y notas

- **`GET /measure-exclusions`** — `taric_version`, `goods_code`, `excluded_country_code`. Campos: `goods_code, add_code, order_no, start_date, end_date, origin, origin_code, measure_type, measure_type_code, excluded_country_code, excluded_country`.
- **`GET /measure-footnotes`** — `taric_version`, `goods_code`, `footnote`. Campo `footnote` (p. ej. `CD808`). Omnesia **no** tiene descripciones de notas al pie.

### Exportación

**`GET /duties-export`** — `goods_code`, `measure_type_code`. Campos como importación pero con `destination, destination_code`. Sin filtro de versión.

### Tipos de cambio

**`GET /customs-exchange-rates?month=YYYY-MM&currency=USD`** — tipo **art. 146 Reglamento (UE) 2015/2447** para el valor en aduana: tipo de referencia del **BCE** del penúltimo miércoles del mes anterior. Respuesta: `applies_month, currency, units_per_euro, ecb_publication_date, source_series`. Conversión: `euros = importe / units_per_euro`. Incluye USD y CNY.

**`GET /cct-exchange-rates`** — tipos CCT de TARIC (`currency_code`, `taric_version`). **No** sirven para valor en aduana (no tienen USD ni CNY). Campos: `mon_unit_cod, mon_unit_cod_1, dat_start, dat_end, exch_rate`.

### Nomenclatura

- **`GET /nomenclature/search?q=…&lang=es`** — `q` con dígitos = prefijo de código; con texto = búsqueda por descripción (trigramas). Devuelve `goods_code` (12), `description, language, indent, source_version`. El índice puede ir una versión por detrás (`source_version`).
- **`GET /nomenclature/hierarchy?goods_code=…&lang=es`** — antepasados, el código y descendientes, a cualquier nivel (2/4/6/8/10). Sin `lang` devuelve ~24 idiomas. Sin filtro de versión repite filas por versión: filtrar por `taric_version` en cliente.
- **`GET /nomenclature/validate?goods_code=…`** — rellena a 10 dígitos y prueba sufijos (`80` primero). Devuelve `goods_code` (12), `original_input`, `adapted` (true si solo existe como línea intermedia).
- **`GET /nomenclature`** — listado por `goods_code` exacto (12) y `taric_version`. En 202610 solo trae `de`, `en`, `fr`.
- **`GET /declarable-goods`** (`goods_code` de 12) y **`/declarable-goods/composite`** (`taric_version`, `goods_code`, `start_date`) — sin marca de hoja ni fecha de declaración.

### Áreas geográficas

- **`GET /geographical-area-compositions`** — `area_code`, `member_country_code`, `language`. Campos: `area_code, member_country_code, start_date, end_date, group_abbreviation, group_description, member_abbreviation, member_description, membership_start_date, membership_end_date, taric_version`. Sin filtro de versión: filtrar en cliente.
- **`GET /geographical-area-descriptions`** — `area_code`, `language`. Campos: `area_code, abbreviation, description, start_date, description_start_date, end_date`.

### Tablas de referencia

- **`GET /box44-certificates`** — `certificate_code`, `language` (22 idiomas si se omite).
- **`GET /additional-codes-descriptions`** — `taric_version`, `add_code`, `language`.
- **`GET /legal-bases`** — `legal_base` (p. ej. `Regulation 2146/25`). Campos: `publication_date, official_journal, page`. Sin filtro de versión.
- **`GET /countries`** (`region`), `/countries/{id}`, `/countries/alpha2/{code}`, `/countries/alpha3/{code}` — ISO 3166: `name, alpha2, alpha3, numeric, region, subregion, official_name`.
- **`GET /currencies`**, `/currencies/{id}`, `/currencies/code/{code}` — ISO 4217: `code, numeric, name, minor_unit`.

### Operación

- **`GET /health`** — no depende de la base de datos.
- **`GET /sync-logs`**, `/sync-logs/{id}` — ver «Versión TARIC».

## Rendimiento

- `duties-import` con `offset` alto tarda 5–8 s por página; una descarga completa (~146 K filas) lleva ~12 min. Consultas filtradas por código (`applicable`, `goods_code=`) responden en <1 s.
- Para consultas puntuales usar siempre los endpoints `applicable`, no descargar tablas.
- Desde Node detrás de proxy: `NODE_USE_ENV_PROXY=1`.
