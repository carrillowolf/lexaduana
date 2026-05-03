import LegalPageLayout from '@/components/legal/LegalPageLayout'
import { LEGAL_VERSIONS } from '@/lib/legal-versions'

export const metadata = {
  title: 'Términos y Condiciones de Uso | LexAduana',
  description: 'Condiciones generales de uso de la plataforma LexAduana: cuenta de usuario, herramientas IA, propiedad de datos y baja.',
  alternates: { canonical: '/terminos' },
}

export const dynamic = 'force-static'

export default function TerminosUsoPage() {
  return (
    <LegalPageLayout
      title="Términos y Condiciones de Uso"
      version={LEGAL_VERSIONS.terms_of_use}
      contactEmail="soporte@lexaduana.es"
    >
      <h2>1. Aceptación</h2>
      <p>
        El uso de la Plataforma implica la aceptación plena de estos Términos. El registro como usuario requiere aceptación expresa mediante casilla de verificación.
      </p>

      <h2>2. Descripción del servicio</h2>
      <p>
        LexAduana ofrece herramientas digitales de apoyo al comercio exterior: cálculos arancelarios, clasificaciones orientativas asistidas por IA, gestión de despachos, módulo CBAM, comparador multi-origen, alertas TARIC, OCR de facturas comerciales, entre otras. El servicio está dirigido a profesionales (importadores, agentes de aduanas, despachantes, consultores) mayores de edad.
      </p>

      <h2>3. Cuenta de usuario</h2>
      <ul>
        <li>El usuario se compromete a facilitar datos veraces y mantenerlos actualizados.</li>
        <li>El usuario es responsable de la custodia de sus credenciales de acceso.</li>
        <li>Una cuenta es personal e intransferible.</li>
        <li>El titular se reserva el derecho a suspender o cancelar cuentas que infrinjan estos Términos o la normativa vigente.</li>
      </ul>

      <h2>4. Uso aceptable</h2>
      <p>El usuario se compromete a:</p>
      <ul>
        <li>No utilizar la Plataforma con fines ilícitos o contrarios a la buena fe.</li>
        <li>No realizar ingeniería inversa, scraping masivo, abuso del rate limiting o intentos de comprometer la seguridad.</li>
        <li>No subir archivos que contengan malware, contenido ilegal o datos personales de terceros sin base legítima.</li>
        <li>No utilizar las herramientas de IA para fines distintos de los previstos (clasificación arancelaria, extracción de datos de facturas comerciales).</li>
      </ul>

      <h2>5. Herramientas basadas en IA</h2>
      <p>
        El clasificador de productos y el extractor OCR de facturas utilizan modelos de inteligencia artificial de Anthropic PBC (EEUU). El usuario entiende y acepta que:
      </p>
      <ul>
        <li>Los resultados son <strong>orientativos y no vinculantes</strong>. No constituyen Información Arancelaria Vinculante (IAV) ni resoluciones oficiales.</li>
        <li>El contenido enviado se procesa en servidores de Anthropic en EEUU bajo Cláusulas Contractuales Tipo aprobadas por la UE, con retención máxima de 7 días para detección de abuso.</li>
        <li>Los datos <strong>no se utilizan para entrenamiento de modelos</strong>.</li>
        <li>Cada utilización requiere <strong>consentimiento específico del usuario</strong> mediante casilla de verificación previa al envío de los datos.</li>
        <li>El usuario es responsable de no subir archivos con datos personales de terceros que no le correspondan por su actividad profesional legítima.</li>
      </ul>
      <p>
        A diferencia de las herramientas anteriores, <strong>el servicio CBAM advisory no utiliza Anthropic ni ningún proveedor de IA fuera de la Unión Europea</strong>: todo el procesamiento ocurre en infraestructura europea.
      </p>

      <h2>6. Propiedad de los datos del usuario</h2>
      <p>
        Los datos que el usuario introduce en la Plataforma (clasificaciones realizadas, favoritos, despachos, alertas configuradas) pertenecen al usuario. El titular actúa como responsable del tratamiento y facilita su descarga o eliminación conforme a la <a href="/privacidad">Política de Privacidad</a>.
      </p>

      <h2>7. Disponibilidad del servicio</h2>
      <p>
        El titular se compromete a ofrecer un servicio razonablemente continuo pero <strong>no garantiza disponibilidad del 100%</strong>. Pueden producirse interrupciones por mantenimiento, actualizaciones o causas ajenas. No se derivará responsabilidad por interrupciones temporales.
      </p>

      <h2>8. Limitación de responsabilidad</h2>
      <p>
        Las clasificaciones, cálculos y resultados ofrecidos tienen carácter <strong>orientativo</strong>. El usuario es responsable final de sus declaraciones aduaneras y decisiones comerciales. Véase el <a href="/aviso-legal">Aviso Legal</a> para el alcance completo de la limitación de responsabilidad.
      </p>

      <h2>9. Modificaciones</h2>
      <p>
        El titular puede modificar estos Términos para adaptarlos a cambios regulatorios o del servicio. Los cambios sustanciales se comunicarán por email con 30 días de antelación, y podrá requerirse reaceptación.
      </p>

      <h2>10. Baja</h2>
      <p>
        El usuario puede dar de baja su cuenta en cualquier momento enviando solicitud a <a href="mailto:privacidad@lexaduana.es">privacidad@lexaduana.es</a>. La baja implica el borrado de datos conforme a los plazos de la <a href="/privacidad">Política de Privacidad</a> (30 días de gracia, después borrado, salvo registros que deban conservarse por obligación legal).
      </p>
      <blockquote>
        Está previsto habilitar próximamente un panel de autoservicio en &quot;Mi cuenta&quot; para gestionar la baja directamente.
      </blockquote>

      <h2>11. Legislación aplicable</h2>
      <p>
        Legislación española. Jurisdicción de Madrid, salvo fuero imperativo del consumidor.
      </p>
    </LegalPageLayout>
  )
}
