import { forwardRef } from 'react'

// `mono` switches to DM Mono tabular figures — use it for money and numeric
// fields (UI Rule 11). `error` paints the focus border red.
const Input = forwardRef(function Input({ error = false, mono = false, className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`input ${mono ? 'input-mono' : ''} ${error ? 'error' : ''} ${className}`}
      {...props}
    />
  )
})

export default Input
