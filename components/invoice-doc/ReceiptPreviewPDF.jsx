import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { DOC } from './theme'
import { formatNaira, formatDate, receiptStanding } from '@/lib/utils'
import { PAYMENT_METHOD_LABELS } from '@/lib/constants'
import { registerPdfFonts } from './pdf-fonts'
import BrandLogoPDF from '@/components/brand/BrandLogoPDF'

// react-pdf mirror of ReceiptPreview — a plain, classic receipt: black ink on white,
// hairline rules, no header band, no filled boxes. Figures use IBM Plex Mono
// (registered below); the base-14 Courier has no ₦ glyph. Dynamic-imported only.
registerPdfFonts()

const s = StyleSheet.create({
  page: { backgroundColor: '#FFFFFF', color: DOC.ink, fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.5, paddingVertical: 40, paddingHorizontal: 40 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logo: { maxHeight: 44, maxWidth: 170, objectFit: 'contain', marginBottom: 10 },
  bizName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: DOC.ink },
  bizMeta: { fontSize: 9, color: DOC.muted, marginTop: 5, lineHeight: 1.5 },
  headRight: { alignItems: 'flex-end' },
  docLabel: { fontSize: 22, fontFamily: 'Helvetica-Bold', letterSpacing: 3, color: DOC.ink },
  docNumber: { fontSize: 10, fontFamily: 'IBM Plex Mono', color: DOC.muted, marginTop: 5 },
  rule: { height: 1.5, backgroundColor: DOC.rule, marginTop: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 16, paddingBottom: 18 },
  label: { fontSize: 8, letterSpacing: 1, color: DOC.faint, fontFamily: 'Helvetica-Bold' },
  clientName: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 5 },
  meta: { fontSize: 9, color: DOC.muted, marginTop: 3, lineHeight: 1.5 },
  amountLabel: { fontSize: 8, letterSpacing: 1, color: DOC.faint, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  amountVal: { fontSize: 22, fontFamily: 'IBM Plex Mono', fontWeight: 600, textAlign: 'right', marginTop: 4, color: DOC.ink },
  paidStamp: { marginTop: 8, borderWidth: 1.2, borderColor: DOC.paid, borderRadius: 3, paddingVertical: 3, paddingHorizontal: 9, alignSelf: 'flex-end' },
  paidText: { color: DOC.paid, fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: DOC.line, paddingVertical: 7, paddingHorizontal: 4 },
  detailLabel: { color: DOC.muted, fontSize: 10 },
  mono: { fontFamily: 'IBM Plex Mono' },
  totals: { alignItems: 'flex-end', paddingTop: 16 },
  totalsBox: { width: 240 },
  totRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  totLabel: { color: DOC.muted, fontSize: 10 },
  totVal: { fontFamily: 'IBM Plex Mono', fontSize: 10 },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 9, paddingTop: 9, borderTopWidth: 1.5, borderTopColor: DOC.rule },
  grandLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  footer: { marginTop: 26, paddingTop: 13, borderTopWidth: 1, borderTopColor: DOC.line, textAlign: 'center' },
  footerThanks: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DOC.ink },
  footerMeta: { fontSize: 9, color: DOC.muted, marginTop: 3 },
})

export default function ReceiptPreviewPDF({ business = {}, invoice, payment }) {
  const client = invoice?.client || {}
  // Standing as of THIS payment (see receiptStanding) — never the live balance.
  const { paidThrough, balanceAsOf, paidInFull } = receiptStanding(invoice, payment)

  const detailRows = [
    { label: 'Payment date', value: formatDate(payment?.paymentDate), mono: true },
    { label: 'Method', value: PAYMENT_METHOD_LABELS[payment?.paymentMethod] || payment?.paymentMethod },
    ...(payment?.referenceNumber ? [{ label: 'Reference', value: payment.referenceNumber, mono: true }] : []),
    { label: 'Invoice', value: invoice?.invoiceNumber, mono: true },
  ]

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headRow}>
          <View style={{ maxWidth: 300 }}>
            {business.logo ? <Image src={business.logo} style={s.logo} /> : <BrandLogoPDF />}
            <Text style={s.bizName}>{business.name || 'Your Business'}</Text>
            <View style={s.bizMeta}>
              {business.address ? <Text>{business.address}</Text> : null}
              {business.phone ? <Text style={s.mono}>{business.phone}</Text> : null}
              {business.email ? <Text>{business.email}</Text> : null}
            </View>
          </View>
          <View style={s.headRight}>
            <Text style={s.docLabel}>RECEIPT</Text>
            <Text style={s.docNumber}>{payment?.receiptNumber}</Text>
          </View>
        </View>

        <View style={s.rule} />

        {/* Received from + amount received */}
        <View style={s.metaRow}>
          <View style={{ maxWidth: 280 }}>
            <Text style={s.label}>RECEIVED FROM</Text>
            <Text style={s.clientName}>{client.name || '—'}</Text>
            <View style={s.meta}>
              {client.phone ? <Text style={s.mono}>{client.phone}</Text> : null}
              {client.email ? <Text>{client.email}</Text> : null}
            </View>
          </View>
          <View>
            <Text style={s.amountLabel}>AMOUNT RECEIVED</Text>
            <Text style={s.amountVal}>{formatNaira(payment?.amountPaid)}</Text>
            {paidInFull ? (
              <View style={s.paidStamp}>
                <Text style={s.paidText}>PAID IN FULL</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Payment details */}
        {detailRows.map((r) => (
          <View style={s.detailRow} key={r.label}>
            <Text style={s.detailLabel}>{r.label}</Text>
            <Text style={r.mono ? s.mono : null}>{r.value}</Text>
          </View>
        ))}

        {/* Invoice standing */}
        <View style={s.totals}>
          <View style={s.totalsBox}>
            <View style={s.totRow}>
              <Text style={s.totLabel}>Invoice total</Text>
              <Text style={s.totVal}>{formatNaira(invoice?.totalAmount)}</Text>
            </View>
            <View style={s.totRow}>
              <Text style={s.totLabel}>Total paid</Text>
              <Text style={s.totVal}>{formatNaira(paidThrough)}</Text>
            </View>
            <View style={s.grandRow}>
              <Text style={s.grandLabel}>Balance due</Text>
              <Text style={[{ fontSize: 13, fontFamily: 'IBM Plex Mono', fontWeight: 600 }, { color: paidInFull ? DOC.paid : DOC.ink }]}>
                {formatNaira(balanceAsOf)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerThanks}>Thank you for your payment.</Text>
        </View>
      </Page>
    </Document>
  )
}
