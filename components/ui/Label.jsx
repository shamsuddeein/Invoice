export default function Label({ children, htmlFor, required = false, className = '' }) {
  return (
    <label htmlFor={htmlFor} className={`label ${className}`}>
      {children}
      {required && <span className="text-error"> *</span>}
    </label>
  )
}
