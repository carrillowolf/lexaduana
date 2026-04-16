// Datos CBAM según Reglamento (UE) 2023/956 - Anexo I
// Actualizado con:
// - Reglamento (UE) 2025/2083 (Simplificación CBAM)
// - Documento TAXUD.B.5.003/ES (04/12/2025)
// - C(2025) 8560 - Precios de certificados CBAM
// - C(2025) 8552 - Valores por defecto con markup
// - COM(2025) 989 - Extensión a productos downstream (propuesta)
// Última actualización: Diciembre 2025

// Países/territorios excluidos del CBAM (Anexo III + acuerdos ETS)
// Están en el EU ETS o tienen acuerdos equivalentes
export const CBAM_EXCLUDED_COUNTRIES = [
  { code: 'IS', name: 'Islandia', reason: 'Miembro del EEE con EU ETS' },
  { code: 'LI', name: 'Liechtenstein', reason: 'Miembro del EEE con EU ETS' },
  { code: 'NO', name: 'Noruega', reason: 'Miembro del EEE con EU ETS' },
  { code: 'CH', name: 'Suiza', reason: 'Acuerdo vinculado al EU ETS' },
  // Territorios especiales UE (certificado Y134)
  { code: 'XB', name: 'Büsingen', reason: 'Territorio especial UE' },
  { code: 'XH', name: 'Heligoland', reason: 'Territorio especial UE' },
  { code: 'XL', name: 'Livigno', reason: 'Territorio especial UE' },
]

export const CBAM_SECTORS = {
  cement: {
    id: 'cement',
    name: 'Cemento',
    nameEn: 'Cement',
    icon: '🏗️',
    color: 'from-gray-500 to-gray-700',
    gases: ['CO2'],
    emissions: 'directas + indirectas',
    description: 'Cementos, clínker y arcillas caolínicas calcinadas',
    deMinimisApplies: true // Exención < 50t aplica
  },
  electricity: {
    id: 'electricity',
    name: 'Electricidad',
    nameEn: 'Electricity',
    icon: '⚡',
    color: 'from-yellow-500 to-orange-500',
    gases: ['CO2'],
    emissions: 'directas',
    description: 'Energía eléctrica importada',
    deMinimisApplies: false // NO aplica exención de minimis
  },
  fertilizers: {
    id: 'fertilizers',
    name: 'Fertilizantes',
    nameEn: 'Fertilizers',
    icon: '🌱',
    color: 'from-green-500 to-emerald-600',
    gases: ['CO2', 'N2O'],
    emissions: 'directas + indirectas',
    description: 'Abonos nitrogenados, ácido nítrico, amoniaco',
    deMinimisApplies: true
  },
  hydrogen: {
    id: 'hydrogen',
    name: 'Hidrógeno',
    nameEn: 'Hydrogen',
    icon: '💨',
    color: 'from-cyan-400 to-blue-500',
    gases: ['CO2'],
    emissions: 'directas + indirectas',
    description: 'Hidrógeno y compuestos relacionados',
    deMinimisApplies: false // NO aplica exención de minimis
  },
  ironSteel: {
    id: 'ironSteel',
    name: 'Hierro y Acero',
    nameEn: 'Iron & Steel',
    icon: '🔩',
    color: 'from-slate-600 to-zinc-800',
    gases: ['CO2'],
    emissions: 'solo directas',
    description: 'Fundición, hierro, acero y sus manufacturas',
    deMinimisApplies: true
  },
  aluminium: {
    id: 'aluminium',
    name: 'Aluminio',
    nameEn: 'Aluminium',
    icon: '🥫',
    color: 'from-blue-400 to-indigo-600',
    gases: ['CO2', 'PFC'],
    emissions: 'solo directas',
    description: 'Aluminio en bruto y productos de aluminio',
    deMinimisApplies: true
  }
}

// Códigos CN afectados por CBAM - Anexo I del Reglamento 2023/956
export const CBAM_CODES = [
  // ==================== CEMENTO ====================
  { cn: '2507008', sector: 'cement', description: 'Las demás arcillas caolínicas', gas: 'CO2' },
  { cn: '25231000', sector: 'cement', description: 'Cementos sin pulverizar o clínker', gas: 'CO2' },
  { cn: '25232100', sector: 'cement', description: 'Cemento Portland blanco', gas: 'CO2' },
  { cn: '25232900', sector: 'cement', description: 'Los demás cementos Portland', gas: 'CO2' },
  { cn: '25233000', sector: 'cement', description: 'Cementos aluminosos', gas: 'CO2' },
  { cn: '25239000', sector: 'cement', description: 'Los demás cementos hidráulicos', gas: 'CO2' },

  // ==================== ELECTRICIDAD ====================
  { cn: '27160000', sector: 'electricity', description: 'Energía eléctrica', gas: 'CO2' },

  // ==================== FERTILIZANTES ====================
  { cn: '28080000', sector: 'fertilizers', description: 'Ácido nítrico; ácidos sulfonítricos', gas: 'CO2, N2O' },
  { cn: '2814', sector: 'fertilizers', description: 'Amoniaco anhidro o en disolución acuosa', gas: 'CO2', isChapter: true },
  { cn: '28342100', sector: 'fertilizers', description: 'Nitratos de potasio', gas: 'CO2, N2O' },
  { cn: '3102', sector: 'fertilizers', description: 'Abonos minerales o químicos nitrogenados', gas: 'CO2, N2O', isChapter: true },
  { cn: '3105', sector: 'fertilizers', description: 'Abonos con N, P, K (excepto 3105 60 00)', gas: 'CO2, N2O', isChapter: true, exclude: ['31056000'] },

  // ==================== HIDRÓGENO ====================
  { cn: '28041000', sector: 'hydrogen', description: 'Hidrógeno', gas: 'CO2' },

  // ==================== HIERRO Y ACERO ====================
  // Minerales
  { cn: '26011200', sector: 'ironSteel', description: 'Minerales de hierro aglomerados', gas: 'CO2' },
  
  // Capítulo 72 - Fundición, hierro y acero (con exclusiones)
  { cn: '72', sector: 'ironSteel', description: 'Fundición, hierro y acero', gas: 'CO2', isChapter: true, 
    exclude: [
      '720221', '720229', // Ferrosilicio
      '72023000', // Ferro-sílico-manganeso
      '72025000', // Ferro-sílico-cromo
      '72027000', // Ferromolibdeno
      '72028000', // Ferrovolframio
      '72029100', // Ferrotitanio
      '72029200', // Ferrovanadio
      '72029300', // Ferroniobio
      '72029910', // Ferrofósforo
      '72029930', // Ferro-sílico-magnesio
      '72029980', // Las demás ferroaleaciones
      '7204'      // Chatarra
    ]
  },

  // Capítulo 73 - Manufacturas de hierro o acero
  { cn: '7301', sector: 'ironSteel', description: 'Tablestacas de hierro o acero', gas: 'CO2', isChapter: true },
  { cn: '7302', sector: 'ironSteel', description: 'Elementos para vías férreas', gas: 'CO2', isChapter: true },
  { cn: '730300', sector: 'ironSteel', description: 'Tubos y perfiles huecos de fundición', gas: 'CO2' },
  { cn: '7304', sector: 'ironSteel', description: 'Tubos sin soldadura de hierro o acero', gas: 'CO2', isChapter: true },
  { cn: '7305', sector: 'ironSteel', description: 'Tubos soldados >406,4mm diámetro', gas: 'CO2', isChapter: true },
  { cn: '7306', sector: 'ironSteel', description: 'Los demás tubos y perfiles huecos', gas: 'CO2', isChapter: true },
  { cn: '7307', sector: 'ironSteel', description: 'Accesorios de tubería de hierro o acero', gas: 'CO2', isChapter: true },
  { cn: '7308', sector: 'ironSteel', description: 'Construcciones y partes de hierro/acero', gas: 'CO2', isChapter: true },
  { cn: '730900', sector: 'ironSteel', description: 'Depósitos >300L de hierro o acero', gas: 'CO2' },
  { cn: '7310', sector: 'ironSteel', description: 'Depósitos ≤300L de hierro o acero', gas: 'CO2', isChapter: true },
  { cn: '731100', sector: 'ironSteel', description: 'Recipientes para gas comprimido', gas: 'CO2' },
  { cn: '7318', sector: 'ironSteel', description: 'Tornillos, pernos, tuercas, arandelas', gas: 'CO2', isChapter: true },
  { cn: '7326', sector: 'ironSteel', description: 'Las demás manufacturas de hierro o acero', gas: 'CO2', isChapter: true },

  // ==================== ALUMINIO ====================
  { cn: '7601', sector: 'aluminium', description: 'Aluminio en bruto', gas: 'CO2, PFC', isChapter: true },
  { cn: '7603', sector: 'aluminium', description: 'Polvo y escamillas de aluminio', gas: 'CO2, PFC', isChapter: true },
  { cn: '7604', sector: 'aluminium', description: 'Barras y perfiles de aluminio', gas: 'CO2, PFC', isChapter: true },
  { cn: '7605', sector: 'aluminium', description: 'Alambre de aluminio', gas: 'CO2, PFC', isChapter: true },
  { cn: '7606', sector: 'aluminium', description: 'Chapas y tiras de aluminio >0,2mm', gas: 'CO2, PFC', isChapter: true },
  { cn: '7607', sector: 'aluminium', description: 'Hojas y tiras delgadas ≤0,2mm', gas: 'CO2, PFC', isChapter: true },
  { cn: '7608', sector: 'aluminium', description: 'Tubos de aluminio', gas: 'CO2, PFC', isChapter: true },
  { cn: '760900', sector: 'aluminium', description: 'Accesorios de tubería de aluminio', gas: 'CO2, PFC' },
  { cn: '7610', sector: 'aluminium', description: 'Construcciones y partes de aluminio', gas: 'CO2, PFC', isChapter: true },
  { cn: '761100', sector: 'aluminium', description: 'Depósitos >300L de aluminio', gas: 'CO2, PFC' },
  { cn: '7612', sector: 'aluminium', description: 'Depósitos ≤300L de aluminio', gas: 'CO2, PFC', isChapter: true },
  { cn: '7613', sector: 'aluminium', description: 'Recipientes para gas de aluminio', gas: 'CO2, PFC', isChapter: true },
  { cn: '7614', sector: 'aluminium', description: 'Cables y trenzas de aluminio', gas: 'CO2, PFC', isChapter: true },
  { cn: '7616', sector: 'aluminium', description: 'Las demás manufacturas de aluminio', gas: 'CO2, PFC', isChapter: true },
]

// Timeline CBAM - Fechas clave y plazos
// Actualizado: Febrero 2026
export const CBAM_TIMELINE = [
  // === 2026 - CBAM Definitivo (ya activo) ===
  {
    date: '2026-01-01',
    title: 'CBAM Definitivo',
    description: 'Fin del período transitorio. Comienza la obligación de compra de certificados CBAM.',
    type: 'critical',
    quarter: 'Inicio CBAM Definitivo',
    icon: '🚨',
    isNew: false,
    isPast: true  // Ya pasó
  },
  {
    date: '2026-03-31',
    title: 'Límite Solicitud Declarante Autorizado',
    description: 'Fecha límite para solicitar el certificado de declarante autorizado CBAM.',
    type: 'critical',
    quarter: 'Q1 2026 - Registro',
    icon: '📝',
    isNew: false
  },
  {
    date: '2026-05-31',
    title: 'Primer Informe CBAM 2026',
    description: 'Presentación del informe trimestral Q1 2026.',
    type: 'deadline',
    quarter: 'Q1 2026 - Informe',
    icon: '📊',
    isNew: false
  },
  {
    date: '2026-07-31',
    title: 'Informe CBAM Q2 2026',
    description: 'Presentación del informe trimestral Q2 2026.',
    type: 'deadline',
    quarter: 'Q2 2026 - Informe',
    icon: '📊',
    isNew: false
  },
  {
    date: '2026-10-31',
    title: 'Informe CBAM Q3 2026',
    description: 'Presentación del informe trimestral Q3 2026.',
    type: 'deadline',
    quarter: 'Q3 2026 - Informe',
    icon: '📊',
    isNew: false
  },

  // === 2027 ===
  {
    date: '2027-01-01',
    title: 'Precio Semanal Certificados',
    description: 'Comienza el cálculo semanal del precio de certificados CBAM (antes era trimestral).',
    type: 'milestone',
    quarter: 'Nueva metodología precios',
    icon: '📈',
    isNew: true
  },
  {
    date: '2027-01-31',
    title: 'Informe CBAM Q4 2026',
    description: 'Presentación del informe trimestral Q4 2026 (último del primer año definitivo).',
    type: 'deadline',
    quarter: 'Q4 2026 - Informe',
    icon: '📊',
    isNew: false
  },
  {
    date: '2027-05-31',
    title: 'Declaración Anual CBAM 2026',
    description: 'Presentación de la declaración anual CBAM para el año 2026.',
    type: 'critical',
    quarter: 'Declaración Anual 2026',
    icon: '📋',
    isNew: false
  },
  {
    date: '2027-09-30',
    title: 'Primera Entrega de Certificados',
    description: 'Fecha límite para la entrega de certificados CBAM correspondientes al año 2026.',
    type: 'critical',
    quarter: 'Entrega Certificados 2026',
    icon: '🎫',
    isNew: true
  },

  // === 2028 ===
  {
    date: '2028-01-01',
    title: 'Extensión Productos Downstream',
    description: 'Aplicación del CBAM a ~180 códigos CN adicionales de manufacturas de acero y aluminio.',
    type: 'milestone',
    quarter: 'Ampliación sectores',
    icon: '🏭',
    isNew: true
  },
  {
    date: '2028-05-31',
    title: 'Declaración Anual CBAM 2027',
    description: 'Presentación de la declaración anual CBAM para el año 2027.',
    type: 'deadline',
    quarter: 'Declaración Anual 2027',
    icon: '📋',
    isNew: false
  },

  // === 2034 ===
  {
    date: '2034-01-01',
    title: 'Eliminación Total Derechos Gratuitos',
    description: 'Finaliza la transición. El CBAM cubre el 100% de las emisiones sin ajuste por asignación gratuita.',
    type: 'milestone',
    quarter: 'CBAM 100%',
    icon: '🎯',
    isNew: true
  }
]

// Umbral de minimis - Reglamento 2025/2083
export const CBAM_THRESHOLD = {
  massThreshold: 50, // toneladas de masa neta
  emissionsTarget: 0.99, // 99% de emisiones cubiertas
  description: 'Importadores con menos de 50 toneladas anuales de mercancías CBAM están exentos',
  appliesTo: ['cement', 'fertilizers', 'ironSteel', 'aluminium'], // NO aplica a electricity ni hydrogen
  notAppliesTo: ['electricity', 'hydrogen']
}

// Certificados CBAM para declaración aduanera (desde 01/01/2026)
export const CBAM_CERTIFICATES = {
  Y128: { 
    code: 'Y128', 
    description: 'Número de cuenta CBAM del declarante autorizado',
    required: true,
    condition: 'Y001'
  },
  Y134: { 
    code: 'Y134', 
    description: 'Exención: Mercancías originarias de Büsingen, Heligoland o Livigno',
    required: false,
    condition: 'Y003'
  },
  Y135: { 
    code: 'Y135', 
    description: 'Exención: Mercancías para uso militar',
    required: false,
    condition: 'Y005'
  },
  Y136: { 
    code: 'Y136', 
    description: 'Exención: Electricidad/hidrógeno de zona económica exclusiva UE',
    required: false,
    condition: 'Y007',
    appliesTo: ['electricity', 'hydrogen']
  },
  Y137: { 
    code: 'Y137', 
    description: 'Exención de minimis (< 50t/año)',
    required: false,
    condition: 'Y007/E15',
    notAppliesTo: ['electricity', 'hydrogen']
  },
  Y237: { 
    code: 'Y237', 
    description: 'Mercancías de origen UE',
    required: false,
    condition: 'Y009'
  },
  Y238: { 
    code: 'Y238', 
    description: 'Solicitud de declarante autorizado presentada antes del 31/03/2026',
    required: false,
    condition: 'Y011',
    validUntil: '2026-09-27'
  }
}

// Valores por defecto de emisiones (tCO2/tonelada de producto)
// Formato compatible con getEmissionFactors() → getDefaultEmissionFactor()
export const CBAM_DEFAULT_VALUES = {
  cement: {
    products: [
      { id: 'clinker', name: 'Clínker', factor: 0.951, codes: ['25231000'] },
      { id: 'portland', name: 'Cemento Portland', factor: 0.693, codes: ['25232100', '25232900'] },
      { id: 'aluminous', name: 'Cemento Aluminoso', factor: 1.124, codes: ['25233000'] },
      { id: 'other_cement', name: 'Otros cementos', factor: 0.693, codes: ['25239000'] },
    ]
  },
  ironSteel: {
    products: [
      { id: 'pig_iron', name: 'Arrabio', factor: 1.600, codes: ['7201'] },
      { id: 'crude_steel', name: 'Acero bruto', factor: 1.080, codes: ['7206', '7207'] },
      { id: 'iron_products', name: 'Productos hierro/acero', factor: 1.210, codes: ['7208', '7209', '7210', '7301', '7302', '7304', '7305', '7306', '7307', '7308', '7309', '7310', '7311', '7318', '7326'] },
    ]
  },
  aluminium: {
    products: [
      { id: 'unwrought', name: 'Aluminio en bruto', factor: 6.600, codes: ['7601'] },
      { id: 'alu_products', name: 'Productos aluminio', factor: 7.100, codes: ['7603', '7604', '7605', '7606', '7607', '7608', '7609', '7610', '7611', '7612', '7613', '7614', '7616'] },
    ]
  },
  fertilizers: {
    products: [
      { id: 'ammonia', name: 'Amoniaco', factor: 2.126, codes: ['2814'] },
      { id: 'nitric_acid', name: 'Ácido nítrico', factor: 2.840, codes: ['28080000'] },
      { id: 'urea', name: 'Urea / Fertilizantes', factor: 1.570, codes: ['3102', '3105'] },
    ]
  },
  hydrogen: {
    products: [
      { id: 'hydrogen', name: 'Hidrógeno', factor: 9.000, codes: ['28041000'] },
    ]
  },
}

// ============================================================
// NUEVAS CONSTANTES - Paquete regulatorio Diciembre 2025
// ============================================================

/**
 * Metodología de precios de certificados CBAM
 * Según Reglamento de Ejecución C(2025) 8560
 */
export const CBAM_CERTIFICATE_PRICING = {
  description: 'Precio de certificados CBAM basado en precios de subasta EU ETS',
  methodology: {
    2026: {
      period: 'Trimestral',
      calculation: 'Media ponderada de precios de subasta EU ETS del trimestre anterior',
      pricesPerYear: 4,
      note: 'Publicación el primer día hábil del trimestre siguiente'
    },
    2027: {
      period: 'Semanal',
      calculation: 'Media ponderada de precios de subasta EU ETS de la semana anterior',
      pricesPerYear: 52,
      note: 'Publicación el primer día hábil de la semana siguiente'
    }
  },
  unit: 'EUR/tCO2e',
  precision: 2, // decimales
  source: 'Precios de subasta EU ETS (EEX, ICE)',
  referencePrice2024: 65.50 // Precio indicativo de referencia
}

/**
 * Penalización (markup) sobre valores por defecto
 * Según Reglamento Delegado C(2025) 8552
 * 
 * Si el importador usa valores por defecto en lugar de emisiones reales verificadas,
 * se aplica un recargo progresivo para incentivar la obtención de datos reales.
 */
export const CBAM_DEFAULT_VALUE_MARKUP = {
  description: 'Penalización sobre valores por defecto para incentivar emisiones reales verificadas',
  regulation: 'C(2025) 8552',
  schedule: [
    { year: 2026, markup: 0.10, label: '+10%', description: 'Año de transición' },
    { year: 2027, markup: 0.20, label: '+20%', description: 'Incremento intermedio' },
    { year: 2028, markup: 0.30, label: '+30%', description: 'Penalización completa (permanente)' }
  ],
  exception: {
    applies: true,
    description: 'Productos downstream complejos (múltiples sectores/precursores) pueden usar valores por defecto SIN markup debido a la dificultad de verificación',
    reason: 'Dificultad técnica de rastrear emisiones en cadenas de suministro complejas'
  },
  example: {
    baseValue: 1.080, // tCO2/t para acero crudo
    year2026: 1.188, // +10%
    year2027: 1.296, // +20%
    year2028: 1.404  // +30%
  }
}

/**
 * Extensión a productos downstream (2028)
 * Según Propuesta COM(2025) 989 (pendiente de adopción)
 */
export const CBAM_DOWNSTREAM_EXTENSION = {
  effectiveDate: '2028-01-01',
  status: 'proposed', // 'proposed' | 'adopted' | 'in_force'
  regulation: 'COM(2025) 989',
  description: 'Extensión del CBAM a productos manufacturados derivados de acero y aluminio',
  stats: {
    newCNCodes: 180, // aproximadamente
    newImporters: 7500, // estimación
    newSMEs: 3850 // estimación
  },
  sectors: [
    {
      id: 'ironSteelDownstream',
      name: 'Productos derivados de Hierro y Acero',
      nameEn: 'Iron & Steel Downstream',
      icon: '🏗️',
      examples: [
        'Estructuras metálicas (7308)',
        'Depósitos y contenedores (7309-7311)',
        'Tornillería y elementos de fijación complejos (7318)',
        'Manufacturas diversas de hierro/acero (7326)'
      ]
    },
    {
      id: 'aluminiumDownstream', 
      name: 'Productos derivados de Aluminio',
      nameEn: 'Aluminium Downstream',
      icon: '🔧',
      examples: [
        'Productos laminados de aluminio (7604-7608)',
        'Estructuras de aluminio (7610)',
        'Recipientes de aluminio (7611-7613)',
        'Manufacturas diversas de aluminio (7616)'
      ]
    },
    {
      id: 'combinedMetal',
      name: 'Productos Metálicos Combinados',
      nameEn: 'Combined Metal Goods',
      icon: '⚙️',
      examples: [
        'Productos que combinan acero y aluminio',
        'Ensamblajes metálicos complejos',
        'Componentes industriales mixtos'
      ]
    }
  ],
  notIncluded: [
    'Productos downstream de cemento',
    'Productos downstream de fertilizantes', 
    'Productos downstream de hidrógeno'
  ],
  selectionCriteria: [
    'Intensidad comercial (proxy de comerciabilidad)',
    'Impacto de costes de carbono (costes CBAM vs valor añadido)',
    'Umbral mínimo de emisiones incorporadas'
  ]
}

/**
 * Medidas anti-elusión reforzadas (Diciembre 2025)
 */
export const CBAM_ANTI_CIRCUMVENTION = {
  description: 'Nuevas medidas para prevenir la elusión del CBAM',
  regulation: 'COM(2025) 989',
  measures: [
    {
      id: 'scrap',
      title: 'Chatarra pre-consumo como precursor',
      description: 'La chatarra generada antes del consumo final ahora cuenta como precursor CBAM, evitando el "lavado de emisiones"'
    },
    {
      id: 'origin_proof',
      title: 'Prueba de ubicación de producción',
      description: 'La Comisión puede exigir prueba del lugar de producción para combinaciones CN/origen de alto riesgo'
    },
    {
      id: 'suspicious_emissions',
      title: 'Condiciones adicionales para emisiones reales',
      description: 'En casos sospechosos, pueden requerirse condiciones adicionales para aceptar emisiones reales declaradas (via actos delegados)'
    }
  ]
}

/**
 * Cambios en reglas de electricidad (Diciembre 2025)
 */
export const CBAM_ELECTRICITY_RULES = {
  description: 'Actualización de reglas para electricidad importada',
  changes: [
    {
      id: 'average_grid',
      title: 'Factor de emisión basado en red promedio',
      before: 'Solo combustibles fósiles',
      after: 'Red eléctrica promedio (incluye renovables)',
      impact: 'Mejor reflejo de la descarbonización real del país exportador'
    },
    {
      id: 'ppa_indirect',
      title: 'Aceptación de PPAs indirectos',
      before: 'Solo contratos directos con generador',
      after: 'Contratos a través de intermediarios aceptados',
      impact: 'Mayor flexibilidad para demostrar origen renovable'
    },
    {
      id: 'congestion',
      title: 'Eliminación criterio de congestión de red',
      before: 'Requerido demostrar "ausencia de congestión de red"',
      after: 'Criterio eliminado',
      impact: 'Simplificación de requisitos de verificación'
    }
  ]
}

// ============================================================
// FUNCIONES HELPER
// ============================================================

/**
 * Verifica si un país está excluido del CBAM
 * @param {string} countryCode - Código ISO del país
 * @returns {object|null} - Info si está excluido, null si no
 */
export function isCountryExcluded(countryCode) {
  if (!countryCode) return null
  const excluded = CBAM_EXCLUDED_COUNTRIES.find(c => c.code === countryCode.toUpperCase())
  return excluded || null
}

/**
 * Verifica si un código HS/CN está afectado por CBAM
 * @param {string} hsCode - Código HS de 6-10 dígitos
 * @param {string} countryCode - Código ISO del país de origen (opcional)
 * @returns {object|null} - Info CBAM si está afectado, null si no
 */
export function checkCBAM(hsCode, countryCode = null) {
  if (!hsCode) return null
  
  // Verificar si el país está excluido
  if (countryCode) {
    const excluded = isCountryExcluded(countryCode)
    if (excluded) {
      return {
        affected: false,
        reason: 'countryExcluded',
        country: excluded
      }
    }
  }
  
  // Normalizar código: solo dígitos
  const code = hsCode.replace(/\D/g, '')
  
  for (const cbamCode of CBAM_CODES) {
    const baseCode = cbamCode.cn.replace(/\D/g, '')
    
    // Si es un capítulo/partida (isChapter), verificar si el código empieza con él
    if (cbamCode.isChapter) {
      if (code.startsWith(baseCode)) {
        // Verificar exclusiones
        if (cbamCode.exclude) {
          const isExcluded = cbamCode.exclude.some(excl => 
            code.startsWith(excl.replace(/\D/g, ''))
          )
          if (isExcluded) continue
        }
        
        const sector = CBAM_SECTORS[cbamCode.sector]
        return {
          affected: true,
          code: cbamCode.cn,
          sector: sector,
          description: cbamCode.description,
          gas: cbamCode.gas,
          sectorId: cbamCode.sector,
          deMinimisApplies: sector.deMinimisApplies
        }
      }
    } else {
      // Coincidencia exacta o el código empieza con el código CBAM
      if (code.startsWith(baseCode) || baseCode.startsWith(code)) {
        const sector = CBAM_SECTORS[cbamCode.sector]
        return {
          affected: true,
          code: cbamCode.cn,
          sector: sector,
          description: cbamCode.description,
          gas: cbamCode.gas,
          sectorId: cbamCode.sector,
          deMinimisApplies: sector.deMinimisApplies
        }
      }
    }
  }

  return { affected: false }
}

/**
 * Lista de sectores que actualmente NO están soportados por el motor de cálculo
 * Advisory. La electricidad se excluye porque el Reg. 2025/2621 no publica
 * valores por defecto para electricidad (se rige por factores de red de país,
 * dataset distinto).
 */
export const UNSUPPORTED_ADVISORY_SECTORS = ['electricity']

/**
 * Comprueba si un CN code está cubierto por el motor Advisory.
 * Devuelve { supported: boolean, reason?: string, sectorId?: string }
 */
export function isCnSupportedByAdvisory(cnCode) {
  if (!cnCode) return { supported: true }
  const check = checkCBAM(cnCode)
  if (!check || !check.affected) {
    return { supported: true } // no CBAM, no bloquea (pasará por otro flujo)
  }
  if (UNSUPPORTED_ADVISORY_SECTORS.includes(check.sectorId)) {
    return {
      supported: false,
      sectorId: check.sectorId,
      reason: 'electricity_not_supported',
    }
  }
  return { supported: true, sectorId: check.sectorId }
}

/**
 * Obtiene el próximo deadline relevante
 * @returns {Object} - Información del próximo plazo
 */
export function getNextDeadline() {
  const now = new Date()

  // Buscar el siguiente evento futuro
  const futureEvents = CBAM_TIMELINE
    .filter(event => {
      const eventDate = new Date(event.date)
      // Importante: comparar fechas completas
      return eventDate > now
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  if (futureEvents.length === 0) {
    // Si no hay eventos futuros en el timeline, devolver el último
    const lastEvent = CBAM_TIMELINE[CBAM_TIMELINE.length - 1]
    const deadline = new Date(lastEvent.date)
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))

    return {
      ...lastEvent,
      deadline: lastEvent.date,
      daysLeft,
      isUrgent: false,
      status: 'future'
    }
  }

  const nextEvent = futureEvents[0]
  const deadline = new Date(nextEvent.date)
  const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))

  return {
    ...nextEvent,
    deadline: nextEvent.date,
    daysLeft,
    isUrgent: daysLeft <= 30,
    status: nextEvent.type
  }
}

/**
 * Calcula el markup aplicable según el año
 * @param {number} year - Año para el cálculo
 * @returns {object} - Información del markup
 */
export function getDefaultValueMarkup(year = new Date().getFullYear()) {
  const schedule = CBAM_DEFAULT_VALUE_MARKUP.schedule
  
  if (year < 2026) {
    return { markup: 0, label: '0%', description: 'Período transitorio - sin markup' }
  }
  
  // Buscar el markup correspondiente o el último disponible
  const applicable = schedule.filter(s => s.year <= year).pop() || schedule[schedule.length - 1]
  return applicable
}

/**
 * Aplica el markup a un valor por defecto
 * @param {number} defaultValue - Valor por defecto en tCO2/t
 * @param {number} year - Año para el cálculo
 * @returns {object} - Valor ajustado con información
 */
export function applyDefaultValueMarkup(defaultValue, year = new Date().getFullYear()) {
  const markup = getDefaultValueMarkup(year)
  const adjustedValue = defaultValue * (1 + markup.markup)
  
  return {
    original: defaultValue,
    markup: markup,
    adjusted: Math.round(adjustedValue * 1000) / 1000, // 3 decimales
    difference: Math.round((adjustedValue - defaultValue) * 1000) / 1000
  }
}

/**
 * Estadísticas de códigos CBAM
 */
export function getCBAMStats() {
  const stats = {
    totalCodes: CBAM_CODES.length,
    bySector: {},
    excludedCountries: CBAM_EXCLUDED_COUNTRIES.length,
    downstreamCodes: CBAM_DOWNSTREAM_EXTENSION.stats.newCNCodes,
    downstreamEffective: CBAM_DOWNSTREAM_EXTENSION.effectiveDate
  }
  
  for (const sector of Object.keys(CBAM_SECTORS)) {
    stats.bySector[sector] = CBAM_CODES.filter(c => c.sector === sector).length
  }
  
  return stats
}
// ============================================================
// BENCHMARKS OFICIALES UE - AÑADIDO DIC 2025
// ============================================================

/**
 * Benchmarks CBAM - Emisiones de referencia UE (instalaciones más eficientes)
 * 
 * IMPORTANTE: El coste CBAM se calcula como:
 * Coste = Toneladas × (Emisiones_declaradas - Benchmark_UE) × Precio_CO2
 * 
 * Los benchmarks representan las emisiones de las instalaciones europeas más
 * eficientes (top 10%). Solo se cobra por las emisiones que EXCEDEN este nivel.
 * 
 * Fuente: Commission Implementing Regulation C(2025) 8552 - Annex IA Free Allocation
 */
export const CBAM_BENCHMARKS = {
  cement: {
    // Clínker gris (grey clinker)
    clinkerGrey: {
      value: 0.666,
      unit: 'tCO2e/t',
      description: 'Clínker de cemento gris'
    },
    // Clínker blanco (white clinker)
    clinkerWhite: {
      value: 0.859,
      unit: 'tCO2e/t',
      description: 'Clínker de cemento blanco'
    },
    // Cemento Portland (ya incluye clínker)
    portlandCement: {
      value: 0.666,
      unit: 'tCO2e/t',
      description: 'Cemento Portland gris'
    },
    portlandWhite: {
      value: 0.859,
      unit: 'tCO2e/t',
      description: 'Cemento Portland blanco'
    },
    // Cemento aluminoso
    aluminousCement_2026: {
      value: 0.717,
      unit: 'tCO2e/t',
      description: 'Cemento aluminoso (2026-2027)'
    },
    aluminousCement_2028: {
      value: 0.686,
      unit: 'tCO2e/t',
      description: 'Cemento aluminoso (2028-2030)'
    },
    // Benchmark general para el simulador
    default: 0.666
  },

  ironSteel: {
    // Acero al carbono (Carbon Steel)
    carbonSteel_BF_BOF: {
      value: 1.420,
      unit: 'tCO2e/t',
      description: 'Acero carbono BF/BOF (alto horno)'
    },
    carbonSteel_DRI_EAF: {
      value: 0.746,
      unit: 'tCO2e/t',
      description: 'Acero carbono DRI/EAF (reducción directa)'
    },
    carbonSteel_Scrap_EAF: {
      value: 0.266,
      unit: 'tCO2e/t',
      description: 'Acero carbono Scrap/EAF (chatarra)'
    },
    // Acero baja aleación (Low alloy steel)
    lowAlloy_BF_BOF: {
      value: 1.490,
      unit: 'tCO2e/t',
      description: 'Acero baja aleación BF/BOF'
    },
    lowAlloy_DRI_EAF: {
      value: 0.783,
      unit: 'tCO2e/t',
      description: 'Acero baja aleación DRI/EAF'
    },
    lowAlloy_Scrap_EAF: {
      value: 0.279,
      unit: 'tCO2e/t',
      description: 'Acero baja aleación Scrap/EAF'
    },
    // Acero alta aleación (High alloy steel)
    highAlloy_EAF: {
      value: 0.352,
      unit: 'tCO2e/t',
      description: 'Acero alta aleación EAF'
    },
    // Acero inoxidable
    stainlessSteel: {
      value: 1.010,
      unit: 'tCO2e/t',
      description: 'Acero inoxidable'
    },
    // Benchmark general (promedio ponderado BF/BOF + EAF)
    default: 0.850
  },

  aluminium: {
    // Aluminio primario
    primary: {
      value: 2.090,
      unit: 'tCO2e/t',
      description: 'Aluminio primario (electrolisis)'
    },
    // Aluminio secundario (reciclado)
    secondary: {
      value: 0.289,
      unit: 'tCO2e/t',
      description: 'Aluminio secundario (reciclado)'
    },
    // Benchmark general (promedio)
    default: 1.500
  },

  fertilizers: {
    // Amoniaco
    ammonia: {
      value: 1.522,
      unit: 'tCO2e/t',
      description: 'Amoniaco anhidro'
    },
    ammoniaAqueous: {
      value: 0.457,
      unit: 'tCO2e/t',
      description: 'Amoniaco en solución acuosa'
    },
    // Ácido nítrico
    nitricAcid: {
      value: 0.582,
      unit: 'tCO2e/t',
      description: 'Ácido nítrico'
    },
    // Urea
    urea: {
      value: 0.304,
      unit: 'tCO2e/t',
      description: 'Urea en solución'
    },
    // Nitrato de potasio
    potassiumNitrate: {
      value: 0.626,
      unit: 'tCO2e/t',
      description: 'Nitrato de potasio'
    },
    // Benchmark general
    default: 0.600
  },

  hydrogen: {
    hydrogen: {
      value: 5.089,
      unit: 'tCO2e/t',
      description: 'Hidrógeno'
    },
    default: 5.089
  },

  electricity: {
    // La electricidad no tiene benchmark fijo
    // Se calcula según el mix energético del país de origen
    default: 0.000,
    note: 'Sin benchmark - se usa factor de emisión de red del país'
  }
}

/**
 * Obtiene el benchmark aplicable para un sector
 * @param {string} sectorId - ID del sector (cement, ironSteel, aluminium, etc.)
 * @param {number} year - Año de aplicación (opcional)
 * @returns {number} - Valor del benchmark en tCO2e/t
 */
export function getBenchmark(sectorId, year = new Date().getFullYear()) {
  if (!CBAM_BENCHMARKS[sectorId]) return 0

  // Para cemento aluminoso, usar benchmark según año
  if (sectorId === 'cement' && year >= 2028) {
    return CBAM_BENCHMARKS.cement.aluminousCement_2028.value
  }

  // Por defecto, usar el benchmark general del sector
  return CBAM_BENCHMARKS[sectorId].default
}

/**
 * Calcula el coste CBAM con la fórmula correcta
 * 
 * IMPORTANTE: La fórmula correcta es:
 * Coste = Toneladas × (Emisiones_declaradas - Benchmark_UE) × Precio_CO2
 * 
 * NO se cobra sobre todas las emisiones, solo sobre las que exceden el benchmark
 * 
 * @param {number} tonnes - Toneladas de producto
 * @param {number} emissions - Emisiones declaradas en tCO2/t
 * @param {number} co2Price - Precio del CO2 en EUR/tCO2
 * @param {string} sectorId - ID del sector
 * @returns {object} - Desglose completo del cálculo
 */
export function calculateCBAMCost(tonnes, emissions, co2Price, sectorId) {
  const benchmark = getBenchmark(sectorId)

  // FÓRMULA CORRECTA: (Emisiones - Benchmark) × Precio
  // Si emisiones < benchmark, el coste es 0 (no hay penalización)
  const emissionsSubjectToCBAM = Math.max(0, emissions - benchmark)
  const totalEmissions = tonnes * emissionsSubjectToCBAM
  const totalCost = totalEmissions * co2Price

  return {
    // Inputs
    tonnes,
    emissionsPerTonne: emissions,
    co2Price,
    benchmark,

    // Cálculos
    emissionsSubjectToCBAM, // Solo las que exceden el benchmark
    totalEmissions,
    totalCost,

    // Desglose paso a paso
    breakdown: {
      step1: `${emissions.toFixed(3)} tCO2/t (emisiones declaradas)`,
      step2: `${benchmark.toFixed(3)} tCO2/t (benchmark UE - NO se cobra)`,
      step3: `${emissionsSubjectToCBAM.toFixed(3)} tCO2/t (emisiones sujetas a CBAM)`,
      step4: `${tonnes} t × ${emissionsSubjectToCBAM.toFixed(3)} tCO2/t = ${totalEmissions.toFixed(2)} tCO2`,
      step5: `${totalEmissions.toFixed(2)} tCO2 × €${co2Price}/tCO2 = €${totalCost.toFixed(2)}`
    },

    // Información adicional
    info: {
      benchmarkExplanation: 'El benchmark representa las emisiones de las instalaciones europeas más eficientes (top 10%). Solo se cobra por emisiones que exceden este nivel.',
      savingsVsFullEmissions: `Ahorro vs cobrar todas las emisiones: €${((tonnes * emissions * co2Price) - totalCost).toFixed(2)}`
    }
  }
}