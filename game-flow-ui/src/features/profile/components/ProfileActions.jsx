import { useState } from 'react'
import { Button, IconButton } from '../../../components/ui/Button'
import { DotsIcon } from '../../../components/icons/Icons'

export function ProfileActions({
  capability = 'public',
  following = false,
  blocked = false,
  busy = false,
  onEdit,
  onFollow,
  onMessage,
  onCollaborate,
}) {
  if (capability === 'self') {
    return (
      <div className="profile-actions profile-actions--self">
        <Button className="profile-actions__edit-btn" variant="secondary" onClick={onEdit}>Edit Profile</Button>
      </div>
    )
  }

  return (
    <div className="profile-actions">
      {onFollow ? (
        <Button
          variant={following ? 'secondary' : 'primary'}
          disabled={blocked || busy}
          onClick={onFollow}
        >
          {following ? 'Following' : 'Follow'}
        </Button>
      ) : null}

      {onMessage ? (
        <Button
          variant="secondary"
          loading={busy}
          disabled={blocked || busy}
          onClick={onMessage}
        >
          {blocked ? 'Blocked' : 'Message'}
        </Button>
      ) : null}

      {onCollaborate ? (
        <Button
          variant="secondary"
          disabled={blocked || busy}
          onClick={onCollaborate}
        >
          Collaborate
        </Button>
      ) : null}
    </div>
  )
}

export function ProjectManagementMenu({ projectTitle, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`project-management ${open ? 'project-management--open' : ''}`}>
      <IconButton
        label={`Manage options for ${projectTitle}`}
        variant="light"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
      >
        <DotsIcon size={18} />
      </IconButton>

      {open ? (
        <div className="project-management__menu" role="menu" tabIndex={-1}>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onEdit?.()
            }}
          >
            Edit Project
          </button>
          <button
            type="button"
            role="menuitem"
            className="project-management__danger"
            onClick={() => {
              setOpen(false)
              onDelete?.()
            }}
          >
            Delete Project
          </button>
        </div>
      ) : null}
    </div>
  )
}
