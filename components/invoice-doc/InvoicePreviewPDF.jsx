import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { DOC, invoiceStamp } from './theme'
import { formatNaira, formatDate } from '@/lib/utils'
import { registerPdfFonts } from './pdf-fonts'
import BrandLogoPDF from '@/components/brand/BrandLogoPDF'

// react-pdf mirror of InvoicePreview — a plain, classic invoice: black ink on white,
// hairline rules, no header band, no filled amount box. Figures use IBM Plex Mono
// (registered below); the base-14 Courier has no ₦ glyph, which dropped amounts in
// the PDF. Imported only via dynamic import() from the client download handler —
// never on the server.
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
  stamp: { marginTop: 10, borderWidth: 1.2, borderColor: DOC.paid, borderRadius: 3, paddingVertical: 3, paddingHorizontal: 9 },
  stampText: { color: DOC.paid, fontSize: 10, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5 },
  rule: { height: 1.5, backgroundColor: DOC.rule, marginTop: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 16, paddingBottom: 18 },
  label: { fontSize: 8, letterSpacing: 1, color: DOC.faint, fontFamily: 'Helvetica-Bold' },
  clientName: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 5 },
  meta: { fontSize: 9, color: DOC.muted, marginTop: 3, lineHeight: 1.5 },
  dateVal: { fontFamily: 'IBM Plex Mono', fontSize: 10, marginTop: 5, textAlign: 'right' },
  thead: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: DOC.rule, paddingBottom: 6 },
  th: { fontSize: 8, letterSpacing: 0.5, color: DOC.muted, fontFamily: 'Helvetica-Bold', paddingHorizontal: 4 },
  trow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: DOC.line, paddingVertical: 8, paddingHorizontal: 4 },
  cDesc: { flex: 1, textAlign: 'left' },
  cQty: { width: 46, textAlign: 'right' },
  cPrice: { width: 96, textAlign: 'right' },
  cAmt: { width: 96, textAlign: 'right' },
  mono: { fontFamily: 'IBM Plex Mono' },
  totals: { alignItems: 'flex-end', paddingTop: 16 },
  totalsBox: { width: 240 },
  totRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  totLabel: { color: DOC.muted, fontSize: 10 },
  totVal: { fontFamily: 'IBM Plex Mono', fontSize: 10 },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 9, paddingTop: 9, borderTopWidth: 1.5, borderTopColor: DOC.rule },
  grandLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  grandVal: { fontSize: 13, fontFamily: 'IBM Plex Mono', fontWeight: 600 },
  balRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: DOC.line },
  balLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  balVal: { fontSize: 12, fontFamily: 'IBM Plex Mono', fontWeight: 600 },
  panel: { marginTop: 26, paddingTop: 16, borderTopWidth: 1, borderTopColor: DOC.line, flexDirection: 'row' },
  panelCol: { flex: 1, paddingRight: 16 },
  panelText: { marginTop: 5, color: DOC.body, lineHeight: 1.6 },
  footer: { marginTop: 26, paddingTop: 13, borderTopWidth: 1, borderTopColor: DOC.line, textAlign: 'center' },
  footerThanks: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DOC.ink },
  footerMeta: { fontSize: 9, color: DOC.muted, marginTop: 3 },
})

export default function InvoicePreviewPDF({ business = {}, invoice }) {
  const client = invoice?.client || {}
  const items = invoice?.items || []
  const amountPaid = invoice?.amountPaid || 0
  const amountDue = invoice?.balanceDue == null ? invoice?.totalAmount || 0 : invoice.balanceDue
  const stamp = invoiceStamp(invoice)

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
            <Text style={s.docLabel}>INVOICE</Text>
            <Text style={s.docNumber}>{invoice?.invoiceNumber}</Text>
            {stamp ? (
              <View style={s.stamp}>
                <Text style={s.stampText}>{stamp.label}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={s.rule} />

        {/* Bill to + issue date */}
        <View style={s.metaRow}>
          <View style={{ maxWidth: 300 }}>
            <Text style={s.label}>BILL TO</Text>
            <Text style={s.clientName}>{client.name || '—'}</Text>
            <View style={s.meta}>
              {client.address ? <Text>{client.address}</Text> : null}
              {client.phone ? <Text style={s.mono}>{client.phone}</Text> : null}
              {client.email ? <Text>{client.email}</Text> : null}
            </View>
          </View>
          <View>
            <Text style={[s.label, { textAlign: 'right' }]}>ISSUE DATE</Text>
            <Text style={s.dateVal}>{formatDate(invoice?.issueDate)}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={s.thead}>
          <Text style={[s.th, s.cDesc]}>DESCRIPTION</Text>
          <Text style={[s.th, s.cQty]}>QTY</Text>
          <Text style={[s.th, s.cPrice]}>UNIT PRICE</Text>
          <Text style={[s.th, s.cAmt]}>AMOUNT</Text>
        </View>
        {items.map((it, i) => (
          <View style={s.trow} key={it.id ?? i}>
            <Text style={s.cDesc}>{it.description}</Text>
            <Text style={[s.cQty, s.mono]}>{String(it.quantity)}</Text>
            <Text style={[s.cPrice, s.mono]}>{formatNaira(it.unitPrice)}</Text>
            <Text style={[s.cAmt, s.mono]}>{formatNaira(it.lineTotal)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={s.totals}>
          <View style={s.totalsBox}>
            <View style={s.totRow}>
              <Text style={s.totLabel}>Subtotal</Text>
              <Text style={s.totVal}>{formatNaira(invoice?.subtotal)}</Text>
            </View>
            <View style={s.totRow}>
              <Text style={s.totLabel}>Tax{invoice?.taxRate ? ` (${invoice.taxRate}%)` : ''}</Text>
              <Text style={s.totVal}>{formatNaira(invoice?.taxAmount)}</Text>
            </View>
            <View style={s.grandRow}>
              <Text style={s.grandLabel}>Total</Text>
              <Text style={s.grandVal}>{formatNaira(invoice?.totalAmount)}</Text>
            </View>
            {amountPaid > 0 ? (
              <View style={s.totRow}>
                <Text style={s.totLabel}>Amount paid</Text>
                <Text style={s.totVal}>{`- ${formatNaira(amountPaid)}`}</Text>
              </View>
            ) : null}
            {amountPaid > 0 ? (
              <View style={s.balRow}>
                <Text style={s.balLabel}>Balance due</Text>
                <Text style={s.balVal}>{formatNaira(amountDue)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Payment details + notes */}
        {business.bankName || business.accountNumber || invoice?.notes ? (
          <View style={s.panel}>
            {business.bankName || business.accountNumber ? (
              <View style={s.panelCol}>
                <Text style={s.label}>PAYMENT DETAILS</Text>
                <View style={s.panelText}>
                  {business.bankName ? <Text>{business.bankName}</Text> : null}
                  {business.accountNumber ? <Text style={s.mono}>{business.accountNumber}</Text> : null}
                  {business.accountName ? <Text style={{ color: DOC.muted }}>{business.accountName}</Text> : null}
                </View>
              </View>
            ) : null}
            {invoice?.notes ? (
              <View style={s.panelCol}>
                <Text style={s.label}>NOTES</Text>
                <Text style={s.panelText}>{invoice.notes}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerThanks}>Thank you for your business.</Text>
        </View>
      </Page>
    </Document>
  )
}
