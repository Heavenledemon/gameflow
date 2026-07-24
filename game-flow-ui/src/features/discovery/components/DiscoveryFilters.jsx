import { useEffect, useRef, useState } from 'react'

const TYPE_CONFIG = {
  all: { label: 'All Content', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></svg>
  )},
  video: { label: 'Videos & GIFs', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3" /><polygon points="10 9 15 12 10 15 10 9" fill="currentColor" /></svg>
  )},
  image: { label: '2D Art & Images', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
  )},
  game: { label: 'WebGL Games', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" /><circle cx="15" cy="13" r="1" fill="currentColor" /><circle cx="17.5" cy="10.5" r="1" fill="currentColor" /><rect x="2" y="6" width="20" height="12" rx="4" /></svg>
  )},
  '3d': { label: '3D Assets & Models', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
  )},
  asset: { label: '3D Assets', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
  )},
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function DiscoveryFilters({
  assetTypes = [],
  selectedType = 'all',
  onTypeChange,
  collaborationSupported = false,
  collaborationOnly = false,
  onCollaborationChange,
}) {
  const [open, setOpen] = useState(false)
  const filtersRef = useRef(null)
  const showTypes = assetTypes.length > 1
  const selectedConfig = TYPE_CONFIG[selectedType] || { label: selectedType, icon: TYPE_CONFIG.all.icon }
  const hasActiveFilter = selectedType !== 'all' || collaborationOnly

  useEffect(() => {
    if (!open) return undefined
    const handlePointerDown = (event) => {
      if (!filtersRef.current?.contains(event.target)) setOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  if (!showTypes && !collaborationSupported) return null

  return (
    <section ref={filtersRef} className="discovery-filters" aria-labelledby="discovery-filters-title">
      <h2 id="discovery-filters-title" className="gf-sr-only">Discovery Filters</h2>

      <button
        type="button"
        className={`discovery-filters__trigger${hasActiveFilter ? ' discovery-filters__trigger--active' : ''}`}
        aria-expanded={open}
        aria-controls="discovery-filter-menu"
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        <span>Filter</span>
        {hasActiveFilter ? <span className="discovery-filters__active-label">{selectedConfig.label}</span> : null}
      </button>

      {open ? (
        <div id="discovery-filter-menu" className="discovery-filters__menu" role="dialog" aria-label="Filter options">
          {showTypes && (
            <div className="discovery-filters__group" role="group" aria-label="Content type filter">
              <span className="discovery-filters__label">Content Type</span>
              <div className="discovery-filters__options">
                <button
                  type="button"
                  className={`discovery-filters__option${selectedType === 'all' ? ' discovery-filters__option--active' : ''}`}
                  onClick={() => { onTypeChange?.('all'); setOpen(false) }}
                >
                  <span className="discovery-filters__option-icon">{TYPE_CONFIG.all.icon}</span>
                  <span className="discovery-filters__option-text">{TYPE_CONFIG.all.label}</span>
                  {selectedType === 'all' ? <span className="discovery-filters__option-check"><CheckIcon /></span> : null}
                </button>

                {assetTypes.map((type) => {
                  const conf = TYPE_CONFIG[type] || { label: type, icon: TYPE_CONFIG.all.icon }
                  const isSelected = selectedType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      className={`discovery-filters__option${isSelected ? ' discovery-filters__option--active' : ''}`}
                      onClick={() => { onTypeChange?.(type); setOpen(false) }}
                    >
                      <span className="discovery-filters__option-icon">{conf.icon}</span>
                      <span className="discovery-filters__option-text">{conf.label}</span>
                      {isSelected ? <span className="discovery-filters__option-check"><CheckIcon /></span> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {collaborationSupported && (
            <div className="discovery-filters__group" role="group" aria-label="Collaboration filter">
              <span className="discovery-filters__label">Collaboration</span>
              <div className="discovery-filters__options">
                <button
                  type="button"
                  className={`discovery-filters__option${!collaborationOnly ? ' discovery-filters__option--active' : ''}`}
                  onClick={() => onCollaborationChange?.(false)}
                >
                  <span className="discovery-filters__option-text">All Projects</span>
                  {!collaborationOnly ? <span className="discovery-filters__option-check"><CheckIcon /></span> : null}
                </button>
                <button
                  type="button"
                  className={`discovery-filters__option${collaborationOnly ? ' discovery-filters__option--active' : ''}`}
                  onClick={() => onCollaborationChange?.(true)}
                >
                  <span className="discovery-filters__option-text">Open to Collaborate</span>
                  {collaborationOnly ? <span className="discovery-filters__option-check"><CheckIcon /></span> : null}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}
