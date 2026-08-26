import Label from './Label'

// Label + control + inline error, stacked on the 4px grid. Pass the control as
// children so the same wrapper works for Input / Select / Textarea.
export default function FormField({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
  className = '',
}) {
  return (
    <div className={`form-field ${className}`}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {hint && !error && <span className="t-small t-secondary">{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}
