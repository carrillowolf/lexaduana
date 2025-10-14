# 📊 Calculadora TARIC - LexAduana

> Plataforma profesional de cálculo de aranceles e IVA para importaciones a España y la Unión Europea con sistema de usuarios y historial.

[![Versión](https://img.shields.io/badge/versión-3.0.0-blue.svg)](https://lexaduana.es)
[![Estado](https://img.shields.io/badge/estado-producción-brightgreen.svg)](https://lexaduana.es)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-enabled-green.svg)](https://supabase.com)

🌐 **En producción:** [lexaduana.es](https://lexaduana.es)

---

## 🚀 Características Principales

### ✅ Calculadora Profesional
- **Cálculo preciso** de aranceles e IVA según normativa europea
- **195+ países** soportados con preferencias comerciales
- **IVA variable inteligente**: 4% / 10% / 21% según producto
- **Alertas TARIC**: Certificados y requisitos por código HS
- **Exclusiones por país**: Sistema automático de medidas aplicables
- **Descripciones jerárquicas**: HS2 → HS4 → HS6 → HS10

### 👤 Sistema de Usuarios
- **Autenticación** con Supabase Auth (Email/Password)
- **Dashboard personal** con estadísticas
- **Historial completo** de cálculos
- **Guardado automático** de cada consulta
- **Row Level Security** (cada usuario ve solo sus datos)

### 📊 Dashboard Profesional
- **Estadísticas en tiempo real**:
  - Total de cálculos realizados
  - Actividad últimos 7 días
  - Número de países consultados
- **Tabla de historial** con búsqueda y filtros
- **Exportación** a Excel (próximamente)

### 🎨 Experiencia de Usuario
- **Diseño responsive** optimizado para móvil y desktop
- **Autocomplete inteligente** con búsquedas recientes
- **Badges visuales** según prioridad de alertas
- **Exportación PDF** de resultados individuales

---

## 🏗️ Arquitectura del Proyecto
```
calculadora-taric-lexaduana/
├── 📁 app/                    # Next.js 15 App Router
│   ├── api/                   # APIs serverless
│   │   ├── calculate/         # Cálculo de aranceles
│   │   ├── search-codes/      # Búsqueda códigos HS
│   │   └── calculations/      # Gestión de historial
│   │       ├── save/          # Guardar cálculo
│   │       └── history/       # Obtener historial
│   ├── auth/                  # Autenticación
│   │   ├── login/            # Página de login
│   │   ├── register/         # Registro usuarios
│   │   └── callback/         # Callback OAuth
│   ├── dashboard/            # Dashboard usuario
│   ├── monitor/              # Monitoreo sistema
│   ├── page.js               # Calculadora principal
│   └── layout.js             # Layout global
├── 📁 components/            # Componentes React
│   ├── UserMenu.js          # Menú autenticación
│   ├── HSCodeAutocomplete.js # Búsqueda HS codes
│   ├── ExportPDF.js         # Exportación PDF
│   ├── HeroSection.js       # Sección hero
│   └── FeaturesSection.js   # Características
├── 📁 lib/                   # Utilidades
│   ├── supabase.js          # Cliente Supabase server
│   ├── supabase-browser.js  # Cliente Supabase client
│   └── vatCalculator.js     # Lógica IVA variable
├── 📁 scripts/              # Scripts procesamiento
│   ├── processMeasures.js   # Procesar alertas CSV
│   └── processExclusions.js # Procesar exclusiones CSV
└── 📁 public/               # Archivos estáticos
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
| `vat_rates` | 50+ | Tipos de IVA por código HS |
| `user_calculations` | ∞ | Historial usuarios |

**Total:** 49,700+ registros estáticos + historial dinámico

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Next.js 15** con App Router y Server Components
- **React 18** con Hooks
- **TailwindCSS** para estilos
- **JavaScript ES6+** modular

### Backend
- **Next.js API Routes** (serverless)
- **Supabase** (PostgreSQL + Auth + Storage)
- **Row Level Security** para protección de datos

### Autenticación
- **Supabase Auth** con múltiples providers
- **JWT tokens** seguros
- **Session management** automático

### DevOps
- **GitHub** para control de versiones
- **Vercel** para deployment automático
- **Edge CDN** para recursos estáticos

---

## 📋 Requisitos Previos

- Node.js >= 18.0.0
- npm >= 8.0.0
- Cuenta de Supabase
- Cuenta de Vercel (para deployment)

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
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_KEY=tu_service_role_key
```

### 4. Desarrollo local
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

---

## 🗄️ Configuración Base de Datos

### Crear tablas en Supabase

Ejecutar los scripts SQL en Supabase SQL Editor:

1. **Tabla de cálculos de usuarios:**
```sql
-- Ver archivo: docs/sql/user_calculations.sql
```

2. **Tabla de alertas TARIC:**
```sql
-- Ver archivo: docs/sql/measure_alerts.sql
```

3. **Tabla de exclusiones:**
```sql
-- Ver archivo: docs/sql/measure_exclusions.sql
```

4. **Tabla de tipos de IVA:**
```sql
-- Ver archivo: docs/sql/vat_rates.sql
```

### Procesar datos CSV
```bash
# Procesar alertas de medidas
node scripts/processMeasures.js

# Procesar exclusiones por país
node scripts/processExclusions.js
```

---

## 🌐 Deployment en Vercel

### Configuración automática

1. Conectar repositorio GitHub con Vercel
2. Configurar variables de entorno en Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
3. Deploy automático en cada push a `main`

### Dominio personalizado

Configurar en Vercel Dashboard → Settings → Domains:
- `lexaduana.es`
- `www.lexaduana.es`

---

## 📖 Uso de la API

### Endpoint: Cálculo Individual
```bash
POST /api/calculate
Content-Type: application/json

{
  "hsCode": "84713000",
  "countryCode": "CN",
  "cifValue": 1000
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "hsCode": "8471300000",
    "description": "...",
    "duty": {
      "standardRate": 3.5,
      "appliedRate": 3.5,
      "amount": 35.00
    },
    "vat": {
      "rate": 21,
      "type": "general",
      "amount": 217.35
    },
    "total": 1252.35,
    "alerts": [...]
  }
}
```

### Endpoint: Guardar Cálculo (requiere auth)
```bash
POST /api/calculations/save
Authorization: Bearer {token}
Content-Type: application/json

{
  "hsCode": "8471300000",
  "cifValue": 1000,
  ...
}
```

### Endpoint: Historial (requiere auth)
```bash
GET /api/calculations/history?limit=50&offset=0
Authorization: Bearer {token}
```

---

## 🎨 Sistema de IVA Variable

### Tipos de IVA soportados:

| Tipo | % | Ejemplos |
|------|---|----------|
| **Superreducido** | 4% | Pan, leche, frutas, verduras, medicamentos, libros |
| **Reducido** | 10% | Alimentos procesados, transporte, hostelería |
| **General** | 21% | Resto de productos |

### Lógica de aplicación:

1. **Búsqueda en tabla:** Consulta `vat_rates` por código HS (cascada 10→8→6→4→2 dígitos)
2. **Reglas por capítulo:** Si no existe en tabla, aplica reglas según capítulo HS
3. **Fallback:** Si no aplica ninguna regla, usa IVA general (21%)

---

## 🚨 Sistema de Alertas TARIC

### Tipos de alertas:

- 📋 **Certificados**: C074 (fitosanitario), C078 (origen), etc.
- 📊 **Licencias**: U088 (licencia importación)
- 🚫 **Sanciones**: Medidas restrictivas por país
- ℹ️ **Condiciones**: Cuotas, requisitos especiales

### Prioridad visual:

- 🚨 **Crítico (1)**: Fondo rojo - Sanciones
- ⚠️ **Importante (2)**: Fondo amarillo - Certificados obligatorios
- ℹ️ **Informativo (3)**: Fondo azul - Información adicional

---

## 🌍 Países con Acuerdos Comerciales

Ejemplos de acuerdos soportados:

- 🇪🇺 **Unión Europea**: 0% (mercado interior)
- 🇨🇭 **Suiza**: 0% (EFTA)
- 🇯🇵 **Japón**: 0% (EPA)
- 🇰🇷 **Corea del Sur**: 0% (FTA)
- 🇨🇦 **Canadá**: 0% (CETA)
- 🇲🇽 **México**: 0% (FTA)

**Total:** 195+ países con información actualizada

---

## 🔒 Seguridad

### Autenticación
- JWT tokens seguros con Supabase Auth
- Session management automático
- Refresh tokens rotativo

### Protección de datos
- **Row Level Security (RLS)** en todas las tablas de usuario
- Cada usuario solo accede a sus propios datos
- Variables de entorno nunca expuestas al cliente

### APIs
- Validación de entrada en todas las rutas
- Rate limiting (próximamente)
- CORS configurado correctamente

---

## 📊 Roadmap

### ✅ Completado (v3.0)
- Sistema de autenticación completo
- Dashboard con historial
- IVA variable inteligente
- Alertas TARIC por país
- Exclusiones automáticas

### 🚧 En desarrollo (v3.1)
- [ ] Exportación Excel del historial
- [ ] Filtros avanzados en dashboard
- [ ] Búsqueda en historial
- [ ] Tags personalizados

### 📅 Próximamente (v4.0)
- [ ] Calculadora masiva/bulk (CSV upload)
- [ ] Simulador de costes totales
- [ ] API pública con documentación
- [ ] Integración con ERPs
- [ ] Asistente IA para clasificación

---

## 🤝 Contribución

Este es un proyecto privado de **LexAduana**. 

Para consultas o colaboraciones: **soporte@lexaduana.es**

---

## 📄 Licencia

© 2024-2025 LexAduana. Todos los derechos reservados.

**Términos de uso:**
- ✅ Uso personal/profesional permitido
- ❌ Redistribución prohibida
- ❌ Uso comercial por terceros prohibido

---

## 📞 Soporte

- **Email**: soporte@lexaduana.es
- **Web**: [lexaduana.es](https://lexaduana.es)
- **Horario**: Lunes a Viernes, 9:00-18:00 (CET)

---

## 📚 Documentación Adicional

- [Guía de Usuario](docs/user-guide.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Changelog](CHANGELOG.md)

---

**Desarrollado con ❤️ por el equipo de LexAduana**

*Última actualización: Octubre 2025*