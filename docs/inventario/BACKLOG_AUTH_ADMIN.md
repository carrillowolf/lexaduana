# Backlog de auth admin

Hallazgos detectados durante el diagnóstico del 403 en `/admin/cbam/asesoria`
(rama `fix/admin-asesoria-403`, mayo 2026). El bug raíz se resolvió en esa
rama añadiendo la variable `ADMIN_EMAILS` a la documentación y configurándola
en Vercel — pero el camino dejó al descubierto cuatro piezas de deuda
técnica que no bloquean el cumplimiento inmediato y conviene resolver en una
sesión específica de "limpieza de auth admin".

Origen: comentario `TECH DEBT (post-Día 5, no bloqueante)` en
`lib/cbamAdminAuth.js:13-22`. Esta nota lo desarrolla y consolida los cuatro
ítems concretos.

---

## 1 · Doble sistema client / server de chequeo admin

Hoy conviven dos allowlists totalmente independientes:

| Capa | Mecanismo | Fuente |
|---|---|---|
| Cliente (componentes React `'use client'`) | `const ADMIN_EMAILS = ['ccarrillodelolmo@gmail.com']` hardcoded en cada página admin | 8 ficheros, ver §2 |
| Servidor (route handlers `/api/admin/*`) | `process.env.ADMIN_EMAILS` parseada por `requireAdmin()` | `lib/cbamAdminAuth.js:29-35` |

**Efecto observado**: el cliente "abre la puerta" pero el servidor no entrega
datos cuando la env var está vacía. El usuario ve el shell de la página +
mensaje "Acceso denegado" del fetch. Eso es exactamente lo que pasó en el
bug del 403.

**Propuesta para sesión futura**:

Unificar a través de un helper compartido. Opciones razonables:

- **A)** Exponer la allowlist server vía `NEXT_PUBLIC_ADMIN_EMAILS` (también
  legible desde el cliente) y consumirla desde un único helper
  `lib/adminAllowlist.js`. Pros: una sola fuente de verdad, configurable
  sin redeploy. Contras: el cliente ve los emails admin (no es
  información sensible — son emails de gente conocida — pero hay quien
  prefiere no exponerlos).
- **B)** Mantener `ADMIN_EMAILS` (server-only) y crear un endpoint
  `/api/auth/me/admin` que el cliente consulta para saber si el user es
  admin. Pros: la lista no se expone al cliente. Contras: una llamada de
  red extra en cada página admin.

**Recomendación tentativa**: A. Los emails admin no son secretos (van en
copia de pies de página de correos transaccionales, p. ej.
`lib/cbamAdvisoryEmails.js:21`); el coste/beneficio favorece simplicidad.

---

## 2 · Email del owner hardcoded en 8 ficheros

`grep "ccarrillodelolmo" --include="*.js" --include="*.jsx"` arroja literales
en:

| Fichero | Línea | Constante |
|---|---|---|
| `app/admin/cbam/page.js` | 8 | `ADMIN_EMAILS` |
| `app/admin/cbam/asesoria/page.js` | 9 | `ADMIN_EMAILS` |
| `app/admin/cbam/asesoria/[id]/page.js` | 11 | `ADMIN_EMAILS` |
| `app/admin/cbam/suscripciones/page.js` | 11 | `ADMIN_EMAILS` |
| `app/admin/cbam/suscripciones/[id]/page.js` | 20 | `ADMIN_EMAILS` |
| `app/admin/clasificaciones/page.js` | 9 | `ADMIN_EMAILS` |
| `app/dashboard/page.js` | 14 | `ADMIN_EMAIL` (singular) |
| `lib/cbamAdvisoryEmails.js` | 21 | `ADMIN_NOTIFY` (destinatario de notificaciones) |

Más una novena ocurrencia en una route admin que no usa `requireAdmin()`
(ver §3).

**Riesgo**: si en algún momento cambia el email del owner o se añade un
segundo admin, hay que tocar los 9 sitios uno a uno. Es la clase de cambio
en el que se olvida uno.

**Propuesta para sesión futura**: tras resolver §1, sustituir todas estas
ocurrencias por imports del helper compartido `lib/adminAllowlist.js`.

---

## 3 · Endpoint `ets-price` con tercera variante de chequeo admin

`app/api/cbam/ets-price/route.js:9` declara su propio:

```js
const ADMIN_EMAILS = ['ccarrillodelolmo@gmail.com']
```

…y lo usa inline en `POST` (línea 83) en vez de llamar a `requireAdmin()`.
Es una tercera implementación del mismo chequeo, paralela a las otras dos
(client hardcoded + server env). No es bug porque el array contiene el
mismo email, pero es deuda técnica adicional.

**Propuesta para sesión futura**: migrar este endpoint a `requireAdmin()`
(o al helper unificado de §1) para que toda la auth admin tenga un solo
camino de código.

---

## 4 · RLS de `cbam_advisory_requests` sin cláusula admin

`pg_policy` para `public.cbam_advisory_requests` (verificado con SQL):

| Política | Comando | USING / WITH CHECK |
|---|---|---|
| `Users can view own requests` | SELECT | `auth.uid() = user_id` |
| `Users can insert own requests` | INSERT | `auth.uid() = user_id` (WITH CHECK) |
| `Users can update own draft requests` | UPDATE | `auth.uid() = user_id AND status IN ('draft','intake_complete')` |

**Ninguna política contempla el caso admin**. Hoy no es problema porque
los endpoints admin usan `supabaseAdmin` con `service_role`, que bypassea
RLS por construcción (ver `lib/cbamAdvisoryAdminService.js:5-6`).

**Robustez futura**: si algún flujo admin pasara accidentalmente al cliente
con sesión (p. ej. por refactor o por usar `createRouteHandlerClient` en
vez de `supabaseAdmin`), el listado vendría vacío silenciosamente sin
mensaje de error. El "fallo silencioso" es difícil de detectar.

**Propuesta para sesión futura**: añadir una política explícita

```sql
CREATE POLICY "Admins can view all requests"
  ON public.cbam_advisory_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
        AND email = ANY (string_to_array(current_setting('app.admin_emails', true), ','))
    )
  );
```

…o, más simple, mantener una tabla `admin_users` con `user_id`. La
decisión depende de cómo se resuelva §1 (env vs tabla).

---

## Alcance recomendado de la "sesión de limpieza de auth admin"

Una sola sesión de ~½ día puede cubrir los cuatro ítems si se ataca en
orden:

1. Crear `lib/adminAllowlist.js` (helper compartido, resuelve §1).
2. Sustituir las 9 ocurrencias hardcoded (§2).
3. Migrar `ets-price/route.js` al helper (§3).
4. Añadir política RLS admin explícita en `cbam_advisory_requests` (§4).
5. Documentar el patrón en `CLAUDE.md` o en este mismo fichero como
   "modelo a seguir" para futuros endpoints admin.

No es prerrequisito ni del PR #17 (saneamiento motor CBAM) ni de la
operativa actual de Advisory. Plan de attaque cuando aparezca el primer
caso de "necesito añadir un segundo admin".
