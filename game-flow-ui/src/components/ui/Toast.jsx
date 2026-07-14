import React from 'react'

export function Toast({ message, type = 'info', onDismiss }) {
  const getThemeStyles = () => {
    switch (type) {
      case 'success':
        return { background: 'var(--gf-success)', color: '#FFFFFF' }
      case 'error':
        return { background: 'var(--gf-danger)', color: '#FFFFFF' }
      default:
        return { background: 'var(--gf-surface-raised)', color: 'var(--gf-text)' }
    }
  }

  return (
    <div 
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderRadius: 'var(--gf-radius-md)',
        boxShadow: 'var(--gf-shadow-floating)',
        gap: 12,
        minWidth: 280,
        maxWidth: 380,
        boxSizing: 'border-box',
        animation: 'gf-fade-in var(--gf-motion-fast)',
        ...getThemeStyles()
      }}
    >
      <span style={{ fontSize: 'var(--gf-text-label)', fontWeight: 500 }}>{message}</span>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            fontSize: 18,
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 44,
            minWidth: 44
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}
