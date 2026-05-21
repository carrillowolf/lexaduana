# CBAM v3 — Roadmap de Fase B

Origen: análisis de webinar 2026-05-12 + validación cruzada con diapositiva
DUBRINK + ficha de diagnóstico read-only (Bloque 0). Las features B1, B2 y B3
están especificadas pero **no implementadas** en este PR — quedan para
priorización futura tras el merge del saneamiento (Bloques 0-3).

Las "Notas de futuras iteraciones" del final del documento recogen deudas
técnicas detectadas durante el saneamiento que no entraban en el alcance
del PR pero conviene no perder.

---

## Feature B1 — Timeline operativo de pagos CBAM

**Origen:** diapositiva 8 de la webinar 2026-05-12.

Plazos clave para los imports de 2026 (Reg. (UE) 2023/956, Art. 22):

| Fecha          | Acción                                                                    |
| -------------- | ------------------------------------------------------------------------- |
| 1-feb-2027     | Inicia compra de certificados CBAM en el registro                         |
| Fin Q1 2027    | Obligación de tener al menos el 50% de los certificados necesarios        |
| 30-sep-2027    | Fecha límite para entrega de certificados                                 |
| 31-oct-2027    | Fecha límite para recompra de certificados sobrantes (al precio de compra) |
| 1-nov-2027     | Cancelación automática de certificados no utilizados                      |

**Implementación propuesta:**

1. Componente `<CBAMPaymentTimeline year={2026} />` en `components/cbam/`.
   Línea de tiempo horizontal con las cinco fechas.
2. Integración en `/cbam/asesoria` (sección educativa), PDF Advisory
   (sección 4 nueva entre "Resumen" y "Líneas"), y email "Report delivered"
   (recordatorio post-venta).
3. Parametrizable por año (en 2027, todas las fechas +1 año).

**Aprovechar para reutilizar pieza ya cableada del Bloque 0**: el endpoint
público `GET /api/cbam/ets-price` está cableado pero hoy no tiene
consumers frontend. Reutilizarlo desde el componente Timeline para mostrar
el precio actual junto a la fecha de Q1 2027 (más contexto operativo).

**Esfuerzo estimado:** 1 día.

---

## Feature B2 — Coste CBAM por proveedor / por tonelada

**Origen:** diapositiva 17 de la webinar. Insight comercial: ayuda al cliente
a renegociar con proveedores o cambiarlos.

**Implementación propuesta:**

1. Campo derivado por línea en el calculator:
   `cbamCostPerTonneOfProduct = lineCost / tonnes`. Persistir en snapshot.
2. Nueva sección en PDF "Comparativa de coste CBAM por proveedor" (solo si
   hay >1 proveedor para el mismo CN). Tabla y gráfico de barras por CN.
3. Recomendación accionable: "Cambiar X tn del proveedor Y al Z ahorraría
   aprox. Z € en CBAM."
4. Vista comparativa en panel admin para revisión previa.
5. Mockup de esta sección en `/cbam/asesoria` como prueba de valor comercial.

**Esfuerzo estimado:** 2-3 días.

---

## Feature B3 — Deducción Art. 9: precio del carbono pagado en origen

**Origen:** validación cruzada con diapositiva DUBRINK contra la fórmula
del Art. 5 + Art. 9 Reg. (UE) 2023/956.

**Contexto regulatorio:** la fórmula CBAM completa tiene tres términos:

```
(Emisiones − Asignación gratuita − Precio carbono pagado en origen) × Precio certificado
```

Nuestro motor implementa los dos primeros. El tercero (Art. 9, deducción
por precio de carbono pagado efectivamente en el país de origen) se omite
deliberadamente y de forma correcta, porque:

- Es una deducción **opcional** que el declarante solicita, no parte del
  cálculo base.
- Requiere **prueba documental certificada** por un tercero independiente.
- Para datos por defecto **no es aplicable en 2026**: los precios por
  defecto del carbono solo los determinará la Comisión a partir de 2027.

El PDF ya incluye nota explícita en sección 7 (metodología) para que el
cliente sepa que el motor lo omite por diseño y pueda solicitarlo si tiene
prueba documental.

**Implementación futura (cuando entre en alcance):**

1. Campo de entrada opcional `carbonPricePaidOrigin` por línea (numeric
   €/tCO₂e, default 0). UI en el formulario de productos de Advisory.
2. Persistir en `cbam_advisory_products` como columna nueva
   `carbon_price_paid_origin NUMERIC NULL`.
3. Calculator: extender `calculateLineMath` para aceptar un cuarto término
   en el raw:
   ```
   raw = max(0, Tn·FE − Tn·F_CBAM·FCI·BM − Tn·(carbonPricePaidOrigin / price))
   ```
   (o equivalente, según interpretación exacta de la fórmula del Art. 9
   tras los actos de ejecución pendientes).
4. PDF: nueva fila en el resumen agregado mostrando el descuento aplicado
   por línea, con cita explícita al Art. 9 y al documento probatorio
   adjunto al expediente.
5. Servicio asociado: **gestión de la prueba documental** (verificación
   del documento del proveedor por un tercero acreditado) es candidato a
   **servicio de pago adicional** del Advisory Premium. Relevante para
   clientes que importan de países con tarificación de carbono efectiva
   (China ETS, sistema sudcoreano K-ETS, etc.).

**Esfuerzo estimado:** 3-5 días (sin contar el servicio de verificación
externo). Recomendado activar tras la publicación de los actos de
ejecución del Art. 9 (esperados 2026-2027).

---

## Saneamiento Advisory — prioridad ALTA (destapado por bug Noatum 2026-05-21)

**Origen:** investigación del bug "botón de descarga ausente en vista cliente"
(PR #20). El fix tapó el agujero más agudo (regeneración + PATCH del admin
podían retroceder `status='delivered'` a estados anteriores), pero el episodio
destapó deuda estructural en el módulo Advisory que debería atacarse en una
sesión dedicada antes de añadir features nuevas encima.

Cinco bloques de trabajo, en orden de impacto:

### 1. Centralizar transiciones de estado (la deuda más cara)

Hoy cada endpoint setea `status` a mano (`submit/`, `release/`,
`generate-report/`, PATCH `/admin/.../[id]`, `updatePayment` del cliente
admin…). Cada uno con su propia lógica y sus propios olvidos. El bug Noatum
existió porque `generate-report` ponía `status='report_ready'` sin mirar
el estado actual; el "revert" durante el backfill ocurrió porque la PATCH
escribía `body.status` sin validar transición legal.

`lib/cbamAdvisoryStatus.js` (creado en este PR) es el embrión. Trabajo:

- Definir tabla de transiciones legales `STATUS_TRANSITIONS: Map<from, Set<to>>`.
- Exportar `transitionStatus(requestId, from, to, { reason, byUser })` que
  valida la transición, ejecuta el UPDATE en BD con guard `.eq('status', from)`
  (compare-and-set transaccional, evita race conditions entre admins) y registra
  un log de auditoría en una nueva tabla `cbam_advisory_status_log`.
- Refactor de los ~5 sitios que escriben `status` para que pasen por la
  función única. Eliminar `body.status` arbitrario en la PATCH del admin —
  los cambios de estado deben ir por endpoints específicos
  (`/release`, `/return-to-review`, etc.), no por un PATCH genérico.

### 2. Deduplicar mappers (`cbamAdvisoryAdminService.js`)

`mapRequest`, `mapProduct`, `mapDocument` y `toSnake` están duplicados
entre `cbamAdvisoryService.js` (cliente) y `cbamAdvisoryAdminService.js`
(admin). Cualquier campo nuevo de BD tiene que añadirse en dos sitios; ya
hemos perdido descargas/datos en el pasado por mappers que no exponían
columnas persistidas (mismo patrón mencionado en CLAUDE.md).

Trabajo: extraer a `lib/cbamAdvisoryMappers.js` y reescribir
ambos servicios para importar de ahí. Reducir `toSnake` a una conversión
genérica (camel→snake) y eliminar el `map` manual.

### 3. Refactor de `toSnake` — el `map[key] || key` que falla en silencio

`toSnake` (`cbamAdvisoryService.js:129`) usa un diccionario manual y, si
una key no está mapeada, devuelve la key tal cual. Esto significa que si
alguien añade un campo camelCase nuevo sin actualizar el `map`, el UPDATE
escribe `someNewField` en BD y Postgres rechaza la columna (o peor, la
ignora si el cliente fuese laxo). Falla en silencio o de forma confusa.

Trabajo: reemplazar por una función pura camel→snake automática, o por un
mapper generado a partir del schema. Asegurar que campos no permitidos
(p. ej. `id`, `userId`, `createdAt`) se filtran explícitamente.

### 4. Patrón optimistic-write sin re-fetch en handlers admin

El bug del "revert" del backfill — la fila volvió a `paid` segundos después
del UPDATE — se explica porque `handleSave` y `updatePayment` en
`app/admin/cbam/asesoria/[id]/page.js` leen `advisory.status` del estado
React (`useState` inicializado en mount) y lo envían al PATCH. Si BD
cambia mientras el admin tiene la página abierta, el guardar reescribe con
un valor obsoleto.

La guarda servidor del PR #20 cierra el caso de degradación de `delivered`,
pero el patrón sigue: cualquier campo que el admin no haya tocado se
sobrescribe con el snapshot del momento de la apertura. Trabajo:

- Re-fetch antes del save, o
- Enviar sólo los campos que el usuario ha modificado (form dirty
  tracking), o
- Optimistic concurrency con `If-Match` sobre `updated_at`.

### 5. Tests de integración del round-trip BD ↔ schema

No hay tests que cojan una solicitud, la pasen por los endpoints del flujo
completo (submit → review → calculate → generate → release → download) y
verifiquen que los campos persistidos coinciden con los expuestos al
cliente. Cualquier divergencia mapper/schema/endpoint pasa desapercibida
hasta que un cliente lo nota.

Trabajo: suite Playwright o Vitest+supabase-test contra una BD efímera
(branch de Supabase) que valide cada transición de estado y cada campo
expuesto. Mínimo: tests que reproduzcan los bugs históricos (mapper que
ocultaba campos, regeneración que regresaba status, PATCH que aceptaba
status arbitrario).

---

## Notas de futuras iteraciones (no priorizadas)

- **Precio trimestral por fecha de llegada de línea** (diapo 9/15 webinar):
  requiere añadir `arrivalDate` por línea + estructura `cbam_quarterly_prices`
  (BD ya preparada para evolucionar; strings i18n ya existen — ver
  `lib/i18n/cbam.js:324-329, 1138-1143`). Implementar cuando la Comisión
  publique Q2/Q3 oficiales.

- **Mapeo de leyendas de ruta de producción** (diapo 6 webinar): mostrar
  "Ruta aplicada: (C) Carbon Steel BF/BOF" en PDF en vez de solo "C".
  Nice-to-have.

- **Diagrama Fabricante / Verificador / Importador** (diapo 3 webinar):
  encaja en `/cbam/guia`, no en Advisory. Bajo nivel de prioridad.

- **Eliminar calculadoras obsoletas paralelas** (`calculateCBAMCostDB` en
  `lib/cbamService.js:605` y `calculateCBAMCost` en `lib/cbamData.js:975`):
  el Bloque 0 confirmó que son dead code (0 consumers en runtime). También
  `getBenchmarkDB` en `lib/cbamService.js:260` queda huérfana al
  eliminarlas. Planificar deprecación.

- **Migrar a leer FCI desde BD cuando la CE publique el valor definitivo**:
  hoy provisional=1,0 en `lib/cbamRegulatoryParams.js:79-81`. Tabla y nota
  en `cbamReportSnapshot.js:191` deben actualizarse a la vez.

- **Limpieza del alias `certificatesAfterAdjustment`**: introducido en
  Bloque 1 como retrocompat para el PDF v3 actual. Tras Bloque 3 el PDF
  ya lee `certificatesPhysical` directo (con fallback al alias). Eliminar
  del snapshot tras un periodo de gracia de ~6 meses cuando todos los
  informes legacy hayan sido descargados o re-emitidos.

- **Alinear `cbamCalculatorPayload.js` (round4 vs round2)** (hallazgo
  colateral Bloque 1): el payload público redondea `certificates` a
  `round4`, mientras que el snapshot interno usa `round2`. Tras Bloque 3
  el campo `certificatesToSurrender` (entero) ya viaja en el output del
  motor — accesible para una iteración UI de la calculadora pública sin
  cambios en `lib/`. Decisión de UX: ¿la calculadora pública (`/cbam/
  calculadora`) muestra solo tCO₂e decimal como hoy, o también unidades
  enteras como la asesoría?

- **Centralizar lectura de `cbam_ets_prices`** (hallazgo colateral Bloque 0):
  hoy `app/admin/cbam/page.js` hace queries directas al cliente Supabase
  en vez de pasar por `lib/cbamService.js`. Rompe la abstracción que
  introdujo el Bloque 2 (lectura híbrida). Refactor low-risk si se
  acomete junto con B1.

- **Endpoint `GET /api/cbam/ets-price` sin consumers** (hallazgo colateral
  Bloque 0): cableado pero sin uso. Listo para reutilizar en B1 cuando
  expongamos el precio actual al frontend público (`/cbam/asesoria` o
  `/cbam/calculadora`).

- **Datos CBAM faltantes para electricidad** (hallazgo colateral Bloque 2):
  el Caso 5 del test E2E (`scripts/testCBAME2E.js`) falla porque no hay
  default values ni benchmarks en BD para CN `27160000` (electricidad).
  El motor devuelve 0 € en silencio cuando faltan datos para un CN del
  Anexo I. Dos acciones independientes:
  1. Cargar los datos oficiales de electricidad en
     `cbam_default_values_official` y `cbam_benchmarks_official` desde
     los Excel de la CE.
  2. Decidir si el motor debería lanzar error explícito (o marcar la
     línea como "data_missing") en vez de devolver 0 € silencioso cuando
     un CN reconocido del Anexo I no tiene datos cargados.

- **Caso Noatum como test ejecutable**: los inputs estructurados no están
  en el repo (la ficha de diagnóstico solo encontró los outputs en
  `README.md:689`). Dos tests `.skip` con TODO ya están preparados en
  `__tests__/cbamAdvisoryCalculator.test.js`. Reactivar cuando los
  inputs (CN, país, tonnes, FE real, BM, ruta) estén disponibles y
  documentar el delta vs el valor histórico (cambia por dos motivos:
  precio 74,76 → 75,36 y redondeo `Math.ceil` por línea).

- **Refactor de `toSnake` para que no falle en silencio** (hallazgo del
  fix post-Bloque 3, mayo 2026): `lib/cbamAdvisoryService.js:192-198`
  implementa la conversión camelCase → snake_case con un patrón
  `const snakeKey = map[key] || key`. Si una clave no está registrada
  en `map`, pasa el camelCase literal a Supabase y solo se descubre el
  problema en runtime con un 500. Fue el modo en que escaparon los dos
  totales nuevos (`totalCertificatesPhysical`, `totalCertificatesToSurrender`)
  del Bloque 3 hasta la validación manual. Dos caminos posibles:
  1. Conversión automática por regla (regex `[A-Z]` → `_[a-z]`) que cubre
     el 100% de los casos sin tabla de mapping. Cierra esta clase de
     bug por completo.
  2. Mantener el mapping pero lanzar error explícito ante claves
     desconocidas (`throw new Error('toSnake: clave no mapeada: ' + key)`),
     en vez del fallback `|| key`. Esto convierte el fallo runtime en
     fallo de test en CI.
  Recomendación: la opción 1 si no hay claves que requieran nombre snake
  no-canónico (no parece haberlas).

- **Test de integración de la capa de persistencia** (hallazgo del mismo
  fix): los 9 tests de `__tests__/cbamAdvisoryCalculator.test.js`
  cubren exclusivamente `lib/cbamLineMath.js` (función matemática pura
  por línea). Quedaron fuera de cobertura el wrapper
  `calculateAdvisoryRequest`, el spread de `totals`, `toSnake` y el
  contrato con las columnas reales de BD. Por eso los tests estaban
  verdes mientras el endpoint `/calculate` devolvía 500.
  Plan futuro: añadir un test que valide que el set de claves que el
  wrapper pasa a `updateAdvisoryRequest` y `updateAdvisoryProduct` está
  contenido en las columnas reales de `information_schema.columns`.
  No requiere mocks elaborados — solo:
  1. Una query a Supabase (o un fixture cacheado en CI) que lista las
     columnas de `cbam_advisory_requests` y `cbam_advisory_products`.
  2. Un `Object.keys(payload)` sobre el resultado del calculator + lo
     que el wrapper compone, todo tras pasar por `toSnake`.
  3. Assert que cada clave del payload pertenece al set de columnas.
  Esto habría cazado este bug en CI antes del merge.

- **🔴 PRIORIDAD ALTA — Deduplicar mappers `cbamAdvisoryAdminService.js`**
  (hallazgo del fix del bug de lectura admin, mayo 2026):
  `lib/cbamAdvisoryAdminService.js` mantiene su propio `mapRequest`,
  `mapProduct` y `toSnake` por una razón histórica (evitar dependencia
  circular con `cbamAdvisoryService.js` que usa el cliente anon, ver
  comentario líneas 18-19). El resultado operativo: **cada campo nuevo
  hay que registrarlo dos veces**, y los Bloques 1/2/3 lo hicieron solo
  en la copia no-admin. Esta sesión ha encadenado **cuatro bugs de
  persistencia** seguidos, todos con la misma raíz estructural:

  1. Columnas BD faltantes para totales (`total_certificates_*`, fix `569db04`).
  2. `toSnake` no-admin sin mapping para esos mismos totales (mismo commit).
  3. `mapProduct` admin sin lectura de los 3 campos de línea Bloque 1/3
     (este fix).
  4. `mapRequest` admin sin lectura de los 4 campos de cabecera Bloque
     2/3 (este fix).

  Más el `toSnake` admin con los mismos 7 huecos que abre la quinta
  versión potencial del mismo bug en cuanto alguien haga PATCH admin
  de uno de esos campos.

  La causa de fondo es **doble**:
  a) Código duplicado paralelo que hay que mantener a mano.
  b) Patrón `map[key] || key` que traga errores en silencio.

  Solución propuesta — combina dos cambios que se refuerzan mutuamente:

  - Un único `cbamAdvisoryService.js` parametrizado por cliente Supabase
    (anon o admin/service_role). El cliente lo elige cada caller
    (`resolveClient` ya hace algo parecido); eliminar
    `cbamAdvisoryAdminService.js` y consolidar todo en el mismo módulo.
    Los mappers viven en un solo sitio.
  - Sustituir el mapping manual por conversión automática
    camelCase ↔ snake_case por regla (regex). Cierra esta familia de
    bugs por completo: cualquier campo nuevo funciona sin tocar `map`.

  No es "nice to have": es la causa estructural de la cadena de bugs
  de esta sesión. Mientras siga viva, cada feature que añada un campo
  persistido es un campo de minas hasta que alguien recuerde tocar las
  dos copias. Plan de attaque: medio día de trabajo, principalmente
  releyendo callers admin para asegurarse de que pasan `supabaseAdmin`
  explícitamente. Tras hacerlo, los tres ítems anteriores (refactor
  `toSnake`, test de integración, auditoría 4 capas) pierden la mitad
  de su carga.

- **Auditoría de 4 capas ante feature con campos persistidos** (hallazgo
  meta de la cadena de bugs, mayo 2026): institucionalizar como
  checklist obligatorio cuando una feature añade campos a una tabla de
  Advisory. Auditar las cuatro capas del round-trip, no solo la que
  petó primero:

  1. **Columnas en BD**: ¿existe la columna? ¿con el tipo correcto?
     ¿nullable para retrocompat?
  2. **Escritura no-admin** (`cbamAdvisoryService.js → toSnake`):
     ¿el `map` tiene la entrada camelCase → snake_case?
  3. **Escritura admin** (`cbamAdvisoryAdminService.js → toSnake`):
     misma pregunta en la copia paralela.
  4. **Lectura no-admin y admin** (`mapRequest` y `mapProduct` en ambas
     copias): ¿se expone el campo al cliente?

  Y un quinto opcional cuando aplique:

  5. **Consumidores downstream**: snapshot del PDF, payload público,
     diagnóstico cualitativo. ¿Dependen del nuevo campo o de algún
     derivado? Si sí, ¿se construyen desde un origen que ya lo expone?

  La auditoría debería ser parte del *Definition of Done* de cualquier
  feature que toque Advisory hasta que la deduplicación de mappers (ver
  ítem anterior) la haga innecesaria.

- **Pulido cosmético del PDF Advisory** (validación visual del PR #17,
  mayo 2026): no bloquea el merge pero conviene resolverlo en una pasada
  de UI dedicada. Cuatro ítems detectados:

  1. **Encoding de símbolos**: `tCO₂e` se renderiza como `tCO‚e` y
     algunas fórmulas muestran `£` / `·` mal. Es problema de la fuente
     embebida (la Helvetica por defecto de `@react-pdf/renderer` no
     cubre todos los caracteres Unicode usados). Solución típica:
     registrar una fuente con soporte ampliado (p. ej. DejaVu Sans o
     Inter) vía `Font.register()` y usarla en `styles`.
  2. **Bloque "TOTAL" / "Coste total estimado" descuadrado** en sección
     5/6. Ajuste de widths o alineación.
  3. **"Aviso legal" partido entre páginas 7-8**. Aplicar
     `break={false}` o `wrap={false}` al bloque para forzar que se
     mantenga unido.
  4. **Etiqueta del precio**: hoy muestra `(2026-04-08)` (fecha exacta
     de la fila vigente en BD). Valorar volver a `(2026-Q1)` o mostrar
     un formato más legible para cliente (p. ej. "Q1 2026 · precio
     publicado el 8 abr 2026"). Decisión de UX.

  Todos contenidos en `lib/cbamReportGenerator.jsx`. Ninguno afecta a
  los números — solo a la presentación.
