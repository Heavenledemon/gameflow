import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './Sheet.css'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
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
    if (scrollLockCount === 0) {
      document.body.style.overflow = originalBodyOverflow
    }
  }
}

export default function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  closeLabel = 'Close',
  className = '',
  contentClassName = '',
}) {
  const containerRef = useRef(null)
  const generatedId = useId()
  const titleId = `${generatedId}-title`
  const descriptionId = description ? `${generatedId}-description` : undefined
  const modalIdRef = useRef(Symbol('gameflow-sheet'))
  const onCloseRef = useRef(onClose)
  const dragRef = useRef({ startY: 0, startTime: 0, moved: false })

  const [shouldRender, setShouldRender] = useState(open)
  const [active, setActive] = useState(open)
  const [dragOffset, setDragOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    let frameId
    let timerId
    if (open) {
      frameId = requestAnimationFrame(() => {
        setDragOffset(0)
        setShouldRender(true)
        frameId = requestAnimationFrame(() => {
          setActive(true)
        })
      })
    } else {
      frameId = requestAnimationFrame(() => {
        setActive(false)
        timerId = setTimeout(() => {
          setShouldRender(false)
        }, 220)
      })
    }
    return () => {
      cancelAnimationFrame(frameId)
      clearTimeout(timerId)
    }
  }, [open])

  const startDrag = (event) => {
    if (event.button !== undefined && event.button !== 0) return
    dragRef.current = { startY: event.clientY, startTime: performance.now(), moved: false }
    setDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const moveDrag = (event) => {
    if (!dragging) return
    const distance = Math.max(0, event.clientY - dragRef.current.startY)
    if (distance > 6) dragRef.current.moved = true
    setDragOffset(distance)
  }

  const finishDrag = (event) => {
    if (!dragging) return
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    const elapsed = Math.max(1, performance.now() - dragRef.current.startTime)
    const finalOffset = Math.max(dragOffset, event.clientY - dragRef.current.startY)
    const velocity = finalOffset / elapsed
    const threshold = Math.min(120, (containerRef.current?.offsetHeight || 480) * 0.22)
    setDragging(false)
    if (finalOffset >= threshold || (finalOffset > 32 && velocity > 0.55)) {
      onCloseRef.current?.()
    } else {
      setDragOffset(0)
    }
  }

  useEffect(() => {
    if (!shouldRender || !active) return undefined

    const previousActive = document.activeElement
    const modalId = modalIdRef.current
    modalStack.push(modalId)
    const unlockPageScroll = lockPageScroll()

    // Focus trap focus target initialization
    const focusFrame = requestAnimationFrame(() => {
      const firstFocusable = containerRef.current?.querySelector(FOCUSABLE_SELECTOR)
      ;(firstFocusable || containerRef.current)?.focus()
    })

    const handleKeyDown = (event) => {
      if (modalStack[modalStack.length - 1] !== modalId) return

      if (event.key === 'Escape') {
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
      if (previousActive instanceof HTMLElement && previousActive.isConnected) {
        previousActive.focus()
      }
    }
  }, [shouldRender, active])

  if (!shouldRender) return null

  return createPortal(
    <div
      className={`gf-sheet-backdrop ${active ? 'gf-sheet-backdrop--active' : ''}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <section
        ref={containerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={`gf-sheet-panel ${active ? 'gf-sheet-panel--active' : ''} ${dragging ? 'gf-sheet-panel--dragging' : ''} ${className}`.trim()}
        style={dragOffset ? { transform: `translateY(${dragOffset}px)` } : undefined}
      >
        <button
          type="button"
          className="gf-sheet__handle"
          aria-label={`${closeLabel}. Drag down to dismiss.`}
          onClick={() => {
            if (!dragRef.current.moved) onClose?.()
            dragRef.current.moved = false
          }}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={finishDrag}
          onPointerCancel={() => {
            setDragging(false)
            setDragOffset(0)
          }}
        />
        <header className="gf-sheet__header">
          <div className="gf-sheet__heading">
            <h2 id={titleId} className="gf-sheet__title">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="gf-sheet__description">
                {description}
              </p>
            ) : null}
          </div>
        </header>
        <div className={`gf-sheet__content ${contentClassName}`.trim()}>
          {children}
        </div>
      </section>
    </div>,
    document.body,
  )
}
