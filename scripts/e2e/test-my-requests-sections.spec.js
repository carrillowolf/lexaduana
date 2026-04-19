/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require('@playwright/test')
const path = require('path')
const { provisionUser, cleanupUser, loginViaUI } = require('./helpers/auth')
const { adminClient } = require('./helpers/supabase')

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots')

test.describe('Flow E — mis-solicitudes two sections', () => {
  let userWith, userEmpty

  test.beforeAll(async () => {
    userWith = await provisionUser({ prefix: 'e2e-e-full' })
    userEmpty = await provisionUser({ prefix: 'e2e-e-empty' })

    // Provision: one advisory + one monitoring subscription via service role.
    const admin = adminClient()
    await admin.from('cbam_advisory_requests').insert({
      user_id: userWith.id,
      status: 'intake_complete',
      company_name: 'E2E Full Co',
      contact_name: 'Tester',
      contact_email: userWith.email,
      advisory_package: 'basic',
      installations_count: 1,
    })
    await admin.from('cbam_monitoring_subscriptions').insert({
      user_id: userWith.id,
      status: 'submitted',
      company_name: 'E2E Full Co',
      contact_name: 'Tester',
      contact_email: userWith.email,
      dua_authorization_accepted_at: new Date().toISOString(),
      dua_authorization_text_version: 'v1-2026-04',
      expected_monthly_volume: '50-200t',
    })
  })

  test.afterAll(async () => {
    const admin = adminClient()
    if (userWith?.id) {
      try { await admin.from('cbam_advisory_requests').delete().eq('user_id', userWith.id) } catch (_) {}
      try { await admin.from('cbam_monitoring_subscriptions').delete().eq('user_id', userWith.id) } catch (_) {}
      await cleanupUser(userWith.id)
    }
    if (userEmpty?.id) await cleanupUser(userEmpty.id)
  })

  test('user with both shows both sections with cards and differentiated CTAs', async ({ page }) => {
    await loginViaUI(page, userWith.email, userWith.password)
    await page.goto('/cbam/asesoria/mis-solicitudes')

    await expect(page.getByRole('heading', { name: /Informes solicitados|Requested reports/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Suscripciones|Subscriptions/ })).toBeVisible()
    await expect(page.getByText('E2E Full Co').first()).toBeVisible()

    const newAdvisory = page.getByTestId('advisory-new-request-cta')
    await expect(newAdvisory).toBeVisible()

    const newMonitoring = page.getByRole('link', { name: /Nueva suscripción de Monitorización|New Monitoring subscription/ })
    await expect(newMonitoring).toHaveAttribute('href', /\/cbam\/asesoria\/solicitud\/monitorizacion/)

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'flow-e-full-sections.png'), fullPage: true })
  })

  test('user without monitoring shows empty CTA "Conoce la Monitorización"', async ({ page }) => {
    await loginViaUI(page, userEmpty.email, userEmpty.password)
    await page.goto('/cbam/asesoria/mis-solicitudes')

    await expect(page.getByText(/Todavía no tienes suscripciones|You have no Monitoring subscriptions/)).toBeVisible()
    const cta = page.getByRole('link', { name: /Conoce la Monitorización CBAM|Learn about CBAM Monitoring/ })
    await expect(cta).toHaveAttribute('href', /\/cbam\/asesoria$/)

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'flow-e-empty-monitoring.png'), fullPage: true })
  })
})
