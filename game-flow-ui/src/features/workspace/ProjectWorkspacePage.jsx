import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Button } from '../../components/ui/Button'
import { ChevronLeftIcon, CommentIcon, ImageIcon, VideoIcon, FileIcon } from '../../components/icons/Icons'
import { Avatar } from '../../components/ui/Surface'
import { ErrorState, LoadingState } from '../../components/ui/Feedback'
import { uploadProjectFile } from '../../lib/content'
import { sendMessage } from '../../lib/messaging'
import { fetchProjectMembers } from '../../lib/collaboration'
import { deleteWorkspaceAsset, fetchAssetDownloadUrl, fetchWorkspace, fetchWorkspaceAssets, restoreWorkspaceAsset } from '../../lib/workspace'
import './workspace.css'

const formatBytes = (bytes = 0) => {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

export default function ProjectWorkspacePage() {
  const { projectId, section = 'overview' } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const { success, error: showError } = useToast()
  const [workspace, setWorkspace] = useState(null)
  const [assets, setAssets] = useState([])
  const [members, setMembers] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [assetView, setAssetView] = useState('active')
  const [assetActionId, setAssetActionId] = useState('')

  const activeSection = ['assets', 'team'].includes(section) ? section : 'overview'
  const load = useCallback(async () => {
    setStatus('loading'); setError('')
    try {
      const summary = await fetchWorkspace(token, projectId)
      const [assetData, memberData] = await Promise.all([fetchWorkspaceAssets(token, projectId), fetchProjectMembers(token, projectId)])
      setWorkspace(summary.workspace); setAssets(assetData.items || []); setMembers(memberData.items || []); setStatus('ready')
    } catch (loadError) { setError(loadError.message || 'Unable to load project workspace.'); setStatus('error') }
  }, [projectId, token])

  useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer) }, [load])
  const filteredAssets = useMemo(() => assets.filter((asset) => `${asset.name} ${asset.relativePath}`.toLowerCase().includes(search.trim().toLowerCase())), [assets, search])
  const go = (next) => navigate(next === 'overview' ? `/app/project/${projectId}/workspace` : `/app/project/${projectId}/workspace/${next}`)

  const refreshSummary = async () => { const summary = await fetchWorkspace(token, projectId); setWorkspace(summary.workspace) }

  const upload = async (event) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length || uploading) return
    setUploading(true)
    try {
      for (const file of files) await uploadProjectFile(token, projectId, { name: file.name, relativePath: file.webkitRelativePath || file.name, mimeType: file.type }, file)
      success(`${files.length} asset${files.length === 1 ? '' : 's'} uploaded.`); setAssetView('active'); await load(); go('assets')
    } catch (uploadError) { showError(uploadError.message || 'Unable to upload project assets.') }
    finally { setUploading(false) }
  }

  const download = async (asset) => {
    try { const result = await fetchAssetDownloadUrl(token, projectId, asset.id); window.open(result.url, '_blank', 'noopener,noreferrer') }
    catch (downloadError) { showError(downloadError.message || 'Unable to download this asset.') }
  }

  const shareToChat = async (asset) => {
    if (!workspace?.conversationId) return
    try {
      await sendMessage(token, workspace.conversationId, { body: `Shared ${asset.name}`, clientMessageId: crypto.randomUUID(), attachments: [{ type: 'project_asset', projectId, assetId: asset.id }] })
      success('Asset shared to project chat.')
    } catch (shareError) { showError(shareError.message || 'Unable to share this asset.') }
  }

  const remove = async (asset) => {
    if (!window.confirm(`Move ${asset.name} to trash?`)) return
    setAssetActionId(asset.id)
    try {
      await deleteWorkspaceAsset(token, projectId, asset.id)
      const data = await fetchWorkspaceAssets(token, projectId)
      setAssets(data.items || []); await refreshSummary(); success('Asset moved to trash. It can be restored for 7 days.')
    } catch (deleteError) { showError(deleteError.message || 'Unable to delete this asset.') }
    finally { setAssetActionId('') }
  }

  const changeAssetView = async (nextView) => {
    if (nextView === assetView) return
    setAssetView(nextView); setSearch('')
    try { const data = await fetchWorkspaceAssets(token, projectId, { status: nextView === 'trash' ? 'deleted' : 'ready' }); setAssets(data.items || []) }
    catch (viewError) { setAssetView('active'); showError(viewError.message || 'Unable to load deleted assets.') }
  }

  const restore = async (asset) => {
    setAssetActionId(asset.id)
    try {
      await restoreWorkspaceAsset(token, projectId, asset.id)
      const data = await fetchWorkspaceAssets(token, projectId, { status: 'deleted' })
      setAssets(data.items || []); await refreshSummary(); success(`${asset.name} restored to project assets.`)
    } catch (restoreError) { showError(restoreError.message || 'Unable to restore this asset.') }
    finally { setAssetActionId('') }
  }

  if (status === 'loading') return <main className="workspace-page"><LoadingState label="Loading project workspace" /></main>
  if (status === 'error' || !workspace) return <main className="workspace-page"><ErrorState title="Workspace unavailable" description={error} onRetry={load} /></main>
  const usagePercent = Math.min(100, Math.round((workspace.usage.projectBytes / Math.max(1, workspace.usage.projectLimitBytes)) * 100))

  return <main className="workspace-page">
    <header className="workspace-header">
      <button type="button" className="workspace-back-btn" onClick={() => navigate(`/app/project/${projectId}`)} aria-label="Back to project">
        <ChevronLeftIcon size={20} />
      </button>
      <div><span>Project workspace</span><h1>{workspace.project.title}</h1></div>
      {workspace.permissions.canUseChat && workspace.conversationId ? (
        <Button className="workspace-chat-btn" variant="secondary" onClick={() => navigate(`/app/inbox/${workspace.conversationId}`)}>
          <CommentIcon size={18} />
          <span>Open chat</span>
        </Button>
      ) : null}
    </header>
    <nav className="workspace-tabs" aria-label="Workspace sections">
      <div
        className="workspace-tabs__indicator"
        style={{
          transform: `translateX(${['overview', 'assets', 'team'].indexOf(activeSection) * 100}%)`,
        }}
      />
      {['overview', 'assets', 'team'].map((item) => (
        <button
          key={item}
          type="button"
          className={activeSection === item ? 'active' : ''}
          onClick={() => go(item)}
        >
          {item}
        </button>
      ))}
    </nav>

    {activeSection === 'overview' ? <section className="workspace-overview">
      <article className="workspace-hero">{workspace.project.previewUrl ? <img src={workspace.project.previewUrl} alt="" /> : null}<div><p>Your role</p><strong>{workspace.role}</strong><span>{workspace.permissions.canUseChat ? 'Project chat enabled' : 'Read-only review access'}</span></div></article>
      <div className="workspace-stats"><article><strong>{workspace.counts.assets}</strong><span>Assets</span></article><article><strong>{workspace.counts.members}</strong><span>Team members</span></article></div>
      <article className="workspace-storage"><div><strong>Project storage</strong><span>{formatBytes(workspace.usage.projectBytes)} of {formatBytes(workspace.usage.projectLimitBytes)}</span></div><progress value={usagePercent} max="100">{usagePercent}%</progress><small>{usagePercent}% used</small></article>
      <div className="workspace-quick-actions"><Button onClick={() => go('assets')}>View assets</Button>{workspace.permissions.canUploadAssets ? <label className="gf-button gf-button--secondary">{uploading ? 'Uploading…' : 'Upload assets'}<input hidden type="file" multiple disabled={uploading} onChange={upload} /></label> : null}</div>
    </section> : null}

    {activeSection === 'assets' ? <section className="workspace-assets">
      {workspace.permissions.canManageAssets ? (
        <div className="workspace-asset-views" role="group" aria-label="Asset status">
          <div
            className="workspace-asset-views__indicator"
            style={{
              transform: `translateX(${assetView === 'trash' ? '100%' : '0%'})`,
            }}
          />
          <button
            type="button"
            className={assetView === 'active' ? 'active' : ''}
            onClick={() => changeAssetView('active')}
          >
            Active assets
          </button>
          <button
            type="button"
            className={assetView === 'trash' ? 'active' : ''}
            onClick={() => changeAssetView('trash')}
          >
            Trash
          </button>
        </div>
      ) : null}
      <div className="workspace-assets__tools"><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={assetView === 'trash' ? 'Search trash' : 'Search assets'} aria-label={assetView === 'trash' ? 'Search trash' : 'Search assets'} />{assetView === 'active' && workspace.permissions.canUploadAssets ? <label className="gf-button gf-button--primary">{uploading ? 'Uploading…' : 'Upload'}<input hidden type="file" multiple disabled={uploading} onChange={upload} /></label> : null}</div>
       {!filteredAssets.length ? <p className="workspace-empty">{assetView === 'trash' ? 'Trash is empty.' : 'No project assets found.'}</p> : <div className="workspace-asset-list">{filteredAssets.map((asset) => <article key={asset.id} className="workspace-asset"><div className="workspace-asset__header"><div className="workspace-asset__icon">{asset.mimeType?.startsWith('image/') ? <ImageIcon size={20} /> : asset.mimeType?.startsWith('video/') ? <VideoIcon size={20} /> : <FileIcon size={20} />}</div><div className="workspace-asset__meta"><strong>{asset.name}</strong><span>{asset.relativePath} · {formatBytes(asset.size)}</span>{assetView === 'trash' ? <small>Deleted {asset.deletedAt ? new Date(asset.deletedAt).toLocaleDateString() : 'recently'} · permanently removed after 7 days</small> : <small>Uploaded by {asset.uploader?.name || asset.uploader?.username || 'project owner'}</small>}</div></div><div className="workspace-asset__actions">{assetView === 'trash' ? <Button loading={assetActionId === asset.id} onClick={() => restore(asset)}>Restore</Button> : <><Button variant="secondary" onClick={() => download(asset)}>Download</Button>{workspace.permissions.canUseChat ? <Button variant="secondary" onClick={() => shareToChat(asset)}>Share to chat</Button> : null}{workspace.permissions.canManageAssets ? <Button variant="danger" loading={assetActionId === asset.id} onClick={() => remove(asset)}>Delete</Button> : null}</>}</div></article>)}</div>}
    </section> : null}

    {activeSection === 'team' ? <section className="workspace-team"><h2>Project team</h2>{members.map((member) => <article key={member.userId}><Avatar src={member.avatar} name={member.name || member.username} /><div><strong>{member.name || member.username}</strong><span>@{member.username || 'creator'}</span></div><b>{member.role}</b></article>)}</section> : null}
  </main>
}
