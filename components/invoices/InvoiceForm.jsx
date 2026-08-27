'use client'

import { useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import FormField from '@/components/ui/FormField'
import Modal from '@/components/ui/Modal'
import ClientForm from '@/components/clients/ClientForm'
import { PlusIcon } from '@/components/ui/icons'
import InvoiceItemRow from './InvoiceItemRow'
import InvoiceTotalsPanel from './InvoiceTotalsPanel'
import useInvoiceCalculator from '@/hooks/useInvoiceCalculator'
import { jsonFetch } from '@/lib/fetcher'
import { useToast } from '@/components/ui/Toast'
import { todayISO } from '@/lib/utils'

const BLANK_ITEM = { description: '', quantity: 1, unitPrice: '' }

function buildInitial(initial, defaultTaxRate) {
  return {
    clientId: initial?.clientId ? String(initial.clientId) : '',
    issueDate: initial?.issueDate || todayISO(),
    taxRate: initial?.taxRate != null ? initial.taxRate : (defaultTaxRate ?? 0),
    notes: initial?.notes || '',
    items:
      initial?.items && initial.items.length
        ? initial.items.map((it) => ({
            description: it.description || '',
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          }))
        : [{ ...BLANK_ITEM }],
  }
}

// Shared by New and Edit. In create mode it offers "Save as draft" (secondary)
// and "Save & mark sent" (gold primary); in edit mode a single "Save changes".
export default function InvoiceForm({
  clients = [],
  initial,
  defaultTaxRate = 0,
  mode = 'create',
  onSubmit,
  onCancel,
  submitting = false,
  error = '',
}) {
  const [form, setForm] = useState(() => buildInitial(initial, defaultTaxRate))
  const [intent, setIntent] = useState(null) // which button is pending
  const [touched, setTouched] = useState(false)
  const toast = useToast()

  // Clients added inline (via the quick-add modal) are appended to the prop list
  // so the freshly-created client can be selected without leaving this form.
  const [extraClients, setExtraClients] = useState([])
  const allClients = useMemo(() => [...clients, ...extraClients], [clients, extraClients])
  const [addOpen, setAddOpen] = useState(false)
  const [addingClient, setAddingClient] = useState(false)
  const [addError, setAddError] = useState('')

  const { subtotal, taxAmount, totalAmount } = useInvoiceCalculator(form.items, form.taxRate)

  const describedItems = form.items.filter((it) => String(it.description).trim())
  const clientMissing = !form.clientId
  const itemsMissing = describedItems.length === 0

  function updateItem(index, next) {
    setForm((f) => ({ ...f, items: f.items.map((it, i) => (i === index ? next : it)) }))
  }
  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, { ...BLANK_ITEM }] }))
  }
  function removeItem(index) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }))
  }

  async function createClient(values) {
    setAddingClient(true)
    setAddError('')
    try {
      const created = await jsonFetch('/api/clients', { method: 'POST', body: JSON.stringify(values) })
      setExtraClients((list) => [...list, created])
      setForm((f) => ({ ...f, clientId: String(created.id) }))
      setAddOpen(false)
      toast.success(`${created.name} added`)
    } catch (e) {
      setAddError(e.message)
    } finally {
      setAddingClient(false)
    }
  }

  function submit(nextIntent) {
    setTouched(true)
    if (clientMissing || itemsMissing) return
    setIntent(nextIntent)
    onSubmit(
      {
        clientId: Number(form.clientId),
        issueDate: form.issueDate,
        taxRate: Number(form.taxRate) || 0,
        notes: form.notes,
        items: describedItems.map((it) => ({
          description: String(it.description).trim(),
          quantity: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
        })),
        status: nextIntent === 'sent' ? 'sent' : 'draft',
      },
      nextIntent
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div
          className="text-sm text-error"
          style={{ background: 'var(--error-muted)', padding: '10px 14px', borderRadius: 'var(--r-md)' }}
        >
          {error}
        </div>
      )}

      {/* Header fields */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Client"
            htmlFor="clientId"
            required
            error={touched && clientMissing ? 'Select a client for this invoice.' : ''}
          >
            <Select
              id="clientId"
              value={form.clientId}
              error={touched && clientMissing}
              onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
            >
              <option value="">Select a client…</option>
              {allClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <button
              type="button"
              onClick={() => {
                setAddError('')
                setAddOpen(true)
              }}
              className="self-start inline-flex items-center gap-1 text-xs font-medium mt-1"
              style={{ color: 'var(--accent)' }}
            >
              <PlusIcon size={13} />
              Add new client
            </button>
          </FormField>

          <FormField label="Issue date" htmlFor="issueDate" required>
            <Input
              id="issueDate"
              type="date"
              value={form.issueDate}
              onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))}
            />
          </FormField>

          <FormField label="Tax rate" htmlFor="taxRate" hint="Applied to the subtotal.">
            <div className="relative">
              <Input
                id="taxRate"
                mono
                type="number"
                min="0"
                step="0.1"
                value={form.taxRate}
                onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">%</span>
            </div>
          </FormField>
        </div>
      </div>

      {/* Line items */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="t-h3">Line items</h2>
        </div>

        {/* Desktop column header */}
        <div className="hidden md:grid grid-cols-12 gap-3 pb-2 border-b border-border-strong">
          <div className="col-span-5 t-small t-secondary uppercase tracking-wide">Description</div>
          <div className="col-span-2 t-small t-secondary uppercase tracking-wide text-right">Qty</div>
          <div className="col-span-2 t-small t-secondary uppercase tracking-wide text-right">Unit price</div>
          <div className="col-span-2 t-small t-secondary uppercase tracking-wide text-right">Amount</div>
          <div className="col-span-1" />
        </div>

        <div>
          {form.items.map((item, i) => (
            <InvoiceItemRow
              key={i}
              item={item}
              index={i}
              onChange={updateItem}
              onRemove={removeItem}
              canRemove={form.items.length > 1}
            />
          ))}
        </div>

        {touched && itemsMissing && (
          <p className="form-error mt-2">Add at least one line item with a description.</p>
        )}

        <div className="mt-4">
          <Button variant="secondary" onClick={addItem}>
            <PlusIcon size={16} />
            Add line
          </Button>
        </div>

        <div className="mt-6">
          <InvoiceTotalsPanel
            subtotal={subtotal}
            taxRate={Number(form.taxRate) || 0}
            taxAmount={taxAmount}
            totalAmount={totalAmount}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="card">
        <FormField label="Notes" htmlFor="notes" hint="Shown on the invoice — payment terms, thank-you note, etc.">
          <Textarea
            id="notes"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Optional note to the client"
          />
        </FormField>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        {mode === 'create' ? (
          <>
            <Button
              variant="secondary"
              onClick={() => submit('draft')}
              loading={submitting && intent === 'draft'}
              disabled={submitting}
            >
              Save as draft
            </Button>
            <Button
              variant="primary"
              onClick={() => submit('sent')}
              loading={submitting && intent === 'sent'}
              disabled={submitting}
            >
              Save &amp; mark sent
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            onClick={() => submit('save')}
            loading={submitting}
            disabled={submitting}
          >
            Save changes
          </Button>
        )}
      </div>

      {/* Quick add-client — keeps the in-progress invoice instead of navigating away */}
      <Modal
        open={addOpen}
        onClose={addingClient ? undefined : () => setAddOpen(false)}
        title="New client"
        width={560}
      >
        <ClientForm
          onSubmit={createClient}
          onCancel={() => setAddOpen(false)}
          submitting={addingClient}
          error={addError}
          submitLabel="Add client"
        />
      </Modal>
    </div>
  )
}
