import test from 'node:test'
import assert from 'node:assert/strict'
import { eq } from 'drizzle-orm'
import { createTestDb } from './test-db.mjs'
import * as schema from '../lib/schema.js'
import { updateInvoice } from '../app/api/invoices/[id]/route.js'
import { updateInvoiceStatus, StatusError } from '../app/api/invoices/[id]/status/route.js'
import { recordPayment } from '../app/api/payments/[invoiceId]/route.js'

// Pause immediately before a transaction acquires its lock. If the operation
// regresses to reading outside the transaction, those reads have already happened
// when the competing payment commits. Also gate standalone UPDATE execution so a
// nontransactional status update reproduces the same stale-check window.
function pauseBeforeWrite(dbClient) {
  let signalPaused
  let resume
  const paused = new Promise((resolve) => { signalPaused = resolve })
  const resumed = new Promise((resolve) => { resume = resolve })

  async function waitForResume() {
    signalPaused()
    await resumed
  }

  function gateUpdate(query) {
    return new Proxy(query, {
      get(target, property) {
        if (property === 'then') {
          return (resolve, reject) => waitForResume().then(() => target).then(resolve, reject)
        }
        const value = Reflect.get(target, property)
        if (typeof value !== 'function') return value
        return (...args) => {
          const result = value.apply(target, args)
          return result && typeof result === 'object' ? gateUpdate(result) : result
        }
      },
    })
  }

  const gatedDb = new Proxy(dbClient, {
    get(target, property) {
      if (property === 'transaction') {
        return async (...args) => {
          await waitForResume()
          return target.transaction(...args)
        }
      }
      if (property === 'update') {
        return (...args) => gateUpdate(target.update(...args))
      }
      const value = Reflect.get(target, property)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })

  return { dbClient: gatedDb, paused, resume }
}

async function seedUnpaidInvoice(dbClient) {
  await dbClient.insert(schema.clients).values({
    id: 1,
    name: 'Client Alpha',
    createdAt: '2026-01-01T00:00:00Z',
  })
  await dbClient.insert(schema.invoices).values({
    id: 1,
    invoiceNumber: 'INV-2026-001',
    clientId: 1,
    issueDate: '2026-01-01',
    dueDate: '',
    status: 'sent',
    subtotal: 100,
    totalAmount: 100,
    amountPaid: 0,
    balanceDue: 100,
    createdAt: '2026-01-01T00:00:00Z',
  })
  await dbClient.insert(schema.invoiceItems).values({
    invoiceId: 1,
    description: 'Item 1',
    quantity: 1,
    unitPrice: 100,
    lineTotal: 100,
  })
}

async function commitPaymentWhilePaused(dbClient, operation) {
  const gate = pauseBeforeWrite(dbClient)
  const pending = operation(gate.dbClient)
  // Observe rejection immediately, including failures before the write boundary.
  const outcome = pending.then(
    (value) => ({ value }),
    (error) => ({ error })
  )
  try {
    await Promise.race([
      gate.paused,
      outcome.then(({ error }) => {
        throw error || new Error('Operation completed without reaching the write boundary.')
      }),
    ])
    const payment = await recordPayment(1, {
      amountPaid: 30,
      paymentDate: '2026-01-02',
      paymentMethod: 'transfer',
    }, { dbClient })
    assert.equal(payment.amountPaid, 30)
    const [invoice] = await dbClient.select().from(schema.invoices).where(eq(schema.invoices.id, 1))
    assert.equal(invoice.amountPaid, 30, 'Competing payment committed before the paused operation resumes')
    assert.equal(invoice.balanceDue, 70)
    assert.equal(invoice.status, 'partially_paid')
  } finally {
    gate.resume()
    await outcome
  }
  return pending
}

test('Issue 2: Payment commits during invoice edit without leaving a stale balance or status', { timeout: 10000 }, async () => {
  const { dbClient, cleanup } = await createTestDb()
  try {
    await seedUnpaidInvoice(dbClient)
    const result = await commitPaymentWhilePaused(dbClient, (gatedDb) => updateInvoice(1, {
      items: [{ description: 'Item Updated', quantity: 2, unitPrice: 100 }],
    }, { dbClient: gatedDb }))
    assert.equal(result.ok, true)

    const [invoice] = await dbClient.select().from(schema.invoices).where(eq(schema.invoices.id, 1))
    assert.equal(invoice.totalAmount, 200, 'Total should be 200')
    assert.equal(invoice.balanceDue, 170, 'Edit must include the payment committed while it was paused')
    assert.equal(invoice.amountPaid, 30, 'Amount paid must be 30 from the committed payment')
    assert.equal(invoice.status, 'partially_paid', 'Status must be partially_paid')
    const payments = await dbClient.select().from(schema.payments)
    assert.equal(payments.length, 1)
    assert.equal(payments[0].amountPaid, invoice.amountPaid)
  } finally {
    cleanup()
  }
})

test('Issue 2: Payment commits during status change and prevents overwriting its paid status', { timeout: 10000 }, async () => {
  const { dbClient, cleanup } = await createTestDb()
  try {
    await seedUnpaidInvoice(dbClient)
    await assert.rejects(
      commitPaymentWhilePaused(dbClient, (gatedDb) => updateInvoiceStatus(1, 'draft', { dbClient: gatedDb })),
      (err) => {
        assert.ok(err instanceof StatusError)
        assert.equal(err.message, 'This invoice has recorded payments and cannot be moved back to draft or sent.')
        assert.equal(err.status, 409)
        return true
      }
    )

    const [invoice] = await dbClient.select().from(schema.invoices).where(eq(schema.invoices.id, 1))
    assert.equal(invoice.status, 'partially_paid', 'Status was not overwritten to draft')
    assert.equal(invoice.amountPaid, 30)
    assert.equal(invoice.balanceDue, 70)
  } finally {
    cleanup()
  }
})
