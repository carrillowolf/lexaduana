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
