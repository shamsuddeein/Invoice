'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import BackLink from '@/components/ui/BackLink'
import ClientForm from '@/components/clients/ClientForm'
import { jsonFetch } from '@/lib/fetcher'

export default function NewClientPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(values) {
    setSubmitting(true)
    setError('')
    try {
      const created = await jsonFetch('/api/clients', {
        method: 'POST',
        body: JSON.stringify(values),
      })
      router.push(`/clients/${created.id}`)
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="New client" breadcrumb={<BackLink href="/clients">Back to clients</BackLink>} />
      <div className="card max-w-2xl">
        <ClientForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/clients')}
          submitting={submitting}
          error={error}
          submitLabel="Create client"
        />
      </div>
    </div>
  )
}
