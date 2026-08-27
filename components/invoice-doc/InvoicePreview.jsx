'use client'

import { DOC, MONO, SANS, invoiceStamp } from './theme'
import { formatNaira, formatDate } from '@/lib/utils'
import BrandLogo from '@/components/brand/BrandLogo'

// Plain, classic HTML invoice — the on-screen preview AND the html2canvas capture
// target (id="invoice-preview"). Black ink on white, hairline rules, a simple
// right-aligned totals column; no header band, no filled amount box. The only colour
// is a green PAID stamp when the invoice is settled. Inline styles throughout so the
// html2canvas / print capture reproduces it faithfully.
export default function InvoicePreview({ business = {}, invoice }) {
  if (!invoice) return null
  const client = invoice.client || {}
  const items = invoice.items || []
  const amountPaid = invoice.amountPaid || 0
  const amountDue = invoice.balanceDue == null ? invoice.totalAmount || 0 : invoice.balanceDue
  const stamp = invoiceStamp(invoice)

  const num = { fontFamily: MONO, whiteSpace: 'nowrap' }
  const cell = { padding: '10px 8px', fontSize: 12.5, verticalAlign: 'top' }
  const th = { padding: '0 8px 8px', fontSize: 10, letterSpacing: 0.8, color: DOC.muted, fontWeight: 700, textTransform: 'uppercase' }
  const label = { fontSize: 10, letterSpacing: 1, color: DOC.faint, fontWeight: 700, textTransform: 'uppercase' }

  return (
    <div
      id="invoice-preview"
      style={{ width: 720, background: DOC.white, color: DOC.ink, fontFamily: SANS, fontSize: 13, lineHeight: 1.55 }}
    >
      <div style={{ padding: '44px 44px 32px' }}>
        {/* Header — business (left) + INVOICE (right) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
          <div style={{ maxWidth: 360 }}>
            {business.logo ? (
              <img src={business.logo} alt="" style={{ maxHeight: 48, maxWidth: 200, objectFit: 'contain', display: 'block', marginBottom: 10 }} />
            ) : (
              <BrandLogo variant="horizontal" height={44} style={{ display: 'block', marginBottom: 10 }} />
            )}
            <div style={{ fontSize: 12, color: DOC.muted, lineHeight: 1.6 }}>
              {business.address && <div style={{ whiteSpace: 'pre-line' }}>{business.address}</div>}
              {business.phone && <div style={num}>{business.phone}</div>}
              {business.email && <div>{business.email}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 4, color: DOC.ink }}>INVOICE</div>
            <div style={{ marginTop: 6, fontSize: 13, color: DOC.muted, ...num }}>{invoice.invoiceNumber}</div>
            {stamp && (
              <div style={{ marginTop: 12 }}>
                <span style={{ display: 'inline-block', border: `1.5px solid ${stamp.color}`, color: stamp.color, fontSize: 12, fontWeight: 700, letterSpacing: 2, padding: '4px 12px', borderRadius: 4 }}>
                  {stamp.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Strong rule under the header */}
        <div style={{ height: 2, background: DOC.rule, marginTop: 20 }} />

        {/* Bill to (left) + issue date (right) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, padding: '22px 0 26px' }}>
          <div style={{ maxWidth: 360 }}>
            <div style={label}>Bill to</div>
            <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700 }}>{client.name || '—'}</div>
            <div style={{ marginTop: 3, fontSize: 12, color: DOC.muted, lineHeight: 1.6 }}>
              {client.address && <div style={{ whiteSpace: 'pre-line' }}>{client.address}</div>}
              {client.phone && <div style={num}>{client.phone}</div>}
              {client.email && <div>{client.email}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={label}>Issue date</div>
            <div style={{ marginTop: 6, fontSize: 12.5, ...num }}>{formatDate(invoice.issueDate)}</div>
          </div>
        </div>

        {/* Items */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1.5px solid ${DOC.rule}` }}>
              <th style={{ ...th, textAlign: 'left' }}>Description</th>
              <th style={{ ...th, textAlign: 'right', width: 60 }}>Qty</th>
              <th style={{ ...th, textAlign: 'right', width: 130 }}>Unit price</th>
              <th style={{ ...th, textAlign: 'right', width: 130 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={it.id ?? i} style={{ borderBottom: `1px solid ${DOC.line}` }}>
                <td style={{ ...cell, textAlign: 'left' }}>{it.description}</td>
                <td style={{ ...cell, textAlign: 'right', ...num }}>{it.quantity}</td>
                <td style={{ ...cell, textAlign: 'right', ...num }}>{formatNaira(it.unitPrice)}</td>
                <td style={{ ...cell, textAlign: 'right', ...num }}>{formatNaira(it.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals — simple right-aligned column, no filled box */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 18 }}>
          <div style={{ width: 280 }}>
            <SummaryRow label="Subtotal" value={formatNaira(invoice.subtotal)} />
            <SummaryRow label={`Tax${invoice.taxRate ? ` (${invoice.taxRate}%)` : ''}`} value={formatNaira(invoice.taxAmount)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10, paddingTop: 10, borderTop: `1.5px solid ${DOC.rule}` }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: 17, fontWeight: 700, ...num }}>{formatNaira(invoice.totalAmount)}</span>
            </div>
            {amountPaid > 0 && (
              <>
                <SummaryRow label="Amount paid" value={`− ${formatNaira(amountPaid)}`} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8, paddingTop: 8, borderTop: `1px solid ${DOC.line}` }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Balance due</span>
                  <span style={{ fontSize: 15, fontWeight: 700, ...num }}>{formatNaira(amountDue)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment details + notes — plain, hairline-separated */}
        {(business.bankName || business.accountNumber || invoice.notes) && (
          <div style={{ marginTop: 30, paddingTop: 20, borderTop: `1px solid ${DOC.line}`, display: 'flex', gap: 40 }}>
            {(business.bankName || business.accountNumber) && (
              <div style={{ flex: 1 }}>
                <div style={label}>Payment details</div>
                <div style={{ marginTop: 6, fontSize: 12.5, color: DOC.body, lineHeight: 1.7 }}>
                  {business.bankName && <div>{business.bankName}</div>}
                  {business.accountNumber && <div style={num}>{business.accountNumber}</div>}
                  {business.accountName && <div style={{ color: DOC.muted }}>{business.accountName}</div>}
                </div>
              </div>
            )}
            {invoice.notes && (
              <div style={{ flex: 1 }}>
                <div style={label}>Notes</div>
                <div style={{ marginTop: 6, fontSize: 12.5, color: DOC.body, whiteSpace: 'pre-line', lineHeight: 1.7 }}>{invoice.notes}</div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 30, paddingTop: 16, borderTop: `1px solid ${DOC.line}`, textAlign: 'center' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: DOC.ink }}>Thank you for your business.</div>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 7 }}>
      <span style={{ fontSize: 12.5, color: DOC.muted }}>{label}</span>
      <span style={{ fontSize: 13, fontFamily: MONO }}>{value}</span>
    </div>
  )
}
