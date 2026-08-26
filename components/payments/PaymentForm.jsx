'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import FormField from '@/components/ui/FormField'
import { PAYMENT_METHODS } from '@/lib/constants'
import { formatNaira, todayISO } from '@/lib/utils'

// Record-payment form shown inside a modal on the invoice detail. Amount defaults
// to the full outstanding balance; the owner can lower it for a partial payment.
export default function PaymentForm({ balanceDue = 0, onSubmit, onCancel, submitting = false, error = '' }) {
  const [form, setForm] = useState({
    amountPaid: balanceDue ? String(balanceDue) : '',
    paymentDate: todayISO(),
    paymentMethod: 'transfer',
    referenceNumber: '',
    note: '',
  })
  const [touched, setTouched] = useState(false)

  const amount = Number(form.amountPaid)
  const amountInvalid = !amount || amount <= 0
  const overBalance = amount > balanceDue + 0.01

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function submit() {
    setTouched(true)
    if (amountInvalid || overBalance) return
    onSubmit({
      amountPaid: amount,
      paymentDate: form.paymentDate,
      paymentMethod: form.paymentMethod,
      referenceNumber: form.referenceNumber,
      note: form.note,
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <div
          className="text-sm text-error"
          style={{ background: 'var(--error-muted)', padding: '10px 14px', borderRadius: 'var(--r-md)' }}
        >
          {error}
        </div>
      )}

      <div
        className="flex justify-between items-baseline px-3 py-2 rounded-md"
        style={{ background: 'var(--surface)' }}
      >
        <span className="t-secondary text-sm">Outstanding balance</span>
        <span className="amount">{formatNaira(balanceDue)}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Amount"
          htmlFor="amountPaid"
          required
          error={
            touched && amountInvalid
              ? 'Enter an amount greater than zero.'
              : touched && overBalance
                ? 'Amount is more than the balance due.'
                : ''
          }
        >
          <Input
            id="amountPaid"
            mono
            type="number"
            min="0"
            step="0.01"
            value={form.amountPaid}
            error={touched && (amountInvalid || overBalance)}
            onChange={(e) => set('amountPaid', e.target.value)}
          />
        </FormField>

        <FormField label="Payment date" htmlFor="paymentDate" required>
          <Input
            id="paymentDate"
            type="date"
            value={form.paymentDate}
            onChange={(e) => set('paymentDate', e.target.value)}
          />
        </FormField>

        <FormField label="Method" htmlFor="paymentMethod" required>
          <Select
            id="paymentMethod"
            value={form.paymentMethod}
            onChange={(e) => set('paymentMethod', e.target.value)}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Reference" htmlFor="referenceNumber" hint="Transfer ref, POS terminal, cheque no.">
          <Input
            id="referenceNumber"
            value={form.referenceNumber}
            onChange={(e) => set('referenceNumber', e.target.value)}
            placeholder="Optional"
          />
        </FormField>
      </div>

      <FormField label="Note" htmlFor="note">
        <Textarea
          id="note"
          rows={2}
          value={form.note}
          onChange={(e) => set('note', e.target.value)}
          placeholder="Optional"
        />
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="primary" onClick={submit} loading={submitting} disabled={submitting}>
          Record payment
        </Button>
      </div>
    </div>
  )
}
