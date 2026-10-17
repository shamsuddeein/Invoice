import test from 'node:test'
import assert from 'node:assert/strict'
import { eq } from 'drizzle-orm'
import { createTestDb } from './test-db.mjs'
import * as schema from '../lib/schema.js'
import { createInvoice } from '../app/api/invoices/route.js'

test('Issue 1: Invoice creation successfully inserts items without ReferenceError: computed is not defined', async () => {
  const { dbClient, cleanup } = await createTestDb()

  try {
    await dbClient.insert(schema.clients).values({
      id: 1,
      name: 'Client Alpha',
      createdAt: '2026-01-01T00:00:00Z',
    })

    const body = {
      clientId: 1,
      issueDate: '2026-01-01',
      taxRate: 7.5,
      items: [
        { description: 'Dev consulting', quantity: 2, unitPrice: 150 },
        { description: 'Design review', quantity: 1, unitPrice: 50 },
      ],
      notes: 'Payment due on receipt',
    }

    const created = await createInvoice(body, { dbClient })
    assert.ok(created.id, 'Invoice must be returned with an id')
    assert.equal(created.subtotal, 350)
    assert.equal(created.taxRate, 7.5)
    assert.equal(created.taxAmount, 26.25)
    assert.equal(created.totalAmount, 376.25)
    assert.equal(created.balanceDue, 376.25)

    // Verify items were actually inserted in the database
    const items = await dbClient
      .select()
      .from(schema.invoiceItems)
      .where(eq(schema.invoiceItems.invoiceId, created.id))

    assert.equal(items.length, 2)
    assert.equal(items[0].description, 'Dev consulting')
    assert.equal(items[0].quantity, 2)
    assert.equal(items[0].unitPrice, 150)
    assert.equal(items[0].lineTotal, 300)

    assert.equal(items[1].description, 'Design review')
    assert.equal(items[1].quantity, 1)
    assert.equal(items[1].unitPrice, 50)
    assert.equal(items[1].lineTotal, 50)
  } finally {
    cleanup()
  }
})

test('Issue 1: Invoice creation rejects negative tax rate', async () => {
  const { dbClient, cleanup } = await createTestDb()

  try {
    await dbClient.insert(schema.clients).values({
      id: 1,
      name: 'Client Alpha',
      createdAt: '2026-01-01T00:00:00Z',
    })

    await assert.rejects(
      async () => {
        await createInvoice(
          {
            clientId: 1,
            taxRate: -10,
            items: [{ description: 'Dev consulting', quantity: 1, unitPrice: 100 }],
          },
          { dbClient }
        )
      },
      (err) => {
        assert.equal(err.status, 400)
        assert.equal(err.message, 'Tax rate must be a valid non-negative number.')
        return true
      }
    )
  } finally {
    cleanup()
  }
})

test('Issue 1: Invoice creation rejects non-finite 1e309 quantity and price', async () => {
  const { dbClient, cleanup } = await createTestDb()

  try {
    await dbClient.insert(schema.clients).values({
      id: 1,
      name: 'Client Alpha',
      createdAt: '2026-01-01T00:00:00Z',
    })

    await assert.rejects(
      async () => {
        await createInvoice(
          {
            clientId: 1,
            items: [{ description: 'Overflow', quantity: '1e309', unitPrice: 100 }],
          },
          { dbClient }
        )
      },
      (err) => {
        assert.equal(err.status, 400)
        assert.equal(err.message, 'Line 1: Quantity must be a valid non-negative number.')
        return true
      }
    )
  } finally {
    cleanup()
  }
})
