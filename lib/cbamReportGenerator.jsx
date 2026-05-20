/**
 * CBAM Report Generator - Phase 3
 *
 * Genera el PDF profesional del informe CBAM usando @react-pdf/renderer.
 * Replica el diseño del prototipo (generate_cbam_report_REFERENCIA.py).
 *
 * Idioma: español.
 *
 * Uso:
 *   import { renderReportPdf } from '@/lib/cbamReportGenerator'
 *   const buffer = await renderReportPdf(snapshot)
 */

import path from 'node:path'
import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer'

// ============================================================
// FUENTE TIPOGRÁFICA
// ============================================================
// Las fuentes Type 1 estándar de @react-pdf/renderer (Helvetica et al.) usan
// codificación WinAnsi y no traen glifos para subíndices (₂), Σ ni el signo
// matemático − (U+2212). Registramos Roboto (4 variantes hinted) desde
// public/fonts/roboto/ para tener cobertura completa de los caracteres
// usados en el informe. Licencia: Apache 2.0 — ver public/fonts/roboto/LICENSE.txt.
//
// `runtime = 'nodejs'` está fijado en el route que invoca esta función, así
// que process.cwd() y la lectura de filesystem funcionan en Vercel.
const ROBOTO_DIR = path.join(process.cwd(), 'public', 'fonts', 'roboto')
Font.register({
  family: 'Roboto',
  fonts: [
    { src: path.join(ROBOTO_DIR, 'Roboto-Regular.ttf'), fontWeight: 'normal', fontStyle: 'normal' },
    { src: path.join(ROBOTO_DIR, 'Roboto-Bold.ttf'), fontWeight: 'bold', fontStyle: 'normal' },
    { src: path.join(ROBOTO_DIR, 'Roboto-Italic.ttf'), fontWeight: 'normal', fontStyle: 'italic' },
    { src: path.join(ROBOTO_DIR, 'Roboto-BoldItalic.ttf'), fontWeight: 'bold', fontStyle: 'italic' },
  ],
})
// Desactiva la división por guiones automática de @react-pdf, que corta
// palabras técnicas (códigos CN, referencias regulatorias) en sitios raros.
Font.registerHyphenationCallback((word) => [word])

// ============================================================
// DESIGN TOKENS (replican el prototipo Python)
// ============================================================
const COLORS = {
  navy: '#0A3D5C',
  navyLight: '#0E5A8A',
  emerald: '#059669',
  emeraldBg: '#ECFDF5',
  red: '#DC2626',
  warmGray: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  text: '#111827',
  white: '#FFFFFF',
  coverSubtle: '#94A3B8',
  emeraldDark: '#065F46',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 65,
    paddingBottom: 50,
    paddingHorizontal: 50,
    fontFamily: 'Roboto',
    fontSize: 9.5,
    color: COLORS.text,
    lineHeight: 1.4,
  },
  // ----- Cover -----
  coverPage: {
    backgroundColor: COLORS.navy,
    padding: 50,
    fontFamily: 'Roboto',
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Roboto', fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 90,
    lineHeight: 1.2,
  },
  coverTitleEn: {
    fontSize: 18,
    color: COLORS.coverSubtle,
    marginTop: 6,
    marginBottom: 26,
  },
  coverYear: {
    fontSize: 14,
    color: COLORS.white,
    marginTop: 14,
  },
  coverRef: {
    fontSize: 11,
    color: COLORS.coverSubtle,
    marginTop: 6,
  },
  coverDivider: {
    width: 120,
    height: 2,
    backgroundColor: COLORS.emerald,
    marginTop: 40,
    marginBottom: 14,
  },
  coverLabel: {
    fontSize: 9,
    color: COLORS.coverSubtle,
    marginBottom: 4,
  },
  coverClient: {
    fontSize: 18,
    fontFamily: 'Roboto', fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 6,
  },
  coverClientDetail: {
    fontSize: 10,
    color: COLORS.coverSubtle,
    marginTop: 2,
  },
  coverDate: {
    fontSize: 10,
    color: COLORS.coverSubtle,
    marginTop: 60,
  },
  coverConfidential: {
    fontSize: 10,
    fontFamily: 'Roboto', fontWeight: 'bold',
    color: COLORS.red,
    marginTop: 8,
  },
  // ----- Headings -----
  h1: {
    fontSize: 18,
    fontFamily: 'Roboto', fontWeight: 'bold',
    color: COLORS.navy,
    marginTop: 18,
    marginBottom: 10,
  },
  h1Underline: {
    height: 2,
    backgroundColor: COLORS.emerald,
    marginBottom: 14,
  },
  h2: {
    fontSize: 13,
    fontFamily: 'Roboto', fontWeight: 'bold',
    color: COLORS.navyLight,
    marginTop: 14,
    marginBottom: 8,
  },
  h3: {
    fontSize: 11,
    fontFamily: 'Roboto', fontWeight: 'bold',
    color: COLORS.gray700,
    marginTop: 10,
    marginBottom: 6,
  },
  // ----- Body text -----
  body: {
    fontSize: 9.5,
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 1.45,
    textAlign: 'justify',
  },
  bodyEn: {
    fontSize: 9,
    fontFamily: 'Roboto', fontStyle: 'italic',
    color: COLORS.gray600,
    marginBottom: 8,
    lineHeight: 1.45,
    textAlign: 'justify',
  },
  small: {
    fontSize: 8,
    color: COLORS.gray500,
  },
  // ----- TOC -----
  tocRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  tocNum: {
    width: 30,
    fontSize: 11,
    fontFamily: 'Roboto', fontWeight: 'bold',
    color: COLORS.emerald,
  },
  tocTitle: {
    fontSize: 11,
    color: COLORS.text,
  },
  // ----- KPI cards -----
  kpiRow: {
    flexDirection: 'row',
    marginVertical: 10,
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.warmGray,
    borderWidth: 0.5,
    borderColor: COLORS.gray200,
    borderRadius: 4,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiCardEmerald: {
    flex: 1,
    backgroundColor: COLORS.emeraldBg,
    borderWidth: 0.5,
    borderColor: COLORS.emerald,
    borderRadius: 4,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiNum: {
    fontSize: 22,
    fontFamily: 'Roboto', fontWeight: 'bold',
    color: COLORS.navy,
    textAlign: 'center',
    // Cortamos el lineHeight heredado de page (1.4) para que el dígito no
    // arrastre ~8pt de leading vacío que come la separación visual con el
    // label. Roboto tiene ascent/descent más altos por em que Helvetica
    // (0.928/0.244 vs 0.718/0.207), así que el aire vertical hay que
    // controlarlo aquí explícitamente.
    lineHeight: 1.1,
  },
  kpiNumGreen: {
    // Menos cuerpo que kpiNum (22) porque el contenido es una cantidad en EUR
    // con separadores de miles + sufijo "EUR", siempre más ancha que un entero
    // suelto. A 20 se solapaba en costes de 7 cifras dentro de la card flex:1.
    fontSize: 16,
    fontFamily: 'Roboto', fontWeight: 'bold',
    color: COLORS.emerald,
    textAlign: 'center',
    lineHeight: 1.1,
    // Compensa el delta de altura visual con kpiNum (22pt × 1.1 ≈ 24.2pt
    // vs 16pt × 1.1 ≈ 17.6pt). Sin esto, justifyContent:center centra un
    // bloque más bajo dentro de la misma altura de fila → el label emerald
    // queda 3.3pt por encima de los navy. Con +6pt de padding vertical el
    // text-box emerald iguala al navy y los 4 labels quedan al pixel.
    paddingVertical: 3,
  },
  kpiLabel: {
    fontSize: 8,
    color: COLORS.gray600,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 1.25,
  },
  // ----- Savings box -----
  savingsBox: {
    backgroundColor: COLORS.emeraldBg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.emerald,
    padding: 10,
    marginVertical: 10,
  },
  savingsText: {
    fontSize: 9.5,
    color: COLORS.emeraldDark,
    lineHeight: 1.45,
  },
  savingsTextEn: {
    fontSize: 8.5,
    fontFamily: 'Roboto', fontStyle: 'italic',
    color: COLORS.emeraldDark,
    marginTop: 4,
    lineHeight: 1.45,
  },
  // ----- Tables -----
  table: {
    borderWidth: 0.5,
    borderColor: COLORS.gray300,
    marginTop: 8,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.navy,
  },
  tableHeaderCell: {
    color: COLORS.white,
    fontSize: 7.5,
    fontFamily: 'Roboto', fontWeight: 'bold',
    padding: 5,
    borderRightWidth: 0.5,
    borderRightColor: COLORS.navyLight,
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 0.3,
    borderTopColor: COLORS.gray200,
  },
  tableRowAlt: {
    flexDirection: 'row',
    backgroundColor: COLORS.warmGray,
    borderTopWidth: 0.3,
    borderTopColor: COLORS.gray200,
  },
  tableCell: {
    fontSize: 7.5,
    color: COLORS.text,
    padding: 5,
    borderRightWidth: 0.3,
    borderRightColor: COLORS.gray200,
  },
  tableCellRight: {
    fontSize: 7.5,
    color: COLORS.text,
    padding: 5,
    textAlign: 'right',
    borderRightWidth: 0.3,
    borderRightColor: COLORS.gray200,
  },
  tableCellBold: {
    fontSize: 7.5,
    fontFamily: 'Roboto', fontWeight: 'bold',
    padding: 5,
  },
  // Celda "Certs. tCO₂e / uds." de la fila TOTAL: dos líneas predecibles en
  // lugar de un \n literal dentro de un <Text>, para que la altura de fila
  // sea estable y el contenido no quede pegado al borde inferior.
  totalCertsCell: {
    padding: 5,
    borderRightWidth: 0.5,
    borderRightColor: COLORS.navyLight,
  },
  totalCertsValue: {
    color: COLORS.white,
    fontSize: 7.5,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    textAlign: 'right',
    lineHeight: 1.3,
  },
  // ----- Recommendations -----
  recCard: {
    borderWidth: 0.5,
    borderColor: COLORS.gray300,
    borderRadius: 3,
    padding: 10,
    marginBottom: 10,
  },
  recCardHigh: {
    borderWidth: 0.5,
    borderColor: COLORS.red,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.red,
    backgroundColor: '#FEF2F2',
    borderRadius: 3,
    padding: 10,
    marginBottom: 10,
  },
  recCardMedium: {
    borderWidth: 0.5,
    borderColor: COLORS.emerald,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.emerald,
    backgroundColor: COLORS.emeraldBg,
    borderRadius: 3,
    padding: 10,
    marginBottom: 10,
  },
  recCardLow: {
    borderWidth: 0.5,
    borderColor: COLORS.gray300,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gray500,
    backgroundColor: COLORS.warmGray,
    borderRadius: 3,
    padding: 10,
    marginBottom: 10,
  },
  recTitle: {
    fontSize: 10,
    fontFamily: 'Roboto', fontWeight: 'bold',
    color: COLORS.navy,
    marginBottom: 2,
  },
  recTitleEn: {
    fontSize: 9,
    fontFamily: 'Roboto', fontStyle: 'italic',
    color: COLORS.gray600,
    marginBottom: 6,
  },
  recBody: {
    fontSize: 8.5,
    color: COLORS.text,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  recBodyEn: {
    fontSize: 8,
    fontFamily: 'Roboto', fontStyle: 'italic',
    color: COLORS.gray600,
    lineHeight: 1.4,
  },
  // ----- Legal box -----
  legalBox: {
    backgroundColor: COLORS.warmGray,
    borderWidth: 0.5,
    borderColor: COLORS.gray300,
    padding: 10,
    marginTop: 8,
  },
  legalText: {
    fontSize: 8,
    color: COLORS.gray600,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  // ----- Header / Footer -----
  pageHeader: {
    position: 'absolute',
    top: 25,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: COLORS.gray500,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.navy,
    paddingBottom: 4,
  },
  pageFooter: {
    position: 'absolute',
    bottom: 25,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: COLORS.gray500,
    borderTopWidth: 0.3,
    borderTopColor: COLORS.gray300,
    paddingTop: 4,
  },
})

// ============================================================
// FORMATTERS
// ============================================================
function fmtNum(n, decimals = 0) {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n || 0)
}

function fmtEUR(n) {
  return `${fmtNum(n)} EUR`
}

// Etiqueta corta del origen del precio del certificado para la columna
// "Fuente" de la tabla de metodología (sección 7). Pensada para que un
// cliente final pueda leerla sin jerga: nada de nombres de tabla,
// función o variable. Snapshots legacy sin el campo → "Desconocido".
const PRICE_LOOKUP_SOURCE_LABELS = {
  database: 'Comisión Europea (precio oficial del trimestre)',
  fallback: 'Precio de referencia (valor oficial no disponible en emisión)',
}
function priceLookupSourceLabel(value) {
  return PRICE_LOOKUP_SOURCE_LABELS[value] || 'Desconocido'
}

// Texto explicativo ampliado del origen del precio, renderizado debajo
// de la tabla de metodología. Misma regla: solo lenguaje de cliente.
const PRICE_NOTE_TEXTS = {
  database:
    'Precio oficial del certificado CBAM publicado por la Comisión Europea ' +
    'para el trimestre de referencia.',
  fallback:
    'Precio de referencia. El valor oficial no pudo recuperarse en el momento ' +
    'de emisión del informe; se ha aplicado el último precio conocido. ' +
    'Consúltenos para una actualización.',
}
function priceNoteText(value) {
  return PRICE_NOTE_TEXTS[value] || null
}

// Etiqueta principal del trimestre de aplicación del precio CBAM.
// Convierte 'YYYY-QN' (lo que persistimos) a 'QN YYYY' para lectura natural.
// NO se infiere desde la fecha de publicación: el valor llega ya como
// trimestre desde la BD/snapshot (cbam_ets_prices.application_quarter →
// advisory.co2_price_application_quarter → snapshot.regulatoryParams).
function formatApplicationQuarter(value) {
  if (!value) return null
  const m = String(value).match(/^(\d{4})-Q([1-4])$/i)
  if (m) return `Q${m[2]} ${m[1]}`
  return String(value)
}

// Etiqueta secundaria opcional con la fecha de publicación oficial del precio,
// en español. Solo se renderiza si el valor parece una ISO `YYYY-MM-DD`; si
// llega ya como trimestre (snapshots antiguos) devolvemos null para no
// duplicar la etiqueta principal.
const MONTHS_ES_SHORT = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]
function formatPublicationDateLabel(value) {
  if (!value) return null
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const [, year, mm, dd] = m
  const monthIdx = parseInt(mm, 10) - 1
  if (monthIdx < 0 || monthIdx > 11) return null
  return `${parseInt(dd, 10)} ${MONTHS_ES_SHORT[monthIdx]} ${year}`
}

// ============================================================
// HEADER / FOOTER (en cada página excepto portada)
// ============================================================
function PageChrome({ reportRef }) {
  return (
    <>
      <View style={styles.pageHeader} fixed>
        <Text>LexAduana — Informe CBAM — Ref: {reportRef}</Text>
        <Text>CONFIDENCIAL</Text>
      </View>
      <View style={styles.pageFooter} fixed>
        <Text>lexaduana.es</Text>
        <Text
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          }
        />
        <Text>© LexAduana {new Date().getFullYear()}</Text>
      </View>
    </>
  )
}

// ============================================================
// PORTADA
// ============================================================
function CoverPage({ snapshot }) {
  const { meta, client } = snapshot
  const dateStr = new Date(meta.generatedAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverTitle}>INFORME DE EXPOSICIÓN CBAM</Text>
      <Text style={styles.coverYear}>
        Año fiscal: <Text style={{ fontFamily: 'Roboto', fontWeight: 'bold' }}>{meta.reportYear}</Text>
      </Text>
      <Text style={styles.coverRef}>Referencia: {meta.reportRef}</Text>

      <View style={styles.coverDivider} />

      <Text style={styles.coverLabel}>Preparado para:</Text>
      <Text style={styles.coverClient}>{client.companyName}</Text>
      <Text style={styles.coverClientDetail}>
        CIF: {client.cif || '—'} | EORI: {client.eori || '—'}
      </Text>
      <Text style={styles.coverClientDetail}>
        Contacto: {client.contactName} ({client.contactEmail})
      </Text>

      <Text style={styles.coverDate}>Fecha: {dateStr}</Text>
      <Text style={styles.coverConfidential}>CONFIDENCIAL</Text>
    </Page>
  )
}

// ============================================================
// PÁGINA INTERIOR REUTILIZABLE
// ============================================================
function ContentPage({ snapshot, children }) {
  return (
    <Page size="A4" style={styles.page}>
      <PageChrome reportRef={snapshot.meta.reportRef} />
      {children}
    </Page>
  )
}

// ============================================================
// SECCIÓN: ÍNDICE
// ============================================================
function TableOfContents() {
  const items = [
    ['1', 'Resumen Ejecutivo'],
    ['2', 'Importaciones CBAM'],
    ['3', 'Análisis de Emisiones'],
    ['4', 'Escenario Dual'],
    ['5', 'Cálculo de Certificados'],
    ['6', 'Recomendaciones'],
    ['7', 'Metodología y Marco Legal'],
  ]
  return (
    <>
      <Text style={styles.h1}>ÍNDICE</Text>
      <View style={styles.h1Underline} />
      {items.map(([num, title]) => (
        <View key={num} style={styles.tocRow}>
          <Text style={styles.tocNum}>{num}</Text>
          <Text style={styles.tocTitle}>{title}</Text>
        </View>
      ))}
    </>
  )
}

// ============================================================
// SECCIÓN: RESUMEN EJECUTIVO
// ============================================================
function ExecutiveSummary({ snapshot }) {
  const { totals } = snapshot

  return (
    <>
      <Text style={styles.h1}>1. RESUMEN EJECUTIVO</Text>
      <View style={styles.h1Underline} />

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiNum}>{fmtNum(totals.totalTonnes)}</Text>
          <Text style={styles.kpiLabel}>Toneladas importadas</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiNum}>{fmtNum(totals.totalEmissions, 1)}</Text>
          <Text style={styles.kpiLabel}>Emisiones (tCO₂e)</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiNum}>{fmtNum(totals.totalCertificates, 1)}</Text>
          <Text style={styles.kpiLabel}>Certificados CBAM</Text>
        </View>
        <View style={styles.kpiCardEmerald}>
          <Text style={styles.kpiNumGreen}>{fmtEUR(totals.totalCostReal)}</Text>
          <Text style={styles.kpiLabel}>Coste CBAM estimado</Text>
        </View>
      </View>

      {totals.totalSavings > 0 && (
        <View style={styles.savingsBox}>
          <Text style={styles.savingsText}>
            <Text style={{ fontFamily: 'Roboto', fontWeight: 'bold' }}>Ahorro por uso de datos reales: </Text>
            Al disponer de datos reales en {totals.linesWithRealData} de sus {totals.linesCount} líneas,
            el coste CBAM estimado se reduce en{' '}
            <Text style={{ fontFamily: 'Roboto', fontWeight: 'bold' }}>{fmtEUR(totals.totalSavings)}</Text>{' '}
            respecto al escenario con valores por defecto UE ({fmtEUR(totals.totalCostDefault)}).
            Esto representa un ahorro del{' '}
            <Text style={{ fontFamily: 'Roboto', fontWeight: 'bold' }}>{fmtNum(totals.savingsPct, 1)}%</Text>.
          </Text>
        </View>
      )}

      <Text style={styles.h2}>Parámetros de cálculo</Text>
      <Text style={styles.body}>
        Año fiscal:{' '}
        <Text style={{ fontFamily: 'Roboto', fontWeight: 'bold' }}>{snapshot.meta.reportYear}</Text>
        {'   '}|{'   '}
        Líneas analizadas:{' '}
        <Text style={{ fontFamily: 'Roboto', fontWeight: 'bold' }}>{totals.linesCount}</Text>
      </Text>
      {snapshot.meta.regulatoryParams && (
        <Text style={styles.body}>
          Precio certificado CBAM:{' '}
          <Text style={{ fontFamily: 'Roboto', fontWeight: 'bold' }}>
            {fmtNum(snapshot.meta.regulatoryParams.certificatePrice, 2)} EUR/tCO₂e
          </Text>{' '}
          ({formatApplicationQuarter(
            snapshot.meta.regulatoryParams.certificatePriceApplicationQuarter ||
              snapshot.meta.regulatoryParams.certificatePriceDate,
          )})
          {'   '}|{'   '}
          F_CBAM:{' '}
          <Text style={{ fontFamily: 'Roboto', fontWeight: 'bold' }}>
            {fmtNum(snapshot.meta.regulatoryParams.cbamFactor, 3)}
          </Text>{' '}
          ({fmtNum(snapshot.meta.regulatoryParams.cbamFactorPct, 1)}% obligación)
          {'   '}|{'   '}
          FCI:{' '}
          <Text style={{ fontFamily: 'Roboto', fontWeight: 'bold' }}>
            {fmtNum(snapshot.meta.regulatoryParams.fci, 3)}
          </Text>
        </Text>
      )}

      {totals.exceedsDeMinimis ? (
        <Text style={styles.body}>
          Su volumen total ({fmtNum(totals.totalTonnes)} t) <Text style={{ fontFamily: 'Roboto', fontWeight: 'bold' }}>supera el umbral de de minimis</Text> de 50 toneladas, por lo que está sujeto a obligaciones CBAM.
        </Text>
      ) : (
        <Text style={styles.body}>
          Su volumen total ({fmtNum(totals.totalTonnes)} t) está por debajo del umbral de de minimis de 50 toneladas. Verifique periódicamente para mantener la exención.
        </Text>
      )}
    </>
  )
}

// ============================================================
// SECCIÓN: IMPORTACIONES CBAM
// ============================================================
function ImportsSection({ snapshot }) {
  const { products } = snapshot

  // Anchos de columna en %
  const widths = ['6%', '14%', '32%', '14%', '14%', '20%']

  return (
    <>
      <Text style={styles.h1}>2. IMPORTACIONES CBAM</Text>
      <View style={styles.h1Underline} />
      <Text style={styles.body}>
        Tabla detallada de las {products.length} líneas de importación analizadas en este informe,
        ordenadas por código CN y origen.
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: widths[0] }]}>#</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[1] }]}>Código CN</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[2] }]}>Descripción</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[3] }]}>Origen</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[4] }]}>Toneladas</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[5] }]}>Proveedor</Text>
        </View>
        {products.map((p, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { width: widths[0] }]}>{p.index}</Text>
            <Text style={[styles.tableCell, { width: widths[1] }]}>{p.cnCode || '—'}</Text>
            <Text style={[styles.tableCell, { width: widths[2] }]}>{p.productDescription}</Text>
            <Text style={[styles.tableCell, { width: widths[3] }]}>
              {p.countryName || p.countryCode || '—'}
            </Text>
            <Text style={[styles.tableCellRight, { width: widths[4] }]}>{fmtNum(p.annualTonnes)}</Text>
            <Text style={[styles.tableCell, { width: widths[5] }]}>{p.supplierName || '—'}</Text>
          </View>
        ))}
      </View>
    </>
  )
}

// ============================================================
// SECCIÓN: ANÁLISIS DE EMISIONES
// ============================================================
function EmissionsSection({ snapshot }) {
  const { products } = snapshot
  const widths = ['6%', '24%', '14%', '14%', '14%', '14%', '14%']

  return (
    <>
      <Text style={styles.h1}>3. ANÁLISIS DE EMISIONES</Text>
      <View style={styles.h1Underline} />
      <Text style={styles.body}>
        Detalle del factor de emisión aplicado a cada línea, con indicación de la fuente
        (datos reales de instalación o valor por defecto UE).
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: widths[0] }]}>#</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[1] }]}>Producto</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[2] }]}>Fuente</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[3] }]}>FE aplicado</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[4] }]}>Benchmark</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[5] }]}>Sujetas</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[6] }]}>Total tCO₂e</Text>
        </View>
        {products.map((p, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { width: widths[0] }]}>{p.index}</Text>
            <Text style={[styles.tableCell, { width: widths[1] }]}>{p.productDescription}</Text>
            <Text style={[styles.tableCell, { width: widths[2] }]}>
              {p.emissionSource === 'real' ? 'Real' : 'Defecto'}
            </Text>
            <Text style={[styles.tableCellRight, { width: widths[3] }]}>
              {fmtNum(p.emissionFactorApplied, 3)}
            </Text>
            <Text style={[styles.tableCellRight, { width: widths[4] }]}>
              {fmtNum(p.benchmarkApplied, 3)}
            </Text>
            <Text style={[styles.tableCellRight, { width: widths[5] }]}>
              {fmtNum(p.emissionsSubjectToCbam, 3)}
            </Text>
            <Text style={[styles.tableCellRight, { width: widths[6] }]}>
              {fmtNum(p.totalEmissions, 1)}
            </Text>
          </View>
        ))}
      </View>
    </>
  )
}

// ============================================================
// SECCIÓN: ESCENARIO DUAL
// ============================================================
function DualScenarioSection({ snapshot }) {
  const { totals } = snapshot
  const widths = ['40%', '30%', '30%']

  return (
    <>
      <Text style={styles.h1}>4. ESCENARIO DUAL</Text>
      <View style={styles.h1Underline} />
      <Text style={styles.body}>
        Comparativa entre el coste calculado con datos reales (cuando están disponibles) y
        el coste con valores por defecto UE para todas las líneas.
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: widths[0] }]}>Métrica</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[1] }]}>Datos reales</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[2] }]}>Valores defecto</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: widths[0] }]}>Coste CBAM estimado</Text>
          <Text style={[styles.tableCellRight, { width: widths[1] }]}>{fmtEUR(totals.totalCostReal)}</Text>
          <Text style={[styles.tableCellRight, { width: widths[2] }]}>{fmtEUR(totals.totalCostDefault)}</Text>
        </View>
        <View style={styles.tableRowAlt}>
          <Text style={[styles.tableCell, { width: widths[0] }]}>Emisiones reales (tCO₂e)</Text>
          <Text style={[styles.tableCellRight, { width: widths[1] }]}>{fmtNum(totals.totalEmissionsReal, 1)}</Text>
          <Text style={[styles.tableCellRight, { width: widths[2] }]}>—</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: widths[0] }]}>Emisiones por defecto (tCO₂e)</Text>
          <Text style={[styles.tableCellRight, { width: widths[1] }]}>—</Text>
          <Text style={[styles.tableCellRight, { width: widths[2] }]}>{fmtNum(totals.totalEmissionsDefault, 1)}</Text>
        </View>
      </View>

      {totals.totalSavings > 0 && (
        <View style={styles.savingsBox}>
          <Text style={styles.savingsText}>
            <Text style={{ fontFamily: 'Roboto', fontWeight: 'bold' }}>
              Diferencial de ahorro: {fmtEUR(totals.totalSavings)} ({fmtNum(totals.savingsPct, 1)}%)
            </Text>
          </Text>
        </View>
      )}
    </>
  )
}

// ============================================================
// SECCIÓN: CÁLCULO DE CERTIFICADOS
// ============================================================
function CertificatesSection({ snapshot }) {
  const { totals, meta } = snapshot
  const reg = meta.regulatoryParams
  const price = reg?.certificatePrice ?? meta.co2Price
  // Etiqueta principal: trimestre de aplicación (Q1 2026), no fecha de publicación.
  // Fallback a certificatePriceDate por compatibilidad con snapshots anteriores
  // a la columna application_quarter (donde "date" ya guardaba un trimestre).
  const priceQuarterLabel = formatApplicationQuarter(
    reg?.certificatePriceApplicationQuarter || reg?.certificatePriceDate,
  )

  const widths = ['55%', '45%']

  return (
    <>
      <Text style={styles.h1}>5. CÁLCULO DE CERTIFICADOS</Text>
      <View style={styles.h1Underline} />

      <Text style={styles.body}>
        Resumen del cálculo de certificados CBAM aplicable al ejercicio {meta.reportYear},
        considerando el factor de obligación gradual (F_CBAM) y el factor de corrección
        intersectorial (FCI) establecidos por el Reglamento (UE) 2023/956 y el Reglamento
        de Ejecución (UE) 2025/2620.
      </Text>

      <Text style={styles.h3}>Fórmula aplicada</Text>
      <View style={styles.legalBox}>
        <Text style={styles.legalText}>
          Por línea: Certs. (tCO₂e) = Tn × max(0; FE − F_CBAM × FCI × BM)
        </Text>
        <Text style={styles.legalText}>
          Certs. a entregar (uds.) = redondeo al alza de Certs. (tCO₂e), aplicado
          por línea — Art. 20 Reg. (UE) 2023/956 (cada certificado representa
          exactamente 1 tCO₂e; el redondeo se aplica por línea, NO al total).
        </Text>
        <Text style={styles.legalText}>
          Coste total = suma por línea de (Certs. a entregar × Precio certificado CBAM)
        </Text>
        <Text style={styles.legalText}>
          FE = factor de emisión aplicado (real o default + markup) · BM = benchmark EU del
          código CN · F_CBAM = {fmtNum(reg?.cbamFactor ?? 0.975, 3)} ({fmtNum(reg?.cbamFactorPct ?? 2.5, 1)}% obligación en {meta.reportYear}) · FCI = {fmtNum(reg?.fci ?? 1, 3)}
        </Text>
      </View>

      {/* ── Tabla desglose por producto ── */}
      <Text style={styles.h3}>Desglose por producto</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: '4%' }]}>#</Text>
          <Text style={[styles.tableHeaderCell, { width: '18%' }]}>Producto</Text>
          <Text style={[styles.tableHeaderCell, { width: '8%' }]}>Tn</Text>
          <Text style={[styles.tableHeaderCell, { width: '10%' }]}>FE</Text>
          <Text style={[styles.tableHeaderCell, { width: '10%' }]}>BM_eff</Text>
          <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Emis. incorp.</Text>
          <Text style={[styles.tableHeaderCell, { width: '12%' }]}>AGIE</Text>
          <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Certs.{'\n'}tCO₂e / uds.</Text>
          <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Coste</Text>
        </View>
        {snapshot.products.map((p, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { width: '4%' }]}>{p.index}</Text>
            <Text style={[styles.tableCell, { width: '18%', fontSize: 6.5 }]}>
              {p.productDescription}{p.productionRouteApplied ? ` (${p.productionRouteApplied})` : ''}
            </Text>
            <Text style={[styles.tableCellRight, { width: '8%' }]}>{fmtNum(p.annualTonnes)}</Text>
            <Text style={[styles.tableCellRight, { width: '10%' }]}>
              {fmtNum(p.emissionFactorApplied, 3)}{p.benchmarkColumnUsed ? `\nCol ${p.benchmarkColumnUsed}` : ''}
            </Text>
            <Text style={[styles.tableCellRight, { width: '10%' }]}>{fmtNum(p.effectiveBenchmark, 4)}</Text>
            <Text style={[styles.tableCellRight, { width: '12%' }]}>{fmtNum(p.incorporatedEmissions, 2)}</Text>
            <Text style={[styles.tableCellRight, { width: '12%' }]}>{fmtNum(p.freeAllocationImplicit, 2)}</Text>
            <Text style={[styles.tableCellRight, { width: '12%' }]}>
              {fmtNum(p.certificatesPhysical ?? p.certificatesAfterAdjustment, 2)}
              {'\n'}
              <Text style={{ fontFamily: 'Roboto', fontWeight: 'bold' }}>
                {p.certificatesToSurrender != null ? `${fmtNum(p.certificatesToSurrender, 0)} uds.` : '— uds.'}
              </Text>
            </Text>
            <Text style={[styles.tableCellRight, { width: '14%', fontFamily: 'Roboto', fontWeight: 'bold' }]}>{fmtEUR(p.totalCost)}</Text>
          </View>
        ))}
        {/* Fila de totales */}
        <View style={[styles.tableRow, { backgroundColor: COLORS.navy }]}>
          <Text style={[styles.tableHeaderCell, { width: '22%' }]}>TOTAL</Text>
          <Text style={[styles.tableHeaderCell, { width: '8%', textAlign: 'right' }]}>{fmtNum(totals.totalTonnes)}</Text>
          <Text style={[styles.tableHeaderCell, { width: '10%' }]} />
          <Text style={[styles.tableHeaderCell, { width: '10%' }]} />
          <Text style={[styles.tableHeaderCell, { width: '12%', textAlign: 'right' }]}>{fmtNum(totals.totalIncorporatedEmissions, 2)}</Text>
          <Text style={[styles.tableHeaderCell, { width: '12%', textAlign: 'right' }]}>{fmtNum(totals.totalFreeAllocation, 2)}</Text>
          <View style={[styles.totalCertsCell, { width: '12%' }]}>
            <Text style={styles.totalCertsValue}>
              {fmtNum(totals.totalCertificatesPhysical ?? totals.totalCertificates, 2)}
            </Text>
            <Text style={styles.totalCertsValue}>
              {totals.totalCertificatesToSurrender != null
                ? `${fmtNum(totals.totalCertificatesToSurrender, 0)} uds.`
                : '— uds.'}
            </Text>
          </View>
          <Text style={[styles.tableHeaderCell, { width: '14%', textAlign: 'right' }]}>{fmtEUR(totals.totalCostReal)}</Text>
        </View>
      </View>

      {/* ── Tabla resumen agregado ── */}
      <Text style={styles.h3}>Resumen agregado</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: widths[0] }]}>Concepto</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[1] }]}>Valor</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: widths[0] }]}>
            Emisiones incorporadas totales (Tn × FE)
          </Text>
          <Text style={[styles.tableCellRight, { width: widths[1] }]}>
            {fmtNum(totals.totalIncorporatedEmissions ?? 0, 2)} tCO₂e
          </Text>
        </View>
        <View style={styles.tableRowAlt}>
          <Text style={[styles.tableCell, { width: widths[0] }]}>
            (−) Asignación gratuita implícita (AGIE = Tn × F_CBAM × FCI × BM)
          </Text>
          <Text style={[styles.tableCellRight, { width: widths[1] }]}>
            − {fmtNum(totals.totalFreeAllocation ?? 0, 2)} tCO₂e
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: widths[0] }]}>
            (=) Emisiones a certificar (tCO₂e)
          </Text>
          <Text style={[styles.tableCellRight, { width: widths[1], fontFamily: 'Roboto', fontWeight: 'bold' }]}>
            {fmtNum(totals.totalCertificatesPhysical ?? totals.totalCertificates, 2)} tCO₂e
          </Text>
        </View>
        <View style={styles.tableRowAlt}>
          <Text style={[styles.tableCell, { width: widths[0] }]}>
            Certificados a entregar — redondeo al alza por línea (Art. 20 Reg. (UE) 2023/956)
          </Text>
          <Text style={[styles.tableCellRight, { width: widths[1], fontFamily: 'Roboto', fontWeight: 'bold' }]}>
            {totals.totalCertificatesToSurrender != null
              ? `${fmtNum(totals.totalCertificatesToSurrender, 0)} uds.`
              : 'n/d'}
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: widths[0] }]}>
            (×) Precio certificado CBAM{priceQuarterLabel ? ` (${priceQuarterLabel})` : ''}
          </Text>
          <Text style={[styles.tableCellRight, { width: widths[1] }]}>
            {fmtNum(price, 2)} EUR/tCO₂e
          </Text>
        </View>
      </View>

      {!totals.hasCertificatesToSurrender && (
        <Text style={[styles.body, { fontSize: 8, color: COLORS.gray600, marginTop: 4 }]}>
          [Informe v3.0 pre-redondeo] Este informe se generó antes de la introducción del
          redondeo de certificados a unidades enteras por línea. Las cifras de coste reflejan
          la magnitud física decimal. Para un informe revisado con la entrega oficial al
          registro CBAM, regenerar desde el panel de asesoría.
        </Text>
      )}

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiNum}>
            {totals.totalCertificatesToSurrender != null
              ? fmtNum(totals.totalCertificatesToSurrender, 0)
              : fmtNum(totals.totalCertificates, 1)}
          </Text>
          <Text style={styles.kpiLabel}>
            {totals.totalCertificatesToSurrender != null
              ? 'Certificados a entregar (uds.)'
              : 'Certificados a entregar (tCO₂e)'}
          </Text>
        </View>
        <View style={styles.kpiCardEmerald}>
          <Text style={styles.kpiNumGreen}>{fmtEUR(totals.totalCostReal)}</Text>
          <Text style={styles.kpiLabel}>Coste total estimado</Text>
        </View>
      </View>

      <Text style={styles.body}>
        El precio del certificado CBAM se calcula y publica trimestralmente por la Comisión
        Europea como media de los precios de cierre EUA del trimestre anterior, conforme al
        Reglamento de Ejecución (UE) 2025/2548. El coste final podrá variar según el precio
        vigente en el trimestre de declaración.
      </Text>
    </>
  )
}

// ============================================================
// SECCIÓN: RECOMENDACIONES
// ============================================================
function RecommendationsSection({ snapshot }) {
  const recs = snapshot.recommendations || []

  function styleFor(priority) {
    if (priority === 'high') return styles.recCardHigh
    if (priority === 'medium') return styles.recCardMedium
    return styles.recCardLow
  }

  return (
    <>
      <Text style={styles.h1}>6. RECOMENDACIONES</Text>
      <View style={styles.h1Underline} />
      <Text style={styles.body}>
        Recomendaciones personalizadas a partir del análisis de su exposición CBAM,
        priorizadas por impacto.
      </Text>

      {recs.map((r, idx) => (
        <View key={r.id} style={styleFor(r.priority)} wrap={false}>
          <Text style={styles.recTitle}>
            {idx + 1}. {r.titleEs}
          </Text>
          <Text style={styles.recBody}>{r.bodyEs}</Text>
        </View>
      ))}
    </>
  )
}

// ============================================================
// SECCIÓN: MARCO LEGAL Y AVISO
// ============================================================
function LegalSection({ snapshot }) {
  const reg = snapshot?.meta?.regulatoryParams
  const sources = reg?.sources || {}
  const sourceList = Object.values(sources)

  const methWidths = ['32%', '22%', '46%']

  return (
    <>
      <Text style={styles.h1}>7. METODOLOGÍA Y MARCO LEGAL</Text>
      <View style={styles.h1Underline} />

      {reg && (
        <>
          <Text style={styles.h3}>Parámetros regulatorios aplicados</Text>
          <Text style={styles.body}>
            Todos los valores empleados en el cálculo proceden de fuentes oficiales publicadas
            por la Comisión Europea. Cada parámetro se cita con el acto jurídico que lo establece
            para garantizar la trazabilidad del informe.
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: methWidths[0] }]}>
                Parámetro
              </Text>
              <Text style={[styles.tableHeaderCell, { width: methWidths[1] }]}>
                Valor
              </Text>
              <Text style={[styles.tableHeaderCell, { width: methWidths[2] }]}>
                Fuente
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: methWidths[0] }]}>
                F_CBAM (factor de obligación gradual)
              </Text>
              <Text style={[styles.tableCellRight, { width: methWidths[1] }]}>
                {fmtNum(reg.cbamFactor, 3)}{'\n'}({fmtNum(reg.cbamFactorPct, 1)}% obligación)
              </Text>
              <Text style={[styles.tableCell, { width: methWidths[2] }]}>
                {reg.cbamFactorSource}
              </Text>
            </View>
            <View style={styles.tableRowAlt}>
              <Text style={[styles.tableCell, { width: methWidths[0] }]}>
                FCI (factor corrección intersectorial)
              </Text>
              <Text style={[styles.tableCellRight, { width: methWidths[1] }]}>
                {fmtNum(reg.fci, 3)}
              </Text>
              <Text style={[styles.tableCell, { width: methWidths[2] }]}>
                {reg.fciSource}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: methWidths[0] }]}>
                Precio certificado CBAM
              </Text>
              <Text style={[styles.tableCellRight, { width: methWidths[1] }]}>
                {fmtNum(reg.certificatePrice, 2)} €/tCO₂e{'\n'}
                ({formatApplicationQuarter(
                  reg.certificatePriceApplicationQuarter || reg.certificatePriceDate,
                )})
                {formatPublicationDateLabel(reg.certificatePricePublicationDate) && (
                  <Text style={{ fontSize: 6.5, color: COLORS.gray500 }}>
                    {'\n'}publicado {formatPublicationDateLabel(reg.certificatePricePublicationDate)}
                  </Text>
                )}
              </Text>
              <Text style={[styles.tableCell, { width: methWidths[2] }]}>
                {reg.certificatePriceRegulatoryRef}
                {'\n'}
                <Text style={{ fontSize: 7, color: COLORS.gray600 }}>
                  Origen: {priceLookupSourceLabel(reg.certificatePriceLookupSource)}
                </Text>
              </Text>
            </View>
            <View style={styles.tableRowAlt}>
              <Text style={[styles.tableCell, { width: methWidths[0] }]}>
                Valores por defecto sectoriales
              </Text>
              <Text style={[styles.tableCellRight, { width: methWidths[1] }]}>
                Anexo I
              </Text>
              <Text style={[styles.tableCell, { width: methWidths[2] }]}>
                {sources.DEFAULT_VALUES?.title || 'Reg. Ejecución (UE) 2025/2621'}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: methWidths[0] }]}>
                Redondeo certificados
              </Text>
              <Text style={[styles.tableCellRight, { width: methWidths[1] }]}>
                Redondeo al alza por línea
              </Text>
              <Text style={[styles.tableCell, { width: methWidths[2] }]}>
                Art. 20 Reg. (UE) 2023/956
              </Text>
            </View>
          </View>

          {priceNoteText(reg.certificatePriceLookupSource) && (
            <Text style={[styles.body, { fontSize: 8, color: COLORS.gray600, marginTop: 4 }]}>
              Nota precio: {priceNoteText(reg.certificatePriceLookupSource)}
            </Text>
          )}
          {reg.fciNote && (
            <Text style={[styles.body, { fontSize: 8, color: COLORS.gray600, marginTop: 2 }]}>
              Nota FCI: {reg.fciNote}
            </Text>
          )}
          <Text style={[styles.body, { fontSize: 8, color: COLORS.gray600, marginTop: 4 }]}>
            Nota Art. 9: el cálculo no incluye la deducción del Art. 9 Reg. (UE) 2023/956
            (precio del carbono pagado efectivamente en el país de origen). Es una deducción
            opcional, sujeta a prueba documental certificada por tercero independiente; para
            emisiones determinadas con valores por defecto no resulta aplicable en 2026, ya
            que los precios por defecto del carbono solo los determinará la Comisión a partir
            de 2027. Si su proveedor ha pagado un precio de carbono efectivo y verificable,
            consúltenos.
          </Text>
        </>
      )}

      <Text style={styles.h3}>Marco normativo de referencia</Text>
      {sourceList.length > 0 ? (
        sourceList.map((src) => (
          <Text key={src.id} style={styles.body}>
            • {src.fullTitle}
          </Text>
        ))
      ) : (
        <>
          <Text style={styles.body}>
            • Reglamento (UE) 2023/956 del Parlamento Europeo y del Consejo, de 10 de mayo de 2023,
            por el que se establece un Mecanismo de Ajuste en Frontera por Carbono (CBAM).
          </Text>
          <Text style={styles.body}>
            • Reglamento de Ejecución (UE) 2023/1773 de la Comisión sobre las normas de aplicación
            durante el período transitorio.
          </Text>
        </>
      )}

      {/* Bloque de aviso legal + pie de cierre: nunca se parte entre páginas. */}
      <View wrap={false}>
        <Text style={styles.h3}>Aviso legal</Text>
        <View style={styles.legalBox}>
          <Text style={styles.legalText}>
            Este informe ha sido elaborado por LexAduana como servicio profesional de asesoría
            basado en los datos facilitados por el cliente y los valores oficiales publicados
            por la Comisión Europea. Las cifras son estimaciones a partir de la mejor
            información disponible en el momento de su emisión y NO constituyen una
            declaración oficial CBAM.
          </Text>
          <Text style={styles.legalText}>
            La obligación legal de presentar declaraciones CBAM recae exclusivamente sobre el
            declarante autorizado conforme al Reglamento (UE) 2023/956. LexAduana no asume
            responsabilidad alguna por decisiones tomadas en base a este informe sin
            asesoramiento jurídico individualizado.
          </Text>
        </View>

        <Text style={[styles.body, { marginTop: 16, textAlign: 'center', color: COLORS.gray500 }]}>
          © LexAduana — info@lexaduana.es — lexaduana.es
        </Text>
      </View>
    </>
  )
}

// ============================================================
// DOCUMENTO PRINCIPAL
// ============================================================
function CbamReportDocument({ snapshot }) {
  return (
    <Document
      title={`Informe CBAM ${snapshot.meta.reportRef}`}
      author="LexAduana"
      subject={`Informe de exposición CBAM ${snapshot.meta.reportYear}`}
      keywords="CBAM, LexAduana, exposición, emisiones"
    >
      <CoverPage snapshot={snapshot} />

      <ContentPage snapshot={snapshot}>
        <TableOfContents />
        <View style={{ marginTop: 14 }} break={false} />
        <ExecutiveSummary snapshot={snapshot} />
      </ContentPage>

      <ContentPage snapshot={snapshot}>
        <ImportsSection snapshot={snapshot} />
      </ContentPage>

      <ContentPage snapshot={snapshot}>
        <EmissionsSection snapshot={snapshot} />
        <DualScenarioSection snapshot={snapshot} />
      </ContentPage>

      <ContentPage snapshot={snapshot}>
        <CertificatesSection snapshot={snapshot} />
        <RecommendationsSection snapshot={snapshot} />
      </ContentPage>

      <ContentPage snapshot={snapshot}>
        <LegalSection snapshot={snapshot} />
      </ContentPage>
    </Document>
  )
}

// ============================================================
// API PÚBLICA
// ============================================================

/**
 * Renderiza el snapshot a un Buffer PDF.
 *
 * @param {Object} snapshot - Snapshot construido con buildReportSnapshot()
 * @returns {Promise<Buffer>}
 */
export async function renderReportPdf(snapshot) {
  const instance = pdf(<CbamReportDocument snapshot={snapshot} />)
  const blob = await instance.toBlob()
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
