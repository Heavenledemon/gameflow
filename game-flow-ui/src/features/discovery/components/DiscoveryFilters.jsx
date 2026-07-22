import { Chip } from '../../../components/ui/Surface'

const TYPE_LABELS = {
  project: 'Projects',
  game: 'Games',
  asset: '3D assets',
  post: 'Posts',
}

export default function DiscoveryFilters({ assetTypes, selectedType, onTypeChange, collaborationSupported, collaborationOnly, onCollaborationChange }) {
  const showTypes = assetTypes.length > 1
  if (!showTypes && !collaborationSupported) return null

  return (
    <section className="discovery-filters" aria-labelledby="discovery-filters-title">
      <h2 id="discovery-filters-title">Filters</h2>
      {showTypes ? (
        <div className="discovery-filters__group" role="group" aria-label="Asset type">
          <span>Asset type</span>
          <div className="discovery-filters__scroller">
            <Chip selected={selectedType === 'all'} onClick={() => onTypeChange('all')}>All</Chip>
            {assetTypes.map((type) => (
              <Chip key={type} selected={selectedType === type} onClick={() => onTypeChange(type)}>
                {TYPE_LABELS[type] || type}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}
      {collaborationSupported ? (
        <div className="discovery-filters__group" role="group" aria-label="Collaboration availability">
          <span>Collaboration</span>
          <div className="discovery-filters__scroller">
            <Chip selected={!collaborationOnly} onClick={() => onCollaborationChange(false)}>Any</Chip>
            <Chip selected={collaborationOnly} onClick={() => onCollaborationChange(true)}>Open to collaborate</Chip>
          </div>
        </div>
      ) : null}
    </section>
  )
}
