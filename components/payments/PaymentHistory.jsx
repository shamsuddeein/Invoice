'use client'

import { DownloadIcon, TrashIcon } from '@/components/ui/icons'
import { formatNaira, formatDate } from '@/lib/utils'
import { PAYMENT_METHOD_LABELS } from '@/lib/constants'

// Payments recorded against an invoice. Each row opens its branded receipt
// (download handled by the parent's receipt modal). When `onVoid` is supplied,
// a row can also be voided (parent confirms + calls the DELETE endpoint).
export default function PaymentHistory({ payments = [], onViewReceipt, onVoid }) {
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
            <th className="col-actions">Actions</th>
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
                <div className="flex items-center justify-end gap-1">
                  <button
                    className="icon-btn"
                    onClick={() => onViewReceipt(p)}
                    aria-label={`Receipt ${p.receiptNumber}`}
                    title="View / download receipt"
                  >
                    <DownloadIcon size={16} />
                  </button>
                  {onVoid && (
                    <button
                      className="icon-btn danger"
                      onClick={() => onVoid(p)}
                      aria-label={`Void payment ${p.receiptNumber}`}
                      title="Void payment"
                    >
                      <TrashIcon size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
