import { NextResponse } from 'next/server'
import { desc, or, like } from 'drizzle-orm'
import { db } from '@/lib/db'
import { clients } from '@/lib/schema'
import { nowISO } from '@/lib/utils'

// Live data on every request — never statically cache this GET at build time.
export const dynamic = 'force-dynamic'

// GET /api/clients?q=  → list (newest first), optional name/email/phone search.
export async function GET(req) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  const base = db.select().from(clients)
  const rows = q
    ? await base
        .where(
          or(
            like(clients.name, `%${q}%`),
            like(clients.email, `%${q}%`),
            like(clients.phone, `%${q}%`)
          )
        )
        .orderBy(desc(clients.createdAt))
    : await base.orderBy(desc(clients.createdAt))
  return NextResponse.json(rows)
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
