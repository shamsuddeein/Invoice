'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import BackLink from '@/components/ui/BackLink'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import InvoiceForm from '@/components/invoices/InvoiceForm'
import { jsonFetch } from '@/lib/fetcher'

export default function EditInvoicePage({ params }) {
  const router = useRouter()
  const { id } = params

  const [invoice, setInvoice] = useState(null)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const [inv, c] = await Promise.all([
          jsonFetch(`/api/invoices/${id}`),
          jsonFetch('/api/clients'),
        ])
        setInvoice(inv)
        setClients(c)
        setLoadError('')
      } catch (e) {
        setLoadError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  async function handleSubmit(values) {
    setSubmitting(true)
    setError('')
    try {
      await jsonFetch(`/api/invoices/${id}`, { method: 'PUT', body: JSON.stringify(values) })
      router.push(`/invoices/${id}`)
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={invoice ? `Edit ${invoice.invoiceNumber}` : 'Edit invoice'}
        breadcrumb={<BackLink href={`/invoices/${id}`}>Back to invoice</BackLink>}
      />

      {loading ? (
        <div className="flex justify-center py-24 text-text-muted">
          <LoadingSpinner size={24} />
        </div>
      ) : loadError ? (
        <div
          className="text-sm text-error"
          style={{ background: 'var(--error-muted)', padding: '10px 14px', borderRadius: 'var(--r-md)' }}
        >
          {loadError}
        </div>
      ) : (
        <InvoiceForm
          clients={clients}
          initial={invoice}
          defaultTaxRate={invoice?.taxRate ?? 0}
          mode="edit"
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/invoices/${id}`)}
          submitting={submitting}
          error={error}
        />
      )}
    </div>
  )
}
