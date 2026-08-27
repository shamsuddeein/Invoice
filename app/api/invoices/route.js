import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invoices, invoiceItems, clients, business } from '@/lib/schema'
import { generateDocNumber, nowISO, todayISO, round2 } from '@/lib/utils'
import { getInvoicesList, getOrCreateBusiness } from '@/lib/queries'
import { requireAuth } from '@/lib/guard'

// Live data on every request — never statically cache this GET at build time.
export const dynamic = 'force-dynamic'

// GET /api/invoices?status=&q= → list with client name, newest first. The page
// Server-renders this via the shared getInvoicesList(); this route serves the
// same shape for client-side refresh after a mutation.
export async function GET(req) {
  const denied = await requireAuth()
  if (denied) return denied
  const sp = req.nextUrl.searchParams
  const rows = await getInvoicesList({ status: sp.get('status'), q: sp.get('q')?.trim() })
  return NextResponse.json(rows)
}

// POST /api/invoices → create invoice + items + auto number in one transaction,
// then bump business.nextInvoiceNumber (doc §11).
export async function POST(req) {
  const denied = await requireAuth()
  if (denied) return denied
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

  const rawItems = Array.isArray(body.items) ? body.items : []
  if (rawItems.length > 500) {
    return NextResponse.json({ error: 'Too many line items (max 500).' }, { status: 400 })
  }
  const items = rawItems
    .map((it) => ({
      description: String(it.description || '').trim().slice(0, 500),
      quantity: Math.max(0, Number(it.quantity) || 0),
      unitPrice: Math.max(0, Number(it.unitPrice) || 0),
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
  const computed = items.map((it) => ({ ...it, lineTotal: round2(it.quantity * it.unitPrice) }))
  const subtotal = round2(computed.reduce((s, it) => s + it.lineTotal, 0))
  const taxAmount = round2(subtotal * (taxRate / 100))
  const totalAmount = round2(subtotal + taxAmount)
  const now = nowISO()
  // Guarantee the singleton business row exists so the number bump below isn't a
  // no-op on a fresh DB (which would collide invoice numbers at INV-YYYY-001).
  await getOrCreateBusiness()

  const created = await db.transaction(async (tx) => {
    const [biz] = await tx.select().from(business).where(eq(business.id, 1))
    const prefix = biz?.invoicePrefix || 'INV'
    const nextNum = biz?.nextInvoiceNumber || 1
    const invoiceNumber = generateDocNumber(prefix, nextNum, issueDate)

    const [inv] = await tx
      .insert(invoices)
      .values({
        invoiceNumber,
        clientId,
        issueDate,
        dueDate,
        status,
        notes: String(body.notes || '').slice(0, 5000),
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
