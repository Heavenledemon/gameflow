import { Avatar } from '../../../components/ui/Surface'
import { formatInboxTime } from '../inboxFormatters'

export default function ConversationListItem({ conversation, onOpen }) {
  const projectChat = conversation.kind === 'project'
  const identity = conversation.otherParticipant || conversation.participant || null
  const title = projectChat ? (conversation.project?.title || conversation.projectTitle || 'Project chat') : (identity?.name || identity?.username || conversation.title || 'Direct message')
  const context = projectChat ? 'Project workspace' : 'Private conversation'
  const avatar = projectChat ? (conversation.project?.thumbnail || conversation.project?.previewUrl) : identity?.avatar
  const unreadLabel = conversation.unreadCount ? `${conversation.unreadCount} unread messages` : 'Unread conversation'

  return <button className={conversation.isUnread ? 'conversation-row conversation-row--unread' : 'conversation-row'} type="button" onClick={() => onOpen(conversation)} aria-label={`${title}, ${context}${conversation.isUnread ? `, ${unreadLabel}` : ''}`}>
    <Avatar className="conversation-row__avatar" src={avatar} alt="" name={title} size="medium" />
    <span className="conversation-row__content">
      <span className="conversation-row__heading"><strong>{title}</strong><time dateTime={conversation.lastMessageAt}>{formatInboxTime(conversation.lastMessageAt)}</time></span>
      <span className="conversation-row__context">{context}</span>
      <span className="conversation-row__preview">{conversation.lastMessagePreview || 'No messages yet.'}</span>
    </span>
    {conversation.isUnread ? <span className="conversation-row__unread" aria-hidden="true" /> : null}
  </button>
}
