// Skeleton placeholders shown while list data loads (UI Rule 8 — never a blank
// screen). Uses Tailwind's animate-pulse over the .skeleton-block surface so the
// shape roughly mirrors the table that will replace it.

function Bar({ className = '' }) {
  return <div className={`skeleton-block animate-pulse ${className}`} />
}

// A card-framed table stand-in: header strip + N rows of faded bars.
export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden" aria-hidden="true">
      <div className="px-4 py-3 border-b border-border">
        <Bar className="h-3.5 w-40" />
      </div>
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border last:border-b-0">
            <Bar className="h-4 flex-1 max-w-[220px]" />
            <Bar className="h-4 w-28 hidden sm:block" />
            <Bar className="h-4 w-20 hidden md:block" />
            <Bar className="h-4 w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default TableSkeleton
