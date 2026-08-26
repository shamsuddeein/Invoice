'use client'

import { useEffect } from 'react'
import { XIcon } from './icons'

// Centered dialog with backdrop. Closes on Esc / backdrop click unless onClose
// is withheld (e.g. while a confirm action is in flight). Locks body scroll.
export default function Modal({ open, onClose, title, titleAdornment, children, footer, width = 520 }) {
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => onClose?.()} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-surface rounded-lg shadow-lg w-full flex flex-col max-h-[calc(100dvh-2rem)]"
        style={{ maxWidth: width }}
      >
        {title && (
          <div className="flex items-center justify-between gap-2 px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="t-h3 truncate">{title}</h2>
              {titleAdornment}
            </div>
            <button className="icon-btn shrink-0" onClick={() => onClose?.()} aria-label="Close">
              <XIcon size={18} />
            </button>
          </div>
        )}
        <div className="px-6 py-5 overflow-y-auto grow">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-border shrink-0">{footer}</div>
        )}
      </div>
    </div>
  )
}
