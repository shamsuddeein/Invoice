'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/layout/PageHeader'
import BackLink from '@/components/ui/BackLink'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import StatusBadge from '@/components/ui/StatusBadge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import CopyButton from '@/components/ui/CopyButton'
import { EditIcon, TrashIcon, CheckIcon, PlusIcon } from '@/components/ui/icons'
import InvoicePreview from '@/components/invoice-doc/InvoicePreview'
import ReceiptPreview from '@/components/invoice-doc/ReceiptPreview'
import DocumentActions from '@/components/invoice-doc/DocumentActions'
import PaymentForm from '@/components/payments/PaymentForm'
import PaymentHistory from '@/components/payments/PaymentHistory'
import { jsonFetch } from '@/lib/fetcher'
import { formatNaira } from '@/lib/utils'

export default function InvoiceDetailPage({ params }) {
  const router = useRouter()
  const { id } = params

  const [invoice, setInvoice] = useState(null)
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [statusBusy, setStatusBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const [payOpen, setPayOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  const [receipt, setReceipt] = useState(null) // payment being viewed

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function load() {
    try {
      const [inv, biz] = await Promise.all([
        jsonFetch(`/api/invoices/${id}`),
        jsonFetch('/api/business'),
      ])
      setInvoice(inv)
      setBusiness(biz)
      setLoadError('')
    } catch (e) {
      setLoadError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function setStatus(status) {
    setStatusBusy(true)
    setActionError('')
    try {
      await jsonFetch(`/api/invoices/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      await load()
    } catch (e) {
      setActionError(e.message)
    } finally {
      setStatusBusy(false)
    }
  }

  async function recordPayment(values) {
    setPaying(true)
    setPayError('')
    try {
      await jsonFetch(`/api/payments/${id}`, { method: 'POST', body: JSON.stringify(values) })
      setPayOpen(false)
      await load()
    } catch (e) {
      setPayError(e.message)
    } finally {
      setPaying(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      await jsonFetch(`/api/invoices/${id}`, { method: 'DELETE' })
      router.push('/invoices')
    } catch (e) {
      setDeleteError(e.message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Invoice" breadcrumb={<BackLink href="/invoices">Back to invoices</BackLink>} />
        <div className="flex justify-center py-24 text-text-muted">
          <LoadingSpinner size={24} />
        </div>
      </div>
    )
  }

  if (loadError || !invoice) {
    return (
      <div>
        <PageHeader title="Invoice" breadcrumb={<BackLink href="/invoices">Back to invoices</BackLink>} />
        <div
          className="text-sm text-error"
          style={{ background: 'var(--error-muted)', padding: '10px 14px', borderRadius: 'var(--r-md)' }}
        >
          {loadError || 'Invoice not found.'}
        </div>
      </div>
    )
  }

  const payments = invoice.payments || []
  const canPay = (invoice.balanceDue || 0) > 0.01

  return (
    <div>
      <PageHeader
        title={invoice.invoiceNumber}
        titleAdornment={<CopyButton value={invoice.invoiceNumber} label="Copy invoice number" />}
        breadcrumb={<BackLink href="/invoices">Back to invoices</BackLink>}
        actions={
          <>
            {canPay && (
              <Button variant="primary" onClick={() => { setPayError(''); setPayOpen(true) }}>
                <PlusIcon size={16} />
                Record payment
              </Button>
            )}
            {invoice.status === 'draft' && (
              <Button variant="secondary" onClick={() => setStatus('sent')} loading={statusBusy}>
                <CheckIcon size={16} />
                Mark as sent
              </Button>
            )}
            <Link href={`/invoices/${id}/edit`}>
              <Button variant="secondary">
                <EditIcon size={16} />
                Edit
              </Button>
            </Link>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              <TrashIcon size={16} />
              Delete
            </Button>
          </>
        }
      />

      {actionError && (
        <div
          className="text-sm text-error mb-4"
          style={{ background: 'var(--error-muted)', padding: '10px 14px', borderRadius: 'var(--r-md)' }}
        >
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branded document (PNG/PDF capture source) */}
        <div className="lg:col-span-2">
          <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
            <InvoicePreview business={business} invoice={invoice} />
          </div>
        </div>

        {/* Actions + summary + payments */}
        <div className="lg:col-span-1 space-y-6">
          <section className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="t-h3">Status</h2>
              <StatusBadge status={invoice.status} />
            </div>
            <dl className="space-y-3">
              <div className="flex justify-between items-baseline">
                <dt className="t-secondary text-sm">Total</dt>
                <dd className="amount">{formatNaira(invoice.totalAmount)}</dd>
              </div>
              <div className="flex justify-between items-baseline">
                <dt className="t-secondary text-sm">Paid</dt>
                <dd className="amount text-success">{formatNaira(invoice.amountPaid)}</dd>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-border-strong">
                <dt className="t-h3">Balance due</dt>
                <dd className="amount-lg">{formatNaira(invoice.balanceDue)}</dd>
              </div>
            </dl>
          </section>

          <section className="card">
            <h2 className="t-h3 mb-3">Download</h2>
            <DocumentActions
              kind="invoice"
              targetId="invoice-preview"
              fileBase={invoice.invoiceNumber}
              business={business}
              invoice={invoice}
            />
          </section>

          <section className="card">
            <h2 className="t-h3 mb-3">Payments</h2>
            {payments.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-text-muted">No payments recorded yet.</p>
                {canPay && (
                  <Button variant="secondary" onClick={() => { setPayError(''); setPayOpen(true) }}>
                    <PlusIcon size={16} />
                    Record payment
                  </Button>
                )}
              </div>
            ) : (
              <PaymentHistory payments={payments} onViewReceipt={setReceipt} />
            )}
          </section>
        </div>
      </div>

      {/* Record payment modal */}
      <Modal
        open={payOpen}
        onClose={paying ? undefined : () => setPayOpen(false)}
        title="Record payment"
        width={560}
      >
        <PaymentForm
          balanceDue={invoice.balanceDue}
          onSubmit={recordPayment}
          onCancel={() => setPayOpen(false)}
          submitting={paying}
          error={payError}
        />
      </Modal>

      {/* Receipt modal */}
      <Modal
        open={!!receipt}
        onClose={() => setReceipt(null)}
        title={receipt ? `Receipt ${receipt.receiptNumber}` : 'Receipt'}
        titleAdornment={receipt && <CopyButton value={receipt.receiptNumber} label="Copy receipt number" />}
        width={800}
        footer={
          receipt && (
            <DocumentActions
              kind="receipt"
              targetId="receipt-preview"
              fileBase={receipt.receiptNumber}
              business={business}
              invoice={invoice}
              payment={receipt}
            />
          )
        }
      >
        {receipt && (
          <div className="overflow-x-auto rounded-lg border border-border bg-white">
            <ReceiptPreview business={business} invoice={invoice} payment={receipt} />
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false)
          setDeleteError('')
        }}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete invoice?"
        message={
          <>
            {`This permanently deletes ${invoice.invoiceNumber} and any recorded payments. This cannot be undone.`}
            {(invoice.amountPaid || 0) > 0 && (
              <span className="block mt-2 font-medium text-text-primary">
                {`${formatNaira(invoice.amountPaid)} in recorded payments will be deleted with it.`}
              </span>
            )}
            {deleteError && <span className="block text-error mt-2">{deleteError}</span>}
          </>
        }
      />
    </div>
  )
}
