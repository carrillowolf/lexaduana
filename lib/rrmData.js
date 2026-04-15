// ─────────────────────────────────────────────────────────────
// RRM — datos estáticos del módulo de Solicitud de Devolución/
// Condonación de Derechos (formulario AEAT, art. 116-120 CAU).
// ─────────────────────────────────────────────────────────────

// Casos tipo: cada uno define su base jurídica, los tributos
// típicamente afectados y una plantilla del campo "motivos" (48 13).
export const RRM_CASE_TYPES = [
  {
    id: 'preferencia_arancelaria',
    icon: '🏷️',
    title: 'Error de preferencia arancelaria',
    description:
      'Se declaró preferencia incorrecta (ej: 100 en lugar de 300) o no se aplicó preferencia existiendo derecho a ella.',
    legalBasis: 'A',
    affectedDuties: ['A00', 'B00'],
    templateMotivos:
      'Por un error {{tipo_error}}, habiéndose indicado la clave {{documento_origen}} y tanto el País de origen como el País de origen preferencial {{pais_origen}}, {{descripcion_error}}. Solicitamos regularizarlo {{antes_despues_pago}}.',
    example: 'Se declaró preferencia 100 (erga omnes) cuando correspondía 300 (acuerdo EFTA/Suiza)',
  },
  {
    id: 'clasificacion_arancelaria',
    icon: '🔢',
    title: 'Error de clasificación arancelaria',
    description:
      'El código TARIC declarado es incorrecto, generando un tipo de derecho distinto al que corresponde.',
    legalBasis: 'A',
    affectedDuties: ['A00', 'B00'],
    templateMotivos:
      'El código de mercancía declarado fue {{codigo_declarado}} cuando el correcto es {{codigo_correcto}}, lo que modifica el tipo arancelario aplicable de {{tipo_declarado}}% a {{tipo_correcto}}%. Se solicita la devolución de la diferencia.',
    example: 'Se declaró 3920.43.10.99 (6,5%) cuando correspondía 3920.43.10.00 (0%)',
  },
  {
    id: 'error_origen',
    icon: '🌍',
    title: 'Error de origen',
    description: 'País de origen mal declarado que afecta a antidumping, contingentes o preferencias.',
    legalBasis: 'A',
    affectedDuties: ['A00', 'A30', 'B00'],
    templateMotivos:
      'El país de origen declarado fue {{origen_declarado}} cuando el correcto es {{origen_correcto}}, afectando a {{medida_afectada}}. Se adjunta prueba de origen {{tipo_prueba}}.',
    example: 'Se declaró origen CN (con antidumping), pero el origen real es TW (sin antidumping)',
  },
  {
    id: 'error_valoracion',
    icon: '💰',
    title: 'Error de valoración en aduana',
    description:
      'Valor en aduana incorrecto por error en Incoterm, doble imputación de flete, adiciones/deducciones mal aplicadas.',
    legalBasis: 'A',
    affectedDuties: ['A00', 'B00'],
    templateMotivos:
      'El valor en aduana declarado fue {{valor_declarado}} EUR cuando el correcto es {{valor_correcto}} EUR, debido a {{causa_error_valor}}. Se solicita la devolución correspondiente.',
    example: 'Se declaró EXW pero se incluyó el flete en el valor facturado, generando doble imputación',
  },
  {
    id: 'mercancia_defectuosa',
    icon: '🔧',
    title: 'Mercancía defectuosa o incumplimiento contractual',
    description: 'La mercancía recibida no se ajusta a lo contratado, está dañada o es defectuosa.',
    legalBasis: 'B',
    affectedDuties: ['A00', 'B00'],
    templateMotivos:
      'La mercancía importada resultó {{tipo_defecto}} conforme al artículo 118 del CAU. Se adjunta {{documentacion_defecto}}. Las mercancías {{destino_mercancia}}.',
    example: 'Mercancía dañada durante el transporte, no apta para su uso comercial',
  },
  {
    id: 'error_autoridad',
    icon: '🏛️',
    title: 'Error de la autoridad aduanera',
    description: 'La propia administración aduanera cometió un error que generó un cobro excesivo.',
    legalBasis: 'C',
    affectedDuties: ['A00', 'B00'],
    templateMotivos:
      'Las autoridades aduaneras incurrieron en un error al {{descripcion_error_autoridad}}, lo que generó un cobro excesivo de derechos. Se solicita la condonación conforme al artículo 119 del CAU.',
    example: 'La aduana aplicó un tipo arancelario incorrecto al procesar la declaración',
  },
]

export const REQUEST_TYPES = {
  REM: {
    code: 'REM',
    label: 'Condonación (Remission)',
    description: 'Cuando la deuda aduanera aún no se ha pagado',
  },
  REP: {
    code: 'REP',
    label: 'Devolución (Repayment)',
    description: 'Cuando la deuda aduanera ya se ha pagado',
  },
}

// Códigos de tipo de derecho (casilla 48 08).
export const DUTY_CODES = {
  A00: 'Derechos de importación',
  A20: 'Derechos adicionales',
  A30: 'Derechos antidumping definitivos',
  A35: 'Derechos antidumping provisionales',
  A40: 'Derechos compensatorios definitivos',
  A45: 'Derechos compensatorios provisionales',
  B00: 'IVA (Importación)',
  B01: 'Recargo de equivalencia',
  C00: 'Derechos de exportación',
  E00: 'Derechos percibidos por cuenta de otros países',
  '1PL': 'Impuesto sobre envases de plástico no reutilizables',
  '1CF': 'Impuesto sobre Gases Fluorados',
}

// Bases jurídicas (art. 116-120 CAU).
export const LEGAL_BASES = {
  A: { code: 'A', article: '117', description: 'Cobro excesivo de importes de derechos' },
  B: { code: 'B', article: '118', description: 'Mercancías defectuosas o incumplimiento contractual' },
  C: { code: 'C', article: '119', description: 'Error de las autoridades competentes' },
  D: { code: 'D', article: '120', description: 'Equidad' },
  E: { code: 'E', article: '116.1', description: 'Declaración invalidada conforme al artículo 174' },
}

// Aduanas españolas — código LOCODE para casillas 31 07 / 48 02 / 48 03.
export const SPANISH_CUSTOMS_OFFICES = [
  { code: 'ESALG000', name: 'Algeciras' },
  { code: 'ESBCN000', name: 'Barcelona' },
  { code: 'ESBIO000', name: 'Bilbao' },
  { code: 'ESIRU000', name: 'Irún' },
  { code: 'ESLPA000', name: 'Las Palmas' },
  { code: 'ESMAD000', name: 'Madrid' },
  { code: 'ESMLG000', name: 'Málaga' },
  { code: 'ESVLC000', name: 'Valencia' },
  { code: 'ESVGO000', name: 'Vigo' },
  { code: 'ESSCT000', name: 'Santa Cruz de Tenerife' },
  { code: 'ESSDR000', name: 'Santander' },
  { code: 'ESSVQ000', name: 'Sevilla' },
  { code: 'ESTAR000', name: 'Tarragona' },
  { code: 'ESACE000', name: 'Alicante' },
  { code: 'ESPMI000', name: 'Palma de Mallorca' },
  { code: 'ESCAD000', name: 'Cádiz' },
  { code: 'ESLCG000', name: 'A Coruña' },
  { code: 'ESZAZ000', name: 'Zaragoza' },
]

// Códigos de régimen aduanero (casilla 48 05). Se combinan de dos en
// dos → 4 dígitos (ej: 4000 = libre práctica + consumo, sin previo).
export const CUSTOMS_REGIMES = {
  '00': 'Sin régimen precedente',
  '01': 'Libre práctica con reexpedición (zonas no-Directiva 2006/112/CE)',
  '07': 'Libre práctica + depósito sin IVA/IIEE',
  10: 'Exportación definitiva',
  11: 'Exportación productos transformados (perfeccionamiento activo)',
  21: 'Exportación temporal (perfeccionamiento pasivo)',
  22: 'Exportación temporal (otros)',
  23: 'Exportación temporal sin transformar',
  31: 'Reexportación',
  40: 'Libre práctica + consumo',
  42: 'Libre práctica + entrega exenta IVA a otro EEMM',
  43: 'Libre práctica (adhesión nuevos EEMM)',
  44: 'Destino final (exención/reducción)',
  45: 'Libre práctica parcial + depósito sin IVA/IIEE',
  46: 'Importación transformados (perfeccionamiento pasivo pre-exportación)',
  48: 'Productos sustitución (perfeccionamiento pasivo)',
  51: 'Perfeccionamiento activo',
  53: 'Importación temporal',
  54: 'Perfeccionamiento activo en otro EEMM',
  61: 'Reimportación + libre práctica + consumo',
  63: 'Reimportación + libre práctica + entrega exenta IVA otro EEMM',
  68: 'Reimportación parcial + depósito',
  71: 'Depósito aduanero',
  76: 'Depósito aduanero UE (art. 237.2 CAU)',
  77: 'Fabricación UE bajo vigilancia aduanera (restituciones)',
  78: 'Zona franca',
  95: 'Depósito no aduanero sin IVA/IIEE',
  96: 'Depósito no aduanero sin IVA/IIEE + suspensión otros impuestos',
}

// Códigos de cualificador para la ubicación de mercancías (34 08, CL-3405).
export const LOCATION_QUALIFIERS = {
  T: 'Dirección postal (código postal ± nº casa)',
  U: 'LOCODE/NU',
  V: 'Identificador de aduana',
  W: 'Coordenadas GPS (grados decimales)',
  X: 'Número EORI',
  Y: 'Número de autorización (instalación de almacenamiento)',
  Z: 'Dirección completa',
}

// ─────────────────────────────────────────────────────────────
// Helpers de validación
// ─────────────────────────────────────────────────────────────

// MRN español: 18 caracteres alfanuméricos, posiciones 3-4 = "ES".
export const MRN_REGEX = /^[0-9]{2}ES[0-9A-Z]{14}$/i

// EORI español: ES + (letra/dígito) + 8 dígitos.
export const EORI_ES_REGEX = /^ES[A-Z0-9][0-9]{8}$/i

// Aduana ES: 8 caracteres, empieza por ES.
export const CUSTOMS_OFFICE_REGEX = /^ES[A-Z0-9]{6}$/i

// IBAN básico (no validación módulo 97, sólo formato).
export const IBAN_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/i

// Devuelve true si la fecha de aceptación está a menos de 6 meses
// del límite de 3 años (art. 121.1.a CAU).
export function isCloseTo3YearLimit(acceptanceDateISO) {
  if (!acceptanceDateISO) return false
  const accepted = new Date(acceptanceDateISO)
  if (Number.isNaN(accepted.getTime())) return false
  const limit = new Date(accepted)
  limit.setFullYear(limit.getFullYear() + 3)
  const sixMonthsBefore = new Date(limit)
  sixMonthsBefore.setMonth(sixMonthsBefore.getMonth() - 6)
  const now = new Date()
  return now >= sixMonthsBefore && now <= limit
}

export function getCaseById(id) {
  return RRM_CASE_TYPES.find((c) => c.id === id) || null
}
