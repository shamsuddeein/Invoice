'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import { InvoiceIcon, PlusIcon } from '@/components/ui/icons'
import { formatNaira, formatDate } from '@/lib/utils'

// The five newest invoices. Status is the only colour in the row (UI Rule 5),
// totals are right-aligned mono (UI Rule 6), rows link to the detail.
export default function RecentInvoices({ invoices = [] }) {
  const router = useRouter()

  return (
    <section className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="t-h3">Recent invoices</h2>
        <Link href="/invoices" className="text-sm font-medium" style={{ color: 'var(--accent-dark)' }}>
          View all
        </Link>
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={InvoiceIcon}
          title="No invoices yet"
          description="Create your first invoice to see it here."
          action={
            <Link href="/invoices/new">
              <Button variant="secondary">
                <PlusIcon size={16} />
                New invoice
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="table min-w-[600px]">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Client</th>
              <th>Issued</th>
              <th>Status</th>
              <th className="col-amount">Total</th>
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
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </section>
  )
}
