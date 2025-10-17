import Image from 'next/image'
import Link from 'next/link'

export default function FooterLanding() {
  return (
    <footer className="bg-[#0A3D5C] text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Logo + Descripción */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image 
                  src="/logo.png" 
                  alt="LexAduana" 
                  width={50} 
                  height={50}
                />
                <div>
                  <h3 className="text-xl font-bold">LEXADUANA</h3>
                  <p className="text-sm text-[#F4C542]">Plataforma Profesional Aduanera</p>
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                Calculadora TARIC profesional con 49,700 registros oficiales. 
                Cumplimiento garantizado según normativa UE 2447/2015.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-300 hover:text-[#F4C542] transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-[#F4C542] transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Producto */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-[#F4C542]">Producto</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#calculator" className="text-gray-300 hover:text-white transition">
                    Calculadora
                  </a>
                </li>
                <li>
                  <Link href="/bulk" className="text-gray-300 hover:text-white transition">
                    Cálculo Masivo
                  </Link>
                </li>
                <li>
                  <Link href="/tipos-cambio" className="text-gray-300 hover:text-white transition">
                    Tipos de Cambio
                  </Link>
                </li>
                <li>
                  <Link href="/glosario" className="text-gray-300 hover:text-white transition">
                    Glosario
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-gray-300 hover:text-white transition">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-[#F4C542]">Empresa</h4>
              <ul className="space-y-2">
                <li>
                  <a href="mailto:soporte@lexaduana.es" className="text-gray-300 hover:text-white transition">
                    Contacto
                  </a>
                </li>
                <li>
                  <Link href="/auth/register" className="text-gray-300 hover:text-white transition">
                    Registrarse
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="text-gray-300 hover:text-white transition">
                    Iniciar Sesión
                  </Link>
                </li>
                <li>
                  <Link href="/politica-privacidad" className="text-gray-300 hover:text-white transition">
                    Política de Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/terminos-uso" className="text-gray-300 hover:text-white transition">
                    Términos de Uso
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Normativa Legal */}
      <div className="border-t border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-400">
              <div>
                <p className="mb-2">
                  <strong className="text-[#F4C542]">Normativa aplicable:</strong>
                </p>
                <ul className="space-y-1">
                  <li>• Reglamento (UE) 2447/2015 - Código Aduanero de la Unión</li>
                  <li>• Ley 46/1998 - Introducción del Euro</li>
                  <li>• Base de datos TARIC oficial</li>
                </ul>
              </div>
              <div>
                <p className="mb-2">
                  <strong className="text-[#F4C542]">Fuentes oficiales:</strong>
                </p>
                <ul className="space-y-1">
                  <li>• Boletín Oficial del Estado (BOE)</li>
                  <li>• Banco Central Europeo (BCE)</li>
                  <li>• Comisión Europea - DG TAXUD</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-700 bg-[#072033]">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>
              © {new Date().getFullYear()} LexAduana. Todos los derechos reservados.
            </p>
            <p className="mt-2 md:mt-0">
              Datos actualizados según normativa vigente. Para importaciones oficiales, consulte con las autoridades aduaneras competentes.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
