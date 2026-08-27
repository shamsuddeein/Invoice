'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CheckIcon, AlertIcon, XIcon } from './icons'

// App-wide toast notifications. Mounted once in the authenticated layout so a
// toast raised right before router.push (create/delete flows) survives the
// navigation and shows on the destination page. Zero dependencies.
const ToastContext = createContext(null)

// Variant → accent colour (CSS token) + leading icon.
const VARIANTS = {
  success: { color: 'var(--success)', Icon: CheckIcon },
  error: { color: 'var(--error)', Icon: AlertIcon },
  info: { color: 'var(--accent)', Icon: AlertIcon },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (variant, message, opts = {}) => {
      if (!message) return
      const id = (idRef.current += 1)
      // Errors linger a little longer so they can be read.
      const duration = opts.duration ?? (variant === 'error' ? 5000 : 3500)
      setToasts((list) => [...list, { id, variant, message }])
      if (duration > 0) timers.current.set(id, setTimeout(() => dismiss(id), duration))
      return id
    },
    [dismiss]
  )

  const api = useMemo(
    () => ({
      toast: (message, opts) => push('info', message, opts),
      success: (message, opts) => push('success', message, opts),
      error: (message, opts) => push('error', message, opts),
      info: (message, opts) => push('info', message, opts),
      dismiss,
    }),
    [push, dismiss]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// Falls back to a no-op API if used outside the provider so a stray mount never
// crashes the page — it just won't show a toast (warned once in dev).
export function useToast() {
  const ctx = useContext(ToastContext)
  if (ctx) return ctx
  if (process.env.NODE_ENV !== 'production') {
    console.warn('useToast() called outside <ToastProvider>; toasts are disabled here.')
  }
  return NOOP
}
const NOOP = { toast: () => {}, success: () => {}, error: () => {}, info: () => {}, dismiss: () => {} }

// Fixed viewport: bottom-centered above the mobile tab bar; top-right on desktop.
// pointer-events-none on the strip so empty space never blocks clicks underneath.
function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null
  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed z-[60] flex flex-col gap-2 px-4 inset-x-0 items-center bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:inset-x-auto lg:bottom-auto lg:top-4 lg:right-6 lg:items-end lg:px-0"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }) {
  const { id, variant, message } = toast
  const v = VARIANTS[variant] || VARIANTS.info
  const Icon = v.Icon
  return (
    <div
      role="status"
      className="toast-item pointer-events-auto flex items-start gap-3 w-full max-w-sm rounded-lg bg-surface border border-border px-4 py-3"
      style={{ boxShadow: 'var(--shadow-lg)', borderLeft: `3px solid ${v.color}` }}
    >
      <span className="shrink-0 mt-0.5" style={{ color: v.color }}>
        <Icon size={18} />
      </span>
      <p className="flex-1 text-sm text-text-primary leading-snug">{message}</p>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        className="shrink-0 -mr-1 -mt-0.5 text-text-muted hover:text-text-primary transition-colors"
      >
        <XIcon size={16} />
      </button>
    </div>
  )
}
