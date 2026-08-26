// Document palette — explicit hex (NOT the app's CSS variables) so html2canvas
// captures colours faithfully and the react-pdf mirror matches exactly. Documents
// are ALWAYS rendered on white, regardless of app theme.
//
// Deliberately plain and classic — a real invoice, not a designed one: black ink on
// white, hairline rules, no filled colour blocks, no header band. The single splash
// of colour is a restrained green used ONLY for a "PAID" stamp (a real-world
// convention); every other element is monochrome.
export const DOC = {
  ink: '#111827', // primary text; strong header + total rules
  body: '#374151', // body copy (notes, payment details)
  muted: '#6B7280', // labels, secondary meta, table headers
  faint: '#9CA3AF', // the lightest uppercase labels
  line: '#E5E7EB', // hairline separators between rows
  rule: '#111827', // the dark thin rule under the header / above the total
  white: '#FFFFFF',
  paid: '#0E7C3A', // green — reserved solely for the PAID / PAID IN FULL stamp
}

// A document stamp shown only when meaningful. "Real invoice" convention: a paid
// document gets a green PAID mark; everything else is unstamped (no OVERDUE — that
// feature was removed app-wide, and no PART PAID clutter; partial payment is shown
// plainly in the totals via Amount paid / Balance due).
export function invoiceStamp(invoice = {}) {
  const total = invoice.totalAmount || 0
  const bal = invoice.balanceDue == null ? total : invoice.balanceDue
  if (total > 0 && bal <= 0.01) return { label: 'PAID', color: DOC.paid }
  return null
}

// Font stacks. MONO drives every figure (money, dates, phone, account numbers) and
// resolves to IBM Plex Mono via --font-dm-mono (self-hosted; ₦-capable). SANS is the
// UI/body face.
export const MONO = "var(--font-dm-mono), ui-monospace, 'Courier New', monospace"
export const SANS = "var(--font-dm-sans), -apple-system, 'Segoe UI', sans-serif"
