import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar'
import Chip from '../../components/ui/Chip'
import EmptyState, { ErrorState } from '../../components/ui/EmptyState'
import { useAuth } from '../../context/AuthContext'
import DiscoveryFilters from './components/DiscoveryFilters'
import DiscoverySearch from './components/DiscoverySearch'
import InstagramStories from './components/InstagramStories'
import ProjectGrid from './components/ProjectGrid'
import { useDiscoveryCollection } from './hooks/useDiscoveryCollection'
import { toProjectCardModelList } from '../project/model/projectCardModel'
import { getDiscoverSections, DISCOVER_FIXTURE_LABEL } from './discoverFixtures'
import './DiscoverPage.css'

const FILTERABLE_TYPES = new Set(['project', 'game', 'asset'])

function searchableProjectText(project) {
  return [
    project.title,
    project.summary,
    project.category,
    project.projectType,
    project.contentType,
    project.creator?.name,
    project.creator?.username,
    project.creator?.handle,
    ...(project.tools || []),
    ...(project.tags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function creatorKey(creator) {
  return String(creator?.id || creator?.username || creator?.handle || creator?.name || '').toLowerCase()
}

function deriveCreators(projects) {
  const creators = new Map()
  projects.forEach(({ creator }) => {
    if (!creator) return
    const key = creatorKey(creator)
    if (key && !creators.has(key)) creators.set(key, creator)
  })
  return [...creators.values()]
}

function deriveTags(projects) {
  return [...new Set(projects.flatMap((project) => project.tags || []))]
}

export default function DiscoverPage() {
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const { data, loading, error, retry } = useDiscoveryCollection(token)
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [collaborationOnly, setCollaborationOnly] = useState(false)
  const normalizedQuery = query.trim().toLowerCase()

  // Normalize raw collection through canonical ProjectCardModel
  const normalizedItems = useMemo(() => {
    return toProjectCardModelList(data?.items || [])
  }, [data?.items])

  const defaultSections = useMemo(() => {
    return getDiscoverSections(data?.items || [])
  }, [data?.items])

  const assetTypes = useMemo(() => (
    [...new Set(normalizedItems.map((project) => project.contentType).filter((type) => FILTERABLE_TYPES.has(type)))]
  ), [normalizedItems])

  const collaborationSupported = normalizedItems.some((project) => project.collaborationOpen === true || project.collaboration?.open === true)

  const facetItems = useMemo(() => {
    return normalizedItems.filter((project) => (
      (selectedType === 'all' || project.contentType === selectedType) &&
      (!collaborationOnly || project.collaborationOpen === true || project.collaboration?.open === true)
    ))
  }, [normalizedItems, selectedType, collaborationOnly])

  const projectResults = useMemo(() => {
    return normalizedQuery
      ? facetItems.filter((project) => searchableProjectText(project).includes(normalizedQuery))
      : facetItems
  }, [normalizedQuery, facetItems])

  const creatorResults = useMemo(() => {
    return normalizedQuery
      ? deriveCreators(facetItems).filter((creator) => (
        [creator.name, creator.username, creator.handle].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery)
      ))
      : []
  }, [normalizedQuery, facetItems])

  const tagResults = useMemo(() => {
    return normalizedQuery
      ? deriveTags(facetItems).filter((tag) => tag.toLowerCase().includes(normalizedQuery))
      : []
  }, [normalizedQuery, facetItems])

  const resultCount = projectResults.length + creatorResults.length + tagResults.length
  const hasQueryResults = resultCount > 0

  const openCreator = (creator) => {
    const routeIdentity = creator.username || creator.handle || creator.id || creator.name
    if (!routeIdentity) return
    if (user && (creator.id === user.id || creator.id === user._id || creator.username === user.username)) {
      navigate('/app/profile')
    } else {
      navigate(`/app/creator/${encodeURIComponent(String(routeIdentity))}`)
    }
  }

  const openProject = (project) => {
    if (project.canonicalRoute || project.routeTarget) {
      navigate(project.canonicalRoute || project.routeTarget)
    }
  }

  return (
    <main className="discover-page">
      <div className="discover-page__scroll">
        <header className="discover-page__header">
          <div className="discover-page__heading">
            {/* <p>Explore creative projects</p> */}
            <h1>Discover</h1>
          </div>
          {/* Focus Order Step 1: Search Field */}
          <DiscoverySearch value={query} onChange={setQuery} onClear={() => setQuery('')} />
        </header>

        <InstagramStories />

        {/* Focus Order Step 3: Results Grid & Sections */}
        <section className="discover-page__results" aria-labelledby="discover-results-title">
          <div className="discover-page__results-heading">
            <div>
              <h2 id="discover-results-title">
                {normalizedQuery ? 'Search Results' : 'Discover Work'}
              </h2>
              <p>
                {normalizedQuery
                  ? `Matches for “${query.trim()}”`
                  : defaultSections.isFixture
                    ? `${DISCOVER_FIXTURE_LABEL} (GameFlow Curated)`
                    : ''}
              </p>
            </div>
            {!loading && !error ? (
              <p className="discover-page__result-count" role="status" aria-live="polite">
                {normalizedQuery
                  ? `${projectResults.length} projects, ${creatorResults.length} creators, ${tagResults.length} tags`
                  : `${projectResults.length} projects`}
              </p>
            ) : null}
            <DiscoveryFilters
              assetTypes={assetTypes}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              collaborationSupported={collaborationSupported}
              collaborationOnly={collaborationOnly}
              onCollaborationChange={setCollaborationOnly}
            />
          </div>

          {error ? (
            <ErrorState
              title="Discover could not load"
              description={error.message || 'The project collection is unavailable.'}
              onRetry={retry}
              retrying={loading}
            />
          ) : null}

          {!error && loading ? <ProjectGrid items={[]} loading /> : null}

          {!error && !loading && !normalizedItems.length && !defaultSections.trending.length ? (
            <EmptyState
              title="No published work available"
              description="Projects, games, and 3D assets will appear here when published."
            />
          ) : null}

          {!error && !loading && !normalizedQuery && normalizedItems.length > 0 && projectResults.length === 0 ? (
            <EmptyState
              title="No projects match these filters"
              description="Clear the active filters to see all available projects."
              action={{
                label: 'Clear filters',
                onClick: () => {
                  setSelectedType('all')
                  setCollaborationOnly(false)
                },
              }}
            />
          ) : null}

          {!error && !loading && normalizedQuery && !hasQueryResults ? (
            <EmptyState
              title="No results found"
              description="Try another term or clear the active filters."
              action={{
                label: 'Clear search and filters',
                onClick: () => {
                  setQuery('')
                  setSelectedType('all')
                  setCollaborationOnly(false)
                },
              }}
            />
          ) : null}

          {/* Creators Section */}
          {!error && !loading && normalizedQuery && creatorResults.length ? (
            <section className="discovery-result-group" aria-labelledby="creator-results-title">
              <h3 id="creator-results-title">Creators</h3>
              <ul className="discovery-creators">
                {creatorResults.map((creator) => {
                  const name = creator.name || creator.username || creator.handle || 'Creator'
                  const handle = creator.handle || creator.username || name
                  return (
                    <li key={creatorKey(creator)}>
                      <button type="button" onClick={() => openCreator(creator)}>
                        <Avatar src={creator.avatarUrl} alt="" name={name} size="md" />
                        <span>
                          <strong>{name}</strong>
                          <small>@{handle}</small>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}

          {/* Tags Section */}
          {!error && !loading && normalizedQuery && tagResults.length ? (
            <section className="discovery-result-group" aria-labelledby="tag-results-title">
              <h3 id="tag-results-title">Tags</h3>
              <ul className="discovery-tags">
                {tagResults.map((tag) => (
                  <li key={tag}>
                    <Chip onClick={() => setQuery(tag)}>{tag}</Chip>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Search Active Projects */}
          {!error && !loading && normalizedQuery && projectResults.length ? (
            <section className="discovery-result-group" aria-labelledby="project-results-title">
              <h3 id="project-results-title">Projects</h3>
              <ProjectGrid items={projectResults} onOpenProject={openProject} />
            </section>
          ) : null}

          {/* Default Non-Query View: Trending & Featured Sections */}
          {!error && !loading && !normalizedQuery && (
            <>
              {defaultSections.trending.length > 0 && (
                <section className="discovery-result-group" aria-labelledby="trending-title">
                  <h3 id="trending-title">Trending</h3>
                  <ProjectGrid items={defaultSections.trending} onOpenProject={openProject} />
                </section>
              )}

              {defaultSections.recent.length > 0 && (
                <section className="discovery-result-group" aria-labelledby="recent-title">
                  <h3 id="recent-title">Recent</h3>
                  <ProjectGrid items={defaultSections.recent} onOpenProject={openProject} />
                </section>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  )
}
