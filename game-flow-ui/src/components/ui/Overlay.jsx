import { useEffect, useId, useRef } from 'react'
import { Button, IconButton } from './Button'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

let scrollLockCount = 0
let originalBodyOverflow = ''
const modalStack = []

function lockPageScroll() {
  if (scrollLockCount === 0) {
    originalBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  scrollLockCount += 1

  return () => {
    scrollLockCount = Math.max(0, scrollLockCount - 1)
    if (scrollLockCount === 0) document.body.style.overflow = originalBodyOverflow
  }
}

function useModalInteraction({ open, onClose, containerRef, initialFocusRef, closeOnEscape }) {
  const onCloseRef = useRef(onClose)
  const modalIdRef = useRef(Symbol('gameflow-modal'))
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined

    const previousActive = document.activeElement
    const modalId = modalIdRef.current
    modalStack.push(modalId)
    const unlockPageScroll = lockPageScroll()
    const focusFrame = window.requestAnimationFrame(() => {
      const preferredTarget = initialFocusRef?.current
      const firstFocusable = containerRef.current?.querySelector(FOCUSABLE_SELECTOR)
      ;(preferredTarget || firstFocusable || containerRef.current)?.focus()
    })

    const handleKeyDown = (event) => {
      if (modalStack[modalStack.length - 1] !== modalId) return

      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault()
        onCloseRef.current?.()
        return
      }

      if (event.key !== 'Tab' || !containerRef.current) return
      const focusable = [...containerRef.current.querySelectorAll(FOCUSABLE_SELECTOR)]
      if (!focusable.length) {
        event.preventDefault()
        containerRef.current.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      const stackIndex = modalStack.lastIndexOf(modalId)
      if (stackIndex >= 0) modalStack.splice(stackIndex, 1)
      unlockPageScroll()
      if (previousActive instanceof HTMLElement && previousActive.isConnected) previousActive.focus()
    }
  }, [open, closeOnEscape, containerRef, initialFocusRef])
}

function ModalFrame({ open, title, description, onClose, children, variant = 'dialog', closeLabel = 'Close', closeOnBackdrop = true, closeOnEscape = true, initialFocusRef, className = '', contentClassName = '' }) {
  const containerRef = useRef(null)
  const generatedId = useId()
  const titleId = `${generatedId}-title`
  const descriptionId = description ? `${generatedId}-description` : undefined

  useModalInteraction({ open, onClose, containerRef, initialFocusRef, closeOnEscape })

  if (!open) return null

  const isSheet = variant === 'sheet'
  return (
    <div
      className={`gf-overlay ${isSheet ? 'gf-overlay--sheet' : ''}`.trim()}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose?.()
      }}
    >
      <section
        ref={containerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={`${isSheet ? 'gf-sheet' : 'gf-dialog'} ${className}`.trim()}
      >
        {isSheet ? <span className="gf-sheet__handle" aria-hidden="true" /> : null}
        <header className="gf-dialog__header">
          <div className="gf-dialog__heading">
            <h2 id={titleId} className="gf-dialog__title">{title}</h2>
            {description ? <p id={descriptionId} className="gf-dialog__description">{description}</p> : null}
          </div>
          <IconButton label={closeLabel} onClick={onClose}>&times;</IconButton>
        </header>
        <div className={`gf-dialog__content ${contentClassName}`.trim()}>{children}</div>
      </section>
    </div>
  )
}

export function Dialog(props) {
  return <ModalFrame {...props} variant="dialog" />
}

export { default as Sheet } from './Sheet'
export { default as BottomSheet } from './Sheet'

export function ConfirmDialog({ open, title, description, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', confirmVariant = 'danger', confirmLoading = false, onConfirm, onClose }) {
  const cancelRef = useRef(null)

  return (
    <Dialog open={open} title={title} description={description} onClose={onClose} initialFocusRef={cancelRef} closeOnBackdrop={!confirmLoading} closeOnEscape={!confirmLoading}>
      <div className="gf-confirm-dialog">
        {message ? <p className="gf-confirm-dialog__message">{message}</p> : null}
        <div className="gf-confirm-dialog__actions">
          <Button ref={cancelRef} variant="secondary" disabled={confirmLoading} onClick={onClose}>{cancelLabel}</Button>
          <Button variant={confirmVariant} loading={confirmLoading} onClick={() => {
            onConfirm?.()
            onClose?.()
          }}>{confirmLabel}</Button>
        </div>
      </div>
    </Dialog>
  )
}
