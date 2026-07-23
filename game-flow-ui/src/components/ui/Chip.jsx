import './Chip.css'

export default function Chip({
  label,
  icon,
  active = false,
  onClick,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const isSelected = active || props.selected // Support selected for backward compatibility

  const chipContent = (
    <>
      {icon && <span className="gf-chip__icon" aria-hidden="true">{icon}</span>}
      <span className="gf-chip__label">{label || children}</span>
    </>
  )

  if (onClick) {
    return (
      <div className={`gf-chip-wrapper ${className}`.trim()}>
        <button
          type="button"
          className={`gf-chip gf-chip--interactive ${isSelected ? 'gf-chip--active' : ''}`}
          aria-pressed={isSelected}
          disabled={disabled}
          onClick={onClick}
          {...props}
        >
          {chipContent}
        </button>
      </div>
    )
  }

  return (
    <span
      className={`gf-chip ${isSelected ? 'gf-chip--active' : ''} ${className}`.trim()}
      {...props}
    >
      {chipContent}
    </span>
  )
}
