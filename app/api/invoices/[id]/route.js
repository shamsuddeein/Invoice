import { NextResponse } from 'next/server'
import { eq, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invoices, invoiceItems, clients, payments } from '@/lib/schema'
import { nowISO, round2 } from '@/lib/utils'
import { requireAuth } from '@/lib/guard'
import { validateInvoiceItems, validateTaxRate, calculateInvoiceTotals } from '@/lib/invoice-calc'

// Live data on every request — never statically cache this GET at build time.
export const dynamic = 'force-dynamic'

// GET /api/invoices/[id] → invoice with client, line items, and payments.
export async function GET(_req, { params }) {
  const denied = await requireAuth()
  if (denied) return denied
  const id = Number(params.id)
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id))
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 })
  }

  // The three child reads are independent — run them together.
  const [[client], items, paymentRows] = await Promise.all([
    db.select().from(clients).where(eq(clients.id, invoice.clientId)),
    db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)).orderBy(asc(invoiceItems.id)),
    db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, id))
      .orderBy(asc(payments.paymentDate), asc(payments.id)),
  ])

  return NextResponse.json({ ...invoice, client: client || null, items, payments: paymentRows })
}

export class InvoiceError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function updateInvoice(id, body, { dbClient = db } = {}) {
  const { items, error: itemsError } = validateInvoiceItems(body.items)
  if (itemsError) {
    throw new InvoiceError(itemsError, 400)
  }

  return await dbClient.transaction(async (tx) => {
    const [existing] = await tx.select().from(invoices).where(eq(invoices.id, id))
    if (!existing) {
      throw new InvoiceError('Invoice not found.', 404)
    }

    const clientId = Number(body.clientId) || existing.clientId
    const [client] = await tx.select({ id: clients.id }).from(clients).where(eq(clients.id, clientId))
    if (!client) {
      throw new InvoiceError('Selected client no longer exists.', 400)
    }

    let taxRate = existing.taxRate || 0
    if (body.taxRate !== undefined && body.taxRate !== null) {
      const { taxRate: validatedRate, error: taxError } = validateTaxRate(body.taxRate)
      if (taxError) {
        throw new InvoiceError(taxError, 400)
      }
      taxRate = validatedRate
    }

    const calculation = calculateInvoiceTotals(items, taxRate)
    if (calculation.error) {
      throw new InvoiceError(calculation.error, 400)
    }
    const { items: computedItems, subtotal, taxAmount, totalAmount, taxRate: normalizedTaxRate } = calculation

    // Query current payments inside transaction to get the ground truth amount paid
    const paymentRows = await tx.select().from(payments).where(eq(payments.invoiceId, id))
    const amountPaid = round2(paymentRows.reduce((s, p) => s + (p.amountPaid || 0), 0))
    const balanceDue = Math.max(0, round2(totalAmount - amountPaid))

    // Re-derive status from fresh payments. Draft/sent are preserved when nothing is paid;
    // paid-family resets to sent when the balance reopens (e.g. items were added).
    let status = existing.status
    if (totalAmount > 0 && amountPaid >= totalAmount) status = 'paid'
    else if (amountPaid > 0) status = 'partially_paid'
    else if (status === 'paid' || status === 'partially_paid') status = 'sent'

    await tx
      .update(invoices)
      .set({
        clientId,
        issueDate: body.issueDate || existing.issueDate,
        // The due-date feature was removed — always kept as '' (NOT NULL column).
        dueDate: '',
        notes: body.notes != null ? String(body.notes).slice(0, 5000) : existing.notes,
        subtotal,
        taxRate: normalizedTaxRate,
        taxAmount,
        totalAmount,
        amountPaid,
        balanceDue,
        status,
        updatedAt: nowISO(),
      })
      .where(eq(invoices.id, id))

    await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id))
    await tx.insert(invoiceItems).values(
      computedItems.map((it) => ({
        invoiceId: id,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
      }))
    )

    return { ok: true }
  })
}

// PUT /api/invoices/[id] → replace details + line items, recompute totals.
// Re-reads payments and existing invoice inside transaction to avoid race conditions.
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

  try {
    const result = await updateInvoice(id, body)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof InvoiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}

// DELETE /api/invoices/[id] → remove invoice + its items + its payments.
// Children removed explicitly (FK cascade isn't relied on under libSQL).
export async function DELETE(_req, { params }) {
  const denied = await requireAuth()
  if (denied) return denied
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
