import { sql, eq, and, or, asc, desc, gte, lt, inArray, like } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invoices, invoiceItems, payments, clients, business } from '@/lib/schema'
import { todayISO, nowISO, round2 } from '@/lib/utils'

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
  const month = todayISO().slice(0, 7) // YYYY-MM (business timezone)
  // Half-open [monthStart, nextMonthStart) range instead of LIKE 'YYYY-MM%':
  // SQLite's default LIKE is case-insensitive and won't use the payment_date
  // index, whereas the range comparison does.
  const mm = Number(month.slice(5, 7))
  const yy = Number(month.slice(0, 4))
  const monthStart = `${month}-01`
  const nextMonthStart = mm === 12 ? `${yy + 1}-01-01` : `${month.slice(0, 5)}${String(mm + 1).padStart(2, '0')}-01`

  const [[revenueRow], [monthRow], [outstandingRow], recentInvoices, [biz]] = await Promise.all([
    // Total revenue = every naira actually collected (sum of all payments).
    db.select({ v: sumOf(payments.amountPaid) }).from(payments),
    // Collected this month = payments dated within the current calendar month.
    db
      .select({ v: sumOf(payments.amountPaid) })
      .from(payments)
      .where(and(gte(payments.paymentDate, monthStart), lt(payments.paymentDate, nextMonthStart))),
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

// ─── Single-row reads (detail pages fetch these server-side) ─────────────

// Ensure the single business row (id = 1) exists so numbering + settings always
// have a row to read/update. Shared by /api/business and the invoice/payment
// POST handlers, whose counter bump is `UPDATE business ... WHERE id = 1` — a
// no-op if the row is absent, which on an empty DB produced a duplicate invoice
// number (and a UNIQUE-constraint 500) on the second create.
export async function getOrCreateBusiness() {
  const rows = await db.select().from(business).where(eq(business.id, 1))
  if (rows.length) return rows[0]
  await db.insert(business).values({ id: 1, name: '', updatedAt: nowISO() }).onConflictDoNothing()
  const created = await db.select().from(business).where(eq(business.id, 1))
  return created[0]
}

// Slim read for the New Invoice form: just the scalar defaults, NOT the full
// business row — which carries the base64 logo (up to ~1.4 MB) the form never
// uses. Avoids shipping the whole logo to render one tax-rate default.
export async function getInvoiceDefaults() {
  const [row] = await db
    .select({
      taxRate: business.taxRate,
      invoicePrefix: business.invoicePrefix,
      receiptPrefix: business.receiptPrefix,
    })
    .from(business)
    .where(eq(business.id, 1))
    .limit(1)
  return row || { taxRate: 0, invoicePrefix: 'INV', receiptPrefix: 'RCPT' }
}

// Full invoice detail: invoice + client + items + payments. Only `client`
// depends on the invoice (its clientId), so items + payments + client run in
// parallel — avoiding three serial round-trips to a remote (Turso) DB. Payments
// are ordered oldest-first so a receipt can compute the running balance as of
// each payment. Returns null when the invoice doesn't exist.
export async function getInvoiceById(id) {
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id))
  if (!invoice) return null
  const [clientRows, items, paymentRows] = await Promise.all([
    db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1),
    db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)).orderBy(asc(invoiceItems.id)),
    db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, id))
      .orderBy(asc(payments.paymentDate), asc(payments.id)),
  ])
  return { ...invoice, client: clientRows[0] || null, items, payments: paymentRows }
}

// Client + their invoice history (newest first). Returns null when not found.
export async function getClientById(id) {
  const [client] = await db.select().from(clients).where(eq(clients.id, id))
  if (!client) return null
  const history = await db
    .select()
    .from(invoices)
    .where(eq(invoices.clientId, id))
    .orderBy(desc(invoices.createdAt))
  return { ...client, invoices: history }
}
