import { useState } from 'react'
import './Avatar.css'

export default function Avatar({
  src,
  alt = '',
  name = '',
  size = 'md',
  online = false,
  className = '',
  ...props
}) {
  const [failedSrc, setFailedSrc] = useState(null)
  const imageFailed = Boolean(src && failedSrc === src)

  const displayName = alt || name || ''
  const getInitials = (text) => {
    if (!text) return '\u2022'
    const parts = text.trim().split(/\s+/)
    if (parts.length === 0 || !parts[0]) return '\u2022'
    const first = parts[0][0] || ''
    const second = parts[1]?.[0] || ''
    return (first + second).toUpperCase()
  }

  const initials = getInitials(displayName)
  const showFallback = !src || imageFailed

  // Map medium/small/large for backward compatibility
  const resolvedSize = {
    small: 'sm',
    medium: 'md',
    large: 'lg',
  }[size] || size

  return (
    <span
      className={`gf-avatar gf-avatar--${resolvedSize} ${className}`.trim()}
      {...props}
    >
      {showFallback ? (
        <>
          <span className="gf-avatar__fallback" aria-hidden="true">
            {initials}
          </span>
          <span className="gf-avatar__sr-only">{displayName}</span>
        </>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setFailedSrc(src)}
          className="gf-avatar__image"
        />
      )}
      {online && (
        <span
          className="gf-avatar__badge gf-avatar__badge--online"
          aria-label="Online"
          role="status"
        />
      )}
    </span>
  )
}
