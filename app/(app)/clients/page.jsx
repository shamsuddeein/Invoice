import ClientsClient from '@/components/clients/ClientsClient'
import { getClientsList } from '@/lib/queries'

// Live data on every request — never statically cache at build time.
export const dynamic = 'force-dynamic'

// Server Component: the client list is fetched server-side and rendered in the
// first response (no client fetch waterfall, no spinner). Search and delete live
// in the ClientsClient island.
export default async function ClientsPage() {
  let initial = []
  let initialError = ''
  try {
    initial = await getClientsList()
  } catch (e) {
    initialError = e?.message || 'Could not load clients.'
  }

  return <ClientsClient initial={initial} initialError={initialError} />
}
