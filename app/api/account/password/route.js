import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { appAuth } from '@/lib/schema'
import { hashPassword, verifyPassword, safeEqual } from '@/lib/password'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { nowISO } from '@/lib/utils'

// Node runtime: this route uses the libSQL client and Node crypto, neither of
// which is edge-safe. Never statically cache it.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  // Throttle by IP so a hijacked session can't brute-force the current password.
  if (!rateLimit(`pwchange:${clientIp(req)}`, { limit: 5, windowMs: 60_000 }).ok) {
    return NextResponse.json({ error: 'Too many attempts. Please try again in a minute.' }, { status: 429 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const currentPassword = String(body?.currentPassword || '')
  const newPassword = String(body?.newPassword || '')

  // Verify the current password against the stored hash, or the OWNER_PASSWORD
  // env bootstrap when no hash exists yet (first-time change / unmigrated DB).
  let storedHash = null
  try {
    const rows = await db.select().from(appAuth).where(eq(appAuth.id, 1))
    storedHash = rows[0]?.passwordHash || null
  } catch {
    storedHash = null
  }
  const currentOk = storedHash
    ? verifyPassword(currentPassword, storedHash)
    : safeEqual(currentPassword, process.env.OWNER_PASSWORD || '')
  if (!currentOk) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
  }
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: 'New password must be different from the current one.' }, { status: 400 })
  }

  const passwordHash = hashPassword(newPassword)
  const updatedAt = nowISO()
  await db
    .insert(appAuth)
    .values({ id: 1, passwordHash, updatedAt })
    .onConflictDoUpdate({ target: appAuth.id, set: { passwordHash, updatedAt } })

  return NextResponse.json({ ok: true })
}
