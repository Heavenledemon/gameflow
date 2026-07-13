export function Field({ label, htmlFor, help, error, children }) {
  return <div className="gf-field">
    {label ? <label htmlFor={htmlFor} className="gf-field__label">{label}</label> : null}
    {children}
    {help && !error ? <small className="gf-field__help">{help}</small> : null}
    {error ? <small className="gf-field__error" role="alert">{error}</small> : null}
  </div>
}

export function Input({ invalid = false, className = '', ...props }) {
  return <input aria-invalid={invalid || undefined} className={`gf-input ${className}`} {...props} />
}

export function Textarea({ invalid = false, className = '', ...props }) {
  return <textarea aria-invalid={invalid || undefined} className={`gf-input gf-textarea ${className}`} {...props} />
}

export function Select({ invalid = false, className = '', children, ...props }) {
  return <select aria-invalid={invalid || undefined} className={`gf-input ${className}`} {...props}>{children}</select>
}
