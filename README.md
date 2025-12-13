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
- **Preferencias implícitas**: Acuerdos de Asociación (Marruecos, Túnez, etc.)
- **Actualización mensual simplificada**: Script automatizado

### 🔧 Cambios técnicos:
- Nuevo `calculateTariff.js` optimizado para tabla unificada
- Preferencias implícitas para acuerdos de libre comercio
- Filtrado de alertas por país de origen
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
- **Contingentes arancelarios**: Detección automática de cuotas disponibles
- **Preferencias implícitas**: Acuerdos de Asociación aplicados automáticamente
- **Descripciones jerárquicas**: HS2 → HS4 → HS6 → HS10
- **Tipos de cambio BCE**: 30 monedas con actualización mensual

### 🚨 Sistema de Alertas TARIC
- **251 códigos traducidos** al español con iconos descriptivos
- **79 tipos de medida**: aranceles, controles, sanciones, anti-dumping...
- **85 tipos de certificados**: C074, E017, U088, Y864...
- **Filtrado por origen**: Solo muestra alertas relevantes al país consultado
- **Grupos geográficos**: 12 áreas (ERGA OMNES, SGP, América Central...)
- **Prioridades visuales**: Crítico (rojo), Importante (ámbar), Info (azul)
- **Texto expandible**: Ver descripción EUR-Lex original

### 🤖 Clasificador IA
- **Claude Sonnet 4.5**: Clasificación inteligente de productos
- **Descripción en lenguaje natural**: "Tablets con teclado..." → Código TARIC
- **Validación contra base TARIC**: Verifica que códigos existan
- **Códigos alternativos**: Múltiples opciones con nivel de confianza
- **Razonamiento explicado**: Aplica Reglas Generales de Interpretación
- **Alertas CBAM**: Aviso automático si el código sugerido está afectado
- **Integración directa**: Calcula aranceles automáticamente

### 🌍 Módulo CBAM
Mecanismo de Ajuste en Frontera por Carbono - Preparado para 2026

#### Verificador de Códigos (`/cbam`)
- **40+ códigos CN** de los 6 sectores afectados
- **Detección automática** por código HS (8 dígitos)
- **Información del sector**: Cemento, Hierro/Acero, Aluminio, Fertilizantes, Hidrógeno, Electricidad

#### Simulador de Coste de Certificados
- **Valores por defecto UE**: Factores de emisión oficiales (tCO2/t)
- **Precio EU ETS actual**: ~€68.50/tCO2 (actualizable)
- **Cálculo instantáneo**: Toneladas × Factor × Precio

**Sectores afectados:**
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

### ⚖️ Comparador Multi-Origen
- **5 países simultáneos**: Compara costes totales
- **Detección automática**: Mejor opción económica
- **Ahorro calculado**: Diferencia en € entre opciones

### 💱 Sistema Tipos de Cambio
- **30 monedas BCE**: Actualización mensual desde BOE
- **Conversión automática**: Integrada en calculadora
- **Cumplimiento normativo**: Reglamento UE 2447/2015

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
│   │   └── favorites/            # Gestión favoritos
│   ├── auth/                     # Autenticación
│   ├── admin/                    # Panel administración
│   ├── dashboard/                # Dashboard usuario
│   ├── calculadora/              # Calculadora principal
│   ├── clasificador/             # Clasificador IA
│   ├── cbam/                     # Módulo CBAM
│   ├── bulk/                     # Calculadora masiva
│   ├── comparador/               # Comparador multi-origen
│   └── tipos-cambio/             # Tipos de cambio
├── 📁 components/                # Componentes React
├── 📁 lib/                       # Utilidades
│   ├── calculateTariff.js        # 🆕 Módulo cálculo v4.3
│   ├── taricTranslations.js      # 251 códigos traducidos
│   ├── cbamData.js               # Datos CBAM
│   ├── csvParser.js              # Parser CSV bulk
│   └── excelExporter.js          # Exportador Excel
├── 📁 lexaduana-migration/       # 🆕 Scripts actualización mensual
│   ├── import-all-taric.js       # Importador Excel → Supabase
│   └── ACTUALIZACION_MENSUAL.md  # Guía de actualización
└── 📁 public/                    # Assets estáticos
```

---

## 🗄️ Base de Datos (Supabase)

### Tablas principales (v4.3)

```sql
-- Nueva estructura unificada
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

-- Tablas de usuario
calculations            -- Historial de cálculos
favorites               -- Favoritos guardados
```

### Actualización mensual de datos

```bash
cd lexaduana-migration/

SUPABASE_URL="https://tu-proyecto.supabase.co" \
SUPABASE_SERVICE_KEY="tu-api-key" \
node import-all-taric.js measures

# Repetir para conditions y exclusions
```

Ver `lexaduana-migration/ACTUALIZACION_MENSUAL_TARIC.md` para guía completa.

---

## 🔒 Seguridad Implementada

### Credenciales
- **Nunca hardcodear** API keys en el código
- Usar **variables de entorno** en terminal para scripts
- Keys de Supabase en **Vercel Environment Variables**

### Rate Limiting (Upstash Redis)
- Clasificador IA: 20 peticiones/hora por usuario
- Calculadora: 150 peticiones/minuto por IP

### Validación de Entrada
- Sanitización contra XSS/SQL injection
- Validación de códigos HS (solo numéricos)

---

## 🛠️ Instalación Local

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/lexaduana.git
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
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
ANTHROPIC_API_KEY=sk-ant-api03-xxx
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

---

## 📈 Roadmap

### ✅ Completado (v4.3 - Diciembre 2025)
- Nueva base de datos unificada TARIC
- 207,769 registros EUR-Lex oficiales
- Preferencias implícitas por acuerdo
- Script actualización mensual

### 🔜 Próximamente (v4.4 - Q1 2026)
- Servicio IAV (Información Arancelaria Vinculante)
- Sistema de Alertas Personalizadas
- OCR Facturas Comerciales

---

## 🎯 Diferenciadores Clave

1. **207,769 registros EUR-Lex oficiales** - La base de datos TARIC más completa
2. **Clasificador IA con validación TARIC** - Único en el mercado español
3. **Preferencias implícitas** - Acuerdos de Asociación aplicados automáticamente
4. **Módulo CBAM completo** - Verificador + Simulador + Alertas
5. **Actualización mensual automatizada** - Datos siempre al día

---

## 📞 Soporte

- **Email**: soporte@lexaduana.es
- **Web**: [lexaduana.es](https://lexaduana.es)

---

## 🙏 Agradecimientos

- **Anthropic** - Por Claude Sonnet 4.5
- **Vercel** - Por el hosting y edge functions
- **Supabase** - Por la base de datos y auth
- **EUR-Lex** - Por los datos TARIC públicos
- **BCE** - Por los tipos de cambio oficiales

---

**Desarrollado con ❤️ por Carlos para LexAduana**

*Última actualización: Diciembre 2025*
*Versión: 4.3.0*
