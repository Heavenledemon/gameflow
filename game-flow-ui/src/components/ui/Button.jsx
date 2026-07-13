export function Button({ variant = 'primary', loading = false, disabled = false, className = '', children, ...props }) {
  return <button className={`gf-button gf-button--${variant} ${className}`} disabled={disabled || loading} {...props}>
    {loading ? <span aria-hidden="true" className="gf-spinner" /> : null}
    {children}
  </button>
}

export function IconButton({ label, variant = 'ghost', className = '', children, ...props }) {
  return <button type="button" aria-label={label} title={label} className={`gf-icon-button gf-icon-button--${variant} ${className}`} {...props}>{children}</button>
}
