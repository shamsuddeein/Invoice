'use client'

import { useEffect, useRef, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import CopyButton from '@/components/ui/CopyButton'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import BrandLogo from '@/components/brand/BrandLogo'
import { jsonFetch } from '@/lib/fetcher'
import { useToast } from '@/components/ui/Toast'

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
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [logoError, setLogoError] = useState('')
  const fileRef = useRef(null)

  // ── Security (password change) — independent of the business form above ──
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

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
    }
    reader.onerror = () => setLogoError('Could not read that file.')
    reader.readAsDataURL(file)
  }

  function removeLogo() {
    setForm((f) => ({ ...f, logo: '' }))
    setLogoError('')
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const updated = await jsonFetch('/api/business', {
        method: 'PUT',
        body: JSON.stringify(form),
      })
      setForm({ ...EMPTY, ...updated, taxRate: updated.taxRate ?? 0 })
      toast.success('Settings saved')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function updatePw(key) {
    return (e) => setPw((p) => ({ ...p, [key]: e.target.value }))
  }

  async function handleChangePassword() {
    setPwError('')
    if (pw.next.length < 8) {
      setPwError('New password must be at least 8 characters.')
      return
    }
    if (pw.next !== pw.confirm) {
      setPwError('New passwords do not match.')
      return
    }
    setPwSaving(true)
    try {
      await jsonFetch('/api/account/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      })
      setPw({ current: '', next: '', confirm: '' })
      toast.success('Password updated')
    } catch (err) {
      setPwError(err.message)
    } finally {
      setPwSaving(false)
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
          <Button onClick={handleSave} loading={saving}>
            Save changes
          </Button>
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
              hint="Shown on every invoice and receipt. Leave empty to use the default AUSAD logo. PNG or JPEG, up to 400 KB."
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
                  <div className="h-16 rounded-lg border border-border bg-white flex items-center px-3">
                    <BrandLogo variant="full" height={30} />
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

        {/* ── Security ── */}
        <section className="card">
          <h2 className="t-h3 mb-1">Security</h2>
          <p className="t-secondary text-sm mb-5">Change the password you use to sign in.</p>

          {pwError && (
            <div
              className="text-sm text-error mb-4"
              style={{ background: 'var(--error-muted)', padding: '10px 14px', borderRadius: 'var(--r-md)' }}
            >
              {pwError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Current password" htmlFor="currentPassword" className="md:col-span-2">
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                value={pw.current}
                onChange={updatePw('current')}
                placeholder="••••••••"
              />
            </FormField>
            <FormField label="New password" htmlFor="newPassword" hint="At least 8 characters.">
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={pw.next}
                onChange={updatePw('next')}
                placeholder="••••••••"
              />
            </FormField>
            <FormField label="Confirm new password" htmlFor="confirmPassword">
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={pw.confirm}
                onChange={updatePw('confirm')}
                placeholder="••••••••"
              />
            </FormField>
          </div>
          <div className="mt-5">
            <Button
              onClick={handleChangePassword}
              loading={pwSaving}
              disabled={!pw.current || !pw.next || !pw.confirm}
            >
              Update password
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
