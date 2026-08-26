'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
  PlusIcon,
  PaymentsIcon,
  CheckIcon,
  InvoiceIcon,
  ClientsIcon,
} from '@/components/ui/icons'
import MetricCard from '@/components/dashboard/MetricCard'
import RecentInvoices from '@/components/dashboard/RecentInvoices'
import { jsonFetch } from '@/lib/fetcher'
import { formatNaira } from '@/lib/utils'

// Friendly label for the current month, e.g. "August 2026".
function currentMonthLabel() {
  return new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        setData(await jsonFetch('/api/dashboard'))
        setError('')
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const m = data?.metrics

  return (
    <div>
      {/* Mobile greeting (desktop uses the page header below) */}
      <div className="lg:hidden mb-5">
        <h1 className="t-h1">Hello{data?.ownerName ? `, ${data.ownerName}` : ''}</h1>
        {data?.businessName && (
          <p className="t-secondary text-sm mt-0.5">{data.businessName}</p>
        )}
      </div>

      <div className="hidden lg:block">
        <PageHeader
          title="Dashboard"
          subtitle="Overview of your invoicing"
          actions={
            <Link href="/invoices/new">
              <Button variant="primary">
                <PlusIcon size={16} />
                New invoice
              </Button>
            </Link>
          }
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-24 text-text-muted">
          <LoadingSpinner size={24} />
        </div>
      ) : error ? (
        <div
          className="text-sm text-error"
          style={{ background: 'var(--error-muted)', padding: '10px 14px', borderRadius: 'var(--r-md)' }}
        >
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              label="Total revenue"
              value={formatNaira(m.totalRevenue)}
              sub="Collected all-time"
              color="green"
              icon={<PaymentsIcon size={20} />}
            />
            <MetricCard
              label="Collected this month"
              value={formatNaira(m.collectedThisMonth)}
              sub={currentMonthLabel()}
              color="primary"
              icon={<CheckIcon size={20} />}
            />
            <MetricCard
              label="Outstanding"
              value={formatNaira(m.outstanding)}
              sub="Awaiting payment"
              color="amber"
              icon={<InvoiceIcon size={20} />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentInvoices invoices={data.recentInvoices} />
            </div>

            {/* Quick actions — desktop only (the FAB covers this on mobile) */}
            <div className="card hidden lg:block h-fit">
              <h3 className="t-h3 mb-4">Quick actions</h3>
              <div className="space-y-3">
                <Link href="/invoices/new" className="block">
                  <Button variant="primary" className="w-full">
                    <PlusIcon size={16} />
                    New invoice
                  </Button>
                </Link>
                <Link href="/clients/new" className="block">
                  <Button variant="secondary" className="w-full">
                    <ClientsIcon size={16} />
                    New client
                  </Button>
                </Link>
                <Link href="/payments" className="block">
                  <Button variant="secondary" className="w-full">
                    <PaymentsIcon size={16} />
                    View payments
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
