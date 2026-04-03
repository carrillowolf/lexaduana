/**
 * CBAM Advisory Service - Phase 2
 *
 * Servicio CRUD para el flujo de asesoría premium.
 * Sigue el mismo patrón que cbamService.js: Supabase + mapeo snake_case → camelCase.
 *
 * NO modifica ni duplica lógica de Phase 1.
 */

import { supabase } from '@/lib/supabase'

// ============================================================
// HELPERS
// ============================================================

/** Mapea un row de cbam_advisory_requests de snake_case a camelCase */
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
    exceedsDeMinisMis: row.exceeds_de_minimis,
    co2PriceUsed: row.co2_price_used ? parseFloat(row.co2_price_used) : null,
    calculationYear: row.calculation_year,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
    completedAt: row.completed_at,
  }
}

/** Mapea un row de cbam_advisory_products */
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

/** Mapea un row de cbam_advisory_documents */
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

/** Convierte un objeto camelCase a snake_case para inserts/updates */
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
    exceedsDeMinisMis: 'exceeds_de_minimis',
    co2PriceUsed: 'co2_price_used',
    calculationYear: 'calculation_year',
    submittedAt: 'submitted_at',
    completedAt: 'completed_at',
    // Products
    requestId: 'request_id',
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
// SOLICITUDES (REQUESTS)
// ============================================================

/**
 * Crea una nueva solicitud en estado 'draft'
 */
export async function createAdvisoryRequest(userId, data) {
  const row = toSnake(data)
  row.user_id = userId
  row.status = 'draft'

  const { data: created, error } = await supabase
    .from('cbam_advisory_requests')
    .insert(row)
    .select()
    .single()

  if (error) {
    console.error('[Advisory] Error creando solicitud:', error.message)
    throw new Error('Error al crear la solicitud')
  }
  return mapRequest(created)
}

/**
 * Lista todas las solicitudes de un usuario
 */
export async function getAdvisoryRequests(userId) {
  const { data, error } = await supabase
    .from('cbam_advisory_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Advisory] Error listando solicitudes:', error.message)
    throw new Error('Error al obtener solicitudes')
  }
  return (data || []).map(mapRequest)
}

/**
 * Obtiene detalle de una solicitud con productos y documentos
 */
export async function getAdvisoryRequest(requestId) {
  const [reqResult, prodsResult, docsResult] = await Promise.all([
    supabase.from('cbam_advisory_requests').select('*').eq('id', requestId).single(),
    supabase.from('cbam_advisory_products').select('*').eq('request_id', requestId).order('sort_order'),
    supabase.from('cbam_advisory_documents').select('*').eq('request_id', requestId).order('uploaded_at'),
  ])

  if (reqResult.error) {
    console.error('[Advisory] Error obteniendo solicitud:', reqResult.error.message)
    throw new Error('Solicitud no encontrada')
  }

  const request = mapRequest(reqResult.data)
  request.products = (prodsResult.data || []).map(mapProduct)
  request.documents = (docsResult.data || []).map(mapDocument)
  return request
}

/**
 * Actualiza una solicitud (solo si draft o intake_complete)
 */
export async function updateAdvisoryRequest(requestId, data) {
  const row = toSnake(data)

  const { data: updated, error } = await supabase
    .from('cbam_advisory_requests')
    .update(row)
    .eq('id', requestId)
    .select()
    .single()

  if (error) {
    console.error('[Advisory] Error actualizando solicitud:', error.message)
    throw new Error('Error al actualizar la solicitud')
  }
  return mapRequest(updated)
}

/**
 * Elimina una solicitud (solo si draft)
 */
export async function deleteAdvisoryRequest(requestId) {
  const { error } = await supabase
    .from('cbam_advisory_requests')
    .delete()
    .eq('id', requestId)

  if (error) {
    console.error('[Advisory] Error eliminando solicitud:', error.message)
    throw new Error('Error al eliminar la solicitud')
  }
  return true
}

/**
 * Confirma el intake: cambia status a 'intake_complete' y marca submitted_at
 * Valida que haya al menos 1 producto
 */
export async function submitAdvisoryRequest(requestId) {
  // Verificar que tiene al menos 1 producto
  const { count, error: countError } = await supabase
    .from('cbam_advisory_products')
    .select('id', { count: 'exact', head: true })
    .eq('request_id', requestId)

  if (countError) {
    throw new Error('Error al verificar productos')
  }
  if (!count || count === 0) {
    throw new Error('Debes añadir al menos un producto antes de enviar la solicitud')
  }

  const { data: updated, error } = await supabase
    .from('cbam_advisory_requests')
    .update({
      status: 'intake_complete',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .in('status', ['draft'])
    .select()
    .single()

  if (error) {
    console.error('[Advisory] Error enviando solicitud:', error.message)
    throw new Error('Error al enviar la solicitud. Solo se pueden enviar solicitudes en estado borrador.')
  }
  return mapRequest(updated)
}

// ============================================================
// PRODUCTOS (PRODUCTS)
// ============================================================

/**
 * Añade una línea de producto a una solicitud
 */
export async function addAdvisoryProduct(requestId, data) {
  const row = toSnake(data)
  row.request_id = requestId

  const { data: created, error } = await supabase
    .from('cbam_advisory_products')
    .insert(row)
    .select()
    .single()

  if (error) {
    console.error('[Advisory] Error añadiendo producto:', error.message)
    throw new Error('Error al añadir el producto')
  }
  return mapProduct(created)
}

/**
 * Actualiza un producto
 */
export async function updateAdvisoryProduct(productId, data) {
  const row = toSnake(data)

  const { data: updated, error } = await supabase
    .from('cbam_advisory_products')
    .update(row)
    .eq('id', productId)
    .select()
    .single()

  if (error) {
    console.error('[Advisory] Error actualizando producto:', error.message)
    throw new Error('Error al actualizar el producto')
  }
  return mapProduct(updated)
}

/**
 * Elimina una línea de producto
 */
export async function removeAdvisoryProduct(productId) {
  const { error } = await supabase
    .from('cbam_advisory_products')
    .delete()
    .eq('id', productId)

  if (error) {
    console.error('[Advisory] Error eliminando producto:', error.message)
    throw new Error('Error al eliminar el producto')
  }
  return true
}

/**
 * Lista productos de una solicitud
 */
export async function getAdvisoryProducts(requestId) {
  const { data, error } = await supabase
    .from('cbam_advisory_products')
    .select('*')
    .eq('request_id', requestId)
    .order('sort_order')

  if (error) {
    console.error('[Advisory] Error listando productos:', error.message)
    throw new Error('Error al obtener productos')
  }
  return (data || []).map(mapProduct)
}

/**
 * Actualización bulk de productos (guarda todo el paso 2 de golpe)
 * Recibe array de productos con sus datos.
 * Productos con id se actualizan, sin id se crean.
 */
export async function bulkUpdateAdvisoryProducts(requestId, products) {
  const results = []

  for (let i = 0; i < products.length; i++) {
    const p = { ...products[i], sortOrder: i }
    if (p.id) {
      const updated = await updateAdvisoryProduct(p.id, p)
      results.push(updated)
    } else {
      const created = await addAdvisoryProduct(requestId, p)
      results.push(created)
    }
  }

  return results
}

// ============================================================
// DOCUMENTOS (DOCUMENTS)
// ============================================================

/**
 * Sube un documento a Supabase Storage y guarda referencia en la tabla
 */
export async function uploadAdvisoryDocument(requestId, userId, file, fileType, notes) {
  // Subir a storage: estructura user_id/request_id/filename
  const filePath = `${userId}/${requestId}/${Date.now()}_${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('cbam-advisory-docs')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('[Advisory] Error subiendo archivo:', uploadError.message)
    throw new Error('Error al subir el documento')
  }

  // Guardar referencia en la tabla
  const { data: doc, error: dbError } = await supabase
    .from('cbam_advisory_documents')
    .insert({
      request_id: requestId,
      file_name: file.name,
      file_type: fileType,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      notes: notes || null,
    })
    .select()
    .single()

  if (dbError) {
    console.error('[Advisory] Error guardando referencia documento:', dbError.message)
    throw new Error('Error al registrar el documento')
  }

  return mapDocument(doc)
}

/**
 * Lista documentos de una solicitud
 */
export async function getAdvisoryDocuments(requestId) {
  const { data, error } = await supabase
    .from('cbam_advisory_documents')
    .select('*')
    .eq('request_id', requestId)
    .order('uploaded_at')

  if (error) {
    console.error('[Advisory] Error listando documentos:', error.message)
    throw new Error('Error al obtener documentos')
  }
  return (data || []).map(mapDocument)
}
