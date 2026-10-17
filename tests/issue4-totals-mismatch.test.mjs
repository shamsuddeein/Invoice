import test from 'node:test'
import assert from 'node:assert/strict'
import { validateInvoiceItems, validateTaxRate, calculateInvoiceTotals } from '../lib/invoice-calc.js'

function assertCalculationError(result, error, taxRate = 0) {
  assert.deepEqual(result, {
    error,
    items: [],
    subtotal: null,
    taxAmount: null,
    totalAmount: null,
    taxRate,
  })
}

// Regression test for Issue 4: Invoice previews and saved totals disagree
test('Issue 4: validateInvoiceItems flags incomplete priced rows instead of silently dropping them', () => {
  const itemsWithBlankDescription = [
    { description: 'Valid service', quantity: 1, unitPrice: 100 },
    { description: '', quantity: 1, unitPrice: 50 }, // priced item with missing description
  ]

  const result = validateInvoiceItems(itemsWithBlankDescription)
  assert.equal(
    result.error,
    'Line 2: Description is required for priced items.',
    'Incomplete priced row must be flagged as an error, not silently dropped'
  )
})

test('Issue 4: validateInvoiceItems rejects negative quantity and negative unit price', () => {
  const negativeQty = [{ description: 'Test', quantity: -1, unitPrice: 100 }]
  const resQty = validateInvoiceItems(negativeQty)
  assert.equal(resQty.error, 'Line 1: Quantity must be a valid non-negative number.')

  const negativePrice = [{ description: 'Test', quantity: 2, unitPrice: -50 }]
  const resPrice = validateInvoiceItems(negativePrice)
  assert.equal(resPrice.error, 'Line 1: Unit price must be a valid non-negative number.')
})

test('Issue 4: validateInvoiceItems safely ignores completely blank unpriced rows', () => {
  const itemsWithBlankRow = [
    { description: 'Service 1', quantity: 1, unitPrice: 100 },
    { description: '', quantity: 1, unitPrice: '' }, // untouched blank row from "+ Add line"
  ]

  const result = validateInvoiceItems(itemsWithBlankRow)
  assert.equal(result.error, undefined)
  assert.equal(result.items.length, 1)
  assert.equal(result.items[0].description, 'Service 1')
  assert.equal(result.items[0].lineTotal, 100)
})

test('Issue 4: validateInvoiceItems rejects infinity and non-finite quantities or prices', () => {
  const infiniteQty = [{ description: 'Test', quantity: '1e309', unitPrice: 100 }]
  const resQty = validateInvoiceItems(infiniteQty)
  assert.equal(resQty.error, 'Line 1: Quantity must be a valid non-negative number.')

  const infinitePrice = [{ description: 'Test', quantity: 1, unitPrice: '1e309' }]
  const resPrice = validateInvoiceItems(infinitePrice)
  assert.equal(resPrice.error, 'Line 1: Unit price must be a valid non-negative number.')

  const overflowProduct = [{ description: 'Test', quantity: 1e200, unitPrice: 1e200 }]
  const resProduct = validateInvoiceItems(overflowProduct)
  assert.equal(resProduct.error, 'Line 1: Line total exceeds valid numerical limits.')
})

test('Issue 4 & 5: validateTaxRate rejects negative rates, infinity, and rates > 100', () => {
  // Valid rates
  assert.deepEqual(validateTaxRate(7.5), { taxRate: 7.5 })
  assert.deepEqual(validateTaxRate('0'), { taxRate: 0 })
  assert.deepEqual(validateTaxRate(null), { taxRate: 0 })
  assert.deepEqual(validateTaxRate(''), { taxRate: 0 })
  assert.deepEqual(validateTaxRate(100), { taxRate: 100 })

  // Negative rates must be rejected
  const resNeg = validateTaxRate(-5)
  assert.equal(resNeg.error, 'Tax rate must be a valid non-negative number.')

  const resNegString = validateTaxRate('-0.5')
  assert.equal(resNegString.error, 'Tax rate must be a valid non-negative number.')

  // Non-finite and overflow rates must be rejected
  const resInf = validateTaxRate('1e309')
  assert.equal(resInf.error, 'Tax rate must be a valid non-negative number.')

  const resNaN = validateTaxRate('invalid')
  assert.equal(resNaN.error, 'Tax rate must be a valid non-negative number.')

  // Rates > 100% must be rejected
  const resOver = validateTaxRate(101)
  assert.equal(resOver.error, 'Tax rate cannot exceed 100%.')
})

test('Issue 4: Preview and server calculations agree exactly for valid items', () => {
  const validItems = [
    { description: 'Item A', quantity: 2, unitPrice: 150 }, // 300
    { description: 'Item B', quantity: 1, unitPrice: 50 },  // 50
  ]
  const taxRate = 7.5

  const validation = validateInvoiceItems(validItems)
  assert.equal(validation.error, undefined)

  // Live preview calculator
  const preview = calculateInvoiceTotals(validItems, taxRate)

  // Server calculation
  const server = calculateInvoiceTotals(validation.items, taxRate)

  assert.equal(preview.subtotal, 350)
  assert.equal(server.subtotal, 350)

  assert.equal(preview.taxAmount, 26.25)
  assert.equal(server.taxAmount, 26.25)

  assert.equal(preview.totalAmount, 376.25)
  assert.equal(server.totalAmount, 376.25)
  assert.equal(preview.taxRate, 7.5)
  assert.equal(server.taxRate, 7.5)
})

test('Issue 4: Preview normalizes tax precision exactly as server validation does', () => {
  const items = [{ description: 'Service', quantity: 1, unitPrice: 1000 }]
  const rawTaxRate = '7.555'
  const validatedItems = validateInvoiceItems(items)
  const validatedTax = validateTaxRate(rawTaxRate)

  const preview = calculateInvoiceTotals(items, rawTaxRate)
  const saved = calculateInvoiceTotals(validatedItems.items, validatedTax.taxRate)

  assert.deepEqual(preview, saved)
  assert.equal(preview.error, undefined)
  assert.equal(preview.taxRate, 7.56)
  assert.equal(preview.taxAmount, 75.6)
  assert.equal(preview.totalAmount, 1075.6)
})

test('Issue 4: Overflowing sums and totals fail instead of becoming zero invoices', () => {
  const largeItem = { description: 'Large item', quantity: 1, unitPrice: 1e306 }
  const sumItems = validateInvoiceItems([largeItem, largeItem])
  assert.equal(sumItems.error, undefined, 'Each individual line is finite')
  assertCalculationError(
    calculateInvoiceTotals(sumItems.items, 0),
    'Subtotal exceeds valid numerical limits.'
  )

  const taxItems = validateInvoiceItems([largeItem])
  assert.equal(taxItems.error, undefined)
  assertCalculationError(
    calculateInvoiceTotals(taxItems.items, 100),
    'Invoice total exceeds valid numerical limits.',
    100
  )
})

test('Issue 4: Calculator preserves blank live inputs and ordinary fractional totals', () => {
  const result = calculateInvoiceTotals([
    { description: 'Fractional service', quantity: '3', unitPrice: '0.1' },
    { description: '', quantity: 1, unitPrice: '' },
    { description: '', quantity: '', unitPrice: '' },
  ], '7.5')

  assert.equal(result.error, undefined)
  assert.deepEqual(result.items.map((item) => item.lineTotal), [0.3, 0, 0])
  assert.equal(result.subtotal, 0.3)
  assert.equal(result.taxAmount, 0.02)
  assert.equal(result.totalAmount, 0.32)
  assert.deepEqual(calculateInvoiceTotals([], ''), {
    items: [], subtotal: 0, taxAmount: 0, totalAmount: 0, taxRate: 0,
  })
})

test('Issue 4: Invalid numeric inputs fail in both validation and calculation', () => {
  for (const value of [-1, Infinity, '1e309', NaN, 'invalid', {}, true]) {
    const badQuantity = [{ description: 'Service', quantity: value, unitPrice: 100 }]
    const badPrice = [{ description: 'Service', quantity: 1, unitPrice: value }]
    assert.match(validateInvoiceItems(badQuantity).error, /Quantity/)
    assert.match(validateInvoiceItems(badPrice).error, /Unit price/)
    assertCalculationError(
      calculateInvoiceTotals(badQuantity, 7.555),
      'Line 1: Quantity must be a valid non-negative number.',
      7.56
    )
    assertCalculationError(
      calculateInvoiceTotals(badPrice, 0),
      'Line 1: Unit price must be a valid non-negative number.'
    )
  }

  assertCalculationError(
    calculateInvoiceTotals([{ description: 'Overflow', quantity: 1e200, unitPrice: 1e200 }]),
    'Line 1: Line total exceeds valid numerical limits.'
  )

  const blankRowWithInvalidQuantity = [
    { description: 'Service', quantity: 1, unitPrice: 100 },
    { description: '', quantity: -1, unitPrice: '' },
  ]
  assert.match(validateInvoiceItems(blankRowWithInvalidQuantity).error, /Line 2: Quantity/)
})

test('Issue 4: Calculator returns invalid tax errors with empty financial results', () => {
  const items = [{ description: 'Service', quantity: 1, unitPrice: 100 }]
  for (const rate of [-1, Infinity, 'invalid', '1e309', 101, true, {}]) {
    const expectedError = validateTaxRate(rate).error
    assert.ok(expectedError)
    assertCalculationError(calculateInvoiceTotals(items, rate), expectedError)
  }
})

test('Issue 4: Malformed rows and item containers return validation errors without throwing', () => {
  for (const row of [null, undefined, [], 'item', 1, false]) {
    assert.deepEqual(validateInvoiceItems([row]), { error: 'Line 1: Item must be an object.' })
    assertCalculationError(
      calculateInvoiceTotals([row], 7.555),
      'Line 1: Item must be an object.',
      7.56
    )
  }
  for (const items of [null, undefined, {}, 'items']) {
    assert.deepEqual(validateInvoiceItems(items), { error: 'Items must be an array.' })
    assertCalculationError(calculateInvoiceTotals(items), 'Items must be an array.')
  }
})
