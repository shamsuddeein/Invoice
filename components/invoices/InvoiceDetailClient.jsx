'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/layout/PageHeader'
import BackLink from '@/components/ui/BackLink'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import StatusBadge from '@/components/ui/StatusBadge'
import CopyButton from '@/components/ui/CopyButton'
import { EditIcon, TrashIcon, CheckIcon, PlusIcon } from '@/components/ui/icons'
import InvoicePreview from '@/components/invoice-doc/InvoicePreview'
import ReceiptPreview from '@/components/invoice-doc/ReceiptPreview'
import DocumentActions from '@/components/invoice-doc/DocumentActions'
import PaymentForm from '@/components/payments/PaymentForm'
import PaymentHistory from '@/components/payments/PaymentHistory'
import { jsonFetch } from '@/lib/fetcher'
import { useToast } from '@/components/ui/Toast'
import { formatNaira } from '@/lib/utils'

// Client island for the invoice detail page. First paint is server-rendered from
// `initialInvoice` / `initialBusiness` (no mount fetch, no spinner). This owns the
// interactive parts — status toggle, record/void payment, delete, receipt viewer —
// and re-fetches the invoice via /api/invoices/[id] after each mutation.
export default function InvoiceDetailClient({ id, initialInvoice, initialBusiness }) {
  const router = useRouter()
  const toast = useToast()

  const [invoice, setInvoice] = useState(initialInvoice)
  const business = initialBusiness || {}

  const [statusBusy, setStatusBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const [payOpen, setPayOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  const [receipt, setReceipt] = useState(null) // payment being viewed

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const [voidTarget, setVoidTarget] = useState(null) // payment being voided
  const [voiding, setVoiding] = useState(false)
  const [voidError, setVoidError] = useState('')

  // Re-fetch just the invoice after a mutation; business is stable for the session.
  async function load() {
    try {
      setInvoice(await jsonFetch(`/api/invoices/${id}`))
      setActionError('')
    } catch (e) {
      setActionError(e.message)
    }
  }

  async function setStatus(status) {
    setStatusBusy(true)
    setActionError('')
    try {
      await jsonFetch(`/api/invoices/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      await load()
      toast.success(status === 'sent' ? `${invoice.invoiceNumber} marked as sent` : 'Invoice status updated')
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
      toast.success(`Payment of ${formatNaira(values.amountPaid)} recorded`)
    } catch (e) {
      setPayError(e.message)
    } finally {
      setPaying(false)
    }
  }

  async function confirmVoid() {
    if (!voidTarget) return
    const number = voidTarget.receiptNumber
    const voidedId = voidTarget.id
    setVoiding(true)
    setVoidError('')
    try {
      await jsonFetch(`/api/payments/${id}?paymentId=${voidedId}`, { method: 'DELETE' })
      setVoidTarget(null)
      // A voided payment invalidates any receipt open for it.
      setReceipt((r) => (r && r.id === voidedId ? null : r))
      await load()
      toast.success(`Payment ${number} voided`)
    } catch (e) {
      setVoidError(e.message)
    } finally {
      setVoiding(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      await jsonFetch(`/api/invoices/${id}`, { method: 'DELETE' })
      toast.success(`Invoice ${invoice.invoiceNumber} deleted`)
      router.push('/invoices')
    } catch (e) {
      setDeleteError(e.message)
      setDeleting(false)
    }
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
              <PaymentHistory payments={payments} onViewReceipt={setReceipt} onVoid={setVoidTarget} />
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

      {/* Void payment confirm */}
      <ConfirmModal
        open={!!voidTarget}
        onClose={() => {
          setVoidTarget(null)
          setVoidError('')
        }}
        onConfirm={confirmVoid}
        loading={voiding}
        title="Void this payment?"
        confirmLabel="Void payment"
        message={
          <>
            {voidTarget &&
              `This removes receipt ${voidTarget.receiptNumber} (${formatNaira(voidTarget.amountPaid)}) and reopens the invoice balance. This cannot be undone.`}
            {voidError && <span className="block text-error mt-2">{voidError}</span>}
          </>
        }
      />

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
