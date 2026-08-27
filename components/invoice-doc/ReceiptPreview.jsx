'use client'

import { DOC, MONO, SANS } from './theme'
import { formatNaira, formatDate, receiptStanding } from '@/lib/utils'
import { PAYMENT_METHOD_LABELS } from '@/lib/constants'
import BrandLogo from '@/components/brand/BrandLogo'

// Plain, classic HTML receipt for a single payment — on-screen preview and the
// html2canvas capture target (id="receipt-preview"). Black ink on white, hairline
// rules, a prominent "amount received" figure, and a restrained green PAID IN FULL
// stamp when the invoice is settled. No header band, no filled boxes.
export default function ReceiptPreview({ business = {}, invoice, payment }) {
  if (!invoice || !payment) return null
  const client = invoice.client || {}
  const num = { fontFamily: MONO, whiteSpace: 'nowrap' }
  // Standing as of THIS payment (see receiptStanding) — never the live balance.
  const { paidThrough, balanceAsOf, paidInFull } = receiptStanding(invoice, payment)
  const label = { fontSize: 10, letterSpacing: 1, color: DOC.faint, fontWeight: 700, textTransform: 'uppercase' }

  const detailRows = [
    { label: 'Payment date', value: formatDate(payment.paymentDate), mono: true },
    { label: 'Method', value: PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod },
    ...(payment.referenceNumber ? [{ label: 'Reference', value: payment.referenceNumber, mono: true }] : []),
    { label: 'Invoice', value: invoice.invoiceNumber, mono: true },
  ]

  return (
    <div
      id="receipt-preview"
      style={{ width: 720, background: DOC.white, color: DOC.ink, fontFamily: SANS, fontSize: 13, lineHeight: 1.55 }}
    >
      <div style={{ padding: '44px 44px 32px' }}>
        {/* Header — business (left) + RECEIPT (right) */}
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
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 4, color: DOC.ink }}>RECEIPT</div>
            <div style={{ marginTop: 6, fontSize: 13, color: DOC.muted, ...num }}>{payment.receiptNumber}</div>
          </div>
        </div>

        <div style={{ height: 2, background: DOC.rule, marginTop: 20 }} />

        {/* Received from (left) + amount received (right) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, padding: '22px 0 24px' }}>
          <div style={{ maxWidth: 340 }}>
            <div style={label}>Received from</div>
            <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700 }}>{client.name || '—'}</div>
            <div style={{ marginTop: 3, fontSize: 12, color: DOC.muted, lineHeight: 1.6 }}>
              {client.phone && <div style={num}>{client.phone}</div>}
              {client.email && <div>{client.email}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={label}>Amount received</div>
            <div style={{ marginTop: 4, fontSize: 30, fontWeight: 700, color: DOC.ink, ...num }}>{formatNaira(payment.amountPaid)}</div>
            {paidInFull && (
              <div style={{ marginTop: 10 }}>
                <span style={{ display: 'inline-block', border: `1.5px solid ${DOC.paid}`, color: DOC.paid, fontWeight: 700, letterSpacing: 2, fontSize: 12, padding: '4px 12px', borderRadius: 4 }}>
                  PAID IN FULL
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment details */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {detailRows.map((r) => (
              <tr key={r.label} style={{ borderBottom: `1px solid ${DOC.line}` }}>
                <td style={{ padding: '9px 8px', fontSize: 12.5, color: DOC.muted }}>{r.label}</td>
                <td style={{ padding: '9px 8px', fontSize: 12.5, textAlign: 'right', fontFamily: r.mono ? MONO : SANS }}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Invoice standing */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 18 }}>
          <div style={{ width: 280 }}>
            <SummaryRow label="Invoice total" value={formatNaira(invoice.totalAmount)} />
            <SummaryRow label="Total paid" value={formatNaira(paidThrough)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10, paddingTop: 10, borderTop: `1.5px solid ${DOC.rule}` }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Balance due</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: paidInFull ? DOC.paid : DOC.ink, ...num }}>{formatNaira(balanceAsOf)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 30, paddingTop: 16, borderTop: `1px solid ${DOC.line}`, textAlign: 'center' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: DOC.ink }}>Thank you for your payment.</div>
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
