import { useMemo } from 'react'

// Single source of truth for invoice math (used by the form's live totals and
// mirrored server-side on save). lineTotal = qty × unitPrice; tax is a percent
// of subtotal.
export function useInvoiceCalculator(items, taxRate = 0) {
  return useMemo(() => {
    const rate = Number(taxRate) || 0
    const computed = (items || []).map((it) => {
      const quantity = Number(it.quantity) || 0
      const unitPrice = Number(it.unitPrice) || 0
      return { ...it, lineTotal: quantity * unitPrice }
    })
    const subtotal = computed.reduce((sum, it) => sum + it.lineTotal, 0)
    const taxAmount = subtotal * (rate / 100)
    const totalAmount = subtotal + taxAmount
    return { items: computed, subtotal, taxAmount, totalAmount, taxRate: rate }
  }, [items, taxRate])
}

export default useInvoiceCalculator
