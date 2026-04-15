// ─────────────────────────────────────────────────────────────
// Parser de XML del H1 (Declaración de Importación) → JSON
// estructurado para el wizard RRM.
//
// El esquema oficial varía entre prefijos de namespace y entre
// versiones de la Guía Técnica AEAT. Para ser tolerantes, hacemos
// búsqueda profunda por nombre local de etiqueta (sin prefijos).
//
// Uso (server-side):
//   import { parseH1Xml } from '@/lib/rrmParser'
//   const data = await parseH1Xml(xmlString)
//
// IMPORTANTE: nunca persistir el XML original (GDPR). Devolvemos
// sólo el JSON con los campos relevantes.
// ─────────────────────────────────────────────────────────────

import { parseStringPromise } from 'xml2js'

// Quita prefijos namespace ("ns:Tag" → "Tag").
function stripNs(tag) {
  const ix = tag.indexOf(':')
  return ix >= 0 ? tag.slice(ix + 1) : tag
}

// Walker recursivo que devuelve TODOS los nodos cuyo nombre local
// coincida con `localName`.
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

// Devuelve el texto plano de un nodo xml2js (puede ser string,
// objeto con `_`, o array).
function text(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) return text(value[0])
  if (typeof value === 'object') {
    if (typeof value._ === 'string') return value._.trim()
    // Si es un objeto sin texto, intentamos serializar simple.
    return ''
  }
  return String(value).trim()
}

// Extrae primer hijo cuyo nombre local coincida.
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

// Parsea importes (puede venir como string con coma o con punto, y
// los nodos pueden tener atributo currency en `$.currencyID`).
function parseAmount(value) {
  if (value == null) return null
  let raw = ''
  let currency = null
  if (typeof value === 'object' && !Array.isArray(value)) {
    raw = value._ || ''
    currency = value.$?.currencyID || value.$?.currencyCode || null
  } else {
    raw = text(value)
  }
  if (!raw) return null
  const num = Number(String(raw).replace(/\./g, '').replace(',', '.'))
  if (Number.isNaN(num)) return null
  return { amount: num, currency: currency || 'EUR' }
}

// ─────────────────────────────────────────────────────────────
// Extractores de alto nivel
// ─────────────────────────────────────────────────────────────

function extractParty(node) {
  if (!node) return null
  const eori = childText(node, 'identificationNumber') || childText(node, 'ID') || childText(node, 'EORI')
  const name = childText(node, 'name') || childText(node, 'Name')
  const addressNode = child(node, 'Address') || child(node, 'address')
  const address = addressNode
    ? {
        line: childText(addressNode, 'line') || childText(addressNode, 'streetAndNumber'),
        city: childText(addressNode, 'cityName') || childText(addressNode, 'city'),
        postcode: childText(addressNode, 'postcodeID') || childText(addressNode, 'postcode'),
        country: childText(addressNode, 'countryCode') || childText(addressNode, 'country'),
      }
    : null
  return { eori, name, address }
}

function extractGoodsItem(item) {
  const commodityNode = child(item, 'Commodity') || child(item, 'commodity')
  const codeNode = commodityNode ? child(commodityNode, 'CommodityCode') || child(commodityNode, 'classification') : null

  let commodityCode = ''
  if (codeNode) {
    const hs = childText(codeNode, 'harmonizedSystemSubHeadingCode')
    const cn = childText(codeNode, 'combinedNomenclatureCode')
    const taric = childText(codeNode, 'taricCode')
    commodityCode = `${hs}${cn}${taric}`.replace(/\s+/g, '')
  }
  if (!commodityCode) {
    commodityCode = childText(item, 'commodityCode') || childText(item, 'CommodityCode')
  }

  const measure = child(item, 'GoodsMeasure') || child(item, 'goodsMeasure')

  // Liquidación (DutyTaxFee).
  const dutyTaxFees = findAll(item, 'DutyTaxFee').concat(findAll(item, 'dutyTaxFee'))
  const duties = dutyTaxFees
    .map((d) => {
      const type = childText(d, 'dutyRegimeCode') || childText(d, 'typeCode') || childText(d, 'type')
      const amount = parseAmount(child(d, 'dutyAmount') || child(d, 'amount'))
      const base = parseAmount(child(d, 'taxBaseAmount') || child(d, 'base'))
      const rate = childText(d, 'taxRate') || childText(d, 'rate')
      return { type, amount: amount?.amount ?? null, base: base?.amount ?? null, rate }
    })
    .filter((d) => d.type)

  return {
    itemNumber: childText(item, 'sequenceNumber') || childText(item, 'goodsItemNumber'),
    commodityCode,
    description: commodityNode ? childText(commodityNode, 'description') : childText(item, 'description'),
    netMass: childText(measure, 'netNetWeightMeasure') || childText(measure, 'netWeightMeasure'),
    supplementaryUnits: childText(measure, 'tariffQuantity') || childText(measure, 'supplementaryUnits'),
    statisticalValue: parseAmount(child(item, 'StatisticalValueAmount') || child(item, 'statisticalValueAmount'))
      ?.amount ?? null,
    itemPrice: parseAmount(
      child(child(item, 'CustomsValuation'), 'itemChargeAmount') ||
        child(item, 'itemChargeAmount')
    )?.amount ?? null,
    countryOfOrigin:
      (commodityNode && childText(commodityNode, 'countryOfOrigin')) ||
      childText(item, 'originCountryCode') ||
      childText(item, 'countryOfOrigin'),
    preferentialOrigin:
      (commodityNode && childText(commodityNode, 'countryOfPreferentialOrigin')) ||
      childText(item, 'preferentialOriginCountryCode'),
    preference: childText(item, 'preferenceCode') || childText(item, 'preference'),
    duties,
  }
}

// ─────────────────────────────────────────────────────────────
// API principal
// ─────────────────────────────────────────────────────────────

export async function parseH1Xml(xmlString) {
  if (!xmlString || typeof xmlString !== 'string') {
    throw new Error('XML vacío')
  }

  const parsed = await parseStringPromise(xmlString, {
    explicitArray: false,
    trim: true,
    mergeAttrs: false,
  })

  // Cabecera de la declaración.
  const mrn =
    findFirst(parsed, 'MRN') !== null
      ? text(findFirst(parsed, 'MRN'))
      : text(findFirst(parsed, 'customsRegistrationNumber'))

  const acceptanceDate =
    text(findFirst(parsed, 'acceptanceDateTime')) ||
    text(findFirst(parsed, 'acceptanceDate')) ||
    text(findFirst(parsed, 'declarationDate'))

  const customsOfficeNode = findFirst(parsed, 'CustomsOfficeOfImport') || findFirst(parsed, 'customsOfficeOfImport')
  const customsOffice =
    childText(customsOfficeNode, 'referenceNumber') ||
    text(findFirst(parsed, 'customsOfficeReferenceNumber')) ||
    ''

  // Régimen.
  const govProcedure = findFirst(parsed, 'GovernmentProcedure') || findFirst(parsed, 'governmentProcedure')
  const requestedProcedure = govProcedure
    ? `${childText(govProcedure, 'currentCode') || ''}${childText(govProcedure, 'previousCode') || ''}`
    : ''

  // Partes.
  const importer = extractParty(findFirst(parsed, 'Importer') || findFirst(parsed, 'importer'))
  const declarant = extractParty(findFirst(parsed, 'Declarant') || findFirst(parsed, 'declarant'))
  const representative = extractParty(findFirst(parsed, 'Representative') || findFirst(parsed, 'representative'))

  // Mercancías.
  const itemNodes = findAll(parsed, 'GovernmentAgencyGoodsItem').concat(
    findAll(parsed, 'governmentAgencyGoodsItem')
  )
  const goodsItems = itemNodes.map(extractGoodsItem)

  // Valoración global.
  const valuationNode = findFirst(parsed, 'CustomsValuation') || findFirst(parsed, 'customsValuation')
  const customsValue = parseAmount(child(valuationNode, 'itemChargeAmount'))?.amount ?? null

  // Incoterm.
  const tradeTermsNode = findFirst(parsed, 'TradeTerms') || findFirst(parsed, 'tradeTerms')
  const deliveryTerms = tradeTermsNode ? childText(tradeTermsNode, 'conditionCode') : ''

  // Documentos de soporte (casilla 44).
  const supportingDocs = findAll(parsed, 'SupportingDocument')
    .concat(findAll(parsed, 'supportingDocument'))
    .map((doc) => ({
      type: childText(doc, 'typeCode') || childText(doc, 'type'),
      id: childText(doc, 'ID') || childText(doc, 'id'),
      issueDate: childText(doc, 'issueDateTime') || childText(doc, 'issueDate'),
    }))
    .filter((d) => d.type || d.id)

  return {
    mrn,
    acceptanceDate,
    customsOffice,
    requestedProcedure,
    deliveryTerms,
    customsValue,
    importer,
    declarant,
    representative,
    goodsItems,
    supportingDocuments: supportingDocs,
  }
}
