import { formatNaira } from '@/lib/utils'

// Subtotal / tax / total summary. Amounts right-aligned in DM Mono (UI Rules 6 & 11);
// the grand total is the only emphasized figure.
export default function InvoiceTotalsPanel({ subtotal, taxRate, taxAmount, totalAmount }) {
  return (
    <div className="w-full md:max-w-xs md:ml-auto">
      <dl className="space-y-2">
        <div className="flex justify-between items-baseline">
          <dt className="t-secondary text-sm">Subtotal</dt>
          <dd className="amount">{formatNaira(subtotal)}</dd>
        </div>
        <div className="flex justify-between items-baseline">
          <dt className="t-secondary text-sm">
            Tax{taxRate ? ` (${taxRate}%)` : ''}
          </dt>
          <dd className="amount">{formatNaira(taxAmount)}</dd>
        </div>
        <div className="flex justify-between items-baseline pt-2 border-t border-border-strong">
          <dt className="t-h3">Total</dt>
          <dd className="amount-lg text-accent-dark">{formatNaira(totalAmount)}</dd>
        </div>
      </dl>
    </div>
  )
}
