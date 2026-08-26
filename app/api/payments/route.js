import { NextResponse } from 'next/server'
import { eq, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { payments, invoices, clients } from '@/lib/schema'

// Live data on every request — never statically cache this GET at build time.
export const dynamic = 'force-dynamic'

// GET /api/payments → every payment, newest first, with invoice number + client
// name for the payments ledger (doc §9).
export async function GET() {
  const rows = await db
    .select({
      id: payments.id,
      receiptNumber: payments.receiptNumber,
      invoiceId: payments.invoiceId,
      invoiceNumber: invoices.invoiceNumber,
      clientName: clients.name,
      amountPaid: payments.amountPaid,
      paymentDate: payments.paymentDate,
      paymentMethod: payments.paymentMethod,
      referenceNumber: payments.referenceNumber,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .orderBy(desc(payments.paymentDate), desc(payments.id))

  return NextResponse.json(rows)
}
