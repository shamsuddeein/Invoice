'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import TableSkeleton from '@/components/ui/Skeleton'
import ConfirmModal from '@/components/ui/ConfirmModal'
import StatusFilter from '@/components/invoices/StatusFilter'
import InvoiceTable from '@/components/invoices/InvoiceTable'
import { InvoiceIcon, PlusIcon, SearchIcon, XIcon } from '@/components/ui/icons'
import { jsonFetch } from '@/lib/fetcher'
import { formatNaira } from '@/lib/utils'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function load() {
    setLoading(true)
    try {
      setInvoices(await jsonFetch('/api/invoices?status=all'))
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const counts = useMemo(() => {
    const c = { all: invoices.length }
    for (const inv of invoices) c[inv.status] = (c[inv.status] || 0) + 1
    return c
  }, [invoices])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return invoices.filter((inv) => {
      if (status !== 'all' && inv.status !== status) return false
      if (!q) return true
      return [inv.invoiceNumber, inv.clientName].some((v) => (v || '').toLowerCase().includes(q))
    })
  }, [invoices, status, search])

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      await jsonFetch(`/api/invoices/${deleteTarget.id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      await load()
    } catch (e) {
      setDeleteError(e.message)
    } finally {
      setDeleting(false)
    }
  }

  const deletePaid = deleteTarget
    ? Math.max(0, (deleteTarget.totalAmount || 0) - (deleteTarget.balanceDue || 0))
    : 0

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Every invoice you've created"
        actions={
          <Link href="/invoices/new">
            <Button>
              <PlusIcon size={16} />
              New invoice
            </Button>
          </Link>
        }
      />

      {loading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <div
          className="text-sm text-error"
          style={{ background: 'var(--error-muted)', padding: '10px 14px', borderRadius: 'var(--r-md)' }}
        >
          {error}
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg">
          <EmptyState
            icon={InvoiceIcon}
            title="No invoices yet"
            description="Create your first invoice to start billing clients."
            action={
              <Link href="/invoices/new">
                <Button>
                  <PlusIcon size={16} />
                  New invoice
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <StatusFilter value={status} onChange={setStatus} counts={counts} />

          <div className="relative mb-4 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <SearchIcon size={16} />
            </span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by number or client…"
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

          {filtered.length === 0 ? (
            <div className="bg-surface border border-border rounded-lg">
              <EmptyState
                icon={SearchIcon}
                title="No matching invoices"
                description="Try a different status filter or search term."
              />
            </div>
          ) : (
            <InvoiceTable invoices={filtered} onDelete={setDeleteTarget} />
          )}
        </>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null)
          setDeleteError('')
        }}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete invoice?"
        message={
          <>
            {`This permanently deletes ${deleteTarget?.invoiceNumber} and any recorded payments. This cannot be undone.`}
            {deletePaid > 0 && (
              <span className="block mt-2 font-medium text-text-primary">
                {`${formatNaira(deletePaid)} in recorded payments will be deleted with it.`}
              </span>
            )}
            {deleteError && <span className="block text-error mt-2">{deleteError}</span>}
          </>
        }
      />
    </div>
  )
}
