import { ErrorState, Skeleton } from './Feedback'

export { EmptyState, ErrorState, Skeleton } from './Feedback'

export function MediaFrame({ aspectRatio = '1 / 1', fit = 'cover', radius = 'var(--gf-radius-md)', poster, posterAlt = '', fallback = 'Preview unavailable', overlay, className = '', children, ...props }) {
  const style = {
    '--gf-media-aspect-ratio': aspectRatio,
    '--gf-media-fit': fit,
    '--gf-media-radius': radius
  }

  return <div className={`gf-media-frame ${className}`.trim()} style={style} {...props}>
    {children || (poster ? <img className="gf-media-frame__media" src={poster} alt={posterAlt} /> : <div className="gf-media-frame__fallback">{fallback}</div>)}
    {overlay ? <div className="gf-media-frame__overlay">{overlay}</div> : null}
  </div>
}

export function MediaStage({ type, src, poster, alt, loading, error, onRetry }) {
  if (error) {
    return <ErrorState description="Failed to load media asset." onRetry={onRetry} />
  }

  if (loading) {
    return <Skeleton width="100%" height="100%" />
  }

  return (
    <MediaFrame aspectRatio="auto" fit="contain" poster={poster} posterAlt={alt} fallback="Media preview unavailable">
      {!src && !poster ? null : type === 'video' ? (
        <video src={src} poster={poster} controls playsInline className="gf-media-frame__media" />
      ) : (
        <img src={src || poster} alt={alt || 'Media stage content'} className="gf-media-frame__media" />
      )}
    </MediaFrame>
  )
}
