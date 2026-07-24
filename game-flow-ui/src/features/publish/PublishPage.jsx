import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAppShell } from '../../context/AppShellContext'
import { useToast } from '../../context/ToastContext'
import { Button, IconButton } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/Overlay'
import { CheckIcon, CloseIcon } from '../../components/icons/Icons'
import { createProject, publishProject, uploadProjectFile } from '../../lib/content'
import { fromProject } from '../project/model/projectCardModel'
import FilesStep from './components/FilesStep'
import MediaPicker from './components/MediaPicker'
import ProjectDetailsStep, { CATEGORY_OPTIONS } from './components/ProjectDetailsStep'
import ProjectTypeStep from './components/ProjectTypeStep'
import PublishPreview from './components/PublishPreview'
import PublishStepper from './components/PublishStepper'
import { clearPublishDraft, DEFAULT_PUBLISH_DRAFT, hasMeaningfulPublishDraft, loadPublishDraft, savePublishDraft } from './publishDraft'
import './publish.css'

const STEP_COPY = {
  1: ['What are you creating?', 'Choose the format and orientation that best describe your project.'],
  2: ['Add project files', 'Select the complete playable build or creative asset and an optional cover.'],
  3: ['Project details', 'Add metadata so creators can find and understand your work.'],
  4: ['Review before publishing', 'Confirm the preview, files, and visibility before creating the project.'],
}

const isImageFile = (file) => /\.(png|jpg|jpeg|webp|gif|avif)$/i.test(file?.name || '')
const isVideoFile = (file) => /\.(mp4|webm|ogv|mov|m4v)$/i.test(file?.name || '')
const isModelFile = (file) => /\.(glb|gltf)$/i.test(file?.name || '')
const isHtmlFile = (file) => /\.html?$/i.test(file?.name || '')

async function detectImageMode(file) {
  if (!file || !isImageFile(file)) return null
  try {
    const bitmap = await createImageBitmap(file)
    const mode = bitmap.height > bitmap.width ? 'portrait' : 'landscape'
    bitmap.close()
    return mode
  } catch {
    return null
  }
}

function useObjectUrl(file) {
  const url = useMemo(() => file ? URL.createObjectURL(file) : '', [file])
  useEffect(() => { if (url) return () => URL.revokeObjectURL(url) }, [url])
  return url
}

function PublishTopBar({ onClose }) {
  return <div className="publish-top-bar"><span aria-hidden="true" /><div><h1>Publish project</h1><p>Create playable work and portfolio assets.</p></div><IconButton label="Close publish flow" onClick={onClose}><CloseIcon size={18} /></IconButton></div>
}

function ErrorSummary({ errors, summaryRef }) {
  const entries = Object.entries(errors)
  if (!entries.length) return null
  const targets = { type: 'project-type', assets: 'assets-picker', title: 'publish-title', category: 'publish-category', publish: 'publish-action' }
  return <section className="publish-error-summary" ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby="publish-error-title"><h2 id="publish-error-title">Check the following</h2><ul>{entries.map(([field, message]) => <li key={field}><a href={`#${targets[field] || 'publish-form'}`}>{message}</a></li>)}</ul></section>
}

export default function PublishPage() {
  const [restored] = useState(loadPublishDraft)
  const navigate = useNavigate()
  const { isGuest, token, user } = useAuth()
  const { setTopBar, clearTopBar, enterImmersiveMode, exitImmersiveMode } = useAppShell()
  const { error: showError } = useToast()
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState(() => restored ? { type: restored.type, mode: restored.mode, title: restored.title, category: restored.category, description: restored.description, tags: restored.tags, software: restored.software, visibility: restored.visibility } : DEFAULT_PUBLISH_DRAFT)
  const [assets, setAssets] = useState([])
  const [cover, setCover] = useState(null)
  const [gameplayGif, setGameplayGif] = useState(null)
  const [tagInput, setTagInput] = useState('')
  const [softwareInput, setSoftwareInput] = useState('')
  const [errors, setErrors] = useState({})
  const [recoveryVisible, setRecoveryVisible] = useState(Boolean(restored))
  const [guestPrompt, setGuestPrompt] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishStatus, setPublishStatus] = useState('')
  const [fileStatuses, setFileStatuses] = useState({})
  const [published, setPublished] = useState(null)
  const mutationRef = useRef(false)
  const serverProjectIdRef = useRef(null)
  const errorSummaryRef = useRef(null)

  const mainFile = useMemo(() => {
    if (draft.type === 'game') return assets.find((item) => isHtmlFile(item.file) && item.file.name.toLowerCase() === 'index.html') || assets.find((item) => isHtmlFile(item.file)) || assets[0] || null
    if (draft.type === '3d') return assets.find((item) => isModelFile(item.file) && item.file.name.toLowerCase().endsWith('.glb')) || assets.find((item) => isModelFile(item.file)) || assets[0] || null
    if (draft.type === 'video') return assets.find((item) => isVideoFile(item.file)) || assets.find((item) => isImageFile(item.file)) || assets[0] || null
    return assets.find((item) => isVideoFile(item.file)) || assets.find((item) => isImageFile(item.file)) || assets[0] || null
  }, [assets, draft.type])
  const isVideoMain = useMemo(() => isVideoFile(mainFile?.file), [mainFile])
  const mainUrl = useObjectUrl(draft.type === '2d' || draft.type === 'video' ? mainFile?.file || null : null)
  const coverUrl = useObjectUrl(cover?.file || null)

  const meaningful = hasMeaningfulPublishDraft(draft, { hadFiles: assets.length > 0 || Boolean(gameplayGif) || restored?.hadFiles, hadCover: Boolean(cover) || restored?.hadCover })

  const requestExit = useCallback(() => {
    if (meaningful && !published) setConfirmDiscard(true)
    else navigate('/app/profile')
  }, [meaningful, navigate, published])

  useEffect(() => {
    setTopBar(<PublishTopBar onClose={requestExit} />)
    enterImmersiveMode()
    return () => {
      clearTopBar()
      exitImmersiveMode()
    }
  }, [clearTopBar, enterImmersiveMode, exitImmersiveMode, requestExit, setTopBar])

  useEffect(() => {
    if (!meaningful || published) return
    savePublishDraft(draft, { hadFiles: assets.length > 0 || restored?.hadFiles, fileCount: assets.length || restored?.fileCount || 0, hadCover: Boolean(cover) || restored?.hadCover })
  }, [assets.length, cover, draft, meaningful, published, restored])

  useEffect(() => {
    const warnBeforeUnload = (event) => {
      if (!meaningful || published) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [meaningful, published])

  const invalidateServerDraft = () => {
    if (!serverProjectIdRef.current || mutationRef.current) return
    serverProjectIdRef.current = null
    setFileStatuses({})
    setPublishStatus('Project details changed. Publishing will create a fresh server draft.')
  }

  const changeDraft = (field, value) => {
    invalidateServerDraft()
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => { const next = { ...current }; delete next[field]; delete next.publish; return next })
  }

  const selectType = (type) => {
    invalidateServerDraft()
    const categories = CATEGORY_OPTIONS[type] || CATEGORY_OPTIONS.game
    if (type === 'video') setCover(null)
    if (type !== 'game') setGameplayGif(null)
    setDraft((current) => ({ ...current, type, category: categories[0], mode: type === '2d' ? 'portrait' : 'landscape' }))
    setErrors({})
  }

  const handleAssets = async (event) => {
    const selected = Array.from(event.target.files || []).map((file) => ({ file, relativePath: (file.webkitRelativePath || file.name).replace(/\\/g, '/') }))
    invalidateServerDraft()
    setAssets(selected)
    setRecoveryVisible(false)
    setErrors((current) => { const next = { ...current }; delete next.assets; return next })
    event.target.value = ''
    if (draft.type === '2d') {
      const detectedMode = await detectImageMode(selected.find(({ file }) => isImageFile(file))?.file)
      if (detectedMode) setDraft((current) => ({ ...current, mode: detectedMode }))
    }
  }

  const handleCover = async (event) => {
    const file = event.target.files?.[0]
    if (file) { invalidateServerDraft(); setCover({ file, relativePath: `cover/${file.name}` }); setRecoveryVisible(false) }
    event.target.value = ''
    const detectedMode = await detectImageMode(file)
    if (detectedMode) setDraft((current) => ({ ...current, mode: detectedMode }))
  }

  const handleGameplayGif = (event) => {
    const file = event.target.files?.[0]
    if (file) { invalidateServerDraft(); setGameplayGif({ file, relativePath: `gameplay/${file.name}` }); setRecoveryVisible(false) }
    event.target.value = ''
  }

  const removeAsset = (relativePath) => { invalidateServerDraft(); setAssets((current) => current.filter((item) => item.relativePath !== relativePath)) }
  const removeCover = () => { invalidateServerDraft(); setCover(null) }
  const removeGameplayGif = () => { invalidateServerDraft(); setGameplayGif(null) }

  const addToken = (field, input, reset) => {
    const value = input.trim().replace(field === 'tags' ? /^#/ : /^$/, '')
    if (value) { invalidateServerDraft(); setDraft((current) => current[field].includes(value) ? current : { ...current, [field]: [...current[field], value] }) }
    reset('')
  }
  const removeToken = (field, value) => { invalidateServerDraft(); setDraft((current) => ({ ...current, [field]: current[field].filter((item) => item !== value) })) }

  const validateStep = (targetStep) => {
    const next = {}
    if (targetStep === 1 && !draft.type) next.type = 'Choose a project type.'
    if (targetStep === 2 && !assets.length) next.assets = 'Select at least one project file.'
    if (targetStep === 3) {
      if (!draft.title.trim()) next.title = 'Add a project title.'
      if (!draft.category.trim()) next.category = 'Choose a category.'
    }
    setErrors(next)
    if (Object.keys(next).length) window.requestAnimationFrame(() => errorSummaryRef.current?.focus())
    return !Object.keys(next).length
  }

  const validateAll = () => {
    const next = {}
    if (!draft.type) next.type = 'Choose a project type.'
    if (!assets.length) next.assets = 'Select at least one project file.'
    if (!draft.title.trim()) next.title = 'Add a project title.'
    if (!draft.category.trim()) next.category = 'Choose a category.'
    setErrors(next)
    if (Object.keys(next).length) {
      setStep(next.type ? 1 : next.assets ? 2 : 3)
      window.requestAnimationFrame(() => errorSummaryRef.current?.focus())
      return false
    }
    return true
  }

  const nextStep = () => { if (validateStep(step)) setStep((current) => Math.min(4, current + 1)) }
  const previousStep = () => { setErrors({}); if (step === 1) requestExit(); else setStep((current) => current - 1) }

  const publish = async () => {
    if (mutationRef.current || publishing) return
    if (isGuest) { setGuestPrompt(true); return }
    if (!validateAll()) return
    mutationRef.current = true
    setPublishing(true)
    setGuestPrompt(false)
    setErrors({})
    try {
      let projectId = serverProjectIdRef.current
      if (!projectId) {
        setPublishStatus('Creating the project draft…')
        const created = await createProject(token, { title: draft.title.trim(), type: draft.type, category: draft.category.trim(), description: draft.description.trim(), tags: draft.tags, software: draft.software, visibility: draft.visibility, mode: draft.mode })
        projectId = created.project.id
        serverProjectIdRef.current = projectId
      }
      const queue = [cover, draft.type === 'game' ? gameplayGif : null, ...assets].filter(Boolean)
      for (let index = 0; index < queue.length; index += 1) {
        const item = queue[index]
        if (fileStatuses[item.relativePath]?.status === 'complete') continue
        setPublishStatus(`Uploading file ${index + 1} of ${queue.length}: ${item.file.name}`)
        setFileStatuses((current) => ({ ...current, [item.relativePath]: { status: 'uploading' } }))
        try {
          await uploadProjectFile(token, projectId, { name: item.file.name, relativePath: item.relativePath, mimeType: item.file.type || '' }, item.file)
          setFileStatuses((current) => ({ ...current, [item.relativePath]: { status: 'complete' } }))
        } catch (uploadError) {
          setFileStatuses((current) => ({ ...current, [item.relativePath]: { status: 'failed' } }))
          throw uploadError
        }
      }
      setPublishStatus('Finalizing the published project…')
      const result = await publishProject(token, projectId)
      clearPublishDraft()
      setPublished(result.project)
      setAssets([])
      setCover(null)
      setGameplayGif(null)
      setPublishStatus('')
      setStep(5)
      window.dispatchEvent(new CustomEvent('projectPublished', { detail: result.project }))
    } catch {
      setErrors({ publish: serverProjectIdRef.current ? 'Publishing paused. Retry to continue this server draft without re-uploading completed files.' : 'The project could not be created. Try publishing again.' })
      setPublishStatus('')
      showError('Project publishing paused. Your selected files and completed uploads are still tracked on this screen.')
      window.requestAnimationFrame(() => errorSummaryRef.current?.focus())
    } finally {
      mutationRef.current = false
      setPublishing(false)
    }
  }

  const discard = () => {
    clearPublishDraft()
    setAssets([])
    setCover(null)
    setGameplayGif(null)
    setConfirmDiscard(false)
    navigate('/app/profile')
  }

  const previewModel = useMemo(() => fromProject({
    id: 'publish-preview',
    title: draft.title.trim() || 'Untitled project',
    description: draft.description,
    type: isVideoMain ? 'video' : draft.type,
    category: draft.category,
    mode: draft.mode,
    previewUrl: coverUrl || (isVideoMain ? '' : mainUrl),
    videoUrl: isVideoMain ? mainUrl : '',
    imageUrl: isVideoMain ? coverUrl : (draft.type === '2d' ? mainUrl : coverUrl),
    software: draft.software,
    tags: draft.tags,
    ownerUsername: user?.username,
    ownerName: user?.name,
    ownerAvatar: user?.avatar,
  }), [coverUrl, draft, isVideoMain, mainUrl, user])

  const retryAvailable = Object.values(fileStatuses).some((item) => item.status === 'failed') || Boolean(errors.publish)
  const publishedId = published?.id || published?._id

  return <main className="publish-page" id="publish-form">
    <PublishStepper step={step} />
    <div className="publish-page__scroll">
      {recoveryVisible ? (
        <section className="publish-recovery" role="status">
          <div>
            <strong>Draft details restored</strong>
            <p>
              Your files were not saved — please reselect them before publishing.
            </p>
          </div>
          <button type="button" onClick={() => setRecoveryVisible(false)}>Dismiss</button>
        </section>
      ) : null}
      <ErrorSummary errors={errors} summaryRef={errorSummaryRef} />
      {step < 5 ? <section className="publish-card"><header><h2>{STEP_COPY[step][0]}</h2><p>{STEP_COPY[step][1]}</p></header><div className="publish-card__body">
        {step === 1 ? <ProjectTypeStep type={draft.type} mode={draft.mode} error={errors.type} onTypeChange={selectType} onModeChange={(mode) => changeDraft('mode', mode)} /> : null}
        {step === 2 ? <><MediaPicker type={draft.type} error={errors.assets} onAssetsChange={handleAssets} onCoverChange={handleCover} onGameplayGifChange={handleGameplayGif} /><FilesStep assets={assets} cover={cover} gameplayGif={draft.type === 'game' ? gameplayGif : null} showCover={draft.type !== 'video'} statuses={fileStatuses} onRemoveAsset={removeAsset} onRemoveCover={removeCover} onRemoveGameplayGif={removeGameplayGif} /></> : null}
        {step === 3 ? <ProjectDetailsStep draft={draft} errors={errors} tagInput={tagInput} softwareInput={softwareInput} onChange={changeDraft} onTagInputChange={setTagInput} onSoftwareInputChange={setSoftwareInput} onAddTag={() => addToken('tags', tagInput, setTagInput)} onAddSoftware={() => addToken('software', softwareInput, setSoftwareInput)} onRemoveTag={(value) => removeToken('tags', value)} onRemoveSoftware={(value) => removeToken('software', value)} /> : null}
        {step === 4 ? <PublishPreview model={previewModel} draft={draft} assets={assets} cover={cover} statuses={fileStatuses} publishStatus={publishStatus} onRetry={publish} retrying={publishing} /> : null}
      </div></section> : <section className="publish-success"><span className="publish-success__icon" aria-hidden="true"><CheckIcon size={28} color="currentColor" /></span><h2>Project published</h2><p><strong>{published?.title || draft.title}</strong> is live and ready to view or play.</p><div className="publish-success__actions">{publishedId ? <Button onClick={() => navigate(`/app/project/${encodeURIComponent(String(publishedId))}`)}>View project</Button> : null}<Button variant="secondary" onClick={() => navigate('/app/home')}>Go to Feed</Button></div></section>}
    </div>
    {step < 5 ? <footer className="publish-actions"><Button variant="secondary" disabled={publishing} onClick={previousStep}>Back</Button>{step < 4 ? <Button onClick={nextStep}>Continue</Button> : <Button id="publish-action" className="gradient-brand" loading={publishing} onClick={publish}>{retryAvailable ? 'Retry Publishing' : 'Publish Project'}</Button>}</footer> : null}
    {guestPrompt ? <div className="publish-guest-prompt" role="status">Sign in to publish projects.<Button onClick={() => navigate('/signin')}>Sign in</Button></div> : null}
    <ConfirmDialog open={confirmDiscard} title="Discard this publish draft?" message="Your saved metadata and current file selections will be cleared. Server drafts already created during a failed attempt cannot be deleted from this screen." confirmLabel="Discard draft" onConfirm={discard} onClose={() => setConfirmDiscard(false)} />
  </main>
}
