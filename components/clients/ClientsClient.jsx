'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import TableSkeleton from '@/components/ui/Skeleton'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ClientTable from '@/components/clients/ClientTable'
import { ClientsIcon, PlusIcon, SearchIcon, XIcon, DownloadIcon } from '@/components/ui/icons'
import { jsonFetch } from '@/lib/fetcher'
import { downloadCSV } from '@/lib/csv'
import { useToast } from '@/components/ui/Toast'
import { todayISO } from '@/lib/utils'

// CSV columns for the clients export.
const CLIENT_COLUMNS = [
  { header: 'Name', value: 'name' },
  { header: 'Email', value: (r) => r.email || '' },
  { header: 'Phone', value: (r) => r.phone || '' },
  { header: 'Address', value: (r) => r.address || '' },
]

// Client island for the clients list. First paint is server-rendered from
// `initial` (no mount fetch, no spinner); this component owns search and delete,
// re-fetching /api/clients after a delete to stay in sync.
export default function ClientsClient({ initial, initialError = '' }) {
  const toast = useToast()
  const [clients, setClients] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function load() {
    setLoading(true)
    try {
      setClients(await jsonFetch('/api/clients'))
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function exportCSV() {
    downloadCSV(clients, CLIENT_COLUMNS, `clients-${todayISO()}.csv`)
    toast.success(`Exported ${clients.length} client${clients.length === 1 ? '' : 's'}`)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((c) =>
      [c.name, c.email, c.phone].some((v) => (v || '').toLowerCase().includes(q))
    )
  }, [clients, search])

  async function confirmDelete() {
    if (!deleteTarget) return
    const name = deleteTarget.name
    setDeleting(true)
    setDeleteError('')
    try {
      await jsonFetch(`/api/clients/${deleteTarget.id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      await load()
      toast.success(`${name} deleted`)
    } catch (e) {
      setDeleteError(e.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="People and businesses you invoice"
        actions={
          <>
            <Button variant="secondary" onClick={exportCSV} disabled={clients.length === 0}>
              <DownloadIcon size={16} />
              Export
            </Button>
            <Link href="/clients/new">
              <Button>
                <PlusIcon size={16} />
                New client
              </Button>
            </Link>
          </>
        }
      />

      {!loading && !error && clients.length > 0 && (
        <div className="relative mb-4 max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <SearchIcon size={16} />
          </span>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients…"
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
      )}

      {loading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <div
          className="text-sm text-error"
          style={{ background: 'var(--error-muted)', padding: '10px 14px', borderRadius: 'var(--r-md)' }}
        >
          {error}
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg">
          <EmptyState
            icon={ClientsIcon}
            title="No clients yet"
            description="Add your first client to start creating invoices."
            action={
              <Link href="/clients/new">
                <Button>
                  <PlusIcon size={16} />
                  New client
                </Button>
              </Link>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg">
          <EmptyState
            icon={SearchIcon}
            title="No matches"
            description={`No clients match “${search}”.`}
          />
        </div>
      ) : (
        <ClientTable clients={filtered} onDelete={setDeleteTarget} />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null)
          setDeleteError('')
        }}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete client?"
        message={
          <>
            {`This permanently deletes “${deleteTarget?.name}”. This cannot be undone.`}
            {deleteError && <span className="block text-error mt-2">{deleteError}</span>}
          </>
        }
      />
    </div>
  )
}
