import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { eq } from 'drizzle-orm'
import { authConfig } from '@/auth.config'
import { db } from '@/lib/db'
import { appAuth } from '@/lib/schema'
import { verifyPassword, safeEqual } from '@/lib/password'
import { rateLimit, clientIp } from '@/lib/rate-limit'

// Full server-side auth (Node runtime). Spreads the edge-safe authConfig and
// adds the Credentials provider whose authorize() reads the DB — which is why
// this module must NEVER be imported by middleware (see middleware.js /
// auth.config.js for the split).
//
// Password resolution: match OWNER_USERNAME, then prefer the hashed password in
// the app_auth table (set via Settings › Security). If no hash exists yet — or
// the table isn't migrated (e.g. on Turso) — fall back to the OWNER_PASSWORD env
// bootstrap so login never breaks. The DB read is wrapped in try/catch for the
// same reason.
export async function authorizeUser(credentials, request, { dbClient = db, env = process.env } = {}) {
  // Throttle by client IP so scripted brute force is slowed without ever
  // locking out the owner by username (best-effort; see lib/rate-limit).
  const ip = clientIp(request)
  if (!rateLimit(`login:${ip}`, { limit: 10, windowMs: 60_000 }).ok) {
    return null
  }

  const username = credentials?.username
  const password = credentials?.password
  if (!username || !password || username !== env.OWNER_USERNAME) {
    return null
  }

  let storedHash = null
  try {
    const rows = await dbClient.select().from(appAuth).where(eq(appAuth.id, 1))
    storedHash = rows[0]?.passwordHash || null
  } catch (error) {
    console.error('[auth] Database failure during authentication:', error)
    // Unexpected database failure must reject authentication to prevent
    // reactivating old bootstrap passwords.
    return null
  }

  const ok = storedHash
    ? verifyPassword(password, storedHash)
    : (env.OWNER_PASSWORD ? safeEqual(password, env.OWNER_PASSWORD) : false)

  return ok ? { id: '1', name: username } : null
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        return authorizeUser(credentials, request)
      },
    }),
  ],
})
