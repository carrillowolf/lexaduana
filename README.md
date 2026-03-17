# 📊 LexAduana - Suite Profesional de Comercio Exterior

> Plataforma SaaS de herramientas aduaneras para importaciones a España y la Unión Europea: calculadora de aranceles, clasificador IA, verificador CBAM, simulador de costes y más.

[![Versión](https://img.shields.io/badge/versión-5.2.0-blue.svg)](https://lexaduana.es)
[![Estado](https://img.shields.io/badge/estado-producción-brightgreen.svg)](https://lexaduana.es)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-enabled-green.svg)](https://supabase.com)
[![Claude](https://img.shields.io/badge/Claude-4.5-purple.svg)](https://anthropic.com)
[![TARIC](https://img.shields.io/badge/TARIC-Marzo_2026-orange.svg)](https://taxation-customs.ec.europa.eu)

🌐 **En producción:** [lexaduana.es](https://lexaduana.es)

---

## 🎯 Visión

LexAduana evoluciona de calculadora a **suite profesional de comercio exterior**, ofreciendo herramientas especializadas bajo una misma plataforma:

```
lexaduana.es
├── 🧮 Calculadora TARIC        (disponible)
├── 🤖 Clasificador IA          (disponible)
├── ⚖️ Comparador Multi-Origen  (disponible)
├── 📋 Gestor de Despachos      (beta)
├── 🌍 Módulo CBAM              (disponible)
│   ├── Verificador de códigos
│   ├── Simulador de costes
│   └── Alertas en calculadora
├── 📄 Servicio IAV             (próximamente)
└── 🔗 Integraciones AEAT       (en desarrollo)
```

---

## 🆕 Novedades v5.2.0 (Marzo 2026)

### 📊 Migración Completa TARIC — Marzo 2026
Migración total de 14 archivos Excel EUR-Lex oficiales a 14 tablas Supabase:

| Tabla | Registros | Contenido |
|-------|-----------|-----------|
| `taric_measures` | **136,009** | Aranceles, preferencias, anti-dumping |
| `measure_conditions` | **29,229** | Certificados y condiciones requeridas |
| `measure_exclusions` | **28,975** | Exclusiones país (solo importación) |
| `measure_footnotes` | **121,938** | Notas a pie de medida |
| `descriptions` | **25,691** | Descripciones jerárquicas HS (EN) |
| `declarable_codes` | **25,697** | Códigos declarables (leaf nodes) |
| `geographical_areas` | **311** | Áreas geográficas TARIC |
| `geographical_areas_composition` | **2,621** | Composición de grupos geográficos |
| `measure_types` | **78** | Tipos de medida con traducciones |
| `certificate_types` | **1,766** | Tipos de certificado (EN + ES) |
| `footnote_descriptions` | **5,280** | Descripciones de notas (EN + ES) |
| `additional_codes` | **6,506** | Códigos adicionales (EN + ES) |
| `exchange_rates` | **2,235** | Tipos de cambio BCE |
| `legal_bases` | **4,399** | Bases legales |
| **Total** | **390,735** | Datos oficiales EUR-Lex Marzo 2026 |

### ✨ Nuevas capacidades v5.2:
- **Códigos declarables inteligentes**: Sugerencias de subcódigos válidos cuando se introduce un código padre
- **Notas a pie enriquecidas**: 121,938 footnotes con descripciones bilingües (EN/ES) como alertas informativas
- **Certificados enriquecidos**: Condiciones de medida con descripciones de certificados en español
- **Códigos adicionales**: Descripciones bilingües en alertas anti-dumping
- **Aranceles país-específicos**: Detección correcta de aranceles base cuando un país está excluido de ERGA OMNES (ej: Rusia con sanciones)
- **Composición geográfica**: Resolución de grupos de países (1011 ERGA OMNES → membresía real)
- **Consulta jerárquica optimizada**: De 5 queries secuenciales a 1 query batch con `.in()`
- **Exclusiones solo importación**: Filtrado de 35,510 → 28,975 exclusiones relevantes
- **Scripts de migración en 3 bloques**: loadBlock1.js, loadBlock2.js, loadBlock3.js con dry-run

### 🌍 Mejoras CBAM (Marzo 2026)
- **Paquete regulatorio Diciembre 2025** integrado: C(2025) 8552, C(2025) 8560, COM(2025) 989
- **Precios de certificados**: Media trimestral 2026, semanal desde 2027
- **Panel precios oficiales Q1-Q4 2026**: Muestra precios publicados por la Comisión con botón "Usar este precio"
- **Penalización valores por defecto**: Markup progresivo (+10%/+20%/+30%)
- **Extensión downstream 2028**: ~180 nuevos códigos CN previstos
- **Guía "CBAM para Principiantes"**: Página `/cbam/guia` con explicación en 5 minutos
- **Certificados DUA**: Y128, Y134, Y137, Y238 para declaraciones desde 01/01/2026

### 🔧 Cambios técnicos v5.2:
- `calculateTariff.js` v5.2 — Motor de cálculo completo con 14 tablas
- Scripts de migración estructurados en 3 bloques con soporte `--dry-run` y `--only=`
- Schemas SQL dedicados: `bloque1-schema.sql`, `bloque2-schema.sql`, `bloque3-schema.sql`
- Columnas TEXT en lugar de VARCHAR para campos de longitud variable
- Vistas `tariffs` y `tariff_complete` actualizadas para nueva estructura
- RLS (Row Level Security) habilitado en todas las tablas nuevas

---

## 🚀 Características Principales

### ✅ Calculadora Profesional
- **Cálculo preciso** de aranceles e IVA según normativa europea
- **195+ países** soportados con preferencias comerciales
- **136,009 medidas TARIC** actualizadas (Marzo 2026)
- **IVA variable inteligente**: 4% / 10% / 21% según producto
- **Alertas TARIC enriquecidas**: Footnotes + certificados + códigos adicionales bilingües
- **Alertas CBAM automáticas**: Aviso si el producto está sujeto al mecanismo
- **Exclusiones por país**: 28,975 exclusiones automáticas (solo importación)
- **Contingentes arancelarios**: Detección automática de cuotas disponibles
- **Preferencias implícitas**: Acuerdos de Asociación aplicados automáticamente
- **Aranceles país-específicos**: Gestión correcta de sanciones y exclusiones
- **Códigos declarables**: Sugerencias inteligentes de subcódigos válidos (is_leaf)
- **Descripciones jerárquicas**: HS2 → HS4 → HS6 → HS10 (query batch optimizada)
- **Tipos de cambio BCE**: 30 monedas con actualización mensual
- **121,938 notas informativas**: Footnotes como alertas contextuales

### 🚨 Sistema de Alertas TARIC
- **78 tipos de medida** traducidos al español con iconos descriptivos
- **1,766 tipos de certificado** bilingües (EN + ES) desde base de datos
- **5,280 descripciones de notas** bilingües (EN + ES)
- **6,506 códigos adicionales** bilingües (EN + ES)
- **311 áreas geográficas** con composición de 2,621 membresías
- **Códigos AEAT**: 120+ códigos nacionales españoles
- **Filtrado por origen**: Solo muestra alertas relevantes al país consultado
- **Prioridades visuales**: Crítico (rojo), Importante (ámbar), Info (azul)
- **Texto expandible**: Ver descripción EUR-Lex original
- **Footnotes informativos**: Notas a pie de medida como alertas contextuales

### 🤖 Clasificador IA
- **Claude Sonnet 4.5**: Clasificación inteligente de productos
- **Descripción en lenguaje natural**: "Tablets con teclado..." → Código TARIC
- **Validación contra base TARIC**: Verifica que códigos existan
- **Códigos alternativos**: Múltiples opciones con nivel de confianza
- **Razonamiento explicado**: Aplica Reglas Generales de Interpretación
- **Búsqueda contextual**: Encuentra códigos relacionados en base de datos
- **Países recomendados**: Sugiere orígenes óptimos
- **Alertas CBAM**: Aviso automático si el código sugerido está afectado
- **Sistema de educación IA**: Ejemplos verificados para mejorar clasificaciones
- **Integración directa**: Calcula aranceles automáticamente

### 🌍 Módulo CBAM
Mecanismo de Ajuste en Frontera por Carbono - **Obligatorio desde 01/01/2026**

> Actualizado con paquete regulatorio Diciembre 2025: C(2025) 8552, C(2025) 8560, COM(2025) 989

#### Verificador de Códigos (`/cbam`)
- **40+ códigos CN** de los 6 sectores afectados
- **Detección automática** por código HS (8 dígitos)
- **Información del sector**: Cemento, Hierro/Acero, Aluminio, Fertilizantes, Hidrógeno, Electricidad
- **Gases aplicables**: CO2, N2O, PFC según sector
- **Tipo de emisiones**: Directas vs directas+indirectas
- **Indicador de minimis**: Muestra si aplica exención <50t/año

#### Simulador de Coste de Certificados
- **Valores por defecto UE**: Factores de emisión oficiales (tCO2/t)
- **Precio EU ETS actual**: ~€68.50/tCO2 (actualizable)
- **Cálculo instantáneo**: Toneladas × Factor × Precio
- **Ajuste FAA (Free Allocation Adjustment)**: Phase-in progresivo 2026-2034 aplicado al cálculo
- **Selector de año visual**: 9 botones (2026-2034) con % phase-in y markup
- **Desglose bruto/efectivo**: Coste bruto, ajuste FAA y coste efectivo
- **Proyección 2026-2034**: Gráfico de barras colapsable con coste proyectado por año
- **Panel precios oficiales trimestrales**: Precios CBAM 2026 publicados por la Comisión Europea con botón "Usar este precio"
- **Avisos legales**: Estimación orientativa, consultar experto

#### 🆕 Precios de Certificados (Dic 2025)
Según Reglamento C(2025) 8560:
| Período | Metodología | Frecuencia |
|---------|-------------|------------|
| 2026 | Media trimestral EU ETS | 4 precios/año |
| 2027+ | Media semanal EU ETS | ~52 precios/año |

#### 🆕 Panel de Precios Oficiales Trimestrales 2026
Panel integrado en la calculadora que muestra los precios oficiales de certificados CBAM publicados por la Comisión Europea:
| Trimestre | Fecha de publicación | Estado |
|-----------|---------------------|--------|
| Q1 2026 | 7 abril 2026 | Pendiente |
| Q2 2026 | 6 julio 2026 | Pendiente |
| Q3 2026 | 5 octubre 2026 | Pendiente |
| Q4 2026 | 4 enero 2027 | Pendiente |

- **Visible solo en año 2026**: Se oculta automáticamente si se selecciona otro año
- **Actualización manual**: Cambiar `null` por precio en `CBAM_QUARTERLY_PRICES_2026` en `CBAMCostSimulator.js`
- **Botón "Usar este precio"**: Aplica el precio oficial al campo de precio EUA de la calculadora
- **Sin API externa**: No requiere fetch ni scraping — los precios se actualizan en el código

#### 🆕 Penalización Valores por Defecto (Dic 2025)
Markup progresivo según C(2025) 8552 si no se aportan emisiones reales verificadas:
| Año | Markup | Impacto |
|-----|--------|---------|
| 2026 | +10% | Transición |
| 2027 | +20% | Intermedio |
| 2028+ | +30% | Permanente |

#### 🆕 Extensión Productos Downstream (2028)
Propuesta COM(2025) 989 - Aplicación prevista 01/01/2028:
- **~180 nuevos códigos CN**: Manufacturas de acero y aluminio
- **~7.500 nuevos importadores** afectados
- **~3.850 PYMEs** con obligaciones adicionales
- Sectores: Estructuras metálicas, tornillería, depósitos, cables...

#### Guía "CBAM para Principiantes" (`/cbam/guia`)
- **Explicación en 5 minutos**: Sin jerga técnica
- **Analogía visual**: Por qué existe el CBAM
- **Timeline simplificado**: 3 fases clave
- **4 pasos prácticos**: Registro → Datos → Certificados → Entrega
- **FAQs interactivos**: 6 preguntas frecuentes
- **Botón flotante**: Acceso rápido desde página principal

#### Alertas Integradas
- **En calculadora**: Badge CBAM junto al código HS
- **En clasificador IA**: Alerta si código sugerido está afectado
- **Enlace directo**: A página de obligaciones CBAM

#### Timeline y Plazos (Actualizado Dic 2025)
| Fecha | Evento |
|-------|--------|
| 31/12/2025 | Fin período transitorio |
| 01/01/2026 | 🚨 CBAM definitivo - Obligación de compra |
| 31/03/2026 | Límite solicitud declarante autorizado |
| 01/01/2027 | Precio semanal certificados |
| 30/09/2027 | Primera entrega de certificados |
| 01/01/2028 | Extensión productos downstream |
| 01/01/2034 | Eliminación total derechos gratuitos |

#### Países Excluidos
- Islandia, Liechtenstein, Noruega (EEE con EU ETS)
- Suiza (Acuerdo vinculado)
- Territorios especiales UE: Büsingen, Heligoland, Livigno

#### Certificados para DUA (desde 01/01/2026)
| Código | Descripción |
|--------|-------------|
| Y128 | Número cuenta CBAM (obligatorio) |
| Y134 | Exención territorios especiales |
| Y137 | Exención de minimis (<50t/año) |
| Y238 | Solicitud declarante en trámite |

**Sectores y códigos afectados:**
| Sector | Capítulos NC | Gases | De minimis |
|--------|--------------|-------|------------|
| Cemento | 2507, 2523 | CO2 | ✅ Aplica |
| Electricidad | 2716 | CO2 | ❌ No aplica |
| Fertilizantes | 2808, 2814, 3102, 3105 | CO2, N2O | ✅ Aplica |
| Hidrógeno | 2804 | CO2 | ❌ No aplica |
| Hierro/Acero | 72, 7301-7311, 7318, 7326 | CO2 | ✅ Aplica |
| Aluminio | 7601-7616 | CO2, PFC | ✅ Aplica |

### 📊 Calculadora Masiva (Bulk)
- **Procesamiento CSV**: Hasta 100 productos simultáneos
- **Export Excel profesional**: 4 sheets (Resumen, Detalle, Alertas, Errores)
- **Validación completa**: Códigos, países, valores
- **Estadísticas agregadas**: Totales, promedios, desglose
- **Preview de datos**: Validación antes de procesar

### ⚖️ Comparador Multi-Origen
- **5 países simultáneos**: Compara costes totales
- **Detección automática**: Mejor opción económica
- **Ahorro calculado**: Diferencia en € entre opciones
- **Alertas por país**: Requisitos específicos de cada origen

### 💱 Sistema Tipos de Cambio
- **30 monedas BCE**: Actualización mensual desde BOE
- **Conversión automática**: Integrada en calculadora
- **Lógica vigencia**: Tipos actuales vs próximos
- **Banner automático**: Aviso cuando hay tipos nuevos publicados
- **Página dedicada**: `/tipos-cambio` con widget completo
- **Cumplimiento normativo**: Reglamento UE 2447/2015

### 📋 Gestor de Despachos (Beta)
- **CRUD completo**: Crear, editar, eliminar despachos
- **Estados de seguimiento**: Pendiente, En curso, Completado
- **Vinculación a cálculos**: Asociar productos calculados
- **Historial de cambios**: Trazabilidad completa

### 🛠️ Panel Admin (Solo administradores)
- **Gestión de ejemplos IA** (`/admin/clasificaciones`)
- **Educar al clasificador**: Añadir clasificaciones verificadas
- **Corregir errores**: Indicar código correcto vs incorrectos
- **Activar/desactivar**: Control de ejemplos activos

### 👤 Sistema de Usuarios
- **Autenticación**: Supabase Auth (Email/Password)
- **Dashboard personal**: Estadísticas y KPIs
- **Historial completo**: Todos los cálculos guardados
- **Favoritos**: Códigos HS frecuentes
- **Export Excel**: Historial completo exportable
- **Row Level Security**: Aislamiento total de datos

### 🎨 Experiencia de Usuario
- **Diseño premium**: Colores corporativos (#0A3D5C navy, #F4C542 gold)
- **Responsive**: Optimizado móvil y desktop
- **Quick Access Buttons**: Navegación rápida entre herramientas
- **Autocomplete inteligente**: Búsqueda de códigos HS
- **Badges visuales**: Prioridad de alertas con iconos
- **Export PDF**: Resultados individuales

---

## 🗂️ Arquitectura del Proyecto

```
lexaduana/
├── 📁 app/                       # Next.js 15 App Router
│   ├── api/                      # APIs serverless
│   │   ├── calculate/            # Cálculo individual
│   │   ├── bulk-calculate/       # Cálculo masivo (CSV)
│   │   ├── classify-product/     # Clasificador IA
│   │   ├── search-codes/         # Búsqueda códigos HS
│   │   ├── exchange-rates/       # Tipos de cambio BCE
│   │   ├── calculations/         # Gestión historial
│   │   │   ├── save/             # Guardar cálculo
│   │   │   └── history/          # Obtener historial
│   │   └── favorites/            # Gestión favoritos
│   ├── auth/                     # Autenticación
│   │   ├── login/                # Página login
│   │   ├── register/             # Registro
│   │   └── callback/             # Callback OAuth
│   ├── admin/                    # Panel administración
│   │   └── clasificaciones/      # Gestión ejemplos IA
│   ├── dashboard/                # Dashboard usuario
│   ├── calculadora/              # Calculadora principal
│   ├── clasificador/             # Clasificador IA
│   ├── cbam/                     # Módulo CBAM completo
│   ├── bulk/                     # Calculadora masiva
│   ├── comparador/               # Comparador multi-origen
│   ├── despachos/                # Gestor de despachos
│   ├── favoritos/                # Gestión favoritos
│   ├── tipos-cambio/             # Tipos de cambio
│   ├── glosario/                 # Glosario términos
│   ├── page.js                   # Landing page
│   └── layout.js                 # Layout global
├── 📁 components/                # Componentes React
│   ├── UserMenu.js               # Menú autenticación
│   ├── HSCodeAutocomplete.js     # Búsqueda HS
│   ├── ExportPDF.js              # Exportación PDF
│   ├── ExchangeRateBanner.js     # Banner tipos cambio
│   ├── CBAMAlert.js              # Alertas CBAM
│   ├── CBAMCostSimulator.js      # Simulador costes CBAM
│   ├── HeroSection.js            # Sección hero
│   └── FeaturesSection.js        # Características
├── 📁 lib/                       # Utilidades
│   ├── supabase.js               # Cliente Supabase server
│   ├── supabase-browser.js       # Cliente Supabase client
│   ├── calculateTariff.js        # Motor cálculo v5.2
│   ├── rate-limit.js             # Rate limiting con Upstash
│   ├── validation.js             # Validadores de entrada
│   ├── cbamData.js               # Datos CBAM (códigos, sectores, timeline)
│   ├── taricTranslations.js      # Traducciones estáticas (fallback)
│   ├── vatCalculator.js          # Lógica IVA variable
│   ├── csvParser.js              # Parser CSV bulk
│   └── excelExporter.js          # Exportador Excel
├── 📁 scripts/                   # Scripts migración TARIC
│   ├── bloque1-schema.sql        # Schema bloque 1 (master data)
│   ├── loadBlock1.js             # Carga bloque 1 (5 tablas)
│   ├── bloque2-schema.sql        # Schema bloque 2 (core data)
│   ├── loadBlock2.js             # Carga bloque 2 (4 tablas)
│   ├── bloque3-schema.sql        # Schema bloque 3 (lookup tables)
│   └── loadBlock3.js             # Carga bloque 3 (5 tablas)
├── 📁 lexaduana-migration/       # Scripts legacy (compatibilidad)
│   ├── import-all-taric.js       # Importador Excel → Supabase
│   └── ACTUALIZACION_MENSUAL.md  # Guía de actualización
└── 📁 public/                    # Assets estáticos
    ├── icons/                    # Iconos
    └── images/                   # Imágenes
```

---

## 🗄️ Base de Datos (Supabase)

### Tablas TARIC (v5.2 — Marzo 2026)

```sql
-- ══════════════════════════════════════════════
-- BLOQUE 1: Master Data (5 tablas, 54,398 filas)
-- ══════════════════════════════════════════════
geographical_areas              --    311 áreas geográficas
geographical_areas_composition  --  2,621 composición de grupos (país → grupo)
descriptions                    -- 25,691 descripciones jerárquicas HS (EN)
measure_types                   --     78 tipos de medida con traducciones
declarable_codes                -- 25,697 códigos declarables (leaf nodes)

-- ══════════════════════════════════════════════
-- BLOQUE 2: Core Data (4 tablas, 316,151 filas)
-- ══════════════════════════════════════════════
taric_measures                  -- 136,009 medidas (aranceles, preferencias, anti-dumping)
measure_conditions              --  29,229 condiciones y certificados requeridos
measure_exclusions              --  28,975 exclusiones por país (solo importación)
measure_footnotes               -- 121,938 notas a pie de medida

-- ══════════════════════════════════════════════
-- BLOQUE 3: Lookup Tables (5 tablas, 20,186 filas)
-- ══════════════════════════════════════════════
certificate_types               --  1,766 tipos de certificado (EN + ES)
footnote_descriptions           --  5,280 descripciones de notas (EN + ES)
additional_codes                --  6,506 códigos adicionales (EN + ES)
exchange_rates                  --  2,235 tipos de cambio BCE
legal_bases                     --  4,399 bases legales

-- ══════════════════════════════════════════════
-- TOTAL: 14 tablas, 390,735 registros
-- ══════════════════════════════════════════════

-- Tablas de soporte
countries               -- 195 países con acuerdos
vat_rates               -- IVA por código
measure_alerts          -- Alertas legacy (compatibilidad)

-- Tablas de usuario
profiles                -- Perfiles de usuario
calculations            -- Historial de cálculos
favorites               -- Favoritos guardados
despachos               -- Gestión de despachos

-- Tablas IA
classification_examples -- Ejemplos para educar clasificador
```

### Actualización mensual de datos TARIC

Los datos se actualizan mediante scripts de migración en 3 bloques:

```bash
# 1. Descargar los 14 Excel de EUR-Lex
# 2. Ejecutar schemas SQL en Supabase SQL Editor
# 3. Cargar datos con scripts Node.js

# Bloque 1: Master data (desbloquea el resto)
node scripts/loadBlock1.js --dry-run          # Verificar primero
node scripts/loadBlock1.js                     # Ejecutar carga

# Bloque 2: Core data (medidas, condiciones, exclusiones, footnotes)
node scripts/loadBlock2.js --dry-run
node scripts/loadBlock2.js

# Bloque 3: Lookup tables (certificados, notas, códigos adicionales)
node scripts/loadBlock3.js --dry-run
node scripts/loadBlock3.js --only=certificates # Cargar solo una tabla

# Opciones disponibles:
# --dry-run          Simular sin escribir en Supabase
# --only=<tabla>     Cargar solo una tabla específica
# --excel-path=/ruta Ruta personalizada a los archivos Excel
```

### Archivos Excel necesarios (14 ficheros)

| Archivo | Tabla destino |
|---------|--------------|
| `Geographical areas composition.xlsx` | geographical_areas_composition |
| `Geographical areas.xlsx` | geographical_areas |
| `Goods nomenclature descriptions EN.xlsx` | descriptions |
| `Measure types.xlsx` | measure_types |
| `Nomenclature EN.xlsx` | declarable_codes |
| `Measures.xlsx` | taric_measures |
| `Measure conditions.xlsx` | measure_conditions |
| `Measure excluded geographical areas.xlsx` | measure_exclusions |
| `Footnotes on measures.xlsx` | measure_footnotes |
| `Box 44 codes of the SAD.xlsx` | certificate_types |
| `Footnotes descriptions.xlsx` | footnote_descriptions |
| `Additional codes descriptions.xlsx` | additional_codes |
| `CCT Exchange rates.xlsx` | exchange_rates |
| `Legal basis.xlsx` | legal_bases |

---

## 🔒 Seguridad Implementada

### Credenciales
- **Nunca hardcodear** API keys en el código
- Usar **variables de entorno** en terminal para scripts
- Keys de Supabase en **Vercel Environment Variables**
- API keys rotadas en caso de exposición

### Rate Limiting (Upstash Redis)
- Clasificador IA: 20 peticiones/hora por usuario
- Calculadora: 150 peticiones/minuto por IP

### Validación de Entrada
- Sanitización contra XSS/SQL injection
- Validación de códigos HS (solo numéricos)
- Límites de longitud en inputs

---

## 🛠️ Instalación Local

```bash
# 1. Clonar repositorio
git clone https://github.com/carrillowolf/lexaduana.git
cd lexaduana

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 4. Ejecutar en desarrollo
npm run dev
```

### Variables de entorno requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Anthropic (Clasificador IA)
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

---

## 📈 Roadmap

### ✅ Completado (v5.2 - Marzo 2026)

#### 📊 Migración Completa TARIC Marzo 2026
- **390,735 registros** EUR-Lex oficiales en 14 tablas
- Motor de cálculo `calculateTariff.js` v5.2
- Scripts de migración en 3 bloques con dry-run
- Códigos declarables (leaf nodes) para sugerencias inteligentes
- Composición geográfica para resolución de grupos de países
- Footnotes enriquecidos con descripciones bilingües
- Certificados y códigos adicionales bilingües (EN + ES)
- Aranceles país-específicos (gestión de sanciones/exclusiones)
- Query jerárquica optimizada (1 query batch vs 5 secuenciales)

#### 🌍 Módulo CBAM Completo
- Paquete regulatorio Diciembre 2025 integrado
- Guía "CBAM para Principiantes"
- Simulador de costes con penalización progresiva y ajuste FAA
- Proyección de costes 2026-2034 con phase-in CBAM
- Extensión downstream 2028 documentada
- Certificados DUA (Y128, Y134, Y137, Y238)

#### 📋 Gestor de Despachos
- CRUD completo de despachos
- Estados de seguimiento
- Vinculación a cálculos

---

### 🔜 Próximamente (v5.3 - Q2 2026)

#### 🎨 Renovación Frontend
- Visualización de footnotes y certificados enriquecidos
- Códigos adicionales en alertas anti-dumping
- Indicador de aranceles país-específicos
- Mejoras UX en comparador multi-origen

#### 📄 Servicio IAV (Información Arancelaria Vinculante)
- Aviso de no vinculación en clasificador IA
- Formulario de solicitud de IAV
- Checklist de documentos necesarios
- Tramitación ante AEAT como servicio premium

#### 🔔 Sistema de Alertas Personalizadas
- Marcar códigos HS como "vigilados"
- Email cuando cambie arancel o medida
- Dashboard de cambios recientes

---

### 🚀 Futuro (v6.0 - 2026)

#### 🔗 Integraciones AEAT
Basado en la Guía Técnica de Importación CAU v3.14:

| Servicio | Funcionalidad |
|----------|---------------|
| `ConsultaMasivaImpV1` | Consultar hasta 1000 DUAs por fecha/importador |
| `EstadoV1Sal` | Estado de declaración (canal verde/naranja/rojo) |
| `CC460AV1` | Notificaciones de control/documentación |
| `Bandeja de Entrada` | Recibir alertas push de la AEAT |

- **Tracking de contenedores**: ¿Ha llegado mi mercancía?
- **Alertas AWB/BL**: Notificación cuando sumaria disponible
- **ICS2 Monitor**: Vigilar ENS (Entry Summary Declaration)
- **H1 Helper**: Asistente para nuevo formato DUA

#### 📌 API Pública
- Endpoints RESTful documentados
- API keys por usuario
- Rate limiting por tier
- Documentación Swagger/OpenAPI

#### 🧠 IA Avanzada
- Fine-tuning modelo con datos históricos
- Predicción de reclasificaciones
- Detección automática cambios EUR-Lex
- OCR para documentos aduaneros

---

## 📋 Backlog (Ideas futuras)

Ideas pendientes de priorizar y desarrollar:

| Idea | Descripción | Complejidad |
|------|-------------|-------------|
| **Procesador Excel EUR-Lex** | Subir Excel mensual de aranceles → detectar cambios automáticamente → generar diff antes de aplicar | Media |
| **OCR Facturas Comerciales** | Subir PDF de factura → extraer productos, valores, país → sugerir códigos HS y calcular | Alta |
| **Plantilla email proveedor CBAM** | Generar email en español/inglés para pedir datos de emisiones al fabricante | Baja |
| **Historial productos CBAM** | Filtrar en dashboard solo cálculos de productos afectados por CBAM | Baja |
| **API precio EU ETS en tiempo real** | Conectar con SENDECO2 o similar para precio actualizado | Media |
| **PWA / App móvil** | Versión instalable para acceso rápido | Media |
| **Multi-idioma** | Inglés, portugués para expansión | Media |
| **Comparador CBAM por país** | Simular coste CBAM según origen (China vs Turquía vs India) | Media |

---

## 🎯 Diferenciadores Clave

1. **390,735 registros EUR-Lex oficiales** - La base de datos TARIC más completa en España
2. **14 tablas Supabase sincronizadas** - Datos Marzo 2026 con actualización mensual
3. **Clasificador IA con validación TARIC** - Único en el mercado español
4. **Alertas bilingües enriquecidas** - Certificados, footnotes y códigos adicionales en ES
5. **Módulo CBAM completo** - Verificador + Simulador + Guía + Alertas
6. **Aranceles país-específicos** - Gestión correcta de sanciones y exclusiones
7. **Códigos declarables inteligentes** - Sugerencias de subcódigos válidos
8. **Calculadora bulk profesional** - Export Excel 4 sheets
9. **Tipos de cambio BCE** - Cumplimiento normativo
10. **Sistema educación IA** - Mejora continua de clasificaciones

### Competencia
- **Calculadoras básicas**: No tienen IA, alertas crípticas, sin validación
- **Clasificadores IA genéricos**: No integran cálculo, no validan contra TARIC
- **Software enterprise**: Caro, complejo, orientado a grandes empresas
- **Herramientas CBAM**: Complejas, sin integración con aranceles

**Posicionamiento**: Herramienta profesional accesible para PYMES, autónomos y agentes de aduanas.

---

## 💰 Modelo de Negocio

### Planes propuestos

| Plan | Precio | Clasificador IA | CBAM | Bulk | IAV |
|------|--------|-----------------|------|------|-----|
| **Free** | €0 | ❌ | ✅ Verificador | ❌ | ❌ |
| **Pro** | €29/mes | ✅ 100/mes | ✅ Completo | ✅ | Descuento |
| **Business** | €99/mes | ✅ Ilimitado | ✅ + Alertas | ✅ + API | Incluido |
| **Enterprise** | Custom | ✅ Dedicado | ✅ + Integraciones | ✅ API | Premium |

### Servicios adicionales

| Servicio | Precio | Descripción |
|----------|--------|-------------|
| **IAV Express** | €150 | Tramitación IAV ante AEAT |
| **Informe CBAM** | €200 | Preparación informe trimestral |
| **Consultoría clasificación** | €75/h | Asesoramiento experto |

---

## 🔧 Troubleshooting

### Error: cookies() should be awaited (Next.js 15)

**Síntoma:**
```
Error: Route "/api/..." used `cookies().get(...)`. 
`cookies()` should be awaited before using its value.
```

**Solución:**
```javascript
// ❌ Incorrecto (Next.js 14)
const supabase = createRouteHandlerClient({ cookies })

// ✅ Correcto (Next.js 15)
const cookieStore = await cookies()
const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
```

### Error: Module not found 'xlsx'

```bash
npm install xlsx
```

### Error: API Key Anthropic inválida

1. Verificar que `ANTHROPIC_API_KEY` está en `.env.local`
2. Verificar que empieza con `sk-ant-api03-`
3. Reiniciar servidor: `npm run dev`
4. En Vercel: añadir en Environment Variables

### Error: VARCHAR too short en importación TARIC

Si al importar datos EUR-Lex aparece error de longitud, cambiar a TEXT:
```sql
-- Primero DROP views dependientes, luego ALTER, luego recrear views
ALTER TABLE taric_measures ALTER COLUMN origin_name TYPE TEXT;
ALTER TABLE taric_measures ALTER COLUMN duty_expression TYPE TEXT;
ALTER TABLE measure_footnotes ALTER COLUMN footnote_code TYPE TEXT;
```

### Error: View depends on column

Si al alterar columnas aparece "cannot alter type of a column used by a view":
```sql
-- 1. DROP views dependientes en orden inverso
DROP VIEW IF EXISTS tariff_complete;
DROP VIEW IF EXISTS tariffs;
-- 2. ALTER columnas
-- 3. Recrear views
```

### Error: NULL start_date en importación Excel

Si las fechas salen NULL, asegurar `cellDates: true` en XLSX.read():
```javascript
const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
```

---

## 📚 Documentación Adicional

### Para desarrolladores
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Database Schema](docs/database.md)

### Para usuarios
- [Guía de Usuario](docs/user-guide.md)
- [FAQ](docs/faq.md)
- [Glosario de Términos](https://lexaduana.es/glosario)

### Changelogs
- [CHANGELOG.md](CHANGELOG.md) - Historial de versiones

---

## 🤝 Contribución

Este es un proyecto privado de **LexAduana**.

Para consultas, colaboraciones o reportar bugs:
- **Email**: soporte@lexaduana.es
- **Web**: [lexaduana.es](https://lexaduana.es)

---

## 📄 Licencia

© 2024-2026 LexAduana. Todos los derechos reservados.

**Términos:**
- ✅ Uso personal/profesional en plataforma
- ❌ Redistribución del código prohibida
- ❌ Uso comercial del código por terceros prohibido
- ✅ API usage según plan contratado

---

## 📞 Soporte

- **Email**: soporte@lexaduana.es
- **Horario**: Lunes a Viernes, 9:00-18:00 (CET)
- **Respuesta**: < 24h laborables

---

## 🙏 Agradecimientos

- **Anthropic** - Por Claude Sonnet 4.5
- **Vercel** - Por el hosting y edge functions
- **Supabase** - Por la base de datos y auth
- **EUR-Lex** - Por los datos TARIC públicos
- **BCE** - Por los tipos de cambio oficiales
- **AEAT** - Por la documentación técnica del CAU
- **Comisión Europea** - Por la documentación CBAM

---

**Desarrollado con ❤️ por Carlos para LexAduana**

*Última actualización: Marzo 2026*
*Versión: 5.2.0*
