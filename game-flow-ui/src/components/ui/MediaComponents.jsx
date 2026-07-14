import React from 'react'

export function Skeleton({ width = '100%', height = '100%', borderRadius = 'var(--gf-radius-md)', style = {} }) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
      backgroundSize: '200% 100%',
      animation: 'gf-skeleton-pulse 1.5s infinite',
      ...style
    }} />
  )
}

export function EmptyState({ title, description, actionText, onAction }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      gap: 16
    }}>
      <div style={{ fontSize: 40, color: 'var(--gf-text-subtle)' }}>📥</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280 }}>
        <h3 style={{ fontSize: 'var(--gf-text-body)', fontWeight: 700, margin: 0, color: 'var(--gf-text)' }}>
          {title}
        </h3>
        {description && (
          <p style={{ fontSize: 'var(--gf-text-caption)', lineHeight: 1.4, color: 'var(--gf-text-muted)', margin: 0 }}>
            {description}
          </p>
        )}
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '8px 16px',
            background: 'var(--gf-brand)',
            border: 'none',
            borderRadius: 'var(--gf-radius-md)',
            color: '#FFFFFF',
            fontSize: 'var(--gf-text-label)',
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: 44,
            boxSizing: 'border-box'
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      gap: 16
    }}>
      <div style={{ fontSize: 40, color: 'var(--gf-danger)' }}>⚠️</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280 }}>
        <h3 style={{ fontSize: 'var(--gf-text-body)', fontWeight: 700, margin: 0, color: 'var(--gf-text)' }}>
          Something went wrong
        </h3>
        <p style={{ fontSize: 'var(--gf-text-caption)', lineHeight: 1.4, color: 'var(--gf-text-muted)', margin: 0 }}>
          {message || 'An error occurred while loading content.'}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--gf-border)',
            borderRadius: 'var(--gf-radius-md)',
            color: 'var(--gf-text)',
            fontSize: 'var(--gf-text-label)',
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: 44,
            boxSizing: 'border-box'
          }}
        >
          Retry
        </button>
      )}
    </div>
  )
}

export function MediaStage({ type, src, poster, alt, loading, error, onRetry }) {
  if (error) {
    return <ErrorState message="Failed to load media asset." onRetry={onRetry} />
  }

  if (loading) {
    return <Skeleton width="100%" height="100%" />
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      {type === 'video' ? (
        <video 
          src={src} 
          poster={poster} 
          controls 
          playsInline 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      ) : (
        <img 
          src={src || poster} 
          alt={alt || 'Media stage content'} 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
      )}
    </div>
  )
}
