'use client'

import { DownloadIcon } from '@/components/ui/icons'
import { formatNaira, formatDate } from '@/lib/utils'
import { PAYMENT_METHOD_LABELS } from '@/lib/constants'

// Payments recorded against an invoice. Each row opens its branded receipt
// (download handled by the parent's receipt modal).
export default function PaymentHistory({ payments = [], onViewReceipt }) {
  if (payments.length === 0) {
    return <p className="text-sm text-text-muted">No payments recorded yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="table min-w-[520px]">
        <thead>
          <tr>
            <th>Receipt</th>
            <th>Date</th>
            <th>Method</th>
            <th className="col-amount">Amount</th>
            <th className="col-actions">Receipt</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td className="mono font-medium">{p.receiptNumber}</td>
              <td className="text-text-secondary">{formatDate(p.paymentDate)}</td>
              <td>{PAYMENT_METHOD_LABELS[p.paymentMethod] || p.paymentMethod}</td>
              <td className="col-amount">{formatNaira(p.amountPaid)}</td>
              <td className="col-actions">
                <button
                  className="icon-btn"
                  onClick={() => onViewReceipt(p)}
                  aria-label={`Receipt ${p.receiptNumber}`}
                  title="View / download receipt"
                >
                  <DownloadIcon size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
