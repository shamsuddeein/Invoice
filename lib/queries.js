import { sql, eq, and, or, desc, inArray, like } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invoices, payments, clients, business } from '@/lib/schema'
import { todayISO, round2 } from '@/lib/utils'

// ─── Shared read queries ────────────────────────────────────────────────
// One source of truth for the app's list/overview reads, called BOTH by the
// Server Components that render each page (so first paint is server-rendered,
// no client fetch waterfall) and by the /api routes the client islands hit to
// refresh after a mutation. Because @/lib/db pulls in the libSQL client, this
// module only ever runs on the server.

// Statuses that represent real, unpaid receivables (a draft isn't sent yet, a
// paid invoice has no balance).
const OUTSTANDING_STATUSES = ['sent', 'partially_paid']

// Sum a `real` money column to a plain number, treating an empty set as 0
// (SUM over no rows is NULL in SQL).
const sumOf = (col) => sql`coalesce(sum(${col}), 0)`.mapWith(Number)

// Dashboard overview: three aggregated metrics + the five newest invoices.
// Metrics are summed in SQL over indexed columns rather than by loading every
// row into JS. Sums are rounded to 2dp to absorb float drift from adding many
// `real` values (see round2 in lib/utils).
export async function getDashboardData() {
  const month = todayISO().slice(0, 7) // YYYY-MM

  const [[revenueRow], [monthRow], [outstandingRow], recentInvoices, [biz]] = await Promise.all([
    // Total revenue = every naira actually collected (sum of all payments).
    db.select({ v: sumOf(payments.amountPaid) }).from(payments),
    // Collected this month = payments dated within the current calendar month.
    db
      .select({ v: sumOf(payments.amountPaid) })
      .from(payments)
      .where(like(payments.paymentDate, `${month}%`)),
    // Outstanding = balance still owed on sent / partially-paid invoices.
    db
      .select({ v: sumOf(invoices.balanceDue) })
      .from(invoices)
      .where(inArray(invoices.status, OUTSTANDING_STATUSES)),
    // The five newest invoices for the activity list.
    db
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
      .limit(5),
    db.select({ name: business.name }).from(business).limit(1),
  ])

  return {
    businessName: biz?.name || '',
    // Single-user app: the owner's display name is the login username.
    ownerName: process.env.OWNER_USERNAME || '',
    metrics: {
      totalRevenue: round2(revenueRow.v),
      collectedThisMonth: round2(monthRow.v),
      outstanding: round2(outstandingRow.v),
    },
    recentInvoices,
    // Any invoice at all → the newest-5 query returns at least one row.
    hasInvoices: recentInvoices.length > 0,
  }
}

// Invoices list with client name, newest first. Optional status / text-search
// filters mirror the query the /api/invoices GET accepts.
export async function getInvoicesList({ status, q } = {}) {
  const conditions = []
  if (status && status !== 'all') conditions.push(eq(invoices.status, status))
  if (q) conditions.push(or(like(invoices.invoiceNumber, `%${q}%`), like(clients.name, `%${q}%`)))
  const where = conditions.length ? and(...conditions) : undefined

  return db
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
    .where(where)
    .orderBy(desc(invoices.createdAt))
}

// All payments, newest first, with the parent invoice number + client name for
// the payments ledger. Shape mirrors the /api/payments GET exactly.
export async function getPaymentsList() {
  return db
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
}

// Clients, newest first, with an optional name/email/phone search — the exact
// shape (all columns) the clients list and its /api route return.
export async function getClientsList({ q } = {}) {
  const where = q
    ? or(
        like(clients.name, `%${q}%`),
        like(clients.email, `%${q}%`),
        like(clients.phone, `%${q}%`)
      )
    : undefined

  return db.select().from(clients).where(where).orderBy(desc(clients.createdAt))
}
