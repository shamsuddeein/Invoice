// ─── Money ────────────────────────────────────────────────────────────
// Force the ₦ glyph (Intl currency emits "NGN" on some runtimes). No decimals
// for whole-naira amounts (doc §11 / Quick Reference).
export function formatNaira(amount) {
  const n = Number(amount) || 0
  return (
    '₦' +
    n.toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  )
}

// ─── Numbers ──────────────────────────────────────────────────────────
// INV-2025-001 / RCPT-2025-001 (doc §11)
export function generateDocNumber(prefix, nextNumber) {
  const year = new Date().getFullYear()
  const padded = String(nextNumber).padStart(3, '0')
  return `${prefix}-${year}-${padded}`
}
export const generateInvoiceNumber = generateDocNumber
export const generateReceiptNumber = generateDocNumber

// ─── Dates ────────────────────────────────────────────────────────────
// DB stores ISO YYYY-MM-DD; UI shows DD/MM/YYYY.
export function todayISO() {
  return new Date().toISOString().split('T')[0]
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
