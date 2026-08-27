import { NextResponse } from 'next/server'
import { eq, and, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { payments, invoices, business } from '@/lib/schema'
import { generateDocNumber, formatNaira, nowISO, todayISO, round2 } from '@/lib/utils'
import { getOrCreateBusiness } from '@/lib/queries'
import { requireAuth } from '@/lib/guard'
import { PAYMENT_METHODS } from '@/lib/constants'

// Live data on every request — never statically cache this GET at build time.
export const dynamic = 'force-dynamic'

const METHOD_VALUES = PAYMENT_METHODS.map((m) => m.value)

// Thrown inside a transaction to roll it back and carry an HTTP status out.
class PaymentError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// GET /api/payments/[invoiceId] → payments for one invoice, oldest first.
export async function GET(_req, { params }) {
  const denied = await requireAuth()
  if (denied) return denied
  const invoiceId = Number(params.invoiceId)
  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, invoiceId))
    .orderBy(asc(payments.paymentDate), asc(payments.id))
  return NextResponse.json(rows)
}

// POST /api/payments/[invoiceId] → record a payment, auto receipt number, then
// recompute amountPaid / balanceDue / status and bump nextReceiptNumber (doc §11).
export async function POST(req, { params }) {
  const denied = await requireAuth()
  if (denied) return denied
  const invoiceId = Number(params.invoiceId)
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const amount = round2(body.amountPaid)
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Enter a payment amount greater than zero.' }, { status: 400 })
  }

  const method = body.paymentMethod
  if (!METHOD_VALUES.includes(method)) {
    return NextResponse.json({ error: 'Choose a valid payment method.' }, { status: 400 })
  }

  const paymentDate = body.paymentDate || todayISO()
  const now = nowISO()
  // Guarantee the singleton business row exists so the receipt-number bump below
  // isn't a no-op on a fresh DB.
  await getOrCreateBusiness()

  try {
    const created = await db.transaction(async (tx) => {
      // Read the invoice INSIDE the transaction so the balance we validate against
      // is the same row we update — closes the time-of-check/time-of-use gap.
      const [invoice] = await tx.select().from(invoices).where(eq(invoices.id, invoiceId))
      if (!invoice) throw new PaymentError('Invoice not found.', 404)

      const alreadyPaid = invoice.amountPaid || 0
      const total = invoice.totalAmount || 0
      const balance = round2(total - alreadyPaid)
      if (balance <= 0) {
        throw new PaymentError('This invoice is already fully paid.', 400)
      }
      // Allow a tiny rounding tolerance; otherwise reject overpayment.
      if (amount > balance + 0.01) {
        throw new PaymentError(`Payment exceeds the outstanding balance of ${formatNaira(balance)}.`, 400)
      }

      // Clamp to the outstanding balance so a within-tolerance overpayment never
      // records more than is actually owed.
      const applied = Math.min(amount, balance)
      const newAmountPaid = round2(alreadyPaid + applied)
      const rawBalance = round2(total - newAmountPaid)
      const newBalance = rawBalance < 0.01 ? 0 : rawBalance
      const newStatus = newBalance <= 0.01 ? 'paid' : 'partially_paid'

      const [biz] = await tx.select().from(business).where(eq(business.id, 1))
      const prefix = biz?.receiptPrefix || 'RCPT'
      const nextNum = biz?.nextReceiptNumber || 1
      const receiptNumber = generateDocNumber(prefix, nextNum, paymentDate)

      const [payment] = await tx
        .insert(payments)
        .values({
          invoiceId,
          receiptNumber,
          amountPaid: applied,
          paymentDate,
          paymentMethod: method,
          referenceNumber: String(body.referenceNumber || '').slice(0, 200),
          note: String(body.note || '').slice(0, 2000),
          createdAt: now,
        })
        .returning()

      await tx
        .update(invoices)
        .set({ amountPaid: newAmountPaid, balanceDue: newBalance, status: newStatus, updatedAt: now })
        .where(eq(invoices.id, invoiceId))

      await tx.update(business).set({ nextReceiptNumber: nextNum + 1 }).where(eq(business.id, 1))
      return payment
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    if (err instanceof PaymentError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}

// DELETE /api/payments/[invoiceId]?paymentId= → void one payment, then recompute
// the invoice's amountPaid / balanceDue / status from the payments that remain.
export async function DELETE(req, { params }) {
  const denied = await requireAuth()
  if (denied) return denied
  const invoiceId = Number(params.invoiceId)
  const paymentId = Number(req.nextUrl.searchParams.get('paymentId'))
  if (!paymentId) {
    return NextResponse.json({ error: 'A paymentId is required.' }, { status: 400 })
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [payment] = await tx
        .select()
        .from(payments)
        .where(and(eq(payments.id, paymentId), eq(payments.invoiceId, invoiceId)))
      if (!payment) throw new PaymentError('Payment not found.', 404)

      const [invoice] = await tx.select().from(invoices).where(eq(invoices.id, invoiceId))
      if (!invoice) throw new PaymentError('Invoice not found.', 404)

      await tx.delete(payments).where(eq(payments.id, paymentId))

      // Recompute from what remains — never trust the stored running total.
      const remaining = await tx.select().from(payments).where(eq(payments.invoiceId, invoiceId))
      const amountPaid = round2(remaining.reduce((s, p) => s + (p.amountPaid || 0), 0))
      const total = invoice.totalAmount || 0
      const rawBalance = round2(total - amountPaid)
      const balanceDue = rawBalance < 0.01 ? 0 : rawBalance

      let status
      if (amountPaid <= 0) {
        // Reopened: revert paid-family back to sent, but leave a manual draft alone.
        status = invoice.status === 'paid' || invoice.status === 'partially_paid' ? 'sent' : invoice.status
      } else if (balanceDue === 0) {
        status = 'paid'
      } else {
        status = 'partially_paid'
      }

      await tx
        .update(invoices)
        .set({ amountPaid, balanceDue, status, updatedAt: nowISO() })
        .where(eq(invoices.id, invoiceId))

      return { ok: true }
    })
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof PaymentError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
