import { round2 } from './utils.js'

function isItemObject(item) {
  return item !== null && typeof item === 'object' && !Array.isArray(item)
}

function inputNumber(value) {
  if (value == null || value === '') return 0
  if (typeof value !== 'number' && typeof value !== 'string') return NaN
  return Number(value)
}

/**
 * Validates invoice line items for consistency between preview, submission, and server processing.
 * - Flags incomplete priced rows (price or amount set without a description).
 * - Rejects invalid, infinite, or negative quantities or prices.
 * - Ignores completely blank, unpriced rows.
 */
export function validateInvoiceItems(rawItems) {
  if (!Array.isArray(rawItems)) {
    return { error: 'Items must be an array.' }
  }
  if (rawItems.length > 500) {
    return { error: 'Too many line items (max 500).' }
  }

  const items = []
  for (let i = 0; i < rawItems.length; i++) {
    const it = rawItems[i]
    if (!isItemObject(it)) {
      return { error: `Line ${i + 1}: Item must be an object.` }
    }
    const desc = String(it.description || '').trim()
    const rawQty = it.quantity
    const rawPrice = it.unitPrice
    const qtyNum = inputNumber(rawQty)
    const priceNum = inputNumber(rawPrice)

    if (!Number.isFinite(qtyNum) || qtyNum < 0) {
      return { error: `Line ${i + 1}: Quantity must be a valid non-negative number.` }
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return { error: `Line ${i + 1}: Unit price must be a valid non-negative number.` }
    }

    // Ignore untouched rows, but never hide an explicit invalid numeric value.
    const isBlank = !desc && (rawPrice === '' || rawPrice == null || priceNum === 0)
    if (isBlank) continue

    if (rawQty === '' || rawQty == null) {
      return { error: `Line ${i + 1}: Quantity must be a valid non-negative number.` }
    }
    if (rawPrice === '' || rawPrice == null) {
      return { error: `Line ${i + 1}: Unit price must be a valid non-negative number.` }
    }
    if (!desc) {
      return { error: `Line ${i + 1}: Description is required for priced items.` }
    }

    const lineTotal = round2(qtyNum * priceNum)
    if (!Number.isFinite(lineTotal)) {
      return { error: `Line ${i + 1}: Line total exceeds valid numerical limits.` }
    }

    items.push({
      description: desc.slice(0, 500),
      quantity: qtyNum,
      unitPrice: priceNum,
      lineTotal,
    })
  }

  if (items.length === 0) {
    return { error: 'Add at least one line item with a description.' }
  }

  return { items }
}

/**
 * Validates tax rate.
 * - Must be a valid non-negative finite number.
 * - Cannot exceed 100%.
 */
export function validateTaxRate(rawTaxRate) {
  if (rawTaxRate === '' || rawTaxRate == null) {
    return { taxRate: 0 }
  }
  const rateNum = inputNumber(rawTaxRate)
  if (!Number.isFinite(rateNum) || rateNum < 0) {
    return { error: 'Tax rate must be a valid non-negative number.' }
  }
  if (rateNum > 100) {
    return { error: 'Tax rate cannot exceed 100%.' }
  }
  return { taxRate: round2(rateNum) }
}

/**
 * Consistent calculator for invoice math across preview, form submission, and server updates.
 */
export function calculateInvoiceTotals(items, taxRate = 0) {
  const taxValidation = validateTaxRate(taxRate)
  const rate = taxValidation.taxRate ?? 0
  const fail = (error) => ({
    error,
    items: [],
    subtotal: null,
    taxAmount: null,
    totalAmount: null,
    taxRate: rate,
  })

  if (taxValidation.error) return fail(taxValidation.error)
  if (!Array.isArray(items)) return fail('Items must be an array.')
  if (items.length > 500) return fail('Too many line items (max 500).')

  const computed = []
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    if (!isItemObject(it)) return fail(`Line ${i + 1}: Item must be an object.`)

    // Empty fields are allowed while editing; explicit invalid values are not.
    const quantity = inputNumber(it.quantity)
    const unitPrice = inputNumber(it.unitPrice)
    if (!Number.isFinite(quantity) || quantity < 0) {
      return fail(`Line ${i + 1}: Quantity must be a valid non-negative number.`)
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return fail(`Line ${i + 1}: Unit price must be a valid non-negative number.`)
    }

    const lineTotal = round2(quantity * unitPrice)
    if (!Number.isFinite(lineTotal)) {
      return fail(`Line ${i + 1}: Line total exceeds valid numerical limits.`)
    }
    computed.push({
      ...it,
      quantity,
      unitPrice,
      lineTotal,
    })
  }

  const subtotal = round2(computed.reduce((s, it) => s + it.lineTotal, 0))
  if (!Number.isFinite(subtotal)) return fail('Subtotal exceeds valid numerical limits.')
  const taxAmount = round2(subtotal * (rate / 100))
  if (!Number.isFinite(taxAmount)) return fail('Tax amount exceeds valid numerical limits.')
  const totalAmount = round2(subtotal + taxAmount)
  if (!Number.isFinite(totalAmount)) return fail('Invoice total exceeds valid numerical limits.')

  return {
    items: computed,
    subtotal,
    taxAmount,
    totalAmount,
    taxRate: rate,
  }
}
