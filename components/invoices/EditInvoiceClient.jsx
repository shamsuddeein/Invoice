'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import InvoiceForm from '@/components/invoices/InvoiceForm'
import { jsonFetch } from '@/lib/fetcher'
import { useToast } from '@/components/ui/Toast'

// Client island for the Edit Invoice page. The invoice + client list are fetched
// server-side and passed in (no mount fetch, no spinner); this owns only the
// form submission.
export default function EditInvoiceClient({ id, initialInvoice, clients = [] }) {
  const router = useRouter()
  const toast = useToast()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(values) {
    setSubmitting(true)
    setError('')
    try {
      await jsonFetch(`/api/invoices/${id}`, { method: 'PUT', body: JSON.stringify(values) })
      toast.success(`Invoice ${initialInvoice?.invoiceNumber || ''} updated`.trim())
      router.push(`/invoices/${id}`)
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <InvoiceForm
      clients={clients}
      initial={initialInvoice}
      defaultTaxRate={initialInvoice?.taxRate ?? 0}
      mode="edit"
      onSubmit={handleSubmit}
      onCancel={() => router.push(`/invoices/${id}`)}
      submitting={submitting}
      error={error}
    />
  )
}
