/**
 * CBAM Advisory Admin Service - Phase 3
 *
 * Operaciones de administración sobre solicitudes de asesoría.
 * Usa supabaseAdmin (service_role) — bypassa RLS.
 *
 * IMPORTANTE: La autorización admin debe garantizarse en la API route
 * (con requireAdmin) ANTES de invocar estas funciones.
 *
 * NO duplica lógica de cbamAdvisoryService.js — reutiliza los mappers
 * importándolos. La separación es solo de cliente Supabase (anon vs service).
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ============================================================
// MAPPERS (duplicados aquí intencionadamente para evitar
// dependencia circular con cbamAdvisoryService que usa el cliente anon)
// ============================================================

function mapRequest(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    companyName: row.company_name,
    companyCif: row.company_cif,
    companyEori: row.company_eori,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    annualVolumeEstimate: row.annual_volume_estimate,
    isAuthorizedDeclarant: row.is_authorized_declarant,
    hasIndirectRepresentative: row.has_indirect_representative,
    representativeName: row.representative_name,
    clientNotes: row.client_notes,
    internalNotes: row.internal_notes,
    totalEstimatedCost: row.total_estimated_cost ? parseFloat(row.total_estimated_cost) : null,
    totalTonnes: row.total_tonnes ? parseFloat(row.total_tonnes) : null,
    totalEmissions: row.total_emissions ? parseFloat(row.total_emissions) : null,
    exceedsDeMinimis: row.exceeds_de_minimis,
    co2PriceUsed: row.co2_price_used ? parseFloat(row.co2_price_used) : null,
    calculationYear: row.calculation_year,
    paymentStatus: row.payment_status,
    paymentDate: row.payment_date,
    invoiceRef: row.invoice_ref,
    reportRef: row.report_ref,
    reportGeneratedAt: row.report_generated_at,
    deliveredAt: row.delivered_at,
    paymentRequestSentAt: row.payment_request_sent_at,
    paymentRequestLanguage: row.payment_request_language,
    paymentRequestAmount: row.payment_request_amount ? parseFloat(row.payment_request_amount) : null,
    paymentRequestReference: row.payment_request_reference,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
    completedAt: row.completed_at,
  }
}

function mapProduct(row) {
  if (!row) return null
  return {
    id: row.id,
    requestId: row.request_id,
    productDescription: row.product_description,
    cnCode: row.cn_code,
    cnCodeDetected: row.cn_code_detected,
    sectorId: row.sector_id,
    countryCode: row.country_code,
    countryName: row.country_name,
    annualTonnes: parseFloat(row.annual_tonnes),
    supplierName: row.supplier_name,
    supplierContactEmail: row.supplier_contact_email,
    supplierInstallationName: row.supplier_installation_name,
    supplierInstallationCountry: row.supplier_installation_country,
    hasRealEmissions: row.has_real_emissions,
    emissionFactorReal: row.emission_factor_real ? parseFloat(row.emission_factor_real) : null,
    emissionSource: row.emission_source,
    productionRoute: row.production_route,
    emissionFactorApplied: row.emission_factor_applied ? parseFloat(row.emission_factor_applied) : null,
    benchmarkApplied: row.benchmark_applied ? parseFloat(row.benchmark_applied) : null,
    emissionsSubjectToCbam: row.emissions_subject_to_cbam ? parseFloat(row.emissions_subject_to_cbam) : null,
    totalEmissions: row.total_emissions ? parseFloat(row.total_emissions) : null,
    totalCost: row.total_cost ? parseFloat(row.total_cost) : null,
    markupApplied: row.markup_applied ? parseFloat(row.markup_applied) : null,
    costWithReal: row.cost_with_real ? parseFloat(row.cost_with_real) : null,
    costWithDefault: row.cost_with_default ? parseFloat(row.cost_with_default) : null,
    savingsPotential: row.savings_potential ? parseFloat(row.savings_potential) : null,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapDocument(row) {
  if (!row) return null
  return {
    id: row.id,
    requestId: row.request_id,
    fileName: row.file_name,
    fileType: row.file_type,
    filePath: row.file_path,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    notes: row.notes,
    uploadedAt: row.uploaded_at,
  }
}

function toSnake(obj) {
  const map = {
    companyName: 'company_name',
    companyCif: 'company_cif',
    companyEori: 'company_eori',
    contactName: 'contact_name',
    contactEmail: 'contact_email',
    contactPhone: 'contact_phone',
    annualVolumeEstimate: 'annual_volume_estimate',
    isAuthorizedDeclarant: 'is_authorized_declarant',
    hasIndirectRepresentative: 'has_indirect_representative',
    representativeName: 'representative_name',
    clientNotes: 'client_notes',
    internalNotes: 'internal_notes',
    totalEstimatedCost: 'total_estimated_cost',
    totalTonnes: 'total_tonnes',
    totalEmissions: 'total_emissions',
    exceedsDeMinimis: 'exceeds_de_minimis',
    co2PriceUsed: 'co2_price_used',
    calculationYear: 'calculation_year',
    submittedAt: 'submitted_at',
    completedAt: 'completed_at',
    paymentStatus: 'payment_status',
    paymentDate: 'payment_date',
    invoiceRef: 'invoice_ref',
    reportRef: 'report_ref',
    reportGeneratedAt: 'report_generated_at',
    deliveredAt: 'delivered_at',
    paymentRequestSentAt: 'payment_request_sent_at',
    paymentRequestLanguage: 'payment_request_language',
    paymentRequestAmount: 'payment_request_amount',
    paymentRequestReference: 'payment_request_reference',
    // Products
    productDescription: 'product_description',
    cnCode: 'cn_code',
    cnCodeDetected: 'cn_code_detected',
    sectorId: 'sector_id',
    countryCode: 'country_code',
    countryName: 'country_name',
    annualTonnes: 'annual_tonnes',
    supplierName: 'supplier_name',
    supplierContactEmail: 'supplier_contact_email',
    supplierInstallationName: 'supplier_installation_name',
    supplierInstallationCountry: 'supplier_installation_country',
    hasRealEmissions: 'has_real_emissions',
    emissionFactorReal: 'emission_factor_real',
    emissionSource: 'emission_source',
    productionRoute: 'production_route',
    emissionFactorApplied: 'emission_factor_applied',
    benchmarkApplied: 'benchmark_applied',
    emissionsSubjectToCbam: 'emissions_subject_to_cbam',
    totalCost: 'total_cost',
    markupApplied: 'markup_applied',
    costWithReal: 'cost_with_real',
    costWithDefault: 'cost_with_default',
    savingsPotential: 'savings_potential',
    sortOrder: 'sort_order',
  }

  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue
    const snakeKey = map[key] || key
    result[snakeKey] = value
  }
  return result
}

// ============================================================
// LISTADO ADMIN
// ============================================================

/**
 * Lista TODAS las solicitudes (admin) con conteo de productos y suma de toneladas.
 * Soporta filtros opcionales: status, search (company_name).
 */
export async function listAllAdvisoryRequests({ status = null, search = null } = {}) {
  let query = supabaseAdmin
    .from('cbam_advisory_requests')
    .select('*, cbam_advisory_products(id, annual_tonnes)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (search) query = query.ilike('company_name', `%${search}%`)

  const { data, error } = await query

  if (error) {
    console.error('[Advisory Admin] Error listando:', error.message)
    throw new Error('Error al listar solicitudes')
  }

  return (data || []).map(row => {
    const req = mapRequest(row)
    const products = row.cbam_advisory_products || []
    req.productsCount = products.length
    req.totalTonnesAggregated = products.reduce(
      (sum, p) => sum + (parseFloat(p.annual_tonnes) || 0),
      0
    )
    return req
  })
}

// ============================================================
// DETALLE ADMIN
// ============================================================

export async function getAdvisoryRequestAsAdmin(requestId) {
  const [reqResult, prodsResult, docsResult] = await Promise.all([
    supabaseAdmin
      .from('cbam_advisory_requests')
      .select('*')
      .eq('id', requestId)
      .single(),
    supabaseAdmin
      .from('cbam_advisory_products')
      .select('*')
      .eq('request_id', requestId)
      .order('sort_order'),
    supabaseAdmin
      .from('cbam_advisory_documents')
      .select('*')
      .eq('request_id', requestId)
      .order('uploaded_at'),
  ])

  if (reqResult.error) {
    console.error('[Advisory Admin] Error obteniendo solicitud:', reqResult.error.message)
    throw new Error('Solicitud no encontrada')
  }

  const request = mapRequest(reqResult.data)
  request.products = (prodsResult.data || []).map(mapProduct)
  request.documents = (docsResult.data || []).map(mapDocument)
  return request
}

// ============================================================
// EDICIÓN ADMIN
// ============================================================

/**
 * Actualiza una solicitud sin restricciones de estado (admin puede editar cualquier campo
 * en cualquier estado, incluido cambiar el status).
 */
export async function updateAdvisoryRequestAsAdmin(requestId, data) {
  const row = toSnake(data)

  const { data: updated, error } = await supabaseAdmin
    .from('cbam_advisory_requests')
    .update(row)
    .eq('id', requestId)
    .select()
    .single()

  if (error) {
    console.error('[Advisory Admin] Error actualizando solicitud:', error.message)
    throw new Error('Error al actualizar la solicitud')
  }
  return mapRequest(updated)
}

export async function addAdvisoryProductAsAdmin(requestId, data) {
  const row = toSnake(data)
  row.request_id = requestId

  const { data: created, error } = await supabaseAdmin
    .from('cbam_advisory_products')
    .insert(row)
    .select()
    .single()

  if (error) {
    console.error('[Advisory Admin] Error añadiendo producto:', error.message)
    throw new Error('Error al añadir el producto')
  }
  return mapProduct(created)
}

export async function updateAdvisoryProductAsAdmin(productId, data) {
  const row = toSnake(data)

  const { data: updated, error } = await supabaseAdmin
    .from('cbam_advisory_products')
    .update(row)
    .eq('id', productId)
    .select()
    .single()

  if (error) {
    console.error('[Advisory Admin] Error actualizando producto:', error.message)
    throw new Error('Error al actualizar el producto')
  }
  return mapProduct(updated)
}

export async function deleteAdvisoryProductAsAdmin(productId) {
  const { error } = await supabaseAdmin
    .from('cbam_advisory_products')
    .delete()
    .eq('id', productId)

  if (error) {
    console.error('[Advisory Admin] Error eliminando producto:', error.message)
    throw new Error('Error al eliminar el producto')
  }
  return true
}

// ============================================================
// REFERENCIA AUTOGENERADA DEL INFORME
// ============================================================

/**
 * Genera la referencia única del informe en formato LA-CBAM-{año}-{secuencial}.
 * El secuencial se calcula contando informes ya existentes en el año actual + 1.
 */
export async function generateReportRef() {
  const year = new Date().getFullYear()

  const { count, error } = await supabaseAdmin
    .from('cbam_advisory_requests')
    .select('id', { count: 'exact', head: true })
    .not('report_ref', 'is', null)
    .like('report_ref', `LA-CBAM-${year}-%`)

  if (error) {
    console.error('[Advisory Admin] Error contando refs:', error.message)
    throw new Error('Error al generar referencia')
  }

  const seq = String((count || 0) + 1).padStart(4, '0')
  return `LA-CBAM-${year}-${seq}`
}

// ============================================================
// INFORMES (REPORTS)
// ============================================================

/**
 * Crea una nueva versión de informe usando la función SQL transaccional.
 * Garantiza atomicidad: marca versiones previas como is_current=false.
 */
export async function createReportVersion({
  requestId,
  pdfPath,
  pdfFilename,
  pdfSizeBytes,
  reportRef,
  reportYear,
  calculationSnapshot,
  generatedBy,
}) {
  const { data, error } = await supabaseAdmin.rpc('create_advisory_report_version', {
    p_request_id: requestId,
    p_pdf_path: pdfPath,
    p_pdf_filename: pdfFilename,
    p_pdf_size_bytes: pdfSizeBytes || null,
    p_report_ref: reportRef,
    p_report_year: reportYear,
    p_calculation_snapshot: calculationSnapshot,
    p_generated_by: generatedBy || null,
  })

  if (error) {
    console.error('[Advisory Admin] Error creando versión informe:', error.message)
    throw new Error('Error al crear el informe')
  }

  return data // UUID del nuevo registro
}

export async function getCurrentReportForRequest(requestId) {
  const { data, error } = await supabaseAdmin
    .from('cbam_advisory_reports')
    .select('*')
    .eq('request_id', requestId)
    .eq('is_current', true)
    .maybeSingle()

  if (error) {
    console.error('[Advisory Admin] Error obteniendo informe:', error.message)
    throw new Error('Error al obtener el informe')
  }

  return data
}

export async function listReportsForRequest(requestId) {
  const { data, error } = await supabaseAdmin
    .from('cbam_advisory_reports')
    .select('*')
    .eq('request_id', requestId)
    .order('version', { ascending: false })

  if (error) {
    console.error('[Advisory Admin] Error listando informes:', error.message)
    throw new Error('Error al listar informes')
  }

  return data || []
}

// ============================================================
// UPLOAD PDF AL BUCKET
// ============================================================

/**
 * Sube un PDF al bucket cbam-advisory-reports.
 * Estructura: {request_id}/{report_ref}_v{version}.pdf
 */
export async function uploadReportPdf({ requestId, filename, pdfBuffer }) {
  const path = `${requestId}/${filename}`

  const { error } = await supabaseAdmin.storage
    .from('cbam-advisory-reports')
    .upload(path, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (error) {
    console.error('[Advisory Admin] Error subiendo PDF:', error.message)
    throw new Error('Error al subir el PDF')
  }

  return path
}

/**
 * Genera signed URL temporal para descargar un PDF.
 * Por defecto expira en 1 hora.
 */
export async function getReportSignedUrl(pdfPath, expiresInSeconds = 3600) {
  const { data, error } = await supabaseAdmin.storage
    .from('cbam-advisory-reports')
    .createSignedUrl(pdfPath, expiresInSeconds)

  if (error) {
    console.error('[Advisory Admin] Error generando signed URL:', error.message)
    throw new Error('Error al generar enlace de descarga')
  }

  return data.signedUrl
}

// ============================================================
// AUDITORÍA DE DESCARGAS
// ============================================================

export async function logReportDownload({
  reportId,
  requestId,
  userId,
  ipAddress,
  userAgent,
}) {
  const { error } = await supabaseAdmin
    .from('cbam_advisory_report_downloads')
    .insert({
      report_id: reportId,
      request_id: requestId,
      user_id: userId || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    })

  if (error) {
    // No bloqueamos la descarga si el logging falla
    console.error('[Advisory Admin] Error registrando descarga:', error.message)
  }
}
