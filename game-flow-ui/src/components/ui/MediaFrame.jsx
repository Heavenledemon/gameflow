import Skeleton from './Skeleton'
import IconButton from './IconButton'
import './MediaFrame.css'

export default function MediaFrame({
  aspectRatio = '4/5',
  poster,
  alt = '',
  mediaKind = 'unknown',
  onActivate,
  loading = false,
  error = false,
  onRetry,
  badge = null,
  children,
  className = '',
  ...props
}) {
  const isInteractiveMedia = mediaKind === 'webgl' || mediaKind === 'gltf'

  // Map ratio strings for CSS aspect-ratio support
  const resolvedRatio = aspectRatio.replace(/\s+/g, '')

  return (
    <div
      className={`gf-media-frame ${className}`.trim()}
      style={{ aspectRatio: resolvedRatio }}
      {...props}
    >
      {/* Badge top-right */}
      {badge && <div className="gf-media-frame__badge">{badge}</div>}

      {/* Loading state */}
      {loading && (
        <div className="gf-media-frame__loading">
          <Skeleton variant="media" width="100%" height="100%" />
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="gf-media-frame__error" role="alert">
          <svg
            className="gf-media-frame__error-icon"
            aria-hidden="true"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="gf-media-frame__error-text">Could not load preview</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="gf-media-frame__retry-btn"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Normal / Poster State */}
      {!loading && !error && (
        <>
          {poster ? (
            <img src={poster} alt={alt} className="gf-media-frame__poster" />
          ) : (
            <div className="gf-media-frame__fallback">
              <span className="gf-media-frame__fallback-text">Preview unavailable</span>
            </div>
          )}

          {/* Children overlay slot (e.g. active renderers or UI overlays) */}
          {children && <div className="gf-media-frame__overlay">{children}</div>}

          {/* WebGL/GLTF Play button trigger overlay */}
          {isInteractiveMedia && onActivate && !children && (
            <div className="gf-media-frame__play-trigger">
              <IconButton
                label="Play and activate game viewer"
                onClick={onActivate}
                size="lg"
                variant="light"
                icon={
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                }
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
