/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require('@playwright/test')
const path = require('path')
const { provisionUser, cleanupUser, loginViaUI } = require('./helpers/auth')
const { adminClient } = require('./helpers/supabase')
const { fieldByLabel, checkboxByLabel, radioByLabel } = require('./helpers/locators')

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots')

test.describe('Flow D — Monitoring subscription wizard', () => {
  let user

  test.beforeAll(async () => {
    user = await provisionUser({ prefix: 'e2e-d' })
  })

  test.afterAll(async () => {
    if (user?.id) await cleanupUser(user.id)
  })

  test('4-step wizard creates subscription with status=submitted and DUA authorization logged', async ({ page }) => {
    await loginViaUI(page, user.email, user.password)

    await page.goto('/cbam/asesoria/solicitud/monitorizacion')
    await page.waitForSelector('h1:has-text("Solicitud de Monitorización CBAM")', { timeout: 15_000 })

    // Step 1 — empresa + contacto.
    await fieldByLabel(page, /Nombre comercial|Commercial name/).fill('E2E Monitoring SL')
    await fieldByLabel(page, /^CIF|Tax ID/).fill('B12312312')
    await fieldByLabel(page, /Nombre de contacto|Contact name/).fill('E2E Contact')
    await fieldByLabel(page, /Email de contacto|Contact email/).fill(user.email)
    await fieldByLabel(page, /Teléfono|Phone/).fill('+34 600 000 000')
    await page.getByRole('button', { name: /^(Siguiente|Next)(\s|$|→)/ }).click()

    // Step 2 — autorización DUAs.
    await checkboxByLabel(page, /Acepto la autorización|I accept the authorisation/).check()
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'flow-d-step2-dua.png'), fullPage: false })
    await page.getByRole('button', { name: /^(Siguiente|Next)(\s|$|→)/ }).click()

    // Step 3 — perfil.
    await fieldByLabel(page, /Productos CBAM|CBAM products/).fill('acero laminado, aluminio')
    await fieldByLabel(page, /Países de origen|Main origin countries/).fill('TR, CN')
    await radioByLabel(page, /50 – 200|50 - 200/).check()
    await page.getByRole('button', { name: /^(Siguiente|Next)(\s|$|→)/ }).click()

    // Step 4 — confirmación.
    await checkboxByLabel(page, /Confirmo que deseo|I confirm I want/).check()
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'flow-d-step4-confirm.png'), fullPage: false })
    await page.getByRole('button', { name: /Enviar solicitud|Submit request/ }).click()

    await expect(page.getByText(/Hemos recibido tu solicitud|We have received your request/)).toBeVisible({ timeout: 15_000 })
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'flow-d-success.png'), fullPage: false })

    // Verificación DB.
    const admin = adminClient()
    const { data, error } = await admin
      .from('cbam_monitoring_subscriptions')
      .select('id, status, dua_authorization_accepted_at, dua_authorization_text_version, expected_monthly_volume')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
    expect(error).toBeFalsy()
    const row = data?.[0]
    expect(row).toBeTruthy()
    expect(row.status).toBe('submitted')
    expect(row.dua_authorization_accepted_at).toBeTruthy()
    expect(row.dua_authorization_text_version).toBeTruthy()
    expect(row.expected_monthly_volume).toBe('50-200t')
  })
})
