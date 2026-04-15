// ─────────────────────────────────────────────────────────────
// Generador del DOCX para la Solicitud de Devolución/Condonación
// de Derechos (formulario AEAT — art. 116-120 CAU).
//
// Estructura del documento:
//   Página 1 — Formulario RRM principal (REQUISITOS COMUNES + ESPECÍFICOS)
//   Página 2 — Anexo I: Solicitud de Modificación (DICE / DEBE DECIR)
//
// La librería `docx` se usa server-side; este módulo NO debe
// importarse desde componentes cliente.
// ─────────────────────────────────────────────────────────────

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  HeightRule,
  PageBreak,
} from 'docx'
import { DUTY_CODES, LEGAL_BASES, REQUEST_TYPES, CUSTOMS_REGIMES } from '@/lib/rrmData'

// ── Constantes de estilo ─────────────────────────────────────
const FONT = 'Arial'
const FONT_SIZE_BODY = 20 // half-points → 10pt
const FONT_SIZE_SMALL = 16 // 8pt
const FONT_SIZE_HEADER = 22 // 11pt
const SHADE_HEADER = 'D5E8F0'
const SHADE_SECTION = 'F2F2F2'

const SINGLE_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
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

function sectionHeader(label) {
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
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: SHADE_HEADER },
            children: [p(label, { bold: true, size: FONT_SIZE_HEADER })],
          }),
        ],
      }),
    ],
  })
}

function fieldRow(code, label, value) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 1200, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: SHADE_SECTION },
        children: [p(code, { bold: true, size: FONT_SIZE_SMALL })],
      }),
      new TableCell({
        width: { size: 3200, type: WidthType.DXA },
        children: [p(label, { size: FONT_SIZE_SMALL })],
      }),
      new TableCell({
        width: { size: 4600, type: WidthType.DXA },
        children: [p(value || '—', { bold: true })],
      }),
    ],
  })
}

function fieldsTable(rows) {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [1200, 3200, 4600],
    borders: SINGLE_BORDER,
    rows,
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

function buildHeader(data) {
  const reqType = REQUEST_TYPES[data.requestType] || REQUEST_TYPES.REM
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'SOLICITUD RELATIVA A LA DEVOLUCIÓN O CONDONACIÓN DE DERECHOS DE IMPORTACIÓN/EXPORTACIÓN',
          bold: true,
          font: FONT,
          size: 24, // 12pt
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: `Tipo de solicitud: ${reqType.code} — ${reqType.label}`,
          font: FONT,
          size: FONT_SIZE_BODY,
        }),
      ],
    }),
  ]
}

function buildCommonRequisitos(data) {
  const reqType = REQUEST_TYPES[data.requestType] || REQUEST_TYPES.REM
  return [
    sectionHeader('REQUISITOS COMUNES'),
    fieldsTable([
      fieldRow('31 01', 'Tipo de Código de Solicitud', `${reqType.code} — ${reqType.label}`),
      fieldRow('31 03', 'Tipo de Solicitud', data.subRequestType || '1'),
      fieldRow('31 06', 'Nº ref. decisión anterior', data.priorDecisionRef || ''),
      fieldRow('31 07', 'Autoridad Aduanera que toma la decisión', data.customsOffice || ''),
      fieldRow('32 04', 'Documentación Adjunta', (data.attachments || []).map((a) => `${a.name || ''} ${a.id || ''} ${a.date || ''}`).join('; ')),
      fieldRow(
        '33 01/02',
        'Solicitante (importador)',
        [data.importer?.name, data.importer?.eori, data.importer?.address].filter(Boolean).join(' · ')
      ),
      fieldRow(
        '33 03',
        'Representante',
        [data.representative?.name, data.representative?.eori, data.representative?.address].filter(Boolean).join(' · ')
      ),
      fieldRow(
        '33 06',
        'Persona de contacto',
        [data.contact?.name, data.contact?.role, data.contact?.email, data.contact?.phone].filter(Boolean).join(' · ')
      ),
      fieldRow('34 01', 'Lugar', data.place || ''),
      fieldRow('34 02', 'Fecha de la solicitud', data.requestDate || ''),
      fieldRow('34 06', 'Fecha solicitada de entrada en vigor', data.effectiveDate || ''),
      fieldRow('34 08', 'Ubicación de las mercancías', data.goodsLocation || ''),
      fieldRow(
        '35 01',
        'Información sobre las mercancías',
        [data.commodityCode, data.goodsDescription, data.volume].filter(Boolean).join(' · ')
      ),
      fieldRow('38 05', 'Información Adicional', data.additionalInfo || ''),
    ]),
  ]
}

function buildSpecificRequisitos(data) {
  const lb = LEGAL_BASES[data.legalBasis] || LEGAL_BASES.A
  const dutiesCorr = data.dutiesCorrected || {}
  const dutiesDecl = data.dutiesDeclared || {}
  const dutyLines = Object.keys({ ...dutiesDecl, ...dutiesCorr })
    .map((code) => {
      const decl = Number(dutiesDecl[code] || 0)
      const corr = Number(dutiesCorr[code] || 0)
      const diff = decl - corr
      return `${code} — ${fmtMoney(diff, 'EUR')}`
    })
    .join('  |  ')

  return [
    sectionHeader('REQUISITOS ESPECÍFICOS'),
    fieldsTable([
      fieldRow('48 01', 'Título de cobro (MRN)', data.mrn || ''),
      fieldRow('48 02', 'Aduana de notificación', data.customsOffice || ''),
      fieldRow('48 03', 'Aduana competente mercancías', data.customsCompetent || ''),
      fieldRow('48 05', 'Régimen aduanero', fmtRegime(data.requestedProcedure)),
      fieldRow('48 06', 'Valor en aduana', fmtMoney(data.customsValue, 'EUR')),
      fieldRow('48 07', 'Importe a devolver/condonar', dutyLines || ''),
      fieldRow('48 08', 'Tipo de derecho', Object.keys(dutiesDecl).map((k) => `${k}: ${DUTY_CODES[k] || ''}`).join('; ')),
      fieldRow('48 09', 'Base jurídica', `${lb.code} — Art. ${lb.article} CAU — ${lb.description}`),
      fieldRow('48 10', 'Uso o destino de las mercancías', data.useDestination || ''),
      fieldRow('48 13', 'Descripción de motivos', data.motivosText || ''),
      fieldRow(
        '48 14',
        'Datos bancarios',
        data.bank ? [data.bank.holder, data.bank.iban, data.bank.bic].filter(Boolean).join(' · ') : ''
      ),
    ]),
  ]
}

function buildAnnex(data) {
  const dutiesDecl = data.dutiesDeclared || {}
  const dutiesCorr = data.dutiesCorrected || {}
  const allCodes = Array.from(new Set([...Object.keys(dutiesDecl), ...Object.keys(dutiesCorr)]))

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      cell({ text: 'TRIBUTO', bold: true, shade: SHADE_HEADER, width: 1500 }),
      cell({ text: 'DICE (€)', bold: true, shade: SHADE_HEADER, width: 2500 }),
      cell({ text: 'DEBE DECIR (€)', bold: true, shade: SHADE_HEADER, width: 2500 }),
      cell({ text: 'DIFERENCIA (€)', bold: true, shade: SHADE_HEADER, width: 2500 }),
    ],
  })

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

  const totalDiff = allCodes.reduce(
    (acc, code) => acc + (Number(dutiesDecl[code] || 0) - Number(dutiesCorr[code] || 0)),
    0
  )
  const totalRow = new TableRow({
    children: [
      cell({ text: 'TOTAL A DEVOLVER/CONDONAR', bold: true, shade: SHADE_SECTION, width: 6500, colSpan: 3 }),
      cell({ text: fmtMoney(totalDiff), bold: true, shade: SHADE_SECTION, width: 2500, align: AlignmentType.RIGHT }),
    ],
  })

  return [
    new Paragraph({
      children: [new PageBreak()],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'ANEXO I — SOLICITUD DE MODIFICACIÓN DE DECLARACIONES',
          bold: true,
          font: FONT,
          size: 24,
        }),
      ],
    }),
    p(`Tipo: IMPORTACIÓN`),
    p(`Estado contable: ${data.requestType === 'REP' ? 'CONTRAÍDO' : 'NO CONTRAÍDO'}`),
    p(`OEA / Representante: ${data.representative?.name || ''} (${data.representative?.eori || ''})`),
    p(''),
    new Table({
      width: { size: 9000, type: WidthType.DXA },
      columnWidths: [1500, 2500, 2500, 2500],
      borders: SINGLE_BORDER,
      rows: [headerRow, ...dataRows, totalRow],
    }),
    p(''),
    p('Motivos:', { bold: true }),
    p(data.motivosText || ''),
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
          ...buildHeader(data),
          ...buildCommonRequisitos(data),
          p(''),
          ...buildSpecificRequisitos(data),
          ...buildAnnex(data),
        ],
      },
    ],
  })

  return Packer.toBuffer(doc)
}
