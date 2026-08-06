import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchMyPrivateProjects } from '../../lib/content'
import { ChevronLeftIcon, PlusIcon } from '../../components/icons/Icons'
import IconButton from '../../components/ui/IconButton'
import { Button } from '../../components/ui/Button'
import { EmptyState, ErrorState } from '../../components/ui/Feedback'
import ProjectGrid from '../discovery/components/ProjectGrid'
import { mapPortfolioItems } from './profileAdapters'
import './ProfilePage.css'
import './PrivateUploadsPage.css'

export default function PrivateUploadsPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [projects, setProjects] = useState([])
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState('')

  const load = useCallback(async (signal) => {
    setStatus('loading')
    setLoadError('')
    try {
      const result = await fetchMyPrivateProjects(token, { signal })
      if (signal?.aborted) return
      setProjects(result.projects || [])
      setStatus('ready')
    } catch (error) {
      if (error?.name === 'AbortError') return
      setLoadError(error.message || 'Unable to load private uploads.')
      setStatus('error')
    }
  }, [token])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const items = useMemo(() => mapPortfolioItems(projects), [projects])

  return (
    <main className="profile-page private-uploads-page">
      {/* Premium Top Navigation Bar matching Profile Header */}
      <div className="creator-header__topbar">
        <div className="creator-header__topbar-left">
          <IconButton label="Back to profile" onClick={() => navigate('/app/profile')}>
            <ChevronLeftIcon size={20} />
          </IconButton>
          <h1 className="creator-header__handle-title">Private uploads</h1>
        </div>
        <div className="creator-header__topbar-actions">
          <Button className="private-uploads-upload-btn" variant="primary" onClick={() => navigate('/app/upload')}>
            <PlusIcon size={16} />
            <span>Upload</span>
          </Button>
        </div>
      </div>

      {/* Portfolio Posts Layout matching User Profile */}
      <section className="portfolio" aria-label="Private portfolio">
        <div className="portfolio-tabs">
          <div className="portfolio-tabs__tab portfolio-tabs__tab--active">
            <span>Projects ({status === 'loading' ? '...' : items.length})</span>
          </div>
        </div>

        <div className="portfolio__panel">
          {status === 'error' ? (
            <ErrorState title="Private uploads unavailable" description={loadError} onRetry={() => load()} />
          ) : null}

          {status === 'ready' && !items.length ? (
            <EmptyState
              title="No private uploads"
              description="Only you can see these projects. Manage a project to add or remove it from your profile."
              actionLabel="Upload a project"
              onAction={() => navigate('/app/upload')}
            />
          ) : null}

          {status === 'loading' ? <ProjectGrid projects={[]} loading /> : null}

          {status === 'ready' && items.length ? (
            <ProjectGrid
              projects={items}
              onOpenProject={(project) => navigate(project.routeTarget)}
            />
          ) : null}
        </div>
      </section>
    </main>
  )
}
