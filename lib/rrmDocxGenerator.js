// ─────────────────────────────────────────────────────────────
// Generador del DOCX para la Solicitud de Devolución/Condonación
// de Derechos (formulario AEAT — art. 116-120 CAU).
//
// Estructura del documento:
//   Página 1 — Cabecera con bandera UE + REQUISITOS COMUNES + ESPECÍFICOS
//   Página 2 — Notas al pie (común + específicos)
//   Página 3 — Anexo I: liquidación a regularizar
//
// Etiquetas y notas siempre en castellano (modelo oficial AEAT
// dirigido a la Administración española), independientemente del
// idioma de UI.
//
// La librería `docx` se usa server-side; este módulo NO debe
// importarse desde componentes cliente.
// ─────────────────────────────────────────────────────────────

import fs from 'fs'
import path from 'path'
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  ImageRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  HeightRule,
  PageBreak,
  VerticalAlign,
} from 'docx'
import { DUTY_CODES, LEGAL_BASES, REQUEST_TYPES, CUSTOMS_REGIMES } from '@/lib/rrmData'

// ── Texto por defecto para casilla 48 10 (Uso o destino) ─────
// Caso típico: la mercancía objeto del DUA original se acondiciona
// para reventa. Editable desde aquí si en el futuro se decide.
export const DEFAULT_USO_DESTINO = 'Acondicionada para la venta'

// ── Constantes de estilo ─────────────────────────────────────
const FONT = 'Arial'
const FONT_SIZE_BODY = 20 // half-points → 10pt
const FONT_SIZE_SMALL = 16 // 8pt
const FONT_SIZE_NOTES = 18 // 9pt
const FONT_SIZE_HEADER = 22 // 11pt
const FONT_SIZE_TITLE = 22 // 11pt

// Tres niveles de cabecera (commit 7)
const SHADING = {
  BLOCK_MASTER: 'B4D4E5', // Azul claro — REQUISITOS COMUNES, REQUISITOS ESPECÍFICOS
  SECTION: 'D9D9D9', // Gris claro — sub-secciones (Partes, Fechas, etc.)
  NOTES_HEADER: 'D9D2E9', // Lila — Notas relativas...
}
// Shadings legados que sólo se usan ya en el Anexo I (no tocar).
const SHADE_HEADER = 'D5E8F0'
const SHADE_SECTION = 'F2F2F2'

const SINGLE_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
}
// Bordes completos (incluye insideHorizontal/insideVertical) para
// tablas con múltiples filas/columnas que deben mostrar todas las
// líneas internas — caso de las macro-tablas de REQUISITOS COMUNES /
// ESPECÍFICOS (commit 9).
const TABLE_FULL_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
}
const NO_BORDER = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
}

// ── Carga de la bandera UE (lazy, una sola vez por proceso) ──
let _flagBuffer = null
function getFlagBuffer() {
  if (_flagBuffer !== null) return _flagBuffer
  try {
    const flagPath = path.join(process.cwd(), 'public', 'assets', 'eu-flag.png')
    _flagBuffer = fs.readFileSync(flagPath)
  } catch (_err) {
    _flagBuffer = false // marcador de "no disponible"
  }
  return _flagBuffer
}

// ── Helpers ──────────────────────────────────────────────────
function p(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before: 0, after: 40 },
    children: [
      new TextRun({
        text: text == null ? '' : String(text),
        font: FONT,
        size: opts.size || FONT_SIZE_BODY,
        bold: !!opts.bold,
        color: opts.color || '000000',
      }),
    ],
  })
}

function cell({ text, bold = false, shade = null, width = 50, colSpan, align }) {
  return new TableCell({
    width: { size: width * 50, type: WidthType.DXA }, // arbitrary, we'll set columnWidths on table
    columnSpan: colSpan,
    shading: shade ? { type: ShadingType.CLEAR, color: 'auto', fill: shade } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: Array.isArray(text)
      ? text
      : [p(text, { bold, align })],
  })
}

function fmtMoney(n, currency = 'EUR') {
  if (n == null || Number.isNaN(Number(n))) return ''
  return `${Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

function fmtRegime(code) {
  if (!code) return ''
  const a = String(code).slice(0, 2)
  const b = String(code).slice(2, 4)
  const aLabel = CUSTOMS_REGIMES[a] || CUSTOMS_REGIMES[Number(a)]
  const bLabel = CUSTOMS_REGIMES[b] || CUSTOMS_REGIMES[Number(b)]
  return `${code} — ${aLabel || ''}${bLabel ? ` / ${bLabel}` : ''}`
}

// ── Construcción del documento ───────────────────────────────

// Cabecera del documento: bandera UE (img) + título oficial centrado
// en una tabla 1×2 sin bordes.
function buildDocumentHeader() {
  const flag = getFlagBuffer()
  const flagChildren = flag
    ? [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 0 },
          children: [
            new ImageRun({
              data: flag,
              transformation: { width: 80, height: 53 },
              type: 'png',
            }),
          ],
        }),
      ]
    : [p('UE', { bold: true })] // Fallback degradado si la imagen no es accesible

  const titleChildren = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 60, after: 0 },
      children: [
        new TextRun({
          text: 'SOLICITUD RELATIVA A LA DEVOLUCIÓN O CONDONACIÓN DE LOS IMPORTES',
          bold: true,
          font: FONT,
          size: FONT_SIZE_TITLE,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: 'DE LOS DERECHOS DE IMPORTACIÓN O DE EXPORTACIÓN',
          bold: true,
          font: FONT,
          size: FONT_SIZE_TITLE,
        }),
      ],
    }),
  ]

  return [
    new Table({
      width: { size: 9000, type: WidthType.DXA },
      columnWidths: [2250, 6750],
      borders: NO_BORDER,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 2250, type: WidthType.DXA },
              borders: NO_BORDER,
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 0, bottom: 0, left: 0, right: 100 },
              children: flagChildren,
            }),
            new TableCell({
              width: { size: 6750, type: WidthType.DXA },
              borders: NO_BORDER,
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 0, bottom: 0, left: 100, right: 0 },
              children: titleChildren,
            }),
          ],
        }),
      ],
    }),
    p('', { size: FONT_SIZE_BODY }), // separación ~12pt
  ]
}

// Contenido de una casilla: array de Paragraphs con la etiqueta del
// campo (`XX YY – Texto (N)`) seguida del cuerpo editable. NO crea
// TableCell ni TableRow; se compone con los helpers de fila/celda.
function buildFieldContent(code, label, footnoteRef, body) {
  const headerChildren = [
    new TextRun({
      text: code,
      bold: true,
      font: FONT,
      size: FONT_SIZE_SMALL,
    }),
  ]
  if (label) {
    headerChildren.push(
      new TextRun({
        text: ` – ${label}`,
        font: FONT,
        size: FONT_SIZE_SMALL,
      }),
    )
  }
  if (footnoteRef) {
    headerChildren.push(
      new TextRun({
        text: ` (${footnoteRef})`,
        font: FONT,
        size: FONT_SIZE_SMALL,
      }),
    )
  }
  const bodyParagraphs = Array.isArray(body) ? body : [p(body || '', { bold: false })]
  return [
    new Paragraph({
      spacing: { before: 0, after: 60 },
      children: headerChildren,
    }),
    ...bodyParagraphs,
  ]
}

// Celda con el contenido de un campo. widthPercent ∈ (0, 100].
function buildFieldCellNode(code, label, footnoteRef, body, widthPercent = 100) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    borders: SINGLE_BORDER,
    verticalAlign: VerticalAlign.TOP,
    margins: { top: 80, bottom: 120, left: 120, right: 120 },
    children: buildFieldContent(code, label, footnoteRef, body),
  })
}

// ── Helpers para macro-tabla continua (commit 9) ─────────────
// Producen TableRow (no Tables) para insertarse dentro de una
// única Table que recorre todo el bloque (REQUISITOS COMUNES /
// ESPECÍFICOS), de forma que las cabeceras de bloque y de sección
// quedan fundidas en el mismo marco que las casillas.

const MACRO_TOTAL_COLUMNS = 6 // mcm de 2 y 3 (filas 2-col y 3-col)

function masterHeaderRow(text, totalColumns = MACRO_TOTAL_COLUMNS) {
  return new TableRow({
    height: { value: 380, rule: HeightRule.ATLEAST },
    children: [
      new TableCell({
        columnSpan: totalColumns,
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: SHADING.BLOCK_MASTER },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({ text, bold: true, font: FONT, size: FONT_SIZE_HEADER }),
            ],
          }),
        ],
      }),
    ],
  })
}

function sectionHeaderRow(text, totalColumns = MACRO_TOTAL_COLUMNS) {
  return new TableRow({
    height: { value: 320, rule: HeightRule.ATLEAST },
    children: [
      new TableCell({
        columnSpan: totalColumns,
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: SHADING.SECTION },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({ text, bold: true, font: FONT, size: FONT_SIZE_HEADER }),
            ],
          }),
        ],
      }),
    ],
  })
}

// cells: array de { code, label, footnoteRef, body, columnSpan }.
// La suma de columnSpan debe ser totalColumns.
function fieldRowMulti(cells, opts = {}) {
  return new TableRow({
    height: { value: 800, rule: HeightRule.ATLEAST },
    cantSplit: !!opts.cantSplit,
    children: cells.map(
      (c) =>
        new TableCell({
          columnSpan: c.columnSpan || 1,
          verticalAlign: VerticalAlign.TOP,
          margins: { top: 80, bottom: 120, left: 120, right: 120 },
          children: buildFieldContent(c.code, c.label, c.footnoteRef || null, c.body),
        }),
    ),
  })
}

// Conveniencia: fila de campo a ancho completo (1 cell, columnSpan = total).
function fieldRowFull(code, label, footnoteRef, body, opts = {}) {
  return fieldRowMulti(
    [{ code, label, footnoteRef, body, columnSpan: MACRO_TOTAL_COLUMNS }],
    opts,
  )
}

// REQUISITOS COMUNES — sub-secciones según modelo AEAT.
function buildCommonRequisitos(data) {
  const reqType = REQUEST_TYPES[data.requestType] || REQUEST_TYPES.REM

  // 33 06 — soporta tanto state.contact (paso 3) como state.contactPerson (string).
  const contactValue = data.contact
    ? [data.contact.name, data.contact.role, data.contact.email, data.contact.phone].filter(Boolean).join(' · ')
    : data.contactPerson || ''

  // 32 04 — documentación adjunta como lista o string suelto.
  let attachmentsValue = ''
  if (Array.isArray(data.attachments) && data.attachments.length) {
    attachmentsValue = data.attachments
      .map((a) => [a.name, a.id, a.date].filter(Boolean).join(' '))
      .join('; ')
  } else if (typeof data.attachments === 'string') {
    attachmentsValue = data.attachments
  }

  // Importer / Representative dirección como string consolidado.
  const fmtAddr = (addr) => {
    if (!addr) return ''
    if (typeof addr === 'string') return addr
    return [addr.line, addr.postcode, addr.city, addr.country].filter(Boolean).join(', ')
  }

  // 35 01 — texto consolidado o "Ver Anexo I" cuando hay multi-partida.
  const isMulti = Array.isArray(data.selectedItems) && data.selectedItems.length > 1
  const goodsInfo = isMulti
    ? 'Ver Anexo I'
    : [data.goodsDescription, data.commodityCode].filter(Boolean).join(' — ')
  const goodsDesignation = isMulti
    ? 'Ver Anexo I'
    : data.commodityCode || ''
  const goodsVolume = isMulti
    ? 'Ver Anexo I'
    : [data.netMass ? `${data.netMass} kg netos` : null, data.supplementaryUnits ? `${data.supplementaryUnits} ud.` : null]
        .filter(Boolean)
        .join(' · ')

  const importerIdBody = [
    p(data.importer?.eori || '', { bold: true }),
    ...(fmtAddr(data.importer?.address) ? [p(fmtAddr(data.importer?.address))] : []),
  ]
  const representativeIdBody = [
    p(data.representative?.eori || '', { bold: true }),
    ...(fmtAddr(data.representative?.address) ? [p(fmtAddr(data.representative?.address))] : []),
  ]

  // Macro-tabla única: cabeceras de bloque/sección y casillas en un
  // único marco continuo. Grid lógico de 6 columnas (mcm 2-col / 3-col).
  const rows = [
    masterHeaderRow('REQUISITOS COMUNES'),

    sectionHeaderRow('Información sobre la solicitud/decisión'),
    fieldRowMulti([
      { code: '31 01', label: 'Tipo de Código de Solicitud (REM/REP)', footnoteRef: '1', body: reqType.code, columnSpan: 2 },
      { code: '31 03', label: 'Tipo de Solicitud', body: data.subRequestType || '1', columnSpan: 2 },
      { code: '31 06', label: 'Número de referencia de la decisión', footnoteRef: '2', body: data.priorDecisionRef || '', columnSpan: 2 },
    ]),
    fieldRowMulti([
      { code: 'Firma/autenticación', label: '', body: '', columnSpan: 3 },
      { code: '31 07', label: 'Autoridad Aduanera que toma la decisión', footnoteRef: '3', body: data.customsOffice || '', columnSpan: 3 },
    ]),

    sectionHeaderRow('Referencias de documentos justificativos, certificados y autorizaciones'),
    fieldRowFull('32 04', 'Documentación Adjunta', null, attachmentsValue),

    sectionHeaderRow('Partes'),
    fieldRowMulti([
      { code: '33 01/33 02', label: 'Solicitante/titular de la autorización o la decisión', footnoteRef: '4', body: data.importer?.name || '', columnSpan: 3 },
      { code: 'Identificación del solicitante/titular de la autorización o la decisión', label: '', body: importerIdBody, columnSpan: 3 },
    ]),
    fieldRowMulti([
      { code: '33 03', label: 'Representante', footnoteRef: '5', body: data.representative?.name || '', columnSpan: 3 },
      { code: 'Identificación del representante', label: '', body: representativeIdBody, columnSpan: 3 },
    ]),
    fieldRowFull('33 06', 'Persona de contacto responsable de la solicitud', '*', contactValue),

    sectionHeaderRow('Fechas, horas, periodos y lugares'),
    fieldRowMulti([
      { code: '34 01', label: 'Lugar', body: data.place || data.applicationCity || 'Madrid', columnSpan: 2 },
      { code: '34 02', label: 'Fecha de la solicitud', body: data.requestDate || '', columnSpan: 2 },
      { code: '34 06', label: 'Fecha solicitada de entrada en vigor', body: data.effectiveDate || '', columnSpan: 2 },
    ]),
    fieldRowFull('34 08', 'Ubicación de las mercancías', '6', data.goodsLocation || ''),

    sectionHeaderRow('Identificación de las mercancías'),
    fieldRowMulti([
      { code: '35 01', label: 'Información sobre las mercancías', body: goodsInfo, columnSpan: 2 },
      { code: '35 01', label: 'Designación de las mercancías', body: goodsDesignation, columnSpan: 2 },
      { code: '35 01', label: 'Volumen de las mercancías', body: goodsVolume, columnSpan: 2 },
    ]),

    sectionHeaderRow('Otros'),
    fieldRowFull('38 05', 'Información Adicional', '*', data.additionalInfo || ''),
  ]

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [1500, 1500, 1500, 1500, 1500, 1500],
    borders: TABLE_FULL_BORDERS,
    rows,
  })
}

// REQUISITOS ESPECÍFICOS — modelo AEAT artículo 116-120 CAU.
function buildSpecificRequisitos(data) {
  const lb = LEGAL_BASES[data.legalBasis] || LEGAL_BASES.A
  const dutiesDecl = data.dutiesDeclared || {}
  const dutiesCorr = data.dutiesCorrected || {}
  const allCodes = Array.from(new Set([...Object.keys(dutiesDecl), ...Object.keys(dutiesCorr)]))

  // 48 07 — desglose A00/B00 con totales en EUR.
  const dutyDiff = (code) => Number(dutiesDecl[code] || 0) - Number(dutiesCorr[code] || 0)
  const fmtSimple = (n) => {
    if (n == null || Number.isNaN(Number(n))) return '0,00'
    return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  const lines4807 = []
  lines4807.push(p('EUR', { bold: true }))
  let total4807 = 0
  for (const code of allCodes) {
    const diff = dutyDiff(code)
    total4807 += diff
    const labelKind = code.startsWith('A') ? 'Arancel' : code.startsWith('B') ? 'IVA' : DUTY_CODES[code] || ''
    lines4807.push(p(`${code} (${labelKind}): ${fmtSimple(diff)} €`))
  }
  if (allCodes.length > 1) {
    lines4807.push(p(`Total: ${fmtSimple(total4807)} €`, { bold: true }))
  }

  // 48 08 — códigos de tributo.
  const types4808 = allCodes.length ? allCodes.join(', ') : ''

  // 48 09 — base jurídica del CAU.
  const legal4809 = lb.code
    ? `${lb.code} — Art. ${lb.article} CAU${lb.description ? ` — ${lb.description}` : ''}`
    : ''

  // 48 14 — datos bancarios estructurados, condicional al tipo REP/REM.
  let bank4814
  if (data.requestType === 'REP' && data.bank) {
    bank4814 = [
      p(`Nombre del titular de la cuenta: ${data.bank.holder || ''}`),
      p(`Cuenta: IBAN/Banco-BIC: ${data.bank.iban || ''} / ${data.bank.bic || ''}`),
    ]
  } else {
    bank4814 = [
      p('Nombre del titular de la cuenta:'),
      p('Cuenta: IBAN/Banco-BIC:'),
    ]
  }

  // 48 06 — valor en aduana consolidado.
  const customsVal = data.customsValue
  const value4806 = customsVal != null ? fmtMoney(customsVal, 'EUR') : ''

  // Macro-tabla única: cabecera de bloque y casillas en un único marco.
  // Grid lógico de 6 columnas. La fila 48 06/07/08 usa columnSpans 1/3/2
  // (≈17%/50%/33%) para dar más espacio a la columna 48 07 que tiene
  // texto y desglose internos.
  const rows = [
    masterHeaderRow('REQUISITOS ESPECÍFICOS'),

    fieldRowFull('48 01', 'Título de cobro', '7', data.mrn || ''),
    fieldRowMulti([
      {
        code: '48 02',
        label: 'Aduana donde se ha notificado la deuda aduanera',
        footnoteRef: '8',
        body: data.customsOffice || '',
        columnSpan: 3,
      },
      {
        code: '48 03',
        label: 'Aduana competente respecto del lugar donde están ubicadas las mercancías',
        footnoteRef: '9',
        body: data.customsCompetent || '',
        columnSpan: 3,
      },
    ]),
    fieldRowFull(
      '48 05',
      'Régimen aduanero (solicitud de cumplimiento previo de las formalidades)',
      '10',
      fmtRegime(data.requestedProcedure || '4000'),
    ),
    fieldRowMulti([
      { code: '48 06', label: 'Valor en aduana', footnoteRef: '11', body: value4806, columnSpan: 1 },
      {
        code: '48 07',
        label: 'Importe de los derechos de importación que se han de devolver o condonar, u otros gravámenes a la importación',
        footnoteRef: '12',
        body: lines4807,
        columnSpan: 3,
      },
      {
        code: '48 08',
        label: 'Tipo de derecho de importación u otros gravámenes a la importación.',
        footnoteRef: '13',
        body: types4808,
        columnSpan: 2,
      },
    ]),
    fieldRowFull('48 09', 'Base jurídica', '14', legal4809),
    fieldRowFull('48 10', 'Uso o destino de las mercancías', null, data.useDestination || DEFAULT_USO_DESTINO),
    fieldRowFull('48 11', 'Plazo para la realización de las formalidades', null, ''),
    fieldRowFull('48 12', 'Declaración de la autoridad aduanera que toma la decisión', null, ''),
    fieldRowFull(
      '48 13',
      'Descripción de los motivos de la devolución o condonación.',
      '15',
      data.motivosText || '',
    ),
    fieldRowFull('48 14', 'Datos del banco y de la cuenta.', '16', bank4814, { cantSplit: true }),
  ]

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [1500, 1500, 1500, 1500, 1500, 1500],
    borders: TABLE_FULL_BORDERS,
    rows,
  })
}

// ── Página de notas al pie ───────────────────────────────────

function buildNotesHeaderTable(text) {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [9000],
    borders: SINGLE_BORDER,
    rows: [
      new TableRow({
        height: { value: 320, rule: HeightRule.ATLEAST },
        children: [
          new TableCell({
            width: { size: 9000, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: SHADING.NOTES_HEADER },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text,
                    bold: true,
                    font: FONT,
                    size: FONT_SIZE_HEADER,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

function buildNotesTable(rows) {
  // rows: array de [marker, body]
  const tableRows = rows.map(
    ([marker, body]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 720, type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 100, right: 80 },
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: marker,
                    bold: true,
                    font: FONT,
                    size: FONT_SIZE_NOTES,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 8280, type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 80, right: 100 },
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: body,
                    font: FONT,
                    size: FONT_SIZE_NOTES,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
  )
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [720, 8280],
    borders: SINGLE_BORDER,
    rows: tableRows,
  })
}

function buildNotesPage() {
  const notesCommon = [
    [
      '(1)',
      'Indíquese, utilizando los códigos pertinentes, qué decisión se solicita: REM (remission): Solicitud relativas a la devolución de los importes de los derechos de importación. REP (repayment): Solicitud relativas a la condonación de los importes de los derechos de importación.',
    ],
    [
      '(2)',
      'Este elemento de dato solo se utilizará en la solicitud en caso de que esta última esté relacionada con la modificación, renovación o revocación de la decisión.',
    ],
    [
      '(3)',
      'Indíquese, utilizando el código correspondiente, la autoridad aduanera que toma la decisión. Véase los códigos facilitados en las "Instrucciones de cumplimentación" anexas a este modelo para el E.D. 31 07.',
    ],
    [
      '(4)',
      'Esta información solo será obligatoria en los casos en que no se exija el número EORI de la persona en cuestión. Cuando se facilite el número EORI, no deberán incluirse el nombre y la dirección, salvo que se utilice una solicitud o decisión en papel.',
    ],
    [
      '(5)',
      'Esta información solo se utilizará en caso de solicitud en papel.',
    ],
    [
      '(6)',
      'Esta información será facultativa en los casos en que la legislación aduanera de la Unión dispense de la obligación de presentar las mercancías.',
    ],
    [
      '(*)',
      'Datos cuya comunicación es facultativa para el solicitante',
    ],
  ]

  const notesSpecific = [
    [
      '(7)',
      'Indíquese el MRN de la declaración en aduana o la referencia a cualquier otro documento que haya dado lugar a la notificación de los derechos de importación o de exportación cuya devolución o condonación se solicita.',
    ],
    [
      '(8)',
      'Consígnese el identificador de la aduana donde se haya notificado el importe de los derechos de importación o de exportación a los que se refiere la solicitud. En caso de solicitud en papel, indíquese el nombre y la dirección completa, incluido, en su caso, el código postal, de la aduana de que se trate.',
    ],
    [
      '(9)',
      'Este dato solo deberá facilitarse si se trata de una aduana distinta de la indicada en el E.D 48 02 «Aduana donde ha sido notificada la deuda aduanera». Introdúzcase el identificador de la aduana de que se trate. En caso de solicitud en papel, indíquese el nombre y la dirección completa, incluido el código postal, de la aduana de que se trate.',
    ],
    [
      '(10)',
      'Salvo en los casos a que se refiere el artículo 116, apartado 1, párrafo primero, letra a), indíquese el código del régimen aduanero en el que el solicitante desee incluir las mercancías. Cuando el régimen aduanero esté sujeto a una autorización, indíquese el identificador de la autorización en cuestión. Indíquese si se solicita el cumplimiento previo de las formalidades.',
    ],
    [
      '(11)',
      'Indíquese el valor en aduana de las mercancías.',
    ],
    [
      '(12)',
      'Indíquese, utilizando el código correspondiente a la divisa, el importe de los derechos de importación que se han de devolver o condonar. Indíquese de forma separada el importe de otros gravámenes a la importación cuya devolución, en su caso, también se solicite.',
    ],
    [
      '(13)',
      'Indíquese, utilizando los códigos correspondientes, el tipo de derechos de importación u otros gravámenes a la importación que se han de devolver o condonar. Véase los códigos de tributos en las "Instrucciones de cumplimentación" anexas a este modelo para el E.D. 48 08.',
    ],
    [
      '(14)',
      'Indíquese, utilizando el código correspondiente, la base jurídica de la solicitud de devolución o de condonación de los derechos de importación o de exportación. Véase los códigos de la base jurídica en las "Instrucciones de cumplimentación" anexas a este modelo para el E.D 48 09.',
    ],
    [
      '(15)',
      'Descripción detallada de los argumentos en que se basa la solicitud de devolución o condonación de los derechos de importación o de exportación. Este elemento de dato deberá cumplimentarse en todos los casos en que la información no pueda deducirse de otras partes de la solicitud.',
    ],
    [
      '(16)',
      'Cuando proceda, indíquense los datos de la cuenta bancaria en la que se abonarán los derechos de importación o exportación objeto de devolución o condonación.',
    ],
  ]

  return [
    new Paragraph({ children: [new PageBreak()] }),
    buildNotesHeaderTable('Notas relativas a los requisitos comunes'),
    buildNotesTable(notesCommon),
    p('', { size: 8 }),
    buildNotesHeaderTable('Notas relativas a los requisitos específicos'),
    buildNotesTable(notesSpecific),
  ]
}

// ── Helpers del Anexo I ──────────────────────────────────────

function classifyDutyCode(code) {
  if (!code) return 'otros'
  const c = String(code).toUpperCase()
  if (c.startsWith('A')) return 'arancel'
  if (c.startsWith('B')) return 'iva'
  return 'otros'
}

function truncateDescription(s, max = 60) {
  if (!s) return ''
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

function annexTopRows() {
  return [
    new TableRow({
      tableHeader: true,
      children: [
        cell({ text: 'TRIBUTO', bold: true, shade: SHADE_HEADER, width: 1500 }),
        cell({ text: 'DICE (€)', bold: true, shade: SHADE_HEADER, width: 2500 }),
        cell({ text: 'DEBE DECIR (€)', bold: true, shade: SHADE_HEADER, width: 2500 }),
        cell({ text: 'DIFERENCIA (€)', bold: true, shade: SHADE_HEADER, width: 2500 }),
      ],
    }),
  ]
}

function buildItemMiniTable(item, idx) {
  const dutiesDecl = item.dutiesDeclared || {}
  const dutiesCorr = item.dutiesCorrected || {}
  const codes = Array.from(new Set([...Object.keys(dutiesDecl), ...Object.keys(dutiesCorr)]))
  const itemDiff = codes.reduce(
    (acc, c) => acc + (Number(dutiesDecl[c] || 0) - Number(dutiesCorr[c] || 0)),
    0,
  )

  const dataRows = codes.map((code) => {
    const decl = Number(dutiesDecl[code] || 0)
    const corr = Number(dutiesCorr[code] || 0)
    const diff = decl - corr
    return new TableRow({
      children: [
        cell({ text: `${code} — ${DUTY_CODES[code] || ''}`, width: 1500 }),
        cell({ text: fmtMoney(decl), width: 2500, align: AlignmentType.RIGHT }),
        cell({ text: fmtMoney(corr), width: 2500, align: AlignmentType.RIGHT }),
        cell({ text: fmtMoney(diff), bold: true, width: 2500, align: AlignmentType.RIGHT }),
      ],
    })
  })

  const totalRow = new TableRow({
    children: [
      cell({
        text: `Total partida #${item.sequenceNumber || idx + 1}`,
        bold: true,
        shade: SHADE_SECTION,
        width: 6500,
        colSpan: 3,
      }),
      cell({
        text: fmtMoney(itemDiff),
        bold: true,
        shade: SHADE_SECTION,
        width: 2500,
        align: AlignmentType.RIGHT,
      }),
    ],
  })

  // Cabecera: Partida #N — TARIC ... — Descripción truncada
  const headerLine = [
    `Partida #${item.sequenceNumber || idx + 1}`,
    item.taricCode ? `TARIC ${item.taricCode}` : null,
    item.description ? truncateDescription(item.description, 60) : null,
  ]
    .filter(Boolean)
    .join(' — ')

  // Subtítulo: Origen + Preferencia
  const subtitleParts = []
  if (item.originCountry) subtitleParts.push(`Origen: ${item.originCountry}`)
  if (item.preference) subtitleParts.push(`Preferencia: ${item.preference}`)
  const subtitle = subtitleParts.join(' · ')

  const blocks = [
    p(headerLine, { bold: true, size: FONT_SIZE_HEADER }),
  ]
  if (subtitle) blocks.push(p(subtitle, { size: FONT_SIZE_SMALL, color: '555555' }))
  blocks.push(
    new Table({
      width: { size: 9000, type: WidthType.DXA },
      columnWidths: [1500, 2500, 2500, 2500],
      borders: SINGLE_BORDER,
      rows: [...annexTopRows(), ...dataRows, totalRow],
    }),
    p(''),
  )
  return blocks
}

function buildTotalGeneralBlock(items) {
  // Agregar totales por código de tributo a través de todas las partidas.
  const totalsByCode = {}
  for (const it of items) {
    const decl = it.dutiesDeclared || {}
    const corr = it.dutiesCorrected || {}
    const codes = new Set([...Object.keys(decl), ...Object.keys(corr)])
    for (const c of codes) {
      const diff = Number(decl[c] || 0) - Number(corr[c] || 0)
      totalsByCode[c] = (totalsByCode[c] || 0) + diff
    }
  }

  // Agrupar por naturaleza tributaria.
  const groups = { arancel: [], iva: [], otros: [] }
  for (const [code, total] of Object.entries(totalsByCode)) {
    const kind = classifyDutyCode(code)
    groups[kind].push({ code, total })
  }
  const sumGroup = (g) => g.reduce((acc, x) => acc + x.total, 0)
  const totalArancel = sumGroup(groups.arancel)
  const totalIVA = sumGroup(groups.iva)
  const totalOtros = sumGroup(groups.otros)

  const lines = []
  lines.push(p('TOTAL GENERAL A REGULARIZAR', { bold: true, size: FONT_SIZE_HEADER }))
  lines.push(p(''))

  // Detalle por código con leyenda legal
  for (const { code, total } of groups.arancel) {
    lines.push(p(
      `${code} — ${DUTY_CODES[code] || 'Arancel'}: ${fmtMoney(total)} (devolución directa)`,
    ))
  }
  for (const { code, total } of groups.iva) {
    lines.push(p(
      `${code} — ${DUTY_CODES[code] || 'IVA'}: ${fmtMoney(total)} (regularización en próxima declaración periódica de IVA)`,
    ))
  }
  for (const { code, total } of groups.otros) {
    lines.push(p(
      `${code} — ${DUTY_CODES[code] || ''}: ${fmtMoney(total)} (según naturaleza tributaria)`,
    ))
  }

  // Separador y totales agrupados
  lines.push(p(''))
  lines.push(p('──────────────────────────────────────────────────────'))
  if (groups.arancel.length > 0) {
    lines.push(p(`Total a devolver (A00): ${fmtMoney(totalArancel)}`, { bold: true }))
  }
  if (groups.iva.length > 0) {
    lines.push(p(`Total a regularizar IVA (B00): ${fmtMoney(totalIVA)}`, { bold: true }))
  }
  if (groups.otros.length > 0) {
    lines.push(p(`Total otros tributos: ${fmtMoney(totalOtros)}`, { bold: true }))
  }
  return lines
}

function buildAnnexLegacy(data) {
  // Legacy: 1 tabla DICE/DEBE DECIR consolidada a partir de los campos
  // planos. Mantenido para flujos sin XML / sin selectedItems.
  const dutiesDecl = data.dutiesDeclared || {}
  const dutiesCorr = data.dutiesCorrected || {}
  const allCodes = Array.from(new Set([...Object.keys(dutiesDecl), ...Object.keys(dutiesCorr)]))

  const dataRows = allCodes.map((code) => {
    const decl = Number(dutiesDecl[code] || 0)
    const corr = Number(dutiesCorr[code] || 0)
    const diff = decl - corr
    return new TableRow({
      children: [
        cell({ text: `${code} — ${DUTY_CODES[code] || ''}`, width: 1500 }),
        cell({ text: fmtMoney(decl), width: 2500, align: AlignmentType.RIGHT }),
        cell({ text: fmtMoney(corr), width: 2500, align: AlignmentType.RIGHT }),
        cell({ text: fmtMoney(diff), bold: true, width: 2500, align: AlignmentType.RIGHT }),
      ],
    })
  })

  // Aun en modo legacy, separamos el total por A00/B00/otros para dejar
  // claro al funcionario AEAT la naturaleza distinta del A00 (devolución)
  // vs B00 (regularización IVA).
  const virtualItem = {
    sequenceNumber: 1,
    dutiesDeclared: dutiesDecl,
    dutiesCorrected: dutiesCorr,
  }

  return [
    new Table({
      width: { size: 9000, type: WidthType.DXA },
      columnWidths: [1500, 2500, 2500, 2500],
      borders: SINGLE_BORDER,
      rows: [...annexTopRows(), ...dataRows],
    }),
    p(''),
    ...buildTotalGeneralBlock([virtualItem]),
  ]
}

function buildAnnex(data) {
  const items = Array.isArray(data.selectedItems) && data.selectedItems.length > 0
    ? data.selectedItems
    : null

  const annexHead = [
    new Paragraph({
      children: [new PageBreak()],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'ANEXO I — LIQUIDACIÓN A REGULARIZAR',
          bold: true,
          font: FONT,
          size: FONT_SIZE_TITLE,
        }),
      ],
    }),
    p(`Tipo: IMPORTACIÓN`),
    p(`Estado contable: ${data.requestType === 'REP' ? 'CONTRAÍDO' : 'NO CONTRAÍDO'}`),
    p(`OEA / Representante: ${data.representative?.name || ''} (${data.representative?.eori || ''})`),
    p(''),
  ]

  const annexFooter = [
    p(''),
    p('Motivos:', { bold: true }),
    p(data.motivosText || ''),
  ]

  if (!items) {
    return [...annexHead, ...buildAnnexLegacy(data), ...annexFooter]
  }

  // Modo nuevo: mini-tabla por partida + bloque total general A00/B00.
  const itemBlocks = items.flatMap((item, idx) => buildItemMiniTable(item, idx))
  const totalBlock = buildTotalGeneralBlock(items)

  return [
    ...annexHead,
    ...itemBlocks,
    ...totalBlock,
    ...annexFooter,
  ]
}

// ── Función principal ────────────────────────────────────────

export async function generateRrmDocx(data) {
  const doc = new Document({
    creator: 'LexAduana',
    title: 'Solicitud RRM',
    description: 'Solicitud de devolución/condonación de derechos (AEAT)',
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4 DXA
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children: [
          ...buildDocumentHeader(),
          buildCommonRequisitos(data),
          new Paragraph({ text: '', spacing: { before: 200, after: 0 } }),
          buildSpecificRequisitos(data),
          ...buildNotesPage(),
          ...buildAnnex(data),
        ],
      },
    ],
  })

  return Packer.toBuffer(doc)
}
