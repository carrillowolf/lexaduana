import LegalPageLayout from '@/components/legal/LegalPageLayout'
import { LEGAL_VERSIONS } from '@/lib/legal-versions'

export const metadata = {
  title: 'Política de Cookies | LexAduana',
  description: 'LexAduana solo utiliza cookies estrictamente necesarias. Sin cookies analíticas ni de marketing. Plausible Analytics sin cookies ni tracking.',
  alternates: { canonical: '/cookies' },
}

export const dynamic = 'force-static'

export default function PoliticaCookiesPage() {
  return (
    <LegalPageLayout
      title="Política de Cookies"
      version={LEGAL_VERSIONS.cookies_policy}
      contactEmail="privacidad@lexaduana.es"
    >
      <h2>1. ¿Qué son las cookies?</h2>
      <p>
        Las cookies son pequeños archivos que se almacenan en el dispositivo del usuario al visitar un sitio web, y que permiten al sitio recordar información sobre la visita.
      </p>

      <h2>2. Cookies utilizadas por LexAduana</h2>
      <p>
        LexAduana utiliza únicamente <strong>cookies estrictamente necesarias</strong> para el funcionamiento del servicio. <strong>No utilizamos cookies analíticas, publicitarias ni de redes sociales.</strong>
      </p>

      <h3>2.1 Cookies técnicas (exentas de consentimiento)</h3>
      <p>
        Estas cookies son imprescindibles para el funcionamiento del servicio. No requieren consentimiento conforme al artículo 22.2 LSSI-CE.
      </p>
      <table>
        <thead>
          <tr><th>Nombre</th><th>Proveedor</th><th>Finalidad</th><th>Duración</th></tr>
        </thead>
        <tbody>
          <tr><td><code>sb-access-token</code></td><td>Supabase (propia)</td><td>Autenticación del usuario</td><td>Sesión</td></tr>
          <tr><td><code>sb-refresh-token</code></td><td>Supabase (propia)</td><td>Renovación de sesión</td><td>7 días</td></tr>
          <tr><td><code>lexaduana-theme</code></td><td>LexAduana (propia)</td><td>Recordar preferencia de tema (claro/oscuro) si el usuario la cambia</td><td>12 meses</td></tr>
        </tbody>
      </table>

      <h2>3. Analítica web sin cookies</h2>
      <p>
        LexAduana utiliza <strong>Plausible Analytics</strong> para medir tráfico agregado del sitio (visitas, páginas más vistas, fuentes de tráfico). Plausible es una empresa europea con servidores en Fráncfort (Alemania).
      </p>
      <p>
        <strong>Plausible NO utiliza cookies ni almacenamiento local del navegador</strong>, no recoge dirección IP completa ni datos personales identificables, y no cruza información entre sitios. Por este motivo, <strong>no requiere banner de consentimiento</strong> conforme al artículo 22 LSSI-CE y el RGPD: la base legal aplicable es el interés legítimo del responsable en conocer las métricas de uso agregadas de su propio sitio web.
      </p>
      <p>
        Más información sobre el funcionamiento de Plausible:{' '}
        <a href="https://plausible.io/data-policy" rel="noopener noreferrer" target="_blank">
          https://plausible.io/data-policy
        </a>
      </p>

      <h2>4. Cookies de terceros</h2>
      <p>LexAduana <strong>no instala cookies de terceros</strong>. No utilizamos:</p>
      <ul>
        <li>Google Analytics, Meta Pixel ni ninguna otra herramienta de tracking publicitario.</li>
        <li>Botones sociales que instalen cookies (compartir en X, Facebook, LinkedIn).</li>
        <li>Mapas embebidos, vídeos embebidos ni widgets externos que instalen cookies.</li>
      </ul>

      <h2>5. Gestión de cookies desde el navegador</h2>
      <p>
        Aunque LexAduana no instala cookies analíticas ni publicitarias, el usuario puede gestionar las cookies técnicas desde su navegador. Esto puede afectar al funcionamiento del servicio (por ejemplo, perdiendo la sesión iniciada al borrar las cookies de Supabase).
      </p>
      <p>Guías oficiales de los principales navegadores:</p>
      <ul>
        <li><strong>Chrome</strong>: <a href="https://support.google.com/chrome/answer/95647" rel="noopener noreferrer" target="_blank">support.google.com/chrome/answer/95647</a></li>
        <li><strong>Firefox</strong>: <a href="https://support.mozilla.org/es/kb/proteccion-mejorada-rastreo-firefox-escritorio" rel="noopener noreferrer" target="_blank">support.mozilla.org/es/kb/proteccion-mejorada-rastreo-firefox-escritorio</a></li>
        <li><strong>Safari</strong>: <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" rel="noopener noreferrer" target="_blank">support.apple.com/es-es/guide/safari/sfri11471/mac</a></li>
        <li><strong>Edge</strong>: <a href="https://support.microsoft.com/es-es/microsoft-edge" rel="noopener noreferrer" target="_blank">support.microsoft.com/es-es/microsoft-edge</a></li>
      </ul>

      <h2>6. Cambios en esta política</h2>
      <p>
        Si en el futuro LexAduana incorpora cookies adicionales (por ejemplo, cookies analíticas con consentimiento o herramientas de chat), esta política se actualizará y se solicitará consentimiento expreso al usuario antes de instalarlas.
      </p>
    </LegalPageLayout>
  )
}
