// Versiones de política de consentimiento.
// Bumpear cuando cambie SUSTANCIALMENTE el texto del consentimiento
// (ej: nueva finalidad, nuevo encargado de tratamiento, cambio en retención).
// Cambios cosméticos NO requieren bump — el bump invalida los consentimientos
// previos y obliga al usuario a re-aceptar.
//
// Formato: 'YYYY-MM-DD' (fecha del cambio).

export const POLICY_VERSIONS = {
  ai_processing_classifier: '2026-05-10',
  ai_processing_ocr_invoice: '2026-05-10',
}

// Lista alineada con el CHECK de public.user_consents.consent_type.
export const VALID_CONSENT_TYPES = [
  'privacy_policy',
  'terms_of_service',
  'cookies_analytics',
  'ai_processing_classifier',
  'ai_processing_ocr_invoice',
  'marketing_emails',
]
