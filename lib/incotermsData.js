// ============================================================
// INCOTERMS 2020 — Datos completos (ICC oficial)
// ============================================================

// ── Etapas de la cadena logística (10 columnas, estilo ICC/TIBA) ──
// Orden: embalaje → carga → transp. interior → aduana exp. → manip. origen
//        → flete int. → manip. destino → aduana imp. → transp. destino → descarga
export const STAGE_CONFIG = [
  { key: 'packaging', label: 'Embalaje y verificación', shortLabel: 'Embalaje', icon: '📦' },
  { key: 'loading', label: 'Carga', shortLabel: 'Carga', icon: '📤' },
  { key: 'inlandOrigin', label: 'Transporte interior', shortLabel: 'Transp.', icon: '🚛' },
  { key: 'exportCustoms', label: 'Aduana exportación', shortLabel: 'Aduana exp.', icon: '📋' },
  { key: 'handlingOrigin', label: 'Manipulación origen', shortLabel: 'Manip.', icon: '🏗️' },
  { key: 'freight', label: 'Flete internacional', shortLabel: 'Flete', icon: '🚢' },
  { key: 'handlingDest', label: 'Manipulación destino', shortLabel: 'Manip.', icon: '🏗️' },
  { key: 'importCustoms', label: 'Aduana importación', shortLabel: 'Aduana imp.', icon: '🛃' },
  { key: 'inlandDest', label: 'Transporte a destino', shortLabel: 'Transp.', icon: '🚚' },
  { key: 'unloading', label: 'Descarga', shortLabel: 'Descarga', icon: '📥' },
]

export const STAGE_KEYS = STAGE_CONFIG.map((s) => s.key)

// Responsabilidades: 'S' = seller (vendedor), 'B' = buyer (comprador)
// Cada Incoterm tiene filas de COSTE y RIESGO (y opcionalmente SEGURO)

export const INCOTERMS_2020 = [
  // ── GRUPO 1: Cualquier modo de transporte (7) ──────────────
  {
    code: 'EXW',
    name: 'Ex Works',
    nameEs: 'En Fábrica',
    group: 'multimodal',
    groupLabel: 'Cualquier modo de transporte',
    responsibilities: {
      cost: ['S','B','B','B','B','B','B','B','B','B'],
      risk: ['S','B','B','B','B','B','B','B','B','B'],
    },
    riskTransferPoint: 'En las instalaciones del vendedor',
    costTransferPoint: 'En las instalaciones del vendedor',
    description:
      'El vendedor pone la mercancía a disposición del comprador en sus propias instalaciones (fábrica, almacén). El comprador asume todos los costes y riesgos desde ese momento, incluyendo la carga, el transporte, los despachos de exportación e importación, y el seguro.',
    customsImpact:
      'El valor en aduana se construye sumando al precio EXW todos los gastos hasta la frontera de la UE: transporte interior al puerto de origen, carga, flete internacional y seguro. Es el Incoterm que más ajustes requiere en la declaración aduanera (DUA). Fórmula: Valor en aduana = EXW + transporte interior + carga + flete + seguro.',
    practicalExample:
      'Compras maquinaria por 10.000 EUR EXW Shanghái. Transporte a puerto: 200 EUR. Carga al buque: 150 EUR. Flete marítimo Shanghái-Valencia: 1.800 EUR. Seguro: 120 EUR. Tu valor en aduana (base para aranceles) es: 12.270 EUR.',
    advice:
      'La ICC recomienda EXW solo para comercio nacional. En importaciones internacionales presenta problemas: el comprador extranjero debe gestionar la exportación en un país donde no tiene presencia. Considera usar FCA como alternativa más práctica.',
    keyDifference:
      'EXW vs FCA: en EXW el comprador asume incluso el despacho de exportación, algo inusual y problemático en comercio internacional.',
    sellerPerspective: 'Mínima responsabilidad. Solo preparar la mercancía en tu almacén.',
    buyerPerspective: 'Máxima responsabilidad. Controlas todo pero necesitas transitario en origen.',
    typicalDocuments: ['Factura comercial', 'Lista de empaque'],
    dispatcherAlert: {
      type: 'warning',
      text: 'Exige documentación de TODOS los gastos intermedios (carga, transporte interior, THC, flete, seguro). Sin justificantes, la aduana puede rechazar el valor y aplicar métodos secundarios (arts. 74-74 CAU).',
    },
    customsValueAdjustments: {
      addToCustomsValue: [
        { concept: 'Carga en fábrica/almacén del vendedor', mandatory: true },
        { concept: 'Transporte interior hasta punto de exportación', mandatory: true },
        { concept: 'Despacho de exportación (gastos)', mandatory: true },
        { concept: 'Manipulación en terminal de origen (THC origen)', mandatory: true },
        { concept: 'Flete internacional hasta frontera UE', mandatory: true },
        { concept: 'Seguro de transporte', mandatory: false, note: 'Solo si contratado' },
      ],
      deductFromCustomsValue: [],
      formula: 'Valor en aduana = EXW + carga + transp. interior + despacho export. + THC + flete int. + seguro',
      legalBasis: 'Art. 71.1.e) CAU',
      warning: 'Es el Incoterm que más ajustes requiere. Sin documentación de cada gasto, la aduana puede rechazar el valor.',
    },
  },
  {
    code: 'FCA',
    name: 'Free Carrier',
    nameEs: 'Franco Porteador',
    group: 'multimodal',
    groupLabel: 'Cualquier modo de transporte',
    responsibilities: {
      cost: ['S','S','S','S','B','B','B','B','B','B'],
      risk: ['S','S','S','S','B','B','B','B','B','B'],
    },
    riskTransferPoint: 'Al entregar la mercancía al porteador designado por el comprador',
    costTransferPoint: 'En el lugar de entrega acordado (instalaciones del vendedor u otro punto)',
    description:
      'El vendedor entrega la mercancía al porteador (transportista) designado por el comprador, en el lugar acordado. Si la entrega es en las instalaciones del vendedor, este carga la mercancía. Si es en otro lugar, el vendedor la entrega sin descargar de su vehículo. El vendedor despacha la exportación.',
    customsImpact:
      'El valor en aduana parte del precio FCA y se le suman los costes de flete internacional y seguro hasta la frontera UE. Fórmula: Valor en aduana = FCA + flete internacional + seguro. Si el punto FCA ya es un puerto de salida, solo falta sumar el flete marítimo/aéreo y seguro.',
    practicalExample:
      'Compras textil por 5.000 EUR FCA puerto de Shanghái. Flete marítimo Shanghái-Barcelona: 1.200 EUR. Seguro: 80 EUR. Valor en aduana: 6.280 EUR.',
    advice:
      'FCA es el Incoterm más versátil y el recomendado por la ICC como alternativa a EXW para exportaciones y a FOB para contenedores. Novedad 2020: el comprador puede instruir a su transportista para emitir un conocimiento de embarque (BL) con anotación "on board" al vendedor, útil para cartas de crédito.',
    keyDifference:
      'FCA vs FOB: FCA es multimodal y el riesgo pasa al entregar al porteador; FOB es solo marítimo y el riesgo pasa al cruzar la borda del buque.',
    sellerPerspective: 'Responsabilidad moderada: despachas exportación y entregas al transportista.',
    buyerPerspective: 'Controlas el transporte principal y el seguro. Necesitas transitario en destino.',
    typicalDocuments: ['Factura comercial', 'Lista de empaque', 'Documento de transporte', 'Despacho de exportación'],
    dispatcherAlert: {
      type: 'success',
      text: 'Incoterm recomendado por la ICC para contenedores. La fórmula de ajuste es sencilla: precio FCA + flete + seguro.',
    },
    customsValueAdjustments: {
      addToCustomsValue: [
        { concept: 'Flete internacional hasta frontera UE', mandatory: true },
        { concept: 'Seguro de transporte', mandatory: false, note: 'Solo si contratado' },
      ],
      deductFromCustomsValue: [],
      formula: 'Valor en aduana = FCA + flete internacional + seguro',
      legalBasis: 'Art. 71.1.e) CAU',
    },
  },
  {
    code: 'CPT',
    name: 'Carriage Paid To',
    nameEs: 'Transporte Pagado Hasta',
    group: 'multimodal',
    groupLabel: 'Cualquier modo de transporte',
    responsibilities: {
      cost: ['S','S','S','S','S','S','B','B','B','B'],
      risk: ['S','S','B','B','B','B','B','B','B','B'],
    },
    riskTransferPoint: 'Al entregar la mercancía al primer porteador',
    costTransferPoint: 'En el lugar de destino acordado',
    description:
      'El vendedor contrata y paga el transporte hasta el lugar de destino acordado, pero el riesgo se transfiere al comprador cuando la mercancía se entrega al primer porteador. Hay dos puntos distintos: el de transferencia de riesgo (entrega al porteador) y el de transferencia de costes (destino).',
    customsImpact:
      'El precio CPT ya incluye el flete hasta destino. Si el destino acordado está dentro de la UE, puede haber que deducir los costes de transporte post-frontera. Si el destino es el puerto/aeropuerto de entrada a la UE, el precio CPT es prácticamente el valor en aduana (solo falta incluir seguro si lo hay). Fórmula: Valor en aduana = CPT + seguro - transporte post-frontera UE (si aplica).',
    practicalExample:
      'Compras componentes electrónicos por 20.000 EUR CPT Madrid. El flete desde Shenzhen al puerto de Valencia cuesta 2.500 EUR (incluido en el precio). El transporte Valencia-Madrid cuesta 300 EUR (también incluido). Valor en aduana = 20.000 + seguro (si lo hay) - 300 EUR (transporte interno UE) = 19.700 EUR + seguro.',
    advice:
      'CPT es ideal cuando el vendedor tiene mejores condiciones de flete que el comprador. Atención: el riesgo se transfiere al primer porteador, no en destino. Si la mercancía se daña durante el transporte, es problema del comprador aunque el vendedor haya pagado el flete.',
    keyDifference:
      'CPT vs CIP: la única diferencia es que CIP obliga al vendedor a contratar seguro con cobertura máxima (ICC-A). En CPT el seguro es responsabilidad del comprador.',
    sellerPerspective: 'Contratas y pagas el flete. Tu riesgo termina al entregar al primer transportista.',
    buyerPerspective: 'El flete está incluido pero el riesgo es tuyo desde el embarque. Contrata seguro.',
    typicalDocuments: ['Factura comercial', 'Lista de empaque', 'Documento de transporte', 'Despacho de exportación'],
    dispatcherAlert: {
      type: 'warning',
      text: 'Si el destino es interior de la UE, el transporte post-frontera debe prorratearse proporcionalmente (art. 138 Reg. 2015/2447). Solicita al transportista factura con desglose por tramos.',
    },
    customsValueAdjustments: {
      addToCustomsValue: [
        { concept: 'Seguro de transporte', mandatory: false, note: 'Solo si contratado' },
      ],
      deductFromCustomsValue: [
        { concept: 'Transporte desde frontera UE hasta destino interior', mandatory: true, condition: 'Solo si el destino CPT es un punto interior de la UE (ej: CPT Madrid). Si es un punto en frontera UE, no hay deducción.', note: 'Requiere documentación separada del tramo post-frontera (art. 138 Reg. 2015/2447)' },
      ],
      formula: 'Valor en aduana = CPT + seguro − transporte post-frontera UE (si aplica)',
      legalBasis: 'Art. 71.1.e) y 72.a) CAU; Art. 138 Reg. Ejecución 2015/2447',
    },
  },
  {
    code: 'CIP',
    name: 'Carriage and Insurance Paid To',
    nameEs: 'Transporte y Seguro Pagados Hasta',
    group: 'multimodal',
    groupLabel: 'Cualquier modo de transporte',
    responsibilities: {
      cost: ['S','S','S','S','S','S','B','B','B','B'],
      risk: ['S','S','B','B','B','B','B','B','B','B'],
    },
    hasInsuranceRow: true,
    insuranceRow: ['S','S','S','S','S','S','B','B','B','B'],
    riskTransferPoint: 'Al entregar la mercancía al primer porteador',
    costTransferPoint: 'En el lugar de destino acordado',
    description:
      'Igual que CPT, pero además el vendedor debe contratar un seguro de transporte a favor del comprador. Desde Incoterms 2020, el seguro obligatorio es de cobertura máxima (cláusulas ICC-A del Instituto de Aseguradores de Londres), la más completa del mercado.',
    customsImpact:
      'El precio CIP incluye flete y seguro. Si el destino acordado es la frontera UE o el puerto de entrada, el precio CIP es muy cercano al valor en aduana. Si el destino es un punto interior de la UE, hay que deducir costes post-frontera. Fórmula: Valor en aduana = CIP - transporte y seguro post-frontera UE (si aplica).',
    practicalExample:
      'Compras maquinaria por 50.000 EUR CIP Barcelona (puerto). El precio ya incluye flete y seguro ICC-A desde origen. El valor en aduana es prácticamente 50.000 EUR, al coincidir el destino con el punto de entrada a la UE.',
    advice:
      'Cambio clave en Incoterms 2020: CIP ahora exige seguro ICC-A (cobertura máxima contra todo riesgo), mientras que CIF solo exige ICC-C (cobertura mínima). Esto hace que CIP sea más protector para el comprador que CIF.',
    keyDifference:
      'CIP vs CIF: CIP es multimodal y exige seguro ICC-A (máximo). CIF es solo marítimo y exige seguro ICC-C (mínimo).',
    sellerPerspective: 'Contratas flete y seguro ICC-A. Tu riesgo termina al entregar al primer porteador.',
    buyerPerspective: 'Flete y seguro incluidos. Recibes cobertura máxima. Solo gestionas la importación.',
    typicalDocuments: ['Factura comercial', 'Lista de empaque', 'Documento de transporte', 'Póliza de seguro ICC-A', 'Despacho de exportación'],
    dispatcherAlert: {
      type: 'warning',
      text: 'Si el destino es interior de la UE, tanto el transporte como el seguro post-frontera deben prorratearse y deducirse (art. 138 Reg. 2015/2447). Solicita al transportista factura con desglose por tramos.',
    },
    customsValueAdjustments: {
      addToCustomsValue: [],
      deductFromCustomsValue: [
        { concept: 'Transporte desde frontera UE hasta destino interior', mandatory: true, condition: 'Solo si el destino CIP es interior de la UE' },
        { concept: 'Seguro del tramo post-frontera UE', mandatory: true, condition: 'Solo si el destino CIP es interior de la UE' },
      ],
      formula: 'Valor en aduana = CIP − transporte post-frontera − seguro post-frontera (si destino interior UE)',
      legalBasis: 'Art. 72.a) CAU',
      note: 'Si el destino CIP coincide con el punto de entrada en la UE, el precio coincide con el valor en aduana sin ajustes.',
    },
  },
  {
    code: 'DAP',
    name: 'Delivered At Place',
    nameEs: 'Entregada en Lugar',
    group: 'multimodal',
    groupLabel: 'Cualquier modo de transporte',
    responsibilities: {
      cost: ['S','S','S','S','S','S','S','B','S','B'],
      risk: ['S','S','S','S','S','S','S','B','S','B'],
    },
    riskTransferPoint: 'En el lugar de destino acordado, sobre el medio de transporte, lista para descarga',
    costTransferPoint: 'En el lugar de destino acordado, sin descargar',
    description:
      'El vendedor entrega la mercancía en el lugar de destino acordado, puesta a disposición del comprador sobre el medio de transporte de llegada, lista para la descarga. El vendedor asume todos los riesgos y costes hasta ese punto, excepto el despacho de importación.',
    customsImpact:
      'El precio DAP incluye todos los costes de transporte hasta destino pero no incluye aranceles ni IVA de importación. Si el destino es un punto dentro de la UE, hay que deducir del precio DAP los costes de transporte post-frontera para obtener el valor en aduana. Fórmula: Valor en aduana = DAP - transporte post-frontera UE - descarga (si incluida).',
    practicalExample:
      'Compras mobiliario por 15.000 EUR DAP tu almacén en Madrid. El transporte desde el puerto de Valencia a Madrid cuesta 400 EUR (incluido en el precio). Valor en aduana = 15.000 - 400 = 14.600 EUR.',
    advice:
      'DAP es muy cómodo para el comprador: recibe la mercancía en su puerta y solo se preocupa de la importación. Pero ojo: si el vendedor extranjero no conoce bien las condiciones del destino, pueden surgir problemas logísticos. El vendedor no descarga la mercancía.',
    keyDifference:
      'DAP vs DPU: en DAP la mercancía se entrega sin descargar. En DPU el vendedor también descarga la mercancía en destino.',
    sellerPerspective: 'Alta responsabilidad: entregas en destino sin descargar. No gestionas la importación.',
    buyerPerspective: 'Muy cómodo: solo descargas y despachas importación. El vendedor lleva todo hasta tu puerta.',
    typicalDocuments: ['Factura comercial', 'Lista de empaque', 'Documento de transporte', 'Despacho de exportación'],
    dispatcherAlert: {
      type: 'warning',
      text: 'Debes documentar el transporte post-frontera con factura separada del transportista. Sin esa factura, no puedes deducirlo del valor en aduana y pagarás aranceles de más.',
    },
    customsValueAdjustments: {
      addToCustomsValue: [],
      deductFromCustomsValue: [
        { concept: 'Transporte desde frontera UE hasta lugar de destino', mandatory: true },
        { concept: 'Manipulación/almacenaje post-frontera', mandatory: true, condition: 'Si está incluido en el precio' },
      ],
      formula: 'Valor en aduana = DAP − transporte post-frontera − manipulación post-frontera',
      legalBasis: 'Art. 72.a) CAU',
      warning: 'Los gastos deducibles DEBEN estar documentados con facturas separadas del transportista. Sin documentación, la aduana no aceptará la deducción.',
    },
  },
  {
    code: 'DPU',
    name: 'Delivered at Place Unloaded',
    nameEs: 'Entregada en Lugar Descargada',
    group: 'multimodal',
    groupLabel: 'Cualquier modo de transporte',
    responsibilities: {
      cost: ['S','S','S','S','S','S','S','B','S','S'],
      risk: ['S','S','S','S','S','S','S','B','S','S'],
    },
    riskTransferPoint: 'En el lugar de destino acordado, una vez descargada la mercancía',
    costTransferPoint: 'En el lugar de destino acordado, incluyendo la descarga',
    description:
      'El vendedor entrega la mercancía descargada del medio de transporte en el lugar de destino acordado. Es el único Incoterm donde el vendedor asume la responsabilidad de descargar. Antes se llamaba DAT (Delivered at Terminal) en Incoterms 2010, pero en 2020 se amplió a cualquier lugar, no solo terminales.',
    customsImpact:
      'Similar a DAP. El precio DPU incluye transporte y descarga hasta destino. Para el valor en aduana, deducir costes post-frontera UE. Fórmula: Valor en aduana = DPU - transporte post-frontera UE - descarga post-frontera.',
    practicalExample:
      'Compras materias primas por 8.000 EUR DPU terminal de contenedores de Valencia. Como la terminal es el punto de entrada a la UE, el valor en aduana es prácticamente 8.000 EUR (solo se deduciría el coste de descarga en la terminal si se desglosa).',
    advice:
      'Cambio clave en Incoterms 2020: DAT pasó a llamarse DPU para ampliar el lugar de entrega. Ya no se limita a terminales portuarias o aeroportuarias — puede ser un almacén, una fábrica o cualquier punto acordado. El vendedor debe asegurarse de tener capacidad para descargar en destino.',
    keyDifference:
      'DPU vs DAP: DPU es el único Incoterm donde el vendedor descarga la mercancía. En todos los demás (incluido DAP), la descarga es responsabilidad del comprador.',
    sellerPerspective: 'Máxima responsabilidad logística: entregas descargado en destino. Necesitas capacidad de descarga.',
    buyerPerspective: 'Muy cómodo: recibes la mercancía descargada. Solo despachas importación y pagas aranceles.',
    typicalDocuments: ['Factura comercial', 'Lista de empaque', 'Documento de transporte', 'Despacho de exportación', 'Comprobante de descarga'],
    dispatcherAlert: {
      type: 'info',
      text: 'Si el lugar DPU es la terminal de entrada en la UE (ej: DPU Terminal Algeciras), el precio puede coincidir con el valor en aduana. Si es un punto interior, aplica las mismas deducciones que DAP más la descarga.',
    },
    customsValueAdjustments: {
      addToCustomsValue: [],
      deductFromCustomsValue: [
        { concept: 'Transporte desde frontera UE hasta lugar de destino', mandatory: true },
        { concept: 'Descarga en destino', mandatory: true },
        { concept: 'Manipulación post-frontera', mandatory: true, condition: 'Si está incluido en el precio' },
      ],
      formula: 'Valor en aduana = DPU − transporte post-frontera − descarga − manipulación',
      legalBasis: 'Art. 72.a) CAU',
      note: 'Si el lugar DPU es la propia terminal de entrada en la UE (ej: DPU Terminal Algeciras), el precio puede coincidir con el valor en aduana.',
    },
  },
  {
    code: 'DDP',
    name: 'Delivered Duty Paid',
    nameEs: 'Entregada con Derechos Pagados',
    group: 'multimodal',
    groupLabel: 'Cualquier modo de transporte',
    responsibilities: {
      cost: ['S','S','S','S','S','S','S','S','S','B'],
      risk: ['S','S','S','S','S','S','S','S','S','B'],
    },
    riskTransferPoint: 'En el lugar de destino acordado, sobre el medio de transporte, lista para descarga',
    costTransferPoint: 'En el lugar de destino acordado, incluyendo aranceles e impuestos de importación',
    description:
      'El vendedor asume la máxima responsabilidad: entrega la mercancía en destino con todos los costes pagados, incluyendo el despacho de importación, los aranceles y los impuestos (excepto IVA en algunos casos). Es el opuesto completo de EXW.',
    customsImpact:
      'El precio DDP ya incluye aranceles e impuestos. Para obtener el valor en aduana hay que deducir los aranceles, impuestos de importación, y costes post-frontera UE incluidos en el precio. Es el Incoterm donde la reconstrucción del valor en aduana es más compleja. Fórmula: Valor en aduana = DDP - aranceles - impuestos importación - transporte post-frontera.',
    practicalExample:
      'Compras electrónica por 25.000 EUR DDP tu almacén en Madrid. El precio incluye: producto (18.000), flete (3.000), seguro (200), aranceles (2.800), IVA importación (no incluido normalmente). Valor en aduana = 25.000 - 2.800 (aranceles) - transporte interno UE.',
    advice:
      'La ICC advierte que DDP puede ser problemático si el vendedor extranjero no puede registrarse a efectos fiscales en el país de destino ni recuperar el IVA a la importación. Es más común en comercio intracomunitario o cuando el vendedor tiene filial en destino.',
    keyDifference:
      'DDP vs DAP: DDP incluye el despacho de importación y el pago de aranceles. En DAP, la importación y aranceles son responsabilidad del comprador.',
    sellerPerspective: 'Máxima responsabilidad total. Gestionas todo incluyendo importación y aranceles en destino.',
    buyerPerspective: 'Mínima responsabilidad. Solo recibes la mercancía. Precio "todo incluido".',
    typicalDocuments: ['Factura comercial', 'Lista de empaque', 'Documento de transporte', 'Despacho de exportación', 'Despacho de importación', 'DUA', 'Póliza de seguro'],
    dispatcherAlert: {
      type: 'critical',
      text: 'ATENCIÓN: Exige SIEMPRE al proveedor un desglose detallado de la factura. Si la factura DDP no separa aranceles, IVA y transporte, se produce doble tributación (aranceles sobre aranceles). Es el error más frecuente en despachos DDP.',
    },
    customsValueAdjustments: {
      addToCustomsValue: [],
      deductFromCustomsValue: [
        { concept: 'Aranceles de importación', mandatory: true },
        { concept: 'IVA de importación', mandatory: true },
        { concept: 'Transporte desde frontera UE hasta destino', mandatory: true },
        { concept: 'Descarga en destino', mandatory: true, condition: 'Si incluido' },
        { concept: 'Honorarios agente de aduanas', mandatory: true, condition: 'Si incluidos en el precio DDP' },
        { concept: 'Almacenaje en destino', mandatory: false },
      ],
      formula: 'Valor en aduana = DDP − aranceles − IVA − transporte post-frontera − descarga − despacho import.',
      legalBasis: 'Art. 72 CAU',
      warning: 'PROBLEMA MUY FRECUENTE: Muchos proveedores emiten facturas DDP sin desglosar los conceptos. Si se declara el total como valor en aduana, se produce doble tributación (aranceles sobre aranceles). SIEMPRE exigir desglose detallado.',
    },
  },

  // ── GRUPO 2: Solo transporte marítimo (4) ──────────────────
  {
    code: 'FAS',
    name: 'Free Alongside Ship',
    nameEs: 'Franco al Costado del Buque',
    group: 'maritimo',
    groupLabel: 'Solo transporte marítimo y vías navegables interiores',
    responsibilities: {
      cost: ['S','S','S','S','B','B','B','B','B','B'],
      risk: ['S','S','S','S','B','B','B','B','B','B'],
    },
    riskTransferPoint: 'Al costado del buque en el puerto de embarque convenido',
    costTransferPoint: 'Al costado del buque en el puerto de embarque convenido',
    description:
      'El vendedor entrega la mercancía al costado del buque (en el muelle o en barcazas) en el puerto de embarque convenido. A partir de ese momento, el comprador asume todos los costes y riesgos, incluyendo la carga a bordo del buque.',
    customsImpact:
      'El valor en aduana se construye sumando al precio FAS los costes de carga al buque, flete marítimo y seguro hasta la frontera UE. Fórmula: Valor en aduana = FAS + carga al buque + flete marítimo + seguro.',
    practicalExample:
      'Compras grano a granel por 30.000 EUR FAS puerto de Buenos Aires. Carga al buque: 500 EUR. Flete Buenos Aires-Algeciras: 2.800 EUR. Seguro: 180 EUR. Valor en aduana: 33.480 EUR.',
    advice:
      'FAS se usa principalmente para mercancías a granel (cereales, minerales, carbón) o carga pesada que se carga con grúas del puerto. No es adecuado para mercancía en contenedores — usa FCA en su lugar.',
    keyDifference:
      'FAS vs FOB: en FAS la mercancía se entrega al costado del buque (en el muelle). En FOB se entrega a bordo del buque (cargada). La carga es responsabilidad del comprador en FAS y del vendedor en FOB.',
    sellerPerspective: 'Llevas la mercancía al puerto y la dejas al costado del buque. No la cargas.',
    buyerPerspective: 'Asumes la carga al buque, el flete y el seguro. Control total del transporte marítimo.',
    typicalDocuments: ['Factura comercial', 'Lista de empaque', 'Despacho de exportación', 'Recibo de muelle'],
    dispatcherAlert: {
      type: 'info',
      text: 'Poco frecuente en la práctica. Se usa para graneles (cereales, minerales). Recuerda incluir la estiba (carga a bordo) en los ajustes al valor en aduana.',
    },
    customsValueAdjustments: {
      addToCustomsValue: [
        { concept: 'Carga a bordo (estiba)', mandatory: true },
        { concept: 'Flete marítimo hasta primer puerto UE', mandatory: true },
        { concept: 'Seguro de transporte', mandatory: false, note: 'Solo si contratado' },
      ],
      deductFromCustomsValue: [],
      formula: 'Valor en aduana = FAS + estiba + flete marítimo + seguro',
      legalBasis: 'Art. 71.1.e) CAU',
    },
  },
  {
    code: 'FOB',
    name: 'Free On Board',
    nameEs: 'Franco a Bordo',
    group: 'maritimo',
    groupLabel: 'Solo transporte marítimo y vías navegables interiores',
    responsibilities: {
      cost: ['S','S','S','S','S','B','B','B','B','B'],
      risk: ['S','S','S','S','S','B','B','B','B','B'],
    },
    riskTransferPoint: 'A bordo del buque en el puerto de embarque convenido',
    costTransferPoint: 'A bordo del buque en el puerto de embarque convenido',
    description:
      'El vendedor entrega la mercancía cargada a bordo del buque designado por el comprador en el puerto de embarque convenido. El riesgo se transfiere cuando la mercancía está a bordo. Es el Incoterm más utilizado en comercio marítimo internacional.',
    customsImpact:
      'El valor en aduana se calcula sumando al precio FOB el flete marítimo y el seguro hasta la frontera UE. Es una base muy común en declaraciones aduaneras. Fórmula: Valor en aduana = FOB + flete marítimo + seguro.',
    practicalExample:
      'Compras calzado por 12.000 EUR FOB Ho Chi Minh. Flete marítimo a Valencia: 2.200 EUR. Seguro: 140 EUR. Valor en aduana: 14.340 EUR. Si el arancel es del 8%, pagas 1.147 EUR de derechos.',
    advice:
      'FOB es el Incoterm más popular del mundo pero la ICC advierte que no debe usarse para contenedores, ya que la mercancía se entrega al transportista antes de ser cargada al buque. Para contenedores, FCA es técnicamente más apropiado, aunque FOB sigue siendo la práctica habitual.',
    keyDifference:
      'FOB vs CFR: en ambos el vendedor carga la mercancía a bordo. La diferencia es que en CFR el vendedor también paga el flete marítimo hasta destino.',
    sellerPerspective: 'Llevas la mercancía al puerto, la cargas al buque y despachas exportación. Ahí termina tu riesgo.',
    buyerPerspective: 'Contratas el flete y el seguro. Precio claro para comparar con otros proveedores.',
    typicalDocuments: ['Factura comercial', 'Lista de empaque', 'Conocimiento de embarque (BL)', 'Despacho de exportación'],
    dispatcherAlert: {
      type: 'warning',
      text: 'La ICC desaconseja FOB para contenedores. El riesgo pasa a bordo del buque, pero el contenedor se entrega en terminal días antes. Considerar FCA como alternativa técnicamente más correcta.',
    },
    customsValueAdjustments: {
      addToCustomsValue: [
        { concept: 'Flete marítimo hasta primer puerto UE', mandatory: true },
        { concept: 'Seguro de transporte', mandatory: false, note: 'Solo si contratado' },
      ],
      deductFromCustomsValue: [],
      formula: 'Valor en aduana = FOB + flete marítimo + seguro',
      legalBasis: 'Art. 71.1.e) CAU',
      note: 'Es el Incoterm históricamente más utilizado. La fórmula FOB + flete + seguro = CIF es la referencia clásica del valor en aduana.',
    },
  },
  {
    code: 'CFR',
    name: 'Cost and Freight',
    nameEs: 'Coste y Flete',
    group: 'maritimo',
    groupLabel: 'Solo transporte marítimo y vías navegables interiores',
    responsibilities: {
      cost: ['S','S','S','S','S','S','B','B','B','B'],
      risk: ['S','S','S','S','S','B','B','B','B','B'],
    },
    riskTransferPoint: 'A bordo del buque en el puerto de embarque',
    costTransferPoint: 'En el puerto de destino convenido',
    description:
      'El vendedor entrega la mercancía a bordo del buque y contrata y paga el flete marítimo hasta el puerto de destino. Sin embargo, el riesgo se transfiere al comprador cuando la mercancía está a bordo en el puerto de origen. Como en CPT, hay dos puntos distintos: riesgo y coste.',
    customsImpact:
      'El precio CFR incluye el coste de la mercancía y el flete marítimo. Solo falta añadir el seguro para obtener el valor en aduana (base CIF). Fórmula: Valor en aduana = CFR + seguro. Es uno de los Incoterms más sencillos para calcular el valor en aduana.',
    practicalExample:
      'Compras acero por 40.000 EUR CFR puerto de Barcelona. El precio ya incluye el flete marítimo. Solo falta el seguro (450 EUR) para obtener el valor en aduana: 40.450 EUR.',
    advice:
      'CFR tiene el mismo riesgo que FOB para el comprador (se transfiere al cargar a bordo) pero el vendedor paga el flete. Esto puede ser ventajoso si el vendedor tiene mejores tarifas de flete. No incluye seguro — contrátalo como comprador.',
    keyDifference:
      'CFR vs CIF: la única diferencia es que CIF incluye seguro marítimo (cobertura mínima ICC-C) pagado por el vendedor. En CFR, el seguro es responsabilidad del comprador.',
    sellerPerspective: 'Cargas a bordo y pagas el flete marítimo. Tu riesgo termina al embarcar.',
    buyerPerspective: 'El flete está pagado pero el riesgo es tuyo desde el embarque. Contrata seguro obligatoriamente.',
    typicalDocuments: ['Factura comercial', 'Lista de empaque', 'Conocimiento de embarque (BL)', 'Despacho de exportación'],
    dispatcherAlert: {
      type: 'info',
      text: 'El ajuste al valor en aduana es mínimo: solo hay que sumar el seguro (si se contrató). Si no hay seguro, el precio CFR es prácticamente el valor en aduana cuando el puerto de destino es frontera UE.',
    },
    customsValueAdjustments: {
      addToCustomsValue: [
        { concept: 'Seguro de transporte', mandatory: false, note: 'Solo si contratado. CFR no obliga a contratar seguro.' },
      ],
      deductFromCustomsValue: [],
      formula: 'Valor en aduana = CFR + seguro (si contratado)',
      legalBasis: 'Art. 71.1.e) CAU',
    },
  },
  {
    code: 'CIF',
    name: 'Cost, Insurance and Freight',
    nameEs: 'Coste, Seguro y Flete',
    group: 'maritimo',
    groupLabel: 'Solo transporte marítimo y vías navegables interiores',
    responsibilities: {
      cost: ['S','S','S','S','S','S','B','B','B','B'],
      risk: ['S','S','S','S','S','B','B','B','B','B'],
    },
    hasInsuranceRow: true,
    insuranceRow: ['S','S','S','S','S','S','B','B','B','B'],
    riskTransferPoint: 'A bordo del buque en el puerto de embarque',
    costTransferPoint: 'En el puerto de destino convenido (incluyendo seguro)',
    description:
      'El vendedor entrega la mercancía a bordo del buque, contrata y paga el flete marítimo y además contrata un seguro de transporte marítimo a favor del comprador. El seguro obligatorio en CIF es de cobertura mínima (cláusulas ICC-C). El riesgo se transfiere al comprador cuando la mercancía está a bordo en origen.',
    customsImpact:
      'CIF es la base directa del valor en aduana en la UE. El precio CIF puerto de entrada UE = valor en aduana. Si el puerto CIF es el de entrada a la UE, no hay ajustes. Si es un puerto no-UE, hay que recalcular. Fórmula: Valor en aduana = precio CIF (en frontera UE). Es el Incoterm de referencia para aduanas.',
    practicalExample:
      'Compras producto cerámico por 18.000 EUR CIF Valencia. Como Valencia es tu puerto de entrada a la UE, el valor en aduana es exactamente 18.000 EUR. Si el arancel es del 6,5%, pagas 1.170 EUR de derechos de importación.',
    advice:
      'CIF es la referencia de las aduanas europeas para valorar importaciones. Aunque el precio incluye seguro, la cobertura ICC-C es mínima (no cubre riesgos como robo, mojadura o rotura). Si la mercancía es valiosa, negocia ampliar la cobertura o contrata seguro adicional.',
    keyDifference:
      'CIF vs CIP: CIF es solo marítimo con seguro mínimo (ICC-C). CIP es multimodal con seguro máximo (ICC-A). Para el comprador, CIP ofrece más protección.',
    sellerPerspective: 'Pagas flete y seguro mínimo. Tu riesgo termina al embarcar. Obligaciones claras y bien conocidas.',
    buyerPerspective: 'Precio incluye flete y seguro básico. Es la base directa para tus aranceles (valor en aduana = CIF).',
    typicalDocuments: ['Factura comercial', 'Lista de empaque', 'Conocimiento de embarque (BL)', 'Póliza de seguro ICC-C', 'Despacho de exportación'],
    dispatcherAlert: {
      type: 'success',
      text: 'Incoterm de referencia aduanera. Si el puerto de destino es el primer puerto UE, el precio facturado = valor en aduana. Sin ajustes en casilla 14 07 / cas. 45.',
    },
    customsValueAdjustments: {
      addToCustomsValue: [],
      deductFromCustomsValue: [],
      formula: 'Valor en aduana = Precio CIF (sin ajustes si el puerto de destino es el punto de entrada UE)',
      legalBasis: 'Art. 70 CAU',
      note: 'El Incoterm de referencia para aduanas. Cuando el puerto de destino está en la UE, el precio facturado ES el valor en aduana.',
    },
  },
]

// ── Constantes globales ──────────────────────────────────────

export const DUA_H1_FIELDS = [
  { concept: 'Precio de factura', dua: 'Cas. 42', h1: 'D.E. 14 01', description: 'Importe según factura, sin ajustes' },
  { concept: 'Ajustes al valor', dua: 'Cas. 45', h1: 'D.E. 14 07', description: '+ adiciones / − deducciones para llegar al valor en aduana' },
  { concept: 'Valor estadístico', dua: 'Cas. 46', h1: 'D.E. 14 06', description: 'Valor CIF en EUR en frontera española' },
  { concept: 'Incoterm', dua: 'Cas. 20', h1: 'D.E. 14 11', description: 'Código Incoterm + lugar (ej: "CIF Valencia")' },
  { concept: 'Método valoración', dua: 'Cas. 43', h1: 'D.E. 14 16', description: 'Método 1 (transacción) a 6 (último recurso)' },
  { concept: 'Liquidación tributos', dua: 'Cas. 47', h1: 'D.E. 14 03', description: 'A00 = arancel, B00 = IVA, otros' },
  { concept: 'Base imponible', dua: 'Cas. 47', h1: 'D.E. 14 04', description: 'Base de cálculo de cada tributo' },
  { concept: 'Tipo de cambio', dua: 'Cas. 23', h1: 'D.E. 14 05', description: 'Tipo BCE a fecha de admisión' },
  { concept: 'País origen', dua: 'Cas. 34a', h1: 'D.E. 16 06', description: 'Origen no preferencial (erga omnes)' },
  { concept: 'País origen preferencial', dua: 'Cas. 34a', h1: 'D.E. 16 03', description: 'Origen con acuerdo comercial' },
  { concept: 'Masa neta', dua: 'Cas. 38', h1: 'D.E. 18 01', description: 'Peso en kg (base para derechos específicos)' },
  { concept: 'Código mercancía', dua: 'Cas. 33', h1: 'D.E. 18 09', description: '10 dígitos TARIC' },
]

export const VAT_BASE_IMPACT = {
  explanation: 'La base del IVA = valor en aduana + aranceles + gastos accesorios hasta primer destino interior. El transporte Barcelona→Madrid se incluye en la base del IVA pero NO en el valor en aduana.',
  formula: 'Base IVA = Valor en aduana + Arancel + Transporte hasta primer destino interior + Seguro interior',
  legalBasis: 'Art. 83.Uno Ley 37/1992 del IVA',
  comparison: [
    { concept: 'Precio de compra + flete + seguro hasta frontera UE', inDutyBase: true, inVatBase: true },
    { concept: 'Aranceles', inDutyBase: false, inVatBase: true },
    { concept: 'Derechos antidumping / compensatorios', inDutyBase: false, inVatBase: true },
    { concept: 'Impuestos especiales', inDutyBase: false, inVatBase: true },
    { concept: 'Transporte frontera UE → primer destino interior', inDutyBase: false, inVatBase: true },
    { concept: 'Seguro del tramo interior', inDutyBase: false, inVatBase: true },
    { concept: 'Descarga en puerto UE', inDutyBase: false, inVatBase: true },
    { concept: 'Transporte posterior al primer destino', inDutyBase: false, inVatBase: false },
    { concept: 'Honorarios agente de aduanas', inDutyBase: false, inVatBase: false },
  ],
}

export const CAU_ADJUSTMENTS = {
  alwaysAdd: [
    { concept: 'Comisiones de venta y corretaje', note: 'Se suman siempre (excepto comisiones de compra, que NO se suman)', article: 'Art. 71.1.a) CAU' },
    { concept: 'Envases y embalaje', note: 'Coste de envases + mano de obra de embalaje', article: 'Art. 71.1.b) CAU' },
    { concept: 'Prestaciones del comprador (assists)', note: 'Materiales, moldes, matrices, herramientas, diseño/ingeniería suministrados por el comprador al fabricante para la producción', article: 'Art. 71.1.b) CAU' },
    { concept: 'Cánones y royalties', note: 'Si son condición de la venta (basta con que las mercancías no puedan adquirirse sin el pago del canon)', article: 'Art. 71.1.c) CAU' },
    { concept: 'Producto de la reventa', note: 'Parte del beneficio posterior que revierta al vendedor', article: 'Art. 71.1.d) CAU' },
  ],
  neverInclude: [
    { concept: 'Transporte posterior a la entrada en la UE', article: 'Art. 72.a) CAU' },
    { concept: 'Instalación, montaje o mantenimiento post-importación', article: 'Art. 72.b) CAU' },
    { concept: 'Intereses de financiación', note: 'Si documentados y separados del precio', article: 'Art. 72.c) CAU' },
    { concept: 'Comisiones de compra', article: 'Art. 72.d) CAU' },
    { concept: 'Derechos de importación y otros gravámenes UE', article: 'Art. 72.e) CAU' },
    { concept: 'Derechos de reproducción en la UE', article: 'Art. 72.f) CAU' },
  ],
}

// ── Helpers ──────────────────────────────────────────────────

// Compatibilidad — los labels se derivan ahora de STAGE_CONFIG
export const RESPONSIBILITY_LABELS = Object.fromEntries(
  STAGE_CONFIG.map((s) => [s.key, s.shortLabel])
)

export const RESPONSIBILITY_KEYS = STAGE_KEYS

export function getMultimodal() {
  return INCOTERMS_2020.filter((i) => i.group === 'multimodal')
}

export function getMaritimo() {
  return INCOTERMS_2020.filter((i) => i.group === 'maritimo')
}
