/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Devuelve un locator para el input/textarea inmediato que sigue a un label
 * cuyo texto matchea la regex dada. Necesario porque los labels de las
 * wizards actuales no usan htmlFor/id, por lo que `page.getByLabel` no
 * resuelve.
 */
function fieldByLabel(page, labelRegex) {
  return page
    .locator('label')
    .filter({ hasText: labelRegex })
    .first()
    .locator('xpath=following-sibling::*[self::input or self::textarea or self::select][1]')
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
