'use client'

import { useState } from 'react'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'

// Shared by the "New client" page and the edit modal. Parent owns the async
// state (submitting/error) and decides what happens on submit.
export default function ClientForm({
  initial,
  onSubmit,
  onCancel,
  submitting = false,
  error = '',
  submitLabel = 'Save client',
}) {
  const [name, setName] = useState(initial?.name || '')
  const [email, setEmail] = useState(initial?.email || '')
  const [phone, setPhone] = useState(initial?.phone || '')
  const [address, setAddress] = useState(initial?.address || '')
  const [touched, setTouched] = useState(false)

  const nameError = touched && !name.trim() ? 'Client name is required.' : ''

  function handleSubmit(e) {
    e.preventDefault()
    setTouched(true)
    if (!name.trim()) return
    onSubmit({ name: name.trim(), email, phone, address })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="text-sm text-error"
          style={{ background: 'var(--error-muted)', padding: '10px 14px', borderRadius: 'var(--r-md)' }}
        >
          {error}
        </div>
      )}

      <FormField label="Client name" htmlFor="c-name" required error={nameError}>
        <Input
          id="c-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!nameError}
          autoFocus
          placeholder="e.g. Adaeze Okafor"
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Email" htmlFor="c-email">
          <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@email.com" />
        </FormField>
        <FormField label="Phone" htmlFor="c-phone">
          <Input id="c-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 800 000 0000" />
        </FormField>
      </div>

      <FormField label="Address" htmlFor="c-address">
        <Textarea id="c-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Street, city, state" />
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
