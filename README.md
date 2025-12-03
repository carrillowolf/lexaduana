# 📊 LexAduana - Suite Profesional de Comercio Exterior

> Plataforma SaaS de herramientas aduaneras para importaciones a España y la Unión Europea: calculadora de aranceles, clasificador IA, verificador CBAM, simulador de costes y más.

[![Versión](https://img.shields.io/badge/versión-4.2.0-blue.svg)](https://lexaduana.es)
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
├── 🌍 Módulo CBAM              (disponible) ✨ NUEVO
│   ├── Verificador de códigos
│   ├── Simulador de costes
│   └── Alertas en calculadora
├── 📄 Servicio IAV             (próximamente)
└── 🔗 Integraciones AEAT       (en desarrollo)
```

---

## 🚀 Características Principales

### ✅ Calculadora Profesional
- **Cálculo preciso** de aranceles e IVA según normativa europea
- **195+ países** soportados con preferencias comerciales
- **IVA variable inteligente**: 4% / 10% / 21% según producto
- **Alertas TARIC enriquecidas**: 251 códigos traducidos con iconos y descripciones
- **Alertas CBAM automáticas**: Aviso si el producto está sujeto al mecanismo
- **Exclusiones por país**: Sistema automático de medidas aplicables
- **Descripciones jerárquicas**: HS2 → HS4 → HS6 → HS10
- **Tipos de cambio BCE**: 30 monedas con actualización mensual

### 🚨 Sistema de Alertas TARIC
- **251 códigos traducidos** al español con iconos descriptivos
- **Tipos de medida**: 35 categorías (aranceles, controles, sanciones...)
- **Certificados UE**: 131 códigos (C074, E017, U088, Y864...)
- **Códigos AEAT**: 120+ códigos nacionales españoles
- **Grupos geográficos**: 12 áreas (ERGA OMNES, SGP, América Central...)
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

### 🌍 Módulo CBAM (NUEVO v4.2)
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
calculadora-taric-lexaduana/
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
│   ├── admin/                    # 🆕 Panel administración
│   │   └── clasificaciones/      # Gestión ejemplos IA
│   ├── dashboard/                # Dashboard usuario
│   ├── calculadora/              # Calculadora principal
│   ├── clasificador/             # Clasificador IA
│   ├── cbam/                     # 🆕 Módulo CBAM completo
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
│   ├── CBAMAlert.js              # 🆕 Alertas CBAM
│   ├── CBAMCostSimulator.js      # 🆕 Simulador costes CBAM
│   ├── HeroSection.js            # Sección hero
│   └── FeaturesSection.js        # Características
├── 📁 lib/                       # Utilidades
│   ├── supabase.js               # Cliente Supabase server
│   ├── supabase-browser.js       # Cliente Supabase client
│   ├── calculateTariff.js        # Módulo cálculo principal
│   ├── cbamData.js               # 🆕 Datos CBAM (códigos, sectores, timeline)
│   ├── taricTranslations.js      # 251 códigos traducidos
│   ├── vatCalculator.js          # Lógica IVA variable
│   ├── csvParser.js              # Parser CSV bulk
│   └── excelExporter.js          # Exportador Excel
├── 📁 scripts/                   # Scripts procesamiento
│   ├── processMeasures.js        # Procesar alertas CSV
│   └── processExclusions.js      # Procesar exclusiones CSV
└── 📁 public/                    # Archivos estáticos
    └── logo.png                  # Logo LexAduana
```

---

## 🗄️ Base de Datos (Supabase)

### Tablas principales:

| Tabla | Registros | Descripción |
|-------|-----------|-------------|
| `tariffs` | ~49,700 | Aranceles ERGA OMNES |
| `descriptions` | ~15,000 | Descripciones productos HS |
| `countries` | 195+ | Países y acuerdos comerciales |
| `preferential_tariffs` | ~135,000 | Aranceles preferenciales |
| `measure_alerts` | 15,281 | Alertas y requisitos TARIC |
| `measure_exclusions` | 34,370 | Exclusiones por país |
| `measure_conditions` | 29,612 | Condiciones de medidas |
| `vat_rates` | 50+ | Tipos IVA por código HS |
| `exchange_rates` | 30 | Tipos cambio BCE mensuales |
| `user_calculations` | ∞ | Historial cálculos usuarios |
| `user_favorites` | ∞ | Códigos favoritos usuarios |
| `classification_logs` | ∞ | Historial clasificaciones IA |
| `classification_examples` | 🆕 ∞ | Ejemplos verificados para educar IA |
| `dispatches` | ∞ | Despachos aduaneros |

**Total:** ~280,000 registros estáticos + datos dinámicos usuarios

### Esquema de seguridad:

- **Row Level Security (RLS)** habilitado en todas las tablas de usuario
- Políticas `SELECT`, `INSERT`, `UPDATE`, `DELETE` basadas en `auth.uid()`
- Usuarios solo acceden a sus propios datos
- Service role key solo en servidor (APIs)

---

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 15.5** con App Router y Server Components
- **React 18** con Hooks
- **TailwindCSS 3** para estilos
- **JavaScript ES6+** modular

### Backend & APIs
- **Next.js API Routes** (serverless en Vercel)
- **Supabase** (PostgreSQL 15 + Auth + Storage)
- **Anthropic Claude API** Sonnet 4.5 para clasificación IA
- **Row Level Security (RLS)** para protección datos

### Librerías especializadas
- **@anthropic-ai/sdk** - Cliente oficial Claude
- **xlsx** - Generación Excel profesional
- **@supabase/auth-helpers-nextjs** - Integración Supabase

### Autenticación
- **Supabase Auth** con email/password
- **JWT tokens** seguros con refresh automático
- **Session management** en cliente y servidor

### DevOps & Deployment
- **GitHub** - Control de versiones
- **Vercel** - Deployment automático con edge functions
- **Supabase** - Base de datos y auth managed
- **Edge CDN** - Recursos estáticos globales

---

## 📋 Requisitos Previos

- Node.js >= 18.0.0
- npm >= 8.0.0
- Cuenta Supabase (Free tier suficiente)
- API Key de Anthropic (para clasificador IA)

---

## 📈 Roadmap

### ✅ Completado (v4.2 - Diciembre 2025)

#### 🌍 Módulo CBAM Completo
- **Verificador de códigos**: 40+ códigos CN de 6 sectores
- **Simulador de costes**: Valores por defecto UE + precio EU ETS
- **Alertas integradas**: En calculadora y clasificador IA
- **Timeline interactivo**: Calendario de plazos con countdown
- **Página informativa**: `/cbam` con recursos oficiales

#### 🧠 Sistema Educación IA
- **Tabla `classification_examples`**: Almacena clasificaciones verificadas
- **Panel admin**: `/admin/clasificaciones` para gestión
- **Contexto dinámico**: Inyecta ejemplos relevantes en prompt
- **Corrección de errores**: Indica códigos incorrectos a evitar

#### 🚨 Sistema Alertas TARIC Enriquecidas
- **251 códigos traducidos** al español
- Módulo `taricTranslations.js` con:
  - 35 tipos de medida con iconos
  - 131 certificados UE (series A, C, D, E, L, N, U, Y)
  - 120+ códigos AEAT nacionales
  - 12 grupos geográficos
- Alertas con descripción legible en calculadora
- Sistema de prioridades visuales (crítico/importante/info)
- Texto EUR-Lex expandible

#### 📋 Gestor de Despachos (Beta)
- CRUD completo de despachos
- Estados de seguimiento
- Vinculación a cálculos

---

### 🔜 Próximamente (v4.3 - Q1 2026)

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

1. **Clasificador IA con validación TARIC** - Único en el mercado español
2. **251 códigos de alertas traducidos** - No más códigos crípticos
3. **Módulo CBAM completo** - Verificador + Simulador + Alertas
4. **Datos actualizados mensualmente** - EUR-Lex oficial
5. **Calculadora bulk profesional** - Export Excel 4 sheets
6. **Tipos de cambio BCE** - Cumplimiento normativo
7. **Sistema educación IA** - Mejora continua de clasificaciones
8. **Visión de suite completa** - No solo una calculadora

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
*Versión: 4.2.0*
