import LegalPageLayout from '@/components/legal/LegalPageLayout'
import { LEGAL_VERSIONS } from '@/lib/legal-versions'

export const metadata = {
  title: 'Aviso Legal | LexAduana',
  description: 'Datos identificativos del titular, naturaleza orientativa del servicio, limitación de responsabilidad y propiedad intelectual de LexAduana.',
  alternates: { canonical: '/aviso-legal' },
}

export const dynamic = 'force-static'

export default function AvisoLegalPage() {
  return (
    <LegalPageLayout
      title="Aviso Legal"
      version={LEGAL_VERSIONS.legal_notice}
      contactEmail="soporte@lexaduana.es"
    >
      <h2>1. Datos identificativos del titular</h2>
      <p>
        En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa:
      </p>
      <table>
        <tbody>
          <tr><td><strong>Titular del sitio web</strong></td><td>Carlos Carrillo del Olmo</td></tr>
          <tr><td><strong>NIF</strong></td><td>50906645D</td></tr>
          <tr><td><strong>Domicilio profesional</strong></td><td>Avenida de América 19, 28002 Madrid, España</td></tr>
          <tr><td><strong>Email de contacto</strong></td><td><a href="mailto:soporte@lexaduana.es">soporte@lexaduana.es</a></td></tr>
          <tr><td><strong>Email de privacidad</strong></td><td><a href="mailto:privacidad@lexaduana.es">privacidad@lexaduana.es</a></td></tr>
          <tr><td><strong>Sitio web</strong></td><td><a href="https://lexaduana.es">https://lexaduana.es</a></td></tr>
        </tbody>
      </table>

      <h2>2. Objeto</h2>
      <p>
        El presente aviso legal regula el uso del sitio web <a href="https://lexaduana.es">https://lexaduana.es</a> (en adelante, &quot;la Plataforma&quot;), que ofrece herramientas digitales de apoyo a profesionales del comercio exterior en España: calculadora de aranceles basada en TARIC, clasificador de productos asistido por IA, gestor de despachos, módulo CBAM, comparador multi-origen, alertas arancelarias, entre otras.
      </p>

      <h2>3. Naturaleza orientativa del servicio</h2>
      <p>
        <strong>La información, cálculos y clasificaciones ofrecidos por la Plataforma tienen carácter meramente orientativo e informativo.</strong> No constituyen:
      </p>
      <ul>
        <li>Información Arancelaria Vinculante (IAV) en el sentido del artículo 33 del Reglamento (UE) 952/2013 (CAU).</li>
        <li>Asesoramiento profesional en materia aduanera, fiscal, jurídica o de comercio exterior.</li>
        <li>Autorización, refrendo o validación oficial por parte de la Agencia Estatal de Administración Tributaria (AEAT), la Comisión Europea u otra autoridad competente.</li>
      </ul>
      <p>
        Las clasificaciones arancelarias propuestas por el clasificador basado en IA se fundamentan en datos públicos de EUR-Lex y en modelos de inteligencia artificial de terceros, sin que constituyan clasificaciones vinculantes. La responsabilidad final sobre la correcta declaración aduanera corresponde siempre al usuario y/o al operador económico declarante.
      </p>
      <p>
        Se recomienda al usuario contrastar cualquier resultado con las fuentes oficiales (AEAT, EUR-Lex, Reglamentos CE aplicables) y, en caso de duda, solicitar una IAV a la Administración o consultar con un profesional colegiado.
      </p>

      <h2>4. Limitación de responsabilidad</h2>
      <p>El titular no se hace responsable de:</p>
      <ul>
        <li>Decisiones de declaración aduanera, pago de tributos o gestión de despachos adoptadas por el usuario basándose en la información ofrecida por la Plataforma.</li>
        <li>Consecuencias económicas, fiscales o regulatorias derivadas de errores o desactualizaciones en los datos públicos utilizados (EUR-Lex, BOE, BCE, CIRCABC).</li>
        <li>Interrupciones temporales del servicio por mantenimiento, actualizaciones o causas de fuerza mayor.</li>
        <li>Contenidos, servicios o páginas web de terceros enlazados desde la Plataforma.</li>
      </ul>
      <p>
        El titular se compromete a actualizar los datos con la periodicidad razonable que permitan las fuentes oficiales y a corregir diligentemente cualquier error material del que tenga conocimiento.
      </p>

      <h2>5. Propiedad intelectual e industrial</h2>
      <p>
        Todos los contenidos de la Plataforma (textos, código fuente, diseño, marcas, logotipos) son titularidad de Carlos Carrillo del Olmo o se utilizan bajo licencia. Queda prohibida su reproducción, distribución o comunicación pública sin autorización expresa, salvo para uso personal del usuario en el contexto del servicio.
      </p>
      <p>
        Los datos públicos incorporados a la Plataforma (TARIC, EUR-Lex, BOE, BCE) pertenecen a sus respectivas fuentes y se reutilizan conforme a las condiciones de reutilización de información del sector público aplicables.
      </p>

      <h2>6. Legislación aplicable y jurisdicción</h2>
      <p>
        El presente aviso legal se rige por la legislación española. Para cualquier controversia derivada del uso del sitio web, las partes se someten a los Juzgados y Tribunales de Madrid, salvo que la ley disponga otro fuero imperativo para consumidores.
      </p>
    </LegalPageLayout>
  )
}
