import Link from 'next/link'

export default function TerminosUsoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <Link href="/" className="text-blue-600 hover:text-blue-700 mb-6 inline-block">
          ← Volver al inicio
        </Link>

        <h1 className="text-4xl font-bold text-[#0A3D5C] mb-8">
          Términos de Uso
        </h1>

        <div className="prose max-w-none space-y-6 text-gray-700">
          <p className="text-sm text-gray-500">
            Última actualización: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">1. Aceptación de los términos</h2>
            <p>
              Al acceder y utilizar LexAduana, usted acepta estar sujeto a estos Términos de Uso y a nuestra Política de Privacidad. 
              Si no está de acuerdo con alguno de estos términos, no utilice nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">2. Descripción del servicio</h2>
            <p>
              LexAduana es una plataforma profesional de cálculo de aranceles e IVA para importaciones en la Unión Europea. 
              Proporcionamos:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Calculadora de aranceles basada en datos oficiales TARIC</li>
              <li>Cálculo de IVA según normativa española</li>
              <li>Conversión de tipos de cambio oficiales (BCE)</li>
              <li>Procesamiento masivo de cálculos</li>
              <li>Historial y exportación de resultados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">3. Uso del servicio</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">3.1 Uso permitido</h3>
            <p>Puede utilizar LexAduana para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Calcular aranceles e IVA de importación</li>
              <li>Obtener información sobre medidas TARIC aplicables</li>
              <li>Exportar sus propios cálculos</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">3.2 Uso prohibido</h3>
            <p>NO puede:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Utilizar el servicio para fines ilegales</li>
              <li>Intentar acceder a áreas restringidas del sistema</li>
              <li>Copiar, redistribuir o revender nuestros datos</li>
              <li>Realizar scraping o descarga masiva automatizada</li>
              <li>Sobrecargar intencionadamente nuestros servidores</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">4. Registro de cuenta</h2>
            <p>Para acceder a funcionalidades completas, debe:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proporcionar información verídica y actualizada</li>
              <li>Mantener la seguridad de su contraseña</li>
              <li>Notificarnos inmediatamente de cualquier uso no autorizado</li>
              <li>Ser responsable de toda actividad bajo su cuenta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">5. Precisión de la información</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
              <p className="font-semibold text-yellow-800">⚠️ Aviso importante:</p>
              <p className="text-yellow-700 mt-2">
                Los cálculos proporcionados se basan en datos oficiales TARIC actualizados mensualmente. 
                Sin embargo, LexAduana NO sustituye el asesoramiento profesional de un agente de aduanas o consultor fiscal.
              </p>
            </div>
            <ul className="list-disc pl-6 space-y-2">
              <li>Los resultados son orientativos</li>
              <li>La normativa aduanera puede cambiar</li>
              <li>Pueden existir medidas específicas no recogidas</li>
              <li>Para despachos oficiales, consulte con profesionales certificados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">6. Propiedad intelectual</h2>
            <p>
              Todos los derechos de propiedad intelectual sobre la plataforma, diseño, código y contenido son propiedad de LexAduana.
            </p>
            <p className="mt-2">
              Los datos TARIC son de dominio público (Comisión Europea). Nuestra estructura, procesamiento y presentación están protegidos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">7. Limitación de responsabilidad</h2>
            <p>
              LexAduana NO será responsable de:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pérdidas derivadas del uso de cálculos orientativos</li>
              <li>Errores en despachos de importación</li>
              <li>Sanciones o multas aduaneras</li>
              <li>Interrupciones temporales del servicio</li>
              <li>Pérdida de datos por causas ajenas a nosotros</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">8. Modificación del servicio</h2>
            <p>
              Nos reservamos el derecho de:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Modificar o discontinuar funcionalidades</li>
              <li>Actualizar estos términos (con notificación previa)</li>
              <li>Cambiar planes de precios (respetando suscripciones activas)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">9. Suspensión y terminación</h2>
            <p>
              Podemos suspender o terminar su acceso si:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Viola estos términos de uso</li>
              <li>Realiza actividades fraudulentas o ilegales</li>
              <li>Abusa del servicio de forma sistemática</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">10. Legislación aplicable</h2>
            <p>
              Estos términos se rigen por la legislación española. 
              Cualquier disputa se someterá a los juzgados y tribunales de Madrid, España.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">11. Normativa de referencia</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Reglamento (UE) 2447/2015 - Código Aduanero de la Unión</li>
              <li>Ley 46/1998 - Introducción del Euro</li>
              <li>RGPD - Reglamento General de Protección de Datos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3D5C] mb-3">12. Contacto</h2>
            <p>
              Para consultas sobre estos términos:
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
