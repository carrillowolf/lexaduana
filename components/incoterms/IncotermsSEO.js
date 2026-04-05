import Link from 'next/link'

export default function IncotermsSEO() {
  return (
    <section className="max-w-4xl mx-auto space-y-10">
      {/* Bloque 1 — Qué son los Incoterms 2020 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          ¿Qué son los Incoterms 2020?
        </h2>
        <div className="prose prose-sm prose-gray max-w-none space-y-4 text-gray-700 leading-relaxed">
          <p>
            Los <strong>Incoterms</strong> (International Commercial Terms) son un conjunto de reglas internacionales publicadas por la <strong>Cámara de Comercio Internacional (ICC)</strong> que definen las responsabilidades de compradores y vendedores en las transacciones de comercio internacional. La edición vigente, <strong>Incoterms 2020</strong>, entró en vigor el <strong>1 de enero de 2020</strong> y es la que se aplica actualmente en todo el mundo.
          </p>
          <p>
            Estas reglas establecen con claridad tres aspectos fundamentales de toda operación de compraventa internacional:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Reparto de costes:</strong> quién paga el transporte, el seguro, las tasas portuarias y los despachos aduaneros.</li>
            <li><strong>Transferencia de riesgos:</strong> en qué punto geográfico el riesgo de pérdida o daño pasa del vendedor al comprador.</li>
            <li><strong>Obligaciones documentales:</strong> qué documentos debe proporcionar cada parte (conocimiento de embarque, póliza de seguro, despacho de exportación, etc.).</li>
          </ul>
          <p>
            Es importante saber que los Incoterms <strong>no regulan</strong> la transferencia de propiedad de la mercancía, las condiciones de pago, la ley aplicable al contrato ni las consecuencias del incumplimiento. Estos aspectos deben pactarse por separado en el contrato de compraventa.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">Los dos grupos de Incoterms</h3>
          <p>
            Los 11 Incoterms 2020 se dividen en dos grupos según el modo de transporte:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>7 Incoterms multimodales</strong> (EXW, FCA, CPT, CIP, DAP, DPU, DDP): válidos para cualquier medio de transporte, incluyendo combinaciones (camión + barco + avión).</li>
            <li><strong>4 Incoterms marítimos</strong> (FAS, FOB, CFR, CIF): exclusivos para transporte por mar o vías navegables interiores.</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">Cambios principales respecto a Incoterms 2010</h3>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>DAT pasa a llamarse DPU</strong> (Delivered at Place Unloaded): el nuevo nombre refleja que la entrega ya no se limita a terminales portuarias o aeroportuarias, sino que puede ser en cualquier lugar acordado.</li>
            <li><strong>Seguro en CIP:</strong> la cobertura mínima obligatoria pasa de ICC-C (mínima) a ICC-A (máxima, contra todo riesgo). CIF mantiene ICC-C.</li>
            <li><strong>FCA y el conocimiento de embarque:</strong> nueva opción que permite al comprador instruir al transportista para que emita un BL (conocimiento de embarque) con anotación «on board» al vendedor, facilitando las operaciones con cartas de crédito.</li>
          </ul>
        </div>
      </div>

      {/* Bloque 2 — Impacto en el valor en aduana */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          ¿Cómo afectan los Incoterms al valor en aduana?
        </h2>
        <div className="prose prose-sm prose-gray max-w-none space-y-4 text-gray-700 leading-relaxed">
          <p>
            El <strong>valor en aduana</strong> es la base sobre la que se calculan los aranceles y el IVA a la importación. En la Unión Europea, se determina conforme al <strong>Código Aduanero de la Unión</strong> (Reglamento UE 952/2013), utilizando el <strong>valor de transacción</strong> como método principal.
          </p>
          <p>
            La referencia que utilizan las aduanas europeas es el valor <strong>CIF</strong> (coste + seguro + flete) en la frontera de la UE. Esto significa que, independientemente del Incoterm pactado, el valor en aduana debe reflejar todos los costes hasta el punto de entrada en la UE:
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 not-prose">
            <h4 className="text-sm font-bold text-blue-900 mb-3">Ajustes según el Incoterm utilizado</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex gap-2">
                <span className="font-bold min-w-[80px]">EXW / FOB:</span>
                <span>Hay que <strong>sumar</strong> al precio los costes de flete y seguro hasta la frontera UE para obtener el valor en aduana.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold min-w-[80px]">CFR:</span>
                <span>Solo falta <strong>sumar</strong> el seguro al precio para llegar al valor CIF.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold min-w-[80px]">CIF:</span>
                <span>Si el puerto de destino es la frontera UE, el precio CIF <strong>coincide</strong> con el valor en aduana.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold min-w-[80px]">CIP / DDP:</span>
                <span>Puede ser necesario <strong>deducir</strong> los costes post-frontera (transporte interior UE, aranceles ya incluidos).</span>
              </div>
            </div>
          </div>

          <p>
            Entender la relación entre el Incoterm y el valor en aduana es esencial para declarar correctamente en el DUA (Documento Único Administrativo) y evitar liquidaciones complementarias o sanciones.
          </p>

          <div className="bg-gradient-to-r from-[#0A3D5C] to-[#0D5A8A] rounded-xl p-5 not-prose">
            <p className="text-white text-sm mb-3">
              ¿Quieres calcular los aranceles de tu importación con el Incoterm correcto?
            </p>
            <Link
              href="/calculadora"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A3D5C] font-semibold rounded-lg text-sm hover:bg-blue-50 transition-colors"
            >
              Calcula tus aranceles con nuestra calculadora TARIC
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
