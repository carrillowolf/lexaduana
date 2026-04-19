# CBAM - Contexto del Proyecto LexAduana

> Documento de contexto para proyectos de Claude. Contiene la arquitectura, reglas de negocio, modelo de datos y legislación vigente del módulo CBAM de LexAduana.
> **Última actualización:** Marzo 2026

---

## 1. Qué es el CBAM

El **Carbon Border Adjustment Mechanism** (Mecanismo de Ajuste en Frontera por Carbono) es un instrumento de la UE que iguala el precio del carbono entre productos europeos y productos importados. Entró en vigor de forma definitiva el **1 de enero de 2026**.

**Fórmula de coste:**
```
Coste CBAM = Toneladas × (Emisiones_declaradas - Benchmark_UE) × Precio_CO₂
```
- Solo se cobra por las emisiones que **exceden** el benchmark UE (top 10% de instalaciones más eficientes)
- Si las emisiones son menores al benchmark, el coste es 0

---

## 2. Arquitectura del Módulo

### Stack tecnológico
- **Framework:** Next.js (App Router)
- **Base de datos:** Supabase (PostgreSQL con RLS)
- **UI:** Tailwind CSS
- **Exportación:** xlsx (librería XLSX)
- **Idioma principal:** Español (con soporte EN en plantillas email)

### Patrón de datos: Supabase + Fallback
Todas las funciones del servicio (`cbamService.js`) siguen el patrón:
1. Consultar Supabase
2. Si falla → usar datos hardcoded de `cbamData.js`
3. Esto permite que la app funcione sin conexión a BD

### Estructura de archivos

```
app/
├── cbam/
│   ├── page.js              # Hub principal CBAM (server component)
│   ├── guia/page.js         # Guía educativa "CBAM for Dummies"
│   └── historial/page.js    # Historial de cálculos del usuario + export Excel
├── admin/cbam/page.js       # Panel admin (precios, códigos, benchmarks, timeline)
├── api/cbam/
│   ├── calculations/route.js  # GET: historial | POST: guardar cálculo
│   └── ets-price/route.js     # GET: precio actual | POST: actualizar (admin)

components/
├── CBAMCostSimulator.js     # Calculadora interactiva de coste CBAM
├── CBAMVerifier.js          # Verificador de código CN (¿está afectado?)
├── CBAMAlert.js             # Badges/alertas (CBAMBadge, CBAMAlert, CBAMAlertCompact, CBAMIndicator, CBAMInfoBanner)
├── CBAMEmailTemplate.js     # Generador de email para solicitar datos a proveedores (ES/EN)
└── cbam/CBAMVerifier.js     # Copia organizada en subdirectorio

lib/
├── cbamData.js              # Datos hardcoded + funciones helper (constantes, checkCBAM, calculateCBAMCost)
├── cbamService.js           # Capa de servicio Supabase con fallback a cbamData.js
└── cbamExcelExporter.js     # Exportación a Excel (3 hojas: Resumen, Detalle, Análisis)

scripts/
├── cbam-schema.sql          # Schema completo de Supabase (12 tablas)
└── seedCBAMData.js          # Script de migración de datos hardcoded a Supabase
```

---

## 3. Sectores CBAM (6)

| Sector | ID | Gases | Emisiones | De Minimis |
|--------|----|-------|-----------|------------|
| Cemento | `cement` | CO2 | directas + indirectas | Sí |
| Electricidad | `electricity` | CO2 | directas | **No** |
| Fertilizantes | `fertilizers` | CO2, N2O | directas + indirectas | Sí |
| Hidrógeno | `hydrogen` | CO2 | directas + indirectas | **No** |
| Hierro y Acero | `ironSteel` | CO2 | solo directas | Sí |
| Aluminio | `aluminium` | CO2, PFC | solo directas | Sí |

---

## 4. Códigos CN Afectados (~80 códigos base)

### Cemento
- `2507008` - Arcillas caolínicas
- `25231000` - Clínker
- `25232100`, `25232900` - Cemento Portland
- `25233000` - Cementos aluminosos
- `25239000` - Otros cementos hidráulicos

### Electricidad
- `27160000` - Energía eléctrica

### Fertilizantes
- `28080000` - Ácido nítrico
- `2814` (capítulo) - Amoniaco
- `28342100` - Nitratos de potasio
- `3102` (capítulo) - Abonos nitrogenados
- `3105` (capítulo, excluye `31056000`) - Abonos N/P/K

### Hidrógeno
- `28041000` - Hidrógeno

### Hierro y Acero
- `26011200` - Minerales de hierro aglomerados
- `72` (capítulo) - Fundición, hierro y acero (con exclusiones: ferroaleaciones `720221-72029980`, chatarra `7204`)
- `7301-7311` - Manufacturas (tablestacas, vías férreas, tubos, perfiles, depósitos, recipientes gas)
- `7318` - Tornillería
- `7326` - Otras manufacturas

### Aluminio
- `7601-7616` (capítulos) - Aluminio en bruto, polvo, barras, alambre, chapas, hojas, tubos, accesorios, construcciones, depósitos, recipientes, cables, manufacturas

**Nota:** Los códigos con `isChapter: true` capturan todas las subpartidas. Algunos tienen arrays `exclude` para excluir subpartidas específicas.

---

## 5. Valores por Defecto de Emisiones (tCO₂/t)

| Sector | Producto | Factor |
|--------|----------|--------|
| Cemento | Clínker | 0.951 |
| Cemento | Portland | 0.693 |
| Cemento | Aluminoso | 1.124 |
| Hierro/Acero | Arrabio | 1.600 |
| Hierro/Acero | Acero bruto | 1.080 |
| Hierro/Acero | Productos | 1.210 |
| Aluminio | En bruto | 6.600 |
| Aluminio | Productos | 7.100 |
| Fertilizantes | Amoniaco | 2.126 |
| Fertilizantes | Ácido nítrico | 2.840 |
| Fertilizantes | Urea | 1.570 |
| Hidrógeno | Hidrógeno | 9.000 |

---

## 6. Benchmarks UE (Top 10% Eficiencia)

### Cemento
| Producto | Benchmark | Nota |
|----------|-----------|------|
| Clínker gris | 0.666 | Default del sector |
| Clínker blanco | 0.859 | |
| Aluminoso (2026-2027) | 0.717 | |
| Aluminoso (2028-2030) | 0.686 | |

### Hierro y Acero
| Producto | Benchmark | |
|----------|-----------|--|
| Carbono BF/BOF | 1.420 | Alto horno |
| Carbono DRI/EAF | 0.746 | Reducción directa |
| Carbono Scrap/EAF | 0.266 | Chatarra |
| Baja aleación BF/BOF | 1.490 | |
| Baja aleación DRI/EAF | 0.783 | |
| Baja aleación Scrap/EAF | 0.279 | |
| Alta aleación EAF | 0.352 | |
| Inoxidable | 1.010 | |
| **Default sector** | **0.850** | Promedio ponderado |

### Aluminio
| Producto | Benchmark | |
|----------|-----------|--|
| Primario (electrolisis) | 2.090 | |
| Secundario (reciclado) | 0.289 | |
| **Default sector** | **1.500** | |

### Fertilizantes
| Producto | Benchmark | |
|----------|-----------|--|
| Amoniaco anhidro | 1.522 | |
| Amoniaco acuoso | 0.457 | |
| Ácido nítrico | 0.582 | |
| Urea solución | 0.304 | |
| Nitrato potasio | 0.626 | |
| **Default sector** | **0.600** | |

### Hidrógeno
| Producto | Benchmark |
|----------|-----------|
| Hidrógeno | 5.089 |

### Electricidad
- **Sin benchmark fijo** — se usa el factor de emisión de red del país exportador

---

## 7. Markup sobre Valores por Defecto

Penalización progresiva si el importador **no presenta emisiones reales verificadas** (usa valores por defecto):

| Año | Markup | Base legal |
|-----|--------|------------|
| 2026 | +10% | C(2025) 8552 |
| 2027 | +20% | C(2025) 8552 |
| 2028+ | +30% (permanente) | C(2025) 8552 |

**Excepción:** Productos downstream complejos pueden usar valores por defecto SIN markup (dificultad técnica de rastreo).

**Ejemplo:** Acero bruto (1.080 tCO₂/t)
- 2026: 1.188 (+10%)
- 2027: 1.296 (+20%)
- 2028: 1.404 (+30%)

---

## 8. Certificados CBAM (Declaración Aduanera)

| Código | Descripción | Obligatorio | Condición |
|--------|-------------|-------------|-----------|
| Y128 | Número de cuenta del declarante autorizado | **Sí** | Y001 |
| Y134 | Exención: Büsingen, Heligoland, Livigno | No | Y003 |
| Y135 | Exención: Uso militar | No | Y005 |
| Y136 | Exención: Electricidad/H₂ de ZEE UE | No | Y007 |
| Y137 | Exención de minimis (<50t/año) | No | Y007/E15 |
| Y237 | Mercancías de origen UE | No | Y009 |
| Y238 | Solicitud declarante antes 31/03/2026 | No | Y011 (caduca 27/09/2026) |

---

## 9. Países Excluidos del CBAM (7)

| Código | País | Razón |
|--------|------|-------|
| IS | Islandia | EEE con EU ETS |
| LI | Liechtenstein | EEE con EU ETS |
| NO | Noruega | EEE con EU ETS |
| CH | Suiza | Acuerdo vinculado EU ETS |
| XB | Büsingen | Territorio especial UE |
| XH | Heligoland | Territorio especial UE |
| XL | Livigno | Territorio especial UE |

---

## 10. Umbral De Minimis

- **Masa:** < 50 toneladas/año de mercancías CBAM
- **Emisiones target:** 99% de emisiones cubiertas
- **Aplica a:** cement, fertilizers, ironSteel, aluminium
- **NO aplica a:** electricity, hydrogen
- **Base legal:** Reglamento (UE) 2025/2083

---

## 11. Precios de Certificados CBAM

### Metodología (C(2025) 8560)
- **2026:** Precio **trimestral** — media ponderada de subastas EU ETS del trimestre anterior (4 precios/año)
- **2027+:** Precio **semanal** — media ponderada semanal (52 precios/año)
- **Unidad:** EUR/tCO₂e (2 decimales)
- **Fuente:** Subastas EU ETS (EEX, ICE)
- **Precio referencia 2024:** ~65.50 EUR/tCO₂e
- **Fallback en app:** 68.50 EUR (hardcoded)

---

## 12. Timeline CBAM (Fechas Clave)

| Fecha | Evento | Tipo |
|-------|--------|------|
| 2026-01-01 | **CBAM Definitivo** — Inicio obligación compra certificados | critical |
| 2026-03-31 | Límite solicitud declarante autorizado | critical |
| 2026-05-31 | Informe Q1 2026 | deadline |
| 2026-07-31 | Informe Q2 2026 | deadline |
| 2026-10-31 | Informe Q3 2026 | deadline |
| 2027-01-01 | Precio semanal certificados (antes trimestral) | milestone |
| 2027-01-31 | Informe Q4 2026 | deadline |
| 2027-05-31 | **Declaración Anual CBAM 2026** | critical |
| 2027-09-30 | **Primera entrega de certificados** | critical |
| 2028-01-01 | **Extensión downstream** (~180 nuevos códigos CN) | milestone |
| 2034-01-01 | **100% cobertura** — fin del phase-in | milestone |

### Phase-in de Free Allocation Adjustment (FAA)
- 2026: 2.5% de obligación CBAM
- 2027-2034: incremento gradual
- 2034: 100% CBAM, 0% asignación gratuita EU ETS

---

## 13. Extensión Downstream (2028)

**Estado:** Propuesta — COM(2025) 989

- **Fecha efectiva:** 2028-01-01
- **~180 nuevos códigos CN**
- **~7,500 nuevos importadores** (~3,850 PYMES)

### Sectores incluidos
- Productos derivados de **Hierro y Acero** (estructuras, depósitos, tornillería, etc.)
- Productos derivados de **Aluminio** (laminados, estructuras, recipientes, etc.)
- Productos **metálicos combinados** (acero + aluminio)

### NO incluidos en downstream
- Productos downstream de cemento
- Productos downstream de fertilizantes
- Productos downstream de hidrógeno

### Criterios de selección
1. Intensidad comercial (proxy de comerciabilidad)
2. Impacto de costes de carbono vs valor añadido
3. Umbral mínimo de emisiones incorporadas

---

## 14. Medidas Anti-Elusión (Dic 2025)

Base legal: COM(2025) 989

1. **Chatarra pre-consumo como precursor** — La chatarra generada antes del consumo final cuenta como precursor CBAM (evita "lavado de emisiones")
2. **Prueba de ubicación de producción** — La Comisión puede exigir prueba del lugar de producción para combinaciones CN/origen de alto riesgo
3. **Condiciones adicionales para emisiones reales** — En casos sospechosos, condiciones extra para aceptar emisiones declaradas (vía actos delegados)

---

## 15. Reglas de Electricidad (Dic 2025)

| Cambio | Antes | Ahora | Impacto |
|--------|-------|-------|---------|
| Factor de emisión | Solo fósiles | Red promedio (incl. renovables) | Mejor reflejo de descarbonización real |
| PPAs | Solo directos | Indirectos aceptados | Mayor flexibilidad para demostrar origen renovable |
| Congestión de red | Requerido demostrar | Criterio eliminado | Simplificación |

---

## 16. Esquema de Base de Datos (Supabase)

### 12 Tablas

```sql
-- 1. cbam_sectors
-- Campos: id (PK), name, name_en, icon, color, gases[], emissions_type,
--         description, de_minimis_applies, is_active, sort_order

-- 2. cbam_cn_codes
-- Campos: id (serial), cn_code, sector_id (FK), description, gas,
--         is_chapter, excluded_codes[], is_downstream,
--         effective_from, effective_to, regulation_ref
-- Índices: cn_code, sector_id, (effective_from, effective_to)

-- 3. cbam_emission_factors
-- Campos: id, sector_id (FK), product_key, product_name, product_name_en,
--         factor_value (NUMERIC 10,4), unit, applicable_cn_codes[],
--         regulation_ref, effective_from, effective_to

-- 4. cbam_benchmarks
-- Campos: id, sector_id (FK), benchmark_key, description, value (NUMERIC 10,4),
--         unit, is_default, year_from, year_to, regulation_ref

-- 5. cbam_excluded_countries
-- Campos: id, country_code (UNIQUE), country_name, reason, exclusion_type,
--         effective_from, effective_to

-- 6. cbam_certificates
-- Campos: code (PK), description, is_required, condition_code,
--         applies_to_sectors[], not_applies_to_sectors[], valid_until, sort_order

-- 7. cbam_timeline
-- Campos: id, event_date, title, description, event_type, quarter_label,
--         icon, is_new, sort_order

-- 8. cbam_ets_prices
-- Campos: id, price (NUMERIC 10,2), price_date, price_type, source, is_current
-- Índice: is_current WHERE true
-- UNIQUE: (price_date, price_type, source)

-- 9. cbam_default_value_markup
-- Campos: id, year (UNIQUE), markup_pct (NUMERIC 5,2), label, description,
--         regulation_ref

-- 10. cbam_regulations
-- Campos: id, reference (UNIQUE), title, regulation_type, status,
--          publication_date, effective_date, summary, url

-- 11. cbam_config (key-value genérico)
-- Campos: key (PK), value (JSONB), description, updated_at, updated_by (FK auth.users)

-- 12. cbam_calculator_saves (historial multi-producto de la calculadora CBAM, con RLS por usuario)
-- Reemplaza a la antigua cbam_user_calculations (single-product-per-row),
-- eliminada en Día 5 (Pieza 4). Estructura multi-producto con líneas
-- embebidas en JSON; consumida por /api/cbam/calculator/*.
```

### Seguridad (RLS)
- Todas las tablas tienen **Row Level Security habilitado**
- Tablas de referencia: **lectura pública** (SELECT para todos)
- `cbam_calculator_saves`: **solo datos propios** (`auth.uid() = user_id`)

---

## 17. Funciones Clave del Código

### `checkCBAM(hsCode, countryCode?)` — cbamData.js
Verifica si un código HS está afectado por CBAM.
- Normaliza el código (solo dígitos)
- Verifica exclusión por país
- Recorre `CBAM_CODES` comparando con `startsWith` (capítulos) o coincidencia exacta
- Respeta exclusiones dentro de capítulos (`exclude[]`)
- Retorna: `{ affected, code, sector, description, gas, sectorId, deMinimisApplies }`

### `calculateCBAMCost(tonnes, emissions, co2Price, sectorId)` — cbamData.js
Calcula el coste CBAM con desglose paso a paso.
- Obtiene benchmark del sector
- `emissionsSubjectToCBAM = max(0, emissions - benchmark)`
- `totalEmissions = tonnes × emissionsSubjectToCBAM`
- `totalCost = totalEmissions × co2Price`
- Retorna: inputs, cálculos, breakdown (5 pasos), info (benchmark explanation, savings)

### `calculateCBAMCostDB(...)` — cbamService.js
Versión con datos de Supabase. Misma lógica, obtiene benchmark de BD.

### `applyDefaultValueMarkup(defaultValue, year)` — cbamData.js
Aplica el markup progresivo al valor por defecto según el año.
- Retorna: `{ original, markup, adjusted, difference }`

### Servicio completo (cbamService.js) — Funciones exportadas:
- `getCurrentETSPrice()` — Precio actual EU ETS
- `getETSPriceHistory(limit)` — Historial de precios
- `getSectors()` — Sectores activos
- `getCBAMCodes(includeDownstream)` — Códigos CN (con filtro de fechas efectivas)
- `getExcludedCountries()` — Países excluidos
- `getEmissionFactors()` — Factores agrupados por sector
- `getBenchmarkDB(sectorId, year)` — Benchmark de BD
- `getBenchmarksBySector(sectorId)` — Todos los benchmarks de un sector
- `getTimeline()` — Eventos del timeline
- `getNextDeadlineDB()` — Próximo deadline con `daysLeft` e `isUrgent`
- `getCertificates()` — Certificados CBAM
- `getDefaultValueMarkupDB(year)` — Markup del año
- `getDefaultValueMarkupSchedule()` — Calendario completo
- `getDownstreamExtension()` — Config downstream 2028
- `getThreshold()` — Umbral de minimis
- `getCBAMConfig(key)` — Config genérica
- `getRegulations()` — Reglamentos
- `updateETSPrice(price, date, source)` — Actualizar precio (admin)

---

## 18. Estructuras de Datos Principales

### Historial de cálculos
Las escrituras desde el frontend de la calculadora CBAM usan
`/api/cbam/calculator/saves` (multi-producto, formato JSON por línea).
El endpoint y tabla legacy `cbam_user_calculations` se eliminó en Día 5.

### Resultado de checkCBAM
```javascript
{
  affected: boolean,
  code: string,           // Código CN base que matcheó
  sector: {
    id: string,
    name: string,         // Nombre en español
    nameEn: string,
    icon: string,
    color: string,        // Clase Tailwind gradient
    gases: string[],
    emissions: string,    // 'directas' | 'directas + indirectas' | 'solo directas'
    deMinimisApplies: boolean
  },
  description: string,    // Descripción del código
  gas: string,
  sectorId: string,
  deMinimisApplies: boolean
}
```

### Resultado de calculateCBAMCost
```javascript
{
  tonnes: number,
  emissionsPerTonne: number,
  co2Price: number,
  benchmark: number,
  emissionsSubjectToCBAM: number,  // max(0, emissions - benchmark)
  totalEmissions: number,
  totalCost: number,
  breakdown: {
    step1: string,  // Emisiones declaradas
    step2: string,  // Benchmark UE
    step3: string,  // Emisiones sujetas
    step4: string,  // Total emisiones
    step5: string   // Coste final
  },
  info: {
    benchmarkExplanation: string,
    savingsVsFullEmissions: string
  }
}
```

---

## 19. Componentes UI

### CBAMCostSimulator.js
Calculadora interactiva completa:
- Selector de sector y producto con factores de emisión por defecto
- Toggle entre emisiones reales y valores por defecto (con markup)
- Visualización del phase-in (2026-2034)
- Input de precio CO₂ (trimestral o manual)
- Guarda cálculos en historial del usuario (Supabase)

### CBAMVerifier.js
Verificador de código CN:
- Input de código HS/CN
- Muestra si está afectado, sector, tipo de emisiones, de minimis
- Timeline de obligaciones

### CBAMAlert.js (5 variantes)
- `CBAMBadge` — Badge inline pequeño
- `CBAMAlert` — Alerta completa con sector, obligaciones y links
- `CBAMAlertCompact` — Compacta para listas
- `CBAMIndicator` — Círculo para tablas bulk
- `CBAMInfoBanner` — Banner full-width

### CBAMEmailTemplate.js
Generador de email para solicitar datos de emisiones a proveedores:
- Bilingüe (ES/EN)
- Campos: nombre proveedor, producto, empresa
- Incluye: datos instalación, emisiones, documentación soporte
- Copia al portapapeles

### Exportación Excel (cbamExcelExporter.js)
Genera archivo `CBAM_LexAduana_YYYY-MM-DD.xlsx` con 3 hojas:
1. **Resumen CBAM** — Totales, distribución por sector
2. **Detalle Cálculos** — Línea por línea con totales
3. **Análisis Emisiones** — Real vs defecto, recomendaciones, calendario markup

---

## 20. API Routes

### /api/cbam/calculator/saves
- Historial de cálculos de la calculadora CBAM (multi-producto).
- Reemplaza a `/api/cbam/calculations` + `cbam_user_calculations`
  (eliminados en Día 5, Pieza 4).

### GET /api/cbam/ets-price
- Precio actual EU ETS con historial opcional (`?history=true`, 30 registros)
- Cache: 1 hora

### POST /api/cbam/ets-price
- Solo admin (verifica email en ADMIN_EMAILS)
- Actualiza precio: desmarca `is_current` anterior, inserta nuevo como `is_current`

---

## 21. Legislación Aplicable (PDFs Descargados)

Los siguientes reglamentos están disponibles en `docs/cbam-regulations/`:

### Reglamento base
| Reglamento | Descripción | Archivo |
|------------|-------------|---------|
| (UE) 2023/956 | **Reglamento CBAM base** (Anexo I: productos, Anexo III: países) | — |
| (UE) 2023/1773 | Reglas para la **fase transitoria** | `EU_2023_1773_CBAM_transitional_phase.pdf` |

### Paquete definitivo (Oct-Dic 2025)
| Reglamento | Descripción | Archivo |
|------------|-------------|---------|
| (UE) 2025/2210 | Plataforma continental / ZEE | `EU_2025_2210_continental_shelf.pdf` |
| (UE) 2025/2546 | **Principios de verificación** | `EU_2025_2546_verification_principles.pdf` |
| (UE) 2025/2547 | **Métodos de cálculo de emisiones** | `EU_2025_2547_calculation_methods.pdf` |
| (UE) 2025/2548 | **Precio de certificados CBAM** | `EU_2025_2548_CBAM_certificate_price.pdf` |
| (UE) 2025/2619 | Información comunicada por aduanas | `EU_2025_2619_customs_information.pdf` |
| (UE) 2025/2620 | **Ajuste de asignación gratuita (FAA)** | `EU_2025_2620_free_allocation_adjustment.pdf` |
| (UE) 2025/2621 | **Establecimiento de valores por defecto** (39 MB) | `EU_2025_2621_default_values.pdf` |

### Otros documentos de referencia
| Referencia | Tema |
|------------|------|
| (UE) 2025/2083 | Simplificación CBAM (umbral 50t) |
| C(2025) 8560 | Metodología precios certificados |
| C(2025) 8552 | Markup sobre valores por defecto |
| COM(2025) 989 | Extensión downstream (propuesta) |
| TAXUD.B.5.003/ES | Guía de implementación |

---

## 22. Notas para el Desarrollo

### Convenciones
- IDs de sector en camelCase: `ironSteel`, `aluminium`, no `iron_steel`
- Supabase usa snake_case, el service mapea a camelCase para los componentes
- Precios siempre en EUR con 2 decimales
- Factores de emisión con 3-4 decimales
- Fechas en formato `YYYY-MM-DD`

### Admin
- Email admin: verificado contra `ADMIN_EMAILS` en variables de entorno
- Solo el admin puede actualizar precio EU ETS vía POST

### Importante
- La electricidad **NO tiene benchmark** — usa factor de red del país
- Hidrógeno y electricidad **NO tienen exención de minimis**
- El markup solo aplica a valores por defecto, no a emisiones reales verificadas
- Los códigos downstream (2028) se filtran por `is_downstream` y `effective_from`
- El `phase-in` de FAA es gradual 2026-2034 (2.5% → 100%)
