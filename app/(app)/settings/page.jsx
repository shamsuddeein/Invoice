'use client'

import { useEffect, useRef, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import CopyButton from '@/components/ui/CopyButton'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { jsonFetch } from '@/lib/fetcher'

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  address: '',
  logo: '',
  bankName: '',
  accountNumber: '',
  accountName: '',
  taxRate: 0,
  invoicePrefix: 'INV',
  receiptPrefix: 'RCPT',
}

export default function SettingsPage() {
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [logoError, setLogoError] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    let active = true
    jsonFetch('/api/business')
      .then((data) => {
        if (!active) return
        setForm({ ...EMPTY, ...data, taxRate: data.taxRate ?? 0 })
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  function update(key) {
    return (e) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
      setSaved(false)
    }
  }

  // Read a chosen image into a base64 data URL. Data URLs (not remote URLs) are
  // used so the logo embeds cleanly in both the PDF and the html2canvas PNG
  // without cross-origin canvas tainting. PNG/JPEG only — react-pdf's <Image>
  // rasterizes those; a 400 KB cap keeps the stored business row small.
  function onLogoFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // let the user re-pick the same file after an error
    if (!file) return
    setLogoError('')
    if (!/^image\/(png|jpeg)$/.test(file.type)) {
      setLogoError('Please choose a PNG or JPEG image.')
      return
    }
    if (file.size > 400 * 1024) {
      setLogoError('Image is too large — please use one under 400 KB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setForm((f) => ({ ...f, logo: String(reader.result || '') }))
      setSaved(false)
    }
    reader.onerror = () => setLogoError('Could not read that file.')
    reader.readAsDataURL(file)
  }

  function removeLogo() {
    setForm((f) => ({ ...f, logo: '' }))
    setLogoError('')
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const updated = await jsonFetch('/api/business', {
        method: 'PUT',
        body: JSON.stringify(form),
      })
      setForm({ ...EMPTY, ...updated, taxRate: updated.taxRate ?? 0 })
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Settings" subtitle="Business profile and invoice defaults" />
        <div className="flex items-center justify-center py-24 text-text-muted">
          <LoadingSpinner size={24} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Business profile and invoice defaults"
        actions={
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-success">Saved ✓</span>}
            <Button onClick={handleSave} loading={saving}>
              Save changes
            </Button>
          </div>
        }
      />

      {error && (
        <div
          className="text-sm text-error mb-5"
          style={{ background: 'var(--error-muted)', padding: '10px 14px', borderRadius: 'var(--r-md)' }}
        >
          {error}
        </div>
      )}

      <div className="space-y-6 max-w-3xl">
        {/* ── Business information ── */}
        <section className="card">
          <h2 className="t-h3 mb-1">Business information</h2>
          <p className="t-secondary text-sm mb-5">Shown on every invoice and receipt.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Business name" htmlFor="name" className="md:col-span-2">
              <Input id="name" value={form.name} onChange={update('name')} placeholder="e.g. Bello Fabrics Ltd" />
            </FormField>
            <FormField label="Email" htmlFor="email">
              <Input id="email" type="email" value={form.email} onChange={update('email')} placeholder="hello@business.com" />
            </FormField>
            <FormField label="Phone" htmlFor="phone">
              <Input id="phone" value={form.phone} onChange={update('phone')} placeholder="+234 800 000 0000" />
            </FormField>
            <FormField label="Address" htmlFor="address" className="md:col-span-2">
              <Textarea id="address" value={form.address} onChange={update('address')} rows={2} placeholder="Street, city, state" />
            </FormField>
            <FormField
              label="Logo"
              className="md:col-span-2"
              hint="Shown on every invoice and receipt. PNG or JPEG, up to 400 KB."
              error={logoError}
            >
              <div className="flex items-center gap-4">
                {form.logo ? (
                  <img
                    src={form.logo}
                    alt="Business logo"
                    className="h-16 w-16 rounded-lg border border-border object-contain bg-white p-1"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg border border-dashed border-border-strong flex items-center justify-center text-text-muted text-xs">
                    None
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={onLogoFile}
                  />
                  <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                    {form.logo ? 'Replace' : 'Upload'}
                  </Button>
                  {form.logo && (
                    <Button variant="ghost" onClick={removeLogo}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </FormField>
          </div>
        </section>

        {/* ── Bank details ── */}
        <section className="card">
          <h2 className="t-h3 mb-1">Bank details</h2>
          <p className="t-secondary text-sm mb-5">Printed on invoices so clients know where to pay.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Bank name" htmlFor="bankName">
              <Input id="bankName" value={form.bankName} onChange={update('bankName')} placeholder="e.g. GTBank" />
            </FormField>
            <FormField label="Account number" htmlFor="accountNumber">
              <div className="flex items-center gap-2">
                <Input id="accountNumber" mono className="flex-1" value={form.accountNumber} onChange={update('accountNumber')} placeholder="0123456789" />
                <CopyButton value={form.accountNumber} label="Copy account number" />
              </div>
            </FormField>
            <FormField label="Account name" htmlFor="accountName" className="md:col-span-2">
              <Input id="accountName" value={form.accountName} onChange={update('accountName')} placeholder="Account holder name" />
            </FormField>
          </div>
        </section>

        {/* ── Invoice defaults ── */}
        <section className="card">
          <h2 className="t-h3 mb-1">Invoice defaults</h2>
          <p className="t-secondary text-sm mb-5">Number prefixes and default tax applied to new invoices.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Invoice prefix" htmlFor="invoicePrefix">
              <Input id="invoicePrefix" mono value={form.invoicePrefix} onChange={update('invoicePrefix')} placeholder="INV" />
            </FormField>
            <FormField label="Receipt prefix" htmlFor="receiptPrefix">
              <Input id="receiptPrefix" mono value={form.receiptPrefix} onChange={update('receiptPrefix')} placeholder="RCPT" />
            </FormField>
            <FormField label="Default tax rate (%)" htmlFor="taxRate">
              <Input id="taxRate" mono type="number" min="0" step="0.01" value={form.taxRate} onChange={update('taxRate')} placeholder="0" />
            </FormField>
          </div>
        </section>
      </div>
    </div>
  )
}
