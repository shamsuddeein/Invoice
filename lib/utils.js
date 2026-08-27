// ─── Money ────────────────────────────────────────────────────────────
// Force the ₦ glyph (Intl currency emits "NGN" on some runtimes). Always show 2
// decimals (kobo): amounts are stored to the kobo (round2) and 7.5% VAT / partial
// payments are routinely fractional, so displaying whole-naira only made
// documents fail to reconcile (Subtotal + Tax ≠ Total). 2dp is the standard for
// financial documents and keeps every printed figure exact.
export function formatNaira(amount) {
  const n = Number(amount) || 0
  return (
    '₦' +
    n.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}

// Round to 2 decimal places (kobo). Money is stored as SQLite `real` (binary
// float), so qty × price and percent tax can drift — e.g. 0.1 × 3 =
// 0.30000000000000004. Round at every point a figure is stored or compared so
// balances reconcile exactly rather than relying on ±0.01 fudge tolerances.
export function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

// ─── Receipts ─────────────────────────────────────────────────────────
// A receipt is a historical record: it must show the balance AS OF that payment,
// not the invoice's live balance. If a later payment is recorded, an old receipt
// must still read the same. So sum only the payments up to and including this one
// (ordered by date, then id — the order payments are stored/displayed), and derive
// the standing from that. Falls back to the invoice's live totals when the full
// payments list isn't available to the caller.
export function receiptStanding(invoice, payment) {
  const total = Number(invoice?.totalAmount) || 0
  const list = Array.isArray(invoice?.payments) ? invoice.payments : null
  if (!list || !payment) {
    const paidThrough = round2(Number(invoice?.amountPaid) || 0)
    const balanceAsOf = Math.max(0, round2(total - paidThrough))
    return { paidThrough, balanceAsOf, paidInFull: balanceAsOf <= 0.01 }
  }
  const pd = payment.paymentDate || ''
  const pid = Number(payment.id) || 0
  const paidThrough = round2(
    list.reduce((sum, p) => {
      const d = p.paymentDate || ''
      const i = Number(p.id) || 0
      const upToThisOne = d < pd || (d === pd && i <= pid)
      return upToThisOne ? sum + (Number(p.amountPaid) || 0) : sum
    }, 0)
  )
  const balanceAsOf = Math.max(0, round2(total - paidThrough))
  return { paidThrough, balanceAsOf, paidInFull: balanceAsOf <= 0.01 }
}

// ─── Numbers ──────────────────────────────────────────────────────────
// INV-2025-001 / RCPT-2025-001 (doc §11). The year is taken from the document's
// OWN date (issue date / payment date) when supplied, so a doc dated 31/12/2025
// saved on 01/01/2026 still reads 2025 — not the save-time year. Falls back to
// the current business-timezone year (see todayISO).
export function generateDocNumber(prefix, nextNumber, dateISO) {
  const fromDate = dateISO && /^\d{4}-/.test(String(dateISO)) ? String(dateISO).slice(0, 4) : null
  const year = fromDate || todayISO().slice(0, 4)
  const padded = String(nextNumber).padStart(3, '0')
  return `${prefix}-${year}-${padded}`
}
export const generateInvoiceNumber = generateDocNumber
export const generateReceiptNumber = generateDocNumber

// ─── Dates ────────────────────────────────────────────────────────────
// DB stores ISO YYYY-MM-DD; UI shows DD/MM/YYYY.
// The business operates in West Africa Time (UTC+1). Deriving the calendar date
// from UTC (as `toISOString()` does) bucketed invoices/payments into the wrong
// day for the ~1h after local midnight when the app runs on a UTC host (Vercel),
// and mis-bucketed the dashboard's "collected this month". Format in the business
// timezone instead so the calendar date is always the owner's local date.
const BUSINESS_TZ = 'Africa/Lagos'
export function todayISO() {
  // en-CA yields YYYY-MM-DD; timeZone pins it to WAT regardless of server TZ.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
export function nowISO() {
  return new Date().toISOString()
}
export function formatDate(iso) {
  if (!iso) return ''
  const datePart = String(iso).split('T')[0]
  const [y, m, d] = datePart.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}
export function formatDateLong(iso) {
  if (!iso) return ''
  const dt = new Date(iso)
  if (isNaN(dt)) return iso
  return dt.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
