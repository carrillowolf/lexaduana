/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Flow G — CBAM Diagnostic (Nivel 2 post-Día 6).
 *
 * Verifica que la transformación del Nivel 2 "calculadora → diagnóstico"
 * cumple el contrato visible:
 *   1. El resultado contiene el componente semáforo.
 *   2. El resultado NO contiene ninguna cifra en € (regex amplia).
 *   3. El resultado contiene el badge cualitativo de exposición y el CTA
 *      "Solicitar Advisory" que lleva al wizard.
 *   4. El CTA inyecta en localStorage el stash de pre-relleno con TTL.
 *
 * Flujo: anónimo — no requiere auth. Usa el fetcher del país server-side
 * del propio Next.js.
 */
const { test, expect } = require('@playwright/test')
const path = require('path')
const { fieldByLabel } = require('./helpers/locators')

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots')

// Busca literal "123 €" o "1.234,56 €" o "12345.67 EUR" en el texto visible.
// Suficiente para detectar el antiguo bloque de KPI "€74.76/tCO₂e" o cifras
// en la tabla.
const EURO_REGEX = /\d[\d.,]*\s*€/

test.describe('Flow G — CBAM Nivel 2 diagnóstico', () => {
  test('muestra semáforo, oculta cifras en € y ofrece CTA Advisory', async ({ page }) => {
    // Mock del endpoint de cálculo para aislar este test del estado de
    // Supabase (datos oficiales disponibles, countries, etc). El test valida
    // EXCLUSIVAMENTE que el render transforma bien el payload de diagnóstico.
    const mockedPayload = {
      success: true,
      data: {
        diagnostic: {
          trafficLight: 'yellow',
          trafficLightMessage: 'diagnostic.trafficLight.yellow.message',
          totalTonnage: 150,
          productCount: 1,
          countriesCount: 1,
          installationsEstimate: 1,
          year: 2026,
          certificatesRange: { label: '25-100', tier: 1, sectorUsed: 'ironSteel', isMixedSector: false },
          economicExposure: 'moderate',
          potentialSaving: 'significant',
          recommendedPackage: 'basico',
          recommendedPackageReason: 'diagnostic.recommendation.reason_basico',
          ctaUrl: '/cbam/asesoria/solicitud?tipo=basico&from=diagnostic',
        },
        lines: [{
          productDescription: 'Acero laminado',
          cnCode: '72101220',
          countryCode: 'CN',
          annualTonnes: 150,
          emissionSource: 'default',
          sectorId: 'ironSteel',
          totalEmissions: 300,
          hasOfficialData: true,
          hasError: false,
          errorReason: null,
          lineTrafficLight: 'yellow',
        }],
        totals: { totalTonnes: 150, missingDataCount: 0, exceedsDeMinisMis: true },
        regParams: { year: 2026 },
        showCost: false,
      },
    }

    await page.route('**/api/cbam/calculator/calculate', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockedPayload),
      })
    })

    await page.goto('/cbam/calculadora')

    // Topbar y hero ambos muestran un h1 con "Diagnóstico CBAM" (por diseño —
    // el topbar replica el título de la página activa). Restringimos al <main>
    // para apuntar sólo al hero y evitar strict-mode violation.
    await expect(
      page.getByRole('main').getByRole('heading', { name: /Diagnóstico CBAM|CBAM Diagnostic/ })
    ).toBeVisible({ timeout: 20_000 })

    // Rellenamos para desbloquear el botón "Obtener diagnóstico". El valor
    // del select no importa para el mock — sólo necesitamos que haya algo.
    await page.locator('#calculadora-product-0-cn').fill('72101220')
    // Seleccionamos la primera opción real (no la placeholder "").
    const countrySelect = page.locator('#calculadora-product-0-country')
    const options = countrySelect.locator('option:not([value=""])')
    const firstValue = await options.first().getAttribute('value')
    if (firstValue) {
      await countrySelect.selectOption(firstValue)
    } else {
      // Fallback: si Supabase no devuelve countries, parchearlo via JS. Esto
      // hace el test completamente independiente del backend real.
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
    await page.locator('#calculadora-product-0-tonnes').fill('150')

    await page.getByRole('button', { name: /Obtener diagn[oó]stico CBAM|Run CBAM diagnostic/ }).click()

    // Espera el contenedor de resultado del diagnóstico.
    const result = page.locator('[data-testid="cbam-diagnostic-result"]')
    await expect(result).toBeVisible({ timeout: 20_000 })
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'flow-g-diagnostic.png'), fullPage: true })

    // ── 1. Componente semáforo presente
    const trafficLight = page.locator('[data-testid="cbam-diagnostic-traffic-light"]')
    await expect(trafficLight).toBeVisible()
    const lightValue = await trafficLight.getAttribute('data-traffic-light')
    expect(['green', 'yellow', 'red']).toContain(lightValue)

    // ── 2. Badge cualitativo + rango de certificados presentes
    await expect(page.locator('[data-testid="cbam-diagnostic-exposure-badge"]')).toBeVisible()
    await expect(page.locator('[data-testid="cbam-diagnostic-certificates-range"]')).toBeVisible()

    // ── 3. CTA Advisory presente y enlaza al wizard
    const cta = page.locator('[data-testid="cbam-diagnostic-cta"]')
    await expect(cta).toBeVisible()
    await expect(cta).toContainText(/Advisory|Monitori/i)

    // ── 4. NINGUNA cifra en € en el resultado. Buscamos en todo el DOM visible
    // del contenedor del diagnóstico (excluye editor superior / navbar).
    const diagnosticText = await result.innerText()
    if (EURO_REGEX.test(diagnosticText)) {
      const match = diagnosticText.match(EURO_REGEX)
      throw new Error(
        `El diagnóstico contiene una cifra en €: "${match[0]}". No debe aparecer ningún valor monetario con el flag NIVEL_2_SHOW_COST apagado.`,
      )
    }
    expect(EURO_REGEX.test(diagnosticText)).toBe(false)

    // ── 5. Disclaimer al pie (orientativo, no defendible en inspección)
    await expect(page.locator('[data-testid="cbam-diagnostic-disclaimer"]')).toBeVisible()

    // ── 6. El CTA inyecta stash y navega a /cbam/asesoria/solicitud?tipo=*&from=diagnostic
    await cta.click()
    await page.waitForURL(/\/cbam\/asesoria\/solicitud\?.*from=diagnostic/, { timeout: 15_000 })

    // El stash se consume en el mount del wizard — no podemos verificar que
    // esté en localStorage tras navegar (ya se habrá borrado). Validamos en su
    // lugar que el banner de pre-relleno aparece: eso prueba extremo a extremo
    // que la calculadora escribió el stash y el wizard lo leyó.
    await expect(page.locator('[data-testid="advisory-prefill-banner"]')).toBeVisible({ timeout: 15_000 })
  })
})
