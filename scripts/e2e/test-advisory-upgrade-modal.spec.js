/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require('@playwright/test')
const path = require('path')
const { provisionUser, cleanupUser, loginViaUI } = require('./helpers/auth')
const { adminClient } = require('./helpers/supabase')
const { fieldByLabel, checkboxByLabel } = require('./helpers/locators')

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots')

const nextBtn = /^(Siguiente|Next)(\s|$|→)/
const prevBtn = /^(Anterior|Previous|←)/
const submitBtn = /^(Enviar|Submit)(\s|$|→)/

test.describe('Flow C — Advisory Basic → Complete auto-detect', () => {
  let user

  test.beforeAll(async () => {
    user = await provisionUser({ prefix: 'e2e-c' })
  })

  test.afterAll(async () => {
    if (user?.id) {
      const admin = adminClient()
      try { await admin.from('cbam_advisory_requests').delete().eq('user_id', user.id) } catch (_) {}
      await cleanupUser(user.id)
    }
  })

  test('scope exceeding Basic limits triggers upgrade modal and saves as complete', async ({ page }) => {
    test.setTimeout(120_000)
    await loginViaUI(page, user.email, user.password)

    await page.goto('/cbam/asesoria/solicitud?tipo=basico')
    await page.waitForSelector('h1:has-text("Solicitud de Asesoría CBAM")', { timeout: 15_000 })

    // Step 1: 4 instalaciones (>3 fuerza Completo por sí solo, plus productos/países).
    await fieldByLabel(page, /Nombre de la empresa|Company name/).fill('E2E Aceros Mediterráneo')
    await fieldByLabel(page, /^CIF\/NIF|^Tax ID/).fill('B99999999')
    await fieldByLabel(page, /Nombre de contacto|Contact name/).fill('Tester E2E')
    await fieldByLabel(page, /Email de contacto|Contact email/).fill(user.email)
    await fieldByLabel(page, /Número de instalaciones|Number of distinct installations/).fill('4')

    await page.getByRole('button', { name: nextBtn }).click()
    await page.waitForSelector('h2:has-text("Productos importados"), h2:has-text("Imported products")', { timeout: 15_000 })

    // Step 2: productos — 6 líneas con 2 países.
    const seeds = [
      { desc: 'Alambrón', cn: '72101220', country: 'CN' },
      { desc: 'Chapa A', cn: '72103090', country: 'CN' },
      { desc: 'Chapa B', cn: '72104900', country: 'CN' },
      { desc: 'Chapa C', cn: '72107000', country: 'CN' },
      { desc: 'Aluminio', cn: '76011010', country: 'TR' },
      { desc: 'Pletina', cn: '72091800', country: 'TR' },
    ]

    for (let i = 0; i < seeds.length; i++) {
      if (i === 0) {
        await page.getByRole('button', { name: /Añadir producto|Add product/ }).click()
      } else {
        await page.getByRole('button', { name: /Añadir otro|Add another/ }).click()
      }
      const seed = seeds[i]
      const blocks = page.locator('div.bg-white.border.border-gray-200.rounded-xl.p-5')
      const block = blocks.nth(i)
      // Description = first text input in the block.
      await block.locator('input[type="text"]').first().fill(seed.desc)
      // CN code has a mono font placeholder "Ej: 72101200".
      await block.locator('input[placeholder*="72101200"]').fill(seed.cn)
      // First select in the block is country.
      await block.locator('select').first().selectOption(seed.country)
      // First number input = annual tonnes.
      await block.locator('input[type="number"]').first().fill('100')
    }

    await page.getByRole('button', { name: nextBtn }).click()
    await page.waitForSelector('h2:has-text("Documentación"), h2:has-text("Documentation")', { timeout: 15_000 })

    // Step 3: confirmar.
    await checkboxByLabel(page, /He revisado los datos|I have reviewed the data/).check()
    await page.getByRole('button', { name: submitBtn }).click()

    // Modal de paquete detectado.
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 10_000 })
    await expect(modal).toContainText(/Completo|Complete/)
    await expect(modal).toContainText(/2\.?500/)

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'flow-c-upgrade-modal.png'), fullPage: false })

    await modal.getByRole('button', { name: /Continuar con Completo|Continue with Complete/ }).click()

    await page.waitForURL(/\/cbam\/asesoria\/mis-solicitudes/, { timeout: 20_000 })
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'flow-c-after-submit.png'), fullPage: false })

    const admin = adminClient()
    const { data, error } = await admin
      .from('cbam_advisory_requests')
      .select('id, status, advisory_package, installations_count')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
    expect(error).toBeFalsy()
    expect(data?.[0]?.advisory_package).toBe('complete')
    expect(data?.[0]?.installations_count).toBe(4)
    expect(['intake_complete', 'reviewing', 'analyzing', 'draft']).toContain(data?.[0]?.status)
  })
})
