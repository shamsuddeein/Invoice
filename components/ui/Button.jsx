import LoadingSpinner from './LoadingSpinner'

// The one primary action per page is gold (variant="primary"). Everything else
// is secondary / ghost / danger (UI Rule 4). `loading` shows a spinner and
// disables the button.
const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
}

export default function Button({
  variant = 'primary',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`btn ${VARIANTS[variant] || VARIANTS.primary} ${className}`}
      {...props}
    >
      {loading && <LoadingSpinner size={16} />}
      {children}
    </button>
  )
}
