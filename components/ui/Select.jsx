import { forwardRef } from 'react'

const Select = forwardRef(function Select({ error = false, className = '', children, ...props }, ref) {
  return (
    <select ref={ref} className={`select ${error ? 'error' : ''} ${className}`} {...props}>
      {children}
    </select>
  )
})

export default Select
