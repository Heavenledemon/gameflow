
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

export { default as SegmentedControl } from './SegmentedControl'

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
