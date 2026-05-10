// Versiones de las políticas legales. Actualizar al modificar contenido.
// Estos valores se almacenan en user_consents.policy_version cuando un usuario acepta.
//
// Convención: la fecha YYYY-MM-DD coincide con la última actualización del
// markdown fuente correspondiente en docs/legal-source/.

export const LEGAL_VERSIONS = {
  privacy_policy: '2026-05-10',
  legal_notice: '2026-05-03',
  cookies_policy: '2026-05-03',
  terms_of_use: '2026-05-03',
}

export const LEGAL_LAST_UPDATED = '2026-05-10'

// Helper para mostrar la fecha en formato legible es-ES.
export function formatLegalDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ]
  return `${d} de ${months[m - 1]} de ${y}`
}
