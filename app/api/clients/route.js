import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { clients } from '@/lib/schema'
import { nowISO } from '@/lib/utils'
import { getClientsList } from '@/lib/queries'

// Live data on every request — never statically cache this GET at build time.
export const dynamic = 'force-dynamic'

// GET /api/clients?q=  → list (newest first), optional name/email/phone search.
// The page Server-renders this via the shared getClientsList(); this route
// serves the same shape for client-side refresh after a mutation.
export async function GET(req) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  return NextResponse.json(await getClientsList({ q }))
}

// POST /api/clients → create.
export async function POST(req) {
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  const name = String(body.name || '').trim()
  if (!name) {
    return NextResponse.json({ error: 'Client name is required.' }, { status: 400 })
  }
  const [row] = await db
    .insert(clients)
    .values({
      name,
      email: String(body.email || '').trim(),
      phone: String(body.phone || '').trim(),
      address: String(body.address || '').trim(),
      createdAt: nowISO(),
    })
    .returning()
  return NextResponse.json(row, { status: 201 })
}
