/**
 * Analytics — Event Tracking Helper (no-op)
 *
 * Tras la migración GA4 → Plausible (2026-04-29), Plausible Cloud está
 * configurado en modo "solo pageviews" sin custom events. Esta función
 * queda como no-op para preservar los call sites existentes
 * (`trackEvent('calculate_tariff', {...})` en calculadora, clasificador,
 * comparador, CBAMVerifier, RRM StepGenerate).
 *
 * Si en el futuro se habilitan goals en Plausible, sustituir el cuerpo
 * por `window.plausible(eventName, { props: params })`.
 */

export const trackEvent = (_eventName, _params = {}) => {
  // no-op
}
