'use client'

import { useState } from 'react'
import { CopyIcon, CheckIcon } from './icons'

// Click-to-copy affordance for short values (account numbers, doc numbers).
// Shows a brief "Copied!" check on success; silently no-ops where the
// Clipboard API is unavailable (e.g. insecure context).
export default function CopyButton({ value, label = 'Copy', size = 16, className = '' }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const text = String(value ?? '').trim()
    if (!text || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — leave the value for manual copy */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`icon-btn ${className}`}
      aria-label={copied ? 'Copied' : label}
      title={copied ? 'Copied!' : label}
      style={copied ? { color: 'var(--success)' } : undefined}
    >
      {copied ? <CheckIcon size={size} /> : <CopyIcon size={size} />}
    </button>
  )
}
