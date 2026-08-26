'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/layout/PageHeader'
import BackLink from '@/components/ui/BackLink'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import InvoiceForm from '@/components/invoices/InvoiceForm'
import { ClientsIcon, PlusIcon } from '@/components/ui/icons'
import { jsonFetch } from '@/lib/fetcher'
import { todayISO } from '@/lib/utils'

function NewInvoiceInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetClientId = searchParams.get('clientId')

  const [clients, setClients] = useState([])
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const [c, b] = await Promise.all([jsonFetch('/api/clients'), jsonFetch('/api/business')])
        setClients(c)
        setBusiness(b)
        setLoadError('')
      } catch (e) {
        setLoadError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const initial = useMemo(() => {
    return {
      clientId: presetClientId || '',
      issueDate: todayISO(),
    }
  }, [presetClientId])

  async function handleSubmit(values) {
    setSubmitting(true)
    setError('')
    try {
      const created = await jsonFetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(values),
      })
      router.push(`/invoices/${created.id}`)
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-text-muted">
        <LoadingSpinner size={24} />
      </div>
    )
  }

  if (loadError) {
    return (
      <div
        className="text-sm text-error"
        style={{ background: 'var(--error-muted)', padding: '10px 14px', borderRadius: 'var(--r-md)' }}
      >
        {loadError}
      </div>
    )
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
      defaultTaxRate={business?.taxRate ?? 0}
      mode="create"
      onSubmit={handleSubmit}
      onCancel={() => router.push('/invoices')}
      submitting={submitting}
      error={error}
    />
  )
}

export default function NewInvoicePage() {
  return (
    <div>
      <PageHeader title="New invoice" breadcrumb={<BackLink href="/invoices">Back to invoices</BackLink>} />
      <Suspense
        fallback={
          <div className="flex justify-center py-24 text-text-muted">
            <LoadingSpinner size={24} />
          </div>
        }
      >
        <NewInvoiceInner />
      </Suspense>
    </div>
  )
}
