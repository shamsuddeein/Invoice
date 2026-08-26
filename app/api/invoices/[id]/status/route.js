import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invoices } from '@/lib/schema'
import { nowISO } from '@/lib/utils'

// Live data on every request — never statically cache at build time.
export const dynamic = 'force-dynamic'

// PATCH /api/invoices/[id]/status → manual draft ⇄ sent toggle only.
// Paid / partially_paid are driven by recorded payments, so they can't be set
// by hand here.
export async function PATCH(req, { params }) {
  const id = Number(params.id)
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const target = body.status
  if (target !== 'draft' && target !== 'sent') {
    return NextResponse.json({ error: 'Status can only be set to draft or sent.' }, { status: 400 })
  }

  const [existing] = await db.select().from(invoices).where(eq(invoices.id, id))
  if (!existing) {
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 })
  }

  if (existing.status === 'paid' || existing.status === 'partially_paid') {
    return NextResponse.json(
      { error: 'This invoice has recorded payments and cannot be moved back to draft or sent.' },
      { status: 409 }
    )
  }

  await db.update(invoices).set({ status: target, updatedAt: nowISO() }).where(eq(invoices.id, id))
  return NextResponse.json({ ok: true })
}
