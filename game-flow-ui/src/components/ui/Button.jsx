export function Button({ ref, variant = 'primary', loading = false, disabled = false, className = '', type = 'button', children, ...props }) {
  return <button ref={ref} type={type} className={`gf-button gf-button--${variant} ${className}`.trim()} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
    {loading ? <span aria-hidden="true" className="gf-spinner" /> : null}
    {children}
  </button>
}

export function IconButton({ label, variant = 'ghost', loading = false, disabled = false, className = '', children, ...props }) {
  return <button type="button" aria-label={label} title={label} aria-busy={loading || undefined} disabled={disabled || loading} className={`gf-icon-button gf-icon-button--${variant} ${className}`.trim()} {...props}>
    {loading ? <span aria-hidden="true" className="gf-spinner" /> : children}
  </button>
}
