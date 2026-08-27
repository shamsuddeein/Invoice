import { NextResponse } from 'next/server'
import { getDashboardData } from '@/lib/queries'
import { requireAuth } from '@/lib/guard'

// Live data on every request — never statically cache this GET at build time.
export const dynamic = 'force-dynamic'

// GET /api/dashboard → overview metrics + recent invoices. The page itself is a
// Server Component that calls getDashboardData() directly; this route stays as a
// JSON endpoint for any client-side refresh. Both share the one query.
export async function GET() {
  const denied = await requireAuth()
  if (denied) return denied
  return NextResponse.json(await getDashboardData())
}
