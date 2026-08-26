import { InboxIcon } from './icons'

// Designed empty state (UI Rule 7): muted icon, a clear line about what's
// missing, and — usually — the primary action to create the first record.
export default function EmptyState({
  icon: IconComp = InboxIcon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-hover text-text-muted mb-4">
        <IconComp size={22} />
      </div>
      <h3 className="t-h3">{title}</h3>
      {description && <p className="t-secondary text-sm max-w-sm mt-1 mb-5">{description}</p>}
      {action}
    </div>
  )
}
