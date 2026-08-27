import { TableSkeleton } from '@/components/ui/Skeleton'

// Route-group loading fallback: shown instantly on navigation while a Server
// Component's data (all app pages are force-dynamic → they fetch on the server)
// resolves. A title bar + table stand-in matches the list/detail pages; the
// dashboard has its own closer loading.jsx. Never a blank screen (UI Rule 8).
export default function AppLoading() {
  return (
    <div aria-hidden="true">
      <div className="mb-6 flex items-center justify-between">
        <div className="skeleton-block animate-pulse h-8 w-48" />
        <div className="skeleton-block animate-pulse h-9 w-32 rounded-lg" />
      </div>
      <TableSkeleton rows={6} />
    </div>
  )
}
