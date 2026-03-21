/**
 * Google Analytics 4 - Event Tracking Helper
 *
 * Uso en componentes cliente:
 * import { trackEvent } from '@/lib/analytics'
 * trackEvent('calculate_tariff', { hs_code: '8471300000', origin: 'CN' })
 */

export const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params)
  }
}
