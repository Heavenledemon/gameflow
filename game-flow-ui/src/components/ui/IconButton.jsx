import './IconButton.css'

export default function IconButton({
  label,
  icon,
  onClick,
  disabled = false,
  loading = false,
  active = false,
  size = 'md',
  variant = 'ghost',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-busy={loading || undefined}
      aria-pressed={active ? true : undefined}
      disabled={disabled || loading}
      onClick={onClick}
      className={`gf-icon-button gf-icon-button--${size} gf-icon-button--${variant} ${active ? 'gf-icon-button--active' : ''} ${className}`.trim()}
      {...props}
    >
      {loading ? (
        <span aria-hidden="true" className="gf-spinner" />
      ) : (
        icon || children
      )}
    </button>
  )
}
