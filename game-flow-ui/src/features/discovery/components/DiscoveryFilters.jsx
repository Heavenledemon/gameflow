import { useEffect, useRef, useState } from 'react'
import Chip from '../../../components/ui/Chip'

const TYPE_LABELS = {
  project: 'Projects',
  game: 'Games',
  asset: '3D assets',
  post: 'Posts',
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
  const selectedLabel = selectedType === 'all' ? 'All' : TYPE_LABELS[selectedType] || selectedType
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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 5h16M7 12h10M10 19h4" />
        </svg>
        <span>Filter</span>
        {hasActiveFilter ? <span className="discovery-filters__active-label">{selectedLabel}</span> : null}
      </button>

      {open ? <div id="discovery-filter-menu" className="discovery-filters__menu">
      {showTypes && (
        <div className="discovery-filters__group" role="group" aria-label="Asset type filter">
          <span className="discovery-filters__label">Asset Type</span>
          <div className="discovery-filters__scroller">
            <Chip
              active={selectedType === 'all'}
              onClick={() => { onTypeChange?.('all'); setOpen(false) }}
            >
              All
            </Chip>
            {assetTypes.map((type) => (
              <Chip
                key={type}
                active={selectedType === type}
                onClick={() => { onTypeChange?.(type); setOpen(false) }}
              >
                {TYPE_LABELS[type] || type}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {collaborationSupported && (
        <div className="discovery-filters__group" role="group" aria-label="Collaboration filter">
          <span className="discovery-filters__label">Collaboration</span>
          <div className="discovery-filters__scroller">
            <Chip
              active={!collaborationOnly}
              onClick={() => onCollaborationChange?.(false)}
            >
              Any
            </Chip>
            <Chip
              active={collaborationOnly}
              onClick={() => onCollaborationChange?.(true)}
            >
              Open to collaborate
            </Chip>
          </div>
        </div>
      )}
      </div> : null}
    </section>
  )
}
