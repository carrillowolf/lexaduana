/**
 * CBAM Translations — Localización a Español
 *
 * Regla general:
 * - UI labels, headings, botones → Español
 * - Términos técnicos CBAM (sectores, categorías, rutas, precursores) → Bilingüe: "Español (English)"
 * - Los JSON de datos NO se modifican; las traducciones se aplican en la capa de presentación.
 */

// ============================================================
// SECTORES (6)
// ============================================================

export const SECTOR_TRANSLATIONS = {
  'Cement': 'Cemento',
  'Iron and steel': 'Hierro y acero',
  'Iron & Steel': 'Hierro y acero',
  'Aluminium': 'Aluminio',
  'Fertilisers': 'Fertilizantes',
  'Chemicals (hydrogen)': 'Productos químicos (hidrógeno)',
  'Hydrogen': 'Hidrógeno',
  'Electricity': 'Electricidad',
}

// ============================================================
// CATEGORÍAS AGREGADAS (20)
// ============================================================

export const AGGREGATED_CATEGORY_TRANSLATIONS = {
  'Calcined clay': 'Arcilla calcinada',
  'Cement clinkers': 'Clínker de cemento',
  'Cement': 'Cemento',
  'Aluminous cement': 'Cemento aluminoso',
  'Sintered Ore': 'Mineral sinterizado',
  'Pig iron': 'Arrabio (hierro bruto)',
  'DRI': 'Hierro de reducción directa (DRI)',
  'FeCr': 'Ferrocromo (FeCr)',
  'FeMn': 'Ferromanganeso (FeMn)',
  'FeNi': 'Ferroníquel (FeNi)',
  'Crude steel': 'Acero bruto',
  'Iron or steel products': 'Productos de hierro o acero',
  'Unwrought aluminium': 'Aluminio en bruto',
  'Aluminium products': 'Productos de aluminio',
  'Hydrogen': 'Hidrógeno',
  'Electricity': 'Electricidad',
  'Ammonia': 'Amoníaco',
  'Nitric acid': 'Ácido nítrico',
  'Urea': 'Urea',
  'Mixed fertilisers': 'Fertilizantes mixtos',
}

// ============================================================
// RUTAS DE PRODUCCIÓN (40+)
// ============================================================

export const PRODUCTION_ROUTE_TRANSLATIONS = {
  'Calcined clay': 'Arcilla calcinada',
  'Cement clinker': 'Clínker de cemento',
  'Cement': 'Cemento',
  'Aluminuous cement': 'Cemento aluminoso',
  'Aluminous cement': 'Cemento aluminoso',
  'Sintered ore': 'Mineral sinterizado',
  'Blast furnace route': 'Ruta de alto horno',
  'Smelting reduction': 'Reducción por fundición',
  'Other production routes': 'Otras rutas de producción',
  'Nickel Pig Iron production': 'Producción de arrabio de níquel',
  'Basic oxigen steel making': 'Acería al oxígeno básico (BOF)',
  'Basic oxigen steel making (incl. Blast furnace)': 'BOF con alto horno',
  'Basic oxigen steel making (incl. Melting reduction)': 'BOF con reducción por fundición',
  'Electric arc furnace': 'Horno de arco eléctrico (EAF)',
  'Electric arc furnace (alloy steels)': 'EAF (aceros aleados)',
  'Electric arc furnace (carbon steel, from direct reduced iron)': 'EAF (acero al carbono, desde DRI)',
  'Electric arc furnace (general)': 'EAF (general)',
  'Production of Direct reduced Iron (using hydrogen)': 'Producción de DRI (con hidrógeno)',
  'DRI (Direct reduced iron)': 'Hierro de reducción directa (DRI)',
  'Iron or steel products': 'Productos de hierro o acero',
  'Ferro-nickel (FeNi)': 'Ferroníquel (FeNi)',
  'Ferro-chromium (FeCr)': 'Ferrocromo (FeCr)',
  'Ferro-manganese (FeMn)': 'Ferromanganeso (FeMn)',
  'Primary (electrolytic) smelting': 'Fundición primaria (electrolítica)',
  'Secondary melting (recycling)': 'Fundición secundaria (reciclaje)',
  'Mix of primary and secondary production': 'Producción mixta primaria y secundaria',
  'Integrated production with primary melting': 'Producción integrada con fundición primaria',
  'Integrated production with secondary melting': 'Producción integrada con fundición secundaria',
  'Integrated with mixed primary and secondary production': 'Producción integrada mixta',
  'Aluminium products': 'Productos de aluminio',
  'Haber-Bosch process with steam reforming of natural gas or biogas': 'Proceso Haber-Bosch con reformado de gas natural o biogás',
  'Haber-Bosch process with gasification of coal or other fuels': 'Proceso Haber-Bosch con gasificación de carbón u otros combustibles',
  'Nitric acid': 'Ácido nítrico',
  'Mixed fertilisers': 'Fertilizantes mixtos',
  'Urea': 'Urea',
  'Steam reforming': 'Reformado con vapor',
  'Partial oxidation': 'Oxidación parcial',
  'Other fuel-based hydrogen production': 'Otras producciones de H₂ basadas en combustibles',
  'Electrolysis of water': 'Electrólisis del agua',
  'Electrolysis of water (other energy sources)': 'Electrólisis del agua (otras fuentes)',
  'Chlor-Alkali electrolysis': 'Electrólisis cloro-álcali',
  'Production of chlorates': 'Producción de cloratos',
  'Electricity': 'Electricidad',
}

// ============================================================
// PRECURSORES (17)
// ============================================================

export const PRECURSOR_TRANSLATIONS = {
  'Cement clinker': 'Clínker de cemento',
  'Calcined clay': 'Arcilla calcinada',
  'Calcined clay, if used in the process': 'Arcilla calcinada, si se usa en el proceso',
  'Sintered ore': 'Mineral sinterizado',
  'Sintered ore, if used in the process': 'Mineral sinterizado, si se usa en el proceso',
  'Pig iron': 'Arrabio',
  'DRI': 'Hierro de reducción directa (DRI)',
  'FeMn': 'Ferromanganeso (FeMn)',
  'FeCr': 'Ferrocromo (FeCr)',
  'FeNi': 'Ferroníquel (FeNi)',
  'Crude steel': 'Acero bruto',
  'Iron or steel products': 'Productos de hierro o acero',
  'Hydrogen': 'Hidrógeno',
  'Separately produced hydrogen': 'Hidrógeno producido por separado',
  'Unwrought aluminium': 'Aluminio en bruto',
  'Aluminium products': 'Productos de aluminio',
  'Ammonia (as 100% ammonia)': 'Amoníaco (como 100% NH₃)',
  'Ammonia': 'Amoníaco',
  'Nitric acid (as 100% nitric acid)': 'Ácido nítrico (como 100% HNO₃)',
  'Nitric acid': 'Ácido nítrico',
  'Urea': 'Urea',
  'Mixed fertilisers': 'Fertilizantes mixtos',
  // Compound precursor phrases found in raw data
  'crude steel from other installations or production processes': 'Acero bruto de otras instalaciones o procesos productivos',
}

// ============================================================
// PROVISIONES ESPECIALES (traducciones comunes)
// ============================================================

export const SPECIAL_PROVISION_TRANSLATIONS = {
  'Clays falling under CN code 2507 00 80 which are not calcined, are assigned embedded emissions of zero.':
    'Las arcillas del código CN 2507 00 80 que no estén calcinadas tienen emisiones incorporadas asignadas de cero.',
  'They shall be included in the CBAM report, but no additional information from the producer is required.':
    'Deben incluirse en el informe CBAM, pero no se requiere información adicional del productor.',
  'if used in the process': 'si se usa en el proceso',
  'from other installations or production processes': 'de otras instalaciones o procesos productivos',
}

// ============================================================
// PAÍSES (principales en comercio CBAM)
// ============================================================

export const COUNTRY_TRANSLATIONS = {
  'China': 'China',
  'Türkiye': 'Turquía',
  'Turkey': 'Turquía',
  'India': 'India',
  'Russia': 'Rusia',
  'Russian Federation': 'Rusia',
  'Ukraine': 'Ucrania',
  'South Korea': 'Corea del Sur',
  'Korea, Republic of': 'Corea del Sur',
  'Japan': 'Japón',
  'United States': 'Estados Unidos',
  'United States of America': 'Estados Unidos',
  'Brazil': 'Brasil',
  'Egypt': 'Egipto',
  'South Africa': 'Sudáfrica',
  'United Kingdom': 'Reino Unido',
  'United Kingdom (Northern Ireland)': 'Reino Unido (Irlanda del Norte)',
  'Switzerland': 'Suiza',
  'Morocco': 'Marruecos',
  'Algeria': 'Argelia',
  'Taiwan': 'Taiwán',
  'Taiwan, Province of China': 'Taiwán',
  'Thailand': 'Tailandia',
  'Vietnam': 'Vietnam',
  'Viet Nam': 'Vietnam',
  'Indonesia': 'Indonesia',
  'Malaysia': 'Malasia',
  'Singapore': 'Singapur',
  'Saudi Arabia': 'Arabia Saudí',
  'United Arab Emirates': 'Emiratos Árabes Unidos',
  'Mexico': 'México',
  'Argentina': 'Argentina',
  'Chile': 'Chile',
  'Colombia': 'Colombia',
  'Peru': 'Perú',
  'Philippines': 'Filipinas',
  'Bangladesh': 'Bangladés',
  'Pakistan': 'Pakistán',
  'Iran, Islamic Republic of': 'Irán',
  'Iran': 'Irán',
  'Iraq': 'Irak',
  'Israel': 'Israel',
  'Kazakhstan': 'Kazajistán',
  'Uzbekistan': 'Uzbekistán',
  'Belarus': 'Bielorrusia',
  'Serbia': 'Serbia',
  'Bosnia and Herzegovina': 'Bosnia y Herzegovina',
  'North Macedonia': 'Macedonia del Norte',
  'Montenegro': 'Montenegro',
  'Albania': 'Albania',
  'Moldova, Republic of': 'Moldavia',
  'Georgia': 'Georgia',
  'Armenia': 'Armenia',
  'Azerbaijan': 'Azerbaiyán',
  'Tunisia': 'Túnez',
  'Libya': 'Libia',
  'Nigeria': 'Nigeria',
  'Ghana': 'Ghana',
  'Kenya': 'Kenia',
  'Ethiopia': 'Etiopía',
  'Tanzania, United Republic of': 'Tanzania',
  'Mozambique': 'Mozambique',
  'Zimbabwe': 'Zimbabue',
  'Zambia': 'Zambia',
  'Democratic Republic of the Congo': 'República Democrática del Congo',
  'Cameroon': 'Camerún',
  "Côte d'Ivoire": 'Costa de Marfil',
  'Senegal': 'Senegal',
  'Australia': 'Australia',
  'New Zealand': 'Nueva Zelanda',
  'Canada': 'Canadá',
  'Cuba': 'Cuba',
  'Dominican Republic': 'República Dominicana',
  'Venezuela, Bolivarian Republic of': 'Venezuela',
  'Ecuador': 'Ecuador',
  'Bolivia, Plurinational State of': 'Bolivia',
  'Paraguay': 'Paraguay',
  'Uruguay': 'Uruguay',
  'Costa Rica': 'Costa Rica',
  'Panama': 'Panamá',
  'Guatemala': 'Guatemala',
  'Honduras': 'Honduras',
  'El Salvador': 'El Salvador',
  'Nicaragua': 'Nicaragua',
  'Jamaica': 'Jamaica',
  'Trinidad and Tobago': 'Trinidad y Tobago',
  'Sri Lanka': 'Sri Lanka',
  'Myanmar': 'Myanmar',
  'Cambodia': 'Camboya',
  'Lao People\'s Democratic Republic': 'Laos',
  'Mongolia': 'Mongolia',
  'Nepal': 'Nepal',
  'Afghanistan': 'Afganistán',
  'Jordan': 'Jordania',
  'Lebanon': 'Líbano',
  'Syrian Arab Republic': 'Siria',
  'Yemen': 'Yemen',
  'Oman': 'Omán',
  'Kuwait': 'Kuwait',
  'Bahrain': 'Baréin',
  'Qatar': 'Catar',
}

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

/**
 * Traduce un sector al formato bilingüe: "Español (English)"
 */
export function translateSector(en) {
  const es = SECTOR_TRANSLATIONS[en]
  if (!es) return en
  return es === en ? es : `${es} (${en})`
}

/**
 * Traduce una categoría agregada al formato bilingüe
 */
export function translateAggregatedCategory(en) {
  const es = AGGREGATED_CATEGORY_TRANSLATIONS[en]
  if (!es) return en
  return es === en ? es : `${es} (${en})`
}

/**
 * Traduce una ruta de producción al formato bilingüe
 */
export function translateProductionRoute(en) {
  const es = PRODUCTION_ROUTE_TRANSLATIONS[en]
  if (!es) return en
  return es === en ? es : `${es} (${en})`
}

/**
 * Traduce un nombre de precursor al formato bilingüe
 */
export function translatePrecursor(en) {
  const es = PRECURSOR_TRANSLATIONS[en]
  if (!es) return en
  return es === en ? es : `${es} (${en})`
}

/**
 * Traduce un nombre de país al español
 */
export function translateCountry(en) {
  return COUNTRY_TRANSLATIONS[en] || en
}

/**
 * Traduce provisiones especiales al español.
 * Intenta coincidencia exacta primero, luego reemplaza frases conocidas.
 */
export function translateSpecialProvisions(text) {
  if (!text) return text

  // Coincidencia exacta
  if (SPECIAL_PROVISION_TRANSLATIONS[text]) {
    return SPECIAL_PROVISION_TRANSLATIONS[text]
  }

  // Reemplazo parcial de frases conocidas
  let translated = text
  for (const [en, es] of Object.entries(SPECIAL_PROVISION_TRANSLATIONS)) {
    translated = translated.replaceAll(en, es)
  }
  return translated
}

/**
 * Traduce la descripción de un CN code al formato bilingüe "Español — English"
 * Para las descripciones largas del JSON, solo añadimos el prefijo bilingüe si tenemos traducción.
 * Como las descripciones son muy variadas, las dejamos en su idioma original por ahora.
 */
export function translateCNDescription(en) {
  // Las descripciones CN son demasiado variadas para traducir manualmente.
  // Se muestran tal como vienen del JSON oficial.
  return en
}
