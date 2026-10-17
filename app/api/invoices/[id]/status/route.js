import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invoices } from '@/lib/schema'
import { nowISO } from '@/lib/utils'
import { requireAuth } from '@/lib/guard'

// Live data on every request — never statically cache at build time.
export const dynamic = 'force-dynamic'

export class StatusError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function updateInvoiceStatus(id, target, { dbClient = db } = {}) {
  if (target !== 'draft' && target !== 'sent') {
    throw new StatusError('Status can only be set to draft or sent.', 400)
  }

  return await dbClient.transaction(async (tx) => {
    const [existing] = await tx.select().from(invoices).where(eq(invoices.id, id))
    if (!existing) {
      throw new StatusError('Invoice not found.', 404)
    }

    if (existing.status === 'paid' || existing.status === 'partially_paid' || (existing.amountPaid || 0) > 0) {
      throw new StatusError(
        'This invoice has recorded payments and cannot be moved back to draft or sent.',
        409
      )
    }

    await tx.update(invoices).set({ status: target, updatedAt: nowISO() }).where(eq(invoices.id, id))
    return { ok: true }
  })
}

// PATCH /api/invoices/[id]/status → manual draft ⇄ sent toggle only.
// Paid / partially_paid are driven by recorded payments, so they can't be set
// by hand here.
export async function PATCH(req, { params }) {
  const denied = await requireAuth()
  if (denied) return denied
  const id = Number(params.id)
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  try {
    const result = await updateInvoiceStatus(id, body.status)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof StatusError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
