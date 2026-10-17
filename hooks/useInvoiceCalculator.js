import { useMemo } from 'react'
import { calculateInvoiceTotals } from '@/lib/invoice-calc'

// Single source of truth for invoice math (used by the form's live totals and
// mirrored server-side on save). lineTotal = qty × unitPrice; tax is a percent
// of subtotal. Every figure is rounded to 2dp so the live preview matches what
// the server stores exactly.
export function useInvoiceCalculator(items, taxRate = 0) {
  return useMemo(() => {
    return calculateInvoiceTotals(items, taxRate)
  }, [items, taxRate])
}

export default useInvoiceCalculator
