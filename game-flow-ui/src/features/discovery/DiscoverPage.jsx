import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Chip } from '../../components/ui/Surface'
import { EmptyState, ErrorState } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import DiscoveryFilters from './components/DiscoveryFilters'
import DiscoverySearch from './components/DiscoverySearch'
import ProjectGrid from './components/ProjectGrid'
import { useDiscoveryCollection } from './hooks/useDiscoveryCollection'
import './DiscoverPage.css'

const FILTERABLE_TYPES = new Set(['project', 'game', 'asset'])

function searchableProjectText(project) {
  return [
    project.title,
    project.summary,
    project.category,
    project.projectType,
    project.contentType,
    project.creator.name,
    project.creator.username,
    ...project.tools,
    ...project.tags,
  ].filter(Boolean).join(' ').toLocaleLowerCase()
}

function creatorKey(creator) {
  return String(creator.id || creator.username || creator.name || '').toLocaleLowerCase()
}

function deriveCreators(projects) {
  const creators = new Map()
  projects.forEach(({ creator }) => {
    const key = creatorKey(creator)
    if (key && !creators.has(key)) creators.set(key, creator)
  })
  return [...creators.values()]
}

function deriveTags(projects) {
  return [...new Set(projects.flatMap((project) => project.tags))]
}

export default function DiscoverPage() {
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const { data, loading, error, retry } = useDiscoveryCollection(token)
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [collaborationOnly, setCollaborationOnly] = useState(false)
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const items = data.items

  const assetTypes = useMemo(() => (
    [...new Set(items.map((project) => project.contentType).filter((type) => FILTERABLE_TYPES.has(type)))]
  ), [items])
  const collaborationSupported = items.some((project) => project.collaboration.open === true)
  const facetItems = items.filter((project) => (
    (selectedType === 'all' || project.contentType === selectedType)
    && (!collaborationOnly || project.collaboration.open === true)
  ))
  const projectResults = normalizedQuery
    ? facetItems.filter((project) => searchableProjectText(project).includes(normalizedQuery))
    : facetItems
  const creatorResults = normalizedQuery
    ? deriveCreators(facetItems).filter((creator) => (
        [creator.name, creator.username].filter(Boolean).join(' ').toLocaleLowerCase().includes(normalizedQuery)
      ))
    : []
  const tagResults = normalizedQuery
    ? deriveTags(facetItems).filter((tag) => tag.toLocaleLowerCase().includes(normalizedQuery))
    : []
  const resultCount = projectResults.length + creatorResults.length + tagResults.length
  const hasQueryResults = resultCount > 0

  const openCreator = (creator) => {
    const routeIdentity = creator.username || creator.id || creator.name
    if (!routeIdentity) return
    if (user && (creator.id === user.id || creator.id === user._id || creator.username === user.username)) {
      navigate('/app/profile')
    } else {
      navigate(`/app/creator/${encodeURIComponent(String(routeIdentity))}`)
    }
  }

  return (
    <main className="discover-page">
      <div className="discover-page__scroll">
        <header className="discover-page__header">
          <div className="discover-page__heading">
            <p>Explore real GameFlow work</p>
            <h1>Discover</h1>
          </div>
          <DiscoverySearch value={query} onChange={setQuery} onClear={() => setQuery('')} />
        </header>

        <DiscoveryFilters
          assetTypes={assetTypes}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          collaborationSupported={collaborationSupported}
          collaborationOnly={collaborationOnly}
          onCollaborationChange={setCollaborationOnly}
        />

        <section className="discover-page__results" aria-labelledby="discover-results-title">
          <div className="discover-page__results-heading">
            <div>
              <h2 id="discover-results-title">{normalizedQuery ? 'Search results' : 'Published work'}</h2>
              <p>{normalizedQuery ? `Matches for “${query.trim()}”` : 'From the currently loaded GameFlow collection'}</p>
            </div>
            {!loading && !error ? (
              <p className="discover-page__result-count" role="status" aria-live="polite">
                {normalizedQuery
                  ? `${projectResults.length} projects, ${creatorResults.length} creators, ${tagResults.length} tags`
                  : `${projectResults.length} projects loaded`}
              </p>
            ) : null}
          </div>

          {!normalizedQuery && !loading && !error && items.length ? (
            <p className="discover-page__guidance">Browse the loaded collection, choose a supported filter, or search by project, creator, tag, or tool.</p>
          ) : null}

          {error ? (
            <ErrorState
              title="Discover could not load"
              description={error.message || 'The project collection is unavailable.'}
              onRetry={retry}
              retrying={loading}
            />
          ) : null}

          {!error && loading ? <ProjectGrid projects={[]} loading /> : null}

          {!error && !loading && !items.length ? (
            <EmptyState
              title="No published work is available"
              description="Projects, games, and assets will appear here when the loaded collection contains them."
            />
          ) : null}

          {!error && !loading && !normalizedQuery && items.length > 0 && projectResults.length === 0 ? (
            <EmptyState
              title="No projects match these filters"
              description="Clear the current filters to return to the loaded collection."
              actionLabel="Clear filters"
              onAction={() => {
                setSelectedType('all')
                setCollaborationOnly(false)
              }}
            />
          ) : null}

          {!error && !loading && normalizedQuery && !hasQueryResults ? (
            <EmptyState
              title="No local results"
              description="Try another term or clear the current filters. Search only covers the loaded collection."
              actionLabel="Clear search and filters"
              onAction={() => {
                setQuery('')
                setSelectedType('all')
                setCollaborationOnly(false)
              }}
            />
          ) : null}

          {!error && !loading && normalizedQuery && creatorResults.length ? (
            <section className="discovery-result-group" aria-labelledby="creator-results-title">
              <h3 id="creator-results-title">Creators</h3>
              <ul className="discovery-creators">
                {creatorResults.map((creator) => {
                  const name = creator.username || creator.name || 'Creator'
                  return (
                    <li key={creatorKey(creator)}>
                      <button type="button" onClick={() => openCreator(creator)}>
                        <Avatar src={creator.avatarUrl} alt="" name={name} size="medium" />
                        <span><strong>{name}</strong><small>View creator profile</small></span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}

          {!error && !loading && normalizedQuery && tagResults.length ? (
            <section className="discovery-result-group" aria-labelledby="tag-results-title">
              <h3 id="tag-results-title">Tags</h3>
              <ul className="discovery-tags">
                {tagResults.map((tag) => (
                  <li key={tag}><Chip onClick={() => setQuery(tag)}>{tag}</Chip></li>
                ))}
              </ul>
            </section>
          ) : null}

          {!error && !loading && projectResults.length ? (
            <section className="discovery-result-group" aria-labelledby="project-results-title">
              <h3 id="project-results-title">Projects</h3>
              <ProjectGrid projects={projectResults} onOpenProject={(project) => navigate(project.routeTarget)} />
            </section>
          ) : null}
        </section>
      </div>
    </main>
  )
}
