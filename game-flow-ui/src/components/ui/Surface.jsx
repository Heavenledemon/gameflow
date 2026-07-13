export function Card({ className = '', children, ...props }) {
  return <section className={`gf-card ${className}`} {...props}>{children}</section>
}

export function Badge({ className = '', children, ...props }) {
  return <span className={`gf-badge ${className}`} {...props}>{children}</span>
}

export function Chip({ className = '', children, ...props }) {
  return <span className={`gf-chip ${className}`} {...props}>{children}</span>
}

export function Avatar({ src, alt = '', size = 'medium', children }) {
  return <span className={`gf-avatar gf-avatar--${size}`}>
    {src ? <img src={src} alt={alt} /> : <span aria-hidden="true">{children || '•'}</span>}
  </span>
}

export function Divider() { return <hr className="gf-divider" /> }

export function ProgressBar({ value = 0, label }) {
  return <div className="gf-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={value} aria-label={label}>
    <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
}
