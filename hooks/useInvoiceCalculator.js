import { useMemo } from 'react'
import { round2 } from '@/lib/utils'

// Single source of truth for invoice math (used by the form's live totals and
// mirrored server-side on save). lineTotal = qty × unitPrice; tax is a percent
// of subtotal. Every figure is rounded to 2dp so the live preview matches what
// the server stores exactly (see round2 in lib/utils).
export function useInvoiceCalculator(items, taxRate = 0) {
  return useMemo(() => {
    const rate = Number(taxRate) || 0
    const computed = (items || []).map((it) => {
      const quantity = Number(it.quantity) || 0
      const unitPrice = Number(it.unitPrice) || 0
      return { ...it, lineTotal: round2(quantity * unitPrice) }
    })
    const subtotal = round2(computed.reduce((sum, it) => sum + it.lineTotal, 0))
    const taxAmount = round2(subtotal * (rate / 100))
    const totalAmount = round2(subtotal + taxAmount)
    return { items: computed, subtotal, taxAmount, totalAmount, taxRate: rate }
  }, [items, taxRate])
}

export default useInvoiceCalculator
