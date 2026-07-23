import { ErrorState, Skeleton } from './Feedback'
import MediaFrame from './MediaFrame'

export { EmptyState, ErrorState, Skeleton } from './Feedback'
export { default as MediaFrame } from './MediaFrame'

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
