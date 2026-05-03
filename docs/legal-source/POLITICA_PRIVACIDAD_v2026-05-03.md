# Política de Privacidad

**Última actualización:** 3 de mayo de 2026
**Versión:** 2026-05-03

---

## 1. Responsable del tratamiento

| | |
|---|---|
| **Titular** | Carlos Carrillo del Olmo |
| **NIF** | 50906645D |
| **Domicilio profesional** | Avenida de América 19, 28002 Madrid, España |
| **Email de contacto para privacidad** | privacidad@lexaduana.es |
| **Sitio web** | https://lexaduana.es |

No se ha designado Delegado de Protección de Datos (DPO) por no concurrir los supuestos del artículo 37 del Reglamento (UE) 2016/679 (RGPD). Para cualquier cuestión relativa a la privacidad puede dirigirse al email indicado.

## 2. Alcance y aplicación

Esta Política de Privacidad regula el tratamiento de datos personales que realiza LexAduana (en adelante, "la Plataforma") a través del sitio web https://lexaduana.es y cualesquiera servicios asociados.

Se aplica a:

- Personas que visitan el sitio web.
- Personas registradas como usuarias de la Plataforma.
- Personas cuyos datos personales figuren incidentalmente en los documentos que los usuarios registrados suban a la Plataforma (por ejemplo, representantes aduaneros o contactos identificados en un DUA, XML de importación o factura comercial).

## 3. Datos que tratamos y finalidades

### 3.1 Datos de usuarios registrados

| Categoría de datos | Finalidad | Base legal |
|---|---|---|
| Email, contraseña (cifrada), nombre | Creación y gestión de cuenta | Ejecución del servicio (art. 6.1.b RGPD) |
| Empresa, sector (si se aportan) | Personalización del servicio | Ejecución del servicio |
| Historial de clasificaciones arancelarias | Consultar clasificaciones anteriores realizadas por el propio usuario | Ejecución del servicio |
| Favoritos y alertas TARIC configuradas | Notificar al usuario cambios en códigos de su interés | Ejecución del servicio |
| Despachos aduaneros registrados en el gestor | Gestión personal del usuario sobre sus despachos | Ejecución del servicio |
| Registro de consentimientos (timestamp, IP, versión aceptada) | Cumplimiento obligación legal y defensa ante reclamaciones | Obligación legal (art. 6.1.c RGPD) |

### 3.2 Datos derivados del uso de herramientas

| Herramienta | Datos tratados | Finalidad | Base legal |
|---|---|---|---|
| Calculadora TARIC | Código arancelario, origen, valor consultado | Cálculo de aranceles | Ejecución del servicio |
| Clasificador IA | Descripción o imagen del producto | Propuesta de clasificación arancelaria orientativa | Ejecución del servicio + consentimiento específico para tratamiento mediante IA |
| OCR de facturas comerciales | PDF de factura (procesado en memoria), datos extraídos en JSON | Extracción automática de datos de la factura | Ejecución del servicio + consentimiento específico para tratamiento mediante IA |
| Gestor de despachos | Información del despacho que el usuario decida registrar | Gestión personal | Ejecución del servicio |
| Módulo CBAM | Toneladas, emisiones declaradas, país origen | Cálculo del coste CBAM | Ejecución del servicio |
| Servicio CBAM advisory | Datos completos del cliente y operación CBAM | Elaboración de informe profesional | Ejecución del servicio |

> **Nota destacada sobre CBAM advisory**: a diferencia del módulo CBAM básico (calculadora) y del resto de herramientas IA, el servicio CBAM advisory **no utiliza Anthropic ni ningún proveedor de inteligencia artificial fuera de la Unión Europea**. Todos los datos se procesan íntegramente en infraestructura ubicada en la UE.

### 3.3 Datos de navegación

| Categoría | Finalidad | Base legal |
|---|---|---|
| Dirección IP, agente de usuario, páginas visitadas | Seguridad, prevención de fraude, rate limiting | Interés legítimo (art. 6.1.f RGPD) |
| Cookies técnicas (sesión, autenticación, preferencia de tema) | Funcionamiento del servicio | Exentas de consentimiento (art. 22.2 LSSI-CE) |
| Métricas de tráfico agregado (Plausible Analytics) | Medición de audiencia agregada sin identificación individual | Interés legítimo. Plausible no usa cookies ni recoge datos personales identificables, por lo que no requiere consentimiento previo. |

## 4. Procesamiento de archivos subidos

Los archivos que el usuario sube a la Plataforma (imágenes para clasificación, PDFs de facturas, XMLs de DUAs) **se procesan en memoria** durante la ejecución de la función correspondiente y **no se almacenan en disco ni en sistemas de archivos** de la Plataforma.

De cada archivo procesado, la Plataforma únicamente persiste los **datos estructurados extraídos** (por ejemplo, el JSON con los campos de la factura o el resultado de la clasificación), nunca el archivo original.

## 5. Plazos de conservación

| Dato | Plazo |
|---|---|
| Cuenta de usuario activa | Mientras el usuario mantenga su cuenta |
| Cuenta tras baja | 30 días de gracia, después borrado |
| Historial de clasificaciones IA | 12 meses desde la clasificación |
| Extracciones OCR de facturas | 90 días desde la extracción |
| Despachos aduaneros | 4 años tras cierre (art. 51 CAU) |
| Registros CBAM (calculadora) | 4 años |
| Registros CBAM advisory | 4 años (obligación legal específica del Reglamento (UE) 2023/956) |
| Registros de consentimiento | Vida de la cuenta + 3 años tras baja, conservados de forma pseudonimizada (sin PII directa) como evidencia legal del consentimiento prestado |
| Logs técnicos | Entre 1 y 3 días según plan de hosting |
| Datos de facturación propia | 6 años (art. 30 Código de Comercio) |

Tras los plazos indicados, los datos son eliminados o anonimizados de forma irreversible, salvo obligación legal que imponga plazo superior.

## 6. Destinatarios de los datos

Los datos personales no se comunican a terceros salvo a los encargados de tratamiento necesarios para la prestación del servicio:

| Proveedor | Servicio | Ubicación | Garantías |
|---|---|---|---|
| Supabase Inc. | Base de datos y autenticación | Servidores en París (UE) | DPA firmado, infraestructura UE |
| Vercel Inc. | Alojamiento de aplicación | Servidores en Fráncfort (UE) | DPA firmado, infraestructura UE |
| Anthropic PBC | API de inteligencia artificial (clasificador, OCR) | EEUU | Cláusulas Contractuales Tipo aprobadas por la UE. Retención máxima de 7 días para detección de abuso. No se usan datos para entrenamiento. |
| Resend Inc. | Email transaccional | EEUU / UE | Cláusulas Contractuales Tipo |
| Plausible Insights OÜ | Analítica web sin cookies | Servidores en Fráncfort (Alemania, UE) | Empresa europea (Estonia). Sin recogida de datos personales identificables ni cookies de tracking. |
| ImprovMX | Reenvío de email para alias del dominio | UE | Sin almacenamiento, solo reenvío |

Todos los encargados de tratamiento cuentan con Acuerdo de Tratamiento de Datos (DPA) firmado y ofrecen garantías suficientes conforme al art. 28 RGPD.

## 7. Transferencias internacionales

Algunos proveedores técnicos tienen su sede en Estados Unidos. En todos los casos, las transferencias se realizan al amparo de las **Cláusulas Contractuales Tipo (SCC)** aprobadas por la Comisión Europea (Decisión 2021/914) como mecanismo válido de transferencia internacional conforme al artículo 46 RGPD.

**Transferencia a Anthropic (EEUU) para procesamiento mediante IA:** cuando un usuario utiliza las herramientas basadas en IA (clasificador de productos o OCR de facturas), el contenido enviado a procesar viaja a servidores de Anthropic PBC. Este envío está sujeto a:

- Cláusulas Contractuales Tipo UE.
- Retención máxima de 7 días en servidores de Anthropic para detección de abuso, transcurridos los cuales los datos se eliminan automáticamente.
- Los datos **no se utilizan para entrenar modelos** de Anthropic, por tratarse de uso comercial de la API.
- **Consentimiento específico del usuario** mediante casilla de verificación antes de cada utilización de estas herramientas.

El usuario puede optar por no utilizar las herramientas basadas en IA sin que ello afecte al resto de funcionalidades de la Plataforma. **El servicio CBAM advisory, en particular, no realiza ninguna transferencia internacional**: todo el procesamiento ocurre en infraestructura europea.

## 8. Derechos del usuario

Conforme a los artículos 15 a 22 RGPD, el usuario tiene derecho a:

- **Acceso**: obtener confirmación y copia de los datos que tratamos sobre él.
- **Rectificación**: corregir datos inexactos.
- **Supresión** ("derecho al olvido"): solicitar el borrado de sus datos cuando ya no sean necesarios.
- **Limitación**: solicitar que se suspenda el tratamiento mientras se resuelve una reclamación.
- **Portabilidad**: recibir sus datos en formato estructurado y legible por máquina (JSON).
- **Oposición**: oponerse al tratamiento por motivos relativos a su situación particular.
- **No ser objeto de decisiones automatizadas** con efectos significativos. Las clasificaciones propuestas por el clasificador IA tienen carácter meramente orientativo y no constituyen decisiones automatizadas vinculantes.
- **Retirar el consentimiento** en cualquier momento, sin que ello afecte a la licitud del tratamiento previo.

### Cómo ejercer los derechos

**Por email**: escribiendo a privacidad@lexaduana.es con copia de documento identificativo. El responsable contestará en el plazo máximo de un mes desde la recepción de la solicitud.

> Está previsto habilitar próximamente un panel de autoservicio en el área "Mi cuenta" que permitirá descargar los datos personales en formato JSON, gestionar consentimientos y solicitar la baja de la cuenta directamente. Hasta entonces, el ejercicio de derechos se gestiona vía email.

### Reclamación ante la autoridad de control

Si el usuario considera que el tratamiento de sus datos no se ajusta a la normativa, tiene derecho a presentar reclamación ante la **Agencia Española de Protección de Datos (AEPD)**: https://www.aepd.es — C/ Jorge Juan, 6, 28001 Madrid.

## 9. Seguridad

La Plataforma aplica medidas técnicas y organizativas apropiadas para garantizar un nivel de seguridad adecuado al riesgo, conforme al artículo 32 RGPD:

- Cifrado en tránsito (HTTPS obligatorio en todo el sitio).
- Cifrado en reposo de la base de datos.
- Aislamiento de datos por usuario mediante Row Level Security (RLS) verificada en todas las tablas con datos personales.
- Contraseñas almacenadas con hashing criptográfico.
- Procesamiento en memoria de archivos sensibles (no persistencia en disco).
- Registro de consentimientos con timestamp, IP y versión, conservados de forma pseudonimizada tras la baja del usuario.
- Principio de mínimos privilegios en accesos a infraestructura.
- Headers de seguridad HTTP (CSP, HSTS, X-Frame-Options, Referrer-Policy).

En caso de brecha de seguridad que afecte a datos personales, se notificará a la AEPD en el plazo de 72 horas y a los usuarios afectados cuando proceda, conforme a los artículos 33 y 34 RGPD.

## 10. Menores

La Plataforma está dirigida exclusivamente a profesionales del comercio exterior mayores de edad. No se admite el registro de menores de 18 años ni se solicita deliberadamente información personal de menores.

## 11. Modificaciones

Esta Política puede actualizarse para reflejar cambios normativos o en el servicio. La versión vigente será siempre la publicada en https://lexaduana.es/privacidad con su fecha de última actualización. Los cambios sustanciales se comunicarán por email a los usuarios registrados y podrá requerirse reaceptación.

---

**Versión:** 2026-05-03
**Contacto:** privacidad@lexaduana.es
