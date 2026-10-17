import test from 'node:test'
import assert from 'node:assert/strict'
import { eq } from 'drizzle-orm'
import { createTestDb } from './test-db.mjs'
import * as schema from '../lib/schema.js'
import { receiptStanding } from '../lib/utils.js'
import { invoiceStamp, DOC } from '../components/invoice-doc/theme.js'
import { recordPayment, voidPayment } from '../app/api/payments/[invoiceId]/route.js'

// Regression test for Issue 6: A positive one-kobo balance is treated as paid
test('Issue 6: One-kobo underpayment keeps invoice partially paid and payable', async () => {
  const { dbClient, cleanup } = await createTestDb()

  try {
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
      updatedAt: '2026-01-01T00:00:00Z',
    })

    // Call ACTUAL payment handler
    const payment = await recordPayment(
      1,
      { amountPaid: 99.99, paymentMethod: 'transfer', paymentDate: '2026-01-01' },
      { dbClient }
    )

    const [invoice] = await dbClient.select().from(schema.invoices).where(eq(schema.invoices.id, 1))

    assert.equal(invoice.amountPaid, 99.99)
    assert.equal(invoice.balanceDue, 0.01, 'A ₦0.01 balance must remain stored')
    assert.equal(invoice.status, 'partially_paid', 'A ₦0.01 balance must NOT mark invoice as paid')

    // UI canPay logic: canPay = (balanceDue > 0)
    const canPay = invoice.balanceDue > 0
    assert.equal(canPay, true, 'Remaining 1 kobo must remain payable in the UI')

    // Document stamp logic: must not show PAID stamp
    const stamp = invoiceStamp(invoice)
    assert.equal(stamp, null, 'Must not stamp PAID when ₦0.01 is still owed')

    // Receipt standing logic
    const standing = receiptStanding(invoice, payment)
    assert.equal(standing.balanceAsOf, 0.01)
    assert.equal(standing.paidInFull, false, 'Receipt must not show PAID IN FULL')
  } finally {
    cleanup()
  }
})

test('Issue 6: Final 1-kobo settlement marks invoice paid and stamped', async () => {
  const { dbClient, cleanup } = await createTestDb()

  try {
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
      status: 'partially_paid',
      subtotal: 100,
      totalAmount: 100,
      amountPaid: 99.99,
      balanceDue: 0.01,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    })

    await dbClient.insert(schema.payments).values({
      id: 1,
      invoiceId: 1,
      receiptNumber: 'RCPT-2026-001',
      amountPaid: 99.99,
      paymentDate: '2026-01-01',
      paymentMethod: 'transfer',
      invoiceTotalSnapshot: 100,
      paidThroughSnapshot: 99.99,
      balanceSnapshot: 0.01,
      createdAt: '2026-01-01T00:00:00Z',
    })

    // Initialize the business row so nextReceiptNumber is 2
    await dbClient.insert(schema.business).values({ id: 1, nextReceiptNumber: 2, updatedAt: '2026-01-01T00:00:00Z' })

    // Call ACTUAL payment handler for the final 1 kobo
    const payment2 = await recordPayment(
      1,
      { amountPaid: 0.01, paymentMethod: 'transfer', paymentDate: '2026-01-02' },
      { dbClient }
    )

    const [invoice] = await dbClient.select().from(schema.invoices).where(eq(schema.invoices.id, 1))

    assert.equal(invoice.amountPaid, 100)
    assert.equal(invoice.balanceDue, 0)
    assert.equal(invoice.status, 'paid', 'Invoice is paid when balance is exactly 0')

    const canPay = invoice.balanceDue > 0
    assert.equal(canPay, false, 'No further payments can be recorded')

    const stamp = invoiceStamp(invoice)
    assert.deepEqual(stamp, { label: 'PAID', color: DOC.paid })

    const standing = receiptStanding(invoice, payment2)
    assert.equal(standing.balanceAsOf, 0)
    assert.equal(standing.paidInFull, true, 'Receipt shows PAID IN FULL upon exact settlement')
  } finally {
    cleanup()
  }
})

test('Issue 6: Voiding final 1-kobo payment reverts balance and status', async () => {
  const { dbClient, cleanup } = await createTestDb()

  try {
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
      status: 'paid',
      subtotal: 100,
      totalAmount: 100,
      amountPaid: 100,
      balanceDue: 0,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    })

    await dbClient.insert(schema.payments).values([
      {
        id: 1,
        invoiceId: 1,
        receiptNumber: 'RCPT-2026-001',
        amountPaid: 99.99,
        paymentDate: '2026-01-01',
        paymentMethod: 'transfer',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 2,
        invoiceId: 1,
        receiptNumber: 'RCPT-2026-002',
        amountPaid: 0.01,
        paymentDate: '2026-01-02',
        paymentMethod: 'transfer',
        createdAt: '2026-01-02T00:00:00Z',
      },
    ])

    // Call ACTUAL voidPayment handler
    const voidResult = await voidPayment(1, 2, { dbClient })
    assert.equal(voidResult.ok, true)

    const [invoice] = await dbClient.select().from(schema.invoices).where(eq(schema.invoices.id, 1))

    assert.equal(invoice.amountPaid, 99.99)
    assert.equal(invoice.balanceDue, 0.01)
    assert.equal(invoice.status, 'partially_paid', 'Reverts to partially_paid when 1 kobo reopened')
    assert.equal(invoice.balanceDue > 0, true, 'Reopened 1 kobo is payable again')
  } finally {
    cleanup()
  }
})
