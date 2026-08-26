// Status config drives StatusBadge label + color class (see globals.css .badge-*).
export const STATUS_CONFIG = {
  draft: { label: 'DRAFT', color: 'draft' },
  sent: { label: 'SENT', color: 'sent' },
  partially_paid: { label: 'PARTIAL', color: 'partial' },
  paid: { label: 'PAID', color: 'paid' },
}

// Tabs on the invoice list (doc §9).
export const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
]

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'transfer', label: 'Bank Transfer' },
  { value: 'POS', label: 'POS' },
  { value: 'cheque', label: 'Cheque' },
]

export const PAYMENT_METHOD_LABELS = PAYMENT_METHODS.reduce((acc, m) => {
  acc[m.value] = m.label
  return acc
}, {})
