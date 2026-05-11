# 📊 LexAduana - Suite Profesional de Comercio Exterior

> Plataforma SaaS de herramientas aduaneras para importaciones a España y la Unión Europea: calculadora de aranceles, clasificador IA, verificador CBAM, simulador de costes y más.

[![Versión](https://img.shields.io/badge/versión-5.19.0-blue.svg)](https://lexaduana.es)
[![Estado](https://img.shields.io/badge/estado-producción-brightgreen.svg)](https://lexaduana.es)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-enabled-green.svg)](https://supabase.com)
[![Claude](https://img.shields.io/badge/Claude-4.5-purple.svg)](https://anthropic.com)
[![TARIC](https://img.shields.io/badge/TARIC-Abril_2026-orange.svg)](https://taxation-customs.ec.europa.eu)
[![i18n](https://img.shields.io/badge/i18n-ES%20%7C%20EN-blueviolet.svg)](https://lexaduana.es)

🌐 **En producción:** [lexaduana.es](https://lexaduana.es)

---

## 🎯 Visión

LexAduana evoluciona de calculadora a **suite profesional de comercio exterior**, ofreciendo herramientas especializadas bajo una misma plataforma:

```
lexaduana.es
├── 🧮 Calculadora TARIC        (disponible)
│   └── 🆕 Requisitos Documentales (motor de interpretación TARIC)
├── 🤖 Clasificador IA          (disponible)
├── ⚖️ Comparador Multi-Origen  (disponible)
├── 📋 Gestor de Despachos      (disponible)
├── 🌍 Módulo CBAM              (disponible)
│   ├── Verificador de códigos
│   ├── 🆕 Diagnóstico CBAM (Nivel 2 cualitativo)
│   ├── Self-Assessment (573 CN)
│   ├── Alertas en calculadora
│   └── 🆕 Asesoría Premium (Phase 2)
│       ├── Intake wizard (3 pasos)
│       ├── Motor de cálculo
│       └── Gestión solicitudes
├── 🌳 EUDR Deforestación       (informativo)
│   └── Guía regulatoria completa
├── 📦 Incoterms 2020           (disponible)
│   ├── Tabla COSTE/RIESGO (10 etapas, estilo TIBA)
│   ├── Valor en aduana e Incoterms
│   ├── Wizard de decisión ICC
│   └── Guía de impacto aduanero
├── ⚖️ Valor en Aduana           (disponible)
│   ├── 6 métodos de valoración CAU
│   ├── Wizard ajustes por Incoterm
│   ├── Ajustes obligatorios art. 71/72
│   ├── Base arancel vs base IVA (3 ejemplos)
│   ├── DV1 + tabla casillas DUA/H1
│   └── 6 casos problemáticos reales
├── 🔄 Monitor Cambios TARIC     (disponible)
│   ├── Detección automática de cambios mensuales
│   ├── Top 10 mayores cambios arancelarios
│   ├── Tabla de capítulos con desglose
│   ├── Detalle por partida/capítulo
│   └── Conclusiones automáticas del mes
├── 📑 Solicitud RRM             (disponible)
│   ├── Wizard 4 pasos (selector → H1 → revisión → DOCX)
│   ├── 6 tipos de caso (preferencia, clasificación, origen, valoración, defectuosa, error autoridad)
│   ├── Parser H1 XML tolerante (extrae MRN, EORIs, partidas)
│   ├── Generador DOCX AEAT (art. 116-120 CAU)
│   └── Borradores en Supabase (sin datos bancarios, GDPR)
├── 🌐 Soporte bilingüe ES/EN    (disponible)
│   └── 90%+ cobertura — 29 páginas/componentes
├── 📄 Servicio IAV             (próximamente)
└── 🔗 Integraciones AEAT       (en desarrollo)
```

---

## 🆕 Novedades v5.20.0 (Mayo 2026)

Sesión cerrando **Phase 7 del plan GDPR**: panel ARSULIPO en `/dashboard/privacidad` para ejercer los 6 derechos del usuario (Acceso, Rectificación, Supresión, Limitación, Portabilidad, Oposición). Completa el ciclo iniciado en Phase 4 (consentimientos IA) y Phase 8 (baja de cuenta con pseudonimización).

### 🛡️ Panel `/dashboard/privacidad` — 5 cards

Primera subruta nueva del dashboard, columna única (`max-w-3xl`), patrón visual coherente con el resto de la suite (`bg-white border-slate-200 rounded-2xl shadow-sm`). Auth gate redirige a `/auth/login` si no hay sesión.

- **Card 1 — Acceso y portabilidad** (art. 15 y 20 RGPD): botón "Descargar mis datos (JSON)" con `loading` state y manejo de error. Filename leído desde `Content-Disposition` del response. Descarga vía `fetch` + `blob` + click sintético en `<a download>`.
- **Card 2 — Rectificación**: informativa. Los datos personales editables (email, contraseña, `company_name`) se modifican vía `privacidad@lexaduana.es` previa verificación de identidad. Otros campos (`plan_type`, `max_monitors`) son metadatos contractuales gestionados por el sistema. Edición directa diferida a futuras versiones.
- **Card 3 — Limitación**: fetch a `/api/consent/check` por cada tipo IA (`ai_processing_classifier`, `ai_processing_ocr_invoice`) en paralelo. Lista los activos con fecha y versión de política, botón "Revocar" por cada uno (`POST /api/consent/revoke`). Refresca la lista tras revocación. Si no hay activos, mensaje informativo. Tras revocar, el modal de consent reaparece la próxima vez que se use el clasificador o el OCR.
- **Card 4 — Oposición**: informativa. LexAduana no realiza tratamientos basados en interés legítimo del responsable ni en consentimiento revocable selectivamente; no envía comunicaciones comerciales propias. Redirige a Limitación (IA) y Supresión (derecho al olvido) según el caso.
- **Card 5 — Supresión**: reutiliza el componente `<DeleteAccountButton/>` de Phase 8 (cero duplicación de lógica). Doble `confirm()` + `POST /api/account/delete`. Botón presente también en zona peligrosa de `/dashboard`.

### 📤 Endpoint `/api/account/export` — JSON único

Implementa los derechos de **Acceso (art. 15)** y **Portabilidad (art. 20)** con un solo endpoint y un solo formato (decisión cerrada: JSON único, no ZIP+CSV).

- **Auth**: `createRouteHandlerClient({ cookies })` + `getUser()`. `401` si no hay sesión.
- **Perfil**: solo `email`, `company_name`, `created_at`. `plan_type` y `max_monitors` quedan fuera (metadatos contractuales, no PII).
- **Tablas planas en paralelo (`Promise.all`)**: `user_consents`, `classification_logs`, `invoice_extractions`, `rrm_requests`, `cbam_calculator_saves`, `monitored_codes` → `alerts`, `user_favorites` → `favorites`, `user_calculations`.
- **Dispatches en 2 secciones**:
  - `created_by_me`: todos los campos de los dispatches donde `created_by = user.id`.
  - `assigned_to_me_only`: campos mínimos (`id`, `created_at`, `status`, `assigned_to`, `created_by`) de dispatches donde `assigned_to = user.id AND created_by != user.id`, con `_note` explicando por qué se restringe el contenido (privacidad del creador).
- **Texto libre con doble filtro**: `dispatch_comments` y `dispatch_timeline` se restringen a `(user_id|created_by = user.id) AND dispatch_id IN (dispatches propios)` para no exfiltrar texto libre escrito por el user sobre dispatches de terceros (campos `description`, `old_value`, `new_value`, `comment_text`).
- **CBAM advisory anidado**: `cbam_advisory_requests` del user con sus `documents`, `products`, `reports`, `report_downloads` mergeados como arrays por `request_id` (dos pasadas + merge en JS).
- **`stripInternal`**: regex `/_hash$/` y `/^_deprecated_/` aplicado a todas las filas — excluye `user_id_hash`, `created_by_hash`, `assigned_to_hash` y cualquier columna marcada como deprecated. `user_id` y `created_by` en claro se conservan (son SUS datos).
- **`safeQuery` wrapper**: cada query envuelta en try/catch + log con `safe-logger`. Si una tabla falla, su sección queda como `[]` y el resto del export se entrega. Política: export parcial preferible a export bloqueado por una tabla.
- **Response**: `200`, `Content-Type: application/json; charset=utf-8`, `Content-Disposition: attachment; filename="lexaduana-export-{user_id}-{YYYYMMDD}.json"` (fecha UTC), `Cache-Control: no-store`. Body con `JSON.stringify(..., null, 2)` para legibilidad.

### 🔒 Enlace en `/dashboard`

Nueva card en el grid de "Accesos rápidos" tras `/bulk` y antes del condicional de Export Excel:

```
┌─────────────────────────────────┐
│ 🔒  Privacidad y derechos       │
│     Accede a tus datos,         │
│     gestiona consentimientos    │
│     y ejerce tus derechos RGPD. │
└─────────────────────────────────┘
```

Estilo idéntico al patrón de cards "tipo navy" del grid (border navy `#0A3D5C` en hover, mismo padding, mismo wrapper de icono). Texto en castellano hardcoded (sin `t(...)`) por la restricción acordada de no tocar `lib/i18n/*` en esta tarea — deuda técnica anotada.

### 🧪 Verificación end-to-end

Flujo Revocar → re-aceptar validado en preview de Vercel con la cuenta admin contra el Supabase de producción:

1. Aceptar consent IA del clasificador → fila activa en `user_consents` con `policy_version='2026-05-10'`.
2. Revocar desde `/dashboard/privacidad` → la fila pasa a `revoked_at != null`.
3. El endpoint `/api/consent/revoke` marca todas las filas activas de ese `consent_type` para el user (defense in depth contra duplicados, aunque `unique_active_consent` debería garantizar siempre una sola).
4. Visitar `/clasificador` → reaparece el modal de consent.
5. Aceptar de nuevo → nueva fila activa con `policy_version` actual.
6. Card 3 vuelve a listar el consent con la nueva fecha.

Query de auditoría sobre `user_consents` confirma el rastro completo (4 filas para el flujo del clasificador: original `2026-05-06` revocada, re-aceptación `2026-05-10` revocada por el botón Revocar, re-re-aceptación `2026-05-10` activa).

### Decisiones cerradas

- **Formato del export**: JSON único (cumple art. 20 — "estructurado, de uso común y lectura mecánica"). No se ofrece ZIP+CSV en esta phase.
- **Rectificación informativa**: en esta phase no hay edición directa en UI; el alcance acordado era "perfil mínimo" y aunque el schema reveló `company_name` editable, mantenemos la rectificación vía `privacidad@` previa verificación de identidad.
- **Oposición sin botones**: no hay marketing, analytics opt-out, ni tratamientos basados en interés legítimo. El texto explica el porqué y redirige a Limitación / Supresión.
- **Supresión sin duplicar lógica**: el botón vive en `/dashboard` (Zona peligrosa) y en `/dashboard/privacidad` (Card 5) reutilizando el mismo `<DeleteAccountButton/>`. Quien busca "dar de baja" lo encuentra en ambos sitios; el handler es único.
- **Texto libre con doble filtro**: `dispatch_comments` y `dispatch_timeline` filtrados por dispatches propios para evitar que un usuario que escribió en un dispatch ajeno se lleve en su export texto que cita a terceros.

### Cambios técnicos

- **2 archivos nuevos**: `app/api/account/export/route.js` (~270 líneas), `app/dashboard/privacidad/page.js` (~326 líneas).
- **1 archivo tocado**: `app/dashboard/page.js` (+13 líneas — card del grid).
- **0 migraciones SQL** (Phase 7 es UI + endpoint puro; el schema RGPD ya estaba completo tras Phase 8).
- **0 dependencias npm nuevas**.
- **Build limpio**. PR #14 mergeado a `main`.

### Plan GDPR — estado

| Phase | Tema | Estado |
|---|---|---|
| 4 | Consentimientos IA (`user_consents`, modal, `check/record/revoke`) | ✅ |
| 8 | Baja de cuenta + pseudonimización + pg_cron | ✅ |
| Punto 1 | Política de privacidad alineada con Phase 8 + bump policy_version | ✅ |
| **7** | **Panel ARSULIPO `/dashboard/privacidad` + endpoint export** | **✅ (esta sesión)** |
| 9 | Post LinkedIn anunciando cumplimiento RGPD | ⏳ Pendiente |

---

## 🆕 Novedades v5.19.0 (Mayo 2026)

Sesión de mejoras de UX en el sidebar y la calculadora, **rediseño visual completo del wizard RRM** (de dark a estética clara coherente con el resto de la suite) e **iteración mayor del módulo RRM** (parser robusto del CC415AV1Ent, soporte multi-partida y DOCX maquetado al modelo oficial AEAT del Reglamento Delegado UE 2015/2446).

### 🧭 Sidebar — CBAM padre clickeable

El item "CBAM" del sidebar ahora **navega a `/cbam`** al hacer click en la etiqueta, mientras que el chevron sigue siendo toggle independiente de la lista de sub-items (patrón Notion: padre clickeable Y desplegable). El resto de grupos del sidebar (Calculadora, Despachos, etc.) mantienen su comportamiento.

- Componente: `components/layout/AppSidebar.js` — `ExpandableNavItem` separa la zona del Link del botón del chevron.
- Auto-expansión cuando `pathname.startsWith('/cbam')`.
- Sin afectar al estado de los demás items expandibles.

### 🧮 Calculadora TARIC — rediseño visual

Sustitución de los **6 botones grandes con gradientes** (azul/verde/naranja/morado/fucsia/teal) por una estructura híbrida coherente con la estética del proyecto:

- **Fila de chips discretos** arriba a la derecha: Dashboard · Favoritos · Calc. Masiva (100 productos), en `text-slate-600 hover:text-[#0A3D5C] underline-offset-2 hover:underline`.
- **3 cards destacadas** (responsive: 3 cols desktop / 2 tablet / 1 móvil): Comparador, Clasificador IA, CBAM Verificador. Patrón `bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition` con icono navy `#0A3D5C` arriba-izquierda.
- **Sidebar derecho modernizado** (5 cards unificadas): Tipos de Cambio BCE (sin header amarillo), Búsquedas Recientes, Documentación de origen (icono limpio en navy), Importante, Verifica siempre. Tabla de tipos de cambio en `font-mono tabular-nums`. Link "Ver todos →" en navy.
- **i18n cleanup**: `"Con Claude 4.5"` → `"Detección por IA"` (ES) / `"AI-powered detection"` (EN). El producto deja de mencionar el modelo subyacente.

### 📑 Solicitud RRM — rediseño visual a estética clara

Migración del wizard `/rrm` de dark mode (`bg-[#060d16]`, `bg-[#0a1628]`, `bg-[#0d1f35]`, `border-[#1a2d4a]`, `bg-[#F4C542] text-black`) a la estética clara coherente con el resto de la suite (`bg-slate-50`, navy `#0A3D5C`, gold `#F4C542`, cards blancas con `border-slate-200 rounded-2xl shadow-sm`):

- **Hero como bloque navy** independiente con badge `bg-amber-100 text-amber-900` (estilo `/cbam`).
- **ProgressBar**: completado gold con tick, activo navy con texto blanco, pendientes `border-2 border-slate-300` blanco. Líneas conectoras `bg-slate-200` / completado `bg-[#F4C542]`.
- **Sub-cards** (Declaración, Importador, Representante, Mercancía, Contacto, Banco, Ubicación): `bg-slate-50 border-slate-200 rounded-xl p-5`.
- **Inputs**: `bg-white border-slate-300 text-slate-900 focus:border-[#0A3D5C] focus:ring-1`.
- **Dropzone**: `border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-[#0A3D5C]` + icono SVG navy (sustituye al emoji 📤).
- **Tabla DICE/DEBE DECIR**: tonos oscuros (`bg-red-950/30`, `bg-green-950/30`) → equivalentes claros (`bg-red-50`, `bg-emerald-50`, `text-red-700`, `text-emerald-700`).
- **CTA "Generar documento"**: gold `bg-[#F4C542] text-slate-900` (sustituye al gold con texto negro).
- **Botones de navegación**: "Siguiente" navy, "Atrás" blanco con borde slate.
- **Cards seleccionables del Selector**: borde navy en lugar de gold cuando seleccionadas.

### 📋 Solicitud RRM — pegar XML como texto (tabs Pegar/Subir)

Para usuarios no técnicos que no saben extraer un fichero `.xml` del visor B-First u otros sistemas AEAT pero sí pueden copiar el contenido de la pantalla, se añade en el paso 2 una estructura de **dos tabs**:

- **Tab 1 "Pegar mensaje XML"** (activa por defecto): textarea grande (`min-h-[300px] max-h-[500px]`, font-mono), botón gold "Procesar mensaje" (disabled si vacío), spinner inline durante upload.
- **Tab 2 "Subir archivo XML"**: dropzone original sin cambios.
- **Pre-procesado**: `pastedText.replace(/^-/gm, '').trim()` limpia los guiones que el visor B-First añade al inicio de cada línea (`-<CC415AV1Ent>` → `<CC415AV1Ent>`). Defensa replicada también server-side en `parseH1Xml` para clientes que llamen al endpoint directo.
- **Validación cliente**: comprueba que el texto contiene `<CC415A` o `<GoodsShipment` (tolerante a atributos como `<CC415AV1Ent xmlns="...">`).
- **Cero cambios al `onFile()` existente**: tras la validación se construye `new File([cleaned], 'pasted-xml.xml', { type: 'application/xml' })` y se pasa al handler. Mismo flujo que el dropzone real.
- Errores en bloque destacado `bg-red-50 border border-red-200 text-red-700`.

### 🚀 Solicitud RRM — wizard multi-partida + DOCX modelo AEAT estricto

**La iteración más profunda del módulo desde v5.15.0**: parser reescrito para soportar el shape oficial CC415AV1Ent del visor AEAT, soporte real para declaraciones con varias partidas afectadas y maquetación del DOCX al formato visual del Reglamento Delegado (UE) 2015/2446.

#### Parser refactorizado (`lib/rrmParser.js`)

El parser anterior usaba tags de un esquema distinto (CUSDEC, `GovernmentAgencyGoodsItem`, `dutyTaxFee`, `acceptanceDateTime`) que **no existen** en los XMLs reales que la AEAT emite hoy. Reescritura completa con extracción rica:

- **Header**: Message (id, fecha preparación → DD/MM/YYYY), ImportOperation (LRN, declarationType, additionalDeclarationType, languageCode), CustomsOfficeOfImport + Presentation, Importer, Declarant, Representative + status, Guarantee (type, GRN), GoodsShipment (natureOfTransaction, invoiceCurrency), Exporter completo, DeliveryTerms (incoterm, location, country), CountryOfDispatch, Destination (country, region), Consignment (modos transporte, grossMass, UCR, locationOfGoods, TransportDocument[]).
- **Contact**: viene de `Representative.ContactPerson` si existe, si no de `Declarant.ContactPerson`. Marcado con `contact.source: 'representative' | 'declarant'`.
- **Items** (array `GoodsShipmentItem[]`): TARIC concatenado de `harmonizedSystemSubheadingCode + combinedNomenclatureCode + taricCode`, Origin (country + preferentialOrigin), Procedure, GoodsMeasure (gross/net/supp), InvoiceLine, CalculationOfTaxes con `preference` + `DutiesAndTaxes` filtrados por `taxType=A00 → duty` / `taxType=B00 → vat` (rate, base, amount), Packaging, PreviousDocument MRN, CustomsValuation (valuationMethod + AdditionsAndDeductions con suma de códigos AK).
- **Summary**: totalItems, totalDuty, totalVAT, totalAdditions, totalInvoiceAmount, totalStatisticalValue.
- **Tolerancia**: namespaces (búsqueda por nombre local), guiones B-First, campos opcionales devuelven `null`, importes string `"83.000000"` → Number, ISO `2026-03-03T13:51:54` → `03/03/2026`.
- **Compat retro**: el endpoint sigue devolviendo `{ success: true, data }` con campos planos legacy (`mrn`, `goodsItems`, `dutiesDeclared`) en paralelo al shape rico (`header`, `contact`, `items`, `summary`).

#### Wizard multi-partida — integrado en paso 2 (no nuevo paso)

- **Card de resumen** del header tras parsing: MRN, fecha aceptación, aduana, importador (EORI · nombre), exportador (nombre), partidas detectadas, total arancel pagado, total IVA pagado.
- **1 partida**: autoselección, datos auto-rellenados, mensaje verde "1 partida detectada".
- **2+ partidas**: tabla con checkboxes (selección por defecto vacía — el usuario marca activamente). Columnas `#`, `TARIC`, `Descripción`, `Origen`, `Pref.`, `Arancel`. Filas marcadas en `bg-[#0A3D5C]/5`. Atajos "Marcar todas / Desmarcar todas" en navy. CTA gold "**Continuar con N partidas seleccionadas →**" disabled cuando 0. El botón "Siguiente" global se oculta cuando hay multi-partida; el CTA gold de la tabla es el único disparador de avance.
- **Persistencia en state**: `state.parseResult`, `state.selectedItemIndices`, `state.selectedItems` (array de partidas con sus `dutiesDeclared/dutiesCorrected` propios). Selección preservada al navegar Atrás/Adelante.
- **Decisión cerrada**: 1 tipo de error para toda la solicitud (no por partida).

#### Paso de revisión — sub-bloques colapsables

`StepReview.js` refactorizado para iterar sobre `state.selectedItems` o, en flujo manual sin XML, sobre un único item virtual derivado de los campos planos:

- **Datos comunes** (motivos, contacto, ubicación, banco) **fuera** de los sub-bloques — son únicos para toda la solicitud.
- **Sub-bloque por partida**: cabecera clickeable `Partida #N — TARIC XXXXXXXXXX — descripción truncada (60c)` + chevron rotativo, diff parcial visible aunque el bloque esté colapsado, body expandible con tabla `DICE / DEBE DECIR / DIFERENCIA` por código y total partida.
- **Expansión por defecto**: si N ≤ 4 todos abiertos; si N ≥ 5 sólo los 2 primeros. Atajos "Expandir / Colapsar todas" cuando hay 2+ partidas.
- **Mutadores con itemIdx**: `setDeclared(itemIdx, code, v)`, `setCorrected(itemIdx, code, v)`, `addDuty(itemIdx)` escriben en `selectedItems[i].dutiesDeclared/Corrected`. Modo legacy (sin selectedItems) escribe en los planos.
- **Total general** en bloque `bg-amber-50 border-2 border-[#F4C542]` al final de los sub-bloques.

#### DOCX maquetado al modelo AEAT estricto (`lib/rrmDocxGenerator.js`)

Reescritura de la maquetación para que el documento sea visualmente indistinguible del modelo oficial:

- **Cabecera**: tabla 1×2 sin bordes con **bandera UE embebida** (PNG 120×80, `public/assets/eu-flag.png`, generada localmente con composición oficial: 12 estrellas amarillas `#FFCC00` en anillo concéntrico sobre fondo azul `#003399`) + título oficial en dos líneas, mayúsculas, Arial 11pt: `"SOLICITUD RELATIVA A LA DEVOLUCIÓN O CONDONACIÓN DE LOS IMPORTES DE LOS DERECHOS DE IMPORTACIÓN O DE EXPORTACIÓN"`.
- **Macro-tablas continuas**: REQUISITOS COMUNES y REQUISITOS ESPECÍFICOS son **una única `Table` cada uno**, con cabeceras de bloque/sección como filas internas (`columnSpan: 6` sobre un grid lógico de 6 columnas, mcm de 2 y 3). Tres niveles de shading: azul `#B4D4E5` para bloques maestros, gris `#D9D9D9` para sub-secciones (Información sobre la solicitud, Documentos justificativos, Partes, Fechas y lugares, Identificación de las mercancías, Otros), lila `#D9D2E9` para cabeceras de notas. Cabecera azul, gris y casillas quedan fundidas en un mismo marco continuo, sin gaps.
- **Layout de columnas estricto**: filas multi-columna que reproducen el modelo AEAT — `31 01 | 31 03 | 31 06` (3-col 2/2/2), `Firma | 31 07` (2-col 3/3), `33 01-02 | Identificación` y `33 03 | Identificación` (2-col 3/3), `34 01 | 34 02 | 34 06` (3-col), `35 01 info | designación | volumen` (3-col), `48 02 | 48 03` (2-col), `48 06 | 48 07 | 48 08` (3-col 1/3/2 ≈ 17/50/33%) — etc.
- **Casilla 48 14** con `cantSplit: true` en su `TableRow` → la celda con "Nombre del titular de la cuenta:" y "Cuenta: IBAN/Banco-BIC:" no se divide entre páginas. Verificado en el XML emitido (`<w:cantSplit/>` puro, sin `val="false"`).
- **Casilla 48 10**: rellena por defecto con `"Acondicionada para la venta"` — constante exportable `DEFAULT_USO_DESTINO` para futura edición o promoción a campo del wizard.
- **Casillas 48 11 y 48 12** vacías por diseño (las completa la AEAT).
- **Página dedicada de notas al pie**: tras los REQUISITOS ESPECÍFICOS, página nueva con cabecera lila + tabla 2-col (marker bold, texto Arial 9pt). Notas (1)–(16) y (*) con texto literal del modelo oficial AEAT.
- **Anexo I — multi-partida**: si hay `data.selectedItems`, mini-tabla DICE/DEBE DECIR por partida con cabecera `Partida #N — TARIC XXX — descripción truncada` + subtítulo `Origen: XX · Preferencia: YYY`, fila final `Total partida #N`. Si no, tabla consolidada legacy.
- **Bloque "TOTAL GENERAL A REGULARIZAR"** al final del Anexo I, **siempre con separación legal A00 / B00** (también en modo 1 partida o legacy):
  - `A00 — Arancel: X €` *(devolución directa)*
  - `B00 — IVA: Y €` *(regularización en próxima declaración periódica de IVA)*
  - Otros tributos *(según naturaleza tributaria)*
  - Separador + totales agrupados: `Total a devolver (A00)`, `Total a regularizar IVA (B00)`, `Total otros tributos`.
- **Etiquetas y notas SIEMPRE en castellano** (documento legal dirigido a la AEAT, alineado con el modelo oficial). No se traducen al inglés aunque el wizard tenga UI bilingüe.

#### Validador suave de placeholders en wizard

La plantilla del textarea de motivación contiene marcadores tipo `{{tipo_error}}`, `{{documento_origen}}` que el usuario debe sustituir por información concreta. Se añade:

- **Texto de ayuda permanente** bajo el textarea (italic, slate-500): *"Sustituye los textos entre llaves `{{...}}` por la información concreta de tu caso antes de continuar."*
- **Soft-block en `StepGenerate.generate()`**: antes del fetch, si `motivosText.match(/\{\{[^}]+\}\}/)`, lanza `window.confirm` con la advertencia *"El texto de motivación todavía contiene plantillas sin completar. ¿Quieres generar el documento de todos modos?"*. Cancelar → no genera. Aceptar → continúa (testing y exportación parcial podrían querer generar con placeholders).

#### Resumen del paso 4 (StepGenerate)

El resumen visual antes de descargar el DOCX se actualiza para reflejar el desglose multi-partida cuando aplica:

- En multi: desglose por partida con TARIC, origen, preferencia, sus códigos y total partida.
- Total general agrupado por naturaleza tributaria con leyendas legales (mismo formato que el Anexo I del DOCX).
- En multi se ocultan `Mercancía` y `Valor en aduana` planos (representan solo la primera partida) y se sustituyen por `Partidas seleccionadas: N`.

#### i18n y cleanup

- **Claves nuevas** (parity ES/EN 126/126): `summaryTitle`, `summaryMRN`, `summaryDate`, `summaryCustoms`, `summaryImporter`, `summaryExporter`, `summaryItems`, `summaryDuty`, `summaryVAT`, `autoFilledSingle`, `multiItemsDetected`, `multiItemsTitle`, `multiItemsHelp`, `thNumber`, `thTaric`, `thDescription`, `thOrigin`, `thPreference`, `thDuty`, `selectAll`, `selectNone`, `continueWithSelected`, `continueWithSelectedSingular`, `itemBlockTitle`, `itemTotalDiff`, `generalTotal`, `itemsLiquidation`, `expandAll`, `collapseAll`, `totalGeneralTitle`, `arancelLegend`, `ivaLegend`, `otrosLegend`, `totalA00`, `totalB00`, `totalOtros`, `dutyKindArancel`, `dutyKindIVA`, `dutyKindOtros`, `partidaTotalLabel`, `tabPaste`, `tabFile`, `pastePlaceholder`, `pasteSubmit`, `pasteHelp`, `pasteInvalid`, `motivation.placeholderHelp`, `motivation.placeholdersWarning`.
- **Claves huérfanas eliminadas**: `common.cancel`, `common.save`, `common.required`, `common.loginCta`, `common.loginRequired`, `upload.manualToggle`, `upload.preferentialOrigin`, `upload.sectionLiquidation`, `review.itemSubtitleOrigin`, `review.itemSubtitleOriginPref`. Verificado que no se referencian en componentes activos (`selector.remTitle/repTitle/remDesc/repDesc` preservadas porque se interpolan dinámicamente).

#### Cambios técnicos (v5.19.0 — sección RRM iteración 3)

- 1 asset nuevo: `public/assets/eu-flag.png` (529 bytes).
- `lib/rrmParser.js` reescrito (524 líneas, soporte CC415AV1Ent + compat legacy).
- `lib/rrmDocxGenerator.js` refactor profundo (~1000 líneas tras evolución completa).
- 5 componentes del wizard tocados: `StepUpload.js` (tabs + tabla multi), `StepReview.js` (sub-bloques colapsables), `StepGenerate.js` (consolidación selectedItems + validador placeholders + resumen multi), `StepSelector.js` y `RRMProgressBar.js` (estética clara).
- `app/rrm/page.js`: `state.parseResult/selectedItemIndices/selectedItems` añadidos a `INITIAL_STATE`, `canAdvance` valida selección en multi, callback `onAdvance` inyectado a StepUpload.
- 0 dependencias npm nuevas.
- Build limpio. PR #13 mergeado a `main`.

---

## 🆕 Novedades v5.18.0 (Abril 2026)

Reforma del Nivel 2 CBAM: la antigua "Calculadora" pasa a ser **Diagnóstico CBAM**, una herramienta cualitativa. Sigue ejecutando el mismo motor oficial, pero ya no entrega la cifra exacta en € — entrega un semáforo por tonelaje, un rango de certificados por sector, una recomendación de paquete y un CTA al Advisory pre-rellenado.

### 🎯 Movimiento estratégico

Feedback de un importador real del perfil "Grupo 2" (los que rozan el umbral CBAM y dudan si están afectados) sugirió que la cifra gratuita estaba canibalizando ventas del Advisory Básico (500 €): el usuario obtenía la estimación, resolvía su curiosidad y no contrataba. El Día 6 transforma esa herramienta en un **diagnóstico de triaje**: confirma si hay obligación, ofrece magnitud cualitativa y empuja al Advisory para el cálculo oficial defendible en inspección. La cifra exacta vuelve a ser un diferencial cerrado del servicio de pago.

### 👤 Qué cambia para el usuario

- **Nombre y mensaje.** El sidebar, el topbar y el hero dicen ahora **"Diagnóstico CBAM"** / **"CBAM Diagnostic"**. La URL se mantiene (`/cbam/calculadora`) para no romper enlaces.
- **Bloque principal — semáforo.** Círculo verde/amarillo/rojo según tonelaje CBAM declarado:
  - Verde `< 50 t`: sin obligación en el alcance declarado (verifica exención Reg. UE 2025/2083).
  - Amarillo `50-200 t`: exposición moderada; aconsejable informe oficial.
  - Rojo `> 200 t`: exposición alta; informe oficial muy recomendable.
  Debajo, 4 métricas neutras: toneladas totales, productos distintos, instalaciones estimadas y año.
- **Rango de exposición.** Tarjeta con el rango de certificados por sector predominante (`<25 / 25-100 / 100-500 / >500` para acero; rangos propios para aluminio, cemento, fertilizantes, hidrógeno) + exposición económica cualitativa (`Baja / Moderada / Alta / Muy alta`) + ahorro potencial con datos reales (`Significativo / Moderado / Despreciable`).
- **Recomendación automática.** Tarjeta destacada tipo *"Tu caso encaja mejor con: **Advisory Básico**"*. Reglas: `> 500 t` → Monitorización · scope que cabe en 3 instalaciones / 5 productos / 1 país → Básico · resto → Completo.
- **CTA al Advisory pre-rellenado.** Al pulsar el botón del diagnóstico, los productos declarados se pasan al wizard vía stash en `localStorage` con TTL de 2 horas (clave `cbam_advisory_prefill_from_diagnostic`). El wizard consume el stash una sola vez y muestra un banner verde avisando del pre-relleno. Campos que la calculadora no recoge (empresa, proveedor, documentación) quedan vacíos para que el usuario los complete.
- **Tabla de desglose.** Mantiene estructura — se quitan las columnas **Certificados** y **Coste €** y se añade una nueva columna **Exposición de la línea** con semáforo por línea.
- **Bloque de "campos premium bloqueados"**: eliminado; los tres bloques nuevos lo reemplazan conceptualmente.
- **Historial.** La lista muestra badge semáforo + tonelaje en vez del importe €. El detalle expandido aplica `buildDiagnostic` on-the-fly sobre el `result_snapshot` guardado. El snapshot RAW (con cifras) se **conserva en BD** para poder revertir el cambio sin recalcular nada.

### 🛠️ Fixes incluidos

- **CTA al wizard correcto según paquete recomendado (Básico, Completo o Monitorización).** Paquetes correctamente diferenciados en la redirección del diagnóstico. Monitorización lleva a `/cbam/asesoria/solicitud/monitorizacion`; Básico y Completo al wizard Advisory con `?tipo=...`. Además, el stash de pre-relleno se omite cuando el paquete recomendado es Monitorización (su wizard no consume productos CN) — así evitamos dejar datos huérfanos en `localStorage` si el usuario abre el CTA en pestaña nueva y luego navega manualmente al wizard Advisory.

### 🏗️ Arquitectura

- **`lib/cbamDiagnosticRanges.js`** — Tabla fija de rangos por sector (IDs reales: `ironSteel`, `aluminium`, `cement`, `fertilizers`, `hydrogen`) + resolución de sector predominante con umbral del 60%. Fallback a `ironSteel` como rangos neutros para mezclas.
- **`lib/cbamDiagnosticBuilder.js`** — Motor puro:
  - `resolveTrafficLight(totalTonnage)` → verde/amarillo/rojo.
  - `recommendPackage({ totalTonnage, installations, productsCount, countriesCount, hasRecurringImports })` → básico/completo/monitorización.
  - `buildDiagnostic(engineResult, { showCost, inputProducts, scope })` → payload cualitativo.
  - `shouldShowCost()` → lee la env `NIVEL_2_SHOW_COST`.
- **`lib/cbamCalculatorPayload.js`** — Ampliado con `toDiagnosticPayload` (endpoint `calculate`) y `toDiagnosticFromSnapshot` (endpoint del histórico). El filtro free-tier original sigue vivo para persistencia completa.
- **Endpoints:**
  - `POST /api/cbam/calculator/calculate` → devuelve diagnóstico (no la cifra).
  - `POST /api/cbam/calculator/save` → persiste snapshot RAW en BD y devuelve el diagnóstico al cliente.
  - `GET /api/cbam/calculator/saves` → añade `trafficLight` y `totalTonnes` por item; oculta `total_cost` salvo flag.
  - `GET /api/cbam/calculator/saves/[id]` → aplica `buildDiagnostic` sobre el snapshot persistido.
- **UI** — `CalculatorClient.js` recibe tres sub-componentes nuevos: `DiagnosticTrafficLightBlock`, `DiagnosticExposureCard`, `DiagnosticRecommendationCard`, más `LineTrafficLightBadge` para la tabla. El historial recibe `HistoryDetail` con el mismo lenguaje visual.
- **i18n** — Nuevas claves `diagnostic.*` en ES y EN (`trafficLight`, `metrics`, `exposure`, `recommendation`, `lineColumn`, `disclaimerNote`). El copy de la comparativa Calculadora vs Advisory se ajusta para reflejar que la cifra exacta ya es diferencial del Advisory.

### 🔄 Flag reversible `NIVEL_2_SHOW_COST`

Documentado en `.env.example`. Defaultea a `false` (diagnóstico cualitativo). Si el feedback de los primeros clientes con diagnóstico activo sugiere revertir, basta con poner `NIVEL_2_SHOW_COST=true` en Vercel y redesplegar — el filtrado vive en backend, por lo que la cifra vuelve a aparecer sin ningún cambio de código y sin invalidar los snapshots guardados:

```
# Nivel 2 CBAM — flag para mostrar/ocultar cifra exacta de coste.
# Default: false (modo diagnóstico cualitativo post-Día 6).
# Activar solo si el feedback de clientes reales lo justifica.
NIVEL_2_SHOW_COST=false
```

### ✅ Validación

- **Unit tests** en `scripts/testDiagnosticBuilder.js`: 54/54 PASS. Cobertura: semáforo, rangos por sector (acero / aluminio / cemento / fertilizantes / hidrógeno), predominancia del 60%, mezclas, flag `showCost` on/off, recomendador en todos los bordes (incluido `500 t` exactos) y `potentialSaving` cualitativo.
- **Playwright** en `scripts/e2e/test-cbam-diagnostic.spec.js` (Flow G): mock del endpoint `calculate` para independizarlo del estado de Supabase; verifica semáforo visible, badge cualitativo, CTA presente, **ninguna cifra en €** (regex `/\d[\d.,]*\s*€/`) en el contenedor del diagnóstico, navegación a `/cbam/asesoria/solicitud?tipo=...&from=diagnostic` y aparición del banner de pre-relleno en el wizard (prueba extremo a extremo del stash).
- **Suite acumulada**: 15/15 PASS — sin regresiones.

### 🧭 Tech debt / próximos pasos

- **`installations` y `hasRecurringImports`** no están en el motor del Nivel 2; se asumen `1` y `false` para el diagnóstico público. El detector definitivo del wizard Advisory sí los usa con datos completos del usuario. Si el recomendador empieza a fallar en la franja alta, conviene cablear esas señales desde el cuestionario de la calculadora.
- **Excel export del historial** mencionado en el brief original del Día 6: no existe código que lo implemente hoy, así que no se tocó. Si se añade en el futuro, debe respetar el mismo filtrado de `NIVEL_2_SHOW_COST`.
- **Medición de conversión**: falta instrumentación para confirmar la tesis de negocio (¿aumenta la tasa de clics del CTA Advisory tras el cambio?). Siguiente iteración: evento de analytics en el CTA del diagnóstico y en el `advisory-prefill-banner` del wizard.

---

## 🆕 Novedades v5.17.0 (Abril 2026)

Sesión operativa pre-lanzamiento: cierra los pendientes mínimos para que Carlos procese las primeras solicitudes reales con profesionalidad.

### 💸 Solicitud de pago profesional (Advisory)

Flujo estandarizado para cobrar Advisory Básico (500 €) / Completo (2.500 €) por transferencia mientras Carlos no está de alta como autónomo.

- Botón **"Enviar solicitud de pago"** en `/admin/cbam/asesoria/[id]` visible cuando `status = report_ready`.
- Modal con preview **editable bilingüe ES/EN**: idioma (auto por email del cliente), importe (prellenado según paquete), referencia única `LA-YY-XXXXXXXX`, IBAN/BIC/titular (desde env o editables), asunto y cuerpo.
- Al confirmar: envío por Resend + transición automática `report_ready → pending_payment` + trazabilidad completa en `payment_request_*` columns.
- Aviso legal obligatorio: *"Este documento es una solicitud de pago, no una factura."*
- Arquitectura preparada para evolucionar a factura oficial (con `invoice_number` secuencial) sin reescribir.

**Variables de entorno necesarias en Vercel:** `LEXADUANA_BANK_IBAN`, `LEXADUANA_BANK_BIC`, `LEXADUANA_BANK_HOLDER`.

### ✅ Checklist pre-entrega (stepper horizontal)

Stepper visual arriba del detalle en Advisory y Monitorización. Reduce riesgo operativo cuando Carlos procesa solicitudes con prisa.

- **Advisory (7 pasos):** 3 manuales + 4 automáticos derivados del status.
- **Monitorización (5 pasos):** 4 manuales + 1 automático.
- Paleta sobria: verde `#059669` completado, azul marino `#0A3D5C` actual, gris neutro futuro.
- Pasos manuales clickeables (persisten en columna JSONB `admin_checklist`); automáticos derivan en vivo del `status`.
- Tooltip con descripción, timestamp relativo ("hace 2 h", "ayer") y email del admin que marcó.

### 📊 Panel admin de Suscripciones Monitorización (nuevo)

Primer admin page para gestionar altas de Monitorización (199 €/mes):

- **Listado** en `/admin/cbam/suscripciones` con filtros y estado.
- **Detalle** en `/admin/cbam/suscripciones/[id]` — vista única scrollable (opción C, sin tabs elaboradas): stepper arriba, datos empresa/contacto/perfil de importación, autorización DUAs, timeline operativo, gestión de estado y notas internas.
- Estados: `submitted → authorized → active → paused → cancelled` con timestamps automáticos por transición.
- Panel `/admin/cbam` ahora con dos accesos a subpaneles (Asesorías + Suscripciones).

### 🧹 Cleanup legacy

- Eliminada tabla `cbam_user_calculations` (vacía, 0 filas en producción) + endpoint `/api/cbam/calculations` + funciones `saveCBAMCalculation` / `getCBAMCalculationHistory`.
- Reemplazada por `cbam_calculator_saves` + `/api/cbam/calculator/saves` (multi-producto, ya en uso desde Día 3-4).
- Docs y schema actualizados.

### ♿ Accesibilidad — `htmlFor` en formularios de producción

37 pares `<label htmlFor> ↔ <input id>` añadidos a wizards Advisory, Monitorización, calculadora CBAM y auth (login/register). Lectores de pantalla ahora asocian cada etiqueta con su campo correspondiente.

- Naming convention: `{contexto}-{campo}` (`advisory-contact-email`, `monitorizacion-company-name`, `calculadora-product-0-cn`, `login-email`…).
- Refactor colateral: helper Playwright `fieldByLabel()` usa `page.getByLabel()` cuando existe el vínculo y cae al XPath posicional para forms sin migrar.
- Admin y legacy (despachos, RRM, factura-OCR, etc.) pendientes para sesión futura.

### 🧪 Validación

- **Unit tests:** generador de solicitud de pago (31 PASS), compute checklist (31 PASS), a11y htmlFor (6/6 archivos PASS).
- **Playwright suite:** 14/14 PASS (Flows C-F del Día 4 sin regresiones + 4 nuevos Pieza 1 y 2).

---

## Novedades v5.16.0 (Abril 2026)

### 📄 Requisitos Documentales — Motor de interpretación TARIC

Nueva sección en la calculadora que interpreta las condiciones TARIC de cada partida y las muestra como información práctica: qué documentos necesita el despachante, qué alternativas tiene, y qué pasa si no presenta ninguno.

#### Motor de interpretación (`lib/measureInterpreter.js`)

- **Parser de `duty_expression`**: extrae certificados, fallbacks y umbrales de exención del texto crudo TARIC
- Soporta condition types de 1-2 caracteres (Y, B, E, YA, YB, YC…) — 482 medidas con tipos compuestos
- 8 action codes: 29/09 (CITES), 24/04 (sanciones/licencias), 01 (derecho condicional), 27/7/8 (preferencias)
- Patrón directo (cert → autorizado) e invertido (cert → restringido, ej: D023/D024 anti-circumvención)
- Umbrales de exención (`E 10.000/KGM(29)` → "Exento si peso neto < 10 kg")

#### Dos fuentes de datos

- **Fuente 1** (`duty_expression` en `taric_measures`): condiciones paraaduaneras (CITES 710, sanitario 410, CBAM 775, sanciones 474…)
- **Fuente 2** (`measure_conditions`): preferencias (142, 143), suspensiones (117, 119), contingentes (122)
- Enriquecimiento con `certificate_types` (883 certificados ES/EN) y `footnote_descriptions` (notas explicativas)

#### Componente visual (`components/DocumentRequirements.jsx`)

- Tarjetas colapsables por medida con badge de severidad (Obligatorio / Condicional / Si aplica / Informativo)
- Opciones de certificado con código monospace, descripción, y styling diferenciado para declaraciones negativas (Y900, etc.)
- Umbrales de exención, fallback de denegación, notas explicativas colapsables, base legal
- Nota sobre casilla 44 DUA / SupportingDocument H1
- Categorización: paraaduanero, restricción, CBAM, derechos, informativo
- i18n bilingüe ES/EN completo (`lib/i18n/documentRequirements.js`)

#### Traducciones TARIC ampliadas (`lib/taricTranslations.js`)

+15 measure types: 710 (CITES import), 711/715 (CITES export), 474/475 (sanciones), 724 (food/feed safety), 726 (ozono), 728 (lujo), 731/732 (controles), 755/760/761/762 (residuos, REACH, POP, fluorados)

---

### Novedades v5.15.0 (Abril 2026)

> **Nota histórica**: esta sección documenta el lanzamiento inicial del módulo RRM. La implementación actual ha evolucionado significativamente — ver **Novedades v5.19.0** arriba para la versión vigente (parser CC415AV1Ent rico, multi-partida, DOCX al modelo AEAT estricto).

### 📑 Solicitud RRM (`/rrm`) — Nueva herramienta

Generador de **Solicitudes de Devolución/Condonación de Derechos** (art. 116-120 CAU) en formato DOCX editable, listo para presentar ante la AEAT. Wizard guiado de 4 pasos que parte del DUA H1 original y produce el documento oficial con la liquidación a regularizar.

#### Wizard en 4 pasos (`app/rrm/page.js`)

1. **Selector de caso**: 6 supuestos tipificados (preferencia arancelaria no aplicada, error de clasificación, error de origen, error de valoración, mercancía defectuosa, error de la autoridad aduanera) + selector REM (Remisión) / REP (Devolución) + base legal (art. 117/118/119/120/116.1)
2. **Carga H1**: dropzone XML + parser tolerante a namespaces que extrae MRN, fecha de aceptación, aduana, procedimiento, importador/representante (EORI), partidas, país de origen, preferencia declarada. Campos editables manualmente. Aviso automático si la fecha de aceptación está cerca del límite de 3 años (art. 121.1.a CAU)
3. **Revisión**: tabla comparativa **DICE / DEBE DECIR** con códigos de tributo (A00, B00…), textarea de motivación pre-rellenada por tipo de caso, contacto, aduana competente, datos bancarios con validación IBAN (solo si REP)
4. **Generación**: resumen + descarga DOCX + checkbox opcional para guardar borrador en Supabase

#### Parser H1 (`lib/rrmParser.js`)

- `parseH1Xml(xml)` basado en `xml2js` (`parseStringPromise`)
- Tolerante a cualquier prefijo de namespace (`stripNs`, `findAll`, `findFirst`)
- Extrae documento completo: MRN, fechas, oficinas aduaneras, partes (importador/declarante/representante con EORI), partidas con código mercancía/descripción/masa neta/unidades/origen/preferencia/valor en aduana/tributos declarados, documentos de soporte

#### Generador DOCX (`lib/rrmDocxGenerator.js`)

- Basado en `docx` v9.6.1 (Document, Packer, Paragraph, Table, ImageRun, VerticalAlign, ShadingType, BorderStyle)
- Tipografía Arial 10pt, A4 (11906×16838 DXA), tres niveles de cabecera (azul `B4D4E5` para bloques maestros, gris `D9D9D9` para sub-secciones, lila `D9D2E9` para notas al pie)
- Maquetación fiel al modelo oficial AEAT (Reglamento Delegado UE 2015/2446):
  - Cabecera con bandera UE embebida (PNG 120×80, `public/assets/eu-flag.png`) + título oficial en mayúsculas
  - **REQUISITOS COMUNES** con sub-secciones: Información sobre la solicitud, Documentos justificativos, Partes, Fechas/lugares, Identificación de las mercancías, Otros
  - **REQUISITOS ESPECÍFICOS**: casillas 48 01–48 14 individuales con notas al pie referenciadas; casilla 48 10 con texto por defecto `"Acondicionada para la venta"` (`DEFAULT_USO_DESTINO` exportable); 48 11 y 48 12 vacías por diseño
  - Página dedicada a **Notas al pie** (1)–(16) y (*) con texto literal del modelo oficial
  - **Anexo I**: mini-tabla por partida (multi-partida) o tabla consolidada (legacy) + bloque "TOTAL GENERAL A REGULARIZAR" con separación A00 (devolución directa) y B00 (regularización en próxima declaración periódica de IVA)
- Etiquetas y notas SIEMPRE en castellano (documento legal dirigido a la AEAT)
- Devuelve `Buffer` listo para descargar

#### API endpoints

- `POST /api/rrm/parse-h1`: acepta JSON `{xml}` o cuerpo `text/xml`, máx 2 MB, rate-limit `generalLimiter`
- `POST /api/rrm/generate-docx`: valida `requestType ∈ {REM,REP}`, genera DOCX con `Content-Disposition: attachment`. Si `saveDraft: true` y usuario autenticado, inserta borrador en `rrm_requests` (sin datos bancarios)

#### Base de datos — tabla `rrm_requests`

- Columnas: `user_id`, `request_type`, `case_type`, `legal_basis`, `mrn`, `customs_office`, `importer_eori/name`, `representative_eori/name`, `commodity_code`, `goods_description`, `country_of_origin`, `preference_declared`, `customs_value`, `corrected_data` (JSONB), `duties_declared/corrected` (JSONB), `amount_to_recover`, `motivos_text`, `status` (draft/generated/submitted), timestamps
- Índices en `user_id`, `mrn`, `created_at DESC`
- RLS: `auth.uid() = user_id` (propietario ve/edita solo sus borradores)
- Trigger `set_updated_at`
- **Sin columnas bancarias** por decisión de privacidad (IBAN nunca se persiste, solo viaja al DOCX descargado)

#### Soporte bilingüe ES/EN

- **Diccionario `lib/i18n/rrm.js`**: hero, progreso, 4 pasos completos, estado común
- Integrado con `useTranslation(rrmDict)` del patrón existente
- Entrada en sidebar (`nav.rrm`) y topbar con badge "New"

**Cambios técnicos:**
- 2 rutas API + 6 componentes (RRMProgressBar + 4 Steps + page/layout) + 4 libs (`rrmData`, `rrmParser`, `rrmDocxGenerator`, `i18n/rrm`)
- 1 migración Supabase (`create_rrm_requests`) con RLS
- 1 dependencia nueva: `docx@^9.6.1`
- Build limpio — `/rrm` operativo en `lexaduana.es/rrm`

---

## 🆕 Novedades v5.14.0 (Abril 2026)

### 🔄 Monitor de Cambios TARIC (`/cambios`) — Nueva herramienta

Sistema completo de detección, análisis y visualización de cambios arancelarios mensuales del TARIC (Arancel Integrado de la UE). Compara automáticamente los datos nuevos de CIRCABC contra los vigentes en Supabase y presenta los cambios de forma accionable.

#### Detección de cambios (`scripts/detectChanges.js`)

- **Comparación Excel vs Supabase**: lee los 4 Excel del Block 2 (Duties, Conditions, Exclusions, Footnotes) y compara contra datos actuales en BD
- **Clasificación inteligente**: cada cambio se categoriza como `added`/`removed`/`modified` con severidad `critical`/`warning`/`info`
- **Separación medidas vs footnotes**: distingue cambios con impacto arancelario real de cambios cosméticos (footnotes)
- **Modo dry-run**: `--dry-run` para previsualizar sin escribir en BD
- **Almacenamiento**: tabla `taric_changes` con índices por mes, capítulo, goods_code y severidad

#### API (`/api/changes`)

- **Resumen mensual**: desglose de medidas (nuevas/eliminadas), cambios críticos, condiciones, capítulos afectados
- **Top 10 cambios**: `rankTopChanges()` extrae y puntúa los mayores deltas arancelarios con `parseDutyValue()` para interpretar expresiones TARIC (`"5.800 %"`, `"237.000 EUR TNE I"`)
- **Detalle paginado**: filtros por capítulo, código, severidad y tipo de cambio
- **Lista de meses**: endpoint `?months=all` para navegación temporal

#### Página `/cambios` — 11 componentes

- **Hero navy** (`bg-[#0A3D5C]`): consistente con CBAM/Incoterms, badge, descripción y selector de mes
- **ChangesSummary**: 4 KPIs — medidas, críticos, condiciones, capítulos afectados
- **TopChanges**: Top 10 cambios con banderas de país, tipo de medida, delta formateado (NUEVO/↑/↓)
- **ChapterTable**: tabla oscura (`bg-[#0F1A2E]`) con 97 capítulos HS, sort por capítulo/medidas/críticos, leyenda interactiva, sección colapsable de footnotes
- **ChangesTable**: detalle paginado con filtros por tipo y severidad
- **HighlightsSection**: conclusiones auto-generadas del mes (eliminadas, nuevas, críticas, footnotes)
- **MonthSelector**, **ChangesSearch**, **SubscriptionCTA**, **SeverityBadge**, **ChangeTypeBadge**

#### Diseño visual

- Ritmo visual: hero oscuro → contenido claro → tabla oscura → contenido claro → CTA oscuro
- Paleta: navy `#0A3D5C`, tabla `#0F1A2E`, gold `#C49B38`/`#B8860B`, grises estándar Tailwind
- Light theme para todo el contenido (fondo blanco del body), contraste verificado

#### Soporte bilingüe ES/EN completo

- **Diccionario `lib/i18n/cambios.js`**: ~200 strings — hero, resumen, búsqueda, top changes, tabla capítulos, conclusiones, detalle, filtros, CTA, badges, estado vacío
- **`CHAPTER_NAMES_I18N`**: 97 capítulos HS traducidos ES/EN, compartido entre ChapterTable y TopChanges
- **Tipos de medida bilingües**: 12 tipos TARIC (anti-dumping, preferencia, contingente, etc.)
- **Orígenes geográficos bilingües**: 28 países/grupos con banderas emoji
- **Nombres de meses**: Enero→January, etc. en MonthSelector

**Cambios técnicos:**
- 1 script nuevo + 1 ruta API + 11 componentes React + 1 diccionario i18n
- Tabla `taric_changes` + RPC `get_changes_by_chapter` en Supabase
- 0 dependencias nuevas
- Build limpio — `/cambios` 8.7 kB First Load

---

## Novedades v5.13.0 (Abril 2026)

### 🌐 Soporte bilingüe ES/EN completo — 85%+ cobertura

Expansión del sistema i18n a toda la plataforma: herramientas públicas, páginas autenticadas, landing page, monitor de aranceles y componentes compartidos. De 10 páginas públicas a **28 páginas/componentes traducidos** con **14 diccionarios** y **~2.000 strings**.

#### Infraestructura i18n

- **`lib/i18n.js`**: Core del sistema — `LocaleProvider` (React Context), hooks `useLocale()` y `useTranslation(dict)` con acceso por clave anidada (`t('hero.title')`)
- **`components/LanguageSwitcher.js`**: Toggle ES/EN con persistencia en `localStorage`, integrado en sidebar (`AppTopbar`) y páginas standalone (auth, landing)
- **`components/layout/AppShell.js`**: `LocaleProvider` envuelve toda la app (rutas bare y sidebar)
- **Fallback chain**: Clave → español → fallback proporcionado → clave cruda
- **Interpolación manual**: `.replace('{placeholder}', value)` para strings dinámicos
- **HTML en traducciones**: Soportado vía `dangerouslySetInnerHTML` donde necesario

#### Diccionarios de traducción (15 archivos)

| Diccionario | Cobertura | Strings | Notas |
|---|---|---|---|
| `cambios.js` | Monitor cambios TARIC completo | ~200 | Hero, resumen, top, capítulos, detalle, badges + 97 capítulos HS bilingües |
| `landing.js` | Hero, Features, Audiencia, QuickAccess | ~100 | Landing page completa |
| `auth.js` | Login, Register, Forgot/Reset password | ~55 | 4 páginas de auth |
| `calculadora.js` | Calculadora TARIC completa | ~80 | Form, resultados, liquidación, sidebar |
| `comparador.js` | Comparador multi-origen | ~70 | Hero, form, resultados, recomendación |
| `clasificador.js` | Clasificador IA | ~45 | Resultados, confianza, disclaimer |
| `glosario.js` | Glosario aduanero | ~25 | Hero, sidebar, detalle, lista |
| `tipos-cambio.js` | Tipos de cambio | ~20 | Tablas, secciones, legal |
| `factura-ocr.js` | Extractor de facturas | ~90 | Wizard 3 pasos, historial, seguridad |
| `bulk.js` | Cálculo masivo | ~60 | Hero, instrucciones, upload, resultados |
| `dashboard.js` | Dashboard usuario | ~40 | Welcome, stats, historial, accesos rápidos |
| `favoritos.js` | Favoritos | ~13 | Lista, empty state, acciones |
| `despachos.js` | Gestor despachos (3 páginas) | ~120 | Listado, nuevo, detalle, stages, operaciones |
| `monitor.js` | Monitor de aranceles (2 páginas) | ~70 | Auth, dashboard, modal, info |
| `shared-components.js` | Componentes compartidos | ~60 | CBAM, ExchangeRate, Favorite, Checklist |
| `footer.js` | Footer | ~25 | Brand, producto, legal |
| `common.js` | Navegación, topbar | ~30 | Sidebar, topbar |

#### Páginas y componentes traducidos (29 total)

**Fase 1 — Herramientas públicas (7):**
Calculadora, Comparador, Glosario, Tipos de cambio, Factura OCR, Cálculo masivo, Footer

**Fase 2 — Páginas autenticadas + componentes compartidos (8):**
Dashboard, Favoritos, Despachos (listado + nuevo + detalle), CBAMAlert, ExchangeRateBanner, FavoriteButton

**Fase 3 — Landing, monitor y componentes restantes (10):**
HeroLanding, FeaturesLanding, TargetAudience, QuickAccessButton, Monitor auth, Monitor dashboard, ExchangeRateWidget, DispatchChecklist, Cambios TARIC (11 componentes)

**Sesiones anteriores (10):**
Landing `/`, Auth (4 páginas), EUDR, Clasificador IA, Incoterms, OEA, Valor en Aduana, Sidebar, Topbar, CBAM (8 páginas)

#### Enfoque de datos bilingües (Valor en Aduana)

- **`lib/customsValueData.en.js`** (~490 líneas): Versión inglesa completa de todos los datos estructurados
- **Hook `useLocalizedData()`**: Selecciona automáticamente datos ES/EN según locale activo
- **Números formateados por locale**: `toLocaleString('en-GB')` vs `toLocaleString('es-ES')`

#### Qué queda sin traducir (intencional)

- **Páginas admin** (`/admin/*`): 4 páginas internas de gestión — solo las usa el admin
- **Páginas legales** (`/politica-privacidad`, `/terminos-uso`): Requieren traducción legal profesional
- **`ExportPDF.js`**: Función pura sin hooks — requeriría pasar locale como parámetro
- **`CBAMInfoBanner`**: Texto regulatorio específico EU

**Cambios técnicos (v5.13.0):**
- 36 ficheros modificados/creados (15 diccionarios + 29 páginas/componentes)
- 0 dependencias nuevas (React Context + localStorage)
- Build limpio — sin impacto significativo en bundle size
- Componentes landing (`HeroLanding`, `FeaturesLanding`, `TargetAudience`) convertidos a Client Components (`'use client'`) para soportar hooks

---

## Novedades v5.12.0 (Abril 2026)

### 🌐 Soporte bilingüe ES/EN — Páginas públicas (primera fase)

Primera implementación i18n: 10 páginas públicas/internacionales traducidas (~600 strings). Landing, auth (4 páginas), EUDR, Clasificador IA, Incoterms, OEA, Valor en Aduana. Infraestructura base: `LocaleProvider`, `useTranslation`, `LanguageSwitcher`, persistencia localStorage. Sidebar y topbar bilingües. Posteriormente ampliado en v5.12.1 con la sección CBAM completa (8 páginas, 8 componentes) y en v5.13.0 con cobertura completa.

---

## Novedades v5.11.0 (Abril 2026)

### 🧾 Factura OCR + 🌍 Motor CBAM regulatorio v2

Doble frente: nueva herramienta de extracción de datos de facturas con IA para acelerar la preparación de despachos, y reescritura del motor de cálculo CBAM para alinearlo 100% con los reglamentos de ejecución publicados en diciembre 2025, con trazabilidad legal completa en el PDF.

#### 🧾 Factura OCR (`/factura-ocr`) — Nueva herramienta

Módulo completo de extracción estructurada de datos de facturas (PDF, JPG, PNG) con IA, pensado como paso previo al despacho: sube una factura, obtén un JSON limpio listo para exportar a Excel.

- **Extracción con Claude Sonnet** (`app/api/extract-invoice/route.js`): cabecera (proveedor, país, nº factura, incoterm, moneda, totales) + líneas (descripción, cantidad, precio, peso, total). 353 líneas de orquestación con prompts específicos por layout.
- **Validador estructural** (`lib/invoiceValidator.js`, 286 líneas): detecta errores de decimales, totales que no cuadran, incoterms faltantes, moneda inconsistente. Bloquea el guardado con mensajes accionables al usuario.
- **UI estilo Excel**: transformación de las tarjetas originales en filas densas tipo hoja de cálculo con celdas navegables, pie sticky con totales (Cantidad, Total, Peso) y footer de agregados en la tabla de resultados.
- **Clasificación TARIC inline** (`/api/extract-invoice/classify`): para cada línea, sugerencia de código CN con `classifyProduct()` del módulo clasificador IA — sin salir de la pantalla.
- **Exportación Excel** (`lib/excelExporter.js`, 383 líneas): plantilla multi-hoja (Cabecera, Líneas, Totales) con estilos corporativos, autoanchos y fórmulas vivas; reutilizable para otros flujos.
- **Historial con soft-delete** (`app/api/extract-invoice/history/route.js`): tabla `invoice_extractions` con RLS estricta por `user_id`, recuperación de extracciones antiguas, re-descarga de Excel sobre el snapshot JSON guardado y borrado reversible (`deleted_at`). Nunca se persiste el archivo original — solo el JSON estructurado (GDPR-friendly).
- **Seguridad de subida** (`lib/fileSecurity.js`): validación MIME/tamaño, anti-CSRF por `Origin`, rate limiting per-user con Upstash (`lib/rate-limit.js`) y cabeceras `SECURE_RESPONSE_HEADERS` en todas las rutas.
- **Acceso rápido desde dashboard**: card con badge `NUEVO` enlazando a `/factura-ocr`.
- **Set de facturas de prueba** (`test-invoices/`) con casos cubiertos: FOB perfecta, factura con errores de decimales, proforma sin incoterm.

#### 🌍 Motor CBAM regulatorio v2 — Alineación total con Reg. 2025/2548, 2620 y 2621

Tras revisión crítica del documento de referencia externo (Noatum) se detectaron errores matemáticos en el ejemplo. Nuestro motor se ha reescrito siguiendo **exclusivamente** los reglamentos primarios, y el PDF ahora cita cada parámetro con su acto jurídico.

**Nuevo módulo `lib/cbamRegulatoryParams.js` (199 líneas)** — fuente única de verdad con:
- **F_CBAM por año** (Art. 36(2)(b) Reg. (UE) 2023/956): 2026=0,975 · 2027=0,95 · 2028=0,90 · 2029=0,775 · 2030=0,515 · 2031=0,39 · 2032=0,265 · 2033=0,14 · 2034=0,0
- **FCI** (Reg. Ejecución (UE) 2025/2620): 1,0 provisional 2026 pendiente de publicación CE
- **Precio certificado CBAM**: 74,76 €/tCO₂e (Q1 2026), Reg. Ejecución (UE) 2025/2548 — ya no usa precio EU ETS spot
- **`REGULATORY_SOURCES`** con título, URL oficial BOE/EUR-Lex e ID de cada reglamento para citación dinámica
- **`getRegulatoryParamsForYear(year)`** — devuelve objeto completo con valores + fuentes listo para incrustar en snapshots

**Calculadora (`lib/cbamAdvisoryCalculator.js`) — fórmula corregida:**

```
Emisiones declaradas   = Toneladas × max(0, FE − BM)
Certificados a entregar = Toneladas × max(0, FE − F_CBAM × FCI × BM)
Coste                  = Certificados × Precio certificado CBAM
```

Mientras F_CBAM < 1 el importador conserva una parte de asignación gratuita implícita (AGIE). Validación cruzada: reproduciendo el ejemplo Noatum con nuestra fórmula, el escenario "defaults" da **51.060,87 €** (coincide exactamente) y "reales con BM correcto" da 24.120,36 € (52,8% de ahorro) — confirmando que el incentivo regulatorio a obtener datos reales del proveedor funciona.

**Snapshot v2 (`lib/cbamReportSnapshot.js`):**
- Nuevos campos por línea: `incorporatedEmissions` (Tn × FE), `effectiveBenchmark` (F_CBAM × FCI × BM), `freeAllocationImplicit` (AGIE), `certificatesAfterAdjustment`
- Nuevos totales: `totalIncorporatedEmissions`, `totalFreeAllocation`
- **`meta.regulatoryParams`** con F_CBAM, FCI, precio, fecha, fuentes y `version: 2` — **cada informe es reproducible** con los valores vigentes en el momento de su emisión aunque mañana cambien las constantes

**PDF del informe (`lib/cbamReportGenerator.jsx`) — Trazabilidad legal visible:**
- **Sección 5 reescrita**: nueva caja con la fórmula oficial, tabla de desglose `Emisiones incorporadas − AGIE = Certificados a entregar × Precio`, citas a Reg. 2023/956 + 2025/2620 + 2025/2548. Eliminada frase obsoleta "precio efectivo del EU ETS".
- **Sección 7 ahora "Metodología y Marco Legal"**: tabla de parámetros regulatorios aplicados (F_CBAM, FCI, precio, valores por defecto) con fuente jurídica en cada fila, listado de reglamentos generado dinámicamente desde `REGULATORY_SOURCES`.
- **Resumen ejecutivo**: la línea "Parámetros de cálculo" cita explícitamente precio CBAM + F_CBAM + FCI en vez del genérico "Precio CO₂".
- Cualquier cliente puede abrir el informe y verificar línea a línea **qué valor se usó y qué artículo lo establece** — defensa directa ante objeciones técnicas.

**Cambios técnicos:**
- 8 ficheros modificados + 7 ficheros nuevos
- 0 dependencias nuevas (aprovecha `@react-pdf/renderer`, Claude SDK, Upstash ya presentes)
- Build limpio (`npm run build`) — `/factura-ocr` 12 kB · `/cbam/asesoria/*` sin impacto medible
- Backward compatible: snapshots `version: 1` antiguos se siguen renderizando correctamente

---

## 🆕 Novedades v5.10.0 (Abril 2026)

### 📋 Gestor de Despachos v2 — Historial, comentarios, alertas inteligentes y Kanban

Salto del módulo de despachos de "tabla editable" a herramienta de trabajo diario real: trazabilidad completa de cambios, colaboración por despacho, alertas accionables y una vista Kanban por fase.

#### Historial de actividad por despacho
- **Auto-log fire-and-forget** de cada cambio de estado/campo en `dispatch_timeline` — nunca bloquea el guardado del usuario
- **Helper compartido** `lib/dispatchActivity.js` con `logActivity`, `FIELD_LABELS`, `VALUE_LABELS` y `formatRelativeTime` traducidos al español
- **Nuevo componente** `<ActivityTimeline />` en la pestaña Timeline del detalle: timeline vertical, colapsable a 10, muestra `antes → después` con etiquetas humanas
- **Reuso** de la tabla `dispatch_timeline` existente en lugar de duplicar esquema

#### Comentarios por despacho
- **Nueva tabla** `dispatch_comments` con RLS completa (view/insert/delete)
- **Migración SQL con seed**: las notas (`dispatches.notes`) previas se copian automáticamente como primer comentario del hilo
- **`<CommentThread />`**: textarea con Cmd/Ctrl+Enter, borrado propio, colapso "Ver anteriores", formato relativo
- **Columna "Notas/Alertas"** de la tabla principal muestra el último comentario + contador, clic enlaza a `/despachos/{id}#comentarios`

#### Alertas inteligentes (array, no singular)
- **8 reglas activas** — cada despacho puede tener varias alertas simultáneas:
  1. `ETA CUMPLIDA` (import con ETA ≤ hoy sin sumaria activada)
  2. `ETD MAÑANA` (export con ETD en ≤1 día)
  3. `DUA PENDIENTE +48h` — medido desde el timestamp real del cambio `stage_docs → ok` en `dispatch_timeline`, no desde `updated_at`
  4. `PARAADUANEROS` (ETA inminente + entradas sin nº de expediente)
  5. `LEVANTE PENDIENTE +48h` — medido desde el timestamp real del cambio `dua_status → mrn`
  6. `BLOQUEADO +24h` (cualquier stage en estado `blocked`)
  7. `EUR.1 PENDIENTE` (export con EUR.1 requerido y ETD ≤2 días)
  8. `SIN FECHA` (informativa)
- **Contadores en cabecera** (`Críticos: N` / `Atención: N`) usan `flatMap` para sumar todas las alertas por tipo
- **Filas apilan hasta 2 chips + badge `+N`** con tooltip de detalle
- **Banner "Alertas activas"** en la página de detalle entre hero y cards

#### Vista Kanban con toggle Tabla ↔ Kanban
- **5 columnas**: Documentación · Sumaria/Gastos · DUA · Levante · Cierre
- **`getKanbanColumn()` por prioridad** (de la fase más avanzada hacia atrás) — garantiza que todo despacho cae en **exactamente una** columna, sin huecos ni solapes
- **Tarjetas** con expediente, cliente, ETA con días relativos, iconos de tipo de operación y alertas apiladas
- **Borde rojo** para tarjetas con alertas críticas, navegación a detalle con clic

#### Fix de zonas horarias
- **`parseSupabaseDate`** trata las columnas `timestamp without time zone` como UTC añadiendo `Z` cuando falta — corrige los "hace Xh" y las reglas de +48h en Europe/Madrid (antes mostraba "hace 2h" para un evento recién creado)

**Cambios técnicos:**
- 6 ficheros tocados (2 páginas modificadas + 4 componentes/helpers nuevos)
- 0 dependencias nuevas
- Build limpio (`npm run build`) — `/despachos` 7.54 kB · `/despachos/[id]` 8.31 kB
- Verificado end-to-end con Claude Preview (migración de notas, log de cambios, Kanban, timezone)

---

## 🆕 Novedades v5.9.0 (Abril 2026)

### 📋 CBAM Phase 3 — Panel Admin + Informes PDF + Emails transaccionales

Cierre del ciclo completo del servicio de Asesoría Premium CBAM: del intake del cliente al informe entregado, con panel administrativo, generación de informes PDF versionados y notificaciones bilingües.

#### Panel administrativo (`/admin/cbam/asesoria`)
- **Listado** con filtros por estado, búsqueda y paginación
- **Detalle con 5 pestañas**: Cliente, Productos, Documentos, Cálculos, Informe
- **Acciones admin**: Ejecutar cálculo, generar informe, marcar como pagado, entregar al cliente
- **Gating de estados**: `draft → submitted → in_review → report_ready → pending_payment → paid → delivered`

#### Generación de informes PDF
- **`@react-pdf/renderer`** con plantilla profesional bilingüe
- **Snapshots versionados**: Cada informe se almacena inmutable en Supabase Storage
- **Descarga desde vista cliente** cuando el informe está `delivered`
- **Release manual del admin**: El cliente solo ve el informe tras pago confirmado

#### Emails transaccionales (Resend, ES + EN)
- **Intake received**: Confirmación al cliente + notificación al admin
- **Report ready / Invoice**: Cuando el admin marca listo para pago
- **Delivery**: Entrega del PDF al cliente tras pago confirmado
- **Plantillas bilingües** con branding LexAduana

#### Fix crítico Phase 2 — RLS con sesión del usuario
- **Dependency injection** en `lib/cbamAdvisoryService.js`: cada función acepta un `client` Supabase opcional
- **Route handlers** propagan el cliente con sesión (`createRouteHandlerClient`) → respeta RLS por `auth.uid()`
- **Admin endpoints** inyectan `supabaseAdmin` (service_role) explícitamente
- **Backward compatible**: sin cliente se usa el singleton anónimo (no rompe código existente)
- **Lazy `supabaseAdmin`** via Proxy: defiere la validación de env vars a runtime para no romper el build de Next.js

#### Actualizaciones de datos
- **Precio ETS Q1 2026**: `75,36€/tCO₂e` (official CBAM price, 2026-04-08) cargado en `cbam_ets_prices` como `is_current`
- Impacto inmediato en calculadora, simulador y motor de asesoría

#### SEO layouts + sitemap
- **`app/sitemap.js`** y **`app/robots.js`** dinámicos
- **Layouts SEO por sección** (CBAM, EUDR, OEA, Calculadora, Incoterms, Valor en Aduana) con metadata rica
- **`components/JsonLd.js`** para structured data en páginas clave

---

## Novedades v5.8.0 (Abril 2026)

### 🎨 Rediseño visual completo — Dark Theme & Design System unificado

Rediseño integral de toda la plataforma con un sistema de diseño coherente: navy `#0A3D5C`, gold `#F4C542`, dark `#060d16`.

#### Páginas standalone (dark theme completo)
- **Homepage** (`/`): Fondo oscuro continuo `#060d16`, tool showcase con tabs dinámicos, glassmorphism cards, números dorados animados, ambient glow effects
- **Auth pages** (`/auth/*`): Login, registro, recuperar y resetear contraseña con glassmorphism, inputs oscuros, CTA dorado

#### Páginas dentro del sidebar (heroes navy + body claro)
- **CBAM Hub** (`/cbam`): Hero dark navy con deadline dorado, headers por sección (navy, rojo, esmeralda), stats con números dorados
- **Incoterms** (`/incoterms`): Hero navy flat + CTA dorado, pattern overlay consistente
- **Valor en Aduana** (`/valor-en-aduana`): Mismo tratamiento de hero unificado
- **Glosario** (`/glosario`): Nuevo hero añadido + paleta actualizada de azul genérico a navy/gold

#### Micro-mejoras UX
- **Sidebar**: Logo con fondo blanco para consistencia visual
- **UserMenu**: Botón registrarse navy sólido (sin gradiente azul/indigo)
- **Topbar**: Títulos de página para Incoterms y Valor en Aduana
- **Dashboard**: Fondo unificado `bg-slate-50`, welcome card navy con pattern overlay, accesos rápidos como cards blancas uniformes con hover suave (sin gradientes random), CTA corregido a `/calculadora`

---

## Novedades v5.7.0 (Abril 2026)

### ⚖️ Página de Valor en Aduana (`/valor-en-aduana`)
Guía operativa completa de valoración aduanera para despachantes y profesionales de comercio exterior. 6 bloques de contenido, 100% estático, sin backend.

#### Bloque 1 — Métodos de valoración
- **6 métodos secuenciales del CAU** (arts. 70-74): Valor de transacción → Mercancías idénticas → Similares → Deductivo → Calculado → Último recurso
- **Indicadores de frecuencia**: Uso habitual (~90%), subsidiarios, excepcional
- **Flujo visual M1→M6**: Flechas secuenciales mostrando jerarquía obligatoria
- **Condiciones y cambio clave** por método

#### Bloque 2 — Wizard de ajustes por Incoterm
- **11 botones de Incoterm**: Selector interactivo (EXW→CIF)
- **Panel dinámico**: Adiciones (rojo), deducciones (verde), fórmula (azul)
- **Alerta para el despachante**: Avisos específicos por Incoterm (críticos para EXW/DDP)
- **Datos reutilizados** de `lib/incotermsData.js` (sin duplicación)

#### Bloque 3 — Ajustes obligatorios CAU
- **Art. 71 (adiciones)**: 6 conceptos que SIEMPRE se suman — comisiones, envases, assists, royalties, producto reventa, transporte/seguro
- **Art. 72 (exclusiones)**: 7 conceptos que NUNCA se incluyen — transporte posterior, construcción/montaje, financiación, derechos reproducción, comisiones compra, gravámenes UE, pagos distribución
- **Warnings y ejemplos reales**: Assists desde China, royalties vinculados a marca

#### Bloque 4 — Base arancel vs Base IVA
- **2 cards de definición**: Base arancel (A00, art. 70-72 CAU) vs Base IVA importación (B00, art. 83 LIVA)
- **Tabla comparativa de 10 conceptos**: ✅/— para cada base (el arancel ≠ la base del IVA)
- **3 ejemplos numéricos con tabs**: FOB (Shanghai→Madrid), CIF (Rotterdam→Barcelona), DDP (Shenzhen→Valencia)
- **4 pasos por ejemplo**: Valor en aduana → Arancel → Base IVA → IVA → Resumen
- **Warning DDP**: Muestra declaración incorrecta vs correcta con sobrepago real

#### Bloque 5 — DV1 y casillas DUA/H1
- **Qué es el DV1**: Declaración de Valor obligatoria >20.000 EUR, excepciones
- **3 secciones del DV1**: Identificación (cas. 1-15), Adiciones (cas. 18), Deducciones (cas. 23)
- **Fórmula operativa**: Estilo terminal oscuro — D.E. 14 01 ± D.E. 14 07 = Valor en aduana ≈ D.E. 14 06
- **Tabla de 16 casillas DUA/H1**: 5 columnas (concepto, DUA antiguo, H1 vigente, grupo EUCDM, qué contiene)
- **Nota migración**: Explicación DUA → H1 (EUCDM)

#### Bloque 6 — Casos problemáticos
- **6 escenarios reales expandibles**: DDP sin desglose, rechazo valor aduana, vinculación entre partes, royalties, Incoterm inconsistente, THC destino
- **Estructura por caso**: Problema → Por qué ocurre → Solución → Referencia legal
- **Bordes de severidad**: Colores según gravedad del caso

#### Cross-links y navegación
- **3 cards de enlace**: A /incoterms, /calculadora, /cbam/assessment
- **Sidebar actualizado**: Enlace ⚖️ Valor en Aduana en sección RECURSOS
- **CTA en /incoterms**: Actualizado de "Próximamente" a enlace directo a /valor-en-aduana

#### Arquitectura
- **Datos**: `lib/customsValueData.js` — 6 exports (VALUATION_METHODS, NUMERICAL_EXAMPLES, DV1_INFO, EXTENDED_DUA_H1_FIELDS, ENHANCED_CAU_ADJUSTMENTS, PROBLEMATIC_CASES, DUTY_VS_VAT_COMPARISON, PAGE_SECTIONS)
- **Layout server**: `app/valor-en-aduana/layout.js` para metadata SEO
- **Page client**: `app/valor-en-aduana/page.js` con 6 componentes de bloque + hero + mini-TOC
- **Sin dependencias nuevas**: Solo Tailwind CSS existente
- **Sin backend**: Contenido 100% hardcoded, sin API ni base de datos

---

## 🆕 Novedades v5.6.0 (Abril 2026)

### 📦 Rediseño tabla Incoterms estilo TIBA + Valor en aduana

#### Tabla COSTE/RIESGO (rediseño completo)
- **10 etapas logísticas**: Embalaje → Carga → Transp. interior → Aduana exp. → Manip. origen → Flete int. → Manip. destino → Aduana imp. → Transp. destino → Descarga
- **Cabecera visual con emojis**: 📦📤🚛📋🏗️🚢🏗️🛃🚚📥 con etiquetas por etapa
- **Línea de flujo**: "País de origen" → "Transporte" → "País de destino"
- **Barras COSTE y RIESGO separadas**: Muestra cómo en Incoterms tipo C (CPT, CIP, CFR, CIF) el vendedor paga el flete pero el riesgo se transfiere antes
- **Fila SEGURO**: Para CIP y CIF, tercera fila indicando cobertura del vendedor
- **Colores TIBA**: Azul (vendedor) y ámbar (comprador) — más intuitivo visualmente
- **Aviso interactivo pulsante**: Indica que las filas son expandibles
- **Scroll horizontal**: Soporte para pantallas con sidebar abierto

#### Valor en aduana e Incoterms (sección nueva)
- **Tabla de ajustes**: Qué sumar/restar al precio facturado por Incoterm para llegar al valor CIF frontera UE
- **Base arancel vs IVA**: Comparativa de 9 conceptos (el arancel ≠ la base del IVA)
- **Casillas DUA/H1**: Mapeo de 12 casillas del DUA antiguo a Data Elements del H1 (CAU)
- **Ejemplo numérico**: FOB Los Ángeles→Madrid, 45.000 EUR en 4 pasos → total tributos 12.917 EUR
- **Ajustes CAU**: Arts. 71 (siempre sumar) y 72 (nunca incluir) en dos columnas
- **Alertas del despachante**: En cada panel expandible (críticas para EXW/DDP, advertencias para CIP/CFR, etc.)
- **CTA Valor en Aduana**: Banner con enlace directo a `/valor-en-aduana`

---

## 🆕 Novedades v5.5.0 (Abril 2026)

### 📦 Página Interactiva de Incoterms 2020 (`/incoterms`)
Guía profesional completa de los 11 Incoterms 2020 con enfoque práctico para importadores y exportadores.

#### Tabla interactiva
- **11 Incoterms completos**: EXW, FCA, CPT, CIP, DAP, DPU, DDP, FAS, FOB, CFR, CIF
- **Dos grupos visuales**: 7 multimodales + 4 marítimos, diferenciados con iconos
- **10 columnas de operaciones**: Cadena logística completa con barras COSTE/RIESGO
- **Código de colores**: Azul (vendedor), ámbar (comprador)
- **Filas expandibles**: Click para desplegar detalle completo con 4 secciones:
  - Qué significa (descripción ICC)
  - Impacto en el valor en aduana (fórmula + ajustes)
  - Ejemplo práctico (con cifras reales)
  - Consejo profesional (recomendaciones ICC)
- **Metadatos adicionales**: Punto de transferencia de riesgo/costes, diferencia clave, documentos típicos
- **Responsive**: Tabla en desktop, cards con mini-barras en móvil

#### Wizard de decisión ICC
- **Dos perspectivas**: Vendedor/exportador y comprador/importador
- **Árboles de decisión**: Basados en diagramas oficiales ICC
- **Preguntas Sí/No**: Flujo guiado de 3-5 pasos
- **Resultado con alternativa**: Incoterm principal + alternativa con seguro cuando aplica
- **Perspectiva contextual**: Descripción adaptada a vendedor o comprador
- **Navegación**: Botón atrás, reiniciar, cambiar perspectiva

#### Contenido SEO
- **Qué son los Incoterms 2020**: Reglas ICC, reparto de costes/riesgos, cambios vs 2010
- **Impacto en el valor en aduana**: Base CIF, ajustes por Incoterm, Código Aduanero de la Unión
- **CTA integrado**: Enlace a calculadora TARIC para calcular aranceles
- **Metadata optimizada**: Title, description, OpenGraph para posicionamiento SEO

#### Arquitectura
- **Datos**: `lib/incotermsData.js` — 11 Incoterms con COSTE/RIESGO (10 etapas), ajustes valor en aduana, alertas despachante, DUA/H1, CAU
- **Componentes modulares**: `IncotermsTable.js`, `IncotermsCustomsValue.js`, `IncotermsWizard.js`, `IncotermsSEO.js`
- **Layout server**: `app/incoterms/layout.js` para metadata + `page.js` client para interactividad
- **Sidebar**: Enlace añadido en sección RECURSOS (entre Glosario y Tipos de cambio)
- **Sin dependencias nuevas**: Solo Tailwind CSS existente
- **Sin backend**: Contenido 100% estático, sin API ni base de datos

---

## 🆕 Novedades v5.4.0 (Abril 2026)

### 📋 CBAM Phase 2 — Servicio de Asesoría Premium
Servicio profesional donde el importador envía sus datos y LexAduana genera un informe completo con análisis de exposición, cálculos de emisiones y coste estimado.

#### Backend y motor de cálculo
- **3 tablas nuevas Supabase**: `cbam_advisory_requests`, `cbam_advisory_products`, `cbam_advisory_documents`
- **RLS completo**: Cada usuario solo ve sus propias solicitudes y documentos
- **Motor de cálculo** (`cbamAdvisoryCalculator.js`): Detecta sector, obtiene benchmarks, calcula emisiones y coste
- **Escenario dual**: Calcula coste con datos reales vs valores por defecto — muestra ahorro potencial
- **Reutilización Phase 1**: Importa `checkCBAM`, `getBenchmarkDB`, `getCurrentETSPrice`, `getDefaultValueMarkupDB`, `getEmissionFactors`
- **Storage privado**: Bucket `cbam-advisory-docs` para DUAs, facturas y datos de proveedores (10MB, RLS por usuario)

#### 6 API routes nuevas
| Endpoint | Métodos | Descripción |
|----------|---------|-------------|
| `/api/cbam/advisory` | GET, POST | Listar/crear solicitudes |
| `/api/cbam/advisory/[id]` | GET, PATCH, DELETE | Detalle, actualizar, eliminar |
| `/api/cbam/advisory/[id]/products` | GET, POST, PUT | Productos (individual + bulk) |
| `/api/cbam/advisory/[id]/documents` | POST | Subida de documentos |
| `/api/cbam/advisory/[id]/submit` | POST | Confirmar intake |
| `/api/cbam/advisory/[id]/calculate` | POST | Ejecutar motor de cálculo |

#### 3 páginas nuevas
- **`/cbam/asesoria`**: Landing corporativa — cómo funciona, valor de datos reales, ejemplo de ahorro, CTAs
- **`/cbam/asesoria/solicitud`**: Wizard de intake 3 pasos (empresa → productos → documentación)
- **`/cbam/asesoria/mis-solicitudes`**: Listado de solicitudes del usuario con estado y costes

#### 4 componentes nuevos
- **`AdvisoryIntakeForm`**: Wizard multi-paso con validación, guardado de borrador, subida de archivos
- **`ProductLineEditor`**: Editor de líneas de producto con selector de país, toggle de emisiones reales, rutas de producción
- **`AdvisoryStatusBadge`**: Badge visual con 8 estados (draft → delivered)
- **`AdvisorySummary`**: Resumen de solicitud con desglose de costes, toneladas, emisiones

#### Cross-navigation
- Enlace "Asesoría CBAM Profesional" añadido en Hub CBAM (Herramientas LexAduana)
- CTA de asesoría profesional añadido al resultado "CBAM sí aplica" del Self-Assessment

#### Diseño
- Estilo sobrio y corporativo (paleta `#0A3D5C`, fondos blancos/grises)
- Orientado a director financiero / responsable de compras de pyme industrial
- Separado del estilo colorido de Phase 1

#### Flujo del usuario
```
Phase 1 (gratuita)                    Phase 2 (premium)
┌─────────────────┐                   ┌──────────────────────────────────────┐
│ Autoevaluación  │──→ "Estás      ──→│ 1. Formulario de intake (3 pasos)    │
│ /cbam/assessment│    afectado"      │ 2. Subida de documentos (DUAs, etc.) │
└─────────────────┘                   │ 3. Motor de cálculo automático       │
                                      │ 4. Escenario dual (real vs defaults) │
                                      │ 5. Informe profesional (próx. fase)  │
                                      └──────────────────────────────────────┘
```

---

## 🆕 Novedades v5.3.0 (Abril 2026)

### 🌳 Página Informativa EUDR (`/eudr`)
Página estática completa sobre el Reglamento de Deforestación de la UE (Reglamento (UE) 2023/1115):
- **7 materias primas reguladas**: Ganado, cacao, café, palma, caucho, soja, madera
- **Countdown dinámico**: Días restantes hasta aplicación (30/12/2026 operadores, 30/06/2027 pymes)
- **Proceso de diligencia debida**: 3 fases visuales (recopilación, evaluación, mitigación)
- **Sistema de clasificación de países**: 3 niveles de riesgo (bajo 1%, estándar 3%, alto 9%)
- **Sanciones**: Hasta 4% facturación, confiscación, exclusión contratación pública
- **Comparativa EUDR vs CBAM**: Tabla side-by-side para usuarios que conocen CBAM
- **Timeline de implementación**: 6 hitos desde junio 2023 hasta junio 2027
- **Recursos oficiales**: Links a EUR-Lex, TRACES, portal Comisión Europea
- **Cross-navigation**: Links cruzados EUDR ↔ CBAM ↔ Home
- **SEO optimizado**: Metadata, Open Graph, keywords para posicionamiento temprano
- **Integrada en homepage**: Card EUDR al mismo nivel visual que CBAM

### 🌐 CBAM Self-Assessment Localizado a Español
Localización completa del Self-Assessment (`/cbam/assessment`) con formato bilingüe:
- **`lib/cbamTranslations.js`**: 8 sectores, 20 categorías, 43 rutas de producción, 22 precursores, 101 países
- **Formato bilingüe**: Término en español como principal + inglés entre paréntesis en gris
- **Países en español**: Dropdown con 210 países traducidos (Turquía, Corea del Sur, etc.)
- **Fix parser**: Rutas de producción con comas dentro de paréntesis, guiones en precursores
- **Labels actualizados**: "Column A/B" → "Columna A/B", "Self-Assessment" → "Autoevaluación CBAM"

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
- **Precio certificado CBAM**: 74,76 €/tCO₂e (Q1 2026, Reg. 2025/2548)
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
| Q1 2026 | 7 abril 2026 | ✅ 74,76 €/tCO₂e |
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

#### 🆕 Self-Assessment Completo (`/cbam/assessment`)
- **573 códigos CN**: Base de datos completa del CBAM Self Assessment Tool v1.1 (CE, marzo 2025)
- **246 países**: Con estado CBAM (aplica/excluido/UE)
- **Benchmarks oficiales**: Reg. (UE) 2025/2620 con 661 valores (Column A + Column B)
- **Autocomplete inteligente**: Sugerencias por prefijo con icono de sector
- **Informe completo**: Sector, categoría, rutas de producción, precursores, provisiones especiales
- **Umbral de minimis**: Detección automática por sector
- **Localización ES/EN**: UI en español, términos técnicos bilingües (español + inglés en gris)
- **Traducciones**: 8 sectores, 20 categorías, 43 rutas, 22 precursores, 101 países

#### 🆕 Asesoría Premium — Phase 2 (`/cbam/asesoria`)
Servicio profesional de análisis de exposición CBAM para importadores:
- **Wizard de intake 3 pasos**: Datos empresa → Productos importados → Documentación
- **Motor de cálculo**: Detección automática de sector, benchmarks UE, escenario dual
- **Escenario dual**: Coste con datos reales vs valores por defecto → muestra ahorro potencial
- **Gestión de solicitudes**: Draft → Enviada → Análisis → Informe listo → Entregado
- **Upload de documentos**: DUAs, facturas, datos proveedor (Supabase Storage privado)
- **6 API routes**: CRUD completo con autenticación y verificación de ownership
- **Estilo corporativo**: Diseño sobrio orientado a decisores de negocio

#### Alertas Integradas
- **En calculadora**: Badge CBAM junto al código HS
- **En clasificador IA**: Alerta si código sugerido está afectado
- **Enlace directo**: A página de obligaciones CBAM
- **En Self-Assessment**: CTA de asesoría profesional cuando resultado es "CBAM sí aplica"

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
- **Bilingüe ES/EN**: 10 páginas públicas con toggle de idioma y persistencia en localStorage
- **Diseño premium**: Colores corporativos (#0A3D5C navy, #F4C542 gold)
- **Responsive**: Optimizado móvil y desktop (Tailwind CSS v4)
- **Landing como suite**: 3 herramientas principales con igual peso visual (no calculadora embebida)
- **Quick Access Buttons**: Navegación rápida entre herramientas
- **Autocomplete inteligente**: Búsqueda de códigos HS
- **Badges visuales**: Prioridad de alertas con iconos
- **Export PDF**: Resultados individuales
- **Google Analytics 4**: Tracking de eventos por herramienta (lib/analytics.js)

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
│   │   └── cbam/                 # APIs CBAM
│   │       ├── calculations/     # Historial cálculos usuario
│   │       ├── ets-price/        # Precio EU ETS
│   │       └── advisory/         # 🆕 Phase 2: Asesoría premium
│   │           ├── route.js      # GET/POST solicitudes
│   │           └── [id]/
│   │               ├── route.js      # GET/PATCH/DELETE detalle
│   │               ├── products/     # CRUD productos
│   │               ├── documents/    # Subida documentos
│   │               ├── submit/       # Confirmar intake
│   │               └── calculate/    # Motor de cálculo
│   ├── cbam/                     # Módulo CBAM completo
│   │   ├── assessment/           # Self-Assessment (573 CN codes)
│   │   ├── guia/                 # Guía para principiantes
│   │   └── asesoria/             # 🆕 Phase 2: Asesoría premium
│   │       ├── page.js           # Landing del servicio
│   │       ├── solicitud/        # Wizard de intake (3 pasos)
│   │       └── mis-solicitudes/  # Listado solicitudes usuario
│   ├── eudr/                     # EUDR Deforestación (informativo, bilingüe)
│   ├── bulk/                     # Calculadora masiva
│   ├── comparador/               # Comparador multi-origen
│   ├── despachos/                # Gestor de despachos
│   ├── favoritos/                # Gestión favoritos
│   ├── tipos-cambio/             # Tipos de cambio
│   ├── glosario/                 # Glosario términos
│   ├── page.js                   # Landing page (Hero + Features + CTA inline, bilingüe)
│   └── layout.js                 # Layout global (SEO, Plausible, Schema.org)
├── 📁 components/                # Componentes React
│   ├── LanguageSwitcher.js       # 🆕 Toggle ES/EN con localStorage
│   ├── UserMenu.js               # Menú autenticación
│   ├── HSCodeAutocomplete.js     # Búsqueda HS
│   ├── ExportPDF.js              # Exportación PDF
│   ├── ExchangeRateBanner.js     # Banner tipos cambio
│   ├── CBAMAlert.js              # Alertas CBAM
│   ├── CBAMCostSimulator.js      # Simulador costes CBAM
│   └── cbam/
│       ├── CBAMVerifier.js       # Verificador CBAM interactivo
│       ├── CBAMSelfAssessment.js # Self-Assessment bilingüe ES/EN
│       └── advisory/             # 🆕 Phase 2: Componentes asesoría
│           ├── AdvisoryIntakeForm.js   # Wizard multi-paso
│           ├── ProductLineEditor.js    # Editor líneas producto
│           ├── AdvisoryStatusBadge.js  # Badge estado solicitud
│           └── AdvisorySummary.js      # Resumen con costes
├── 📁 lib/                       # Utilidades
│   ├── supabase.js               # Cliente Supabase server
│   ├── supabase-browser.js       # Cliente Supabase client
│   ├── calculateTariff.js        # Motor cálculo v5.2
│   ├── rate-limit.js             # Rate limiting con Upstash
│   ├── validation.js             # Validadores de entrada
│   ├── cbamData.js               # Datos CBAM (códigos, sectores, timeline)
│   ├── cbamService.js            # Capa datos CBAM (Supabase + fallback)
│   ├── cbamAdvisoryService.js    # 🆕 CRUD asesoría (requests, products, docs)
│   ├── cbamAdvisoryCalculator.js # 🆕 Motor cálculo asesoría premium
│   ├── cbamAssessmentData.js     # Self-Assessment helpers + 573 CN codes
│   ├── cbamTranslations.js       # Traducciones CBAM ES/EN (sectores, rutas, precursores, países)
│   ├── taricTranslations.js      # Traducciones estáticas (fallback)
│   ├── vatCalculator.js          # Lógica IVA variable
│   ├── csvParser.js              # Parser CSV bulk
│   ├── excelExporter.js          # Exportador Excel
│   ├── analytics.js              # trackEvent helper (no-op tras migración a Plausible solo pageviews)
│   ├── i18n.js                   # 🆕 Core i18n (LocaleProvider, useLocale, useTranslation)
│   ├── i18n/                     # 🆕 Diccionarios de traducción ES/EN
│   │   ├── auth.js               # Login, register, forgot/reset password
│   │   ├── landing.js            # Landing page completa
│   │   ├── eudr.js               # EUDR (~120 strings)
│   │   ├── clasificador.js       # Clasificador IA (~45 strings)
│   │   ├── incoterms.js          # Incoterms 2020 (~80 strings)
│   │   ├── oea.js                # OEA (~90 strings)
│   │   └── valor-en-aduana.js    # Valor en Aduana UI (~140 strings)
│   └── customsValueData.en.js    # 🆕 Datos Valor en Aduana EN (~490 líneas)
├── 📁 scripts/                   # Scripts migración y schemas
│   ├── bloque1-schema.sql        # Schema bloque 1 (master data)
│   ├── loadBlock1.js             # Carga bloque 1 (5 tablas)
│   ├── bloque2-schema.sql        # Schema bloque 2 (core data)
│   ├── loadBlock2.js             # Carga bloque 2 (4 tablas)
│   ├── bloque3-schema.sql        # Schema bloque 3 (lookup tables)
│   ├── loadBlock3.js             # Carga bloque 3 (5 tablas)
│   ├── cbam-schema.sql           # Schema CBAM Phase 1 (12 tablas)
│   ├── cbam-assessment-schema.sql # Schema Self-Assessment
│   └── cbam-advisory-schema.sql  # 🆕 Schema Phase 2 (3 tablas + RLS)
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

-- ══════════════════════════════════════════════
-- CBAM Phase 1 (12 tablas de referencia)
-- ══════════════════════════════════════════════
cbam_sectors                    -- 6 sectores afectados
cbam_cn_codes                   -- Códigos CN sujetos a CBAM
cbam_cn_codes_full              -- 573 códigos Self-Assessment
cbam_excluded_countries         -- Países excluidos (EEE, Suiza)
cbam_emission_factors           -- Factores emisión por sector
cbam_benchmarks                 -- Benchmarks UE
cbam_benchmarks_official        -- Benchmarks oficiales (Column A/B)
cbam_timeline                   -- Eventos y plazos CBAM
cbam_certificates               -- Certificados DUA (Y128, Y134...)
cbam_default_value_markup       -- Markup progresivo 2026-2028
cbam_config                     -- Configuración clave-valor
cbam_ets_prices                 -- Precios EU ETS
cbam_countries                  -- 246 países con estado CBAM
cbam_calculator_saves           -- Historial cálculos calculadora (multi-producto)

-- ══════════════════════════════════════════════
-- 🆕 CBAM Phase 2: Asesoría Premium (3 tablas)
-- ══════════════════════════════════════════════
cbam_advisory_requests          -- Solicitudes de asesoría (empresa, estado, totales)
cbam_advisory_products          -- Líneas de producto por solicitud
cbam_advisory_documents         -- Documentos subidos (DUAs, facturas)
-- + bucket Storage: cbam-advisory-docs (privado, RLS por usuario)
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

### ✅ Completado (v5.2.1 - Marzo 2026)

#### 🎨 Rediseño Landing Page
- **Reposicionamiento de marca**: De "calculadora de aranceles" a "suite profesional de comercio exterior"
- **Nuevo Hero centrado**: Tagline gold + headline + subtítulo + 2 CTAs (Empezar gratis / Ver herramientas)
- **3 tarjetas principales iguales**: Calculadora TARIC, Clasificador IA y Módulo CBAM con mismo peso visual
- **3 tarjetas secundarias compactas**: Comparador, Despachos (beta), Tipos de Cambio
- **Banner CBAM urgencia**: Aviso de obligatoriedad desde enero 2026
- **Barra de confianza**: "Datos EUR-Lex oficiales · Actualización mensual · 100+ profesionales"
- **Scroll suave**: Botón "Ver herramientas" navega a sección de herramientas
- **Calculadora eliminada de landing**: La landing es puerta de entrada, no herramienta
- **Footer actualizado**: Subtítulo "Suite Profesional de Comercio Exterior"

#### 📊 Plausible Analytics — Privacy-friendly, EU
- **Plausible Cloud** integrado en `app/layout.js` vía `<PlausibleAnalytics />` (`components/analytics/PlausibleAnalytics.jsx`).
- **Datos en EU** (Frankfurt), sin cookies, sin tracking cross-site → no requiere consent banner RGPD.
- **Modo actual**: solo pageviews. Sin custom events ni goals.
- **Helper `lib/analytics.js`**: `trackEvent()` queda como **no-op** preservando los call sites existentes (`calculate_tariff`, `classify_product`, `compare_origins`, `cbam_check`, `generate_rrm`). Cuando se habiliten goals en Plausible, redirigir el cuerpo a `window.plausible(eventName, { props: params })`.
- **Migración**: ver commit `feat: migración analítica GA4 → Plausible` (2026-04-29). GA4 (`G-PYT83VPMB7`) eliminado completamente.
- **Páginas instrumentadas**: calculadora, clasificador, CBAMVerifier, comparador

#### 🔍 SEO Actualizado
- **Title**: "LexAduana | Suite Profesional de Comercio Exterior"
- **Description**: Menciona las 3 herramientas principales + EUR-Lex
- **Open Graph / Twitter Cards**: Actualizados con nuevo posicionamiento
- **Schema.org**: Descripción actualizada como suite de herramientas

### ✅ Completado (v5.12.0 - Abril 2026)

#### 🌐 Soporte bilingüe ES/EN
- Infraestructura i18n con React Context + localStorage
- 10 páginas públicas traducidas (~600 strings)
- Datos Valor en Aduana completamente traducidos (~490 líneas)
- LanguageSwitcher en sidebar y páginas standalone
- Sin dependencias externas (i18n custom, zero-bundle-cost)

### ✅ Completado (v5.4.0 - Abril 2026)

#### 📋 CBAM Phase 2 — Asesoría Premium
- Servicio profesional de análisis de exposición CBAM
- 3 tablas Supabase nuevas + Storage bucket privado
- Motor de cálculo con escenario dual (real vs defaults)
- Wizard de intake 3 pasos + gestión de solicitudes
- 6 API routes con auth + 4 componentes + 3 páginas
- Cross-navigation desde Hub CBAM y Self-Assessment

---

### 🔜 Próximamente (v5.5 - Q2 2026)

#### 🎨 Renovación Frontend (páginas internas)
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
| **Asesoría CBAM Premium** | Consultar | Análisis exposición + informe profesional |
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

## 🛡️ Operaciones administrativas

### Baja de usuarios — RGPD

La baja de un usuario en LexAduana **debe pasar siempre por el endpoint** `POST /api/account/delete`, accesible desde el botón "Eliminar mi cuenta" en `/dashboard`.

#### Por qué

El endpoint orquesta dos pasos en orden:

1. Llama a la función SQL `pseudonymize_user_data_on_delete_by_id(user_id)` que rellena `user_id_hash` con SHA-256 del `user_id` en 11 tablas operativas (`user_consents`, `classification_logs`, `invoice_extractions`, `rrm_requests`, `dispatches` ×2 columnas, `dispatch_checklist`, `dispatch_comments`, `dispatch_timeline`, `cbam_advisory_requests`, `cbam_calculator_saves`).
2. Llama a `supabase.auth.admin.deleteUser(user_id)` que dispara el `ON DELETE SET NULL` de los FKs y borra al usuario.

El resultado: las filas relacionadas conservan trazabilidad pseudonimizada (RGPD art. 17.3.b/e — defensa de reclamaciones y obligaciones legales) durante el periodo de retención fijado en `gdpr_daily_purge` antes de eliminarse definitivamente.

#### Lo que NO debe hacerse nunca

- ❌ Borrar usuarios desde el panel de Supabase: **Authentication → Users → Delete user**.
- ❌ Ejecutar `DELETE FROM auth.users WHERE ...` directamente en el SQL Editor.
- ❌ Llamar a `supabase.auth.admin.deleteUser()` desde otro script sin invocar antes `pseudonymize_user_data_on_delete_by_id()`.

Cualquiera de estas acciones salta la pseudonimización. Las filas relacionadas quedan con `user_id` en NULL pero sin `user_id_hash` rellenado, perdiendo la evidencia legal pseudonimizada.

> **Por qué no hay trigger automático en `auth.users`**: Supabase no permite `CREATE TRIGGER` sobre `auth.users` ni vía MCP ni vía SQL Editor en planes no-Enterprise. Por eso la pseudonimización vive en un endpoint de aplicación, no en un trigger automático.

#### Si necesitas borrar un usuario manualmente (uso administrativo)

Para casos administrativos sin acceso al UI del usuario (ejemplo: usuarios huérfanos de pruebas, baja por solicitud por email, etc.), usa esta secuencia en el SQL Editor:

```sql
-- 1. Pseudonimizar primero
SELECT public.pseudonymize_user_data_on_delete_by_id('USER_UUID_AQUI');
```

```javascript
// 2. Borrar usuario después desde un script Node con service_role.
//    El SQL Editor de Supabase suele rechazar DELETE FROM auth.users por
//    permisos, así que la vía oficial es el cliente admin:
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(URL, SERVICE_ROLE_KEY)
await supabase.auth.admin.deleteUser('USER_UUID_AQUI')
```

#### Auditoría

La función `pseudonymize_user_data_on_delete_by_id` es `SECURITY DEFINER` con `GRANT EXECUTE TO service_role`. Está versionada en `supabase/migrations/`. El endpoint `app/api/account/delete/route.js` es la única vía oficial documentada de invocación.

La purga programada (`gdpr_daily_purge` a las 03:00 UTC) se audita en `public.purge_audit_log`, accesible solo con `service_role`/`postgres`.

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

*Última actualización: Abril 2026*
*Versión: 5.4.0*
