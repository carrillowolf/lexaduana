/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function requireEnv() {
  if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
    throw new Error(
      'E2E: missing Supabase env vars. Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY), NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    )
  }
}

function adminClient() {
  requireEnv()
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  })
}

function anonClient() {
  requireEnv()
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
  })
}

async function createTestUser({ email, password }) {
  const admin = adminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error && error.message && !/already been registered/i.test(error.message)) {
    throw new Error(`createTestUser failed: ${error.message}`)
  }
  if (data?.user) return data.user
  // If already exists, lookup.
  const { data: list, error: lerr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (lerr) throw lerr
  return list.users.find(u => u.email === email)
}

async function deleteTestUser(userId) {
  if (!userId) return
  const admin = adminClient()
  await admin.auth.admin.deleteUser(userId).catch(() => null)
}

module.exports = {
  SUPABASE_URL,
  SERVICE_KEY,
  ANON_KEY,
  adminClient,
  anonClient,
  createTestUser,
  deleteTestUser,
  requireEnv,
}
