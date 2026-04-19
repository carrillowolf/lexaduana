/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require('@playwright/test')
const path = require('path')
const { provisionUser, cleanupUser } = require('./helpers/auth')

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots')

test.describe('Flow F — safeInternalRedirect (?next param honored)', () => {
  let user

  test.beforeAll(async () => {
    user = await provisionUser({ prefix: 'e2e-f' })
  })

  test.afterAll(async () => {
    if (user?.id) await cleanupUser(user.id)
  })

  test('login with ?next=/cbam/calculadora lands on /cbam/calculadora, not /calculadora', async ({ page }) => {
    await page.goto('/auth/login?next=%2Fcbam%2Fcalculadora')
    await page.waitForSelector('input[type="email"]')
    await page.fill('input[type="email"]', user.email)
    await page.fill('input[type="password"]', user.password)
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/cbam\/calculadora/, { timeout: 15_000 })
    const pathname = new URL(page.url()).pathname
    expect(pathname).toBe('/cbam/calculadora')

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'flow-f-redirect-ok.png') })
  })

  test('external URL in ?next is ignored (safe redirect rejects //evil.com)', async ({ page }) => {
    await page.goto('/auth/login?next=%2F%2Fevil.example.com%2Fhijack')
    await page.waitForSelector('input[type="email"]')
    await page.fill('input[type="email"]', user.email)
    await page.fill('input[type="password"]', user.password)
    await page.click('button[type="submit"]')

    // Falls back to default /calculadora.
    await page.waitForURL(u => /\/calculadora/.test(u.pathname) || u.hostname === 'localhost' || u.hostname === '127.0.0.1', {
      timeout: 15_000,
    })
    expect(new URL(page.url()).hostname).toMatch(/localhost|127\.0\.0\.1/)
  })
})
