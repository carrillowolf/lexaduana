# LexAduana — End-to-end test suite (Playwright)

Suite automatizada que cubre los flujos críticos del producto.

## Prerrequisitos

1. **Playwright instalado** (ya en `devDependencies`):
   ```bash
   npm install
   npx playwright install chromium
   ```

2. **Variables de entorno** en `.env.local` (ya presentes para el equipo):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (o `SUPABASE_SERVICE_KEY`)

   La service role key se usa para:
   - Crear usuarios de test con `email_confirm: true` (no hay paso de verificación por email en tests).
   - Limpiar registros en `cbam_advisory_requests` y `cbam_monitoring_subscriptions` al final de cada suite.

3. **Puerto libre**. Por defecto los tests arrancan `npm run dev` en `E2E_PORT=3100` para no chocar con `3000`. Ajustable via env var.

## Ejecución

```bash
# Suite completa (arranca el dev server automáticamente).
npx playwright test --config=playwright.config.js

# Un solo test.
npx playwright test scripts/e2e/test-monitoring-wizard.spec.js

# Contra un server ya corriendo (ej. Vercel preview):
E2E_BASE_URL=https://lexaduana-preview.vercel.app E2E_SKIP_WEBSERVER=1 \
  npx playwright test

# Ver report HTML tras la ejecución:
npx playwright show-report
```

## Flujos cubiertos

| Spec | Flujo | Cubre |
|---|---|---|
| `test-advisory-upgrade-modal.spec.js` | C — Advisory Básico → Completo | Wizard con 4 instalaciones + 6 productos + 2 países dispara modal "Completo". Verifica `advisory_package='complete'` en BD. |
| `test-monitoring-wizard.spec.js` | D — Wizard Monitorización 4 pasos | Recorre los 4 pasos, confirma. Verifica `status='submitted'` + `dua_authorization_*` en BD. |
| `test-my-requests-sections.spec.js` | E — mis-solicitudes dos secciones | Secciones visuales separadas con CTAs diferenciados; empty state con CTA "Conoce la Monitorización". |
| `test-next-redirect-flow.spec.js` | F — `?next=` safe redirect | Login con `?next=/cbam/calculadora` aterriza allí; `?next=//evil.com` se descarta a fallback interno. |
| `test-monitoring-status-lock.spec.js` | Seguridad RLS | PATCH directo a `status` vía REST con token authenticated no modifica el campo. Column-level UPDATE reservada a `service_role`. |

## Convenciones

- Cada spec provisiona sus propios usuarios de prueba vía service role (`email: e2e-<prefix>-<timestamp>-<rand>@lexaduana.test`) y los borra en `afterAll`.
- Screenshots críticas se guardan en `scripts/e2e/screenshots/` (git-ignored).
- Test IDs HTML añadidos en el código real: `advisory-new-request-cta`, `existing-draft-modal`, `advisory-loading-draft`, etc.
- `data-testid` vive en el código de producción para que los tests sean resilientes a cambios de copy.

## Debug local

```bash
# Traza + screenshot en cada paso.
npx playwright test --trace on --screenshot on

# Modo UI interactiva.
npx playwright test --ui

# Un browser visible para seguir la ejecución.
PWDEBUG=1 npx playwright test <spec>
```

## Known issues

- `test-monitoring-wizard.spec.js` depende de que los labels `"Acepto la autorización..."` y `"Confirmo que deseo..."` existan en el dict. Si se rediseñan, actualizar los selectores.
- `test-advisory-upgrade-modal.spec.js` usa el botón "Añadir otro" para productos 2–6. Si cambia el copy, actualizar selector.
- El flow F original (brief Día 3) incluye restore automático del cálculo en calculadora. Esta suite valida solo la parte del redirect seguro; la restauración del state queda para una iteración posterior si se requiere cobertura.
