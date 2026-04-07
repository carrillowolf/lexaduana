/**
 * Supabase Admin Client (service_role)
 *
 * SOLO PARA USO EN EL SERVIDOR (API routes, server actions).
 * NUNCA importar desde código cliente.
 *
 * Bypassa RLS — la autorización debe garantizarse antes de usarlo
 * (ver lib/cbamAdminAuth.js para verificación de email admin).
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Missing Supabase admin env vars (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)'
  )
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
