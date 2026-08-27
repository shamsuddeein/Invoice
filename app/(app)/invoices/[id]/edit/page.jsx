import PageHeader from '@/components/layout/PageHeader'
import BackLink from '@/components/ui/BackLink'
import EditInvoiceClient from '@/components/invoices/EditInvoiceClient'
import { getInvoiceById, getClientsList } from '@/lib/queries'

// Live data on every request — never statically cache at build time.
export const dynamic = 'force-dynamic'

// Server Component: the invoice (with its items) and the client list are read
// server-side and rendered in the first response, so the form is pre-filled with
// no client fetch waterfall. The EditInvoiceClient island owns only submission.
export default async function EditInvoicePage({ params }) {
  const id = Number(params.id)
  const [invoice, clients] = await Promise.all([getInvoiceById(id), getClientsList()])

  if (!invoice) {
    return (
      <div>
        <PageHeader title="Edit invoice" breadcrumb={<BackLink href="/invoices">Back to invoices</BackLink>} />
        <div
          className="text-sm text-error"
          style={{ background: 'var(--error-muted)', padding: '10px 14px', borderRadius: 'var(--r-md)' }}
        >
          Invoice not found.
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={`Edit ${invoice.invoiceNumber}`}
        breadcrumb={<BackLink href={`/invoices/${id}`}>Back to invoice</BackLink>}
      />
      <EditInvoiceClient id={id} initialInvoice={invoice} clients={clients} />
    </div>
  )
}
