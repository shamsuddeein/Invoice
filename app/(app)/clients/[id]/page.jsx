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
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ClientForm from '@/components/clients/ClientForm'
import { EditIcon, TrashIcon, PlusIcon, InvoiceIcon } from '@/components/ui/icons'
import { jsonFetch } from '@/lib/fetcher'
import { formatNaira, formatDate } from '@/lib/utils'

export default function ClientDetailPage({ params }) {
  const router = useRouter()
  const { id } = params

  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function load() {
    setLoading(true)
    try {
      setClient(await jsonFetch(`/api/clients/${id}`))
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

  async function handleUpdate(values) {
    setSaving(true)
    setSaveError('')
    try {
      await jsonFetch(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(values) })
      setEditing(false)
      await load()
    } catch (e) {
      setSaveError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      await jsonFetch(`/api/clients/${id}`, { method: 'DELETE' })
      router.push('/clients')
    } catch (e) {
      setDeleteError(e.message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Client" breadcrumb={<BackLink href="/clients">Back to clients</BackLink>} />
        <div className="flex justify-center py-24 text-text-muted">
          <LoadingSpinner size={24} />
        </div>
      </div>
    )
  }

  if (loadError || !client) {
    return (
      <div>
        <PageHeader title="Client" breadcrumb={<BackLink href="/clients">Back to clients</BackLink>} />
        <div
          className="text-sm text-error"
          style={{ background: 'var(--error-muted)', padding: '10px 14px', borderRadius: 'var(--r-md)' }}
        >
          {loadError || 'Client not found.'}
        </div>
      </div>
    )
  }

  const invoices = client.invoices || []

  return (
    <div>
      <PageHeader
        title={client.name}
        breadcrumb={<BackLink href="/clients">Back to clients</BackLink>}
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <EditIcon size={16} />
              Edit
            </Button>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              <TrashIcon size={16} />
              Delete
            </Button>
            <Link href={`/invoices/new?clientId=${client.id}`}>
              <Button>
                <PlusIcon size={16} />
                New invoice
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact card */}
        <section className="card lg:col-span-1 h-fit">
          <h2 className="t-h3 mb-4">Contact details</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="t-secondary text-xs">Email</dt>
              <dd>{client.email || '—'}</dd>
            </div>
            <div>
              <dt className="t-secondary text-xs">Phone</dt>
              <dd className="mono">{client.phone || '—'}</dd>
            </div>
            <div>
              <dt className="t-secondary text-xs">Address</dt>
              <dd className="whitespace-pre-line">{client.address || '—'}</dd>
            </div>
            <div>
              <dt className="t-secondary text-xs">Client since</dt>
              <dd>{formatDate(client.createdAt)}</dd>
            </div>
          </dl>
        </section>

        {/* Invoice history */}
        <section className="lg:col-span-2">
          <h2 className="t-h3 mb-3">Invoices</h2>
          {invoices.length === 0 ? (
            <div className="bg-surface border border-border rounded-lg">
              <EmptyState
                icon={InvoiceIcon}
                title="No invoices for this client"
                description="Create the first invoice to see it here."
                action={
                  <Link href={`/invoices/new?clientId=${client.id}`}>
                    <Button>
                      <PlusIcon size={16} />
                      New invoice
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-lg overflow-x-auto">
              <table className="table min-w-[560px]">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Issued</th>
                    <th>Status</th>
                    <th className="col-amount">Total</th>
                    <th className="col-amount">Balance</th>
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
                      <td className="text-text-secondary">{formatDate(inv.issueDate)}</td>
                      <td>
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="col-amount">{formatNaira(inv.totalAmount)}</td>
                      <td className="col-amount">{formatNaira(inv.balanceDue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Edit modal */}
      <Modal
        open={editing}
        onClose={saving ? undefined : () => setEditing(false)}
        title="Edit client"
        width={560}
      >
        <ClientForm
          initial={client}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          submitting={saving}
          error={saveError}
          submitLabel="Save changes"
        />
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
        title="Delete client?"
        message={
          <>
            {`This permanently deletes “${client.name}”. This cannot be undone.`}
            {deleteError && <span className="block text-error mt-2">{deleteError}</span>}
          </>
        }
      />
    </div>
  )
}
