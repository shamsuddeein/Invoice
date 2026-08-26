import { STATUS_CONFIG } from '@/lib/constants'

// Status is the ONLY place color appears inside a table row (UI Rule 5).
// Colors come from the .badge-* classes in globals.css via STATUS_CONFIG.color.
export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || {
    label: String(status || '').toUpperCase(),
    color: 'draft',
  }
  return (
    <span className={`badge badge-${cfg.color}`}>
      <span className="badge-dot" />
      {cfg.label}
    </span>
  )
}
