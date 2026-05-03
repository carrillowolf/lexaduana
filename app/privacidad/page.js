import LegalPageLayout from '@/components/legal/LegalPageLayout'
import { LEGAL_VERSIONS } from '@/lib/legal-versions'

export const metadata = {
  title: 'Política de Privacidad | LexAduana',
  description: 'Cómo trata LexAduana tus datos personales: finalidades, plazos, derechos RGPD y transferencias internacionales.',
  alternates: { canonical: '/privacidad' },
}

export const dynamic = 'force-static'

export default function PoliticaPrivacidadPage() {
  return (
    <LegalPageLayout
      title="Política de Privacidad"
      version={LEGAL_VERSIONS.privacy_policy}
      contactEmail="privacidad@lexaduana.es"
    >
      <h2>1. Responsable del tratamiento</h2>
      <table>
        <tbody>
          <tr><td><strong>Titular</strong></td><td>Carlos Carrillo del Olmo</td></tr>
          <tr><td><strong>NIF</strong></td><td>50906645D</td></tr>
          <tr><td><strong>Domicilio profesional</strong></td><td>Avenida de América 19, 28002 Madrid, España</td></tr>
          <tr><td><strong>Email de contacto para privacidad</strong></td><td><a href="mailto:privacidad@lexaduana.es">privacidad@lexaduana.es</a></td></tr>
          <tr><td><strong>Sitio web</strong></td><td><a href="https://lexaduana.es">https://lexaduana.es</a></td></tr>
        </tbody>
      </table>
      <p>
        No se ha designado Delegado de Protección de Datos (DPO) por no concurrir los supuestos del artículo 37 del Reglamento (UE) 2016/679 (RGPD). Para cualquier cuestión relativa a la privacidad puede dirigirse al email indicado.
      </p>

      <h2>2. Alcance y aplicación</h2>
      <p>
        Esta Política de Privacidad regula el tratamiento de datos personales que realiza LexAduana (en adelante, &quot;la Plataforma&quot;) a través del sitio web <a href="https://lexaduana.es">https://lexaduana.es</a> y cualesquiera servicios asociados.
      </p>
      <p>Se aplica a:</p>
      <ul>
        <li>Personas que visitan el sitio web.</li>
        <li>Personas registradas como usuarias de la Plataforma.</li>
        <li>Personas cuyos datos personales figuren incidentalmente en los documentos que los usuarios registrados suban a la Plataforma (por ejemplo, representantes aduaneros o contactos identificados en un DUA, XML de importación o factura comercial).</li>
      </ul>

      <h2>3. Datos que tratamos y finalidades</h2>

      <h3>3.1 Datos de usuarios registrados</h3>
      <table>
        <thead>
          <tr><th>Categoría de datos</th><th>Finalidad</th><th>Base legal</th></tr>
        </thead>
        <tbody>
          <tr><td>Email, contraseña (cifrada), nombre</td><td>Creación y gestión de cuenta</td><td>Ejecución del servicio (art. 6.1.b RGPD)</td></tr>
          <tr><td>Empresa, sector (si se aportan)</td><td>Personalización del servicio</td><td>Ejecución del servicio</td></tr>
          <tr><td>Historial de clasificaciones arancelarias</td><td>Consultar clasificaciones anteriores realizadas por el propio usuario</td><td>Ejecución del servicio</td></tr>
          <tr><td>Favoritos y alertas TARIC configuradas</td><td>Notificar al usuario cambios en códigos de su interés</td><td>Ejecución del servicio</td></tr>
          <tr><td>Despachos aduaneros registrados en el gestor</td><td>Gestión personal del usuario sobre sus despachos</td><td>Ejecución del servicio</td></tr>
          <tr><td>Registro de consentimientos (timestamp, IP, versión aceptada)</td><td>Cumplimiento obligación legal y defensa ante reclamaciones</td><td>Obligación legal (art. 6.1.c RGPD)</td></tr>
        </tbody>
      </table>

      <h3>3.2 Datos derivados del uso de herramientas</h3>
      <table>
        <thead>
          <tr><th>Herramienta</th><th>Datos tratados</th><th>Finalidad</th><th>Base legal</th></tr>
        </thead>
        <tbody>
          <tr><td>Calculadora TARIC</td><td>Código arancelario, origen, valor consultado</td><td>Cálculo de aranceles</td><td>Ejecución del servicio</td></tr>
          <tr><td>Clasificador IA</td><td>Descripción o imagen del producto</td><td>Propuesta de clasificación arancelaria orientativa</td><td>Ejecución del servicio + consentimiento específico para tratamiento mediante IA</td></tr>
          <tr><td>OCR de facturas comerciales</td><td>PDF de factura (procesado en memoria), datos extraídos en JSON</td><td>Extracción automática de datos de la factura</td><td>Ejecución del servicio + consentimiento específico para tratamiento mediante IA</td></tr>
          <tr><td>Gestor de despachos</td><td>Información del despacho que el usuario decida registrar</td><td>Gestión personal</td><td>Ejecución del servicio</td></tr>
          <tr><td>Módulo CBAM</td><td>Toneladas, emisiones declaradas, país origen</td><td>Cálculo del coste CBAM</td><td>Ejecución del servicio</td></tr>
          <tr><td>Servicio CBAM advisory</td><td>Datos completos del cliente y operación CBAM</td><td>Elaboración de informe profesional</td><td>Ejecución del servicio</td></tr>
        </tbody>
      </table>

      <blockquote>
        <strong>Nota destacada sobre CBAM advisory</strong>: a diferencia del módulo CBAM básico (calculadora) y del resto de herramientas IA, el servicio CBAM advisory <strong>no utiliza Anthropic ni ningún proveedor de inteligencia artificial fuera de la Unión Europea</strong>. Todos los datos se procesan íntegramente en infraestructura ubicada en la UE.
      </blockquote>

      <h3>3.3 Datos de navegación</h3>
      <table>
        <thead>
          <tr><th>Categoría</th><th>Finalidad</th><th>Base legal</th></tr>
        </thead>
        <tbody>
          <tr><td>Dirección IP, agente de usuario, páginas visitadas</td><td>Seguridad, prevención de fraude, rate limiting</td><td>Interés legítimo (art. 6.1.f RGPD)</td></tr>
          <tr><td>Cookies técnicas (sesión, autenticación, preferencia de tema)</td><td>Funcionamiento del servicio</td><td>Exentas de consentimiento (art. 22.2 LSSI-CE)</td></tr>
          <tr><td>Métricas de tráfico agregado (Plausible Analytics)</td><td>Medición de audiencia agregada sin identificación individual</td><td>Interés legítimo. Plausible no usa cookies ni recoge datos personales identificables, por lo que no requiere consentimiento previo.</td></tr>
        </tbody>
      </table>

      <h2>4. Procesamiento de archivos subidos</h2>
      <p>
        Los archivos que el usuario sube a la Plataforma (imágenes para clasificación, PDFs de facturas, XMLs de DUAs) <strong>se procesan en memoria</strong> durante la ejecución de la función correspondiente y <strong>no se almacenan en disco ni en sistemas de archivos</strong> de la Plataforma.
      </p>
      <p>
        De cada archivo procesado, la Plataforma únicamente persiste los <strong>datos estructurados extraídos</strong> (por ejemplo, el JSON con los campos de la factura o el resultado de la clasificación), nunca el archivo original.
      </p>

      <h2>5. Plazos de conservación</h2>
      <table>
        <thead>
          <tr><th>Dato</th><th>Plazo</th></tr>
        </thead>
        <tbody>
          <tr><td>Cuenta de usuario activa</td><td>Mientras el usuario mantenga su cuenta</td></tr>
          <tr><td>Cuenta tras baja</td><td>30 días de gracia, después borrado</td></tr>
          <tr><td>Historial de clasificaciones IA</td><td>12 meses desde la clasificación</td></tr>
          <tr><td>Extracciones OCR de facturas</td><td>90 días desde la extracción</td></tr>
          <tr><td>Despachos aduaneros</td><td>4 años tras cierre (art. 51 CAU)</td></tr>
          <tr><td>Registros CBAM (calculadora)</td><td>4 años</td></tr>
          <tr><td>Registros CBAM advisory</td><td>4 años (obligación legal específica del Reglamento (UE) 2023/956)</td></tr>
          <tr><td>Registros de consentimiento</td><td>Vida de la cuenta + 3 años tras baja, conservados de forma pseudonimizada (sin PII directa) como evidencia legal del consentimiento prestado</td></tr>
          <tr><td>Logs técnicos</td><td>Entre 1 y 3 días según plan de hosting</td></tr>
          <tr><td>Datos de facturación propia</td><td>6 años (art. 30 Código de Comercio)</td></tr>
        </tbody>
      </table>
      <p>
        Tras los plazos indicados, los datos son eliminados o anonimizados de forma irreversible, salvo obligación legal que imponga plazo superior.
      </p>

      <h2>6. Destinatarios de los datos</h2>
      <p>
        Los datos personales no se comunican a terceros salvo a los encargados de tratamiento necesarios para la prestación del servicio:
      </p>
      <table>
        <thead>
          <tr><th>Proveedor</th><th>Servicio</th><th>Ubicación</th><th>Garantías</th></tr>
        </thead>
        <tbody>
          <tr><td>Supabase Inc.</td><td>Base de datos y autenticación</td><td>Servidores en París (UE)</td><td>DPA firmado, infraestructura UE</td></tr>
          <tr><td>Vercel Inc.</td><td>Alojamiento de aplicación</td><td>Servidores en Fráncfort (UE)</td><td>DPA firmado, infraestructura UE</td></tr>
          <tr><td>Anthropic PBC</td><td>API de inteligencia artificial (clasificador, OCR)</td><td>EEUU</td><td>Cláusulas Contractuales Tipo aprobadas por la UE. Retención máxima de 7 días para detección de abuso. No se usan datos para entrenamiento.</td></tr>
          <tr><td>Resend Inc.</td><td>Email transaccional</td><td>EEUU / UE</td><td>Cláusulas Contractuales Tipo</td></tr>
          <tr><td>Plausible Insights OÜ</td><td>Analítica web sin cookies</td><td>Servidores en Fráncfort (Alemania, UE)</td><td>Empresa europea (Estonia). Sin recogida de datos personales identificables ni cookies de tracking.</td></tr>
          <tr><td>ImprovMX</td><td>Reenvío de email para alias del dominio</td><td>UE</td><td>Sin almacenamiento, solo reenvío</td></tr>
        </tbody>
      </table>
      <p>
        Todos los encargados de tratamiento cuentan con Acuerdo de Tratamiento de Datos (DPA) firmado y ofrecen garantías suficientes conforme al art. 28 RGPD.
      </p>

      <h2>7. Transferencias internacionales</h2>
      <p>
        Algunos proveedores técnicos tienen su sede en Estados Unidos. En todos los casos, las transferencias se realizan al amparo de las <strong>Cláusulas Contractuales Tipo (SCC)</strong> aprobadas por la Comisión Europea (Decisión 2021/914) como mecanismo válido de transferencia internacional conforme al artículo 46 RGPD.
      </p>
      <p>
        <strong>Transferencia a Anthropic (EEUU) para procesamiento mediante IA:</strong> cuando un usuario utiliza las herramientas basadas en IA (clasificador de productos o OCR de facturas), el contenido enviado a procesar viaja a servidores de Anthropic PBC. Este envío está sujeto a:
      </p>
      <ul>
        <li>Cláusulas Contractuales Tipo UE.</li>
        <li>Retención máxima de 7 días en servidores de Anthropic para detección de abuso, transcurridos los cuales los datos se eliminan automáticamente.</li>
        <li>Los datos <strong>no se utilizan para entrenar modelos</strong> de Anthropic, por tratarse de uso comercial de la API.</li>
        <li><strong>Consentimiento específico del usuario</strong> mediante casilla de verificación antes de cada utilización de estas herramientas.</li>
      </ul>
      <p>
        El usuario puede optar por no utilizar las herramientas basadas en IA sin que ello afecte al resto de funcionalidades de la Plataforma. <strong>El servicio CBAM advisory, en particular, no realiza ninguna transferencia internacional</strong>: todo el procesamiento ocurre en infraestructura europea.
      </p>

      <h2>8. Derechos del usuario</h2>
      <p>Conforme a los artículos 15 a 22 RGPD, el usuario tiene derecho a:</p>
      <ul>
        <li><strong>Acceso</strong>: obtener confirmación y copia de los datos que tratamos sobre él.</li>
        <li><strong>Rectificación</strong>: corregir datos inexactos.</li>
        <li><strong>Supresión</strong> (&quot;derecho al olvido&quot;): solicitar el borrado de sus datos cuando ya no sean necesarios.</li>
        <li><strong>Limitación</strong>: solicitar que se suspenda el tratamiento mientras se resuelve una reclamación.</li>
        <li><strong>Portabilidad</strong>: recibir sus datos en formato estructurado y legible por máquina (JSON).</li>
        <li><strong>Oposición</strong>: oponerse al tratamiento por motivos relativos a su situación particular.</li>
        <li><strong>No ser objeto de decisiones automatizadas</strong> con efectos significativos. Las clasificaciones propuestas por el clasificador IA tienen carácter meramente orientativo y no constituyen decisiones automatizadas vinculantes.</li>
        <li><strong>Retirar el consentimiento</strong> en cualquier momento, sin que ello afecte a la licitud del tratamiento previo.</li>
      </ul>

      <h3>Cómo ejercer los derechos</h3>
      <p>
        <strong>Por email</strong>: escribiendo a <a href="mailto:privacidad@lexaduana.es">privacidad@lexaduana.es</a> con copia de documento identificativo. El responsable contestará en el plazo máximo de un mes desde la recepción de la solicitud.
      </p>
      <blockquote>
        Está previsto habilitar próximamente un panel de autoservicio en el área &quot;Mi cuenta&quot; que permitirá descargar los datos personales en formato JSON, gestionar consentimientos y solicitar la baja de la cuenta directamente. Hasta entonces, el ejercicio de derechos se gestiona vía email.
      </blockquote>

      <h3>Reclamación ante la autoridad de control</h3>
      <p>
        Si el usuario considera que el tratamiento de sus datos no se ajusta a la normativa, tiene derecho a presentar reclamación ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong>: <a href="https://www.aepd.es" rel="noopener noreferrer">https://www.aepd.es</a> — C/ Jorge Juan, 6, 28001 Madrid.
      </p>

      <h2>9. Seguridad</h2>
      <p>
        La Plataforma aplica medidas técnicas y organizativas apropiadas para garantizar un nivel de seguridad adecuado al riesgo, conforme al artículo 32 RGPD:
      </p>
      <ul>
        <li>Cifrado en tránsito (HTTPS obligatorio en todo el sitio).</li>
        <li>Cifrado en reposo de la base de datos.</li>
        <li>Aislamiento de datos por usuario mediante Row Level Security (RLS) verificada en todas las tablas con datos personales.</li>
        <li>Contraseñas almacenadas con hashing criptográfico.</li>
        <li>Procesamiento en memoria de archivos sensibles (no persistencia en disco).</li>
        <li>Registro de consentimientos con timestamp, IP y versión, conservados de forma pseudonimizada tras la baja del usuario.</li>
        <li>Principio de mínimos privilegios en accesos a infraestructura.</li>
        <li>Headers de seguridad HTTP (CSP, HSTS, X-Frame-Options, Referrer-Policy).</li>
      </ul>
      <p>
        En caso de brecha de seguridad que afecte a datos personales, se notificará a la AEPD en el plazo de 72 horas y a los usuarios afectados cuando proceda, conforme a los artículos 33 y 34 RGPD.
      </p>

      <h2>10. Menores</h2>
      <p>
        La Plataforma está dirigida exclusivamente a profesionales del comercio exterior mayores de edad. No se admite el registro de menores de 18 años ni se solicita deliberadamente información personal de menores.
      </p>

      <h2>11. Modificaciones</h2>
      <p>
        Esta Política puede actualizarse para reflejar cambios normativos o en el servicio. La versión vigente será siempre la publicada en <a href="https://lexaduana.es/privacidad">https://lexaduana.es/privacidad</a> con su fecha de última actualización. Los cambios sustanciales se comunicarán por email a los usuarios registrados y podrá requerirse reaceptación.
      </p>
    </LegalPageLayout>
  )
}
