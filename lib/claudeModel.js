/**
 * Modelo de Claude usado por el clasificador y el OCR de facturas.
 *
 * Claude Haiku 5.5 piensa por defecto (adaptive thinking), así que la respuesta
 * puede empezar con bloques `thinking` antes del texto, y no admite
 * `temperature`: la profundidad se controla con `output_config.effort`.
 */
export const CLAUDE_MODEL = 'claude-haiku-5-5'

/**
 * Devuelve el texto de la respuesta, saltando los bloques `thinking`.
 * Lanza un error si el modelo rechazó la petición o se quedó sin tokens.
 */
export function getResponseText(message) {
  if (message?.stop_reason === 'refusal') {
    throw new Error(`Petición rechazada por el modelo (${message.stop_details?.category || 'sin categoría'})`)
  }
  if (message?.stop_reason === 'max_tokens') {
    throw new Error('Respuesta cortada por max_tokens')
  }
  return (message?.content || [])
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('')
}
