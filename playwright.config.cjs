/* eslint-disable @typescript-eslint/no-require-imports */
const { defineConfig } = require('@playwright/test')
const path = require('path')

// Load env from .env.local so tests can reach Supabase.
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') })

const PORT = Number(process.env.E2E_PORT || 3100)

module.exports = defineConfig({
  testDir: './scripts/e2e',
  testMatch: ['**/*.spec.js'],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL || `http://localhost:${PORT}`,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: process.env.E2E_SKIP_WEBSERVER
    ? undefined
    : {
        command: `PORT=${PORT} npm run dev`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: false,
        timeout: 120_000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
})
