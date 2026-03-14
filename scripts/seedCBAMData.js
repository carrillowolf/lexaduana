/**
 * Seed CBAM Data - Migra datos hardcoded de lib/cbamData.js a Supabase
 *
 * Uso: node scripts/seedCBAMData.js
 *
 * Requiere: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env
 *
 * Este script lee las constantes de cbamData.js y las inserta en las tablas
 * CBAM de Supabase. Se ejecuta una sola vez después de crear las tablas.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: join(__dirname, '..', '.env') })
// También probar .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================
// DATOS - Extraídos directamente de lib/cbamData.js
// ============================================================

const SECTORS = [
  { id: 'cement', name: 'Cemento', name_en: 'Cement', icon: '🏗️', color: 'from-gray-500 to-gray-700', gases: ['CO2'], emissions_type: 'directas + indirectas', description: 'Cementos, clínker y arcillas caolínicas calcinadas', de_minimis_applies: true, sort_order: 1 },
  { id: 'electricity', name: 'Electricidad', name_en: 'Electricity', icon: '⚡', color: 'from-yellow-500 to-orange-500', gases: ['CO2'], emissions_type: 'directas', description: 'Energía eléctrica importada', de_minimis_applies: false, sort_order: 2 },
  { id: 'fertilizers', name: 'Fertilizantes', name_en: 'Fertilizers', icon: '🌱', color: 'from-green-500 to-emerald-600', gases: ['CO2', 'N2O'], emissions_type: 'directas + indirectas', description: 'Abonos nitrogenados, ácido nítrico, amoniaco', de_minimis_applies: true, sort_order: 3 },
  { id: 'hydrogen', name: 'Hidrógeno', name_en: 'Hydrogen', icon: '💨', color: 'from-cyan-400 to-blue-500', gases: ['CO2'], emissions_type: 'directas + indirectas', description: 'Hidrógeno y compuestos relacionados', de_minimis_applies: false, sort_order: 4 },
  { id: 'ironSteel', name: 'Hierro y Acero', name_en: 'Iron & Steel', icon: '🔩', color: 'from-slate-600 to-zinc-800', gases: ['CO2'], emissions_type: 'solo directas', description: 'Fundición, hierro, acero y sus manufacturas', de_minimis_applies: true, sort_order: 5 },
  { id: 'aluminium', name: 'Aluminio', name_en: 'Aluminium', icon: '🥫', color: 'from-blue-400 to-indigo-600', gases: ['CO2', 'PFC'], emissions_type: 'solo directas', description: 'Aluminio en bruto y productos de aluminio', de_minimis_applies: true, sort_order: 6 },
]

const CN_CODES = [
  // Cemento
  { cn_code: '2507008', sector_id: 'cement', description: 'Las demás arcillas caolínicas', gas: 'CO2', is_chapter: false },
  { cn_code: '25231000', sector_id: 'cement', description: 'Cementos sin pulverizar o clínker', gas: 'CO2', is_chapter: false },
  { cn_code: '25232100', sector_id: 'cement', description: 'Cemento Portland blanco', gas: 'CO2', is_chapter: false },
  { cn_code: '25232900', sector_id: 'cement', description: 'Los demás cementos Portland', gas: 'CO2', is_chapter: false },
  { cn_code: '25233000', sector_id: 'cement', description: 'Cementos aluminosos', gas: 'CO2', is_chapter: false },
  { cn_code: '25239000', sector_id: 'cement', description: 'Los demás cementos hidráulicos', gas: 'CO2', is_chapter: false },
  // Electricidad
  { cn_code: '27160000', sector_id: 'electricity', description: 'Energía eléctrica', gas: 'CO2', is_chapter: false },
  // Fertilizantes
  { cn_code: '28080000', sector_id: 'fertilizers', description: 'Ácido nítrico; ácidos sulfonítricos', gas: 'CO2, N2O', is_chapter: false },
  { cn_code: '2814', sector_id: 'fertilizers', description: 'Amoniaco anhidro o en disolución acuosa', gas: 'CO2', is_chapter: true },
  { cn_code: '28342100', sector_id: 'fertilizers', description: 'Nitratos de potasio', gas: 'CO2, N2O', is_chapter: false },
  { cn_code: '3102', sector_id: 'fertilizers', description: 'Abonos minerales o químicos nitrogenados', gas: 'CO2, N2O', is_chapter: true },
  { cn_code: '3105', sector_id: 'fertilizers', description: 'Abonos con N, P, K (excepto 3105 60 00)', gas: 'CO2, N2O', is_chapter: true, excluded_codes: ['31056000'] },
  // Hidrógeno
  { cn_code: '28041000', sector_id: 'hydrogen', description: 'Hidrógeno', gas: 'CO2', is_chapter: false },
  // Hierro y Acero
  { cn_code: '26011200', sector_id: 'ironSteel', description: 'Minerales de hierro aglomerados', gas: 'CO2', is_chapter: false },
  { cn_code: '72', sector_id: 'ironSteel', description: 'Fundición, hierro y acero', gas: 'CO2', is_chapter: true, excluded_codes: ['720221', '720229', '72023000', '72025000', '72027000', '72028000', '72029100', '72029200', '72029300', '72029910', '72029930', '72029980', '7204'] },
  { cn_code: '7301', sector_id: 'ironSteel', description: 'Tablestacas de hierro o acero', gas: 'CO2', is_chapter: true },
  { cn_code: '7302', sector_id: 'ironSteel', description: 'Elementos para vías férreas', gas: 'CO2', is_chapter: true },
  { cn_code: '730300', sector_id: 'ironSteel', description: 'Tubos y perfiles huecos de fundición', gas: 'CO2', is_chapter: false },
  { cn_code: '7304', sector_id: 'ironSteel', description: 'Tubos sin soldadura de hierro o acero', gas: 'CO2', is_chapter: true },
  { cn_code: '7305', sector_id: 'ironSteel', description: 'Tubos soldados >406,4mm diámetro', gas: 'CO2', is_chapter: true },
  { cn_code: '7306', sector_id: 'ironSteel', description: 'Los demás tubos y perfiles huecos', gas: 'CO2', is_chapter: true },
  { cn_code: '7307', sector_id: 'ironSteel', description: 'Accesorios de tubería de hierro o acero', gas: 'CO2', is_chapter: true },
  { cn_code: '7308', sector_id: 'ironSteel', description: 'Construcciones y partes de hierro/acero', gas: 'CO2', is_chapter: true },
  { cn_code: '730900', sector_id: 'ironSteel', description: 'Depósitos >300L de hierro o acero', gas: 'CO2', is_chapter: false },
  { cn_code: '7310', sector_id: 'ironSteel', description: 'Depósitos ≤300L de hierro o acero', gas: 'CO2', is_chapter: true },
  { cn_code: '731100', sector_id: 'ironSteel', description: 'Recipientes para gas comprimido', gas: 'CO2', is_chapter: false },
  { cn_code: '7318', sector_id: 'ironSteel', description: 'Tornillos, pernos, tuercas, arandelas', gas: 'CO2', is_chapter: true },
  { cn_code: '7326', sector_id: 'ironSteel', description: 'Las demás manufacturas de hierro o acero', gas: 'CO2', is_chapter: true },
  // Aluminio
  { cn_code: '7601', sector_id: 'aluminium', description: 'Aluminio en bruto', gas: 'CO2, PFC', is_chapter: true },
  { cn_code: '7603', sector_id: 'aluminium', description: 'Polvo y escamillas de aluminio', gas: 'CO2, PFC', is_chapter: true },
  { cn_code: '7604', sector_id: 'aluminium', description: 'Barras y perfiles de aluminio', gas: 'CO2, PFC', is_chapter: true },
  { cn_code: '7605', sector_id: 'aluminium', description: 'Alambre de aluminio', gas: 'CO2, PFC', is_chapter: true },
  { cn_code: '7606', sector_id: 'aluminium', description: 'Chapas y tiras de aluminio >0,2mm', gas: 'CO2, PFC', is_chapter: true },
  { cn_code: '7607', sector_id: 'aluminium', description: 'Hojas y tiras delgadas ≤0,2mm', gas: 'CO2, PFC', is_chapter: true },
  { cn_code: '7608', sector_id: 'aluminium', description: 'Tubos de aluminio', gas: 'CO2, PFC', is_chapter: true },
  { cn_code: '760900', sector_id: 'aluminium', description: 'Accesorios de tubería de aluminio', gas: 'CO2, PFC', is_chapter: false },
  { cn_code: '7610', sector_id: 'aluminium', description: 'Construcciones y partes de aluminio', gas: 'CO2, PFC', is_chapter: true },
  { cn_code: '761100', sector_id: 'aluminium', description: 'Depósitos >300L de aluminio', gas: 'CO2, PFC', is_chapter: false },
  { cn_code: '7612', sector_id: 'aluminium', description: 'Depósitos ≤300L de aluminio', gas: 'CO2, PFC', is_chapter: true },
  { cn_code: '7613', sector_id: 'aluminium', description: 'Recipientes para gas de aluminio', gas: 'CO2, PFC', is_chapter: true },
  { cn_code: '7614', sector_id: 'aluminium', description: 'Cables y trenzas de aluminio', gas: 'CO2, PFC', is_chapter: true },
  { cn_code: '7616', sector_id: 'aluminium', description: 'Las demás manufacturas de aluminio', gas: 'CO2, PFC', is_chapter: true },
]

const EXCLUDED_COUNTRIES = [
  { country_code: 'IS', country_name: 'Islandia', reason: 'Miembro del EEE con EU ETS', exclusion_type: 'ets' },
  { country_code: 'LI', country_name: 'Liechtenstein', reason: 'Miembro del EEE con EU ETS', exclusion_type: 'ets' },
  { country_code: 'NO', country_name: 'Noruega', reason: 'Miembro del EEE con EU ETS', exclusion_type: 'ets' },
  { country_code: 'CH', country_name: 'Suiza', reason: 'Acuerdo vinculado al EU ETS', exclusion_type: 'ets' },
  { country_code: 'XB', country_name: 'Büsingen', reason: 'Territorio especial UE', exclusion_type: 'territory' },
  { country_code: 'XH', country_name: 'Heligoland', reason: 'Territorio especial UE', exclusion_type: 'territory' },
  { country_code: 'XL', country_name: 'Livigno', reason: 'Territorio especial UE', exclusion_type: 'territory' },
]

const EMISSION_FACTORS = [
  // Cemento
  { sector_id: 'cement', product_key: 'clinker', product_name: 'Clínker', factor_value: 0.951, applicable_cn_codes: ['25231000'] },
  { sector_id: 'cement', product_key: 'portland', product_name: 'Cemento Portland', factor_value: 0.693, applicable_cn_codes: ['25232100', '25232900'] },
  { sector_id: 'cement', product_key: 'aluminous', product_name: 'Cemento Aluminoso', factor_value: 1.124, applicable_cn_codes: ['25233000'] },
  { sector_id: 'cement', product_key: 'other_cement', product_name: 'Otros cementos hidráulicos', factor_value: 0.693, applicable_cn_codes: ['25239000'] },
  // Hierro y Acero
  { sector_id: 'ironSteel', product_key: 'pig_iron', product_name: 'Arrabio / Fundición en bruto', factor_value: 1.600, applicable_cn_codes: ['7201'] },
  { sector_id: 'ironSteel', product_key: 'crude_steel', product_name: 'Acero bruto', factor_value: 1.080, applicable_cn_codes: ['7206', '7207'] },
  { sector_id: 'ironSteel', product_key: 'iron_products', product_name: 'Productos de hierro/acero', factor_value: 1.210, applicable_cn_codes: ['7208', '7209', '7210', '7301', '7302', '7304', '7305', '7306', '7307', '7308', '7309', '7310', '7311', '7318', '7326'] },
  // Aluminio
  { sector_id: 'aluminium', product_key: 'unwrought', product_name: 'Aluminio en bruto', factor_value: 6.600, applicable_cn_codes: ['7601'] },
  { sector_id: 'aluminium', product_key: 'alu_products', product_name: 'Productos de aluminio', factor_value: 7.100, applicable_cn_codes: ['7603', '7604', '7605', '7606', '7607', '7608', '7609', '7610', '7611', '7612', '7613', '7614', '7616'] },
  // Fertilizantes
  { sector_id: 'fertilizers', product_key: 'ammonia', product_name: 'Amoniaco', factor_value: 2.126, applicable_cn_codes: ['2814'] },
  { sector_id: 'fertilizers', product_key: 'nitric_acid', product_name: 'Ácido nítrico', factor_value: 2.840, applicable_cn_codes: ['28080000'] },
  { sector_id: 'fertilizers', product_key: 'urea', product_name: 'Urea / Fertilizantes nitrogenados', factor_value: 1.570, applicable_cn_codes: ['3102', '3105'] },
  // Hidrógeno
  { sector_id: 'hydrogen', product_key: 'hydrogen', product_name: 'Hidrógeno', factor_value: 9.000, applicable_cn_codes: ['28041000'] },
]

const BENCHMARKS = [
  // Cemento
  { sector_id: 'cement', benchmark_key: 'clinkerGrey', description: 'Clínker de cemento gris', value: 0.666, is_default: true, year_from: 2026 },
  { sector_id: 'cement', benchmark_key: 'clinkerWhite', description: 'Clínker de cemento blanco', value: 0.859, year_from: 2026 },
  { sector_id: 'cement', benchmark_key: 'aluminousCement_2026', description: 'Cemento aluminoso (2026-2027)', value: 0.717, year_from: 2026, year_to: 2027 },
  { sector_id: 'cement', benchmark_key: 'aluminousCement_2028', description: 'Cemento aluminoso (2028-2030)', value: 0.686, year_from: 2028, year_to: 2030 },
  // Hierro y Acero
  { sector_id: 'ironSteel', benchmark_key: 'carbonSteel_BF_BOF', description: 'Acero carbono BF/BOF (alto horno)', value: 1.420, year_from: 2026 },
  { sector_id: 'ironSteel', benchmark_key: 'carbonSteel_DRI_EAF', description: 'Acero carbono DRI/EAF (reducción directa)', value: 0.746, year_from: 2026 },
  { sector_id: 'ironSteel', benchmark_key: 'carbonSteel_Scrap_EAF', description: 'Acero carbono Scrap/EAF (chatarra)', value: 0.266, year_from: 2026 },
  { sector_id: 'ironSteel', benchmark_key: 'lowAlloy_BF_BOF', description: 'Acero baja aleación BF/BOF', value: 1.490, year_from: 2026 },
  { sector_id: 'ironSteel', benchmark_key: 'lowAlloy_DRI_EAF', description: 'Acero baja aleación DRI/EAF', value: 0.783, year_from: 2026 },
  { sector_id: 'ironSteel', benchmark_key: 'lowAlloy_Scrap_EAF', description: 'Acero baja aleación Scrap/EAF', value: 0.279, year_from: 2026 },
  { sector_id: 'ironSteel', benchmark_key: 'highAlloy_EAF', description: 'Acero alta aleación EAF', value: 0.352, year_from: 2026 },
  { sector_id: 'ironSteel', benchmark_key: 'stainlessSteel', description: 'Acero inoxidable', value: 1.010, year_from: 2026 },
  { sector_id: 'ironSteel', benchmark_key: 'default', description: 'Benchmark general hierro/acero', value: 0.850, is_default: true, year_from: 2026 },
  // Aluminio
  { sector_id: 'aluminium', benchmark_key: 'primary', description: 'Aluminio primario (electrolisis)', value: 2.090, year_from: 2026 },
  { sector_id: 'aluminium', benchmark_key: 'secondary', description: 'Aluminio secundario (reciclado)', value: 0.289, year_from: 2026 },
  { sector_id: 'aluminium', benchmark_key: 'default', description: 'Benchmark general aluminio', value: 1.500, is_default: true, year_from: 2026 },
  // Fertilizantes
  { sector_id: 'fertilizers', benchmark_key: 'ammonia', description: 'Amoniaco anhidro', value: 1.522, year_from: 2026 },
  { sector_id: 'fertilizers', benchmark_key: 'ammoniaAqueous', description: 'Amoniaco en solución acuosa', value: 0.457, year_from: 2026 },
  { sector_id: 'fertilizers', benchmark_key: 'nitricAcid', description: 'Ácido nítrico', value: 0.582, year_from: 2026 },
  { sector_id: 'fertilizers', benchmark_key: 'urea', description: 'Urea en solución', value: 0.304, year_from: 2026 },
  { sector_id: 'fertilizers', benchmark_key: 'potassiumNitrate', description: 'Nitrato de potasio', value: 0.626, year_from: 2026 },
  { sector_id: 'fertilizers', benchmark_key: 'default', description: 'Benchmark general fertilizantes', value: 0.600, is_default: true, year_from: 2026 },
  // Hidrógeno
  { sector_id: 'hydrogen', benchmark_key: 'hydrogen', description: 'Hidrógeno', value: 5.089, is_default: true, year_from: 2026 },
  // Electricidad
  { sector_id: 'electricity', benchmark_key: 'default', description: 'Sin benchmark - factor de red del país', value: 0.000, is_default: true, year_from: 2026 },
]

const CERTIFICATES = [
  { code: 'Y128', description: 'Número de cuenta CBAM del declarante autorizado', is_required: true, condition_code: 'Y001', sort_order: 1 },
  { code: 'Y134', description: 'Exención: Mercancías originarias de Büsingen, Heligoland o Livigno', is_required: false, condition_code: 'Y003', sort_order: 2 },
  { code: 'Y135', description: 'Exención: Mercancías para uso militar', is_required: false, condition_code: 'Y005', sort_order: 3 },
  { code: 'Y136', description: 'Exención: Electricidad/hidrógeno de zona económica exclusiva UE', is_required: false, condition_code: 'Y007', applies_to_sectors: ['electricity', 'hydrogen'], sort_order: 4 },
  { code: 'Y137', description: 'Exención de minimis (< 50t/año)', is_required: false, condition_code: 'Y007/E15', not_applies_to_sectors: ['electricity', 'hydrogen'], sort_order: 5 },
  { code: 'Y237', description: 'Mercancías de origen UE', is_required: false, condition_code: 'Y009', sort_order: 6 },
  { code: 'Y238', description: 'Solicitud de declarante autorizado presentada antes del 31/03/2026', is_required: false, condition_code: 'Y011', valid_until: '2026-09-27', sort_order: 7 },
]

const TIMELINE = [
  { event_date: '2026-01-01', title: 'CBAM Definitivo', description: 'Fin del período transitorio. Comienza la obligación de compra de certificados CBAM.', event_type: 'critical', quarter_label: 'Inicio CBAM Definitivo', icon: '🚨', sort_order: 1 },
  { event_date: '2026-03-31', title: 'Límite Solicitud Declarante Autorizado', description: 'Fecha límite para solicitar el certificado de declarante autorizado CBAM.', event_type: 'critical', quarter_label: 'Q1 2026 - Registro', icon: '📝', sort_order: 2 },
  { event_date: '2026-05-31', title: 'Primer Informe CBAM 2026', description: 'Presentación del informe trimestral Q1 2026.', event_type: 'deadline', quarter_label: 'Q1 2026 - Informe', icon: '📊', sort_order: 3 },
  { event_date: '2026-07-31', title: 'Informe CBAM Q2 2026', description: 'Presentación del informe trimestral Q2 2026.', event_type: 'deadline', quarter_label: 'Q2 2026 - Informe', icon: '📊', sort_order: 4 },
  { event_date: '2026-10-31', title: 'Informe CBAM Q3 2026', description: 'Presentación del informe trimestral Q3 2026.', event_type: 'deadline', quarter_label: 'Q3 2026 - Informe', icon: '📊', sort_order: 5 },
  { event_date: '2027-01-01', title: 'Precio Semanal Certificados', description: 'Comienza el cálculo semanal del precio de certificados CBAM (antes era trimestral).', event_type: 'milestone', quarter_label: 'Nueva metodología precios', icon: '📈', is_new: true, sort_order: 6 },
  { event_date: '2027-01-31', title: 'Informe CBAM Q4 2026', description: 'Presentación del informe trimestral Q4 2026 (último del primer año definitivo).', event_type: 'deadline', quarter_label: 'Q4 2026 - Informe', icon: '📊', sort_order: 7 },
  { event_date: '2027-05-31', title: 'Declaración Anual CBAM 2026', description: 'Presentación de la declaración anual CBAM para el año 2026.', event_type: 'critical', quarter_label: 'Declaración Anual 2026', icon: '📋', sort_order: 8 },
  { event_date: '2027-09-30', title: 'Primera Entrega de Certificados', description: 'Fecha límite para la entrega de certificados CBAM correspondientes al año 2026.', event_type: 'critical', quarter_label: 'Entrega Certificados 2026', icon: '🎫', is_new: true, sort_order: 9 },
  { event_date: '2028-01-01', title: 'Extensión Productos Downstream', description: 'Aplicación del CBAM a ~180 códigos CN adicionales de manufacturas de acero y aluminio.', event_type: 'milestone', quarter_label: 'Ampliación sectores', icon: '🏭', is_new: true, sort_order: 10 },
  { event_date: '2028-05-31', title: 'Declaración Anual CBAM 2027', description: 'Presentación de la declaración anual CBAM para el año 2027.', event_type: 'deadline', quarter_label: 'Declaración Anual 2027', icon: '📋', sort_order: 11 },
  { event_date: '2034-01-01', title: 'Eliminación Total Derechos Gratuitos', description: 'Finaliza la transición. El CBAM cubre el 100% de las emisiones sin ajuste por asignación gratuita.', event_type: 'milestone', quarter_label: 'CBAM 100%', icon: '🎯', is_new: true, sort_order: 12 },
]

const MARKUP = [
  { year: 2026, markup_pct: 0.10, label: '+10%', description: 'Año de transición', regulation_ref: 'C(2025) 8552' },
  { year: 2027, markup_pct: 0.20, label: '+20%', description: 'Incremento intermedio', regulation_ref: 'C(2025) 8552' },
  { year: 2028, markup_pct: 0.30, label: '+30%', description: 'Penalización completa (permanente)', regulation_ref: 'C(2025) 8552' },
]

const REGULATIONS = [
  { reference: 'Reg (UE) 2023/956', title: 'Reglamento CBAM - Texto principal', regulation_type: 'regulation', status: 'in_force', effective_date: '2023-10-01', summary: 'Establece el Mecanismo de Ajuste en Frontera por Carbono' },
  { reference: 'Reg (UE) 2023/1773', title: 'Reglamento de Ejecución - Período transitorio', regulation_type: 'implementing', status: 'in_force', effective_date: '2023-10-01', summary: 'Reglas detalladas para el período transitorio CBAM' },
  { reference: 'Reg (UE) 2025/2083', title: 'Simplificación CBAM', regulation_type: 'implementing', status: 'in_force', effective_date: '2025-01-01', summary: 'Medidas de simplificación del CBAM' },
  { reference: 'C(2025) 8560', title: 'Precios de certificados CBAM', regulation_type: 'implementing', status: 'in_force', effective_date: '2026-01-01', summary: 'Metodología de cálculo de precios de certificados CBAM basados en EU ETS' },
  { reference: 'C(2025) 8552', title: 'Valores por defecto con markup', regulation_type: 'delegated', status: 'in_force', effective_date: '2026-01-01', summary: 'Penalización progresiva sobre valores por defecto de emisiones' },
  { reference: 'COM(2025) 989', title: 'Extensión a productos downstream', regulation_type: 'proposal', status: 'proposed', summary: 'Propuesta de extensión del CBAM a ~180 códigos CN de acero y aluminio downstream' },
  { reference: 'TAXUD.B.5.003/ES', title: 'Guía técnica CBAM', regulation_type: 'guidance', status: 'in_force', effective_date: '2025-12-04', summary: 'Documento técnico de orientación para la aplicación del CBAM' },
]

const CONFIG = [
  { key: 'de_minimis_threshold', value: { mass_threshold: 50, emissions_target: 0.99, description: 'Importadores con menos de 50 toneladas anuales de mercancías CBAM están exentos', applies_to: ['cement', 'fertilizers', 'ironSteel', 'aluminium'], not_applies_to: ['electricity', 'hydrogen'] }, description: 'Umbral de minimis CBAM' },
  { key: 'certificate_pricing', value: { 2026: { period: 'trimestral', calculation: 'Media ponderada de precios de subasta EU ETS del trimestre anterior' }, 2027: { period: 'semanal', calculation: 'Media ponderada de precios de subasta EU ETS de la semana anterior' }, unit: 'EUR/tCO2e', precision: 2, source: 'Precios de subasta EU ETS (EEX, ICE)' }, description: 'Metodología de precios de certificados' },
  { key: 'downstream_extension', value: { effective_date: '2028-01-01', status: 'proposed', regulation: 'COM(2025) 989', new_cn_codes: 180, new_importers: 7500, new_smes: 3850 }, description: 'Extensión a productos downstream de acero y aluminio' },
]

// ============================================================
// FUNCIONES DE INSERCIÓN
// ============================================================

async function seedTable(tableName, data, options = {}) {
  const { onConflict } = options
  console.log(`\n📦 Insertando ${data.length} registros en ${tableName}...`)

  const query = supabase.from(tableName).upsert(data, {
    onConflict: onConflict || undefined,
    ignoreDuplicates: false
  })

  const { data: result, error } = await query.select()

  if (error) {
    console.error(`  ❌ Error en ${tableName}:`, error.message)
    return false
  }

  console.log(`  ✅ ${result?.length || data.length} registros insertados`)
  return true
}

async function main() {
  console.log('🚀 Iniciando seed de datos CBAM...')
  console.log(`   Supabase URL: ${supabaseUrl}`)
  console.log('')

  let success = true

  // Orden importa por las foreign keys
  success = await seedTable('cbam_sectors', SECTORS, { onConflict: 'id' }) && success
  success = await seedTable('cbam_cn_codes', CN_CODES, { onConflict: 'cn_code,effective_from' }) && success
  success = await seedTable('cbam_excluded_countries', EXCLUDED_COUNTRIES, { onConflict: 'country_code' }) && success
  success = await seedTable('cbam_emission_factors', EMISSION_FACTORS) && success
  success = await seedTable('cbam_benchmarks', BENCHMARKS) && success
  success = await seedTable('cbam_certificates', CERTIFICATES, { onConflict: 'code' }) && success
  success = await seedTable('cbam_timeline', TIMELINE) && success
  success = await seedTable('cbam_default_value_markup', MARKUP, { onConflict: 'year' }) && success
  success = await seedTable('cbam_regulations', REGULATIONS, { onConflict: 'reference' }) && success
  success = await seedTable('cbam_config', CONFIG, { onConflict: 'key' }) && success

  // Precio ETS - insertar un precio de referencia actual
  // NOTA: Actualizar este precio con el valor real actual antes de ejecutar
  const etsPrice = [{
    price: 68.50,
    price_date: '2026-03-13',
    price_type: 'reference',
    source: 'manual',
    is_current: true
  }]
  success = await seedTable('cbam_ets_prices', etsPrice) && success

  console.log('\n' + '='.repeat(50))
  if (success) {
    console.log('✅ Seed completado correctamente')
    console.log('\n⚠️  IMPORTANTE: Actualiza el precio EU ETS en cbam_ets_prices')
    console.log('   con el valor real actual antes de ir a producción.')
  } else {
    console.log('⚠️  Seed completado con algunos errores. Revisa los mensajes anteriores.')
  }
}

main().catch(console.error)
