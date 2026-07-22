import { Button } from '../../../components/ui/Button'

export default function CollaborationPanel({ isOwner, collaborationOpen, request, busy, onInvite, onRequest, onOpenRequest }) {
  if (isOwner) {
    return <section className="project-panel" aria-labelledby="collaboration-title"><h2 id="collaboration-title">Collaboration</h2><p>Invite someone you follow, or someone who follows you, to this project.</p><Button loading={busy} onClick={onInvite}>Choose a collaborator</Button></section>
  }
  if (request) {
    return <section className="project-panel" aria-labelledby="collaboration-title"><h2 id="collaboration-title">Collaboration request</h2><p>Your request has been sent. Track its current status in Inbox.</p>{request.conversationId ? <Button variant="secondary" onClick={onOpenRequest}>View request</Button> : null}</section>
  }
  if (!collaborationOpen) return null
  return <section className="project-panel" aria-labelledby="collaboration-title"><h2 id="collaboration-title">Collaborate on this project</h2><p>Ask the project owner to join as a contributor.</p><Button loading={busy} disabled={busy} onClick={onRequest}>Request to collaborate</Button></section>
}
