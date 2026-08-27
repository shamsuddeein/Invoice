import { TableSkeleton } from '@/components/ui/Skeleton'

// Dashboard-specific loading fallback (closer than the group's loading.jsx).
// Mirrors the real layout: three metric cards over the recent-invoices table.
export default function DashboardLoading() {
  return (
    <div aria-hidden="true">
      <div className="mb-6 hidden lg:flex items-center justify-between">
        <div className="skeleton-block animate-pulse h-8 w-40" />
        <div className="skeleton-block animate-pulse h-9 w-32 rounded-lg" />
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton-block animate-pulse h-4 w-24 mb-4" />
              <div className="skeleton-block animate-pulse h-7 w-32 mb-2" />
              <div className="skeleton-block animate-pulse h-3 w-20" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TableSkeleton rows={5} />
          </div>
          <div className="card hidden lg:block h-fit">
            <div className="skeleton-block animate-pulse h-4 w-28 mb-4" />
            <div className="space-y-3">
              <div className="skeleton-block animate-pulse h-9 w-full rounded-lg" />
              <div className="skeleton-block animate-pulse h-9 w-full rounded-lg" />
              <div className="skeleton-block animate-pulse h-9 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
