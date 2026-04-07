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

/**
 * Cliente lazy: NO se instancia en import time.
 * Evita romper el build (Next collect-page-data) cuando faltan env vars,
 * y solo lanza si se intenta usar realmente sin configurar las vars.
 */
let _client = null

function buildClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase admin env vars (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)'
    )
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export const supabaseAdmin = new Proxy(
  {},
  {
    get(_target, prop) {
      if (!_client) _client = buildClient()
      const value = _client[prop]
      return typeof value === 'function' ? value.bind(_client) : value
    },
  }
)
