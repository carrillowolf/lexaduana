/**
 * CBAM Advisory — Estados de solicitud
 *
 * Fuente de verdad única para los estados post-entrega de una solicitud de
 * asesoría. Cualquier endpoint que escriba `status` debe consultar este Set
 * antes de degradar el estado de una solicitud ya entregada al cliente.
 *
 * Embrión del refactor centralizado de transiciones de estado anotado en
 * docs/cbam/ROADMAP_v3_features.md.
 */

export const POST_DELIVERY_STATUSES = new Set(['delivered'])

export function isPostDelivery(status) {
  return POST_DELIVERY_STATUSES.has(status)
}
