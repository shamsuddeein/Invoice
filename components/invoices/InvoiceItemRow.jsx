'use client'

import Input from '@/components/ui/Input'
import { TrashIcon } from '@/components/ui/icons'
import { formatNaira } from '@/lib/utils'

// One editable line item. Description is free text; qty and unit price are mono
// numeric; the line total is derived (read-only) and right-aligned (UI Rule 6).
export default function InvoiceItemRow({ item, index, onChange, onRemove, canRemove }) {
  const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)

  function set(field, value) {
    onChange(index, { ...item, [field]: value })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 md:items-center py-3 md:py-2 border-b border-border last:border-b-0">
      <div className="md:col-span-5">
        <span className="t-small t-secondary md:hidden mb-1 block">Description</span>
        <Input
          value={item.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Item or service description"
          aria-label={`Line ${index + 1} description`}
        />
      </div>

      {/* Qty + Unit price: paired side-by-side on mobile, own columns on desktop */}
      <div className="grid grid-cols-2 gap-2 md:contents">
        <div className="md:col-span-2">
          <span className="t-small t-secondary md:hidden mb-1 block">Qty</span>
          <Input
            mono
            type="number"
            min="0"
            step="1"
            value={item.quantity}
            onChange={(e) => set('quantity', e.target.value)}
            className="text-right"
            aria-label={`Line ${index + 1} quantity`}
          />
        </div>

        <div className="md:col-span-2">
          <span className="t-small t-secondary md:hidden mb-1 block">Unit price</span>
          <Input
            mono
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => set('unitPrice', e.target.value)}
            className="text-right"
            aria-label={`Line ${index + 1} unit price`}
          />
        </div>
      </div>

      {/* Amount + remove: one row on mobile, own columns on desktop */}
      <div className="flex items-center justify-between md:contents">
        <div className="md:col-span-2 flex items-center md:justify-end">
          <span className="t-small t-secondary md:hidden mr-2">Amount</span>
          <span className="amount">{formatNaira(lineTotal)}</span>
        </div>

        <div className="md:col-span-1 flex md:justify-end">
          <button
            type="button"
            className="icon-btn danger"
            onClick={() => onRemove(index)}
            disabled={!canRemove}
            aria-label={`Remove line ${index + 1}`}
            title={canRemove ? 'Remove line' : 'An invoice needs at least one line'}
          >
            <TrashIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
