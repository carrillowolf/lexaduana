# 📊 LexAduana - Suite Profesional de Comercio Exterior

> Plataforma SaaS de herramientas aduaneras para importaciones a España y la Unión Europea: calculadora de aranceles, clasificador IA, verificador CBAM, simulador de costes y más.

[![Versión](https://img.shields.io/badge/versión-4.3.0-blue.svg)](https://lexaduana.es)
[![Estado](https://img.shields.io/badge/estado-producción-brightgreen.svg)](https://lexaduana.es)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-enabled-green.svg)](https://supabase.com)
[![Claude](https://img.shields.io/badge/Claude-4.5-purple.svg)](https://anthropic.com)

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

## 🆕 Novedades v4.3.0 (Diciembre 2025)

### 📊 Nueva Base de Datos TARIC Unificada
Migración completa a estructura de datos EUR-Lex oficial:

| Tabla | Registros | Contenido |
|-------|-----------|-----------|
| `taric_measures` | **141,291** | Aranceles, preferencias, anti-dumping |
| `measure_conditions` | **30,968** | Certificados requeridos (85 tipos) |
| `measure_exclusions` | **35,510** | Países excluidos de medidas |
| **Total** | **207,769** | Datos oficiales EUR-Lex |

### ✨ Mejoras incluidas:
- **Contingentes arancelarios**: Soporte para 1,454 contingentes con order_no
- **Anti-dumping detallado**: Por empresa (add_code) y país
- **Fechas de vigencia**: En todas las medidas (start_date, end_date)
- **79 tipos de medida**: vs ~10 anteriores
- **Preferencias implícitas**: Acuerdos de Asociación (Marruecos, Túnez, Egipto, etc.)
- **Filtrado de alertas por origen**: Solo muestra alertas relevantes al país consultado
- **Actualización mensual simplificada**: Script automatizado

### 🔧 Cambios técnicos:
- Nuevo `calculateTariff.js` v4.3 optimizado para tabla unificada
- Preferencias implícitas para acuerdos de libre comercio (productos industriales cap. 25-97)
- Filtrado de alertas legacy por país de origen
- Nueva carpeta `lexaduana-migration/` con scripts de actualización

---

## 🚀 Características Principales

### ✅ Calculadora Profesional
- **Cálculo preciso** de aranceles e IVA según normativa europea
- **195+ países** soportados con preferencias comerciales
- **141,291 medidas TARIC** actualizadas mensualmente
- **IVA variable inteligente**: 4% / 10% / 21% según producto
- **Alertas TARIC enriquecidas**: 251 códigos traducidos con iconos y descripciones
- **Alertas CBAM automáticas**: Aviso si el producto está sujeto al mecanismo
- **Exclusiones por país**: 35,510 exclusiones automáticas
- **Contingentes arancelarios**: Detección automática de cuotas disponibles (1,454)
- **Preferencias implícitas**: Acuerdos de Asociación aplicados automáticamente
- **Descripciones jerárquicas**: HS2 → HS4 → HS6 → HS10
- **Tipos de cambio BCE**: 30 monedas con actualización mensual

### 🚨 Sistema de Alertas TARIC
- **251 códigos traducidos** al español con iconos descriptivos
- **79 tipos de medida**: aranceles, controles, sanciones, anti-dumping...
- **85 tipos de certificados**: C074, E017, U088, Y864...
- **Códigos AEAT**: 120+ códigos nacionales españoles
- **Grupos geográficos**: 12 áreas (ERGA OMNES, SGP, América Central...)
- **Filtrado por origen**: Solo muestra alertas relevantes al país consultado
- **Prioridades visuales**: Crítico (rojo), Importante (ámbar), Info (azul)
- **Texto expandible**: Ver descripción EUR-Lex original

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
Mecanismo de Ajuste en Frontera por Carbono - Preparado para 2026

#### Verificador de Códigos (`/cbam`)
- **40+ códigos CN** de los 6 sectores afectados
- **Detección automática** por código HS (8 dígitos)
- **Información del sector**: Cemento, Hierro/Acero, Aluminio, Fertilizantes, Hidrógeno, Electricidad
- **Gases aplicables**: CO2, N2O, PFC según sector
- **Tipo de emisiones**: Directas vs directas+indirectas

#### Simulador de Coste de Certificados
- **Valores por defecto UE**: Factores de emisión oficiales (tCO2/t)
- **Precio EU ETS actual**: ~€68.50/tCO2 (actualizable)
- **Cálculo instantáneo**: Toneladas × Factor × Precio
- **Desglose completo**: Emisiones estimadas y coste total
- **Avisos legales**: Estimación orientativa, consultar experto

#### Alertas Integradas
- **En calculadora**: Badge CBAM junto al código HS
- **En clasificador IA**: Alerta si código sugerido está afectado
- **Enlace directo**: A página de obligaciones CBAM

#### Timeline y Plazos
- **Calendario visual**: Fechas clave del período transitorio
- **Countdown**: Días hasta próximo deadline
- **Umbral de minimis**: 50 toneladas/año según Reglamento 2025/2083

**Sectores y códigos afectados:**
| Sector | Capítulos NC | Gases |
|--------|--------------|-------|
| Cemento | 2507, 2523 | CO2 |
| Electricidad | 2716 | CO2 |
| Fertilizantes | 2808, 2814, 3102, 3105 | CO2, N2O |
| Hidrógeno | 2804 | CO2 |
| Hierro/Acero | 72, 7301-7311, 7318, 7326 | CO2 |
| Aluminio | 7601-7616 | CO2, PFC |

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
│   ├── calculateTariff.js        # 🆕 Módulo cálculo v4.3
│   ├── rate-limit.js             # Rate limiting con Upstash
│   ├── validation.js             # Validadores de entrada
│   ├── cbamData.js               # Datos CBAM (códigos, sectores, timeline)
│   ├── taricTranslations.js      # 251 códigos traducidos
│   ├── vatCalculator.js          # Lógica IVA variable
│   ├── csvParser.js              # Parser CSV bulk
│   └── excelExporter.js          # Exportador Excel
├── 📁 lexaduana-migration/       # 🆕 Scripts actualización mensual
│   ├── import-all-taric.js       # Importador Excel → Supabase
│   └── ACTUALIZACION_MENSUAL.md  # Guía de actualización
├── 📁 scripts/                   # Scripts procesamiento
│   └── (scripts auxiliares)
└── 📁 public/                    # Assets estáticos
    ├── icons/                    # Iconos
    └── images/                   # Imágenes
```

---

## 🗄️ Base de Datos (Supabase)

### Tablas principales (v4.3)

```sql
-- Nueva estructura unificada TARIC
taric_measures          -- 141,291 registros (aranceles, preferencias, anti-dumping)
measure_conditions      -- 30,968 registros (certificados requeridos)
measure_exclusions      -- 35,510 registros (países excluidos)
measure_types           -- 79 tipos de medida con traducciones
certificate_types       -- 85 tipos de certificado con traducciones

-- Tablas de soporte
descriptions            -- Descripciones jerárquicas HS
countries               -- 195 países con acuerdos
vat_rates               -- IVA por código
exchange_rates          -- Tipos de cambio BCE
measure_alerts          -- Alertas legacy (compatibilidad)

-- Tablas de usuario
profiles                -- Perfiles de usuario
calculations            -- Historial de cálculos
favorites               -- Favoritos guardados
despachos               -- Gestión de despachos

-- Tablas IA
classification_examples -- Ejemplos para educar clasificador
```

### Actualización mensual de datos

```bash
cd lexaduana-migration/

# Usar variables de entorno (NUNCA hardcodear keys)
SUPABASE_URL="https://tu-proyecto.supabase.co" \
SUPABASE_SERVICE_KEY="tu-api-key" \
node import-all-taric.js measures

# Repetir para conditions y exclusions
node import-all-taric.js conditions
node import-all-taric.js exclusions
```

Ver `lexaduana-migration/ACTUALIZACION_MENSUAL_TARIC.md` para guía completa.

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

### ✅ Completado (v4.3 - Diciembre 2025)

#### 📊 Nueva Base de Datos TARIC Unificada
- 207,769 registros EUR-Lex oficiales
- Tabla unificada `taric_measures`
- 79 tipos de medida vs ~10 anteriores
- Contingentes arancelarios con order_no
- Anti-dumping por empresa (add_code)
- Preferencias implícitas por acuerdo
- Script actualización mensual automatizado

#### 📋 Gestor de Despachos
- CRUD completo de despachos
- Estados de seguimiento
- Vinculación a cálculos

---

### 🔜 Próximamente (v4.4 - Q1 2026)

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

### 🚀 Futuro (v5.0 - 2026)

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

1. **207,769 registros EUR-Lex oficiales** - La base de datos TARIC más completa
2. **Clasificador IA con validación TARIC** - Único en el mercado español
3. **251 códigos de alertas traducidos** - No más códigos crípticos
4. **Módulo CBAM completo** - Verificador + Simulador + Alertas
5. **Preferencias implícitas** - Acuerdos de Asociación aplicados automáticamente
6. **Datos actualizados mensualmente** - EUR-Lex oficial
7. **Calculadora bulk profesional** - Export Excel 4 sheets
8. **Tipos de cambio BCE** - Cumplimiento normativo
9. **Sistema educación IA** - Mejora continua de clasificaciones
10. **Visión de suite completa** - No solo una calculadora

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

Si al importar datos EUR-Lex aparece error de longitud:
```sql
ALTER TABLE taric_measures ALTER COLUMN origin_name TYPE VARCHAR(200);
ALTER TABLE taric_measures ALTER COLUMN measure_type_name TYPE VARCHAR(200);
ALTER TABLE taric_measures ALTER COLUMN legal_base TYPE VARCHAR(200);
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

© 2024-2025 LexAduana. Todos los derechos reservados.

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

*Última actualización: Diciembre 2025*
*Versión: 4.3.0*
