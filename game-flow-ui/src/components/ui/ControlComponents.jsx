import { useId, useRef } from 'react'

export function SearchField({ value, onChange, placeholder = 'Search...', label = 'Search', onClear }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: 48,
      background: 'rgba(255, 255, 255, 0.04)',
      border: '1px solid var(--gf-border)',
      borderRadius: 'var(--gf-radius-md)',
      padding: '0 16px',
      gap: 10,
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gf-text-subtle)" strokeWidth="2.2">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        aria-label={label}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--gf-text)',
          fontSize: 'var(--gf-text-body)',
          fontFamily: 'inherit'
        }}
      />
      {value && onClear && (
        <button 
          type="button"
          aria-label="Clear search"
          onClick={onClear}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--gf-text-subtle)',
            fontSize: 16,
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 44,
            minWidth: 44,
            boxSizing: 'border-box'
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}

export function SegmentedControl({ options = [], selected, onSelect, semantics = 'buttons', label = 'View options', className = '' }) {
  const generatedId = useId()
  const itemRefs = useRef([])
  const isTabs = semantics === 'tabs'
  const selectedIndex = options.findIndex((option) => option.value === selected && !option.disabled)
  const firstEnabledIndex = options.findIndex((option) => !option.disabled)

  const moveTabFocus = (event, currentIndex) => {
    const enabledIndexes = options.map((option, index) => option.disabled ? null : index).filter((index) => index !== null)
    if (!enabledIndexes.length) return

    const currentPosition = enabledIndexes.indexOf(currentIndex)
    let nextIndex
    if (event.key === 'Home') nextIndex = enabledIndexes[0]
    else if (event.key === 'End') nextIndex = enabledIndexes[enabledIndexes.length - 1]
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = enabledIndexes[(currentPosition + 1) % enabledIndexes.length]
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = enabledIndexes[(currentPosition - 1 + enabledIndexes.length) % enabledIndexes.length]
    else return

    event.preventDefault()
    itemRefs.current[nextIndex]?.focus()
    onSelect?.(options[nextIndex].value)
  }

  return (
    <div className={`gf-segmented-control ${className}`.trim()} role={isTabs ? 'tablist' : 'group'} aria-label={label} aria-orientation={isTabs ? 'horizontal' : undefined}>
      {options.map((opt, index) => {
        const isSelected = selected === opt.value
        const tabId = `${generatedId}-tab-${index}`
        return (
          <button
            key={opt.value}
            ref={(node) => { itemRefs.current[index] = node }}
            type="button"
            role={isTabs ? 'tab' : undefined}
            id={isTabs ? tabId : undefined}
            aria-controls={isTabs ? opt.panelId : undefined}
            aria-selected={isTabs ? isSelected : undefined}
            aria-pressed={!isTabs ? isSelected : undefined}
            tabIndex={isTabs ? (isSelected || (selectedIndex < 0 && index === firstEnabledIndex) ? 0 : -1) : undefined}
            disabled={opt.disabled}
            onClick={() => onSelect?.(opt.value)}
            onKeyDown={isTabs ? (event) => moveTabFocus(event, index) : undefined}
            className="gf-segmented-control__item"
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function FilterBar({ items = [], selected, onSelect }) {
  return (
    <div className="scrollbar-hide" style={{
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      width: '100%',
      padding: '4px 20px',
      boxSizing: 'border-box',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      {items.map((item) => {
        const isSelected = selected === item
        return (
          <button
            key={item}
            type="button"
            onClick={() => onSelect?.(item)}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--gf-radius-pill)',
              background: isSelected ? 'var(--gf-brand)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isSelected ? 'transparent' : 'var(--gf-border)'}`,
              color: isSelected ? '#FFFFFF' : 'var(--gf-text-muted)',
              fontSize: 'var(--gf-text-label)',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all var(--gf-motion-fast)',
              minHeight: 44,
              boxSizing: 'border-box'
            }}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}
