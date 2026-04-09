/**
 * CBAM Report Generator - Phase 3
 *
 * Genera el PDF profesional del informe CBAM usando @react-pdf/renderer.
 * Replica el diseño del prototipo (generate_cbam_report_REFERENCIA.py).
 *
 * Bilingüe ES + EN forzado.
 *
 * Uso:
 *   import { renderReportPdf } from '@/lib/cbamReportGenerator'
 *   const buffer = await renderReportPdf(snapshot)
 */

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'

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
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: COLORS.text,
    lineHeight: 1.4,
  },
  // ----- Cover -----
  coverPage: {
    backgroundColor: COLORS.navy,
    padding: 50,
    fontFamily: 'Helvetica',
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
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
    fontFamily: 'Helvetica-Bold',
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
    fontFamily: 'Helvetica-Bold',
    color: COLORS.red,
    marginTop: 8,
  },
  // ----- Headings -----
  h1: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
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
    fontFamily: 'Helvetica-Bold',
    color: COLORS.navyLight,
    marginTop: 14,
    marginBottom: 8,
  },
  h3: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
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
    fontFamily: 'Helvetica-Oblique',
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
    fontFamily: 'Helvetica-Bold',
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
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiCardEmerald: {
    flex: 1,
    backgroundColor: COLORS.emeraldBg,
    borderWidth: 0.5,
    borderColor: COLORS.emerald,
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiNum: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.navy,
    textAlign: 'center',
  },
  kpiNumGreen: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.emerald,
    textAlign: 'center',
  },
  kpiLabel: {
    fontSize: 8,
    color: COLORS.gray600,
    textAlign: 'center',
    marginTop: 4,
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
    fontFamily: 'Helvetica-Oblique',
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
    fontFamily: 'Helvetica-Bold',
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
    fontFamily: 'Helvetica-Bold',
    padding: 5,
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
    fontFamily: 'Helvetica-Bold',
    color: COLORS.navy,
    marginBottom: 2,
  },
  recTitleEn: {
    fontSize: 9,
    fontFamily: 'Helvetica-Oblique',
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
    fontFamily: 'Helvetica-Oblique',
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

// ============================================================
// HEADER / FOOTER (en cada página excepto portada)
// ============================================================
function PageChrome({ reportRef }) {
  return (
    <>
      <View style={styles.pageHeader} fixed>
        <Text>LexAduana — Informe CBAM / CBAM Report — Ref: {reportRef}</Text>
        <Text>CONFIDENCIAL / CONFIDENTIAL</Text>
      </View>
      <View style={styles.pageFooter} fixed>
        <Text>lexaduana.es</Text>
        <Text
          render={({ pageNumber, totalPages }) =>
            `Página / Page ${pageNumber} de / of ${totalPages}`
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
  const dateEnStr = new Date(meta.generatedAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverTitle}>INFORME DE EXPOSICIÓN CBAM</Text>
      <Text style={styles.coverTitleEn}>CBAM EXPOSURE REPORT</Text>
      <Text style={styles.coverYear}>
        Año fiscal / Fiscal year: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{meta.reportYear}</Text>
      </Text>
      <Text style={styles.coverRef}>Referencia / Reference: {meta.reportRef}</Text>

      <View style={styles.coverDivider} />

      <Text style={styles.coverLabel}>Preparado para / Prepared for:</Text>
      <Text style={styles.coverClient}>{client.companyName}</Text>
      <Text style={styles.coverClientDetail}>
        CIF: {client.cif || '—'} | EORI: {client.eori || '—'}
      </Text>
      <Text style={styles.coverClientDetail}>
        Contacto / Contact: {client.contactName} ({client.contactEmail})
      </Text>

      <Text style={styles.coverDate}>Fecha / Date: {dateStr} / {dateEnStr}</Text>
      <Text style={styles.coverConfidential}>CONFIDENCIAL / CONFIDENTIAL</Text>
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
    ['1', 'Resumen Ejecutivo / Executive Summary'],
    ['2', 'Importaciones CBAM / CBAM Imports'],
    ['3', 'Análisis de Emisiones / Emissions Analysis'],
    ['4', 'Escenario Dual / Dual Scenario'],
    ['5', 'Cálculo de Certificados / Certificate Calculation'],
    ['6', 'Recomendaciones / Recommendations'],
    ['7', 'Metodología y Marco Legal / Methodology & Legal Framework'],
  ]
  return (
    <>
      <Text style={styles.h1}>ÍNDICE / TABLE OF CONTENTS</Text>
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
      <Text style={styles.h1}>1. RESUMEN EJECUTIVO / EXECUTIVE SUMMARY</Text>
      <View style={styles.h1Underline} />

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiNum}>{fmtNum(totals.totalTonnes)}</Text>
          <Text style={styles.kpiLabel}>Toneladas importadas{'\n'}Tonnes imported</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiNum}>{fmtNum(totals.totalEmissions, 1)}</Text>
          <Text style={styles.kpiLabel}>tCO₂e emisiones totales{'\n'}total emissions</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiNum}>{fmtNum(totals.totalCertificates, 1)}</Text>
          <Text style={styles.kpiLabel}>Certificados CBAM{'\n'}CBAM certificates</Text>
        </View>
        <View style={styles.kpiCardEmerald}>
          <Text style={styles.kpiNumGreen}>{fmtEUR(totals.totalCostReal)}</Text>
          <Text style={styles.kpiLabel}>Coste CBAM estimado{'\n'}Estimated CBAM cost</Text>
        </View>
      </View>

      {totals.totalSavings > 0 && (
        <View style={styles.savingsBox}>
          <Text style={styles.savingsText}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Ahorro por uso de datos reales: </Text>
            Al disponer de datos reales en {totals.linesWithRealData} de sus {totals.linesCount} líneas,
            el coste CBAM estimado se reduce en{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{fmtEUR(totals.totalSavings)}</Text>{' '}
            respecto al escenario con valores por defecto UE ({fmtEUR(totals.totalCostDefault)}).
            Esto representa un ahorro del{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{fmtNum(totals.savingsPct, 1)}%</Text>.
          </Text>
          <Text style={styles.savingsTextEn}>
            Savings from actual data: By having actual data for {totals.linesWithRealData} of your{' '}
            {totals.linesCount} lines, the estimated CBAM cost is reduced by{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{fmtEUR(totals.totalSavings)}</Text>{' '}
            compared to EU default values ({fmtEUR(totals.totalCostDefault)}). This represents a{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{fmtNum(totals.savingsPct, 1)}%</Text> saving.
          </Text>
        </View>
      )}

      <Text style={styles.h2}>Parámetros de cálculo / Calculation parameters</Text>
      <Text style={styles.body}>
        Año fiscal / Fiscal year:{' '}
        <Text style={{ fontFamily: 'Helvetica-Bold' }}>{snapshot.meta.reportYear}</Text>
        {'   '}|{'   '}
        Líneas analizadas / Lines analyzed:{' '}
        <Text style={{ fontFamily: 'Helvetica-Bold' }}>{totals.linesCount}</Text>
      </Text>
      {snapshot.meta.regulatoryParams && (
        <Text style={styles.body}>
          Precio certificado CBAM / CBAM certificate price:{' '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>
            {fmtNum(snapshot.meta.regulatoryParams.certificatePrice, 2)} EUR/tCO₂e
          </Text>{' '}
          ({snapshot.meta.regulatoryParams.certificatePriceDate})
          {'   '}|{'   '}
          F_CBAM:{' '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>
            {fmtNum(snapshot.meta.regulatoryParams.cbamFactor, 3)}
          </Text>{' '}
          ({fmtNum(snapshot.meta.regulatoryParams.cbamFactorPct, 1)}% obligación)
          {'   '}|{'   '}
          FCI:{' '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>
            {fmtNum(snapshot.meta.regulatoryParams.fci, 3)}
          </Text>
        </Text>
      )}

      {totals.exceedsDeMinimis ? (
        <Text style={styles.body}>
          Su volumen total ({fmtNum(totals.totalTonnes)} t) <Text style={{ fontFamily: 'Helvetica-Bold' }}>supera el umbral de de minimis</Text> de 50 toneladas, por lo que está sujeto a obligaciones CBAM.
          {'\n'}
          <Text style={styles.bodyEn}>
            Your total volume ({fmtNum(totals.totalTonnes)} t) exceeds the 50-tonne de minimis threshold and is subject to CBAM obligations.
          </Text>
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
      <Text style={styles.h1}>2. IMPORTACIONES CBAM / CBAM IMPORTS</Text>
      <View style={styles.h1Underline} />
      <Text style={styles.body}>
        Tabla detallada de las {products.length} líneas de importación analizadas en este informe,
        ordenadas por código CN y origen.
      </Text>
      <Text style={styles.bodyEn}>
        Detailed table of the {products.length} import lines analyzed in this report,
        sorted by CN code and origin.
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: widths[0] }]}>#</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[1] }]}>Código CN{'\n'}CN Code</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[2] }]}>Descripción{'\n'}Description</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[3] }]}>Origen{'\n'}Origin</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[4] }]}>Toneladas{'\n'}Tonnes</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[5] }]}>Proveedor{'\n'}Supplier</Text>
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
      <Text style={styles.h1}>3. ANÁLISIS DE EMISIONES / EMISSIONS ANALYSIS</Text>
      <View style={styles.h1Underline} />
      <Text style={styles.body}>
        Detalle del factor de emisión aplicado a cada línea, con indicación de la fuente
        (datos reales de instalación o valor por defecto UE).
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: widths[0] }]}>#</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[1] }]}>Producto{'\n'}Product</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[2] }]}>Fuente{'\n'}Source</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[3] }]}>FE aplicado{'\n'}EF applied</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[4] }]}>Benchmark</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[5] }]}>Sujetas{'\n'}Subject</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[6] }]}>Total tCO₂e</Text>
        </View>
        {products.map((p, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { width: widths[0] }]}>{p.index}</Text>
            <Text style={[styles.tableCell, { width: widths[1] }]}>{p.productDescription}</Text>
            <Text style={[styles.tableCell, { width: widths[2] }]}>
              {p.emissionSource === 'real' ? 'Real' : 'Defecto / Default'}
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
      <Text style={styles.h1}>4. ESCENARIO DUAL / DUAL SCENARIO</Text>
      <View style={styles.h1Underline} />
      <Text style={styles.body}>
        Comparativa entre el coste calculado con datos reales (cuando están disponibles) y
        el coste con valores por defecto UE para todas las líneas.
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: widths[0] }]}>Métrica / Metric</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[1] }]}>Datos reales{'\n'}Actual data</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[2] }]}>Valores defecto{'\n'}Default values</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: widths[0] }]}>Coste CBAM estimado / Estimated CBAM cost</Text>
          <Text style={[styles.tableCellRight, { width: widths[1] }]}>{fmtEUR(totals.totalCostReal)}</Text>
          <Text style={[styles.tableCellRight, { width: widths[2] }]}>{fmtEUR(totals.totalCostDefault)}</Text>
        </View>
        <View style={styles.tableRowAlt}>
          <Text style={[styles.tableCell, { width: widths[0] }]}>Emisiones reales / Real emissions (tCO₂e)</Text>
          <Text style={[styles.tableCellRight, { width: widths[1] }]}>{fmtNum(totals.totalEmissionsReal, 1)}</Text>
          <Text style={[styles.tableCellRight, { width: widths[2] }]}>—</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: widths[0] }]}>Emisiones por defecto / Default emissions (tCO₂e)</Text>
          <Text style={[styles.tableCellRight, { width: widths[1] }]}>—</Text>
          <Text style={[styles.tableCellRight, { width: widths[2] }]}>{fmtNum(totals.totalEmissionsDefault, 1)}</Text>
        </View>
      </View>

      {totals.totalSavings > 0 && (
        <View style={styles.savingsBox}>
          <Text style={styles.savingsText}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
              Diferencial de ahorro: {fmtEUR(totals.totalSavings)} ({fmtNum(totals.savingsPct, 1)}%)
            </Text>
          </Text>
          <Text style={styles.savingsTextEn}>
            Savings differential: {fmtEUR(totals.totalSavings)} ({fmtNum(totals.savingsPct, 1)}%)
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
  const priceDate = reg?.certificatePriceDate

  const widths = ['55%', '45%']

  return (
    <>
      <Text style={styles.h1}>5. CÁLCULO DE CERTIFICADOS / CERTIFICATE CALCULATION</Text>
      <View style={styles.h1Underline} />

      <Text style={styles.body}>
        Resumen del cálculo de certificados CBAM aplicable al ejercicio {meta.reportYear},
        considerando el factor de obligación gradual (F_CBAM) y el factor de corrección
        intersectorial (FCI) establecidos por el Reglamento (UE) 2023/956 y el Reglamento
        de Ejecución (UE) 2025/2620.
      </Text>
      <Text style={styles.bodyEn}>
        Summary of CBAM certificate calculation for fiscal year {meta.reportYear}, applying
        the gradual obligation factor (F_CBAM) and the cross-sectoral correction factor (FCI)
        set by Regulation (EU) 2023/956 and Implementing Regulation (EU) 2025/2620.
      </Text>

      <Text style={styles.h3}>Fórmula aplicada / Applied formula</Text>
      <View style={styles.legalBox}>
        <Text style={styles.legalText}>
          Certificados = Σ Toneladas × max(0, FE − F_CBAM × FCI × BM)
        </Text>
        <Text style={styles.legalText}>
          Coste = Certificados × Precio certificado CBAM
        </Text>
        <Text style={styles.legalText}>
          FE = factor de emisión aplicado (real o default + markup) · BM = benchmark EU del
          sector · F_CBAM = {fmtNum(reg?.cbamFactor ?? 0.975, 3)} ({fmtNum(reg?.cbamFactorPct ?? 2.5, 1)}% obligación en {meta.reportYear}) · FCI = {fmtNum(reg?.fci ?? 1, 3)}
        </Text>
      </View>

      <Text style={styles.h3}>Desglose / Breakdown</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: widths[0] }]}>Concepto / Concept</Text>
          <Text style={[styles.tableHeaderCell, { width: widths[1] }]}>Valor / Value</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: widths[0] }]}>
            Emisiones incorporadas totales (Tn × FE){'\n'}
            Total incorporated emissions
          </Text>
          <Text style={[styles.tableCellRight, { width: widths[1] }]}>
            {fmtNum(totals.totalIncorporatedEmissions ?? 0, 2)} tCO₂e
          </Text>
        </View>
        <View style={styles.tableRowAlt}>
          <Text style={[styles.tableCell, { width: widths[0] }]}>
            (−) Asignación gratuita implícita (AGIE = Tn × F_CBAM × FCI × BM){'\n'}
            Implicit free allocation
          </Text>
          <Text style={[styles.tableCellRight, { width: widths[1] }]}>
            − {fmtNum(totals.totalFreeAllocation ?? 0, 2)} tCO₂e
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: widths[0] }]}>
            (=) Certificados CBAM a entregar{'\n'}
            CBAM certificates to surrender
          </Text>
          <Text style={[styles.tableCellRight, { width: widths[1], fontFamily: 'Helvetica-Bold' }]}>
            {fmtNum(totals.totalCertificates, 2)} tCO₂e
          </Text>
        </View>
        <View style={styles.tableRowAlt}>
          <Text style={[styles.tableCell, { width: widths[0] }]}>
            (×) Precio certificado CBAM{priceDate ? ` (${priceDate})` : ''}{'\n'}
            CBAM certificate price
          </Text>
          <Text style={[styles.tableCellRight, { width: widths[1] }]}>
            {fmtNum(price, 2)} EUR/tCO₂e
          </Text>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiNum}>{fmtNum(totals.totalCertificates, 1)}</Text>
          <Text style={styles.kpiLabel}>Certificados a entregar{'\n'}Certificates to surrender</Text>
        </View>
        <View style={styles.kpiCardEmerald}>
          <Text style={styles.kpiNumGreen}>{fmtEUR(totals.totalCostReal)}</Text>
          <Text style={styles.kpiLabel}>Coste total estimado{'\n'}Total estimated cost</Text>
        </View>
      </View>

      <Text style={styles.body}>
        El precio del certificado CBAM se calcula y publica semanalmente por la Comisión Europea
        como media de los precios de cierre EUA de la semana anterior, conforme al Reglamento
        de Ejecución (UE) 2025/2548. El coste final podrá variar según el precio vigente en
        el trimestre de declaración.
      </Text>
      <Text style={styles.bodyEn}>
        The CBAM certificate price is calculated and published weekly by the European Commission
        as the average of the previous week&apos;s EUA closing prices, per Implementing Regulation
        (EU) 2025/2548. The final cost may vary based on the price in force in the declaration quarter.
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
      <Text style={styles.h1}>6. RECOMENDACIONES / RECOMMENDATIONS</Text>
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
          <Text style={styles.recTitleEn}>{r.titleEn}</Text>
          <Text style={styles.recBody}>{r.bodyEs}</Text>
          <Text style={styles.recBodyEn}>{r.bodyEn}</Text>
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
      <Text style={styles.h1}>7. METODOLOGÍA Y MARCO LEGAL / METHODOLOGY & LEGAL FRAMEWORK</Text>
      <View style={styles.h1Underline} />

      {reg && (
        <>
          <Text style={styles.h3}>Parámetros regulatorios aplicados / Applied regulatory parameters</Text>
          <Text style={styles.body}>
            Todos los valores empleados en el cálculo proceden de fuentes oficiales publicadas
            por la Comisión Europea. Cada parámetro se cita con el acto jurídico que lo establece
            para garantizar la trazabilidad del informe.
          </Text>
          <Text style={styles.bodyEn}>
            All values used in the calculation come from official sources published by the
            European Commission. Each parameter is cited with its establishing legal act to
            guarantee traceability.
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: methWidths[0] }]}>
                Parámetro{'\n'}Parameter
              </Text>
              <Text style={[styles.tableHeaderCell, { width: methWidths[1] }]}>
                Valor{'\n'}Value
              </Text>
              <Text style={[styles.tableHeaderCell, { width: methWidths[2] }]}>
                Fuente / Source
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: methWidths[0] }]}>
                F_CBAM (factor de obligación gradual){'\n'}Gradual obligation factor
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
                FCI (factor corrección intersectorial){'\n'}Cross-sectoral correction factor
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
                Precio certificado CBAM{'\n'}CBAM certificate price
              </Text>
              <Text style={[styles.tableCellRight, { width: methWidths[1] }]}>
                {fmtNum(reg.certificatePrice, 2)} €/tCO₂e{'\n'}({reg.certificatePriceDate})
              </Text>
              <Text style={[styles.tableCell, { width: methWidths[2] }]}>
                {reg.certificatePriceSource}
              </Text>
            </View>
            <View style={styles.tableRowAlt}>
              <Text style={[styles.tableCell, { width: methWidths[0] }]}>
                Valores por defecto sectoriales{'\n'}Sectoral default values
              </Text>
              <Text style={[styles.tableCellRight, { width: methWidths[1] }]}>
                Anexo II{'\n'}Annex II
              </Text>
              <Text style={[styles.tableCell, { width: methWidths[2] }]}>
                {sources.DEFAULT_VALUES?.title || 'Reg. Ejecución (UE) 2025/2621'}
              </Text>
            </View>
          </View>

          {reg.certificatePriceNote && (
            <Text style={[styles.body, { fontSize: 8, color: COLORS.gray600, marginTop: 4 }]}>
              Nota / Note: {reg.certificatePriceNote}
            </Text>
          )}
        </>
      )}

      <Text style={styles.h3}>Marco normativo de referencia / Reference regulatory framework</Text>
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

      <Text style={styles.h3}>Aviso legal / Legal disclaimer</Text>
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
        <Text style={styles.legalText}>
          This report has been prepared by LexAduana as a professional advisory service based
          on data provided by the client and official values published by the European Commission.
          The figures are estimates based on the best available information at the time of
          issuance and do NOT constitute an official CBAM declaration.
        </Text>
        <Text style={styles.legalText}>
          The legal obligation to submit CBAM declarations falls exclusively on the authorized
          declarant under Regulation (EU) 2023/956. LexAduana assumes no responsibility for
          decisions made based on this report without individualized legal advice.
        </Text>
      </View>

      <Text style={[styles.body, { marginTop: 16, textAlign: 'center', color: COLORS.gray500 }]}>
        © LexAduana — info@lexaduana.es — lexaduana.es
      </Text>
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
