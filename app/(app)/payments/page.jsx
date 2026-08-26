import PaymentsClient from '@/components/payments/PaymentsClient'
import { getPaymentsList } from '@/lib/queries'

// Live data on every request — never statically cache at build time.
export const dynamic = 'force-dynamic'

// Server Component: the payments ledger is fetched server-side and rendered in
// the first response (no client fetch waterfall, no spinner). Search lives in
// the PaymentsClient island.
export default async function PaymentsPage() {
  let initial = []
  let initialError = ''
  try {
    initial = await getPaymentsList()
  } catch (e) {
    initialError = e?.message || 'Could not load payments.'
  }

  return <PaymentsClient initial={initial} initialError={initialError} />
}
