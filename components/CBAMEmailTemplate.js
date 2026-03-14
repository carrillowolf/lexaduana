'use client'

import { useState } from 'react'

export default function CBAMEmailTemplate() {
  const [language, setLanguage] = useState('es')
  const [supplierName, setSupplierName] = useState('')
  const [productName, setProductName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [copied, setCopied] = useState(false)

  const templates = {
    es: {
      subject: `Solicitud de datos de emisiones CBAM - ${productName || '[Producto]'}`,
      body: `Estimado/a ${supplierName || '[Nombre del proveedor]'},

Le contactamos desde ${companyName || '[Su empresa]'} en relación con el Mecanismo de Ajuste en Frontera por Carbono (CBAM) de la Unión Europea.

Según el Reglamento (UE) 2023/956, a partir del 1 de enero de 2026 estamos obligados a declarar las emisiones de CO₂ incorporadas en los productos que importamos a la UE. Para cumplir con esta obligación, necesitamos que nos facilite la siguiente información sobre ${productName || '[el producto]'}:

DATOS DE LA INSTALACIÓN:
• Nombre de la instalación productora
• País y dirección de la instalación
• Identificador único de instalación (si dispone)

DATOS DE EMISIONES:
• Emisiones directas específicas (tCO₂e por tonelada de producto)
• Emisiones indirectas (si aplica al producto)
• Metodología de cálculo utilizada (medición real, valores por defecto UE, benchmarks)
• Factor de emisión de electricidad utilizado (kgCO₂/kWh)

DOCUMENTACIÓN DE SOPORTE:
• Certificado de verificación de emisiones (si dispone)
• Informe de metodología de cálculo
• Cualquier precio de carbono pagado en origen

Le adjuntamos la plantilla oficial de comunicación de la Comisión Europea para facilitar el proceso.

El plazo para la primera declaración anual CBAM es el 31 de mayo de 2026, por lo que agradeceríamos recibir esta información antes del [FECHA].

Quedamos a su disposición para cualquier aclaración.

Un cordial saludo,
${companyName || '[Su empresa]'}

---
Información: https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_es
Plantilla oficial: https://cbam.ec.europa.eu/`
    },
    en: {
      subject: `CBAM Emissions Data Request - ${productName || '[Product]'}`,
      body: `Dear ${supplierName || '[Supplier Name]'},

We are contacting you from ${companyName || '[Your Company]'} regarding the European Union's Carbon Border Adjustment Mechanism (CBAM).

According to Regulation (EU) 2023/956, from January 1, 2026, we are required to declare the CO₂ emissions embedded in the products we import into the EU. To comply with this obligation, we need you to provide the following information about ${productName || '[the product]'}:

INSTALLATION DATA:
• Name of the production installation
• Country and address of the installation
• Unique installation identifier (if available)

EMISSIONS DATA:
• Specific direct emissions (tCO₂e per tonne of product)
• Indirect emissions (if applicable to the product)
• Calculation methodology used (actual measurement, EU default values, benchmarks)
• Electricity emission factor used (kgCO₂/kWh)

SUPPORTING DOCUMENTATION:
• Emissions verification certificate (if available)
• Calculation methodology report
• Any carbon price paid at origin

We attach the official European Commission communication template to facilitate the process.

The deadline for the first annual CBAM declaration is May 31, 2026, so we would appreciate receiving this information before [DATE].

We remain at your disposal for any clarification.

Best regards,
${companyName || '[Your Company]'}

---
Information: https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en
Official template: https://cbam.ec.europa.eu/`
    }
  }

  const currentTemplate = templates[language]

  const handleCopy = async () => {
    const fullEmail = `Asunto: ${currentTemplate.subject}\n\n${currentTemplate.body}`
    
    try {
      await navigator.clipboard.writeText(fullEmail)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = fullEmail
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const handleOpenMailClient = () => {
    const subject = encodeURIComponent(currentTemplate.subject)
    const body = encodeURIComponent(currentTemplate.body)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">📧</span>
            <div>
              <h3 className="text-xl font-bold text-white">
                Plantilla: Solicitar datos al proveedor
              </h3>
              <p className="text-orange-100 text-sm">
                Email listo para copiar y enviar a tu fabricante/exportador
              </p>
            </div>
          </div>
          
          {/* Toggle idioma */}
          <div className="flex items-center gap-2 bg-white/20 rounded-lg p-1">
            <button
              onClick={() => setLanguage('es')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                language === 'es' 
                  ? 'bg-white text-orange-600 shadow' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              🇪🇸 Español
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                language === 'en' 
                  ? 'bg-white text-orange-600 shadow' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Campos personalizables */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del proveedor
            </label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Ej: Zhang Wei"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Producto
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ej: Barras de aluminio"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tu empresa
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ej: Importaciones García S.L."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
            />
          </div>
        </div>

        {/* Vista previa del email */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Vista previa del email
            </label>
            <span className="text-xs text-gray-500">
              {language === 'es' ? 'Los campos entre [corchetes] se reemplazarán' : 'Fields in [brackets] will be replaced'}
            </span>
          </div>
          
          {/* Asunto */}
          <div className="bg-gray-100 px-4 py-2 rounded-t-lg border border-gray-300 border-b-0">
            <span className="text-sm text-gray-500">Asunto: </span>
            <span className="text-sm font-medium text-gray-800">{currentTemplate.subject}</span>
          </div>
          
          {/* Cuerpo */}
          <div className="bg-white border border-gray-300 rounded-b-lg p-4 max-h-80 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
              {currentTemplate.body}
            </pre>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCopy}
            className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              copied 
                ? 'bg-green-500 text-white' 
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {copied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                ¡Copiado al portapapeles!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copiar email completo
              </>
            )}
          </button>
          
          <button
            onClick={handleOpenMailClient}
            className="flex-1 px-6 py-3 bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Abrir en cliente de correo
          </button>
        </div>

        {/* Nota */}
        <p className="mt-4 text-xs text-gray-500 text-center">
          💡 Puedes adjuntar la plantilla oficial de la Comisión Europea descargándola desde{' '}
          <a 
            href="https://cbam.ec.europa.eu/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-orange-600 hover:underline"
          >
            cbam.ec.europa.eu
          </a>
        </p>
      </div>
    </div>
  )
}
