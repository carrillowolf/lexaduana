import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/revalidate/glossary
 *
 * Body:
 *   { "secret": "...", "slugs": ["taric", "codigo-hs"] }
 *   { "secret": "...", "all": true }  → revalida índice + sitemap
 *
 * Auth: header x-revalidate-secret O campo secret en body.
 *
 * Respuestas:
 *   200: { revalidated: ["/glosario/taric", ...], timestamp }
 *   400: { error: "Invalid JSON" }
 *   401: { error: "Unauthorized" }
 *   500: { error: "Server misconfigured" }
 */
export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const secretFromHeader = request.headers.get('x-revalidate-secret')
  const secretFromBody = body?.secret
  const expected = process.env.GLOSSARY_REVALIDATE_SECRET

  if (!expected) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }
  if (secretFromHeader !== expected && secretFromBody !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const revalidated = []

  if (Array.isArray(body.slugs)) {
    for (const slug of body.slugs) {
      if (typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) continue
      const path = `/glosario/${slug}`
      revalidatePath(path)
      revalidated.push(path)
    }
  }

  if (body.all === true) {
    revalidatePath('/glosario')
    revalidatePath('/sitemap.xml')
    revalidated.push('/glosario', '/sitemap.xml')
  }

  if (revalidated.length > 0 && !revalidated.includes('/glosario')) {
    revalidatePath('/glosario')
    revalidated.push('/glosario')
  }

  return NextResponse.json({
    revalidated,
    timestamp: new Date().toISOString()
  })
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'glossary revalidation',
    method: 'POST',
    auth: 'x-revalidate-secret header or { secret } in body',
    bodyFormats: [
      '{ "secret": "...", "slugs": ["taric", "codigo-hs"] }',
      '{ "secret": "...", "all": true }'
    ]
  })
}
