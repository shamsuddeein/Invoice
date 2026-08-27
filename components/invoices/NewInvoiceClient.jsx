'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import InvoiceForm from '@/components/invoices/InvoiceForm'
import { ClientsIcon, PlusIcon } from '@/components/ui/icons'
import { jsonFetch } from '@/lib/fetcher'
import { useToast } from '@/components/ui/Toast'
import { todayISO } from '@/lib/utils'

// Client island for the New Invoice page. Clients + the default tax rate are
// fetched server-side and passed in, so there's no mount fetch or spinner —
// this owns only form submission and the "add a client first" empty state.
export default function NewInvoiceClient({ clients = [], defaultTaxRate = 0, presetClientId = '' }) {
  const router = useRouter()
  const toast = useToast()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const initial = useMemo(
    () => ({ clientId: presetClientId || '', issueDate: todayISO() }),
    [presetClientId]
  )

  async function handleSubmit(values) {
    setSubmitting(true)
    setError('')
    try {
      const created = await jsonFetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(values),
      })
      toast.success(
        values.status === 'sent'
          ? `Invoice ${created.invoiceNumber} created and marked sent`
          : `Invoice ${created.invoiceNumber} saved as draft`
      )
      router.push(`/invoices/${created.id}`)
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  if (clients.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg">
        <EmptyState
          icon={ClientsIcon}
          title="Add a client first"
          description="Invoices are addressed to a client. Create one to get started."
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
    )
  }

  return (
    <InvoiceForm
      clients={clients}
      initial={initial}
      defaultTaxRate={defaultTaxRate}
      mode="create"
      onSubmit={handleSubmit}
      onCancel={() => router.push('/invoices')}
      submitting={submitting}
      error={error}
    />
  )
}
