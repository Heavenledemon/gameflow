import { useEffect, useRef } from 'react'

export function Dialog({ open, title, onClose, children }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement
    ref.current?.focus()
    const handleKey = (event) => { if (event.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = ''; previous?.focus?.() }
  }, [open, onClose])
  if (!open) return null
  return <div className="gf-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.() }}>
    <section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="gf-dialog-title" className="gf-dialog">
      <header className="gf-dialog__header"><h2 id="gf-dialog-title">{title}</h2><IconClose onClick={onClose} /></header>
      {children}
    </section>
  </div>
}

export function BottomSheet({ open, title, onClose, children }) { return <Dialog open={open} title={title} onClose={onClose}><div className="gf-sheet-content">{children}</div></Dialog> }
function IconClose({ onClick }) { return <button type="button" aria-label="Close" className="gf-overlay__close" onClick={onClick}>×</button> }
