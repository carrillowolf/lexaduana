// Datos CBAM según Reglamento (UE) 2023/956 - Anexo I
// Actualizado con Reglamento (UE) 2025/2083 y documento TAXUD.B.5.003/ES (04/12/2025)

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

// Fechas clave del CBAM - Actualizado con TAXUD 04/12/2025
export const CBAM_TIMELINE = [
  {
    date: '2023-10-01',
    title: 'Inicio período transitorio',
    description: 'Comienza la obligación de presentar informes trimestrales CBAM',
    status: 'completed'
  },
  {
    date: '2024-01-31',
    title: 'Primer informe trimestral',
    description: 'Fecha límite para el informe Q4 2023',
    status: 'completed'
  },
  {
    date: '2024-07-31',
    title: 'Fin período de flexibilidad',
    description: 'Ya no se permiten valores por defecto de la Comisión para emisiones',
    status: 'completed'
  },
  {
    date: '2025-12-31',
    title: 'Fin período transitorio',
    description: 'Último día del período de informes sin pago',
    status: 'upcoming'
  },
  {
    date: '2026-01-01',
    title: '🚨 CBAM definitivo',
    description: 'Comienza la obligación de comprar certificados CBAM. Solo pueden importar declarantes autorizados.',
    status: 'critical'
  },
  {
    date: '2026-03-31',
    title: '📋 Límite solicitud declarante',
    description: 'Fecha límite para solicitar ser declarante autorizado CBAM y poder seguir importando provisionalmente',
    status: 'upcoming'
  },
  {
    date: '2026-05-31',
    title: 'Primera declaración anual',
    description: 'Fecha límite declaración CBAM año 2026',
    status: 'future'
  },
  {
    date: '2026-09-27',
    title: 'Fin período provisional',
    description: 'Límite para resolución de solicitudes de declarante presentadas antes del 31/03/2026',
    status: 'future'
  },
  {
    date: '2034-01-01',
    title: 'Eliminación total derechos gratuitos',
    description: 'Fase final de eliminación de derechos de emisión gratuitos EU ETS',
    status: 'future'
  }
]

// Próximos plazos de informes trimestrales (período transitorio)
export const CBAM_QUARTERLY_DEADLINES = [
  { quarter: 'Q3 2024', deadline: '2024-10-31', status: 'completed' },
  { quarter: 'Q4 2024', deadline: '2025-01-31', status: 'completed' },
  { quarter: 'Q1 2025', deadline: '2025-04-30', status: 'completed' },
  { quarter: 'Q2 2025', deadline: '2025-07-31', status: 'completed' },
  { quarter: 'Q3 2025', deadline: '2025-10-31', status: 'upcoming' },
  { quarter: 'Q4 2025', deadline: '2026-01-31', status: 'future' },
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

// Valores por defecto de emisiones (tCO2/tonelada de producto) - Período transitorio
export const CBAM_DEFAULT_VALUES = {
  cement: {
    clinker: 0.951,
    portlandCite: 0.693,
    aluminousCite: 1.124
  },
  ironSteel: {
    pigIron: 1.600,
    crudeSteel: 1.080,
    ironProducts: 1.210
  },
  aluminium: {
    unwroughtAluminium: 6.600,
    aluminiumProducts: 7.100
  },
  fertilizers: {
    ammonia: 2.126,
    nitricAcid: 2.840,
    urea: 1.570
  },
  hydrogen: {
    hydrogen: 9.000
  }
}

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
 * Obtiene el próximo plazo de informe CBAM
 * @returns {object} - Información del próximo deadline
 */
export function getNextDeadline() {
  const now = new Date()
  
  for (const deadline of CBAM_QUARTERLY_DEADLINES) {
    const deadlineDate = new Date(deadline.deadline)
    if (deadlineDate > now) {
      const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24))
      return {
        ...deadline,
        daysLeft,
        isUrgent: daysLeft <= 30
      }
    }
  }
  
  // Si todos los trimestrales han pasado, devolver el CBAM definitivo
  return {
    quarter: 'CBAM Definitivo',
    deadline: '2026-01-01',
    status: 'critical',
    daysLeft: Math.ceil((new Date('2026-01-01') - now) / (1000 * 60 * 60 * 24)),
    isUrgent: true
  }
}

/**
 * Estadísticas de códigos CBAM
 */
export function getCBAMStats() {
  const stats = {
    totalCodes: CBAM_CODES.length,
    bySector: {},
    excludedCountries: CBAM_EXCLUDED_COUNTRIES.length
  }
  
  for (const sector of Object.keys(CBAM_SECTORS)) {
    stats.bySector[sector] = CBAM_CODES.filter(c => c.sector === sector).length
  }
  
  return stats
}
