import React from 'react'

export function PageHeader({ title, children, rightAction }) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      borderBottom: '1px solid var(--gf-border)',
      background: 'var(--gf-surface)',
      minHeight: 56,
      boxSizing: 'border-box'
    }}>
      <h1 style={{
        fontSize: 'var(--gf-text-title)',
        fontWeight: 800,
        margin: 0,
        color: 'var(--gf-text)'
      }}>{title}</h1>
      {rightAction && <div>{rightAction}</div>}
      {children}
    </header>
  )
}

export function SectionHeader({ title, action }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 20px',
      background: 'transparent'
    }}>
      <h2 style={{
        fontSize: 'var(--gf-text-label)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--gf-text-muted)',
        margin: 0
      }}>{title}</h2>
      {action && <div>{action}</div>}
    </div>
  )
}

export function CreatorChip({ name, avatar, discipline }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '4px 8px',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: 'var(--gf-radius-pill)',
      minHeight: 44,
      boxSizing: 'border-box'
    }}>
      <img src={avatar} alt={name} style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        objectFit: 'cover'
      }} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gf-text)' }}>{name}</span>
        {discipline && <span style={{ fontSize: 10, color: 'var(--gf-text-subtle)' }}>{discipline}</span>}
      </div>
    </div>
  )
}

export function Tag({ label, onClick }) {
  return (
    <span 
      onClick={onClick}
      style={{
        padding: '6px 12px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--gf-border)',
        borderRadius: 'var(--gf-radius-sm)',
        fontSize: 'var(--gf-text-caption)',
        color: 'var(--gf-text-muted)',
        cursor: onClick ? 'pointer' : 'default',
        minHeight: 32,
        display: 'inline-flex',
        alignItems: 'center',
        boxSizing: 'border-box'
      }}
    >
      {label}
    </span>
  )
}

export function StatButton({ label, count, Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 12px',
        background: active ? 'rgba(255, 126, 126, 0.1)' : 'transparent',
        border: 'none',
        borderRadius: 'var(--gf-radius-md)',
        color: active ? 'var(--gf-brand)' : 'var(--gf-text-muted)',
        cursor: 'pointer',
        minHeight: 44,
        minWidth: 44,
        boxSizing: 'border-box'
      }}
    >
      {Icon && <Icon size={20} />}
      <span style={{ fontSize: 'var(--gf-text-caption)', fontWeight: 600, marginTop: 4 }}>
        {count ?? 0}
      </span>
    </button>
  )
}

export function LoadMoreTrigger({ loading, hasMore, onLoadMore }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      padding: '24px 16px',
      minHeight: 44
    }}>
      {loading ? (
        <span style={{ fontSize: 'var(--gf-text-caption)', color: 'var(--gf-text-subtle)' }}>Loading...</span>
      ) : hasMore ? (
        <button 
          onClick={onLoadMore}
          style={{
            padding: '8px 16px',
            background: 'var(--gf-surface)',
            border: '1px solid var(--gf-border)',
            borderRadius: 'var(--gf-radius-md)',
            color: 'var(--gf-text)',
            fontSize: 'var(--gf-text-label)',
            cursor: 'pointer',
            minHeight: 44,
            boxSizing: 'border-box'
          }}
        >
          Load More
        </button>
      ) : (
        <span style={{ fontSize: 'var(--gf-text-caption)', color: 'var(--gf-text-subtle)' }}>End of feed</span>
      )}
    </div>
  )
}
