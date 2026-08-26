import { NextResponse } from 'next/server'
import { and, eq, or, like, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invoices, invoiceItems, clients, business } from '@/lib/schema'
import { generateDocNumber, nowISO, todayISO } from '@/lib/utils'

// Live data on every request — never statically cache this GET at build time.
export const dynamic = 'force-dynamic'

// GET /api/invoices?status=&q= → list with client name, newest first.
export async function GET(req) {
  const sp = req.nextUrl.searchParams
  const status = sp.get('status')
  const q = sp.get('q')?.trim()

  const conditions = []
  if (status && status !== 'all') conditions.push(eq(invoices.status, status))
  if (q) conditions.push(or(like(invoices.invoiceNumber, `%${q}%`), like(clients.name, `%${q}%`)))
  const where = conditions.length ? and(...conditions) : undefined

  const rows = await db
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

  return NextResponse.json(rows)
}

// POST /api/invoices → create invoice + items + auto number in one transaction,
// then bump business.nextInvoiceNumber (doc §11).
export async function POST(req) {
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const clientId = Number(body.clientId)
  if (!clientId) {
    return NextResponse.json({ error: 'Please select a client.' }, { status: 400 })
  }

  const issueDate = body.issueDate || todayISO()
  // The due-date feature was removed — the NOT NULL column is always stored as ''.
  const dueDate = ''

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

  const [client] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, clientId))
  if (!client) {
    return NextResponse.json({ error: 'Selected client no longer exists.' }, { status: 400 })
  }

  const status = body.status === 'sent' ? 'sent' : 'draft'
  const taxRate = Number(body.taxRate) || 0
  const computed = items.map((it) => ({ ...it, lineTotal: it.quantity * it.unitPrice }))
  const subtotal = computed.reduce((s, it) => s + it.lineTotal, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const totalAmount = subtotal + taxAmount
  const now = nowISO()

  const created = await db.transaction(async (tx) => {
    const [biz] = await tx.select().from(business).where(eq(business.id, 1))
    const prefix = biz?.invoicePrefix || 'INV'
    const nextNum = biz?.nextInvoiceNumber || 1
    const invoiceNumber = generateDocNumber(prefix, nextNum)

    const [inv] = await tx
      .insert(invoices)
      .values({
        invoiceNumber,
        clientId,
        issueDate,
        dueDate,
        status,
        notes: String(body.notes || ''),
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        amountPaid: 0,
        balanceDue: totalAmount,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    await tx.insert(invoiceItems).values(
      computed.map((it) => ({
        invoiceId: inv.id,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
      }))
    )

    await tx.update(business).set({ nextInvoiceNumber: nextNum + 1 }).where(eq(business.id, 1))
    return inv
  })

  return NextResponse.json(created, { status: 201 })
}
