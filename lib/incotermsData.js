// ============================================================
// INCOTERMS 2020 — Datos completos (ICC oficial)
// ============================================================

export const INCOTERMS_2020 = [
  // ── GRUPO 1: Cualquier modo de transporte (7) ──────────────
  {
    code: 'EXW',
    name: 'Ex Works',
    nameEs: 'En Fábrica',
    group: 'multimodal',
    groupLabel: 'Cualquier modo de transporte',
    responsibilities: {
      packaging: 'seller',
      loading: 'buyer',
      inlandTransport: 'buyer',
      exportClearance: 'buyer',
      mainCarriage: 'buyer',
      insurance: 'buyer',
      importClearance: 'buyer',
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
  },
  {
    code: 'FCA',
    name: 'Free Carrier',
    nameEs: 'Franco Porteador',
    group: 'multimodal',
    groupLabel: 'Cualquier modo de transporte',
    responsibilities: {
      packaging: 'seller',
      loading: 'shared',
      inlandTransport: 'shared',
      exportClearance: 'seller',
      mainCarriage: 'buyer',
      insurance: 'buyer',
      importClearance: 'buyer',
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
  },
  {
    code: 'CPT',
    name: 'Carriage Paid To',
    nameEs: 'Transporte Pagado Hasta',
    group: 'multimodal',
    groupLabel: 'Cualquier modo de transporte',
    responsibilities: {
      packaging: 'seller',
      loading: 'seller',
      inlandTransport: 'seller',
      exportClearance: 'seller',
      mainCarriage: 'seller',
      insurance: 'buyer',
      importClearance: 'buyer',
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
  },
  {
    code: 'CIP',
    name: 'Carriage and Insurance Paid To',
    nameEs: 'Transporte y Seguro Pagados Hasta',
    group: 'multimodal',
    groupLabel: 'Cualquier modo de transporte',
    responsibilities: {
      packaging: 'seller',
      loading: 'seller',
      inlandTransport: 'seller',
      exportClearance: 'seller',
      mainCarriage: 'seller',
      insurance: 'seller',
      importClearance: 'buyer',
    },
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
  },
  {
    code: 'DAP',
    name: 'Delivered At Place',
    nameEs: 'Entregada en Lugar',
    group: 'multimodal',
    groupLabel: 'Cualquier modo de transporte',
    responsibilities: {
      packaging: 'seller',
      loading: 'seller',
      inlandTransport: 'seller',
      exportClearance: 'seller',
      mainCarriage: 'seller',
      insurance: 'buyer',
      importClearance: 'buyer',
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
  },
  {
    code: 'DPU',
    name: 'Delivered at Place Unloaded',
    nameEs: 'Entregada en Lugar Descargada',
    group: 'multimodal',
    groupLabel: 'Cualquier modo de transporte',
    responsibilities: {
      packaging: 'seller',
      loading: 'seller',
      inlandTransport: 'seller',
      exportClearance: 'seller',
      mainCarriage: 'seller',
      insurance: 'buyer',
      importClearance: 'buyer',
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
  },
  {
    code: 'DDP',
    name: 'Delivered Duty Paid',
    nameEs: 'Entregada con Derechos Pagados',
    group: 'multimodal',
    groupLabel: 'Cualquier modo de transporte',
    responsibilities: {
      packaging: 'seller',
      loading: 'seller',
      inlandTransport: 'seller',
      exportClearance: 'seller',
      mainCarriage: 'seller',
      insurance: 'seller',
      importClearance: 'seller',
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
  },

  // ── GRUPO 2: Solo transporte marítimo (4) ──────────────────
  {
    code: 'FAS',
    name: 'Free Alongside Ship',
    nameEs: 'Franco al Costado del Buque',
    group: 'maritimo',
    groupLabel: 'Solo transporte marítimo y vías navegables interiores',
    responsibilities: {
      packaging: 'seller',
      loading: 'seller',
      inlandTransport: 'seller',
      exportClearance: 'seller',
      mainCarriage: 'buyer',
      insurance: 'buyer',
      importClearance: 'buyer',
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
  },
  {
    code: 'FOB',
    name: 'Free On Board',
    nameEs: 'Franco a Bordo',
    group: 'maritimo',
    groupLabel: 'Solo transporte marítimo y vías navegables interiores',
    responsibilities: {
      packaging: 'seller',
      loading: 'seller',
      inlandTransport: 'seller',
      exportClearance: 'seller',
      mainCarriage: 'buyer',
      insurance: 'buyer',
      importClearance: 'buyer',
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
  },
  {
    code: 'CFR',
    name: 'Cost and Freight',
    nameEs: 'Coste y Flete',
    group: 'maritimo',
    groupLabel: 'Solo transporte marítimo y vías navegables interiores',
    responsibilities: {
      packaging: 'seller',
      loading: 'seller',
      inlandTransport: 'seller',
      exportClearance: 'seller',
      mainCarriage: 'seller',
      insurance: 'buyer',
      importClearance: 'buyer',
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
  },
  {
    code: 'CIF',
    name: 'Cost, Insurance and Freight',
    nameEs: 'Coste, Seguro y Flete',
    group: 'maritimo',
    groupLabel: 'Solo transporte marítimo y vías navegables interiores',
    responsibilities: {
      packaging: 'seller',
      loading: 'seller',
      inlandTransport: 'seller',
      exportClearance: 'seller',
      mainCarriage: 'seller',
      insurance: 'seller',
      importClearance: 'buyer',
    },
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
  },
]

// ── Helpers ──────────────────────────────────────────────────

export const RESPONSIBILITY_LABELS = {
  packaging: 'Embalaje',
  loading: 'Carga en origen',
  inlandTransport: 'Transporte interior',
  exportClearance: 'Desp. exportación',
  mainCarriage: 'Flete principal',
  insurance: 'Seguro',
  importClearance: 'Desp. importación',
}

export const RESPONSIBILITY_KEYS = Object.keys(RESPONSIBILITY_LABELS)

export function getMultimodal() {
  return INCOTERMS_2020.filter((i) => i.group === 'multimodal')
}

export function getMaritimo() {
  return INCOTERMS_2020.filter((i) => i.group === 'maritimo')
}
