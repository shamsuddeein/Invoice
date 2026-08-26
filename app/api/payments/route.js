import { NextResponse } from 'next/server'
import { getPaymentsList } from '@/lib/queries'

// Live data on every request — never statically cache this GET at build time.
export const dynamic = 'force-dynamic'

// GET /api/payments → every payment, newest first, with invoice number + client
// name for the payments ledger (doc §9). The page Server-renders this via the
// shared getPaymentsList(); this route serves the same shape for client refresh.
export async function GET() {
  return NextResponse.json(await getPaymentsList())
}
