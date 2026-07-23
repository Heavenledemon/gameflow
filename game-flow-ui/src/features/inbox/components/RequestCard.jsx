import Avatar from '../../../components/ui/Avatar'
import MediaFrame from '../../../components/ui/MediaFrame'
import { Button } from '../../../components/ui/Button'
import { formatInboxTime } from '../inboxFormatters'

export default function RequestCard({ request, box, pending = false, onAction, onOpen }) {
  const incoming = box === 'incoming'
  const person = incoming ? request.requester : request.recipient
  const personName = person?.name || person?.username || 'Creator'
  const projectTitle = request.project?.title || 'Untitled project'
  const projectPoster = request.project?.thumbnail || request.project?.previewUrl || request.project?.imageUrl || null
  const requestLabel = request.initiatedBy === 'owner_invite' ? 'Project invitation' : 'Collaboration request'
  const canOpen = Boolean(request.conversationId)
  const canAct = request.status === 'pending'

  return (
    <article className="request-card" aria-busy={pending || undefined}>
      <div className="request-card__main">
        <MediaFrame
          className="request-card__media"
          aspectRatio="1/1"
          poster={projectPoster}
          alt=""
          fallback={projectTitle.slice(0, 1).toUpperCase()}
        />

        <div className="request-card__content">
          <div className="request-card__meta">
            <span className="request-card__type-badge">{requestLabel}</span>
            <time dateTime={request.updatedAt || request.createdAt}>
              {formatInboxTime(request.updatedAt || request.createdAt)}
            </time>
          </div>

          <h3 className="request-card__title">{projectTitle}</h3>

          <div className="request-card__person">
            <Avatar src={person?.avatar} alt="" name={personName} size="xs" />
            <p>
              {incoming ? (
                <>
                  <strong>{personName}</strong> requested the <b>{request.proposedRole || 'contributor'}</b> role.
                </>
              ) : (
                <>
                  Sent to <strong>{personName}</strong> for the <b>{request.proposedRole || 'contributor'}</b> role.
                </>
              )}
            </p>
          </div>

          {request.message ? <p className="request-card__message">“{request.message}”</p> : null}
        </div>
      </div>

      <footer className="request-card__footer">
        <span className={`request-card__status request-card__status--${request.status}`}>
          {request.status}
        </span>

        <div className="request-card__actions">
          {canOpen ? (
            <Button variant="ghost" disabled={pending} onClick={() => onOpen?.(request)}>
              Open chat
            </Button>
          ) : null}

          {canAct && incoming ? (
            <>
              <Button
                variant="primary"
                loading={pending}
                disabled={pending}
                onClick={() => onAction?.(request, 'accept')}
              >
                Accept
              </Button>
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() => onAction?.(request, 'decline')}
              >
                Decline
              </Button>
            </>
          ) : null}

          {canAct && !incoming ? (
            <Button
              variant="secondary"
              loading={pending}
              disabled={pending}
              onClick={() => onAction?.(request, 'cancel')}
            >
              Cancel request
            </Button>
          ) : null}
        </div>
      </footer>
    </article>
  )
}
