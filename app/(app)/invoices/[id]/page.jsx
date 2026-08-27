import PageHeader from '@/components/layout/PageHeader'
import BackLink from '@/components/ui/BackLink'
import InvoiceDetailClient from '@/components/invoices/InvoiceDetailClient'
import { getInvoiceById, getOrCreateBusiness } from '@/lib/queries'

// Live data on every request — never statically cache at build time.
export const dynamic = 'force-dynamic'

// Server Component: the invoice, its client/items/payments, and the business row
// (for the branded document) are fetched server-side and rendered in the first
// response — no client fetch waterfall, no spinner. All interactivity lives in
// the InvoiceDetailClient island, seeded from these props.
export default async function InvoiceDetailPage({ params }) {
  const id = Number(params.id)
  const [invoice, business] = await Promise.all([getInvoiceById(id), getOrCreateBusiness()])

  if (!invoice) {
    return (
      <div>
        <PageHeader title="Invoice" breadcrumb={<BackLink href="/invoices">Back to invoices</BackLink>} />
        <div
          className="text-sm text-error"
          style={{ background: 'var(--error-muted)', padding: '10px 14px', borderRadius: 'var(--r-md)' }}
        >
          Invoice not found.
        </div>
      </div>
    )
  }

  return <InvoiceDetailClient id={id} initialInvoice={invoice} initialBusiness={business} />
}
