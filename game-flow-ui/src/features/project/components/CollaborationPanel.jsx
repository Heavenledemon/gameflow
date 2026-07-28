import Avatar from '../../../components/ui/Avatar'
import { Button } from '../../../components/ui/Button'
import { UsersIcon, UserPlusIcon } from '../../../components/icons/Icons'

export default function CollaborationPanel({
  isOwner,
  collaborationOpen,
  request,
  busy,
  members = [],
  openRoles = [],
  onInvite,
  onRequest,
  onOpenRequest,
}) {
  const teamMembers = members || []

  return (
    <section className="project-panel project-collaboration-panel" aria-labelledby="collaboration-title">
      <div className="project-collaboration-panel__header">
        <UsersIcon size={20} />
        <h2 id="collaboration-title">Project Collaboration</h2>
      </div>

      {/* Team Avatars & Open Seats Row */}
      {teamMembers.length > 0 && (
        <div className="project-collaboration-panel__team">
          <span className="project-collaboration-panel__label">Team Members</span>
          <div className="project-collaboration-panel__avatars">
            {teamMembers.map((member) => (
              <Avatar
                key={member.userId || member.username}
                src={member.avatar}
                alt={member.name || member.username}
                name={member.name || member.username}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}

      {openRoles.length > 0 && (
        <div className="project-collaboration-panel__roles">
          <span className="project-collaboration-panel__label">Open Roles</span>
          <p>{openRoles.join(', ')}</p>
        </div>
      )}

      {isOwner ? (
        <div className="project-collaboration-panel__action">
          <p>Invite someone you follow, or someone who follows you, to collaborate.</p>
          <Button loading={busy} onClick={onInvite}>
            <UserPlusIcon size={16} />
            <span>Choose a collaborator</span>
          </Button>
        </div>
      ) : request ? (
        <div className="project-collaboration-panel__action">
          <p>Your collaboration request has been sent. Track its status in Inbox.</p>
          {request.conversationId ? (
            <Button variant="secondary" onClick={onOpenRequest}>
              View request status
            </Button>
          ) : null}
        </div>
      ) : collaborationOpen ? (
        <div className="project-collaboration-panel__action">
          <p>This project is actively accepting new team collaborators.</p>
          <Button loading={busy} disabled={busy} onClick={onRequest}>
            <UserPlusIcon size={16} />
            <span>Request to collaborate</span>
          </Button>
        </div>
      ) : (
        <p className="project-collaboration-panel__closed">Collaboration is currently closed for this project.</p>
      )}
    </section>
  )
}
