'use client'

import { STATUS_TABS } from '@/lib/constants'

// Horizontal tab bar for the invoice list (doc §9). Active tab is underlined in
// gold; the rest are muted. Counts (optional) render as a trailing pill.
export default function StatusFilter({ value, onChange, counts }) {
  return (
    <div className="border-b border-border mb-4 overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {STATUS_TABS.map((tab) => {
          const active = value === tab.value
          const count = counts?.[tab.value]
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              className={`relative px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                active ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
              {count != null && (
                <span className="ml-1.5 text-xs text-text-muted mono">{count}</span>
              )}
              {active && (
                <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
