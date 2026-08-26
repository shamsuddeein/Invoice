import { forwardRef } from 'react'

const Textarea = forwardRef(function Textarea(
  { error = false, rows = 3, className = '', ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`textarea ${error ? 'error' : ''} ${className}`}
      {...props}
    />
  )
})

export default Textarea
