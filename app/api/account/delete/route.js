import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request) {
  // 1. Autenticación: la petición debe venir de un usuario logueado.
  const supabaseAuth = createRouteHandlerClient({ cookies })
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = user.id

  // 2. Confirmar la intención: el cliente debe enviar { confirm: true }.
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body?.confirm !== true) {
    return NextResponse.json(
      { error: 'Confirmation required. Send { "confirm": true } in body.' },
      { status: 400 }
    )
  }

  // 3. Cliente con service_role para operaciones admin.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )

  try {
    // 4. PRIMERO: pseudonimizar datos del usuario en las 4 tablas. La función
    // SQL ya existe (Phase 8.1).
    const { error: pseudoError } = await supabaseAdmin.rpc(
      'pseudonymize_user_data_on_delete_by_id',
      { p_user_id: userId }
    )

    if (pseudoError) {
      console.error('[account/delete] Pseudonymize error:', pseudoError.message)
      return NextResponse.json(
        { error: 'Failed to pseudonymize user data', details: pseudoError.message },
        { status: 500 }
      )
    }

    // 5. SEGUNDO: borrar el usuario de auth.users. El FK SET NULL deja
    // user_id en NULL en las tablas relacionadas; user_id_hash conserva la
    // trazabilidad pseudonimizada.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      // Caso crítico: pseudonimizamos pero no pudimos borrar. El usuario
      // sigue existiendo y sus datos relacionados ya tienen el hash.
      console.error('[account/delete] Delete user failed AFTER pseudonymize:', deleteError.message)
      return NextResponse.json(
        {
          error: 'Failed to delete user account. Data was pseudonymized but user still exists. Contact support.',
          details: deleteError.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, message: 'Account deleted successfully' })
  } catch (err) {
    console.error('[account/delete] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Unexpected error during account deletion' },
      { status: 500 }
    )
  }
}
