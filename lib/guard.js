import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Per-route authorization guard. Middleware (middleware.js) gates every route,
// but relying on it alone makes authorization a single point of failure — a
// middleware bypass (e.g. CVE-2025-29927) would otherwise reach the data
// handlers directly. Every API route calls this so a request without a valid
// session is rejected at the handler too (defense in depth).
//
// Usage at the top of a handler:
//   const denied = await requireAuth()
//   if (denied) return denied
export async function requireAuth() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }
  return null
}
