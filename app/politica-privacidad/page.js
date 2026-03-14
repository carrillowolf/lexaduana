import Link from 'next/link'

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <Link href="/" className="text-blue-600 hover:text-blue-700 mb-6 inline-block">
          ← Volver al inicio
        </Link>

        <h1 className="text-4xl font-bold text-[#0A3D5C] mb-8">
          Política de Privacidad
        </h1>

        <div className="prose max-w-none space-y-6 text-gray-700">
          <p className="text-sm text-gray-500">
            Última actualización: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">1. Responsable del tratamiento</h2>
            <p>
              <strong>LexAduana</strong> es responsable del tratamiento de los datos personales que nos proporcione.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email de contacto: soporte@lexaduana.es</li>
              <li>Sitio web: https://lexaduana.es</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">2. Datos que recopilamos</h2>
            <p>Cuando utiliza nuestra plataforma, podemos recopilar los siguientes datos:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Datos de cuenta:</strong> Email, contraseña (encriptada)</li>
              <li><strong>Datos de uso:</strong> Códigos HS consultados, valores CIF, países de origen</li>
              <li><strong>Datos técnicos:</strong> Dirección IP, tipo de navegador, sistema operativo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">3. Finalidad del tratamiento</h2>
            <p>Utilizamos sus datos para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proporcionar y mantener nuestros servicios de calculadora aduanera</li>
              <li>Guardar historial de cálculos (solo usuarios registrados)</li>
              <li>Mejorar la experiencia del usuario</li>
              <li>Comunicarnos con usted sobre actualizaciones del servicio</li>
              <li>Cumplir con obligaciones legales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">4. Base legal</h2>
            <p>El tratamiento de sus datos se basa en:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Ejecución de contrato:</strong> Para prestar los servicios solicitados</li>
              <li><strong>Consentimiento:</strong> Para funcionalidades opcionales</li>
              <li><strong>Interés legítimo:</strong> Para mejorar nuestros servicios</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">5. Conservación de datos</h2>
            <p>
              Conservamos sus datos personales mientras mantenga una cuenta activa con nosotros. 
              Puede solicitar la eliminación de su cuenta y datos en cualquier momento contactando con soporte@lexaduana.es.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">6. Seguridad</h2>
            <p>
              Implementamos medidas técnicas y organizativas apropiadas para proteger sus datos:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cifrado de contraseñas (bcrypt)</li>
              <li>Conexiones seguras HTTPS</li>
              <li>Base de datos con Row Level Security (RLS)</li>
              <li>Tokens de autenticación seguros (JWT)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">7. Sus derechos</h2>
            <p>Conforme al RGPD, usted tiene derecho a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Acceso:</strong> Solicitar copia de sus datos personales</li>
              <li><strong>Rectificación:</strong> Corregir datos inexactos</li>
              <li><strong>Supresión:</strong> Solicitar eliminación de sus datos</li>
              <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado</li>
              <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos</li>
            </ul>
            <p className="mt-3">
              Para ejercer estos derechos, contacte con: <a href="mailto:soporte@lexaduana.es" className="text-blue-600 hover:underline">soporte@lexaduana.es</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">8. Cookies</h2>
            <p>
              Utilizamos cookies estrictamente necesarias para el funcionamiento del sitio (autenticación de sesión). 
              No utilizamos cookies de terceros ni de seguimiento publicitario.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">9. Transferencias internacionales</h2>
            <p>
              Sus datos se almacenan en servidores de Supabase (ubicados en la UE). 
              No realizamos transferencias de datos fuera del Espacio Económico Europeo.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">10. Cambios en esta política</h2>
            <p>
              Podemos actualizar esta política de privacidad ocasionalmente. 
              Le notificaremos de cambios significativos por email o mediante aviso en el sitio web.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">11. Contacto</h2>
            <p>
              Para cualquier consulta sobre esta política de privacidad o el tratamiento de sus datos:
            </p>
            <p className="font-semibold">
              Email: <a href="mailto:soporte@lexaduana.es" className="text-blue-600 hover:underline">soporte@lexaduana.es</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
