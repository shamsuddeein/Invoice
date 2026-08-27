import PageHeader from '@/components/layout/PageHeader'
import BackLink from '@/components/ui/BackLink'
import NewInvoiceClient from '@/components/invoices/NewInvoiceClient'
import { getClientsList, getInvoiceDefaults } from '@/lib/queries'

// Live data on every request — never statically cache at build time.
export const dynamic = 'force-dynamic'

// Server Component: the client list + default tax rate are read server-side and
// passed to the island. The preset client (from a "New invoice" link on a client
// page) is read from searchParams here instead of useSearchParams on the client,
// which removes the Suspense boundary the old client page needed.
export default async function NewInvoicePage({ searchParams }) {
  const [clients, defaults] = await Promise.all([getClientsList(), getInvoiceDefaults()])
  const presetClientId = searchParams?.clientId || ''

  return (
    <div>
      <PageHeader title="New invoice" breadcrumb={<BackLink href="/invoices">Back to invoices</BackLink>} />
      <NewInvoiceClient
        clients={clients}
        defaultTaxRate={defaults?.taxRate ?? 0}
        presetClientId={presetClientId}
      />
    </div>
  )
}
