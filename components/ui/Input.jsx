'use client'

import { forwardRef, useState } from 'react'
import { EyeIcon, EyeOffIcon } from './icons'

// `mono` switches to DM Mono tabular figures — use it for money and numeric
// fields (UI Rule 11). `error` paints the focus border red.
// When `type === 'password'`, automatically provides a view/hide password toggle.
const Input = forwardRef(function Input(
  { type, error = false, mono = false, className = '', ...props },
  ref
) {
  const [visible, setVisible] = useState(false)

  if (type === 'password') {
    return (
      <div className="relative flex items-center w-full">
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={`input ${mono ? 'input-mono' : ''} ${error ? 'error' : ''} pr-10 ${className}`}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary focus:outline-none transition-colors rounded cursor-pointer"
        >
          {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
        </button>
      </div>
    )
  }

  return (
    <input
      ref={ref}
      type={type}
      className={`input ${mono ? 'input-mono' : ''} ${error ? 'error' : ''} ${className}`}
      {...props}
    />
  )
})

export default Input
