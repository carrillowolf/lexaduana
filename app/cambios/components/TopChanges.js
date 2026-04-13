'use client'

const CHAPTER_NAMES = {
  '01': 'Animales vivos', '02': 'Carne', '03': 'Pescados',
  '04': 'Leche, huevos', '05': 'Origen animal', '06': 'Plantas vivas',
  '07': 'Hortalizas', '08': 'Frutas', '09': 'Café, té, especias',
  '10': 'Cereales', '11': 'Molinería', '12': 'Semillas oleaginosas',
  '13': 'Gomas, resinas', '14': 'Materias trenzables', '15': 'Grasas y aceites',
  '16': 'Conservas', '17': 'Azúcares', '18': 'Cacao',
  '19': 'Prep. cereales', '20': 'Prep. legumbres', '21': 'Prep. alimenticias',
  '22': 'Bebidas', '23': 'Residuos alimentarios', '24': 'Tabaco',
  '25': 'Sal, piedras', '26': 'Minerales', '27': 'Combustibles',
  '28': 'Quím. inorgánicos', '29': 'Quím. orgánicos', '30': 'Farmacéuticos',
  '31': 'Abonos', '32': 'Curtientes, tintas', '33': 'Perfumería',
  '34': 'Jabones', '35': 'Colas', '36': 'Explosivos',
  '37': 'Fotográficos', '38': 'Quím. diversos', '39': 'Plásticos',
  '40': 'Caucho', '41': 'Pieles', '42': 'Cuero',
  '43': 'Peletería', '44': 'Madera', '45': 'Corcho',
  '46': 'Espartería', '47': 'Pasta madera', '48': 'Papel, cartón',
  '49': 'Prensa', '50': 'Seda', '51': 'Lana',
  '52': 'Algodón', '53': 'Fibras vegetales', '54': 'Filamentos sintéticos',
  '55': 'Fibras sintéticas', '56': 'Guata, fieltro', '57': 'Alfombras',
  '58': 'Tejidos especiales', '59': 'Telas impregnadas', '60': 'Tejidos de punto',
  '61': 'Prendas de punto', '62': 'Prendas no punto', '63': 'Textiles confeccionados',
  '64': 'Calzado', '65': 'Sombreros', '66': 'Paraguas',
  '67': 'Plumas artificiales', '68': 'Piedra, yeso', '69': 'Cerámicos',
  '70': 'Vidrio', '71': 'Piedras preciosas', '72': 'Hierro y acero',
  '73': 'Manuf. hierro', '74': 'Cobre', '75': 'Níquel',
  '76': 'Aluminio', '78': 'Plomo', '79': 'Cinc',
  '80': 'Estaño', '81': 'Otros metales', '82': 'Herramientas',
  '83': 'Manuf. metal', '84': 'Máquinas mecánicas', '85': 'Material eléctrico',
  '86': 'Ferroviario', '87': 'Vehículos', '88': 'Aeronaves',
  '89': 'Barcos', '90': 'Óptica, precisión', '91': 'Relojería',
  '92': 'Instrumentos musicales', '93': 'Armas', '94': 'Muebles',
  '95': 'Juguetes', '96': 'Manuf. diversas', '97': 'Arte, colección',
}

const MEASURE_TYPES = {
  '103': 'Arancel terceros países',
  '142': 'Preferencia arancelaria',
  '143': 'Contingente arancelario',
  '551': 'Derecho anti-dumping provisional',
  '552': 'Derecho anti-dumping definitivo',
  '553': 'Derecho compensatorio provisional',
  '554': 'Derecho compensatorio definitivo',
  '695': 'Medida de salvaguardia',
  '696': 'Vigilancia previa',
  '714': 'Prohibición importación',
  '750': 'Arancel adicional',
  '490': 'Precio de entrada',
}

const ORIGINS = {
  'CA': '🇨🇦 Canadá', 'CN': '🇨🇳 China', 'JP': '🇯🇵 Japón',
  'US': '🇺🇸 EE.UU.', 'RU': '🇷🇺 Rusia', 'IN': '🇮🇳 India',
  'KR': '🇰🇷 Corea del Sur', 'TR': '🇹🇷 Turquía', 'BR': '🇧🇷 Brasil',
  'TW': '🇹🇼 Taiwán', 'ID': '🇮🇩 Indonesia', 'MY': '🇲🇾 Malasia',
  'TH': '🇹🇭 Tailandia', 'VN': '🇻🇳 Vietnam', 'AR': '🇦🇷 Argentina',
  'EG': '🇪🇬 Egipto', 'UA': '🇺🇦 Ucrania', 'NZ': '🇳🇿 Nueva Zelanda',
  'MA': '🇲🇦 Marruecos', 'ZA': '🇿🇦 Sudáfrica', 'PK': '🇵🇰 Pakistán',
  'BD': '🇧🇩 Bangladés', 'MX': '🇲🇽 México', 'CL': '🇨🇱 Chile',
  'PE': '🇵🇪 Perú', 'CO': '🇨🇴 Colombia', 'BY': '🇧🇾 Bielorrusia',
  '1008': '🌍 Todos los países', '1011': '🌍 Erga omnes',
  '2005': '🌍 No-UE', '2020': '🌍 Países en desarrollo',
}

function formatDuty(value, unit) {
  if (value == null) return '—'
  if (unit === '%') return `${value.toFixed(1)}%`
  if (unit?.includes('EUR')) return `${value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} ${unit}`
  return `${value} ${unit || ''}`
}

function DirectionArrow({ direction, delta, unit }) {
  if (direction === 'new') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m0-16l-4 4m4-4l4 4" />
        </svg>
        NUEVO
      </span>
    )
  }
  if (direction === 'up') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
        +{formatDuty(Math.abs(delta), unit)}
      </span>
    )
  }
  if (direction === 'down') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
        -{formatDuty(Math.abs(delta), unit)}
      </span>
    )
  }
  return <span className="text-xs text-gray-500">Cambio tipo</span>
}

export default function TopChanges({ changes }) {
  if (!changes || changes.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 px-1">
        <svg className="w-5 h-5 text-[#B8860B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <h3 className="text-base font-bold text-gray-800">Top mayores cambios arancelarios</h3>
        <span className="text-xs text-gray-400">Ordenados por magnitud</span>
      </div>

      <div className="rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
        {changes.map((ch, i) => {
          const chapter = ch.goods_code?.substring(0, 2)
          const chapterName = CHAPTER_NAMES[chapter] || ''
          const measureLabel = MEASURE_TYPES[ch.measure_type_code] || `Medida ${ch.measure_type_code}`
          const originLabel = ORIGINS[ch.origin_code] || ch.origin_code

          return (
            <div key={`${ch.goods_code}-${ch.measure_type_code}-${i}`} className={`px-4 py-3 hover:bg-blue-50/40 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-400 text-xs font-bold w-5">{i + 1}.</span>
                    <span className="font-mono text-[#0A3D5C] text-sm font-bold">{ch.goods_code}</span>
                    {originLabel && (
                      <span className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                        {originLabel}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 ml-7">
                    {measureLabel}
                    {chapterName && <span className="ml-2 text-gray-400">· Cap. {chapter} {chapterName}</span>}
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <DirectionArrow direction={ch.direction} delta={ch.delta} unit={ch.unit} />
                  <div className="text-xs text-gray-500 mt-1 space-x-1">
                    {ch.direction !== 'new' && (
                      <>
                        <span className="text-red-400 line-through">{formatDuty(ch.old_duty, ch.old_unit || ch.unit)}</span>
                        <span>→</span>
                      </>
                    )}
                    <span className="text-gray-800 font-semibold">{formatDuty(ch.new_duty, ch.unit)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
