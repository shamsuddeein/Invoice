import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { business } from '@/lib/schema'
import { nowISO } from '@/lib/utils'

// Live data on every request — never statically cache this GET at build time.
export const dynamic = 'force-dynamic'

// Ensures the single business row (id=1) exists so the app always has settings
// to read/edit (decision #3).
async function getOrCreateBusiness() {
  const rows = await db.select().from(business).where(eq(business.id, 1))
  if (rows.length) return rows[0]
  await db.insert(business).values({ id: 1, name: '', updatedAt: nowISO() }).onConflictDoNothing()
  const created = await db.select().from(business).where(eq(business.id, 1))
  return created[0]
}

// Only these are editable from /settings. next*Number are managed automatically
// by the invoice/payment flows, not the settings form.
const EDITABLE = [
  'name',
  'email',
  'phone',
  'address',
  'logo',
  'bankName',
  'accountNumber',
  'accountName',
  'taxRate',
  'invoicePrefix',
  'receiptPrefix',
]

export async function GET() {
  const row = await getOrCreateBusiness()
  return NextResponse.json(row)
}

export async function PUT(req) {
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  await getOrCreateBusiness()

  const patch = {}
  for (const key of EDITABLE) {
    if (key in body) patch[key] = body[key]
  }
  if ('taxRate' in patch) patch.taxRate = Number(patch.taxRate) || 0
  if ('invoicePrefix' in patch) patch.invoicePrefix = String(patch.invoicePrefix || 'INV').trim() || 'INV'
  if ('receiptPrefix' in patch) patch.receiptPrefix = String(patch.receiptPrefix || 'RCPT').trim() || 'RCPT'
  if ('logo' in patch) {
    patch.logo = String(patch.logo || '')
    // Guard against an oversized data URL bloating the single business row.
    if (patch.logo.length > 1_400_000) {
      return NextResponse.json({ error: 'Logo image is too large.' }, { status: 400 })
    }
  }
  patch.updatedAt = nowISO()

  await db.update(business).set(patch).where(eq(business.id, 1))
  const rows = await db.select().from(business).where(eq(business.id, 1))
  return NextResponse.json(rows[0])
}
