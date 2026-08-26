import { NextResponse } from 'next/server'
import { eq, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invoices, invoiceItems, clients, payments } from '@/lib/schema'
import { nowISO } from '@/lib/utils'

// Live data on every request — never statically cache this GET at build time.
export const dynamic = 'force-dynamic'

// GET /api/invoices/[id] → invoice with client, line items, and payments.
export async function GET(_req, { params }) {
  const id = Number(params.id)
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id))
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 })
  }

  const [client] = await db.select().from(clients).where(eq(clients.id, invoice.clientId))
  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, id))
    .orderBy(asc(invoiceItems.id))
  const paymentRows = await db
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, id))
    .orderBy(asc(payments.paymentDate))

  return NextResponse.json({ ...invoice, client: client || null, items, payments: paymentRows })
}

// PUT /api/invoices/[id] → replace details + line items, recompute totals.
// Preserves amountPaid; re-derives status from what has been paid.
export async function PUT(req, { params }) {
  const id = Number(params.id)
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const [existing] = await db.select().from(invoices).where(eq(invoices.id, id))
  if (!existing) {
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 })
  }

  const clientId = Number(body.clientId) || existing.clientId
  const [client] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, clientId))
  if (!client) {
    return NextResponse.json({ error: 'Selected client no longer exists.' }, { status: 400 })
  }

  const items = (Array.isArray(body.items) ? body.items : [])
    .map((it) => ({
      description: String(it.description || '').trim(),
      quantity: Number(it.quantity) || 0,
      unitPrice: Number(it.unitPrice) || 0,
    }))
    .filter((it) => it.description.length > 0)

  if (items.length === 0) {
    return NextResponse.json({ error: 'Add at least one line item with a description.' }, { status: 400 })
  }

  const taxRate = body.taxRate != null ? Number(body.taxRate) || 0 : existing.taxRate || 0
  const computed = items.map((it) => ({ ...it, lineTotal: it.quantity * it.unitPrice }))
  const subtotal = computed.reduce((s, it) => s + it.lineTotal, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const totalAmount = subtotal + taxAmount
  const amountPaid = existing.amountPaid || 0
  const balanceDue = totalAmount - amountPaid

  // Re-derive status from payments. Draft/sent are preserved when nothing is paid;
  // paid-family resets to sent when the balance reopens (e.g. items were added).
  let status = existing.status
  if (totalAmount > 0 && amountPaid >= totalAmount) status = 'paid'
  else if (amountPaid > 0) status = 'partially_paid'
  else if (status === 'paid' || status === 'partially_paid') status = 'sent'

  await db.transaction(async (tx) => {
    await tx
      .update(invoices)
      .set({
        clientId,
        issueDate: body.issueDate || existing.issueDate,
        // The due-date feature was removed — always kept as '' (NOT NULL column).
        dueDate: '',
        notes: body.notes != null ? String(body.notes) : existing.notes,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        balanceDue,
        status,
        updatedAt: nowISO(),
      })
      .where(eq(invoices.id, id))

    await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id))
    await tx.insert(invoiceItems).values(
      computed.map((it) => ({
        invoiceId: id,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
      }))
    )
  })

  return NextResponse.json({ ok: true })
}

// DELETE /api/invoices/[id] → remove invoice + its items + its payments.
// Children removed explicitly (FK cascade isn't relied on under libSQL).
export async function DELETE(_req, { params }) {
  const id = Number(params.id)
  const [existing] = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.id, id))
  if (!existing) {
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 })
  }

  await db.transaction(async (tx) => {
    await tx.delete(payments).where(eq(payments.invoiceId, id))
    await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id))
    await tx.delete(invoices).where(eq(invoices.id, id))
  })

  return NextResponse.json({ ok: true })
}
