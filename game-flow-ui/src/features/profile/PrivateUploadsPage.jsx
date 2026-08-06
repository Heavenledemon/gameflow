import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { fetchMyPrivateProjects, updateProject, deleteProject, uploadProjectFile } from '../../lib/content'
import { ChevronLeftIcon, EditIcon, PlusIcon, TrashIcon } from '../../components/icons/Icons'
import IconButton from '../../components/ui/IconButton'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/Overlay'
import { EmptyState, ErrorState } from '../../components/ui/Feedback'
import ProjectGrid from '../discovery/components/ProjectGrid'
import ProjectManagementSheet from './components/ProjectManagementSheet'
import { mapPortfolioItems } from './profileAdapters'
import './ProfilePage.css'
import './PrivateUploadsPage.css'

export default function PrivateUploadsPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const { success, error: showError } = useToast()
  const [projects, setProjects] = useState([])
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [editingProject, setEditingProject] = useState(null)
  const [savingProject, setSavingProject] = useState(false)
  const [deletingProject, setDeletingProject] = useState(null)
  const [deleting, setDeleting] = useState(false)

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

  const saveProject = async (payload, previewFile) => {
    if (!editingProject) return
    const projectId = editingProject.id || editingProject._id || editingProject.contentId
    setSavingProject(true)
    try {
      if (previewFile) {
        await uploadProjectFile(token, projectId, { name: previewFile.name, relativePath: `cover/${previewFile.name}`, mimeType: previewFile.type || '' }, previewFile)
      }
      await updateProject(token, projectId, payload)
      setEditingProject(null)
      await load()
      success('Project updated successfully.')
    } catch (error) {
      showError(error.message || 'Failed to update project.')
    } finally {
      setSavingProject(false)
    }
  }

  const deleteOwnedProject = async () => {
    if (!deletingProject || deleting) return
    const projectId = deletingProject.id || deletingProject._id || deletingProject.contentId
    setDeleting(true)
    try {
      await deleteProject(token, projectId)
      setDeletingProject(null)
      await load()
      success('Project deleted successfully.')
    } catch (error) {
      showError(error.message || 'Failed to delete project.')
    } finally {
      setDeleting(false)
    }
  }

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
              actionsPlacement="below"
              renderActions={(project) => (
                <div className="private-uploads-card-actions">
                  <button
                    type="button"
                    className="private-uploads-action-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingProject(project.raw || project)
                    }}
                    title="Edit project details & privacy settings"
                  >
                    <EditIcon size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="private-uploads-action-btn private-uploads-action-btn--danger"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeletingProject(project.raw || project)
                    }}
                    title="Delete private project"
                  >
                    <TrashIcon size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            />
          ) : null}
        </div>
      </section>

      {/* Project Edit & Management Sheet */}
      {editingProject ? (
        <ProjectManagementSheet
          project={editingProject}
          saving={savingProject}
          onClose={() => setEditingProject(null)}
          onSave={saveProject}
        />
      ) : null}

      {/* Project Deletion Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(deletingProject)}
        title="Delete private project?"
        description={deletingProject?.title}
        message="This permanently deletes the project and cannot be undone."
        confirmLabel="Delete project"
        confirmLoading={deleting}
        onConfirm={deleteOwnedProject}
        onClose={() => !deleting && setDeletingProject(null)}
      />
    </main>
  )
}
