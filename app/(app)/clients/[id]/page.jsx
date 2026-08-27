import PageHeader from '@/components/layout/PageHeader'
import BackLink from '@/components/ui/BackLink'
import ClientDetailClient from '@/components/clients/ClientDetailClient'
import { getClientById } from '@/lib/queries'

// Live data on every request — never statically cache at build time.
export const dynamic = 'force-dynamic'

// Server Component: client + invoice history fetched server-side, rendered in the
// first response. Edit + delete live in the ClientDetailClient island.
export default async function ClientDetailPage({ params }) {
  const id = Number(params.id)
  const client = await getClientById(id)

  if (!client) {
    return (
      <div>
        <PageHeader title="Client" breadcrumb={<BackLink href="/clients">Back to clients</BackLink>} />
        <div
          className="text-sm text-error"
          style={{ background: 'var(--error-muted)', padding: '10px 14px', borderRadius: 'var(--r-md)' }}
        >
          Client not found.
        </div>
      </div>
    )
  }

  return <ClientDetailClient id={id} initialClient={client} />
}
