import { Button } from '../../../components/ui/Button'
import { Avatar } from '../../../components/ui/Surface'
import { Sheet } from '../../../components/ui/Overlay'

export default function ProjectWorkspace({ open, viewerRole, members, canManageMembers, canUseChat, viewerId, isOwner, memberActionId, openingWorkspace, onOpen, onClose, onOpenWorkspace, onRoleChange, onRemove }) {
  if (!viewerRole) return null

  return (
    <>
      <section className="project-panel project-workspace" aria-labelledby="workspace-title">
        <div><h2 id="workspace-title">Team workspace</h2><p>Your role: <strong>{viewerRole}</strong></p></div>
        <div className="project-workspace__actions">
          <Button variant="secondary" onClick={onOpen}>Team {members.status === 'ready' ? `(${members.items.length})` : ''}</Button>
          {canUseChat ? <Button loading={openingWorkspace} onClick={onOpenWorkspace}>Open project chat</Button> : <Button variant="secondary" disabled>Chat unavailable</Button>}
        </div>
      </section>

      <Sheet open={open} title="Project team" description={canManageMembers ? 'Manage member roles and project access.' : 'People collaborating on this project.'} onClose={onClose}>
        <div className="project-team">
          {members.status === 'loading' ? <p role="status">Loading project team…</p> : null}
          {members.status === 'error' ? <div role="alert"><p>{members.error}</p><Button variant="secondary" onClick={members.reload}>Try again</Button></div> : null}
          {members.status === 'ready' && !members.items.length ? <p>No active members were found.</p> : null}
          {members.items.map((member) => {
            const isWorking = memberActionId === member.userId
            const canEdit = canManageMembers && member.role !== 'owner' && !(String(member.userId) === String(viewerId) && !isOwner)
            const name = member.name || member.username || 'Creator'
            return (
              <article key={member.userId} className="project-team__member">
                <div className="project-team__identity"><Avatar src={member.avatar} alt="" name={name} size="medium" /><div><strong>{name}</strong><span>@{member.username || 'creator'} · Joined {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'recently'}</span></div><b>{member.role}</b></div>
                {canEdit ? <div className="project-team__controls"><label><span className="gf-sr-only">Change {member.username || 'member'} role</span><select value={member.role} disabled={isWorking} onChange={(event) => event.target.value !== member.role && onRoleChange(member, event.target.value)}><option value="editor">Editor</option><option value="contributor">Contributor</option><option value="viewer">Viewer</option></select></label><Button variant="danger" disabled={isWorking} onClick={() => onRemove(member)}>{isWorking ? 'Working…' : 'Remove'}</Button></div> : null}
              </article>
            )
          })}
        </div>
      </Sheet>
    </>
  )
}
