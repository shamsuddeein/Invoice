import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invoices, invoiceItems, clients, business } from '@/lib/schema'
import { generateDocNumber, nowISO, todayISO } from '@/lib/utils'
import { getInvoicesList, getOrCreateBusiness } from '@/lib/queries'
import { requireAuth } from '@/lib/guard'

import { validateInvoiceItems, validateTaxRate, calculateInvoiceTotals } from '@/lib/invoice-calc'

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

// Create invoice business logic callable both by route handler and tests
export async function createInvoice(body, { dbClient = db } = {}) {
  const clientId = Number(body.clientId)
  if (!clientId) {
    const err = new Error('Please select a client.')
    err.status = 400
    throw err
  }

  const { items, error: itemsError } = validateInvoiceItems(body.items)
  if (itemsError) {
    const err = new Error(itemsError)
    err.status = 400
    throw err
  }

  const { taxRate, error: taxError } = validateTaxRate(body.taxRate)
  if (taxError) {
    const err = new Error(taxError)
    err.status = 400
    throw err
  }

  const issueDate = body.issueDate || todayISO()
  // The due-date feature was removed — the NOT NULL column is always stored as ''.
  const dueDate = ''

  const [client] = await dbClient.select({ id: clients.id }).from(clients).where(eq(clients.id, clientId))
  if (!client) {
    const err = new Error('Selected client no longer exists.')
    err.status = 400
    throw err
  }

  const status = body.status === 'sent' ? 'sent' : 'draft'
  const calculation = calculateInvoiceTotals(items, taxRate)
  if (calculation.error) {
    const err = new Error(calculation.error)
    err.status = 400
    throw err
  }
  const { items: computedItems, subtotal, taxAmount, totalAmount } = calculation
  const now = nowISO()
  // Guarantee the singleton business row exists so the number bump below isn't a
  // no-op on a fresh DB (which would collide invoice numbers at INV-YYYY-001).
  await getOrCreateBusiness(dbClient)

  const created = await dbClient.transaction(async (tx) => {
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
      computedItems.map((it) => ({
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

  return created
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

  try {
    const created = await createInvoice(body)
    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
