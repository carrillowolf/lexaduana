/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Flow G — CBAM Diagnostic (Nivel 2 post-Día 6).
 *
 * Verifica que la transformación del Nivel 2 "calculadora → diagnóstico"
 * cumple el contrato visible:
 *   1. El resultado contiene el componente semáforo.
 *   2. El resultado NO contiene ninguna cifra en € (regex amplia).
 *   3. El resultado contiene el badge cualitativo de exposición y el CTA
 *      que lleva al wizard adecuado al paquete recomendado.
 *   4. Básico/Completo → wizard Advisory con banner de pre-relleno.
 *      Monitorización → wizard Monitorización dedicado, sin banner de prefill.
 *
 * Flujo: anónimo — no requiere auth. Mock del endpoint `calculate` para
 * aislar del estado de Supabase (datos oficiales disponibles, countries…).
 */
const { test, expect } = require('@playwright/test')
const path = require('path')

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots')
const EURO_REGEX = /\d[\d.,]*\s*€/

// ── Helpers ────────────────────────────────────────────────────────────

function diagnosticPayload({ recommendedPackage, totalTonnage, trafficLight, ctaUrl, certRangeLabel }) {
  return {
    success: true,
    data: {
      diagnostic: {
        trafficLight,
        trafficLightMessage: `diagnostic.trafficLight.${trafficLight}.message`,
        totalTonnage,
        productCount: 1,
        countriesCount: 1,
        installationsEstimate: 1,
        year: 2026,
        certificatesRange: { label: certRangeLabel, tier: 1, sectorUsed: 'ironSteel', isMixedSector: false },
        economicExposure: 'moderate',
        potentialSaving: 'significant',
        recommendedPackage,
        recommendedPackageReason: `diagnostic.recommendation.reason_${recommendedPackage === 'monitorizacion' ? 'monitorizacion' : recommendedPackage}`,
        ctaUrl,
      },
      lines: [{
        productDescription: 'Acero laminado',
        cnCode: '72101220',
        countryCode: 'CN',
        annualTonnes: totalTonnage,
        emissionSource: 'default',
        sectorId: 'ironSteel',
        totalEmissions: totalTonnage * 2,
        hasOfficialData: true,
        hasError: false,
        errorReason: null,
        lineTrafficLight: trafficLight,
      }],
      totals: { totalTonnes: totalTonnage, missingDataCount: 0, exceedsDeMinisMis: totalTonnage >= 50 },
      regParams: { year: 2026 },
      showCost: false,
    },
  }
}

async function mockCalculate(page, payload) {
  await page.route('**/api/cbam/calculator/calculate', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    })
  })
}

async function fillAndCalculate(page, tonnes) {
  await page.goto('/cbam/calculadora')
  await expect(
    page.getByRole('main').getByRole('heading', { name: /Diagnóstico CBAM|CBAM Diagnostic/ })
  ).toBeVisible({ timeout: 20_000 })

  await page.locator('#calculadora-product-0-cn').fill('72101220')
  const countrySelect = page.locator('#calculadora-product-0-country')
  const options = countrySelect.locator('option:not([value=""])')
  const firstValue = await options.first().getAttribute('value')
  if (firstValue) {
    await countrySelect.selectOption(firstValue)
  } else {
    // Fallback: si el server no devuelve countries (env sin Supabase), parcheamos
    // el <select> via JS para que el test sea independiente del backend real.
    await page.evaluate(() => {
      const sel = document.querySelector('#calculadora-product-0-country')
      if (!sel) return
      const opt = document.createElement('option')
      opt.value = 'CN'
      opt.textContent = 'China'
      sel.appendChild(opt)
      sel.value = 'CN'
      sel.dispatchEvent(new Event('change', { bubbles: true }))
    })
  }
  await page.locator('#calculadora-product-0-tonnes').fill(String(tonnes))
  await page.getByRole('button', { name: /Obtener diagn[oó]stico CBAM|Run CBAM diagnostic/ }).click()

  const result = page.locator('[data-testid="cbam-diagnostic-result"]')
  await expect(result).toBeVisible({ timeout: 20_000 })
  return result
}

// ── Tests ──────────────────────────────────────────────────────────────

test.describe('Flow G — CBAM Nivel 2 diagnóstico', () => {
  test('Básico: muestra semáforo, oculta €, CTA → wizard Advisory con pre-relleno', async ({ page }) => {
    await mockCalculate(page, diagnosticPayload({
      recommendedPackage: 'basico',
      totalTonnage: 150,
      trafficLight: 'yellow',
      ctaUrl: '/cbam/asesoria/solicitud?tipo=basico&from=diagnostic',
      certRangeLabel: '25-100',
    }))

    const result = await fillAndCalculate(page, 150)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'flow-g-diagnostic-basico.png'), fullPage: true })

    // 1. Componente semáforo.
    const trafficLight = page.locator('[data-testid="cbam-diagnostic-traffic-light"]')
    await expect(trafficLight).toBeVisible()
    expect(['green', 'yellow', 'red']).toContain(await trafficLight.getAttribute('data-traffic-light'))

    // 2. Badge + rango de certificados.
    await expect(page.locator('[data-testid="cbam-diagnostic-exposure-badge"]')).toBeVisible()
    await expect(page.locator('[data-testid="cbam-diagnostic-certificates-range"]')).toBeVisible()

    // 3. CTA.
    const cta = page.locator('[data-testid="cbam-diagnostic-cta"]')
    await expect(cta).toBeVisible()
    await expect(cta).toContainText(/Advisory|Monitori/i)

    // 4. Ninguna cifra en € dentro del diagnóstico.
    const diagnosticText = await result.innerText()
    if (EURO_REGEX.test(diagnosticText)) {
      const match = diagnosticText.match(EURO_REGEX)
      throw new Error(`El diagnóstico contiene "${match[0]}" — no debe aparecer ninguna cifra en € con NIVEL_2_SHOW_COST apagado.`)
    }
    expect(EURO_REGEX.test(diagnosticText)).toBe(false)

    // 5. Disclaimer al pie.
    await expect(page.locator('[data-testid="cbam-diagnostic-disclaimer"]')).toBeVisible()

    // 6. CTA navega al wizard Advisory y el banner de pre-relleno aparece —
    // prueba extremo a extremo de que el stash se escribió y se consumió.
    await cta.click()
    await page.waitForURL(/\/cbam\/asesoria\/solicitud\?.*from=diagnostic/, { timeout: 15_000 })
    await expect(page.locator('[data-testid="advisory-prefill-banner"]')).toBeVisible({ timeout: 15_000 })
  })

  test('Monitorización: CTA → wizard Monitorización dedicado, sin banner de prefill', async ({ page }) => {
    await mockCalculate(page, diagnosticPayload({
      recommendedPackage: 'monitorizacion',
      totalTonnage: 600,
      trafficLight: 'red',
      ctaUrl: '/cbam/asesoria/solicitud/monitorizacion?from=diagnostic',
      certRangeLabel: '>500',
    }))

    const result = await fillAndCalculate(page, 600)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'flow-g-diagnostic-monitorizacion.png'), fullPage: true })

    // El recomendador en el card debe identificar Monitorización.
    const recommendation = page.locator('[data-testid="cbam-diagnostic-recommendation"]')
    await expect(recommendation).toHaveAttribute('data-recommended-package', 'monitorizacion')

    // CTA visible — su texto debe indicar "Monitorización" (no "Advisory").
    const cta = page.locator('[data-testid="cbam-diagnostic-cta"]')
    await expect(cta).toBeVisible()
    await expect(cta).toContainText(/Monitori/i)

    // Ninguna cifra en € (el flag sigue OFF; regresión cubierta aquí también).
    expect(EURO_REGEX.test(await result.innerText())).toBe(false)

    // CTA → URL del wizard de Monitorización, NO el de Advisory.
    await cta.click()
    await page.waitForURL(/\/cbam\/asesoria\/solicitud\/monitorizacion/, { timeout: 15_000 })

    // Heading del wizard de Monitorización como señal de que la página cargó,
    // y después aseguramos que NO hay banner de pre-relleno (este wizard no
    // consume el stash y la calculadora omite escribirlo para Monitorización).
    await expect(
      page.getByRole('heading', { name: /Solicitud de Monitorización CBAM|CBAM Monitoring subscription/ })
    ).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('[data-testid="advisory-prefill-banner"]')).toHaveCount(0)
  })
})
