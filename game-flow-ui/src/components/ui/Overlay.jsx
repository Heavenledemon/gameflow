import React, { useEffect, useRef } from 'react'

export function Dialog({ open, title, onClose, children }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const previousActive = document.activeElement
    ref.current?.focus()

    const handleKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
      previousActive?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: 24,
        boxSizing: 'border-box'
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <section 
        ref={ref} 
        tabIndex={-1} 
        role="dialog" 
        aria-modal="true" 
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'var(--gf-surface)',
          border: '1px solid var(--gf-border)',
          borderRadius: 'var(--gf-radius-lg)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: 'var(--gf-shadow-modal)',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      >
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--gf-border)',
          paddingBottom: 12
        }}>
          <h2 style={{
            fontSize: 'var(--gf-text-body)',
            fontWeight: 700,
            margin: 0,
            color: 'var(--gf-text)'
          }}>{title}</h2>
          <button 
            type="button" 
            aria-label="Close" 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              color: 'var(--gf-text-subtle)',
              minHeight: 44,
              minWidth: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </header>
        <div style={{ boxSizing: 'border-box' }}>
          {children}
        </div>
      </section>
    </div>
  )
}

export function BottomSheet({ open, title, onClose, children }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const previousActive = document.activeElement
    ref.current?.focus()

    const handleKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
      previousActive?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 10000,
        boxSizing: 'border-box'
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <section 
        ref={ref} 
        tabIndex={-1} 
        role="dialog" 
        aria-modal="true" 
        style={{
          width: '100%',
          maxWidth: 430,
          background: 'var(--gf-surface)',
          borderTopLeftRadius: 'var(--gf-radius-lg)',
          borderTopRightRadius: 'var(--gf-radius-lg)',
          padding: '24px 20px calc(24px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: 'var(--gf-shadow-modal)',
          outline: 'none',
          boxSizing: 'border-box',
          animation: 'gf-slide-up var(--gf-motion-sheet)'
        }}
      >
        <div style={{
          width: 36,
          height: 4,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 2,
          margin: '-12px auto 8px'
        }} />
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--gf-border)',
          paddingBottom: 12
        }}>
          <h2 style={{
            fontSize: 'var(--gf-text-body)',
            fontWeight: 700,
            margin: 0,
            color: 'var(--gf-text)'
          }}>{title}</h2>
          <button 
            type="button" 
            aria-label="Close" 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              color: 'var(--gf-text-subtle)',
              minHeight: 44,
              minWidth: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </header>
        <div style={{ overflowY: 'auto', maxHeight: '70vh', boxSizing: 'border-box' }}>
          {children}
        </div>
      </section>
    </div>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onClose }) {
  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <p style={{
          fontSize: 'var(--gf-text-label)',
          lineHeight: 1.5,
          color: 'var(--gf-text-muted)',
          margin: 0
        }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid var(--gf-border)',
              borderRadius: 'var(--gf-radius-md)',
              color: 'var(--gf-text)',
              fontWeight: 600,
              fontSize: 'var(--gf-text-caption)',
              cursor: 'pointer',
              minHeight: 44,
              boxSizing: 'border-box'
            }}
          >
            {cancelLabel}
          </button>
          <button 
            onClick={() => {
              onConfirm?.()
              onClose?.()
            }}
            style={{
              padding: '8px 16px',
              background: 'var(--gf-danger)',
              border: 'none',
              borderRadius: 'var(--gf-radius-md)',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: 'var(--gf-text-caption)',
              cursor: 'pointer',
              minHeight: 44,
              boxSizing: 'border-box'
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
