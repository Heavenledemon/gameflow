import { useCallback, useEffect, useRef, useState } from 'react'
import GltfAssetViewer from '../../../components/GltfAssetViewer'
import { Button } from '../../../components/ui/Button'
import { ErrorState } from '../../../components/ui/Feedback'
import { MediaFrame } from '../../../components/ui/MediaComponents'
import WebGLGamePlayer from '../../../components/WebGLGamePlayer'
import { useMediaVisibility } from '../../../hooks/useMediaVisibility'
import './ProjectMedia.css'

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ))

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = (event) => setPrefersReducedMotion(event.matches)
    query.addEventListener?.('change', updatePreference)
    return () => query.removeEventListener?.('change', updatePreference)
  }, [])

  return prefersReducedMotion
}

function mediaIdentity(media) {
  return [media?.kind, media?.gameUrl, media?.modelUrl, media?.videoUrl, media?.imageUrl, media?.posterUrl].join('|')
}

function MediaPoster({ media, title, actionLabel, onActivate, buttonRef, fallback }) {
  const posterUrl = media.posterUrl || media.imageUrl
  const [failedPosterUrl, setFailedPosterUrl] = useState('')
  const showPoster = Boolean(posterUrl && failedPosterUrl !== posterUrl)
  const action = onActivate ? (
    <div className="project-media__poster-action">
      <Button ref={buttonRef} onClick={onActivate}>{actionLabel}</Button>
    </div>
  ) : null

  return (
    <MediaFrame
      aspectRatio={media.aspectRatio || (media.mode === 'portrait' ? '9 / 16' : '16 / 9')}
      fit="contain"
      overlay={action}
      className="project-media__frame"
    >
      {showPoster ? (
        <img
          className="project-media__asset"
          src={posterUrl}
          alt={`${title} preview`}
          loading="lazy"
          decoding="async"
          onError={() => setFailedPosterUrl(posterUrl)}
        />
      ) : <div className="gf-media-frame__fallback">{fallback}</div>}
    </MediaFrame>
  )
}

/**
 * Poster-first renderer for the normalized `ProjectCardModel.media` contract.
 * It owns browser media activation/pausing and mounts heavy viewers only while
 * the parent marks this item active and the frame is visible.
 */
export default function ProjectMedia({
  media,
  title = 'Project media',
  active = true,
  interactive = true,
  allowAutoPreview = false,
  posterOnly = false,
  overlay,
  fallback = 'A preview is not available for this project.',
  className = '',
  onActivate,
  onDeactivate,
  onError,
  onFullscreenChange,
  onDoubleClick,
  activationRequested = false,
}) {
  const normalizedMedia = media ?? { kind: 'unknown' }
  const identity = mediaIdentity(normalizedMedia)
  const [activation, setActivation] = useState({ identity: '', active: false })
  const [failure, setFailure] = useState({ identity: '', message: '' })
  const [webglSession, setWebglSession] = useState({ identity: '', playing: false, stopSignal: 0 })
  const activationButtonRef = useRef(null)
  const videoRef = useRef(null)
  const { ref: visibilityRef, isVisible } = useMediaVisibility({ threshold: 0.15 })
  const prefersReducedMotion = usePrefersReducedMotion()
  const isActivated = activationRequested || (activation.identity === identity && activation.active)
  const errorMessage = failure.identity === identity ? failure.message : ''
  const webglPlaying = webglSession.identity === identity && webglSession.playing
  const webglStopSignal = webglSession.identity === identity ? webglSession.stopSignal : 0
  const canUseInteractiveMedia = Boolean(active && isVisible && interactive)
  const shouldAutoPreview = Boolean(allowAutoPreview && active && isVisible && !prefersReducedMotion)

  const reportError = useCallback((message, error) => {
    setFailure({ identity, message })
    onError?.(error ?? new Error(message))
  }, [identity, onError])
  const handleGltfError = useCallback((error) => {
    reportError('The 3D preview could not be loaded.', error)
  }, [reportError])
  const handleWebGLPlaybackChange = useCallback((playing) => {
    setWebglSession((current) => ({
      identity,
      playing,
      stopSignal: current.identity === identity ? current.stopSignal : 0,
    }))
    if (playing) onActivate?.()
    else onDeactivate?.()
  }, [identity, onActivate, onDeactivate])

  const exitWebGLControls = () => {
    setActivation({ identity, active: false })
    setWebglSession((current) => ({
      identity,
      playing: false,
      stopSignal: current.identity === identity ? current.stopSignal + 1 : 1,
    }))
    onDeactivate?.()
    window.requestAnimationFrame(() => activationButtonRef.current?.focus())
  }

  const activate = () => {
    setFailure({ identity: '', message: '' })
    setActivation({ identity, active: true })
    onActivate?.()
  }

  const deactivate = () => {
    setActivation({ identity, active: false })
    onDeactivate?.()
    window.requestAnimationFrame(() => activationButtonRef.current?.focus())
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined

    if (shouldAutoPreview) {
      video.muted = true
      video.play().catch(() => {})
    } else {
      video.pause()
    }
    return () => video.pause()
  }, [identity, shouldAutoPreview])

  let content
  if (posterOnly) {
    content = <MediaPoster media={normalizedMedia} title={title} fallback={fallback} />
  } else if (errorMessage) {
    content = (
      <MediaFrame aspectRatio={normalizedMedia.aspectRatio || '16 / 9'} className="project-media__frame">
        <ErrorState
          title="Preview unavailable"
          description={errorMessage}
          retryLabel="Try preview again"
          onRetry={() => {
            setFailure({ identity: '', message: '' })
            setActivation({ identity: '', active: false })
          }}
        />
      </MediaFrame>
    )
  } else if (normalizedMedia.kind === 'image') {
    const imageUrl = normalizedMedia.imageUrl || normalizedMedia.posterUrl
    content = imageUrl ? (
      <MediaFrame aspectRatio={normalizedMedia.aspectRatio || 'auto'} fit="contain" className="project-media__frame">
        <img
          className="project-media__asset"
          src={imageUrl}
          alt={title}
          loading="lazy"
          decoding="async"
          onError={(event) => reportError('The project image could not be loaded.', event)}
        />
      </MediaFrame>
    ) : <MediaPoster media={normalizedMedia} title={title} fallback={fallback} />
  } else if (normalizedMedia.kind === 'video') {
    content = normalizedMedia.videoUrl ? (
      <MediaFrame aspectRatio={normalizedMedia.aspectRatio || 'auto'} fit="contain" className="project-media__frame">
        <video
          ref={videoRef}
          className="project-media__asset"
          src={normalizedMedia.videoUrl}
          poster={normalizedMedia.posterUrl || undefined}
          controls
          playsInline
          muted={shouldAutoPreview}
          autoPlay={shouldAutoPreview}
          loop={shouldAutoPreview}
          preload={shouldAutoPreview ? 'auto' : 'metadata'}
          aria-label={`${title} video preview`}
          onError={(event) => reportError('The project video could not be loaded.', event)}
        />
      </MediaFrame>
    ) : <MediaPoster media={normalizedMedia} title={title} fallback={fallback} />
  } else if (normalizedMedia.kind === 'webgl') {
    content = isActivated && canUseInteractiveMedia && normalizedMedia.gameUrl ? (
      <WebGLGamePlayer
        gameUrl={normalizedMedia.gameUrl}
        title={title}
        mode={normalizedMedia.mode}
        thumbnailMode={normalizedMedia.thumbnailMode}
        aspectRatio={normalizedMedia.aspectRatio}
        loadingScreenUrl={normalizedMedia.posterUrl}
        isActive={active && isVisible}
        stopSignal={webglStopSignal}
        onPlaybackChange={handleWebGLPlaybackChange}
        onFullscreenChange={onFullscreenChange}
      />
    ) : (
      <div className="project-media__poster-focus">
        <MediaPoster
          media={normalizedMedia}
          title={title}
          fallback={normalizedMedia.gameUrl ? 'Open the playable preview when ready.' : fallback}
          actionLabel="Open playable preview"
          buttonRef={activationButtonRef}
          onActivate={normalizedMedia.gameUrl && canUseInteractiveMedia ? activate : undefined}
        />
      </div>
    )
  } else if (normalizedMedia.kind === 'gltf') {
    content = isActivated && canUseInteractiveMedia && normalizedMedia.modelUrl ? (
      <>
        <GltfAssetViewer
          modelUrl={normalizedMedia.modelUrl}
          assets={normalizedMedia.assets}
          textures={normalizedMedia.textures}
          title={title}
          mode={normalizedMedia.mode}
          background={normalizedMedia.background || '#101820'}
          isActive={active && isVisible}
          onError={handleGltfError}
          onFullscreenChange={onFullscreenChange}
        />
        <button type="button" className="project-media__exit" onClick={deactivate}>Exit 3D controls</button>
      </>
    ) : (
      <div className="project-media__poster-focus">
        <MediaPoster
          media={normalizedMedia}
          title={title}
          fallback={normalizedMedia.modelUrl ? 'Open the interactive 3D preview when ready.' : fallback}
          actionLabel="Open 3D preview"
          buttonRef={activationButtonRef}
          onActivate={normalizedMedia.modelUrl && canUseInteractiveMedia ? activate : undefined}
        />
      </div>
    )
  } else {
    content = <MediaPoster media={normalizedMedia} title={title} fallback={fallback} />
  }

  return (
    <section
      ref={visibilityRef}
      className={`project-media ${className}`.trim()}
      aria-label={`${title} media`}
      data-media-kind={normalizedMedia.kind || 'unknown'}
      data-media-active={active && isVisible ? 'true' : 'false'}
      onDoubleClick={onDoubleClick}
    >
      {content}
      {normalizedMedia.kind === 'webgl' && isActivated && canUseInteractiveMedia ? <button type="button" className="project-media__exit" onClick={exitWebGLControls}>{webglPlaying ? 'Exit game controls' : 'Close playable preview'}</button> : null}
      {overlay ? <div className="project-media__overlay">{overlay}</div> : null}
    </section>
  )
}
