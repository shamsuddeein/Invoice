import { NextResponse } from 'next/server'
import { eq, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invoices, payments, clients, business } from '@/lib/schema'
import { todayISO } from '@/lib/utils'

// Live data on every request — never statically cache this GET at build time.
export const dynamic = 'force-dynamic'

// Statuses that represent real, unpaid receivables (a draft isn't sent yet, a
// paid invoice has no balance).
const OUTSTANDING_STATUSES = ['sent', 'partially_paid']

// GET /api/dashboard → overview metrics + recent invoices.
export async function GET() {
  const invoiceRows = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      clientId: invoices.clientId,
      clientName: clients.name,
      issueDate: invoices.issueDate,
      status: invoices.status,
      totalAmount: invoices.totalAmount,
      amountPaid: invoices.amountPaid,
      balanceDue: invoices.balanceDue,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .orderBy(desc(invoices.createdAt))

  const paymentRows = await db.select().from(payments)

  const [biz] = await db.select({ name: business.name }).from(business).limit(1)

  // ── Metrics ──────────────────────────────────────────────────────────
  // Total revenue = every naira actually collected (sum of all payments).
  const totalRevenue = paymentRows.reduce((s, p) => s + (p.amountPaid || 0), 0)

  // Collected this month = payments dated within the current calendar month.
  const month = todayISO().slice(0, 7) // YYYY-MM
  const collectedThisMonth = paymentRows
    .filter((p) => String(p.paymentDate || '').startsWith(month))
    .reduce((s, p) => s + (p.amountPaid || 0), 0)

  // Outstanding = balance still owed on sent / partial invoices.
  const outstanding = invoiceRows
    .filter((i) => OUTSTANDING_STATUSES.includes(i.status))
    .reduce((s, i) => s + (i.balanceDue || 0), 0)

  return NextResponse.json({
    businessName: biz?.name || '',
    // Single-user app: the owner's display name is the login username.
    ownerName: process.env.OWNER_USERNAME || '',
    metrics: {
      totalRevenue,
      collectedThisMonth,
      outstanding,
    },
    recentInvoices: invoiceRows.slice(0, 5),
    hasInvoices: invoiceRows.length > 0,
  })
}
