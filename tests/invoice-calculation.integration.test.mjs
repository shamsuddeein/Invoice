import test from 'node:test'
import assert from 'node:assert/strict'
import { eq } from 'drizzle-orm'
import { createTestDb } from './test-db.mjs'
import * as schema from '../lib/schema.js'
import { calculateInvoiceTotals } from '../lib/invoice-calc.js'
import { createInvoice } from '../app/api/invoices/route.js'
import { updateInvoice } from '../app/api/invoices/[id]/route.js'

async function seedClient(dbClient) {
  await dbClient.insert(schema.clients).values({
    id: 1,
    name: 'Synthetic calculation client',
    createdAt: '2026-01-01T00:00:00Z',
  })
}

test('Tax precision produces identical preview, created, and edited invoice totals', async () => {
  const { dbClient, cleanup } = await createTestDb()
  try {
    await seedClient(dbClient)
    const items = [{ description: 'Service', quantity: 1, unitPrice: 1000 }]
    const preview = calculateInvoiceTotals(items, '7.555')
    assert.equal(preview.error, undefined)
    assert.equal(preview.taxRate, 7.56)
    assert.equal(preview.totalAmount, 1075.6)

    const created = await createInvoice({ clientId: 1, items, taxRate: '7.555' }, { dbClient })
    for (const key of ['subtotal', 'taxRate', 'taxAmount', 'totalAmount']) {
      assert.equal(created[key], preview[key], `Created ${key} must match the preview`)
    }

    const editedItems = [{ description: 'Edited service', quantity: 2, unitPrice: 1000 }]
    const editedPreview = calculateInvoiceTotals(editedItems, '7.555')
    await updateInvoice(created.id, { items: editedItems, taxRate: '7.555' }, { dbClient })
    const [edited] = await dbClient.select().from(schema.invoices).where(eq(schema.invoices.id, created.id))
    for (const key of ['subtotal', 'taxRate', 'taxAmount', 'totalAmount']) {
      assert.equal(edited[key], editedPreview[key], `Edited ${key} must match the preview`)
    }

    // Older invoices may already contain an unnormalized rate. An update that
    // omits the rate must still persist the rate actually used in its totals.
    await dbClient.update(schema.invoices).set({ taxRate: 7.555 }).where(eq(schema.invoices.id, created.id))
    await updateInvoice(created.id, { items: editedItems }, { dbClient })
    const [normalized] = await dbClient.select().from(schema.invoices).where(eq(schema.invoices.id, created.id))
    assert.equal(normalized.taxRate, editedPreview.taxRate)
    assert.equal(normalized.taxAmount, editedPreview.taxAmount)
    assert.equal(normalized.totalAmount, editedPreview.totalAmount)
  } finally {
    cleanup()
  }
})

const overflowCases = [
  {
    name: 'subtotal rounding overflow',
    items: [
      { description: 'Large A', quantity: 1, unitPrice: 1e306 },
      { description: 'Large B', quantity: 1, unitPrice: 1e306 },
    ],
    taxRate: 0,
  },
  {
    name: 'total including tax overflow',
    items: [{ description: 'Large taxable item', quantity: 1, unitPrice: 1e306 }],
    taxRate: 100,
  },
]

for (const overflowCase of overflowCases) {
  test(`Invoice creation rejects ${overflowCase.name} without consuming an invoice number`, async () => {
    const { dbClient, cleanup } = await createTestDb()
    try {
      await seedClient(dbClient)
      await dbClient.insert(schema.business).values({ id: 1, nextInvoiceNumber: 8 })
      await assert.rejects(
        createInvoice({ clientId: 1, items: overflowCase.items, taxRate: overflowCase.taxRate }, { dbClient }),
        (err) => err.status === 400 && /limit|large|finite|overflow/i.test(err.message)
      )
      assert.equal((await dbClient.select().from(schema.invoices)).length, 0)
      assert.equal((await dbClient.select().from(schema.invoiceItems)).length, 0)
      const [business] = await dbClient.select().from(schema.business).where(eq(schema.business.id, 1))
      assert.equal(business.nextInvoiceNumber, 8)
    } finally {
      cleanup()
    }
  })

  test(`Invoice editing rejects ${overflowCase.name} and preserves the saved invoice and items`, async () => {
    const { dbClient, cleanup } = await createTestDb()
    try {
      await seedClient(dbClient)
      const created = await createInvoice({
        clientId: 1,
        items: [{ description: 'Original item', quantity: 1, unitPrice: 100 }],
        taxRate: 7.5,
      }, { dbClient })
      const originalItems = await dbClient.select().from(schema.invoiceItems)

      await assert.rejects(
        updateInvoice(created.id, { items: overflowCase.items, taxRate: overflowCase.taxRate }, { dbClient }),
        (err) => err.status === 400 && /limit|large|finite|overflow/i.test(err.message)
      )
      const [unchanged] = await dbClient.select().from(schema.invoices).where(eq(schema.invoices.id, created.id))
      assert.deepEqual(unchanged, created)
      assert.deepEqual(await dbClient.select().from(schema.invoiceItems), originalItems)
    } finally {
      cleanup()
    }
  })
}
