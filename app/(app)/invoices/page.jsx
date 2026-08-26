import InvoicesClient from '@/components/invoices/InvoicesClient'
import { getInvoicesList } from '@/lib/queries'

// Live data on every request — never statically cache at build time.
export const dynamic = 'force-dynamic'

// Server Component: the invoice list is fetched server-side and rendered in the
// first response (no client fetch waterfall, no spinner). The interactive parts
// — status filter, search, delete — live in the InvoicesClient island.
export default async function InvoicesPage() {
  let initial = []
  let initialError = ''
  try {
    initial = await getInvoicesList({ status: 'all' })
  } catch (e) {
    initialError = e?.message || 'Could not load invoices.'
  }

  return <InvoicesClient initial={initial} initialError={initialError} />
}
