/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Devuelve un locator para un input/textarea/select asociado a un label cuyo
 * texto coincide con la regex dada.
 *
 * Tras Día 5 / Pieza 3, los wizards de producción ya vinculan cada label con
 * su input mediante `htmlFor`. Preferimos `page.getByLabel()` (accesible y
 * resiliente a cambios de layout) y sólo caemos al XPath posicional si no
 * encuentra match — útil para formularios admin/legacy donde los labels aún
 * no tienen `htmlFor` (pendiente para sesión futura).
 */
function fieldByLabel(page, labelRegex) {
  const accessible = page.getByLabel(labelRegex).first()
  return {
    async fill(value) {
      if ((await accessible.count()) > 0) return accessible.fill(value)
      return page
        .locator('label')
        .filter({ hasText: labelRegex })
        .first()
        .locator('xpath=following-sibling::*[self::input or self::textarea or self::select][1]')
        .fill(value)
    },
    async selectOption(value) {
      if ((await accessible.count()) > 0) return accessible.selectOption(value)
      return page
        .locator('label')
        .filter({ hasText: labelRegex })
        .first()
        .locator('xpath=following-sibling::select[1]')
        .selectOption(value)
    },
  }
}

/**
 * Checkbox asociado a un label de tipo "option" (donde el input está dentro
 * del propio <label>). Devuelve el input type=checkbox contenido.
 */
function checkboxByLabel(page, labelRegex) {
  return page
    .locator('label')
    .filter({ hasText: labelRegex })
    .first()
    .locator('input[type="checkbox"]')
}

/**
 * Radio asociado a un label del mismo tipo.
 */
function radioByLabel(page, labelRegex) {
  return page
    .locator('label')
    .filter({ hasText: labelRegex })
    .first()
    .locator('input[type="radio"]')
}

module.exports = { fieldByLabel, checkboxByLabel, radioByLabel }
