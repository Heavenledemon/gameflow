import { useState } from 'react'

export function Card({ className = '', children, ...props }) {
  return <section className={`gf-card ${className}`} {...props}>{children}</section>
}

export function Badge({ className = '', children, ...props }) {
  return <span className={`gf-badge ${className}`} {...props}>{children}</span>
}

export function Chip({ className = '', children, selected, disabled = false, loading = false, onClick, ...props }) {
  if (onClick) {
    return <button type="button" className={`gf-chip gf-chip--interactive ${selected ? 'gf-chip--selected' : ''} ${className}`.trim()} aria-pressed={selected} aria-busy={loading || undefined} disabled={disabled || loading} onClick={onClick} {...props}>
      {loading ? <span aria-hidden="true" className="gf-spinner" /> : null}{children}
    </button>
  }
  return <span className={`gf-chip ${selected ? 'gf-chip--selected' : ''} ${className}`.trim()} {...props}>{children}</span>
}

export function Avatar({ src, alt = '', name = '', size = 'medium', className = '', children, ...props }) {
  const [failedSrc, setFailedSrc] = useState(null)
  const imageFailed = Boolean(src && failedSrc === src)

  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const fallback = children || initials || '\u2022'
  const fallbackLabel = alt || name || undefined

  return <span className={`gf-avatar gf-avatar--${size} ${className}`.trim()} role={!src || imageFailed ? (fallbackLabel ? 'img' : undefined) : undefined} aria-label={!src || imageFailed ? fallbackLabel : undefined} {...props}>
    {src && !imageFailed ? <img src={src} alt={alt} onError={() => setFailedSrc(src)} /> : <span aria-hidden="true">{fallback}</span>}
  </span>
}

export function Divider() { return <hr className="gf-divider" /> }

export function ProgressBar({ value = 0, label }) {
  return <div className="gf-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={value} aria-label={label}>
    <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
}
