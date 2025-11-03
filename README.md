# 📊 Calculadora TARIC - LexAduana

> Plataforma profesional SaaS de cálculo de aranceles e IVA para importaciones a España y la Unión Europea con sistema de usuarios, clasificador IA y procesamiento masivo.

[![Versión](https://img.shields.io/badge/versión-4.0.0-blue.svg)](https://lexaduana.es)
[![Estado](https://img.shields.io/badge/estado-producción-brightgreen.svg)](https://lexaduana.es)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-enabled-green.svg)](https://supabase.com)
[![Claude](https://img.shields.io/badge/Claude-4.5-purple.svg)](https://anthropic.com)

🌍 **En producción:** [lexaduana.es](https://lexaduana.es)

---

## 🚀 Características Principales

### ✅ Calculadora Profesional
- **Cálculo preciso** de aranceles e IVA según normativa europea
- **195+ países** soportados con preferencias comerciales
- **IVA variable inteligente**: 4% / 10% / 21% según producto
- **Alertas TARIC**: Certificados y requisitos por código HS
- **Exclusiones por país**: Sistema automático de medidas aplicables
- **Descripciones jerárquicas**: HS2 → HS4 → HS6 → HS10
- **Tipos de cambio BCE**: 30 monedas con actualización mensual

### 🤖 Clasificador IA (NUEVO v4.0)
- **Claude Sonnet 4.5**: Clasificación inteligente de productos
- **Descripción en lenguaje natural**: "Tablets con teclado..." → Código TARIC
- **Validación contra base TARIC**: Verifica que códigos existan
- **Códigos alternativos**: Múltiples opciones con nivel de confianza
- **Razonamiento explicado**: Aplica Reglas Generales de Interpretación
- **Búsqueda contextual**: Encuentra códigos relacionados en base de datos
- **Países recomendados**: Sugiere orígenes óptimos
- **Integración directa**: Calcula aranceles automáticamente

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

### 👤 Sistema de Usuarios
- **Autenticación**: Supabase Auth (Email/Password)
- **Dashboard personal**: Estadísticas y KPIs
- **Historial completo**: Todos los cálculos guardados
- **Favoritos**: Códigos HS frecuentes
- **Export Excel**: Historial completo exportable
- **Row Level Security**: Aislamiento total de datos

### 🎨 Experiencia de Usuario
- **Diseño premium**: Colores corporativos (#0A3D5C, #F4C542)
- **Responsive**: Optimizado móvil y desktop
- **Quick Access Buttons**: Navegación rápida entre herramientas
- **Autocomplete inteligente**: Búsqueda de códigos HS
- **Badges visuales**: Prioridad de alertas
- **Export PDF**: Resultados individuales

---

## 🗂️ Arquitectura del Proyecto

```
calculadora-taric-lexaduana/
├── 📁 app/                       # Next.js 15 App Router
│   ├── api/                      # APIs serverless
│   │   ├── calculate/            # Cálculo individual
│   │   ├── bulk-calculate/       # Cálculo masivo (CSV)
│   │   ├── classify-product/     # 🆕 Clasificador IA
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
│   ├── dashboard/                # Dashboard usuario
│   ├── calculadora/              # Calculadora principal
│   ├── clasificador/             # 🆕 Clasificador IA
│   ├── bulk/                     # 🆕 Calculadora masiva
│   ├── comparador/               # Comparador multi-origen
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
│   ├── HeroSection.js            # Sección hero
│   └── FeaturesSection.js        # Características
├── 📁 lib/                       # Utilidades
│   ├── supabase.js               # Cliente Supabase server
│   ├── supabase-browser.js       # Cliente Supabase client
│   ├── vatCalculator.js          # Lógica IVA variable
│   ├── csvParser.js              # 🆕 Parser CSV bulk
│   └── excelExporter.js          # 🆕 Exportador Excel
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
| `tariffs` | ~20,000 | Aranceles ERGA OMNES |
| `descriptions` | ~15,000 | Descripciones productos HS |
| `countries` | 195+ | Países y acuerdos comerciales |
| `preferential_tariffs` | ~5,000 | Aranceles preferenciales |
| `measure_alerts` | 15,281 | Alertas y requisitos TARIC |
| `measure_exclusions` | 34,370 | Exclusiones por país |
| `vat_rates` | 50+ | Tipos IVA por código HS |
| `exchange_rates` | 30 | Tipos cambio BCE mensuales |
| `user_calculations` | ∞ | Historial cálculos usuarios |
| `user_favorites` | ∞ | Códigos favoritos usuarios |
| `classification_logs` | 🆕 ∞ | Historial clasificaciones IA |

**Total:** ~85,000 registros estáticos + datos dinámicos usuarios

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
- **Anthropic Claude API** 🆕 Sonnet 4.5 para clasificación IA
- **Row Level Security (RLS)** para protección datos

### Librerías especializadas
- **@anthropic-ai/sdk** 🆕 - Cliente oficial Claude
- **xlsx** 🆕 - Generación Excel profesional
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
- Cuenta Vercel (Free tier suficiente)
- **API Key Anthropic** 🆕 (para clasificador IA)
- Cuenta GitHub (para deployment)

---

## 🚀 Instalación y Desarrollo

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/calculadora-taric-lexaduana.git
cd calculadora-taric-lexaduana
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno

Crear `.env.local` en la raíz:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_publica
SUPABASE_SERVICE_KEY=tu_service_role_key_privada

# Anthropic (Clasificador IA) 🆕
ANTHROPIC_API_KEY=sk-ant-api03-...tu-api-key...
```

**⚠️ IMPORTANTE:**
- Las variables `NEXT_PUBLIC_*` son visibles en el cliente
- `SUPABASE_SERVICE_KEY` y `ANTHROPIC_API_KEY` son **privadas** (solo servidor)
- No commitear `.env.local` en git (ya está en `.gitignore`)

### 4. Configurar Base de Datos

Ejecutar scripts SQL en Supabase SQL Editor:

```sql
-- 1. Tablas de usuario (ver docs/sql/user_tables.sql)
-- 2. Tabla clasificaciones IA 🆕
CREATE TABLE classification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  suggested_code VARCHAR(10),
  confidence INTEGER,
  model_used VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_classification_logs_user ON classification_logs(user_id);
CREATE INDEX idx_classification_logs_date ON classification_logs(created_at DESC);

ALTER TABLE classification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own classifications"
  ON classification_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own classifications"
  ON classification_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 5. Desarrollo local
```bash
npm run dev
```

Aplicación disponible en: `http://localhost:3000`

### 6. Obtener API Key de Anthropic

1. Ir a https://console.anthropic.com/
2. Crear cuenta / Login
3. Settings → API Keys → Create Key
4. Copiar key (empieza con `sk-ant-api03-...`)
5. Añadir a `.env.local`

**Costes estimados:**
- Modelo: `claude-sonnet-4-5-20250929`
- Coste: ~$3 por 1M tokens
- Por clasificación: ~1,600 tokens = $0.0048 (0.48 céntimos)
- 10,000 clasificaciones/mes = $48/mes

---

## 🗄️ Procesamiento de Datos EUR-Lex

### Actualización mensual de datos TARIC

```bash
# 1. Descargar archivos Excel desde EUR-Lex
# https://taxation-customs.ec.europa.eu/online-services/online-services-and-databases-customs/tariff-establishment-tics-and-taric_en

# 2. Procesar alertas TARIC
node scripts/processMeasures.js

# 3. Procesar exclusiones por país
node scripts/processExclusions.js

# 4. Verificar en Supabase que los datos se insertaron
# Supabase Dashboard → Table Editor
```

**Archivos procesados mensualmente:**
- `taric_measures.xlsx` (alertas y requisitos)
- `country_exclusions.xlsx` (medidas por país)
- Tipos de cambio BCE desde BOE

---

## 🌐 Deployment en Vercel

### 1. Conectar repositorio

1. GitHub → Repositorio → Settings → Webhooks
2. Vercel → New Project → Import Git Repository
3. Select Framework: Next.js
4. Root Directory: `./`
5. Build Command: `npm run build`

### 2. Configurar variables de entorno

Vercel Dashboard → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Aplicar en:**
- ✅ Production
- ✅ Preview
- ✅ Development

### 3. Dominio personalizado

Vercel Dashboard → Project → Settings → Domains:
- Añadir: `lexaduana.es`
- Añadir: `www.lexaduana.es`
- DNS: CNAME → `cname.vercel-dns.com`

### 4. Deploy

```bash
git add .
git commit -m "feat: descripción cambios"
git push origin main
```

Vercel detecta el push y despliega automáticamente.

---

## 📖 Uso de APIs

### 1. Cálculo Individual

```bash
POST /api/calculate
Content-Type: application/json

{
  "hsCode": "8471300000",
  "countryCode": "CN",
  "cifValue": 10000
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "hsCode": "8471300000",
    "description": "Máquinas automáticas...",
    "country": {
      "code": "CN",
      "name": "China",
      "hasAgreement": true
    },
    "duty": {
      "standardRate": 3.5,
      "appliedRate": 0,
      "amount": 0,
      "origin": "preferential"
    },
    "vat": {
      "rate": 21,
      "type": "general",
      "amount": 2100
    },
    "total": 12100,
    "alerts": [
      {
        "code": "C078",
        "description": "Certificado de origen EUR.1 requerido",
        "priority": 2
      }
    ]
  }
}
```

---

### 2. Clasificador IA 🆕

```bash
POST /api/classify-product
Authorization: Required (usuario logueado)
Content-Type: application/json

{
  "description": "Tablets con teclado integrado QWERTY desmontable, pantalla táctil 10 pulgadas, procesador Intel, para uso industrial",
  "countryCode": "CN",
  "cifValue": 50000
}
```

**Respuesta:**
```json
{
  "success": true,
  "classification": {
    "primaryCode": "8471300000",
    "confidence": 92,
    "reasoning": "Análisis detallado: El producto se clasifica como máquina automática para tratamiento de datos portátil (8471) porque cumple con RGI 1...",
    "primaryCodeExists": true,
    "primaryCodeDutyRate": 0,
    "alternativeCodes": [
      {
        "code": "8471410000",
        "reason": "Si se considera que el teclado no es desmontable...",
        "confidence": 65,
        "dutyRate": 0,
        "validated": true
      }
    ],
    "keyFactors": [
      "Función principal: procesamiento datos",
      "Materia constitutiva: componentes electrónicos",
      "RGI aplicada: RGI 1",
      "Característica esencial: capacidad computacional"
    ],
    "warnings": [
      "Verificar si el teclado es verdaderamente desmontable",
      "Confirmar uso industrial vs consumo"
    ],
    "recommendedOrigins": ["VN", "TH", "MY"],
    "additionalInfo": "Para clasificación definitiva se recomienda verificar especificaciones técnicas del procesador"
  },
  "metadata": {
    "model": "claude-sonnet-4-5-20250929",
    "timestamp": "2025-10-30T19:30:00.000Z",
    "tokensUsed": 1580,
    "relatedCodesFound": 12
  }
}
```

**Características del clasificador:**
- Aplica **Reglas Generales de Interpretación (RGI)** del Sistema Armonizado
- Busca **hasta 50 códigos relacionados** en base de datos
- **Valida contra TARIC** que códigos existan
- Sugiere **países de origen óptimos** para ese producto
- **Razonamiento explicado** paso a paso
- **Nivel de confianza** por cada sugerencia
- Integración con calculadora (botón directo)

---

### 3. Calculadora Masiva (Bulk)

```bash
POST /api/bulk-calculate
Authorization: Required
Content-Type: application/json

{
  "items": [
    {
      "hsCode": "8471300000",
      "countryCode": "CN",
      "cifValue": 10000,
      "lineNumber": 1
    },
    {
      "hsCode": "6203429010",
      "countryCode": "BD",
      "cifValue": 5000,
      "lineNumber": 2
    }
  ],
  "batchName": "Importación Octubre 2025"
}
```

**Respuesta:**
```json
{
  "success": true,
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "totals": {
      "totalCIF": 15000,
      "totalDuties": 0,
      "totalVAT": 3150,
      "totalAmount": 18150
    }
  },
  "results": [...],
  "errors": []
}
```

**Export Excel incluye:**
- **Sheet 1 - Resumen**: Totales y estadísticas
- **Sheet 2 - Detalle**: Todos los productos calculados
- **Sheet 3 - Alertas**: Requisitos TARIC por producto
- **Sheet 4 - Errores**: Items que fallaron (si los hay)

---

### 4. Guardar en Favoritos

```bash
POST /api/favorites
Authorization: Required
Content-Type: application/json

{
  "hsCode": "8471300000",
  "name": "Tablets industriales"
}
```

---

### 5. Tipos de Cambio

```bash
GET /api/exchange-rates
```

**Respuesta:**
```json
{
  "success": true,
  "current": {
    "validFrom": "2025-10-01",
    "validUntil": "2025-10-31",
    "rates": {
      "USD": 1.0850,
      "GBP": 0.8650,
      "JPY": 161.50,
      ...
    }
  },
  "next": {
    "validFrom": "2025-11-01",
    "rates": {...}
  }
}
```

---

## 🎨 Sistema de IVA Variable

### Tipos soportados:

| Tipo | % | Aplicación |
|------|---|------------|
| **Superreducido** | 4% | Pan, leche, frutas, verduras, huevos, cereales, queso, libros, periódicos, medicamentos uso humano, prótesis, vehículos para discapacitados, viviendas de protección oficial |
| **Reducido** | 10% | Alimentos (general), agua, medicamentos veterinarios, transporte pasajeros, hostelería, entradas espectáculos, viviendas (excepto VPO), renovación viviendas, flores y plantas vivas, bienes culturales |
| **General** | 21% | Resto de bienes y servicios no incluidos en anteriores |

### Lógica de aplicación (cascada):

1. **Búsqueda exacta en tabla `vat_rates`** (prioridad máxima)
   - 10 dígitos → 8 dígitos → 6 dígitos → 4 dígitos → 2 dígitos
   
2. **Reglas por capítulo HS** si no está en tabla:
   - Capítulos 01-05: 10% (animales vivos, productos)
   - Capítulos 06-14: Mixto (flores 10%, otros 21%)
   - Capítulos 15-24: 10% (alimentos)
   - Capítulos 28-49: 4% (libros/periódicos en cap 49, resto 21%)
   - Resto: 21%

3. **Fallback**: 21% (IVA general)

**Archivo:** `lib/vatCalculator.js`

---

## 🚨 Sistema de Alertas TARIC

### Tipos de alertas procesadas:

| Código | Tipo | Descripción | Prioridad |
|--------|------|-------------|-----------|
| C0## | Certificados | C074 (fitosanitario), C078 (origen), C644 (CITES) | 2 - Importante |
| U0## | Licencias | U088 (licencia importación), U116 (vigilancia) | 2 - Importante |
| S### | Sanciones | Medidas restrictivas por país (Rusia, etc) | 1 - Crítico |
| I### | Información | Cuotas, requisitos adicionales | 3 - Informativo |

### Exclusiones por país:

Sistema automático que:
1. Detecta medidas aplicables al código HS
2. Verifica si el país de origen está excluido
3. Filtra alertas que no aplican
4. Solo muestra requisitos relevantes

**Ejemplo:**
- Código 0401: Requiere certificado veterinario (C063)
- País UE: Excluido (mercado interior)
- País CN: Aplica el certificado

**Tablas:**
- `measure_alerts`: 15,281 registros
- `measure_exclusions`: 34,370 registros

---

## 🌍 Países y Acuerdos Comerciales

### Total: 195+ países en base de datos

**Acuerdos principales:**

| Región/País | Tipo Acuerdo | Arancel | Requisitos |
|-------------|--------------|---------|------------|
| 🇪🇺 UE (27) | Mercado único | 0% | Ninguno |
| 🇬🇧 Reino Unido | TCA | 0% | EUR.1 |
| 🇨🇭 Suiza, 🇳🇴 Noruega | EFTA | 0% | EUR.1 |
| 🇯🇵 Japón | EPA | 0% | EUR.1 |
| 🇰🇷 Corea del Sur | FTA | 0% | EUR.1 |
| 🇨🇦 Canadá | CETA | 0% | EUR.1 |
| 🇲🇽 México | FTA | 0% | EUR.1 |
| 🇻🇳 Vietnam | EVFTA | 0% | EUR.1 |
| 🇨🇳 China | Sin acuerdo | ERGA OMNES | N/A |
| 🇺🇸 Estados Unidos | Sin acuerdo | ERGA OMNES | N/A |

**Tabla:** `countries` con campos:
- `code`: Código ISO 2 letras
- `name_es`: Nombre en español
- `name_en`: Nombre en inglés
- `has_agreement`: boolean
- `agreement_type`: tipo de acuerdo
- `requires_certificate`: boolean

---

## 🔒 Seguridad

### Autenticación
- **JWT tokens** con Supabase Auth
- **Session management** automático
- **Refresh tokens** rotatorios (renovación cada 1h)
- **Secure cookies** con `httpOnly` y `sameSite`

### Protección de datos
- **Row Level Security (RLS)** en TODAS las tablas de usuario
- Cada usuario solo ve sus propios datos
- Queries automáticamente filtradas por `auth.uid()`
- Service Role Key nunca expuesta al cliente

### APIs
- **Validación de entrada** en todas las rutas
- **Rate limiting** (próximamente)
- **CORS** configurado correctamente
- **Error handling** sin exponer detalles internos

### Variables de entorno
- **Nunca commiteadas** en git (`.gitignore`)
- **NEXT_PUBLIC_*** visibles en cliente (solo URLs públicas)
- **Secrets** solo en servidor (Service Keys, API Keys)

---

## 🤖 Clasificador IA - Detalles Técnicos

### Modelo utilizado

**Claude Sonnet 4.5** (`claude-sonnet-4-5-20250929`)
- Versión más reciente de Anthropic
- Mejor razonamiento para tareas complejas
- Contexto: 200K tokens
- Coste: $3 por 1M tokens de entrada, $15 por 1M salida

### Prompt Engineering

El prompt incluye:

1. **Reglas Generales de Interpretación (RGI) completas**
   - RGI 1: Títulos son indicativos
   - RGI 2: Artículos incompletos
   - RGI 3: Materia que confiere carácter esencial
   - RGI 4: Artículos similares
   - RGI 5: Envases
   - RGI 6: Subpartidas

2. **Búsqueda contextual en base de datos**
   - Extrae keywords de la descripción del usuario
   - Busca hasta 50 códigos relacionados en tabla `descriptions`
   - Agrupa por capítulos para dar contexto
   - Proporciona 15 códigos más relevantes al modelo

3. **Metodología estructurada**
   - Identificar función principal
   - Determinar materia constitutiva
   - Analizar características esenciales
   - Aplicar RGI en orden
   - Considerar Notas de Sección/Capítulo
   - Verificar conjuntos/surtidos
   - Elegir partida → subpartida → código completo

4. **Validación post-clasificación**
   - Verifica que el código existe en tabla `tariffs`
   - Obtiene arancel ERGA OMNES
   - Valida códigos alternativos también
   - Marca cada código como `validated: true/false`

### Tokens consumidos

**Por clasificación típica:**
- Prompt: ~1,200 tokens
- Respuesta: ~400 tokens
- **Total: ~1,600 tokens**
- **Coste: $0.0048** (0.48 céntimos)

**Escalabilidad:**
- 100 clasificaciones/mes: $0.48
- 1,000 clasificaciones/mes: $4.80
- 10,000 clasificaciones/mes: $48
- 100,000 clasificaciones/mes: $480

**Comparativa con planes:**
- Plan Pro €29/mes → 100 clasificaciones incluidas
- Coste IA: $0.48 → **Margen: 98.3%**

### Diferencial vs ChatGPT/Claude gratis

**ChatGPT/Claude (gratis):**
- ❌ Datos hasta enero 2025 (desactualizados)
- ❌ No acceso a EUR-Lex actual
- ❌ No verifica contra base TARIC
- ❌ No tiene tipos de cambio BCE
- ❌ Puede inventar códigos
- ❌ No integra con calculadora

**LexAduana Clasificador:**
- ✅ Base de datos actualizada octubre 2025
- ✅ Validación contra 20,000 códigos TARIC reales
- ✅ Búsqueda contextual de códigos relacionados
- ✅ Tipos de cambio BCE vigentes
- ✅ Integración directa con calculadora
- ✅ Historial auditable
- ✅ Referencias normativas EUR-Lex
- ✅ Países de origen recomendados
- ✅ Alertas TARIC específicas

**Valor añadido:** Capa de datos oficiales + validación + automatización

---

## 💰 Modelo de Negocio

### Planes propuestos

| Plan | Precio | Clasificador IA | Bulk | Favoritos | Historial |
|------|--------|-----------------|------|-----------|-----------|
| **Free** | €0 | ❌ | ❌ | ❌ | 7 días |
| **Pro** | €29/mes | ✅ 100/mes | ✅ | ✅ | Ilimitado |
| **Business** | €99/mes | ✅ Ilimitado | ✅ | ✅ | Ilimitado + Export |
| **Enterprise** | Custom | ✅ Ilimitado | ✅ API | ✅ | Dedicado |

### Costes operativos estimados

**Por 100 usuarios Pro:**
- Ingresos: 100 × €29 = **€2,900/mes**
- Clasificador IA: 100 × 100 × $0.0048 = **$48/mes** (~€45)
- Supabase: Free tier (hasta 500MB DB)
- Vercel: Free tier (hasta 100GB bandwidth)
- **Margen: ~98.5%**

**Escalabilidad:**
- Hasta 1,000 usuarios: Mismo coste fijo
- Claude API: Sin límite con balance positivo
- Supabase Pro: $25/mes (si >500MB)
- Vercel Pro: $20/mes (si >100GB)

---

## 📊 Roadmap

### ✅ Completado (v4.0 - Octubre 2025)

#### 🤖 Clasificador IA
- Claude Sonnet 4.5 integrado
- Prompt con RGI completas
- Búsqueda contextual en base de datos
- Validación contra TARIC
- Códigos alternativos con confianza
- Países de origen recomendados
- Integración con calculadora
- Banner promocional en home
- Accesos desde todas las páginas

#### 📊 Calculadora Bulk
- Procesamiento CSV hasta 100 productos
- Export Excel profesional (4 sheets)
- Validación completa pre-procesamiento
- Estadísticas agregadas
- Preview de datos

#### 💱 Tipos de Cambio
- 30 monedas BCE
- Actualización mensual desde BOE
- Conversión automática en calculadora
- Widget en página principal
- Página dedicada `/tipos-cambio`
- Lógica vigencia (actual vs próximo)
- Banner automático cuando hay tipos nuevos
- Cumplimiento Reglamento UE 2447/2015

#### ⚖️ Comparador Multi-Origen
- Comparación 5 países simultáneos
- Detección mejor opción automática
- Cálculo de ahorro
- Alertas específicas por país

#### 🎨 UX/UI Premium
- Colores corporativos (#0A3D5C, #F4C542)
- Quick Access Buttons en calculadora
- Banner promocional clasificador
- Diseño "Minimalista Premium"
- Landing profesional
- Footer con normativa legal

#### 🗄️ Datos y Base
- 85,000+ registros TARIC
- 195 países con acuerdos
- Sistema usuarios + dashboard
- Favoritos funcionales
- Export Excel historial
- Glosario 25 términos
- Row Level Security completo

---

### 🔜 Próximamente (v4.1 - Noviembre 2025)

#### 📚 Recursos Profesionales
- Página `/recursos` con enlaces curados
- Categorías: Organismos, Trámites, Bases datos, etc
- 50+ enlaces útiles para aduaneros
- Sincronización en nube (no perder al cambiar trabajo)

#### 📊 Sistema de Límites/Créditos
- Tabla `user_subscriptions` en Supabase
- Contador uso clasificador IA
- Límites por plan (Free: 5/mes, Pro: 100/mes)
- Upgrade prompt cuando se acaben
- Dashboard con uso mensual

#### 📈 Analytics y Métricas
- Dashboard admin con KPIs
- Usuarios activos/registros
- Clasificaciones más frecuentes
- Errores comunes
- Monitoreo costes API

---

### 🚀 Futuro (v5.0 - 2026)

#### 🔌 API Pública
- Endpoints RESTful documentados
- API keys por usuario
- Rate limiting por tier
- Documentación Swagger/OpenAPI
- Webhooks para alertas
- Logs de uso detallados

#### 📱 PWA / App Móvil
- Progressive Web App
- Modo offline básico
- Notificaciones push (alertas TARIC)
- Instalable en móvil
- Cámara para escanear códigos HS

#### 🤝 Integraciones
- ERPs (SAP, Sage, etc)
- Plataformas logística (DHL, UPS)
- Marketplaces (Amazon, eBay)
- Webhooks personalizados

#### 🧠 IA Avanzada
- Fine-tuning modelo con datos históricos
- Predicción de reclasificaciones
- Detección automática cambios EUR-Lex
- Alertas proactivas de cambios normativos
- OCR para documentos aduaneros

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

## 🎯 Contexto del Proyecto

### Visión
Convertir LexAduana en **la plataforma de referencia** para cálculo de aranceles en España y la UE, combinando:
- Datos oficiales actualizados (EUR-Lex, BCE)
- Inteligencia artificial (Claude)
- Experiencia de usuario premium
- Herramientas profesionales (bulk, comparador)

### Diferenciadores clave
1. **Clasificador IA con validación TARIC** - Único en el mercado
2. **Datos actualizados mensualmente** - EUR-Lex oficial
3. **Calculadora bulk profesional** - Export Excel 4 sheets
4. **Tipos de cambio BCE** - Cumplimiento normativo
5. **Experiencia premium** - No es una hoja Excel glorificada

### Competencia
- **Calculadoras básicas**: No tienen IA, bulk limitado, sin validación
- **Clasificadores IA genéricos**: No integran cálculo, no validan contra TARIC
- **Software enterprise**: Caro, complejo, orientado a grandes empresas

**Posicionamiento**: Herramienta profesional accesible para PYMES, autónomos y agentes de aduanas.

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

**Archivos afectados:**
- `app/api/classify-product/route.js` ✅ Arreglado
- `app/api/calculations/save/route.js` ✅ Arreglado
- `app/api/favorites/route.js` ✅ Arreglado

---

### Error: Module not found 'xlsx'

**Síntoma:**
```
Module not found: Can't resolve 'xlsx'
```

**Solución:**
```bash
npm install xlsx
```

---

### Error: API Key Anthropic inválida

**Síntoma:**
```
Error: 401 Unauthorized
```

**Solución:**
1. Verificar que `ANTHROPIC_API_KEY` está en `.env.local`
2. Verificar que empieza con `sk-ant-api03-`
3. Reiniciar servidor: `npm run dev`
4. En Vercel: añadir en Environment Variables

---

### Error: Classification model not found

**Síntoma:**
```
Error: 404 model: claude-sonnet-4.5-20250929 was not found
```

**Solución:**
El nombre correcto es `claude-sonnet-4-5-20250929` (con guiones en lugar de punto).

**Archivo:** `app/api/classify-product/route.js` línea 97

---

## 🙏 Agradecimientos

- **Anthropic** - Por Claude Sonnet 4.5
- **Vercel** - Por el hosting y edge functions
- **Supabase** - Por la base de datos y auth
- **EUR-Lex** - Por los datos TARIC públicos
- **BCE** - Por los tipos de cambio oficiales

---

**Desarrollado con ❤️ por Carlos para el equipo de LexAduana**

*Última actualización: Octubre 2025*
*Versión: 4.0.0*
