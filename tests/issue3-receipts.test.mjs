import test from 'node:test'
import assert from 'node:assert/strict'
import { receiptStanding, round2 } from '../lib/utils.js'

// Regression test for Issue 3: Previously issued receipts change retroactively
test('Issue 3: Receipt financial snapshot remains immutable after backdated payments and invoice edits', () => {
  // Invoice initially at ₦100
  const invoice = {
    id: 1,
    invoiceNumber: 'INV-2026-001',
    totalAmount: 100,
    amountPaid: 40,
    balanceDue: 60,
    payments: [],
  }

  // Payment 1: ₦40 recorded on 2026-01-10
  const payment1 = {
    id: 1,
    invoiceId: 1,
    receiptNumber: 'RCPT-2026-001',
    amountPaid: 40,
    paymentDate: '2026-01-10',
    invoiceTotalSnapshot: 100,
    paidThroughSnapshot: 40,
    balanceSnapshot: 60,
  }
  invoice.payments.push(payment1)

  // Verify initial receipt standing
  const standingInitial = receiptStanding(invoice, payment1)
  assert.equal(standingInitial.invoiceTotal, 100)
  assert.equal(standingInitial.paidThrough, 40)
  assert.equal(standingInitial.balanceAsOf, 60)
  assert.equal(standingInitial.paidInFull, false)
  assert.equal(standingInitial.isSnapshot, true)

  // Mutation A: Recording a later payment of ₦20 with an EARLIER paymentDate (2026-01-05)
  const payment2Backdated = {
    id: 2,
    invoiceId: 1,
    receiptNumber: 'RCPT-2026-002',
    amountPaid: 20,
    paymentDate: '2026-01-05',
    invoiceTotalSnapshot: 100,
    paidThroughSnapshot: 60,
    balanceSnapshot: 40,
  }
  // Insert at beginning of invoice payments list (sorted by paymentDate)
  invoice.payments.unshift(payment2Backdated)
  invoice.amountPaid = 60
  invoice.balanceDue = 40

  // The original payment1 receipt MUST NOT change retroactively!
  const standingAfterBackdated = receiptStanding(invoice, payment1)
  assert.equal(
    standingAfterBackdated.invoiceTotal,
    100,
    'Original receipt invoice total must not change'
  )
  assert.equal(
    standingAfterBackdated.paidThrough,
    40,
    'Original receipt paidThrough must remain 40, not become 60'
  )
  assert.equal(
    standingAfterBackdated.balanceAsOf,
    60,
    'Original receipt balanceAsOf must remain 60, not become 40'
  )

  // Mutation B: Invoice total is edited from ₦100 to ₦200
  invoice.totalAmount = 200
  invoice.balanceDue = 140

  // The original payment1 receipt figures still remain exactly as issued!
  const standingAfterInvoiceEdit = receiptStanding(invoice, payment1)
  assert.equal(
    standingAfterInvoiceEdit.invoiceTotal,
    100,
    'Original receipt invoice total must remain 100, not 200'
  )
  assert.equal(
    standingAfterInvoiceEdit.paidThrough,
    40,
    'Original receipt paidThrough must remain 40'
  )
  assert.equal(
    standingAfterInvoiceEdit.balanceAsOf,
    60,
    'Original receipt balanceAsOf must remain 60'
  )

  // Mutation C: Voiding payment2
  invoice.payments = invoice.payments.filter((p) => p.id !== 2)
  invoice.amountPaid = 40
  invoice.balanceDue = 160

  const standingAfterVoid = receiptStanding(invoice, payment1)
  assert.equal(standingAfterVoid.invoiceTotal, 100)
  assert.equal(standingAfterVoid.paidThrough, 40)
  assert.equal(standingAfterVoid.balanceAsOf, 60)
})

test('Issue 3: Fallback calculation for legacy payments without stored snapshots', () => {
  const invoice = {
    id: 1,
    totalAmount: 150,
    amountPaid: 150,
    balanceDue: 0,
    payments: [
      { id: 10, amountPaid: 50, paymentDate: '2026-01-01' },
      { id: 11, amountPaid: 100, paymentDate: '2026-01-02' },
    ],
  }

  // Legacy payment without snapshot columns
  const legacyPayment1 = invoice.payments[0]
  const standing1 = receiptStanding(invoice, legacyPayment1)
  assert.equal(standing1.isSnapshot, false)
  assert.equal(standing1.paidThrough, 50)
  assert.equal(standing1.balanceAsOf, 100)
  assert.equal(standing1.paidInFull, false)

  const legacyPayment2 = invoice.payments[1]
  const standing2 = receiptStanding(invoice, legacyPayment2)
  assert.equal(standing2.isSnapshot, false)
  assert.equal(standing2.paidThrough, 150)
  assert.equal(standing2.balanceAsOf, 0)
  assert.equal(standing2.paidInFull, true)
})
