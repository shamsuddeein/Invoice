'use client'

import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/ui/StatusBadge'
import { EyeIcon, EditIcon, TrashIcon } from '@/components/ui/icons'
import { formatNaira, formatDate } from '@/lib/utils'

// Invoice list table. Amounts right-aligned in mono (UI Rules 6 & 11); status is
// the only color in the row (UI Rule 5); whole row is clickable to the detail.
export default function InvoiceTable({ invoices, onDelete }) {
  const router = useRouter()

  return (
    <div className="bg-surface border border-border rounded-lg overflow-x-auto">
      <table className="table min-w-[880px]">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Client</th>
            <th>Issued</th>
            <th>Status</th>
            <th className="col-amount">Total</th>
            <th className="col-amount">Balance</th>
            <th className="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr
              key={inv.id}
              className="cursor-pointer"
              onClick={() => router.push(`/invoices/${inv.id}`)}
            >
              <td className="mono font-medium">{inv.invoiceNumber}</td>
              <td>{inv.clientName || '—'}</td>
              <td className="text-text-secondary">{formatDate(inv.issueDate)}</td>
              <td>
                <StatusBadge status={inv.status} />
              </td>
              <td className="col-amount">{formatNaira(inv.totalAmount)}</td>
              <td className="col-amount">{formatNaira(inv.balanceDue)}</td>
              <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1">
                  <button
                    className="icon-btn"
                    onClick={() => router.push(`/invoices/${inv.id}`)}
                    aria-label={`View ${inv.invoiceNumber}`}
                    title="View"
                  >
                    <EyeIcon size={16} />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => router.push(`/invoices/${inv.id}/edit`)}
                    aria-label={`Edit ${inv.invoiceNumber}`}
                    title="Edit"
                  >
                    <EditIcon size={16} />
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() => onDelete(inv)}
                    aria-label={`Delete ${inv.invoiceNumber}`}
                    title="Delete"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
