// ============================================================
// VALOR EN ADUANA — Datos completos (CAU / Reg. 2015/2447)
// ============================================================

// ── Bloque 1: 6 métodos de valoración ───────────────────────

export const VALUATION_METHODS = [
  {
    number: 1,
    title: 'Valor de transacción',
    article: 'Art. 70 CAU',
    frequency: 'habitual',
    frequencyLabel: 'Uso habitual (~90%)',
    description:
      'Precio realmente pagado o por pagar cuando las mercancías se vendan para su exportación al territorio aduanero de la UE, ajustado conforme al artículo 71.',
    conditions: [
      'No hay restricciones sobre el uso o disposición de las mercancías por el comprador',
      'La venta no está sujeta a condiciones cuyo valor no pueda determinarse',
      'No hay parte del producto de la reventa que revierta al vendedor sin poder ajustarla',
      'No hay vinculación entre comprador y vendedor que influya en el precio',
    ],
    keyChange:
      'Cambio clave del CAU: se toma la última venta antes de la introducción en la UE (no la primera como antes). Criterio confirmado por el TJUE y el Tribunal Supremo español.',
  },
  {
    number: 2,
    title: 'Mercancías idénticas',
    article: 'Art. 74.2.a) CAU',
    frequency: 'secundario',
    frequencyLabel: 'Subsidiario al Método 1',
    description:
      'Precio de transacción aceptado por la aduana de mercancías idénticas, vendidas para su exportación a la UE y exportadas en el mismo momento o en momento próximo.',
    conditions: [
      'Idénticas: iguales en todos los aspectos (calidad, características físicas, reputación, marca)',
      'Mismo nivel comercial y cantidades sustancialmente iguales',
      'Si no hay cantidades iguales, se ajusta proporcionalmente',
    ],
    keyChange: null,
  },
  {
    number: 3,
    title: 'Mercancías similares',
    article: 'Art. 74.2.b) CAU',
    frequency: 'secundario',
    frequencyLabel: 'Subsidiario a Métodos 1 y 2',
    description:
      'Igual que el Método 2 pero con mercancías que no son idénticas sino similares: misma función, características semejantes y comercialmente intercambiables.',
    conditions: [
      'Similares: no idénticas pero con función equivalente y producidas en el mismo país',
      'Misma calidad, reputación y marca comercial',
      'Exportadas en el mismo momento o en momento próximo',
    ],
    keyChange: null,
  },
  {
    number: 4,
    title: 'Método deductivo',
    article: 'Art. 74.2.c) CAU',
    frequency: 'excepcional',
    frequencyLabel: 'Uso excepcional',
    description:
      'Se parte del precio de venta en la UE de las mercancías importadas (o de idénticas/similares) y se deducen los beneficios, gastos generales, transporte y seguro en la UE, y los derechos de importación.',
    conditions: [
      'Se usa cuando no aplican los métodos 1, 2 ni 3',
      'El importador puede pedir invertir el orden con el Método 5',
      'Se parte del precio unitario más frecuente en ventas a no vinculados',
    ],
    keyChange: null,
  },
  {
    number: 5,
    title: 'Valor reconstruido',
    article: 'Art. 74.2.d) CAU',
    frequency: 'excepcional',
    frequencyLabel: 'Muy raro en la práctica',
    description:
      'Se reconstruye el valor sumando el coste de materiales y fabricación, el beneficio habitual del exportador, y el transporte y seguro hasta la frontera UE.',
    conditions: [
      'Exige acceso a los datos de costes del fabricante extranjero',
      'En la práctica rara vez se usa por la dificultad de obtener esa información',
      'El importador puede pedir invertir el orden con el Método 4',
    ],
    keyChange: null,
  },
  {
    number: 6,
    title: 'Último recurso',
    article: 'Art. 74.3 CAU',
    frequency: 'excepcional',
    frequencyLabel: 'Solo cuando todo falla',
    description:
      'Criterios razonables basados en los datos disponibles en el territorio aduanero de la UE, compatibles con los principios generales del Acuerdo de Valoración del GATT.',
    conditions: [
      'Aplicable cuando ningún otro método funciona (donaciones, muestras, mercancía en consignación sin factura)',
      'No puede basarse en precios de exportación a países terceros ni en valores mínimos',
      'No puede basarse en sistemas que prevean la aceptación del valor más alto de dos posibles',
    ],
    keyChange: null,
  },
]

// ── Bloque 4: Ejemplos numéricos (3 Incoterms) ─────────────

export const NUMERICAL_EXAMPLES = [
  {
    id: 'fob',
    title: 'FOB marítimo (el más clásico)',
    product: 'Maquinaria industrial',
    hs: '8479.89',
    incoterm: 'FOB Los Ángeles',
    dutyRate: '3,7%',
    vatRate: '21%',
    cartaPorte: 'hasta Madrid',
    steps: {
      customsValue: {
        label: 'Valor en aduana',
        items: [
          { concept: 'Precio FOB', amount: 45000 },
          { concept: 'Flete marítimo LA→Barcelona', amount: 4500, sign: '+' },
          { concept: 'Seguro internacional', amount: 500, sign: '+' },
        ],
        total: 50000,
      },
      duty: { base: 50000, rate: 3.7, amount: 1850 },
      vatBase: {
        label: 'Base IVA',
        items: [
          { concept: 'Valor en aduana', amount: 50000 },
          { concept: 'Aranceles', amount: 1850, sign: '+' },
          { concept: 'Transporte Barcelona→Madrid', amount: 800, sign: '+' },
          { concept: 'Seguro interior', amount: 50, sign: '+' },
        ],
        total: 52700,
      },
      vat: { base: 52700, rate: 21, amount: 11067 },
      totalTax: 12917,
    },
    duaRefs: [
      'D.E. 14 01 (cas. 42): 45.000 EUR',
      'D.E. 14 07 (cas. 45): +5.000 EUR',
      'D.E. 14 06 (cas. 46): 50.000 EUR',
    ],
  },
  {
    id: 'cif',
    title: 'CIF (sin ajustes)',
    product: 'Componentes electrónicos',
    hs: '8542.31',
    incoterm: 'CIF Valencia',
    dutyRate: '0%',
    vatRate: '21%',
    cartaPorte: 'hasta Valencia (= frontera UE)',
    steps: {
      customsValue: {
        label: 'Valor en aduana',
        items: [
          { concept: 'Precio CIF', amount: 28000 },
        ],
        note: 'Sin ajustes — CIF = valor en aduana',
        total: 28000,
      },
      duty: { base: 28000, rate: 0, amount: 0 },
      vatBase: {
        label: 'Base IVA',
        items: [
          { concept: 'Valor en aduana', amount: 28000 },
          { concept: 'Aranceles', amount: 0, sign: '+' },
        ],
        note: 'Sin transporte interior — destino = frontera UE',
        total: 28000,
      },
      vat: { base: 28000, rate: 21, amount: 5880 },
      totalTax: 5880,
    },
    duaRefs: [
      'D.E. 14 01 (cas. 42): 28.000 EUR',
      'D.E. 14 07 (cas. 45): 0 EUR',
      'D.E. 14 06 (cas. 46): 28.000 EUR',
    ],
  },
  {
    id: 'ddp',
    title: 'DDP (el complejo)',
    product: 'Textil',
    hs: '6204.62',
    incoterm: 'DDP Madrid',
    dutyRate: '12%',
    vatRate: '21%',
    cartaPorte: 'hasta Madrid',
    priceBreakdown: [
      { concept: 'Mercancía', amount: 25000 },
      { concept: 'Flete Shanghai→Barcelona', amount: 3000 },
      { concept: 'Seguro', amount: 200 },
      { concept: 'Transporte Barcelona→Madrid', amount: 600 },
      { concept: 'Aranceles (12%)', amount: 3384 },
      { concept: 'Despacho + agente', amount: 400 },
    ],
    totalInvoice: 35000,
    steps: {
      customsValue: {
        label: 'Valor en aduana',
        items: [
          { concept: 'Precio DDP', amount: 35000 },
          { concept: 'Aranceles incluidos', amount: -3384, sign: '−' },
          { concept: 'Transporte Barcelona→Madrid', amount: -600, sign: '−' },
          { concept: 'Despacho/agente', amount: -400, sign: '−' },
        ],
        note: '= mercancía 25.000 + flete 3.000 + seguro 200',
        total: 28200,
      },
      duty: { base: 28200, rate: 12, amount: 3384 },
      vatBase: {
        label: 'Base IVA',
        items: [
          { concept: 'Valor en aduana', amount: 28200 },
          { concept: 'Aranceles', amount: 3384, sign: '+' },
          { concept: 'Transporte Barcelona→Madrid', amount: 600, sign: '+' },
        ],
        total: 32184,
      },
      vat: { base: 32184, rate: 21, amount: 6759 },
      totalTax: 10143,
    },
    wrongDeclaration: {
      wrongDuty: { base: 35000, rate: 12, amount: 4200 },
      wrongVatBase: 39800,
      wrongVat: 8358,
      overpayDuty: 816,
      overpayVat: 1599,
      overpayTotal: 2415,
    },
    duaRefs: [
      'D.E. 14 01 (cas. 42): 35.000 EUR',
      'D.E. 14 07 (cas. 45): −6.800 EUR',
      'D.E. 14 06 (cas. 46): 28.200 EUR',
    ],
  },
]

// ── Bloque 5: DV1 ───────────────────────────────────────────

export const DV1_INFO = {
  definition: 'Declaración de Valor — formulario complementario obligatorio para importaciones con valor superior a 20.000 EUR por envío.',
  threshold: '20.000 EUR',
  exceptions: [
    'Operaciones sin carácter comercial',
    'Intercambios continuados entre mismas partes con dispensa autorizada por la aduana',
  ],
  sections: [
    {
      label: 'Casillas 1-15',
      title: 'Identificación',
      content: 'Datos de las partes, Incoterm, factura, vinculación y condiciones del precio, existencia de cánones/royalties.',
    },
    {
      label: 'Sección B (casilla 18)',
      title: 'Elementos a AÑADIR',
      content: 'Comisiones de venta, embalajes, assists, cánones, transporte y seguro hasta frontera UE.',
      note: 'Alimenta el ajuste positivo de D.E. 14 07 (cas. 45).',
    },
    {
      label: 'Sección C (casilla 23)',
      title: 'Elementos a DEDUCIR',
      content: 'Transporte post-frontera, instalación/montaje, derechos de importación, intereses de financiación.',
      note: 'Alimenta el ajuste negativo de D.E. 14 07 (cas. 45).',
    },
  ],
  formula: 'D.E. 14 01 (precio factura) ± D.E. 14 07 (ajustes) = Valor en aduana ≈ D.E. 14 06 (valor estadístico)',
  formulaDUA: 'Casilla 42 ± Casilla 45 = Valor en aduana ≈ Casilla 46',
}

export const EXTENDED_DUA_H1_FIELDS = [
  { concept: 'Precio de factura', dua: 'Cas. 42', h1: 'D.E. 14 01', group: 'Grupo 14', description: 'Importe tal como consta en la factura comercial, sin ajustes' },
  { concept: 'Adiciones y deducciones', dua: 'Cas. 45', h1: 'D.E. 14 07', group: 'Grupo 14', description: '+/− para llegar al valor en aduana. Positivo = se suma, negativo = se resta' },
  { concept: 'Valor estadístico', dua: 'Cas. 46', h1: 'D.E. 14 06', group: 'Grupo 14', description: 'Valor CIF en EUR en frontera española' },
  { concept: 'Condiciones de entrega', dua: 'Cas. 20', h1: 'D.E. 14 11', group: 'Grupo 14', description: 'Código Incoterm + lugar (ej: "CIF Valencia")' },
  { concept: 'Método de valoración', dua: 'Cas. 43', h1: 'D.E. 14 16', group: 'Grupo 14', description: 'Código 1-6 según método del CAU aplicado' },
  { concept: 'Indicadores de valoración', dua: 'Cas. 43', h1: 'D.E. 14 02', group: 'Grupo 14', description: 'Vinculación entre partes, restricciones sobre el precio' },
  { concept: 'Liquidación de tributos', dua: 'Cas. 47', h1: 'D.E. 14 03', group: 'Grupo 14', description: 'A00 = arancel, B00 = IVA, C00 = otros impuestos' },
  { concept: 'Base imponible', dua: 'Cas. 47', h1: 'D.E. 14 04', group: 'Grupo 14', description: 'Base de cálculo de cada tributo' },
  { concept: 'Tipo de cambio', dua: 'Cas. 23', h1: 'D.E. 14 05', group: 'Grupo 14', description: 'Tipo BCE vigente a fecha de admisión' },
  { concept: 'País de origen', dua: 'Cas. 34a', h1: 'D.E. 16 06', group: 'Grupo 16', description: 'Origen no preferencial (erga omnes)' },
  { concept: 'País origen preferencial', dua: 'Cas. 34a', h1: 'D.E. 16 03', group: 'Grupo 16', description: 'Origen con acuerdo comercial aplicable' },
  { concept: 'Masa neta', dua: 'Cas. 38', h1: 'D.E. 18 01', group: 'Grupo 18', description: 'Peso en kg (base para derechos específicos)' },
  { concept: 'Código de mercancía', dua: 'Cas. 33', h1: 'D.E. 18 09', group: 'Grupo 18', description: '10 dígitos TARIC completo' },
  { concept: 'MRN', dua: '—', h1: 'D.E. 11 08', group: 'Grupo 11', description: 'Referencia maestra de la declaración (Movement Reference Number)' },
  { concept: 'Régimen solicitado', dua: 'Cas. 37.1', h1: 'D.E. 11 09', group: 'Grupo 11', description: '4000 = libre práctica, 4200 = LP + IVA diferido (art. 167 Ley IVA)' },
  { concept: 'Doc. justificativo', dua: 'Cas. 44', h1: 'D.E. 12 03', group: 'Grupo 12', description: 'EUR.1, ATR, declaración en factura, certificados sanitarios, CBAM' },
]

// ── Bloque 3: Ajustes art. 71/72 CAU (ampliados) ───────────

export const ENHANCED_CAU_ADJUSTMENTS = {
  alwaysAdd: [
    {
      concept: 'Comisiones de venta y corretaje',
      article: 'Art. 71.1.a) CAU',
      description: 'Se suman siempre que las pague el comprador y no estén incluidas en el precio.',
      warning: 'NO confundir con comisiones de compra (las del agente que representa al importador), que NO se suman (art. 72).',
      example: null,
    },
    {
      concept: 'Envases y embalaje',
      article: 'Art. 71.1.a) CAU',
      description: 'Tanto el coste de los envases que formen un todo con la mercancía como la mano de obra y materiales de embalaje.',
      warning: null,
      example: null,
    },
    {
      concept: 'Prestaciones del comprador (assists)',
      article: 'Art. 71.1.b) CAU',
      description: 'Materiales, componentes, herramientas, matrices, moldes y trabajos de ingeniería/diseño realizados fuera de la UE, suministrados por el comprador al fabricante gratuitamente o a precio reducido para la producción.',
      warning: null,
      example: 'Envías moldes desde España a tu proveedor en China para que fabrique piezas. El valor de esos moldes se suma al valor en aduana de las piezas importadas, prorrateado entre las unidades producidas.',
    },
    {
      concept: 'Cánones y royalties',
      article: 'Art. 71.1.c) CAU',
      description: 'Se incluyen si son condición de la venta de las mercancías importadas. Desde el CAU, basta con que las mercancías no puedan adquirirse sin el pago del canon.',
      warning: 'Área muy conflictiva. Criterio ampliado por jurisprudencia del TJUE. En caso de duda, consultar con asesor especializado en valoración aduanera.',
      example: 'Importas ropa de marca y pagas un royalty al licenciante por usar la marca. Si no puedes comprar esas prendas sin el acuerdo de licencia, el royalty se suma al valor en aduana.',
    },
    {
      concept: 'Producto de la reventa',
      article: 'Art. 71.1.d) CAU',
      description: 'Cualquier parte del beneficio de una reventa posterior que revierta directa o indirectamente al vendedor.',
      warning: null,
      example: null,
    },
    {
      concept: 'Transporte y seguro hasta frontera UE',
      article: 'Art. 71.1.e) CAU',
      description: 'El transporte, carga, manipulación y seguro hasta el lugar de introducción en el territorio aduanero de la UE. Ya cubierto en detalle en la sección de ajustes por Incoterm.',
      warning: null,
      example: null,
    },
  ],
  neverInclude: [
    {
      concept: 'Transporte posterior a la entrada en la UE',
      article: 'Art. 72.a) CAU',
      description: 'El transporte desde el punto de entrada en la UE hasta el destino final no forma parte del valor en aduana (aunque sí puede incluirse en la base del IVA).',
    },
    {
      concept: 'Construcción, instalación, montaje o mantenimiento',
      article: 'Art. 72.b) CAU',
      description: 'Los trabajos realizados después de la importación de la mercancía en el territorio de la UE.',
    },
    {
      concept: 'Intereses de financiación',
      article: 'Art. 72.c) CAU',
      description: 'Siempre que consten por escrito, el tipo no exceda el tipo habitual del mercado y el comprador pueda demostrar que se trata de una financiación real.',
    },
    {
      concept: 'Derechos de reproducción en la UE',
      article: 'Art. 72.d) CAU',
      description: 'Pagos por el derecho a reproducir las mercancías importadas en el territorio de la UE.',
    },
    {
      concept: 'Comisiones de compra',
      article: 'Art. 72.e) CAU',
      description: 'Las que remuneran al agente que representa al importador (buying agent). No confundir con comisiones de venta que SÍ se suman.',
    },
    {
      concept: 'Derechos de importación y otros gravámenes UE',
      article: 'Art. 72.f) CAU',
      description: 'Aranceles, IVA, impuestos especiales y otros gravámenes pagaderos en la UE por la importación o venta de las mercancías.',
    },
    {
      concept: 'Pagos por distribución/reventa',
      article: 'Art. 72 CAU',
      description: 'Pagos por el derecho de distribución o reventa de las mercancías importadas, cuando no sean condición de la venta para exportación.',
    },
  ],
}

// ── Bloque 6: Casos problemáticos ───────────────────────────

export const PROBLEMATIC_CASES = [
  {
    id: 'ddp-sin-desglose',
    title: 'Facturas DDP sin desglose',
    icon: '🚨',
    severity: 'critical',
    problem: 'El proveedor emite factura DDP por 140.000 EUR sin especificar qué parte es mercancía, flete, aranceles o IVA. Si declaras el total como valor en aduana, se produce doble tributación: pagas aranceles sobre los aranceles ya incluidos en el precio.',
    why: 'Muchos proveedores asiáticos emiten facturas DDP con un precio global sin desglose. El importador asume que ese es el valor en aduana y lo declara íntegramente.',
    solution: 'Exigir al proveedor un desglose detallado en la factura O documentar cada coste con facturas separadas (transportista, agente, liquidación de tributos). Si el proveedor se niega, estimar los componentes con datos de mercado y documentarlo.',
    reference: 'Art. 72 CAU (elementos excluidos del valor en aduana)',
  },
  {
    id: 'rechazo-valor',
    title: 'Rechazo del valor declarado por la aduana',
    icon: '⚠️',
    severity: 'warning',
    problem: 'La aduana tiene "dudas fundadas" sobre el valor declarado: precio muy bajo comparado con valores de referencia, falta de documentación o inconsistencias entre documentos.',
    why: 'La aduana mantiene bases de datos de valores de referencia por producto y origen. Cuando un valor declarado se desvía significativamente, se activa el procedimiento de duda.',
    solution: 'La aduana debe recurrir a los métodos secundarios del art. 74 CAU, en orden sucesivo obligatorio. El importador tiene derecho a solicitar explicación por escrito del método utilizado y a recurrir la liquidación si no está de acuerdo.',
    reference: 'Art. 140 Reg. Ejecución 2015/2447',
  },
  {
    id: 'vinculacion',
    title: 'Vinculación entre partes (empresas del mismo grupo)',
    icon: '🏢',
    severity: 'warning',
    problem: 'Importas de una empresa del grupo y la aduana cuestiona si el precio de transferencia está influido por la vinculación.',
    why: 'Hay vinculación cuando una persona posee/controla el 5% o más de las acciones de la otra, comparten dirección, hay relación empleador-empleado o son miembros de la misma familia.',
    solution: 'Demostrar que la vinculación NO ha influido en el precio mediante: examen de las circunstancias de la venta, o comparación con valores criterio (mercancías idénticas/similares a no vinculados). Los estudios de precios de transferencia son complementarios pero no determinantes por sí solos para aduanas.',
    reference: 'Art. 70.3.d) CAU; Art. 134 Reg. 2015/2447',
  },
  {
    id: 'royalties',
    title: 'Royalties/cánones — ¿se incluyen o no?',
    icon: '©️',
    severity: 'warning',
    problem: 'Pagas royalties a un tercero (licenciante) distinto del fabricante. La duda es si deben sumarse al valor en aduana.',
    why: 'El criterio del CAU es más amplio que el anterior: se incluyen si son "condición de la venta". Basta con que las mercancías no puedan adquirirse sin el pago del canon, aunque el pago sea a un tercero.',
    solution: 'Si no son cuantificables al momento del despacho: declaración simplificada con valor provisional + DUA complementario posterior (art. 73 CAU). Plazo: 120 días, prorrogable hasta 2 años.',
    reference: 'Art. 71.1.c) CAU; Art. 136 Reg. 2015/2447',
  },
  {
    id: 'incoterm-inconsistente',
    title: 'Incoterm declarado inconsistente con los documentos',
    icon: '📄',
    severity: 'info',
    problem: 'La factura dice "EXW" pero el conocimiento de embarque (B/L) muestra que el vendedor pagó el flete. O la factura dice "FOB" pero el vendedor contrató y pagó el transporte marítimo.',
    why: 'Es frecuente que las facturas mencionen un Incoterm "de costumbre" sin que refleje las condiciones reales de la operación.',
    solution: 'Prevalece la documentación objetiva (B/L, CMR, facturas de flete) sobre la mera mención del Incoterm en factura. Verificar siempre la coherencia entre factura comercial, documentos de transporte, D.E. 14 11 y D.E. 14 01.',
    reference: 'Principio de primacía de la realidad económica en valoración aduanera',
  },
  {
    id: 'thc-destino',
    title: 'THC de destino — ¿se incluyen o no?',
    icon: '⚓',
    severity: 'info',
    problem: 'Los Terminal Handling Charges (THC) de destino: ¿forman parte del valor en aduana o no?',
    why: 'Existe confusión porque los THC pueden estar incluidos en el flete (en el B/L) o facturarse por separado por la naviera o el terminal.',
    solution: 'Los THC que forman parte del flete internacional contractual (incluidos en el B/L) SÍ se incluyen en el valor en aduana (art. 71.1.e CAU). Los gastos puramente de terminal post-llegada (almacenaje, manipulación posterior al despacho) pueden excluirse del valor en aduana, aunque podrían incluirse en la base del IVA como gastos accesorios hasta primer destino.',
    reference: 'Art. 71.1.e) CAU; Consultas vinculantes DGT',
  },
]

// ── Notas generales ─────────────────────────────────────────

export const GENERAL_NOTES = {
  insurance:
    'En la UE, solo se incluye en el valor en aduana el seguro efectivamente contratado y pagado. No se imputa un seguro ficticio. Si tu Incoterm no incluye seguro y no lo has contratado por tu cuenta, no se suma nada por seguro.',
  airFreight:
    'Para mercancías que llegan por vía aérea, no se usa el coste total del flete sino un porcentaje según el Anexo 23-01 del Reglamento de Ejecución 2015/2447, que depende del aeropuerto de origen y destino.',
  firstDestination:
    'El "primer lugar de destino" es el que figure en la carta de porte u otro documento de transporte. Si no existe indicación, es el lugar donde se produzca la primera desagregación de los bienes en el interior de la UE. Determina cuánto transporte interior se suma a la base del IVA.',
}

// ── Tabla comparativa base arancel vs base IVA ──────────────

export const DUTY_VS_VAT_COMPARISON = {
  explanation:
    'La base del arancel (A00) y la base del IVA de importación (B00) son dos importes DISTINTOS. El transporte interior, los aranceles y otros gravámenes se suman a la base del IVA pero NO al valor en aduana.',
  dutyBasis: {
    name: 'Base del arancel (A00)',
    formula: 'Valor en aduana (CIF frontera UE)',
    legalBasis: 'Arts. 70-72 Reglamento (UE) 952/2013 (CAU)',
    declaration: 'D.E. 14 03 clase A00 (antigua cas. 47 A00)',
  },
  vatBasis: {
    name: 'Base del IVA de importación (B00)',
    formula: 'Valor en aduana + aranceles + impuestos especiales + gastos accesorios hasta primer destino interior',
    legalBasis: 'Art. 83.Uno Ley 37/1992 del IVA + Arts. 85-86 Directiva 2006/112/CE',
    declaration: 'D.E. 14 03 clase B00 (antigua cas. 47 B00)',
  },
  comparison: [
    { concept: 'Precio + flete + seguro hasta frontera UE', inDutyBase: true, inVatBase: true },
    { concept: 'Aranceles', inDutyBase: false, inVatBase: true },
    { concept: 'Derechos antidumping / compensatorios', inDutyBase: false, inVatBase: true },
    { concept: 'Impuestos especiales', inDutyBase: false, inVatBase: true },
    { concept: 'Transporte frontera UE → primer destino interior', inDutyBase: false, inVatBase: true },
    { concept: 'Seguro del tramo interior hasta primer destino', inDutyBase: false, inVatBase: true },
    { concept: 'Descarga en puerto/aeropuerto UE', inDutyBase: false, inVatBase: true },
    { concept: 'Transporte posterior al primer destino', inDutyBase: false, inVatBase: false },
    { concept: 'Honorarios del agente de aduanas', inDutyBase: false, inVatBase: false },
    { concept: 'Almacenaje posterior en destino', inDutyBase: false, inVatBase: false },
  ],
}

// ── Secciones para mini-TOC ─────────────────────────────────

export const PAGE_SECTIONS = [
  { id: 'metodos', label: 'Métodos de valoración', icon: '📐' },
  { id: 'ajustes-incoterm', label: 'Ajustes por Incoterm', icon: '🔄' },
  { id: 'ajustes-obligatorios', label: 'Ajustes obligatorios', icon: '📋' },
  { id: 'base-arancel-iva', label: 'Arancel vs IVA', icon: '⚖️' },
  { id: 'dv1-casillas', label: 'DV1 y casillas H1', icon: '📝' },
  { id: 'casos-problematicos', label: 'Casos problemáticos', icon: '⚠️' },
]
