/**
 * CBAM Admin Auth Helper
 *
 * Verifica que el usuario autenticado es admin (su email está en ADMIN_EMAILS).
 * Usado por todas las API routes bajo /api/admin/cbam/asesoria/*.
 *
 * Patrón de uso:
 *   const result = await requireAdmin()
 *   if (!result.ok) return result.response
 *   const { user } = result
 *   // ... operación admin ...
 *
 * TECH DEBT (post-Día 5, no bloqueante):
 * La allowlist server-side se lee de env (ADMIN_EMAILS) y funciona bien,
 * pero la comprobación client-side en las páginas admin todavía usa un
 * array hardcoded (ej. app/admin/cbam/asesoria/[id]/page.js). Refactorizar
 * para exponer la allowlist vía `NEXT_PUBLIC_ADMIN_EMAILS` o helper server
 * compartido permitirá:
 *   - Provisionar admins de test en Playwright sin modificar código.
 *   - Añadir un segundo admin sin tocar el repo (solo Vercel env).
 * Mientras tanto, los integration tests exercise la lógica sin UI admin.
 */

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/** Lee la lista de emails admin desde la variable de entorno. */
function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || ''
  return raw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Verifica autenticación + rol admin.
 * Devuelve { ok: true, user } o { ok: false, response: NextResponse }.
 */
export async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'No autenticado' }, { status: 401 }),
    }
  }

  const adminEmails = getAdminEmails()
  const userEmail = (user.email || '').toLowerCase()

  if (!adminEmails.includes(userEmail)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }),
    }
  }

  return { ok: true, user }
}

/** Devuelve true si el email es admin (uso en componentes server). */
export function isAdminEmail(email) {
  if (!email) return false
  return getAdminEmails().includes(email.toLowerCase())
}
