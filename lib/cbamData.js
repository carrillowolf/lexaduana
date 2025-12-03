// Datos CBAM según Reglamento (UE) 2023/956 - Anexo I
// Actualizado con Reglamento (UE) 2025/2083

export const CBAM_SECTORS = {
  cement: {
    id: 'cement',
    name: 'Cemento',
    nameEn: 'Cement',
    icon: '🏗️',
    color: 'from-gray-500 to-gray-700',
    gases: ['CO2'],
    emissions: 'directas + indirectas',
    description: 'Cementos, clínker y arcillas caolínicas calcinadas'
  },
  electricity: {
    id: 'electricity',
    name: 'Electricidad',
    nameEn: 'Electricity',
    icon: '⚡',
    color: 'from-yellow-500 to-orange-500',
    gases: ['CO2'],
    emissions: 'directas',
    description: 'Energía eléctrica importada'
  },
  fertilizers: {
    id: 'fertilizers',
    name: 'Fertilizantes',
    nameEn: 'Fertilizers',
    icon: '🌱',
    color: 'from-green-500 to-emerald-600',
    gases: ['CO2', 'N2O'],
    emissions: 'directas + indirectas',
    description: 'Abonos nitrogenados, ácido nítrico, amoniaco'
  },
  hydrogen: {
    id: 'hydrogen',
    name: 'Hidrógeno',
    nameEn: 'Hydrogen',
    icon: '💨',
    color: 'from-cyan-400 to-blue-500',
    gases: ['CO2'],
    emissions: 'directas + indirectas',
    description: 'Hidrógeno y compuestos relacionados'
  },
  ironSteel: {
    id: 'ironSteel',
    name: 'Hierro y Acero',
    nameEn: 'Iron & Steel',
    icon: '🔩',
    color: 'from-slate-600 to-zinc-800',
    gases: ['CO2'],
    emissions: 'solo directas',
    description: 'Fundición, hierro, acero y sus manufacturas'
  },
  aluminium: {
    id: 'aluminium',
    name: 'Aluminio',
    nameEn: 'Aluminium',
    icon: '🥫',
    color: 'from-blue-400 to-indigo-600',
    gases: ['CO2', 'PFC'],
    emissions: 'solo directas',
    description: 'Aluminio en bruto y productos de aluminio'
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

// Fechas clave del CBAM
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
    description: 'Comienza la obligación de comprar certificados CBAM',
    status: 'critical'
  },
  {
    date: '2026-05-31',
    title: 'Primera declaración anual',
    description: 'Fecha límite declaración CBAM año 2026',
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
  description: 'Importadores con menos de 50 toneladas anuales de mercancías CBAM están exentos'
}

// Valores por defecto de emisiones (tCO2/tonelada de producto) - Período transitorio
export const CBAM_DEFAULT_VALUES = {
  cement: {
    clinker: 0.951,
    portlandCement: 0.693,
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
 * Verifica si un código HS/CN está afectado por CBAM
 * @param {string} hsCode - Código HS de 6-10 dígitos
 * @returns {object|null} - Info CBAM si está afectado, null si no
 */
export function checkCBAM(hsCode) {
  if (!hsCode) return null
  
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
        return {
          affected: true,
          code: cbamCode.cn,
          sector: CBAM_SECTORS[cbamCode.sector],
          description: cbamCode.description,
          gas: cbamCode.gas,
          sectorId: cbamCode.sector
        }
      }
    } else {
      // Coincidencia exacta o el código empieza con el código CBAM
      if (code.startsWith(baseCode) || baseCode.startsWith(code)) {
        return {
          affected: true,
          code: cbamCode.cn,
          sector: CBAM_SECTORS[cbamCode.sector],
          description: cbamCode.description,
          gas: cbamCode.gas,
          sectorId: cbamCode.sector
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
    bySector: {}
  }
  
  for (const sector of Object.keys(CBAM_SECTORS)) {
    stats.bySector[sector] = CBAM_CODES.filter(c => c.sector === sector).length
  }
  
  return stats
}
