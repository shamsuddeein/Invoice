// Metric tile (IMS style): white card with a colored rounded icon tile plus a
// muted uppercase label and a large dark value in DM Mono. Layout mirrors IMS —
// icon stacked on top on mobile (value gets the full card width, so a long
// unbreakable figure like ₦64,500 can never slide under the tile) and icon-left /
// text-right on desktop. `color` picks the tile hue; the value stays dark ink so
// figures read cleanly on white and the tile color carries the status meaning.
const TILE = {
  primary: 'var(--accent)',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
}

export default function MetricCard({ label, value, sub, icon, color = 'primary' }) {
  return (
    <div className="card" style={{ padding: '18px', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex flex-col lg:flex-row lg:items-start gap-3">
        {icon && (
          <span
            className="flex items-center justify-center shrink-0 text-white"
            style={{ width: 42, height: 42, borderRadius: 'var(--r-xl)', background: TILE[color] || TILE.primary }}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div
            className="text-xs font-medium uppercase"
            style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}
          >
            {label}
          </div>
          <div
            className="mono leading-none mt-2"
            style={{ color: 'var(--text-primary)', fontSize: 'clamp(19px, 4.5vw, 26px)', fontWeight: 700 }}
          >
            {value}
          </div>
          {sub && (
            <div className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
              {sub}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
