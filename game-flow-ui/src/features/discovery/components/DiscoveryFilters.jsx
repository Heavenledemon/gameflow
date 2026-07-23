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
  const showTypes = assetTypes.length > 1
  if (!showTypes && !collaborationSupported) return null

  return (
    <section className="discovery-filters" aria-labelledby="discovery-filters-title">
      <h2 id="discovery-filters-title" className="gf-sr-only">Discovery Filters</h2>

      {showTypes && (
        <div className="discovery-filters__group" role="group" aria-label="Asset type filter">
          <span className="discovery-filters__label">Asset Type</span>
          <div className="discovery-filters__scroller">
            <Chip
              active={selectedType === 'all'}
              onClick={() => onTypeChange?.('all')}
            >
              All
            </Chip>
            {assetTypes.map((type) => (
              <Chip
                key={type}
                active={selectedType === type}
                onClick={() => onTypeChange?.(type)}
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
    </section>
  )
}
