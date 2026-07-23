export function Button({ ref, variant = 'primary', loading = false, disabled = false, className = '', type = 'button', children, ...props }) {
  return <button ref={ref} type={type} className={`gf-button gf-button--${variant} ${className}`.trim()} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
    {loading ? <span aria-hidden="true" className="gf-spinner" /> : null}
    {children}
  </button>
}

export { default as IconButton } from './IconButton'
