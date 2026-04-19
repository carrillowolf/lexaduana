/* eslint-disable @typescript-eslint/no-require-imports */
const { createTestUser, deleteTestUser } = require('./supabase')

/**
 * Login programático en la UI: navega a /auth/login y rellena el form.
 */
async function loginViaUI(page, email, password) {
  await page.goto('/auth/login')
  await page.waitForSelector('input[type="email"]')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(url => !/\/auth\//.test(url.pathname), { timeout: 15_000 })
}

/**
 * Genera un email único para cada test (para evitar colisiones en
 * Supabase). El usuario se crea con email_confirm=true via service role,
 * así evitamos dependencias en flujos de verificación de email.
 */
function uniqueEmail(prefix = 'e2e') {
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${ts}-${rand}@lexaduana.test`
}

async function provisionUser({ prefix = 'e2e', password = 'Testpass123!' } = {}) {
  const email = uniqueEmail(prefix)
  const user = await createTestUser({ email, password })
  return { email, password, id: user?.id }
}

async function cleanupUser(userId) {
  await deleteTestUser(userId)
}

module.exports = { loginViaUI, uniqueEmail, provisionUser, cleanupUser }
