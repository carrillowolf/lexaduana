// ─────────────────────────────────────────────────────────────
// Parser de XML del H1 (CC415AV1Ent / Declaración de Importación)
// → JSON estructurado para el wizard RRM.
//
// Soporta:
//   - Tags con o sin namespace (búsqueda por nombre local).
//   - XML con guiones iniciales del visor B-First (limpieza previa).
//   - Múltiples GoodsShipmentItem.
//   - Campos opcionales (devuelve null/undefined sin romper).
//   - Importes y tasas como string ("83.000000") → Number.
//   - Fechas ISO ("2026-03-03T13:51:54") → DD/MM/YYYY.
//
// Uso (server-side):
//   import { parseH1Xml } from '@/lib/rrmParser'
//   const data = await parseH1Xml(xmlString)
//
// IMPORTANTE: nunca persistir el XML original (GDPR). Devolvemos
// sólo el JSON con los campos relevantes.
// ─────────────────────────────────────────────────────────────

import { parseStringPromise } from 'xml2js'

// ─── Helpers de navegación ───────────────────────────────────

function stripNs(tag) {
  const ix = tag.indexOf(':')
  return ix >= 0 ? tag.slice(ix + 1) : tag
}

function findAll(node, localName, acc = []) {
  if (!node || typeof node !== 'object') return acc
  for (const key of Object.keys(node)) {
    if (key === '$' || key === '_') continue
    if (stripNs(key) === localName) {
      const v = node[key]
      if (Array.isArray(v)) acc.push(...v)
      else acc.push(v)
    }
    const val = node[key]
    if (Array.isArray(val)) val.forEach((v) => findAll(v, localName, acc))
    else if (val && typeof val === 'object') findAll(val, localName, acc)
  }
  return acc
}

function findFirst(node, localName) {
  const all = findAll(node, localName)
  return all.length ? all[0] : null
}

function text(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) return text(value[0])
  if (typeof value === 'object') {
    if (typeof value._ === 'string') return value._.trim()
    return ''
  }
  return String(value).trim()
}

function child(node, localName) {
  if (!node || typeof node !== 'object') return null
  for (const key of Object.keys(node)) {
    if (stripNs(key) === localName) {
      const v = node[key]
      return Array.isArray(v) ? v[0] : v
    }
  }
  return null
}

function childText(node, localName) {
  return text(child(node, localName))
}

// Devuelve TODOS los hijos directos cuyo nombre local coincida (sin recursión).
function children(node, localName) {
  if (!node || typeof node !== 'object') return []
  const out = []
  for (const key of Object.keys(node)) {
    if (stripNs(key) === localName) {
      const v = node[key]
      if (Array.isArray(v)) out.push(...v)
      else out.push(v)
    }
  }
  return out
}

// ─── Conversores ─────────────────────────────────────────────

function toNumber(value) {
  const s = text(value)
  if (!s) return null
  const num = Number(s.replace(/,/g, '.'))
  return Number.isFinite(num) ? num : null
}

function isoToEsDate(iso) {
  if (!iso) return ''
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return String(iso)
  return `${m[3]}/${m[2]}/${m[1]}`
}

// ─── Limpieza previa del XML ─────────────────────────────────
// El visor B-First inserta guiones al inicio de líneas. Limpiamos.
// También quitamos BOM y espacios sobrantes.

function preCleanXml(raw) {
  if (typeof raw !== 'string') return ''
  let s = raw.replace(/^﻿/, '')
  s = s.replace(/^-/gm, '')
  return s.trim()
}

// ─── Extractores ─────────────────────────────────────────────

function extractAddress(addressNode) {
  if (!addressNode) return null
  return {
    line: childText(addressNode, 'streetAndNumber') || childText(addressNode, 'line'),
    postcode: childText(addressNode, 'postcode') || childText(addressNode, 'postcodeID'),
    city: childText(addressNode, 'city') || childText(addressNode, 'cityName'),
    country: childText(addressNode, 'country') || childText(addressNode, 'countryCode'),
  }
}

function extractParty(node) {
  if (!node) return null
  const eori = childText(node, 'identificationNumber') || childText(node, 'ID') || childText(node, 'EORI')
  const name = childText(node, 'name') || childText(node, 'Name')
  const address = extractAddress(child(node, 'Address'))
  return { eori, name, address }
}

function extractContactPerson(node) {
  if (!node) return null
  const cp = child(node, 'ContactPerson')
  if (!cp) return null
  return {
    name: childText(cp, 'name'),
    phone: childText(cp, 'phoneNumber'),
    email: childText(cp, 'eMailAddress') || childText(cp, 'emailAddress'),
  }
}

function extractTaricCode(commodityNode) {
  const codeNode = child(commodityNode, 'CommodityCode')
  if (!codeNode) return ''
  const hs = childText(codeNode, 'harmonizedSystemSubheadingCode') || childText(codeNode, 'harmonizedSystemSubHeadingCode')
  const cn = childText(codeNode, 'combinedNomenclatureCode')
  const tar = childText(codeNode, 'taricCode')
  return `${hs}${cn}${tar}`.replace(/\s+/g, '')
}

function extractItem(item) {
  const commodityNode = child(item, 'Commodity')
  const taricCode = commodityNode ? extractTaricCode(commodityNode) : ''
  const description = commodityNode ? childText(commodityNode, 'descriptionOfGoods') : ''

  const originNode = child(item, 'Origin')
  const originCountry = originNode ? childText(originNode, 'countryOfOrigin') : ''
  const preferentialOrigin = originNode ? childText(originNode, 'countryOfPreferentialOrigin') : ''

  const procedureNode = child(item, 'Procedure')
  const requestedProcedure = procedureNode ? childText(procedureNode, 'requestedProcedure') : ''
  const previousProcedure = procedureNode ? childText(procedureNode, 'previousProcedure') : ''

  const measureNode = child(item, 'GoodsMeasure')
  const grossMass = measureNode ? toNumber(childText(measureNode, 'grossMass')) : null
  const netMass = measureNode ? toNumber(childText(measureNode, 'netMass')) : null
  const supplementaryUnits = measureNode ? toNumber(childText(measureNode, 'supplementaryUnits')) : null

  const invoiceLineNode = child(item, 'InvoiceLine')
  const invoiceAmount = invoiceLineNode ? toNumber(childText(invoiceLineNode, 'itemAmountInvoiced')) : null

  const calcNode = commodityNode ? child(commodityNode, 'CalculationOfTaxes') : null
  const preference = calcNode ? childText(calcNode, 'preference') : ''

  // DutiesAndTaxes (puede haber varios bajo CalculationOfTaxes con taxType A00, B00, etc.)
  const taxNodes = calcNode ? children(calcNode, 'DutiesAndTaxes') : []
  let duty = { rate: null, base: null, amount: null }
  let vat = { rate: null, base: null, amount: null }
  taxNodes.forEach((dt) => {
    const taxType = childText(dt, 'taxType')
    const tb = child(dt, 'TaxBase')
    if (!tb) return
    const rate = toNumber(childText(tb, 'taxRate'))
    const base = toNumber(childText(tb, 'amount'))
    const amount = toNumber(childText(tb, 'taxAmount'))
    if (taxType === 'A00') duty = { rate, base, amount }
    else if (taxType === 'B00') vat = { rate, base, amount }
  })

  const packagingNode = child(item, 'Packaging')
  const packaging = packagingNode
    ? {
        type: childText(packagingNode, 'typeOfPackages'),
        count: toNumber(childText(packagingNode, 'numberOfPackages')),
        marks: childText(packagingNode, 'shippingMarks'),
      }
    : null

  const previousDocNode = child(item, 'PreviousDocument')
  const previousDocumentMRN = previousDocNode ? childText(previousDocNode, 'referenceNumber') : ''

  // CustomsValuation + AdditionsAndDeductions (sumar todos los AK)
  const valuationNode = child(item, 'CustomsValuation')
  const valuationMethod = valuationNode ? childText(valuationNode, 'valuationMethod') : ''
  const additionNodes = valuationNode ? children(valuationNode, 'AdditionsAndDeductions') : []
  const additions = { AK: 0 }
  additionNodes.forEach((a) => {
    const code = childText(a, 'code')
    const amount = toNumber(childText(a, 'amount'))
    if (!code || amount == null) return
    additions[code] = (additions[code] || 0) + amount
  })
  if (additions.AK === 0 && additionNodes.length === 0) additions.AK = null

  const sequenceNumber = toNumber(childText(item, 'sequenceNumber')) || null

  return {
    sequenceNumber,
    description,
    taricCode,
    originCountry,
    preferentialOrigin: preferentialOrigin || null,
    requestedProcedure,
    previousProcedure,
    statisticalValue: toNumber(childText(item, 'statisticalValue')),
    invoiceAmount,
    grossMass,
    netMass,
    supplementaryUnits,
    preference,
    duty,
    vat,
    packaging,
    previousDocumentMRN,
    valuationMethod,
    additions,
  }
}

// ─── Header extractor ────────────────────────────────────────

function extractHeader(parsed) {
  const messageNode = findFirst(parsed, 'Message')
  const preparationDateRaw = messageNode ? childText(messageNode, 'preparationDateAndTime') : ''
  const messageIdentification = messageNode ? childText(messageNode, 'messageIdentification') : ''

  const importOpNode = findFirst(parsed, 'ImportOperation')
  const lrn = importOpNode ? childText(importOpNode, 'LRN') : ''
  const declarationType = importOpNode ? childText(importOpNode, 'declarationType') : ''
  const additionalDeclarationType = importOpNode ? childText(importOpNode, 'additionalDeclarationType') : ''
  const languageCode = importOpNode ? childText(importOpNode, 'languageCode') : ''

  const customsOfImport = childText(findFirst(parsed, 'CustomsOfficeOfImport'), 'referenceNumber')
  const customsOfPresentation = childText(findFirst(parsed, 'CustomsOfficeOfPresentation'), 'referenceNumber')

  const importerNode = findFirst(parsed, 'Importer')
  const declarantNode = findFirst(parsed, 'Declarant')
  const representativeNode = findFirst(parsed, 'Representative')

  const importer = extractParty(importerNode)
  const declarant = extractParty(declarantNode)
  const representative = representativeNode
    ? {
        ...extractParty(representativeNode),
        status: childText(representativeNode, 'status'),
      }
    : null

  // Garantía
  const guaranteeNode = findFirst(parsed, 'Guarantee')
  const guarantee = guaranteeNode
    ? {
        type: childText(guaranteeNode, 'guaranteeType'),
        grn: childText(child(guaranteeNode, 'GuaranteeReference'), 'GRN'),
      }
    : null

  // Goods shipment-level
  const shipmentNode = findFirst(parsed, 'GoodsShipment')
  const natureOfTransaction = shipmentNode ? childText(shipmentNode, 'natureOfTransaction') : ''
  const invoiceCurrency = shipmentNode ? childText(shipmentNode, 'invoiceCurrency') : ''

  // Exporter
  const exporterNode = shipmentNode ? child(shipmentNode, 'Exporter') : null
  const exporter = exporterNode
    ? {
        name: childText(exporterNode, 'name'),
        eori: childText(exporterNode, 'identificationNumber') || null,
        address: extractAddress(child(exporterNode, 'Address')),
      }
    : null

  // Delivery / Incoterm
  const deliveryNode = shipmentNode ? child(shipmentNode, 'DeliveryTerms') : null
  const delivery = deliveryNode
    ? {
        incoterm: childText(deliveryNode, 'incotermCode'),
        location: childText(deliveryNode, 'location'),
        country: childText(deliveryNode, 'country'),
      }
    : null

  const countryOfDispatch = shipmentNode
    ? childText(child(shipmentNode, 'CountryOfDispatch'), 'countryOfDispatch')
    : ''
  const destinationNode = shipmentNode ? child(shipmentNode, 'Destination') : null
  const destination = destinationNode
    ? {
        country: childText(destinationNode, 'countryOfDestination'),
        region: childText(destinationNode, 'regionOfDestination'),
      }
    : null

  // Consignment
  const consignmentNode = shipmentNode ? child(shipmentNode, 'Consignment') : null
  const consignment = consignmentNode
    ? {
        inlandModeOfTransport: childText(consignmentNode, 'inlandModeOfTransport'),
        modeOfTransportAtTheBorder: childText(consignmentNode, 'modeOfTransportAtTheBorder'),
        grossMass: toNumber(childText(consignmentNode, 'grossMass')),
        ucr: childText(consignmentNode, 'referenceNumberUCR'),
        locationOfGoods: childText(child(consignmentNode, 'LocationOfGoods'), 'authorisationNumber'),
        transportDocuments: children(consignmentNode, 'TransportDocument').map((td) => ({
          type: childText(td, 'type'),
          referenceNumber: childText(td, 'referenceNumber'),
        })),
      }
    : null

  return {
    messageIdentification,
    preparationDate: preparationDateRaw,
    preparationDateFormatted: isoToEsDate(preparationDateRaw),
    lrn,
    declarationType,
    additionalDeclarationType,
    languageCode,
    customsOfficeOfImport: customsOfImport,
    customsOfficeOfPresentation: customsOfPresentation,
    importer,
    declarant,
    representative,
    guarantee,
    natureOfTransaction,
    invoiceCurrency,
    exporter,
    delivery,
    countryOfDispatch,
    destination,
    consignment,
  }
}

function extractContact(parsed) {
  const representativeNode = findFirst(parsed, 'Representative')
  if (representativeNode) {
    const cp = extractContactPerson(representativeNode)
    if (cp) return { source: 'representative', ...cp }
  }
  const declarantNode = findFirst(parsed, 'Declarant')
  if (declarantNode) {
    const cp = extractContactPerson(declarantNode)
    if (cp) return { source: 'declarant', ...cp }
  }
  return null
}

// ─── Construcción de shape legacy a partir del nuevo ─────────
// Mantiene compatibilidad con el cliente actual hasta que se
// adapte (commits posteriores de esta misma rama).

function buildLegacyShape({ header, items }) {
  const firstPrev = items.length ? items[0].previousDocumentMRN : ''
  const mrn = firstPrev || header.messageIdentification || ''

  const importerLegacy = header.importer || null
  const representativeLegacy = header.representative
    ? { eori: header.representative.eori, name: header.representative.name, address: header.representative.address }
    : null

  const goodsItems = items.map((it) => ({
    itemNumber: String(it.sequenceNumber || ''),
    commodityCode: it.taricCode,
    description: it.description,
    netMass: it.netMass,
    supplementaryUnits: it.supplementaryUnits,
    statisticalValue: it.statisticalValue,
    countryOfOrigin: it.originCountry,
    preferentialOrigin: it.preferentialOrigin,
    preference: it.preference,
    duties: [
      ...(it.duty.amount != null ? [{ type: 'A00', amount: it.duty.amount, base: it.duty.base, rate: it.duty.rate }] : []),
      ...(it.vat.amount != null ? [{ type: 'B00', amount: it.vat.amount, base: it.vat.base, rate: it.vat.rate }] : []),
    ],
  }))

  return {
    mrn,
    acceptanceDate: header.preparationDate ? header.preparationDate.slice(0, 10) : '',
    customsOffice: header.customsOfficeOfImport || '',
    requestedProcedure: items[0]?.requestedProcedure
      ? `${items[0].requestedProcedure}${items[0].previousProcedure || ''}`
      : '',
    deliveryTerms: header.delivery?.incoterm || '',
    customsValue: items.reduce((acc, it) => acc + (it.statisticalValue || 0), 0) || null,
    importer: importerLegacy,
    declarant: header.declarant,
    representative: representativeLegacy,
    goodsItems,
  }
}

// ─── API principal ───────────────────────────────────────────

export async function parseH1Xml(xmlString) {
  if (!xmlString || typeof xmlString !== 'string') {
    throw new Error('XML vacío')
  }

  const cleaned = preCleanXml(xmlString)
  if (!cleaned.startsWith('<')) {
    throw new Error('El contenido no parece XML')
  }

  let parsed
  try {
    parsed = await parseStringPromise(cleaned, {
      explicitArray: false,
      trim: true,
      mergeAttrs: false,
    })
  } catch (e) {
    throw new Error(`XML mal formado: ${e?.message || e}`)
  }

  // Verificación mínima: que sea un H1 reconocible
  const looksLikeH1 = !!findFirst(parsed, 'CC415A') || !!findFirst(parsed, 'GoodsShipment')
  if (!looksLikeH1) {
    throw new Error('No es un mensaje H1 (CC415AV1Ent / GoodsShipment no encontrados)')
  }

  const header = extractHeader(parsed)
  const contact = extractContact(parsed)

  const itemNodes = findAll(parsed, 'GoodsShipmentItem')
  const items = itemNodes.map(extractItem)

  const summary = {
    totalItems: items.length,
    totalDuty: items.reduce((acc, it) => acc + (it.duty.amount || 0), 0),
    totalVAT: items.reduce((acc, it) => acc + (it.vat.amount || 0), 0),
    totalAdditions: items.reduce((acc, it) => acc + (it.additions?.AK || 0), 0),
    totalInvoiceAmount: items.reduce((acc, it) => acc + (it.invoiceAmount || 0), 0),
    totalStatisticalValue: items.reduce((acc, it) => acc + (it.statisticalValue || 0), 0),
  }

  const legacy = buildLegacyShape({ header, items })

  return {
    // Nuevo shape (Iteración 3)
    header,
    contact,
    items,
    summary,
    // Legacy (compat con cliente actual hasta refactor en próximos commits)
    ...legacy,
  }
}
