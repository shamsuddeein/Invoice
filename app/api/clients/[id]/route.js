import { NextResponse } from 'next/server'
import { eq, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { clients, invoices } from '@/lib/schema'
import { requireAuth } from '@/lib/guard'

// Live data on every request — never statically cache this GET at build time.
export const dynamic = 'force-dynamic'

// GET /api/clients/[id] → client + their invoice history (newest first).
export async function GET(_req, { params }) {
  const denied = await requireAuth()
  if (denied) return denied
  const id = Number(params.id)
  const [client] = await db.select().from(clients).where(eq(clients.id, id))
  if (!client) {
    return NextResponse.json({ error: 'Client not found.' }, { status: 404 })
  }
  const history = await db
    .select()
    .from(invoices)
    .where(eq(invoices.clientId, id))
    .orderBy(desc(invoices.createdAt))
  return NextResponse.json({ ...client, invoices: history })
}

// PUT /api/clients/[id] → update.
export async function PUT(req, { params }) {
  const denied = await requireAuth()
  if (denied) return denied
  const id = Number(params.id)
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
  const existing = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, id))
  if (!existing.length) {
    return NextResponse.json({ error: 'Client not found.' }, { status: 404 })
  }
  await db
    .update(clients)
    .set({
      name,
      email: String(body.email || '').trim(),
      phone: String(body.phone || '').trim(),
      address: String(body.address || '').trim(),
    })
    .where(eq(clients.id, id))
  const [row] = await db.select().from(clients).where(eq(clients.id, id))
  return NextResponse.json(row)
}

// DELETE /api/clients/[id] → blocked if the client has invoices (FK integrity).
export async function DELETE(_req, { params }) {
  const denied = await requireAuth()
  if (denied) return denied
  const id = Number(params.id)
  const linked = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(eq(invoices.clientId, id))
    .limit(1)
  if (linked.length) {
    return NextResponse.json(
      { error: 'This client has invoices. Delete those invoices before deleting the client.' },
      { status: 409 }
    )
  }
  await db.delete(clients).where(eq(clients.id, id))
  return NextResponse.json({ ok: true })
}
