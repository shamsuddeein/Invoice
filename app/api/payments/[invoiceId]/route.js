import { NextResponse } from 'next/server'
import { eq, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { payments, invoices, business } from '@/lib/schema'
import { generateDocNumber, nowISO, todayISO, round2 } from '@/lib/utils'
import { PAYMENT_METHODS } from '@/lib/constants'

// Live data on every request — never statically cache this GET at build time.
export const dynamic = 'force-dynamic'

const METHOD_VALUES = PAYMENT_METHODS.map((m) => m.value)

// GET /api/payments/[invoiceId] → payments for one invoice, oldest first.
export async function GET(_req, { params }) {
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

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId))
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 })
  }

  const alreadyPaid = invoice.amountPaid || 0
  const balance = round2((invoice.totalAmount || 0) - alreadyPaid)
  // Allow a tiny rounding tolerance; otherwise reject overpayment.
  if (amount > balance + 0.01) {
    return NextResponse.json(
      { error: `Payment exceeds the outstanding balance of ${'₦'}${balance.toLocaleString('en-NG')}.` },
      { status: 400 }
    )
  }

  const newAmountPaid = round2(alreadyPaid + amount)
  const rawBalance = round2((invoice.totalAmount || 0) - newAmountPaid)
  const newBalance = rawBalance < 0.01 ? 0 : rawBalance
  const newStatus = newBalance <= 0.01 ? 'paid' : 'partially_paid'
  const now = nowISO()

  const created = await db.transaction(async (tx) => {
    const [biz] = await tx.select().from(business).where(eq(business.id, 1))
    const prefix = biz?.receiptPrefix || 'RCPT'
    const nextNum = biz?.nextReceiptNumber || 1
    const receiptNumber = generateDocNumber(prefix, nextNum)

    const [payment] = await tx
      .insert(payments)
      .values({
        invoiceId,
        receiptNumber,
        amountPaid: amount,
        paymentDate,
        paymentMethod: method,
        referenceNumber: String(body.referenceNumber || ''),
        note: String(body.note || ''),
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
}
