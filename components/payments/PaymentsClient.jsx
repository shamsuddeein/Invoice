'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import { PaymentsIcon, SearchIcon, XIcon } from '@/components/ui/icons'
import { formatNaira, formatDate } from '@/lib/utils'
import { PAYMENT_METHOD_LABELS } from '@/lib/constants'

// Client island for the payments ledger. First paint is server-rendered from
// `initial` (no mount fetch, no spinner). Payments are read-only here — no
// delete/refresh — so this island only owns search + the total.
export default function PaymentsClient({ initial, initialError = '' }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const payments = initial
  const error = initialError

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return payments
    return payments.filter((p) =>
      [p.receiptNumber, p.invoiceNumber, p.clientName].some((v) => (v || '').toLowerCase().includes(q))
    )
  }, [payments, search])

  const totalCollected = useMemo(
    () => filtered.reduce((sum, p) => sum + (p.amountPaid || 0), 0),
    [filtered]
  )

  return (
    <div>
      <PageHeader title="Payments" subtitle="Every payment you've received" />

      {error ? (
        <div
          className="text-sm text-error"
          style={{ background: 'var(--error-muted)', padding: '10px 14px', borderRadius: 'var(--r-md)' }}
        >
          {error}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg">
          <EmptyState
            icon={PaymentsIcon}
            title="No payments yet"
            description="Payments you record against invoices will appear here."
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="relative max-w-xs w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                <SearchIcon size={16} />
              </span>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search receipt, invoice or client…"
                className="pl-9 pr-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-hover"
                  style={{ width: 28, height: 28 }}
                >
                  <XIcon size={15} />
                </button>
              )}
            </div>
            <div className="text-sm text-text-secondary">
              Total collected <span className="amount ml-2">{formatNaira(totalCollected)}</span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-surface border border-border rounded-lg">
              <EmptyState icon={SearchIcon} title="No matches" description={`No payments match “${search}”.`} />
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-lg overflow-x-auto">
              <table className="table min-w-[720px]">
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Invoice</th>
                    <th>Method</th>
                    <th className="col-amount">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/invoices/${p.invoiceId}`)}
                    >
                      <td className="mono font-medium">{p.receiptNumber}</td>
                      <td className="text-text-secondary">{formatDate(p.paymentDate)}</td>
                      <td>{p.clientName || '—'}</td>
                      <td className="mono text-text-secondary">{p.invoiceNumber || '—'}</td>
                      <td>{PAYMENT_METHOD_LABELS[p.paymentMethod] || p.paymentMethod}</td>
                      <td className="col-amount">{formatNaira(p.amountPaid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
